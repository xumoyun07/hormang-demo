/**
 * provider-store.ts
 * localStorage persistence for provider (ijrochi) side.
 *
 * Keys used:
 *   hormang_provider_statuses_${providerId}  — per-provider action statuses (seen/ignored/responded)
 *   hormang_provider_offers_${providerId}    — per-provider ProviderOffer[] (provider's own offers)
 *   hormang_provider_services                — UpcomingService[]
 *   hormang_provider_seen                   — string[] (seen request IDs — global across providers)
 *   hormang_offers                          — Offer[] (shared; customer reads here; all providers write here)
 *   hormang_chats                           — Chat[]  (SHARED with customer side — unified store, keyed ${requestId}_${masterId})
 */

import { emitStoreChange } from "./store-events";
import type { CustomerRequest, Chat } from "./requests-store";
import {
  getCustomerFromRegistry,
  getChatById, sendMessage, markProviderChatRead,
  getChats, getRequestById,
} from "./requests-store";
import { doesRequestMatch } from "./matching";
import {
  getAllQuestionsForCategory, collectActiveQuestions,
  type Question,
} from "./questionnaire-store";

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
  customerId: string;
  createdAt: string;
  status: "open" | "responded" | "ignored";
  answers: Record<string, unknown>;
  region?: string;
  district?: string;
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

/** Provider-side view of a chat (adapted from unified Chat) */
export interface ProviderChatMessage {
  id: string;
  sender: "provider" | "customer" | "system";
  text: string;
  timestamp: string;
}

export interface ProviderChat {
  id: string;
  requestId: string;
  masterId: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  customerColor: string;
  categoryName: string;
  categoryEmoji: string;
  avgResponseTime: number;
  messages: ProviderChatMessage[];
  unread: number;
  createdAt: string;
  region?: string;
  district?: string;
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

const SERVICES_KEY = "hormang_provider_services";
const SEEN_KEY = "hormang_provider_seen";
const SHARED_OFFERS_KEY = "hormang_offers";     // shared with customer
const AVG_RESPONSE_KEY = "hormang_provider_avg_response";
const SEED_VERSION_KEY = "hormang_provider_seed_version";
const SEED_VERSION = "v4";

/** Per-provider key for action statuses (responded/ignored) */
function providerStatusesKey(providerId: string): string {
  return `hormang_provider_statuses_${providerId}`;
}

/** Per-provider key for the provider's own submitted offers */
function providerOffersKey(providerId: string): string {
  return `hormang_provider_offers_${providerId}`;
}

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

/* ─── Legacy Data Cleanup ─────────────────────────────────────────── */

function clearLegacyData() {
  const version = localStorage.getItem(SEED_VERSION_KEY);
  if (version !== SEED_VERSION) {
    localStorage.removeItem("hormang_provider_requests");  // old key
    localStorage.removeItem(SERVICES_KEY);
    localStorage.removeItem("hormang_provider_offers");    // old global key
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem("hormang_provider_chats");     // old key
    localStorage.removeItem("hormang_provider_statuses");  // old global key
    localStorage.removeItem("hormang_requests");
    localStorage.removeItem("hormang_offers");
    localStorage.removeItem("hormang_chats");
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }
}

clearLegacyData();

/* ─── Chat conversion helpers ─────────────────────────────────────── */

/** Convert unified Chat → ProviderChat (for provider UI) */
function chatToProviderChat(c: Chat): ProviderChat {
  /* Try registry first (real-time name if customer has logged in on this device) */
  const req = getRequestById(c.requestId);
  const reg = req?.customerId ? getCustomerFromRegistry(req.customerId) : null;
  const customerName = reg?.name || c.customerName || "Xaridor";
  const customerInitials = reg?.initials || c.customerInitials || "X";

  return {
    id: c.id,
    requestId: c.requestId,
    masterId: c.masterId,
    customerId: req?.customerId ?? c.requestId,
    customerName,
    customerInitials,
    customerColor: c.customerColor || "#7C3AED",
    categoryName: c.categoryName,
    categoryEmoji: c.categoryEmoji || "📋",
    avgResponseTime: c.avgResponseTime ?? 14,
    region: req?.region,
    district: req?.district,
    messages: c.messages.map((m) => ({
      id: m.id,
      sender: m.sender === "customer" ? "customer" as const : m.sender === "system" ? "system" as const : "provider" as const,
      text: m.text,
      timestamp: m.timestamp,
    })),
    unread: c.providerUnread ?? 0,
    createdAt: c.createdAt,
  };
}

/* ─── Buyer-request → ProviderRequest adapter ────────────────────── */

type ProviderActionStatus = "responded" | "ignored";

function getProviderStatuses(providerId: string): Record<string, ProviderActionStatus> {
  return readJSON<Record<string, ProviderActionStatus>>(providerStatusesKey(providerId), {});
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
  if (open) return { budget: null, budgetLabel: "Taklifga ochiq" };
  return { budget: null, budgetLabel: "Kelishiladi" };
}

function locationFrom(answers: Record<string, unknown>): string {
  for (const k of ["district", "location", "address", "region", "move_from", "turar_joy"]) {
    const v = answers[k];
    if (v && typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "Toshkent";
}

function formatQValue(q: Question, v: unknown, answers: Record<string, unknown>): string | null {
  if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return null;
  if (typeof v === "string" && v.startsWith("data:")) return null; // base64 image
  if (typeof v === "boolean") return v ? "Ha" : "Yo'q";
  if (typeof v === "number") return String(v);
  const otherOpt = q.options?.find((o) => o.type === "other");
  if (typeof v === "string") {
    if (otherOpt && v === otherOpt.value) {
      const customText = answers[q.id + "_other"] as string | undefined;
      return customText?.trim() || otherOpt.label;
    }
    return q.options?.find((o) => o.value === v)?.label ?? v;
  }
  if (Array.isArray(v)) {
    return (v as string[])
      .map((item) => {
        if (otherOpt && item === otherOpt.value) {
          const customText = answers[q.id + "_other"] as string | undefined;
          return customText?.trim() || otherOpt.label;
        }
        return q.options?.find((o) => o.value === item)?.label ?? item;
      })
      .join(", ");
  }
  return null;
}

function descriptionFrom(answers: Record<string, unknown>, categoryId: string): string {
  const skip = new Set(["urgency", "budget", "budget_open", "region", "district"]);
  const parts: string[] = [];

  try {
    const allQs = getAllQuestionsForCategory(categoryId);
    const activeQs = collectActiveQuestions(allQs, answers);
    for (const q of activeQs) {
      if (skip.has(q.id) || q.type === "file" || q.type === "section-header") continue;
      const v = answers[q.id];
      const formatted = formatQValue(q, v, answers);
      if (formatted) parts.push(formatted);
    }
  } catch {
    // Fallback: iterate answers directly if questions unavailable
    for (const [k, v] of Object.entries(answers)) {
      if (skip.has(k) || !v || k.endsWith("_photo") || k.endsWith("_file") || k.endsWith("_other")) continue;
      if (typeof v === "boolean") parts.push(v ? "Ha" : "Yo'q");
      else if (Array.isArray(v)) { if (v.length > 0) parts.push((v as string[]).join(", ")); }
      else if (typeof v === "number") parts.push(String(v));
      else if (typeof v === "string" && v.trim() && !v.startsWith("data:")) parts.push(v.trim());
    }
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
    description: descriptionFrom(req.answers, req.categoryId),
    budget,
    budgetLabel,
    urgency: urgencyFrom(req.answers),
    location: req.region ?? locationFrom(req.answers),
    customerName: (() => {
      const reg = req.customerId ? getCustomerFromRegistry(req.customerId) : null;
      return reg?.name || req.customerName || "Xaridor";
    })(),
    customerId: req.customerId ?? "",
    createdAt: req.createdAt,
    status,
    answers: req.answers,
    region: req.region,
    district: req.district,
  };
}

/* ─── Requests API ───────────────────────────────────────────────── */

const BUYER_REQUESTS_KEY_CONST = "hormang_requests";

export function getMatchingRequests(
  selectedCategories: string[],
  serviceAreas: string[] = [],
  providerId: string = "",
): ProviderRequest[] {
  const buyerReqs = readJSON<CustomerRequest[]>(BUYER_REQUESTS_KEY_CONST, []);
  const statuses = getProviderStatuses(providerId);

  // Requests that have an accepted offer from a DIFFERENT provider should be hidden
  // unless the current provider also sent an offer (they should still see their "responded" entry)
  const sharedOffers = readJSON<Array<{ requestId: string; masterId: string; status: string }>>(
    SHARED_OFFERS_KEY, []
  );
  const providerOfferRequestIds = new Set(
    sharedOffers.filter((o) => o.masterId === providerId).map((o) => o.requestId)
  );
  const acceptedByOtherRequestIds = new Set(
    sharedOffers
      .filter((o) => o.status === "accepted" && o.masterId !== providerId)
      .map((o) => o.requestId)
  );

  return buyerReqs
    .filter((r) => {
      if (r.status !== "open") return false;
      if (!doesRequestMatch(r.categoryName, r.region, selectedCategories, serviceAreas)) return false;
      // If another provider's offer was accepted, only show to this provider if they also offered
      if (acceptedByOtherRequestIds.has(r.id) && !providerOfferRequestIds.has(r.id)) return false;
      return true;
    })
    .map((r) => adaptBuyerRequest(r, statuses[r.id]))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getProviderRequests(providerId: string = ""): ProviderRequest[] {
  return getMatchingRequests([], [], providerId);
}

export function getProviderRequestById(id: string, providerId: string = ""): ProviderRequest | undefined {
  return getMatchingRequests([], [], providerId).find((r) => r.id === id);
}

export function updateProviderRequestStatus(
  id: string,
  status: ProviderRequest["status"],
  providerId: string = "",
): void {
  if (status === "open") return;
  const statuses = getProviderStatuses(providerId);
  writeJSON(providerStatusesKey(providerId), { ...statuses, [id]: status as ProviderActionStatus });
}

/* ─── Seen IDs ───────────────────────────────────────────────────── */

export function getSeenIds(): string[] {
  return readJSON<string[]>(SEEN_KEY, []);
}

export function markSeen(id: string): void {
  const seen = getSeenIds();
  if (!seen.includes(id)) writeJSON(SEEN_KEY, [...seen, id]);
}

export function markAllSeen(
  selectedCategories: string[] = [],
  serviceAreas: string[] = [],
  providerId: string = "",
): void {
  const ids = getMatchingRequests(selectedCategories, serviceAreas, providerId).map((r) => r.id);
  const existing = getSeenIds();
  const merged = Array.from(new Set([...existing, ...ids]));
  writeJSON(SEEN_KEY, merged);
}

export function getUnseenRequests(
  selectedCategories: string[] = [],
  serviceAreas: string[] = [],
  providerId: string = "",
): ProviderRequest[] {
  const seen = getSeenIds();
  return getMatchingRequests(selectedCategories, serviceAreas, providerId).filter(
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

/* ─── Provider Chats (unified — reads from hormang_chats, filtered by masterId) ── */

export function getProviderChats(masterId: string = ""): ProviderChat[] {
  const all = getChats();
  const filtered = masterId ? all.filter((c) => c.masterId === masterId) : all;
  return filtered.map(chatToProviderChat);
}

export function getProviderChatById(id: string, masterId: string = ""): ProviderChat | undefined {
  const chat = getChatById(id);
  if (!chat) return undefined;
  if (masterId && chat.masterId !== masterId) return undefined;
  return chatToProviderChat(chat);
}

/**
 * Send a message as provider ("master" in unified store).
 * Triggers store change event so customer chat page refreshes.
 */
export function sendProviderMessage(chatId: string, sender: "provider" | "customer", text: string): ProviderChat | null {
  const unifiedSender = sender === "provider" ? "master" : "customer";
  const updated = sendMessage(chatId, unifiedSender, text);
  return updated ? chatToProviderChat(updated) : null;
}

/** Mark all provider-unread messages in this chat as read */
export function markChatRead(chatId: string): void {
  markProviderChatRead(chatId);
}

/** Total unread messages for a specific provider across their chats */
export function getTotalUnread(masterId: string = ""): number {
  const all = getChats();
  const filtered = masterId ? all.filter((c) => c.masterId === masterId) : all;
  return filtered.reduce((sum, c) => sum + (c.providerUnread ?? 0), 0);
}

/* ─── Offers ─────────────────────────────────────────────────────── */

/** Get this provider's own submitted offers */
export function getOffers(providerId: string = ""): ProviderOffer[] {
  return readJSON<ProviderOffer[]>(providerOffersKey(providerId), []);
}

/** Get this provider's offer for a specific request (if any) */
export function getOfferByRequestId(requestId: string, providerId: string = ""): ProviderOffer | undefined {
  const providerOffer = getOffers(providerId).find((o) => o.requestId === requestId);
  if (!providerOffer) return undefined;

  // Overlay status from shared hormang_offers so customer acceptance is visible instantly
  try {
    const sharedOffer = readJSON<Array<{ id: string; masterId: string; status: string }>>(SHARED_OFFERS_KEY, [])
      .find((o) => o.id === providerOffer.id && o.masterId === providerId);
    if (sharedOffer && sharedOffer.status !== providerOffer.status) {
      return { ...providerOffer, status: sharedOffer.status as ProviderOffer["status"] };
    }
  } catch (_) {}

  return providerOffer;
}

export interface ProviderOfferExtra {
  requestId: string;
  providerName?: string;
  providerInitials?: string;
  providerColor?: string;
}

export function saveOffer(
  data: Omit<ProviderOffer, "id" | "createdAt" | "status">,
  providerMeta?: { name: string; initials: string; color: string; id: string },
): ProviderOffer {
  const providerId = providerMeta?.id ?? "";
  const offers = getOffers(providerId);
  const offer: ProviderOffer = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const allOffers = [...offers, offer];
  writeJSON(providerOffersKey(providerId), allOffers);

  // Sync offer count to the buyer-side CustomerRequest using shared offers count
  try {
    const raw = localStorage.getItem(BUYER_REQUESTS_KEY_CONST);
    if (raw) {
      const buyerReqs = JSON.parse(raw) as Array<{ id: string; offerCount?: number }>;
      const idx = buyerReqs.findIndex((r) => r.id === data.requestId);
      if (idx !== -1) {
        // Count ALL providers' shared offers for this request (not just this provider's)
        const sharedOffers = readJSON<Array<{ requestId: string }>>(SHARED_OFFERS_KEY, []);
        const count = sharedOffers.filter((o) => o.requestId === data.requestId).length + 1;
        buyerReqs[idx] = { ...buyerReqs[idx], offerCount: count };
        localStorage.setItem(BUYER_REQUESTS_KEY_CONST, JSON.stringify(buyerReqs));
      }
    }
  } catch (_) {}

  // Write to shared hormang_offers so customer can see and accept/reject
  if (providerMeta) {
    try {
      const existingRaw = localStorage.getItem(SHARED_OFFERS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const buyerOffer = {
        id: offer.id,
        requestId: offer.requestId,
        masterId: providerMeta.id,
        masterName: providerMeta.name,
        masterInitials: providerMeta.initials,
        masterColor: providerMeta.color,
        price: offer.price,
        priceLabel: offer.priceLabel,
        message: offer.message,
        completionTime: offer.completionTime,
        startDate: offer.startDate,
        fileUrls: offer.fileUrls,
        avgResponseTime: getAvgResponseMinutes(),
        createdAt: offer.createdAt,
        status: "pending",
      };
      localStorage.setItem(SHARED_OFFERS_KEY, JSON.stringify([...existing, buyerOffer]));
    } catch (_) {}
  }

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

/**
 * Count total offers for a request from ALL providers (reads shared hormang_offers).
 * This is what gets displayed on request cards so providers see real competition.
 */
export function getRequestOfferCount(requestId: string): number {
  const sharedOffers = readJSON<Array<{ requestId: string }>>(SHARED_OFFERS_KEY, []);
  return sharedOffers.filter((o) => o.requestId === requestId).length;
}

/**
 * Requests with zero offers from any provider.
 * The current provider's responded requests are included unless they've already
 * submitted an offer (which would make the count non-zero).
 */
export function getRequestsWithZeroOffers(
  selectedCategories: string[] = [],
  serviceAreas: string[] = [],
  providerId: string = "",
): ProviderRequest[] {
  const sharedOffers = readJSON<Array<{ requestId: string }>>(SHARED_OFFERS_KEY, []);
  return getMatchingRequests(selectedCategories, serviceAreas, providerId).filter(
    (r) => r.status !== "ignored" && !sharedOffers.some((o) => o.requestId === r.id)
  );
}

/* ─── Create chat from offer (unified store) ──────────────────────── */

/**
 * Creates the chat thread in the unified hormang_chats store.
 * Uses deterministic ID `${requestId}_${masterId}` so customer can find it.
 * Called after provider submits offer form.
 */
export function createChatFromOffer(
  request: ProviderRequest,
  offer: ProviderOffer,
  masterId: string,
  providerMeta?: { name: string; initials: string; color: string },
): void {
  const chatId = `${request.id}_${masterId}`;
  const CHATS_KEY = "hormang_chats";

  const existing = readJSON<Chat[]>(CHATS_KEY, []).find((c) => c.id === chatId);
  if (existing) return;

  /* Resolve real customer name from registry (covers old requests without stored name) */
  const regEntry = request.customerId ? getCustomerFromRegistry(request.customerId) : null;
  const resolvedCustomerName = regEntry?.name || request.customerName || "Xaridor";
  const custInitials = regEntry?.initials || (resolvedCustomerName
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "X");

  const palette = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];
  const color = palette[Math.floor(Math.random() * palette.length)];

  const offerText = `Taklif narxi: ${offer.priceLabel}\nBajarish muddati: ${offer.completionTime}\n\n${offer.message}`;

  const newChat: Chat = {
    id: chatId,
    requestId: request.id,
    masterId,
    masterName: providerMeta?.name ?? "Ijrochi",
    masterInitials: providerMeta?.initials ?? "IJ",
    masterColor: providerMeta?.color ?? "#7C3AED",
    avgResponseTime: getAvgResponseMinutes(),
    categoryName: request.categoryName,
    categoryEmoji: request.emoji,
    customerName: resolvedCustomerName,
    customerInitials: custInitials,
    customerColor: color,
    providerUnread: 0,
    messages: [
      {
        id: uid(),
        sender: "master",
        text: offerText,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  writeJSON(CHATS_KEY, [...chats, newChat]);
}
