/**
 * provider-store.ts
 * localStorage persistence for provider (ijrochi) side.
 *
 * Keys used:
 *   hormang_provider_requests  — provider action statuses (seen/ignored/responded)
 *   hormang_provider_services  — UpcomingService[]
 *   hormang_provider_seen      — string[] (seen request IDs)
 *   hormang_provider_offers    — ProviderOffer[] (provider's own submitted offers)
 *   hormang_offers             — Offer[] (shared; customer reads here, provider syncs status from here)
 *   hormang_chats              — Chat[]  (SHARED with customer side — unified store)
 */

import { emitStoreChange } from "./store-events";
import type { CustomerRequest, Chat } from "./requests-store";
import {
  getChatById, sendMessage, markProviderChatRead,
  getTotalProviderUnread, getChats,
} from "./requests-store";
import { doesRequestMatch } from "./matching";

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
  avgResponseTime: number;
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
const SEEN_KEY = "hormang_provider_seen";
const OFFERS_KEY = "hormang_provider_offers";   // provider's own offer records
const SHARED_OFFERS_KEY = "hormang_offers";     // shared with customer
const AVG_RESPONSE_KEY = "hormang_provider_avg_response";
const SEED_VERSION_KEY = "hormang_provider_seed_version";
const SEED_VERSION = "v4";

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

function clearLegacyData() {
  const version = localStorage.getItem(SEED_VERSION_KEY);
  if (version !== SEED_VERSION) {
    localStorage.removeItem(REQUESTS_KEY);
    localStorage.removeItem(SERVICES_KEY);
    localStorage.removeItem(OFFERS_KEY);
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem("hormang_provider_chats"); // old key
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
  return {
    id: c.id,
    customerId: c.requestId,
    customerName: c.customerName || "Foydalanuvchi",
    customerInitials: c.customerInitials || "FO",
    customerColor: c.customerColor || "#7C3AED",
    categoryName: c.categoryName,
    categoryEmoji: c.categoryEmoji || "📋",
    avgResponseTime: c.avgResponseTime ?? 14,
    messages: c.messages.map((m) => ({
      id: m.id,
      sender: m.sender === "customer" ? "customer" : "provider",
      text: m.text,
      timestamp: m.timestamp,
    })),
    unread: c.providerUnread ?? 0,
    createdAt: c.createdAt,
  };
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
    location: req.region ?? locationFrom(req.answers),
    customerName: "Foydalanuvchi",
    customerId: req.id,
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
): ProviderRequest[] {
  const buyerReqs = readJSON<CustomerRequest[]>(BUYER_REQUESTS_KEY_CONST, []);
  const statuses = getProviderStatuses();
  return buyerReqs
    .filter((r) => r.status === "open" && doesRequestMatch(r.categoryName, r.region, selectedCategories, serviceAreas))
    .map((r) => adaptBuyerRequest(r, statuses[r.id]))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

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

export function markAllSeen(selectedCategories: string[] = [], serviceAreas: string[] = []): void {
  const ids = getMatchingRequests(selectedCategories, serviceAreas).map((r) => r.id);
  const existing = getSeenIds();
  const merged = Array.from(new Set([...existing, ...ids]));
  writeJSON(SEEN_KEY, merged);
}

export function getUnseenRequests(selectedCategories: string[] = [], serviceAreas: string[] = []): ProviderRequest[] {
  const seen = getSeenIds();
  return getMatchingRequests(selectedCategories, serviceAreas).filter(
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

/* ─── Provider Chats (unified — reads from hormang_chats) ─────────── */

export function getProviderChats(): ProviderChat[] {
  return getChats().map(chatToProviderChat);
}

export function getProviderChatById(id: string): ProviderChat | undefined {
  const chat = getChatById(id);
  return chat ? chatToProviderChat(chat) : undefined;
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

/** Total unread messages for provider across all chats */
export function getTotalUnread(): number {
  return getTotalProviderUnread();
}

/* ─── Offers ─────────────────────────────────────────────────────── */

export function getOffers(): ProviderOffer[] {
  return readJSON<ProviderOffer[]>(OFFERS_KEY, []);
}

export function getOfferByRequestId(requestId: string): ProviderOffer | undefined {
  const providerOffer = readJSON<ProviderOffer[]>(OFFERS_KEY, []).find(
    (o) => o.requestId === requestId
  );
  if (!providerOffer) return undefined;

  // Overlay status from shared hormang_offers so customer acceptance is visible instantly
  try {
    const sharedOffer = readJSON<Array<{ id: string; status: string }>>(SHARED_OFFERS_KEY, [])
      .find((o) => o.id === providerOffer.id);
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
  const offers = getOffers();
  const offer: ProviderOffer = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const allOffers = [...offers, offer];
  writeJSON(OFFERS_KEY, allOffers);

  // Sync offer count to the buyer-side CustomerRequest
  try {
    const raw = localStorage.getItem(BUYER_REQUESTS_KEY_CONST);
    if (raw) {
      const buyerReqs = JSON.parse(raw) as Array<{ id: string; offerCount?: number }>;
      const idx = buyerReqs.findIndex((r) => r.id === data.requestId);
      if (idx !== -1) {
        const count = allOffers.filter((o) => o.requestId === data.requestId).length;
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

export function getRequestOfferCount(requestId: string): number {
  return getOffers().filter((o) => o.requestId === requestId).length;
}

export function getRequestsWithZeroOffers(selectedCategories: string[] = [], serviceAreas: string[] = []): ProviderRequest[] {
  const offers = getOffers();
  return getMatchingRequests(selectedCategories, serviceAreas).filter(
    (r) => r.status === "open" && !offers.some((o) => o.requestId === r.id)
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

  const custInitials = request.customerName
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "FO";

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
    customerName: request.customerName,
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
