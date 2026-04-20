/**
 * referral-store.ts
 * Per-user referral system — strictly isolated by userId (no data leakage).
 *
 * Flow:
 *  1. Referrer opens their ReferralCard → ensureReferralIndex() registers code→userId mapping
 *  2. Invitee follows link /auth/register?role=provider&ref=HORMANG-XXXXXX
 *  3. After OTP verified → recordReferralSignup(code, newUserId)
 *  4. After provider profile saved → processReferralReward(newUserId)
 *     → awards 3 Tanga to referrer, updates their stats
 */
import { addTangaBalance } from "./tanga-store";
import { recordTangaTransaction } from "./tanga-history-store";
import { emitStoreChange } from "./store-events";

export const TANGA_PER_REFERRAL = 3;
export const MAX_REFERRALS = 5;
export const MAX_REFERRAL_TANGA = TANGA_PER_REFERRAL * MAX_REFERRALS; // 15

export interface ReferralInvitee {
  userId: string;
  completedAt: string;
}

export interface ReferralStats {
  count: number;
  earned: number;
  invitees: ReferralInvitee[];
}

/* ─── Code helpers ────────────────────────────────────────────────── */

/** Deterministic referral code derived from userId (no storage needed). */
export function getReferralCode(userId: string): string {
  return `HORMANG-${userId.slice(0, 6).toUpperCase()}`;
}

/** Full referral link directing the invitee to provider registration. */
export function getReferralLink(userId: string): string {
  const code = getReferralCode(userId);
  return `${window.location.origin}/auth/register?role=provider&ref=${code}`;
}

/* ─── Per-user stats storage ──────────────────────────────────────── */

function statsKey(userId: string): string {
  return `hormang_referral_${userId}`;
}

export function getReferralStats(userId: string): ReferralStats {
  if (!userId) return { count: 0, earned: 0, invitees: [] };
  try {
    const raw = localStorage.getItem(statsKey(userId));
    if (raw) return JSON.parse(raw) as ReferralStats;
  } catch {}
  return { count: 0, earned: 0, invitees: [] };
}

function saveReferralStats(userId: string, stats: ReferralStats): void {
  localStorage.setItem(statsKey(userId), JSON.stringify(stats));
  emitStoreChange();
}

/* ─── Index: code → referrerId ────────────────────────────────────── */

/**
 * Register the code → userId mapping in localStorage.
 * Must be called whenever the referral card/link is displayed so that
 * processReferralReward() can look up the referrer.
 */
export function ensureReferralIndex(userId: string): void {
  if (!userId) return;
  const code = getReferralCode(userId);
  localStorage.setItem(`hormang_ref_code_${code}`, userId);
}

/* ─── Registration hooks ──────────────────────────────────────────── */

/** Called immediately after a new user registers via a referral link. */
export function recordReferralSignup(refCode: string, newUserId: string): void {
  if (!refCode || !newUserId) return;
  localStorage.setItem(`hormang_ref_pending_${newUserId}`, refCode);
  console.log(`[Hormang] 🔗 Referral qayd etildi: code=${refCode} → userId=${newUserId}`);
}

/**
 * Called when an invited user completes their provider profile.
 * Awards TANGA_PER_REFERRAL Tanga to the referrer (capped at MAX_REFERRALS).
 */
export function processReferralReward(newUserId: string): void {
  if (!newUserId) return;

  const pendingKey = `hormang_ref_pending_${newUserId}`;
  const code = localStorage.getItem(pendingKey);
  if (!code) return;

  const referrerId = localStorage.getItem(`hormang_ref_code_${code}`);
  if (!referrerId || referrerId === newUserId) {
    localStorage.removeItem(pendingKey);
    return;
  }

  const stats = getReferralStats(referrerId);

  if (stats.count >= MAX_REFERRALS) {
    console.log(`[Hormang] ⚠️ Referral chegarasi to'ldi: ${referrerId}`);
    localStorage.removeItem(pendingKey);
    return;
  }

  if (stats.invitees.some((inv) => inv.userId === newUserId)) {
    localStorage.removeItem(pendingKey);
    return;
  }

  addTangaBalance(referrerId, TANGA_PER_REFERRAL);

  recordTangaTransaction({
    userId: referrerId,
    offerId: "",
    requestId: "",
    categoryName: "Do'stni taklif qilish mukofoti",
    categoryEmoji: "🎁",
    description: `Yangi ijrochi taklif uchun +${TANGA_PER_REFERRAL} Tanga`,
    amount: TANGA_PER_REFERRAL,
    type: "referral",
  });

  saveReferralStats(referrerId, {
    count: stats.count + 1,
    earned: stats.earned + TANGA_PER_REFERRAL,
    invitees: [
      ...stats.invitees,
      { userId: newUserId, completedAt: new Date().toISOString() },
    ],
  });

  localStorage.removeItem(pendingKey);
  console.log(`[Hormang] 🎉 Referral mukofot berildi: ${referrerId} ← ${newUserId} (+${TANGA_PER_REFERRAL} Tanga)`);
}
