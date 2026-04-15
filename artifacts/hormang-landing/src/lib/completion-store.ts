/**
 * completion-store.ts
 *
 * Clean review storage system.
 * Key: "hormang_reviews_v2"  →  Review[]
 *
 * Each Review records:
 *   - WHO wrote it (reviewerId + reviewerRole)
 *   - WHO received it (reviewedId + reviewedRole)
 *   - WHICH request/offer it belongs to
 *   - rating + optional comment
 *
 * Completed-count keys (role-separated, incremented on offer completion):
 *   hormang_completed_provider_{uid}
 *   hormang_completed_customer_{uid}
 */
import { emitStoreChange } from "./store-events";

/* ─── Type ───────────────────────────────────────────────────────── */

export interface Review {
  id: string;
  requestId: string;
  offerId?: string;
  reviewerId: string;
  reviewerRole: "customer" | "provider";
  reviewedId: string;
  reviewedRole: "customer" | "provider";
  rating: number;             // 1–5
  comment?: string;
  createdAt: string;
  serviceCategory?: string;
}

/* ─── Keys ───────────────────────────────────────────────────────── */

const REVIEWS_KEY = "hormang_reviews_v2";

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

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function allReviews(): Review[] {
  return readJSON<Review[]>(REVIEWS_KEY, []);
}

/* ─── Read helpers ───────────────────────────────────────────────── */

/**
 * All reviews about a specific user in a specific role.
 * - provider profile  → getReviewsForUser(masterId, "provider")
 * - customer profile  → getReviewsForUser(customerId, "customer")
 */
export function getReviewsForUser(userId: string, asRole: "provider" | "customer"): Review[] {
  if (!userId) return [];
  return allReviews().filter(
    (r) => r.reviewedId === userId && r.reviewedRole === asRole
  );
}

export function getAverageRatingForUser(
  userId: string,
  asRole: "provider" | "customer"
): number {
  const reviews = getReviewsForUser(userId, asRole);
  if (!reviews.length) return 0;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Has this reviewer already reviewed the given request?
 * Prevents submitting a second review for the same job.
 */
export function hasReviewedRequest(requestId: string, reviewerId: string): boolean {
  return allReviews().some(
    (r) => r.requestId === requestId && r.reviewerId === reviewerId
  );
}

/* ─── Write ──────────────────────────────────────────────────────── */

export function addReview(
  review: Omit<Review, "id" | "createdAt">
): void {
  const reviews = allReviews();
  const isDuplicate = reviews.some(
    (r) => r.requestId === review.requestId && r.reviewerId === review.reviewerId
  );
  if (isDuplicate) return;

  const newReview: Review = {
    ...review,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(REVIEWS_KEY, JSON.stringify([...reviews, newReview]));
  emitStoreChange();
}

/* ─── Completed Counts (role-separated, from completion events) ──── */

export function getCompletedCount(
  userId: string,
  role: "provider" | "customer"
): number {
  if (!userId) return 0;
  return readJSON<number>(completedKey(userId, role), 0);
}

export function incrementCompletedCount(
  userId: string,
  role: "provider" | "customer"
): void {
  if (!userId) return;
  const current = getCompletedCount(userId, role);
  localStorage.setItem(completedKey(userId, role), JSON.stringify(current + 1));
  emitStoreChange();
}
