/**
 * provider-store.ts
 * localStorage persistence + mock data for provider (ijrochi) side.
 * Keys:
 *   hormang_provider_requests  — ProviderRequest[]  (requests visible to this provider)
 *   hormang_provider_services  — UpcomingService[]  (accepted/upcoming jobs)
 *   hormang_provider_chats     — ProviderChat[]     (provider's chat threads)
 *   hormang_provider_seen      — string[]           (IDs of seen request IDs)
 */

import { emitStoreChange } from "./store-events";
import type { CustomerRequest } from "./requests-store";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface ProviderRequest {
  id: string;
  categoryId: string;
  categoryName: string;
  emoji: string;
  description: string;
  budget: number | null;
  budgetLabel: string;
  urgency: "urgent" | "normal" | "flexible";
  location: string;
  customerName: string;
  createdAt: string;
  status: "open" | "responded" | "ignored";
}

export interface UpcomingService {
  id: string;
  title: string;
  customerName: string;
  customerInitials: string;
  customerColor: string;
  date: string;
  time: string;
  location: string;
  categoryEmoji: string;
  status: "upcoming" | "done";
}

export interface ProviderChatMessage {
  id: string;
  sender: "provider" | "customer";
  text: string;
  timestamp: string;
}

export interface ProviderChat {
  id: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  customerColor: string;
  categoryName: string;
  categoryEmoji: string;
  messages: ProviderChatMessage[];
  unread: number;
  createdAt: string;
}

export interface ProviderOffer {
  id: string;
  requestId: string;
  price: number;
  priceLabel: string;
  message: string;
  completionTime: string;
  startDate: string;
  termsAccepted: boolean;
  fileUrls: string[];
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

/* ─── Storage Keys ───────────────────────────────────────────────── */

const REQUESTS_KEY = "hormang_provider_requests";
const SERVICES_KEY = "hormang_provider_services";
const CHATS_KEY = "hormang_provider_chats";
const SEEN_KEY = "hormang_provider_seen";
const OFFERS_KEY = "hormang_provider_offers";
const AVG_RESPONSE_KEY = "hormang_provider_avg_response";
const SEED_VERSION_KEY = "hormang_provider_seed_version";
const SEED_VERSION = "v2";

/* ─── Storage helpers ─────────────────────────────────────────────── */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (_) { /* ignore */ }
  return fallback;
}

function writeJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
  emitStoreChange();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ─── Legacy Data Cleanup ─────────────────────────────────────────── */

const CLEAN_VERSION = "v3";

function clearLegacyData() {
  const version = localStorage.getItem(SEED_VERSION_KEY);
  if (version !== CLEAN_VERSION) {
    // Wipe all mock-seeded data from previous versions (both provider and buyer side)
    localStorage.removeItem(REQUESTS_KEY);       // hormang_provider_requests
    localStorage.removeItem(SERVICES_KEY);       // hormang_provider_services
    localStorage.removeItem(CHATS_KEY);          // hormang_provider_chats
    localStorage.removeItem(OFFERS_KEY);         // hormang_provider_offers
    localStorage.removeItem(SEEN_KEY);           // hormang_provider_seen
    localStorage.removeItem("hormang_requests"); // buyer requests
    localStorage.removeItem("hormang_offers");   // buyer offers
    localStorage.removeItem("hormang_chats");    // buyer chats
    localStorage.setItem(SEED_VERSION_KEY, CLEAN_VERSION);
  }
}

// Run once on module load
clearLegacyData();

/* ─── Category normalisation ─────────────────────────────────────── */

function normalizeCategory(name: string): string {
  return name.toLowerCase().replace(/[\s/]+/g, "").trim();
}

function categoryMatches(reqCategory: string, providerCategories: string[]): boolean {
  if (providerCategories.length === 0) return true; // no filter set → show all
  const norm = normalizeCategory(reqCategory);
  return providerCategories.some((c) => normalizeCategory(c) === norm);
}

/* ─── Buyer-request → ProviderRequest adapter ────────────────────── */

const PROVIDER_STATUSES_KEY = "hormang_provider_statuses";
type ProviderActionStatus = "responded" | "ignored";

function getProviderStatuses(): Record<string, ProviderActionStatus> {
  return readJSON<Record<string, ProviderActionStatus>>(PROVIDER_STATUSES_KEY, {});
}

function urgencyFrom(answers: Record<string, unknown>): ProviderRequest["urgency"] {
  const u = answers["urgency"] as string | undefined;
  if (u === "today_tomorrow") return "urgent";
  if (u === "3_7_days" || u === "1_2_weeks") return "normal";
  return "flexible";
}

function budgetFrom(answers: Record<string, unknown>): { budget: number | null; budgetLabel: string } {
  const b = answers["budget"] as number | undefined;
  const open = answers["budget_open"] as boolean | undefined;
  if (b && b > 0) return { budget: b, budgetLabel: `${b.toLocaleString()} so'm` };
  if (open) return { budget: null, budgetLabel: "Murosalashtirish mumkin" };
  return { budget: null, budgetLabel: "Kelishiladi" };
}

function locationFrom(answers: Record<string, unknown>): string {
  for (const k of ["district", "location", "address", "region", "move_from", "turar_joy"]) {
    const v = answers[k];
    if (v && typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "Toshkent";
}

function descriptionFrom(answers: Record<string, unknown>): string {
  const skip = new Set(["urgency", "budget", "budget_open"]);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(answers)) {
    if (skip.has(k) || !v || k.endsWith("_photo") || k.endsWith("_file")) continue;
    if (typeof v === "boolean") parts.push(v ? "Ha" : "Yo'q");
    else if (Array.isArray(v)) { if (v.length > 0) parts.push((v as string[]).join(", ")); }
    else if (typeof v === "number") parts.push(String(v));
    else if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  const desc = parts.join(" · ");
  return desc.length > 130 ? desc.slice(0, 127) + "..." : desc || "—";
}

function adaptBuyerRequest(req: CustomerRequest, actionStatus?: ProviderActionStatus): ProviderRequest {
  const { budget, budgetLabel } = budgetFrom(req.answers);
  const status: ProviderRequest["status"] = actionStatus ?? "open";
  return {
    id: req.id,
    categoryId: req.categoryId,
    categoryName: req.categoryName,
    emoji: req.emoji,
    description: descriptionFrom(req.answers),
    budget,
    budgetLabel,
    urgency: urgencyFrom(req.answers),
    location: locationFrom(req.answers),
    customerName: "Foydalanuvchi",
    createdAt: req.createdAt,
    status,
  };
}

/* ─── Requests API ───────────────────────────────────────────────── */

const BUYER_REQUESTS_KEY_CONST = "hormang_requests";

/**
 * Returns all buyer requests that match the given provider categories,
 * overlaid with the provider's own seen/responded/ignored state.
 * Pass [] to get ALL requests (no category filter — for admin/debug).
 */
export function getMatchingRequests(selectedCategories: string[]): ProviderRequest[] {
  const buyerReqs = readJSON<CustomerRequest[]>(BUYER_REQUESTS_KEY_CONST, []);
  const statuses = getProviderStatuses();
  return buyerReqs
    .filter((r) => r.status === "open" && categoryMatches(r.categoryName, selectedCategories))
    .map((r) => adaptBuyerRequest(r, statuses[r.id]))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Backward-compat: returns all buyer requests, no category filter. */
export function getProviderRequests(): ProviderRequest[] {
  return getMatchingRequests([]);
}

export function getProviderRequestById(id: string): ProviderRequest | undefined {
  return getProviderRequests().find((r) => r.id === id);
}

export function updateProviderRequestStatus(id: string, status: ProviderRequest["status"]): void {
  if (status === "open") return;
  const statuses = getProviderStatuses();
  writeJSON(PROVIDER_STATUSES_KEY, { ...statuses, [id]: status as ProviderActionStatus });
}

/* ─── Seen IDs ───────────────────────────────────────────────────── */

export function getSeenIds(): string[] {
  return readJSON<string[]>(SEEN_KEY, []);
}

export function markSeen(id: string): void {
  const seen = getSeenIds();
  if (!seen.includes(id)) writeJSON(SEEN_KEY, [...seen, id]);
}

export function markAllSeen(selectedCategories: string[] = []): void {
  const ids = getMatchingRequests(selectedCategories).map((r) => r.id);
  const existing = getSeenIds();
  const merged = Array.from(new Set([...existing, ...ids]));
  writeJSON(SEEN_KEY, merged);
}

export function getUnseenRequests(selectedCategories: string[] = []): ProviderRequest[] {
  const seen = getSeenIds();
  return getMatchingRequests(selectedCategories).filter(
    (r) => !seen.includes(r.id) && r.status === "open"
  );
}

/* ─── Upcoming Services ──────────────────────────────────────────── */

export function getUpcomingServices(): UpcomingService[] {
  return readJSON<UpcomingService[]>(SERVICES_KEY, []).sort(
    (a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime()
  );
}

export function markServiceDone(id: string): void {
  const services = readJSON<UpcomingService[]>(SERVICES_KEY, []);
  writeJSON(SERVICES_KEY, services.map((s) => s.id === id ? { ...s, status: "done" as const } : s));
}

/* ─── Provider Chats ─────────────────────────────────────────────── */

export function getProviderChats(): ProviderChat[] {
  return readJSON<ProviderChat[]>(CHATS_KEY, []).sort(
    (a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.timestamp ?? a.createdAt;
      const bLast = b.messages[b.messages.length - 1]?.timestamp ?? b.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    }
  );
}

export function getProviderChatById(id: string): ProviderChat | undefined {
  return getProviderChats().find((c) => c.id === id);
}

export function sendProviderMessage(chatId: string, sender: "provider" | "customer", text: string): ProviderChat | null {
  const chats = readJSON<ProviderChat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return null;

  const msg: ProviderChatMessage = { id: uid(), sender, text, timestamp: new Date().toISOString() };
  const unread = sender === "customer" ? chats[idx].unread + 1 : 0;
  chats[idx] = { ...chats[idx], messages: [...chats[idx].messages, msg], unread };
  writeJSON(CHATS_KEY, chats);
  return chats[idx];
}

export function markChatRead(chatId: string): void {
  const chats = readJSON<ProviderChat[]>(CHATS_KEY, []);
  writeJSON(CHATS_KEY, chats.map((c) => c.id === chatId ? { ...c, unread: 0 } : c));
}

export function getTotalUnread(): number {
  return getProviderChats().reduce((sum, c) => sum + c.unread, 0);
}

/* ─── Offers ─────────────────────────────────────────────────────── */

export function getOffers(): ProviderOffer[] {
  return readJSON<ProviderOffer[]>(OFFERS_KEY, []);
}

export function getOfferByRequestId(requestId: string): ProviderOffer | undefined {
  return getOffers().find((o) => o.requestId === requestId);
}

export function saveOffer(data: Omit<ProviderOffer, "id" | "createdAt" | "status">): ProviderOffer {
  const offers = getOffers();
  const offer: ProviderOffer = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const allOffers = [...offers, offer];
  writeJSON(OFFERS_KEY, allOffers);

  // Sync offer count to the buyer-side CustomerRequest (hormang_requests key)
  try {
    const BUYER_REQUESTS_KEY = "hormang_requests";
    const raw = localStorage.getItem(BUYER_REQUESTS_KEY);
    if (raw) {
      const buyerReqs = JSON.parse(raw) as Array<{ id: string; offerCount?: number }>;
      const idx = buyerReqs.findIndex((r) => r.id === data.requestId);
      if (idx !== -1) {
        const count = allOffers.filter((o) => o.requestId === data.requestId).length;
        buyerReqs[idx] = { ...buyerReqs[idx], offerCount: count };
        localStorage.setItem(BUYER_REQUESTS_KEY, JSON.stringify(buyerReqs));
      }
    }
  } catch (_) {}

  return offer;
}

/* ─── Avg Response Time ──────────────────────────────────────────── */

export function getAvgResponseMinutes(): number {
  const raw = localStorage.getItem(AVG_RESPONSE_KEY);
  return raw ? parseInt(raw, 10) : 14;
}

export function setAvgResponseMinutes(mins: number): void {
  localStorage.setItem(AVG_RESPONSE_KEY, String(mins));
  emitStoreChange();
}

/* ─── Offer count helpers ─────────────────────────────────────────── */

export function getRequestOfferCount(requestId: string): number {
  return getOffers().filter((o) => o.requestId === requestId).length;
}

export function getRequestsWithZeroOffers(selectedCategories: string[] = []): ProviderRequest[] {
  const offers = getOffers();
  return getMatchingRequests(selectedCategories).filter(
    (r) => r.status === "open" && !offers.some((o) => o.requestId === r.id)
  );
}

/* ─── Create chat from offer ─────────────────────────────────────── */

export function createChatFromOffer(request: ProviderRequest, offer: ProviderOffer): ProviderChat {
  const chats = readJSON<ProviderChat[]>(CHATS_KEY, []);
  const existing = chats.find((c) => c.customerId === `req_${request.id}`);
  if (existing) return existing;

  const initials = request.customerName
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const palette = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];
  const color = palette[Math.floor(Math.random() * palette.length)];

  const offerText = `Taklif narxi: ${offer.priceLabel}\nBajarish muddati: ${offer.completionTime}\n\n${offer.message}`;

  const newChat: ProviderChat = {
    id: uid(),
    customerId: `req_${request.id}`,
    customerName: request.customerName,
    customerInitials: initials,
    customerColor: color,
    categoryName: request.categoryName,
    categoryEmoji: request.emoji,
    messages: [
      {
        id: uid(),
        sender: "provider",
        text: offerText,
        timestamp: new Date().toISOString(),
      },
    ],
    unread: 0,
    createdAt: new Date().toISOString(),
  };

  writeJSON(CHATS_KEY, [...chats, newChat]);
  return newChat;
}
