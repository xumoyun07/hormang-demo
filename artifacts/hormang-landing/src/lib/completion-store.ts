/**
 * completion-store.ts
 * Tracks reviews (star ratings + text) and per-user completed counts.
 *
 * Keys:
 *   hormang_reviews         — Review[]
 *   hormang_completed_{uid} — number
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
  reviewerRole: "customer" | "provider";
  offerId: string;
  rating: number;           // 1–5
  text: string;
  createdAt: string;
}

/* ─── Keys ───────────────────────────────────────────────────────── */

const REVIEWS_KEY = "hormang_reviews";

function completedKey(userId: string): string {
  return `hormang_completed_${userId}`;
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

export function getReviews(subjectId: string): Review[] {
  return readJSON<Review[]>(REVIEWS_KEY, []).filter((r) => r.subjectId === subjectId);
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

/* ─── Completed Counts ───────────────────────────────────────────── */

export function getCompletedCount(userId: string): number {
  if (!userId) return 0;
  return readJSON<number>(completedKey(userId), 0);
}

export function incrementCompletedCount(userId: string): void {
  if (!userId) return;
  const current = getCompletedCount(userId);
  localStorage.setItem(completedKey(userId), JSON.stringify(current + 1));
  emitStoreChange();
}
