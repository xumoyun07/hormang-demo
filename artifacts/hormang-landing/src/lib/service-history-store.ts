/**
 * service-history-store.ts
 *
 * Immutable per-job "Service History" snapshots for providers. When an offer is
 * finalised as "completed" (see requests-store: markOfferCompleted /
 * confirmCompletion), we copy a self-contained snapshot of the job here so the
 * provider can browse their completed services, earnings, ratings and portfolio
 * without depending on the original request/offer records later.
 *
 * Architecture: this is a localStorage store following the same conventions as
 * completion-store.ts (JSON blob, genId, emitStoreChange). It MUST NOT import
 * requests-store.ts (that store imports the recorder from here — keeping the
 * dependency one-directional avoids an import cycle).
 *
 * "Security rules" from the spec are satisfied by always querying with the
 * logged-in providerId. Pagination/indexes are handled in-memory by callers.
 */
import { emitStoreChange } from "./store-events";
import { getReviewsForUser } from "./completion-store";

export interface ServiceHistory {
  id: string;

  providerId: string;
  customerId: string;
  customerName?: string;

  requestId: string;
  offerId: string;

  categoryId: string;
  categoryName: string;
  emoji?: string;

  serviceTitle: string;
  serviceDescription: string;

  finalPrice: number;

  status: "completed";

  /** Filled lazily from the reviews store when the customer leaves a review. */
  rating?: number;
  review?: string;

  completedAt: string; // ISO timestamp

  durationMinutes?: number;

  beforePhotos?: string[];
  afterPhotos?: string[];

  /** Raw location codes (formatted for display in the UI via lib/regions). */
  region?: string;
  district?: string;
  locationName?: string;

  isRepeatCustomer: boolean;
  isPortfolio: boolean;
}

export interface ProviderHistoryStats {
  totalCompleted: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  averageRating: number;
  /** % of completed jobs that were not low-rated (rating absent or >= 4). */
  successRate: number;
  mostPopularCategoryId?: string;
  mostPopularCategoryName?: string;
  repeatCustomers: number;
}

export interface RecordCompletionInput {
  providerId: string;
  customerId?: string;
  customerName?: string;
  requestId: string;
  offerId: string;
  categoryId: string;
  categoryName: string;
  emoji?: string;
  serviceTitle: string;
  serviceDescription?: string;
  finalPrice: number;
  region?: string;
  district?: string;
  beforePhotos?: string[];
  completedAt?: string;
}

/* ─── Keys / helpers ─────────────────────────────────────────────── */

const HISTORY_KEY = "hormang_service_history_v1";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (_) {
    /* ignore */
  }
  return fallback;
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function allHistory(): ServiceHistory[] {
  return readJSON<ServiceHistory[]>(HISTORY_KEY, []);
}

/**
 * Merge the latest customer rating/review (if any) into a snapshot. Reviews are
 * stored separately and are written AFTER completion, so we resolve them on read
 * to keep history in sync without mutating the immutable snapshot.
 */
function enrich(record: ServiceHistory): ServiceHistory {
  const reviews = getReviewsForUser(record.providerId, "provider");
  const match = reviews.find((r) => r.requestId === record.requestId);
  if (!match) return record;
  return {
    ...record,
    rating: match.rating ?? record.rating,
    review: match.comment ?? record.review,
  };
}

/* ─── Write ──────────────────────────────────────────────────────── */

/**
 * Create an immutable history snapshot when an offer is completed. Idempotent:
 * if a record already exists for the offer, this is a no-op.
 */
export function recordServiceCompletion(input: RecordCompletionInput): void {
  if (!input.providerId || !input.offerId) return;

  const history = allHistory();
  if (history.some((h) => h.offerId === input.offerId)) return; // dedupe

  const isRepeatCustomer =
    !!input.customerId &&
    history.some(
      (h) => h.providerId === input.providerId && h.customerId === input.customerId
    );

  const record: ServiceHistory = {
    id: genId(),
    providerId: input.providerId,
    customerId: input.customerId ?? "",
    customerName: input.customerName,
    requestId: input.requestId,
    offerId: input.offerId,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    emoji: input.emoji,
    serviceTitle: input.serviceTitle,
    serviceDescription: input.serviceDescription ?? "",
    finalPrice: input.finalPrice ?? 0,
    status: "completed",
    completedAt: input.completedAt ?? new Date().toISOString(),
    beforePhotos: input.beforePhotos && input.beforePhotos.length ? input.beforePhotos : undefined,
    region: input.region,
    district: input.district,
    isRepeatCustomer,
    isPortfolio: false,
  };

  writeJSON(HISTORY_KEY, [...history, record]);
  emitStoreChange();
}

/** Mark / unmark a history record as a portfolio item. */
export function setPortfolio(id: string, isPortfolio: boolean): void {
  const history = allHistory();
  let changed = false;
  const next = history.map((h) => {
    if (h.id === id && h.isPortfolio !== isPortfolio) {
      changed = true;
      return { ...h, isPortfolio };
    }
    return h;
  });
  if (!changed) return;
  writeJSON(HISTORY_KEY, next);
  emitStoreChange();
}

/** Attach/replace the "after" photos for a completed job. */
export function setAfterPhotos(id: string, afterPhotos: string[]): void {
  const history = allHistory();
  let changed = false;
  const next = history.map((h) => {
    if (h.id === id) {
      changed = true;
      return { ...h, afterPhotos: afterPhotos.length ? afterPhotos : undefined };
    }
    return h;
  });
  if (!changed) return;
  writeJSON(HISTORY_KEY, next);
  emitStoreChange();
}

/* ─── Read ───────────────────────────────────────────────────────── */

/** All completed services for a provider, newest first, enriched with reviews. */
export function getProviderHistory(providerId: string): ServiceHistory[] {
  if (!providerId) return [];
  return allHistory()
    .filter((h) => h.providerId === providerId)
    .map(enrich)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function getServiceHistoryById(id: string): ServiceHistory | undefined {
  const found = allHistory().find((h) => h.id === id);
  return found ? enrich(found) : undefined;
}

/**
 * Provider-scoped detail lookup. Returns the record only if it belongs to the
 * given provider — prevents one logged-in user reading another provider's
 * snapshot by guessing an id on a shared browser.
 */
export function getServiceHistoryByIdForProvider(
  providerId: string,
  id: string
): ServiceHistory | undefined {
  if (!providerId) return undefined;
  const found = allHistory().find((h) => h.id === id && h.providerId === providerId);
  return found ? enrich(found) : undefined;
}

/** Portfolio-flagged completed services for a provider, newest first. */
export function getPortfolioItems(providerId: string): ServiceHistory[] {
  return getProviderHistory(providerId).filter((h) => h.isPortfolio);
}

/** Derived analytics for the Statistics tab / header. */
export function getProviderHistoryStats(providerId: string): ProviderHistoryStats {
  const history = getProviderHistory(providerId);

  const totalCompleted = history.length;
  const totalEarnings = history.reduce((sum, h) => sum + (h.finalPrice || 0), 0);

  const now = new Date();
  const thisMonthEarnings = history.reduce((sum, h) => {
    const d = new Date(h.completedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      ? sum + (h.finalPrice || 0)
      : sum;
  }, 0);

  const rated = history.filter((h) => typeof h.rating === "number");
  const averageRating = rated.length
    ? Math.round((rated.reduce((s, h) => s + (h.rating || 0), 0) / rated.length) * 100) / 100
    : 0;

  const successful = history.filter((h) => h.rating == null || h.rating >= 4).length;
  const successRate = totalCompleted ? Math.round((successful / totalCompleted) * 100) : 0;

  // Most popular category by completed-job count.
  let mostPopularCategoryId: string | undefined;
  let mostPopularCategoryName: string | undefined;
  const counts = new Map<string, { name: string; n: number }>();
  for (const h of history) {
    const prev = counts.get(h.categoryId);
    counts.set(h.categoryId, { name: h.categoryName, n: (prev?.n ?? 0) + 1 });
  }
  let best = 0;
  for (const [id, { name, n }] of counts) {
    if (n > best) {
      best = n;
      mostPopularCategoryId = id;
      mostPopularCategoryName = name;
    }
  }

  // Repeat customers = distinct customers with 2+ completed jobs.
  const perCustomer = new Map<string, number>();
  for (const h of history) {
    if (!h.customerId) continue;
    perCustomer.set(h.customerId, (perCustomer.get(h.customerId) ?? 0) + 1);
  }
  let repeatCustomers = 0;
  for (const n of perCustomer.values()) if (n >= 2) repeatCustomers += 1;

  return {
    totalCompleted,
    totalEarnings,
    thisMonthEarnings,
    averageRating,
    successRate,
    mostPopularCategoryId,
    mostPopularCategoryName,
    repeatCustomers,
  };
}
