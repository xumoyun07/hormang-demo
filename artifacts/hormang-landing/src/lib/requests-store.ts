/**
 * requests-store.ts
 * localStorage persistence for customer requests, offers, and chats.
 *
 * Keys:
 *   hormang_requests  — CustomerRequest[]
 *   hormang_offers    — Offer[]            (shared with provider side)
 *   hormang_chats     — Chat[]             (shared with provider side)
 */

import { emitStoreChange } from "./store-events";
import { incrementCompletedCount } from "./completion-store";
import { addTangaBalance, spendTangaBalance } from "./tanga-store";
import { recordTangaTransaction } from "./tanga-history-store";
import { calculateOfferCost } from "./offer-cost";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface CustomerRequest {
  id: string;
  customerId?: string;       // The user.id of the customer who created this request
  customerName?: string;     // Display name of the customer (shown on provider side)
  categoryId: string;
  categoryName: string;
  emoji: string;
  answers: Record<string, unknown>;
  /** Dedicated multi-photo upload (up to 10 images, stored as base64) */
  requestPhotos?: string[];
  status: "open" | "accepted" | "matched" | "completed" | "cancelled";
  createdAt: string;
  offerCount: number;
  region?: string;
  district?: string;
  /** Set when a customer accepts an offer — locks request to new offers. */
  acceptedOfferId?: string;
  /** Hard switch: once true, no new offers may be created on this request. */
  closedForOffers?: boolean;
}

export type OfferStatus =
  | "pending"
  | "negotiating"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired"
  | "in_progress"
  | "completed"
  | "closed_by_match";

export interface Offer {
  id: string;
  requestId: string;
  masterId: string;
  masterName: string;
  masterInitials: string;
  masterColor: string;
  price: number;
  priceLabel?: string;
  message: string;
  completionTime?: string;
  startDate?: string;
  fileUrls?: string[];
  avgResponseTime: number; // minutes
  createdAt: string;
  status: OfferStatus;
  /** Tanga deducted from the provider when this offer was submitted. */
  tangaSpent?: number;
  /** true once admin has issued a batch 50% refund that included this offer. */
  refunded?: boolean;
  /** Two-party completion flags — both must be true before status → "completed" */
  providerConfirmedCompleted?: boolean;
  customerConfirmedCompleted?: boolean;
}

/* ─── Offer Limit Constants ──────────────────────────────────────── */
export const MAX_ACTIVE_OFFERS = 5;
export const MAX_LIFETIME_OFFERS = 10;
const ACTIVE_STATUSES: OfferStatus[] = ["pending", "negotiating", "accepted"];

export interface ChatAttachment {
  type: "image" | "file";
  url: string;      // base64 data URL or object URL
  name?: string;    // original filename
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "master" | "system"; // master = provider/ijrochi; system = automated notification
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
}

/**
 * Unified chat format — shared by customer and provider sides.
 * Both sides read/write to hormang_chats using this structure.
 * ID is deterministic: `${requestId}_${masterId}`
 */
export interface Chat {
  id: string;
  requestId: string;
  masterId: string;
  masterName: string;
  masterInitials: string;
  masterColor: string;
  avgResponseTime: number;
  categoryName: string;
  categoryEmoji: string;      // shown on provider side
  customerName: string;       // shown on provider side
  customerInitials: string;   // shown on provider side
  customerColor: string;      // shown on provider side
  providerUnread: number;     // messages customer sent that provider hasn't read
  messages: ChatMessage[];
  createdAt: string;
}

/* ─── Storage Keys ───────────────────────────────────────────────── */

const REQUESTS_KEY = "hormang_requests";
const OFFERS_KEY = "hormang_offers";
const CHATS_KEY = "hormang_chats";
const CUSTOMER_REGISTRY_KEY = "hormang_customer_registry";

/* ─── Customer Name Registry ─────────────────────────────────────── */
/**
 * A lightweight userId → { name, initials } map written to localStorage
 * whenever a user logs in. Providers use this to show real customer names
 * on requests and chats without a server round-trip.
 */
interface CustomerEntry { name: string; initials: string }

export function saveCustomerToRegistry(userId: string, name: string, initials: string): void {
  if (!userId || !name) return;
  const reg = readJSON<Record<string, CustomerEntry>>(CUSTOMER_REGISTRY_KEY, {});
  reg[userId] = { name, initials };
  localStorage.setItem(CUSTOMER_REGISTRY_KEY, JSON.stringify(reg));
}

export function getCustomerFromRegistry(userId: string): CustomerEntry | null {
  if (!userId) return null;
  const reg = readJSON<Record<string, CustomerEntry>>(CUSTOMER_REGISTRY_KEY, {});
  return reg[userId] ?? null;
}

/* ─── Phone Registry ─────────────────────────────────────────────── */
/**
 * A userId → phone map written to localStorage on every login.
 * Works for both customers and providers so the admin panel can
 * display phone numbers without a server round-trip.
 */
const PHONE_REGISTRY_KEY = "hormang_phone_registry";

export function savePhoneToRegistry(userId: string, phone: string | null | undefined): void {
  if (!userId || !phone) return;
  const reg = readJSON<Record<string, string>>(PHONE_REGISTRY_KEY, {});
  reg[userId] = phone;
  localStorage.setItem(PHONE_REGISTRY_KEY, JSON.stringify(reg));
}

export function getPhoneRegistry(): Record<string, string> {
  return readJSON<Record<string, string>>(PHONE_REGISTRY_KEY, {});
}

/** Category emoji map */
const CATEGORY_EMOJIS: Record<string, string> = {
  tamirlash: "🔧", tozalash: "🧹", avto: "🚗", kochirish: "🚚",
  repetitor: "📚", tadbir: "🎉", gozallik: "💄", enaga: "👶", ustachilik: "🏗️",
};

/* ─── Storage helpers ─────────────────────────────────────────────── */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (_) { /* ignore */ }
  return fallback;
}

function writeJSON<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("[Hormang] localStorage quota exceeded for key:", key);
      throw new Error("Xotira to'ldi. Iltimos, ba'zi eski ma'lumotlarni o'chiring.");
    }
    throw e;
  }
  emitStoreChange();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ─── Requests ───────────────────────────────────────────────────── */

export function getRequests(): CustomerRequest[] {
  return readJSON<CustomerRequest[]>(REQUESTS_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getRequestById(id: string): CustomerRequest | undefined {
  return getRequests().find((r) => r.id === id);
}

export function saveNewRequest(
  categoryId: string,
  categoryName: string,
  answers: Record<string, unknown>,
  location?: { region?: string; district?: string },
  customerId?: string,
  customerName?: string,
  requestPhotos?: string[],
): CustomerRequest {
  let region = location?.region || (answers["region"] as string | undefined);
  let district = location?.district || (answers["district"] as string | undefined);
  // Parse new unified location answer (type: "location" question)
  const locAnswer = answers["location"];
  if (locAnswer && typeof locAnswer === "object" && !Array.isArray(locAnswer)) {
    const loc = locAnswer as { region?: string; district?: string };
    if (loc.region) { region = loc.region; district = loc.district; }
  }

  const req: CustomerRequest = {
    id: uid(),
    customerId: customerId || undefined,
    customerName: customerName || undefined,
    categoryId,
    categoryName,
    emoji: CATEGORY_EMOJIS[categoryId] ?? "📋",
    answers,
    requestPhotos: requestPhotos?.length ? requestPhotos : undefined,
    status: "open",
    createdAt: new Date().toISOString(),
    offerCount: 0,
    region: region || undefined,
    district: district || undefined,
  };
  const existing = readJSON<CustomerRequest[]>(REQUESTS_KEY, []);
  writeJSON(REQUESTS_KEY, [req, ...existing]);
  return req;
}

export function updateRequestStatus(requestId: string, status: CustomerRequest["status"]): void {
  const reqs = readJSON<CustomerRequest[]>(REQUESTS_KEY, []);
  writeJSON(REQUESTS_KEY, reqs.map((r) => r.id === requestId ? { ...r, status } : r));
}

/* ─── Customer-scoped helpers ────────────────────────────────────── */

/** Only requests created by this customer (strict isolation). */
export function getRequestsByCustomer(customerId: string): CustomerRequest[] {
  if (!customerId) return [];
  return getRequests().filter((r) => r.customerId === customerId);
}

/**
 * Only offers received on this customer's own requests.
 * Derives the set from their request IDs.
 */
export function getOffersByCustomer(customerId: string): Offer[] {
  if (!customerId) return [];
  const myRequestIds = new Set(getRequestsByCustomer(customerId).map((r) => r.id));
  return getOffers().filter((o) => myRequestIds.has(o.requestId));
}

/**
 * Only chats that belong to this customer's own requests.
 * Derives the set from their request IDs.
 */
export function getChatsByCustomer(customerId: string): Chat[] {
  if (!customerId) return [];
  const myRequestIds = new Set(getRequestsByCustomer(customerId).map((r) => r.id));
  return getChats().filter((c) => myRequestIds.has(c.requestId));
}

/* ─── Offers ─────────────────────────────────────────────────────── */

export function getOffers(): Offer[] {
  return readJSON<Offer[]>(OFFERS_KEY, []);
}

export function getOffersByRequestId(requestId: string): Offer[] {
  return getOffers().filter((o) => o.requestId === requestId);
}

/** Find the single offer for a chat (by requestId + masterId) */
export function getOfferForChat(requestId: string, masterId: string): Offer | undefined {
  return getOffers().find((o) => o.requestId === requestId && o.masterId === masterId);
}

export function getOfferById(offerId: string): Offer | undefined {
  return getOffers().find((o) => o.id === offerId);
}

/* ─── Offer Limiting System ──────────────────────────────────────── */

/**
 * Counts active and lifetime offers for a request.
 *  - active = pending | negotiating | accepted
 *  - total  = every offer ever created on this request
 */
export function getRequestCounts(requestId: string): { active: number; total: number } {
  const all = getOffersByRequestId(requestId);
  const active = all.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  return { active, total: all.length };
}

export type CanSubmitOfferReason =
  | "no_request"
  | "request_closed"
  | "matched"
  | "active_limit"
  | "lifetime_limit"
  | "already_offered";

/**
 * Single source of truth for "may this provider submit an offer on this request?".
 * Called BEFORE Tanga deduction so balance is never spent on a blocked submission.
 */
export function canSubmitOffer(
  requestId: string,
  providerId: string,
): { ok: boolean; reason?: CanSubmitOfferReason; active: number; total: number } {
  const req = getRequestById(requestId);
  const { active, total } = getRequestCounts(requestId);
  if (!req) return { ok: false, reason: "no_request", active, total };
  if (req.closedForOffers || req.acceptedOfferId || req.status === "matched")
    return { ok: false, reason: "matched", active, total };
  if (req.status !== "open") return { ok: false, reason: "request_closed", active, total };
  if (total >= MAX_LIFETIME_OFFERS) return { ok: false, reason: "lifetime_limit", active, total };
  if (active >= MAX_ACTIVE_OFFERS) return { ok: false, reason: "active_limit", active, total };
  if (providerId) {
    const dup = getOffersByRequestId(requestId).some(
      (o) => o.masterId === providerId && ACTIVE_STATUSES.includes(o.status),
    );
    if (dup) return { ok: false, reason: "already_offered", active, total };
  }
  return { ok: true, active, total };
}

/** Human-readable Uzbek label for a `canSubmitOffer` failure reason. */
export function offerBlockLabel(reason: CanSubmitOfferReason | undefined): string {
  switch (reason) {
    case "matched":          return "Mijoz boshqa ijrochi taklifini qabul qilgan";
    case "active_limit":     return "5 ta faol taklif mavjud";
    case "lifetime_limit":   return "Takliflar limiti tugagan";
    case "request_closed":   return "So'rov yopilgan";
    case "already_offered":  return "Siz allaqachon taklif yuborgansiz";
    case "no_request":       return "So'rov topilmadi";
    default:                 return "Taklif yuborib bo'lmaydi";
  }
}

/** Set offer status to in_progress (when provider schedules the work) */
export function markOfferInProgress(offerId: string): void {
  const allOffers = getOffers();
  const target = allOffers.find((o) => o.id === offerId);
  if (!target || target.status !== "accepted") return;
  writeJSON(OFFERS_KEY, allOffers.map((o) => o.id === offerId ? { ...o, status: "in_progress" as const } : o));
  emitStoreChange();
}

/**
 * Force-complete an offer (admin / direct use). Sets both confirmation flags and
 * immediately finalises. Returns true if newly completed, false if already was.
 */
export function markOfferCompleted(offerId: string): boolean {
  const allOffers = getOffers();
  const target = allOffers.find((o) => o.id === offerId);
  if (!target) return false;
  if (target.status === "completed") return false;

  writeJSON(
    OFFERS_KEY,
    allOffers.map((o) =>
      o.id === offerId
        ? { ...o, status: "completed" as const, providerConfirmedCompleted: true, customerConfirmedCompleted: true }
        : o
    )
  );

  const request = getRequestById(target.requestId);
  if (request) {
    updateRequestStatus(target.requestId, "completed");
    if (request.customerId) incrementCompletedCount(request.customerId, "customer");
  }
  incrementCompletedCount(target.masterId, "provider");

  sendSystemMessage(`${target.requestId}_${target.masterId}`, "✅ Xizmat yakunlandi! Hamkorlik uchun rahmat.");
  return true;
}

/**
 * Dual-party completion: both provider AND customer must confirm before the
 * offer is officially marked "completed" and counters are incremented.
 *
 * - Sets the caller's confirmation flag on the offer.
 * - If both flags are now set → finalises (status → "completed", increments
 *   completed counts for both parties, sends a success system message).
 * - If only one party has confirmed → saves the flag and sends a waiting
 *   system message. Returns "waiting".
 *
 * Returns "completed" when fully finalised, "waiting" otherwise.
 */
export function confirmCompletion(
  offerId: string,
  role: "provider" | "customer"
): "completed" | "waiting" {
  const allOffers = getOffers();
  const target = allOffers.find((o) => o.id === offerId);
  if (!target) return "waiting";
  if (target.status === "completed") return "completed";

  const updated: Offer = {
    ...target,
    providerConfirmedCompleted: role === "provider" ? true : target.providerConfirmedCompleted,
    customerConfirmedCompleted: role === "customer" ? true : target.customerConfirmedCompleted,
  };

  if (updated.providerConfirmedCompleted && updated.customerConfirmedCompleted) {
    writeJSON(
      OFFERS_KEY,
      allOffers.map((o) =>
        o.id === offerId ? { ...updated, status: "completed" as const } : o
      )
    );
    const request = getRequestById(target.requestId);
    if (request) {
      updateRequestStatus(target.requestId, "completed");
      if (request.customerId) incrementCompletedCount(request.customerId, "customer");
    }
    incrementCompletedCount(target.masterId, "provider");
    sendSystemMessage(
      `${target.requestId}_${target.masterId}`,
      "✅ Xizmat yakunlandi! Hamkorlik uchun rahmat."
    );
    emitStoreChange();
    return "completed";
  }

  writeJSON(OFFERS_KEY, allOffers.map((o) => (o.id === offerId ? updated : o)));
  const waitingMsg =
    role === "provider"
      ? "⏳ Ijrochi xizmat yakunlanganligini tasdiqladi. Mijoz tasdig'i kutilmoqda."
      : "⏳ Mijoz xizmat yakunlanganligini tasdiqladi. Ijrochi tasdig'i kutilmoqda.";
  sendSystemMessage(`${target.requestId}_${target.masterId}`, waitingMsg);
  emitStoreChange();
  return "waiting";
}

/**
 * Refund the Tanga an offer originally cost back to its provider, and record
 * a transaction. Idempotent per (offerId, reason): a "refund-applied" marker
 * is written so a second call is a no-op.
 */
function refundOfferToProvider(
  offer: Offer,
  request: CustomerRequest | undefined,
  reason: "rejected" | "request_deleted" | "request_cancelled",
): void {
  if (!offer.masterId) return;
  const flagKey = `hormang_offer_refunded_${offer.id}`;
  if (localStorage.getItem(flagKey)) return;

  const cost = request
    ? calculateOfferCost({ categoryId: request.categoryId, answers: request.answers as Record<string, unknown> | undefined })
    : 2;

  addTangaBalance(offer.masterId, cost);
  recordTangaTransaction({
    userId: offer.masterId,
    offerId: offer.id,
    requestId: offer.requestId,
    categoryName: request?.categoryName ?? "",
    categoryEmoji: request?.emoji ?? "↩️",
    description:
      reason === "rejected"
        ? "Taklif rad etildi — Tanga qaytarildi"
        : reason === "request_deleted"
          ? "So'rov o'chirildi — Tanga qaytarildi"
          : "So'rov bekor qilindi — Tanga qaytarildi",
    amount: cost,
    type: "refund",
    direction: "in",
  });
  localStorage.setItem(flagKey, new Date().toISOString());
  console.log(`[Hormang] 💰 Refund: +${cost} Tanga → provider=${offer.masterId.slice(0,8)} offer=${offer.id} (${reason})`);
}

export function updateOfferStatus(offerId: string, status: "accepted" | "rejected"): void {
  const allOffers = getOffers();
  const target = allOffers.find((o) => o.id === offerId);
  if (!target) return;

  // Mark the target offer with the new status. When accepted, also flip every
  // sibling active offer on the same request to "closed_by_match" so providers
  // see a clear, distinct status rather than a rejection.
  let updated: Offer[] = allOffers.map((o) => {
    if (o.id === offerId) return { ...o, status };
    if (
      status === "accepted" &&
      o.requestId === target.requestId &&
      ACTIVE_STATUSES.includes(o.status)
    ) {
      return { ...o, status: "closed_by_match" as const };
    }
    return o;
  });

  writeJSON(OFFERS_KEY, updated);
  console.log(`[Hormang] ✅ Offer ${status === "accepted" ? "qabul qilindi" : "rad etildi"}`, { offerId, status });

  // When the customer accepts, lock the request: status → matched, mark
  // acceptedOfferId, and set closedForOffers so no new offers can be created.
  if (status === "accepted") {
    const reqs = readJSON<CustomerRequest[]>(REQUESTS_KEY, []);
    const lockedReqs = reqs.map((r) =>
      r.id === target.requestId
        ? { ...r, status: "matched" as const, acceptedOfferId: offerId, closedForOffers: true }
        : r
    );
    writeJSON(REQUESTS_KEY, lockedReqs);
  }

  // Inject a timeline system message into the offer's own chat
  if (target) {
    const chatId = `${target.requestId}_${target.masterId}`;
    const text =
      status === "accepted"
        ? "Taklif qabul qilindi — Suhbat davom etmoqda"
        : "Taklif rad etildi. Suhbat yopildi.";
    sendSystemMessage(chatId, text);
  }

  // When an offer is accepted, also notify sibling providers via system message
  if (status === "accepted") {
    const siblings = allOffers.filter(
      (o) => o.requestId === target.requestId && o.id !== offerId
    );
    for (const sib of siblings) {
      sendSystemMessage(
        `${sib.requestId}_${sib.masterId}`,
        "Mijoz boshqa ijrochi taklifini qabul qildi"
      );
    }
  }

  emitStoreChange();
}

/**
 * Re-open a previously rejected offer (only when the request is still open
 * and no other offer has been accepted).
 * Since there are no automatic rejection refunds, no Tanga movement is needed
 * on reopen — the original spend remains as-is.
 */
export function reopenOffer(
  offerId: string,
): { ok: boolean; reason?: "not_found" | "not_rejected" | "no_request" | "request_closed" | "already_accepted" } {
  const allOffers = getOffers();
  const target = allOffers.find((o) => o.id === offerId);
  if (!target) return { ok: false, reason: "not_found" };
  if (target.status !== "rejected") return { ok: false, reason: "not_rejected" };

  const req = getRequestById(target.requestId);
  if (!req) return { ok: false, reason: "no_request" };
  if (req.status !== "open") return { ok: false, reason: "request_closed" };
  if (allOffers.some((o) => o.requestId === target.requestId && o.status === "accepted")) {
    return { ok: false, reason: "already_accepted" };
  }

  const updated = allOffers.map((o) => o.id === offerId ? { ...o, status: "pending" as const } : o);
  writeJSON(OFFERS_KEY, updated);
  emitStoreChange();
  return { ok: true };
}

/* ─── Admin Refund System ────────────────────────────────────────── */

/**
 * Returns the last 10 offers submitted by a provider, sorted newest-first,
 * and checks whether all 10 are rejected and not yet refunded.
 */
export function getLast10RejectedEligibility(providerId: string): {
  offers: Offer[];
  eligible: boolean;
  totalSpent: number;
  refundAmount: number;
} {
  const allOffers = getOffers();
  const providerOffers = allOffers
    .filter((o) => o.masterId === providerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const eligible =
    providerOffers.length === 10 &&
    providerOffers.every((o) => o.status === "rejected" && !o.refunded);

  const totalSpent = providerOffers.reduce((sum, o) => sum + (o.tangaSpent ?? 0), 0);
  const refundAmount = Math.floor(totalSpent * 0.5);

  return { offers: providerOffers, eligible, totalSpent, refundAmount };
}

/**
 * Admin-triggered 50% refund for a provider whose last 10 offers are all rejected.
 * Marks every offer as `refunded: true` to prevent double-payment.
 */
export function adminRefundProvider(
  adminId: string,
  providerId: string,
): { ok: boolean; refundAmount?: number; reason?: string } {
  const { offers, eligible, refundAmount } = getLast10RejectedEligibility(providerId);
  if (!eligible) return { ok: false, reason: "not_eligible" };
  if (refundAmount <= 0) return { ok: false, reason: "zero_refund" };

  // Mark all 10 offers as refunded so this action cannot be repeated.
  const allOffers = getOffers();
  const offerIds = new Set(offers.map((o) => o.id));
  writeJSON(OFFERS_KEY, allOffers.map((o) => offerIds.has(o.id) ? { ...o, refunded: true } : o));

  // Credit the provider.
  addTangaBalance(providerId, refundAmount);

  // Record transaction.
  recordTangaTransaction({
    userId: providerId,
    offerId: "",
    requestId: "",
    categoryName: "Admin qaytarish",
    categoryEmoji: "↩️",
    description: `So'nggi 10 rad etilgan taklif uchun 50% qaytarish — ${refundAmount} Tanga (admin: ${adminId})`,
    amount: refundAmount,
    type: "refund",
    direction: "in",
  });

  emitStoreChange();
  console.log(`[Hormang] 💰 Admin refund: +${refundAmount} Tanga → provider=${providerId.slice(0, 8)} by admin=${adminId}`);
  return { ok: true, refundAmount };
}

/**
 * Cascading delete of a request and ALL related rows (offers, chats).
 * Refunds Tanga to providers whose pending offers get destroyed and also
 * scrubs the request from every per-provider offer mirror.
 */
export function deleteRequestCascade(requestId: string): void {
  const req = getRequestById(requestId);
  const allOffers = getOffers();
  // Only refund unresolved offers. Accepted/in_progress represent committed
  // work and completed offers are already paid for, so we do not over-refund.
  for (const o of allOffers) {
    if (o.requestId === requestId && o.status === "pending") {
      refundOfferToProvider(o, req, "request_deleted");
    }
  }
  writeJSON(OFFERS_KEY, allOffers.filter((o) => o.requestId !== requestId));

  const reqs = getRequests().filter((r) => r.id !== requestId);
  writeJSON(REQUESTS_KEY, reqs);

  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  writeJSON(CHATS_KEY, chats.filter((c) => c.requestId !== requestId));

  // Per-provider offer mirrors live at hormang_provider_offers_<providerId>.
  // Walk localStorage and prune entries pointing at this requestId.
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("hormang_provider_offers_")) continue;
    try {
      const arr = JSON.parse(localStorage.getItem(k) ?? "[]") as Array<{ requestId?: string }>;
      const next = arr.filter((o) => o.requestId !== requestId);
      if (next.length !== arr.length) localStorage.setItem(k, JSON.stringify(next));
    } catch (_) {}
  }

  emitStoreChange();
}

/**
 * Cascading delete of every localStorage key tied to a single user.
 * Used when admin deletes a user.
 */
export function deleteUserDataCascade(userId: string): void {
  if (!userId) return;
  // 1. Per-user prefixed keys (user_<id>_*, provider_tokens_<id>, etc.)
  const PER_USER_PREFIXES = [
    `user_${userId}_`,
    `provider_tokens_${userId}`,
    `hormang_referral_${userId}`,
    `hormang_ref_pending_${userId}`,
    `hormang_ref_inviter_${userId}`,
    `hormang_tanga_history_${userId}`,
    `provider_seen_${userId}`,
    `provider_offers_${userId}`,
    `provider_services_${userId}`,
    `provider_statuses_${userId}`,
  ];
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (PER_USER_PREFIXES.some((p) => k === p || k.startsWith(p))) toRemove.push(k);
    if (k.endsWith(`_${userId}`) || k.includes(`_${userId}_`)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));

  // 2. Shared collections — drop rows owned by this user. We must also
  //    purge offers/chats whose requestId belongs to a request we just
  //    removed (the user was the customer), otherwise they orphan.
  const allReqs = getRequests();
  const removedReqIds = new Set(allReqs.filter((r) => r.customerId === userId).map((r) => r.id));
  const reqs = allReqs.filter((r) => r.customerId !== userId);
  writeJSON(REQUESTS_KEY, reqs);

  const offers = getOffers().filter(
    (o) => o.masterId !== userId && !removedReqIds.has(o.requestId),
  );
  writeJSON(OFFERS_KEY, offers);

  const chats = readJSON<Chat[]>(CHATS_KEY, []).filter(
    (c) => c.masterId !== userId && !removedReqIds.has(c.requestId),
  );
  writeJSON(CHATS_KEY, chats);

  // Also scrub the deleted requestIds from every per-provider offer mirror.
  if (removedReqIds.size > 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("hormang_provider_offers_")) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(k) ?? "[]") as Array<{ requestId?: string }>;
        const next = arr.filter((o) => o.requestId === undefined || !removedReqIds.has(o.requestId));
        if (next.length !== arr.length) localStorage.setItem(k, JSON.stringify(next));
      } catch (_) {}
    }
  }

  // 3. Customer / phone registry
  try {
    const reg = JSON.parse(localStorage.getItem(CUSTOMER_REGISTRY_KEY) ?? "{}");
    delete reg[userId];
    localStorage.setItem(CUSTOMER_REGISTRY_KEY, JSON.stringify(reg));
  } catch {}
  try {
    const phones = JSON.parse(localStorage.getItem("hormang_phone_registry") ?? "{}");
    delete phones[userId];
    localStorage.setItem("hormang_phone_registry", JSON.stringify(phones));
  } catch {}

  emitStoreChange();
  console.log(`[Hormang] 🗑️ Foydalanuvchi ma'lumotlari to'liq o'chirildi: ${userId.slice(0,8)}`);
}

/**
 * Inject a system notification into a chat.
 * Does NOT increment providerUnread (it's not a real message from either side).
 */
export function sendSystemMessage(chatId: string, text: string): void {
  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return;
  const msg: ChatMessage = {
    id: uid(),
    sender: "system",
    text,
    timestamp: new Date().toISOString(),
  };
  chats[idx] = { ...chats[idx], messages: [...chats[idx].messages, msg] };
  writeJSON(CHATS_KEY, chats);
}

/* ─── Chats ──────────────────────────────────────────────────────── */

export function getChats(): Chat[] {
  return readJSON<Chat[]>(CHATS_KEY, []).sort(
    (a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.timestamp ?? a.createdAt;
      const bLast = b.messages[b.messages.length - 1]?.timestamp ?? b.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    }
  );
}

export function getChatById(id: string): Chat | undefined {
  return readJSON<Chat[]>(CHATS_KEY, []).find((c) => c.id === id);
}

/**
 * Create or return an existing chat for a request+master pair.
 * ID is deterministic: `${requestId}_${masterId}`.
 * customerMeta is optional — used when creating chat from customer side
 * before provider has set up the chat (rare case).
 */
export function getOrCreateChat(
  requestId: string,
  masterId: string,
  masterName: string,
  masterInitials: string,
  masterColor: string,
  avgResponseTime: number,
  categoryName: string,
  customerMeta?: {
    name?: string;
    initials?: string;
    color?: string;
    emoji?: string;
  }
): Chat {
  const chatId = `${requestId}_${masterId}`;
  const existing = getChatById(chatId);
  if (existing) return existing;

  const chat: Chat = {
    id: chatId,
    requestId,
    masterId,
    masterName,
    masterInitials,
    masterColor,
    avgResponseTime,
    categoryName,
    categoryEmoji: customerMeta?.emoji ?? "📋",
    customerName: customerMeta?.name ?? "Mijoz",
    customerInitials: customerMeta?.initials ?? "X",
    customerColor: customerMeta?.color ?? "#2563EB",
    providerUnread: 0,
    messages: [],
    createdAt: new Date().toISOString(),
  };

  const existing2 = readJSON<Chat[]>(CHATS_KEY, []);
  writeJSON(CHATS_KEY, [chat, ...existing2]);
  return chat;
}

/**
 * Send a message and return the updated chat.
 * - "customer" sends → providerUnread++  (provider has unread message)
 * - "master" sends   → providerUnread unchanged (provider just sent, not unread for them)
 */
export function sendMessage(
  chatId: string,
  sender: "customer" | "master",
  text: string,
  attachment?: ChatAttachment,
): Chat | null {
  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return null;

  const msg: ChatMessage = {
    id: uid(),
    sender,
    text,
    timestamp: new Date().toISOString(),
    ...(attachment ? { attachment } : {}),
  };
  const prevUnread = chats[idx].providerUnread ?? 0;
  const providerUnread = sender === "customer" ? prevUnread + 1 : prevUnread;
  chats[idx] = { ...chats[idx], messages: [...chats[idx].messages, msg], providerUnread };
  writeJSON(CHATS_KEY, chats);
  console.log(`[Hormang] 💬 Xabar yuborildi`, { chatId, sender, text: text.slice(0, 50), hasAttachment: !!attachment });
  return chats[idx];
}

/**
 * Mark all messages in this chat as read by the provider.
 * Called when provider opens the chat thread.
 */
export function markProviderChatRead(chatId: string): void {
  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return;
  chats[idx] = { ...chats[idx], providerUnread: 0 };
  writeJSON(CHATS_KEY, chats);
}

/**
 * Total unread messages across all chats for the provider.
 */
export function getTotalProviderUnread(): number {
  return readJSON<Chat[]>(CHATS_KEY, []).reduce((s, c) => s + (c.providerUnread ?? 0), 0);
}

/** Get the latest chat across all requests (for bottom nav redirect) */
export function getLatestChatId(): string | null {
  const chats = getChats();
  return chats.length > 0 ? chats[0].id : null;
}
