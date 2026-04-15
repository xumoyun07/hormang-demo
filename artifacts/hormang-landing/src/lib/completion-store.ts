/**
 * completion-store.ts
 * Tracks reviews (star ratings + text) and per-user / per-role completed counts.
 *
 * Keys:
 *   hormang_reviews                    — Review[]
 *   hormang_completed_provider_{uid}   — number (completed as provider)
 *   hormang_completed_customer_{uid}   — number (completed as customer)
 */
import { emitStoreChange } from "./store-events";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface Review {
  id: string;
  subjectId: string;        // who is being reviewed
  reviewerId: string;       // who wrote the review
  reviewerName: string;
  reviewerInitials: string;
  reviewerColor: string;
  reviewerRole: "customer" | "provider";  // the role of the REVIEWER (not subject)
  offerId: string;
  rating: number;           // 1–5
  text: string;
  createdAt: string;
}

/* ─── Keys ───────────────────────────────────────────────────────── */

const REVIEWS_KEY = "hormang_reviews";

function completedKey(userId: string, role: "provider" | "customer"): string {
  return `hormang_completed_${role}_${userId}`;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (_) { /* ignore */ }
  return fallback;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ─── Reviews ────────────────────────────────────────────────────── */

/** All reviews where the given user is the SUBJECT (i.e., the one being rated). */
export function getReviews(subjectId: string): Review[] {
  if (!subjectId) return [];
  return readJSON<Review[]>(REVIEWS_KEY, []).filter((r) => r.subjectId === subjectId);
}

/**
 * Reviews where the subject is `subjectId` AND the reviewer had role `byRole`.
 * Use this to get provider reviews from customers, or customer reviews from providers.
 */
export function getReviewsByRole(subjectId: string, byRole: "customer" | "provider"): Review[] {
  return getReviews(subjectId).filter((r) => r.reviewerRole === byRole);
}

export function getAverageRating(subjectId: string): number {
  const reviews = getReviews(subjectId);
  if (!reviews.length) return 0;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return Math.round(avg * 10) / 10;
}

export function hasReviewed(offerId: string, reviewerId: string): boolean {
  return readJSON<Review[]>(REVIEWS_KEY, []).some(
    (r) => r.offerId === offerId && r.reviewerId === reviewerId
  );
}

export function addReview(review: Omit<Review, "id" | "createdAt">): void {
  const all = readJSON<Review[]>(REVIEWS_KEY, []);
  if (all.some((r) => r.offerId === review.offerId && r.reviewerId === review.reviewerId)) return;
  const newReview: Review = { ...review, id: uid(), createdAt: new Date().toISOString() };
  localStorage.setItem(REVIEWS_KEY, JSON.stringify([...all, newReview]));
  emitStoreChange();
}

/* ─── Completed Counts (role-separated) ─────────────────────────── */

/** How many services this user has completed in the given role. */
export function getCompletedCount(userId: string, role: "provider" | "customer"): number {
  if (!userId) return 0;
  return readJSON<number>(completedKey(userId, role), 0);
}

export function incrementCompletedCount(userId: string, role: "provider" | "customer"): void {
  if (!userId) return;
  const current = getCompletedCount(userId, role);
  localStorage.setItem(completedKey(userId, role), JSON.stringify(current + 1));
  emitStoreChange();
}
