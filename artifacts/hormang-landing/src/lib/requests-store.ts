/**
 * requests-store.ts
 * localStorage persistence for customer requests, offers, and chats.
 *
 * Keys:
 *   hormang_requests  — CustomerRequest[]
 *   hormang_offers    — Offer[]
 *   hormang_chats     — Chat[]
 */

import { emitStoreChange } from "./store-events";

/* ─── Types ──────────────────────────────────────────────────────── */

export interface CustomerRequest {
  id: string;
  categoryId: string;
  categoryName: string;
  emoji: string;
  answers: Record<string, unknown>;
  status: "open" | "accepted" | "completed" | "cancelled";
  createdAt: string;
  offerCount: number;
  region?: string;
  district?: string;
}

export interface Offer {
  id: string;
  requestId: string;
  masterId: string;
  masterName: string;
  masterInitials: string;
  masterColor: string;
  price: number;
  message: string;
  avgResponseTime: number; // minutes
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "master";
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  requestId: string;
  masterId: string;
  masterName: string;
  masterInitials: string;
  masterColor: string;
  avgResponseTime: number;
  categoryName: string;
  messages: ChatMessage[];
  createdAt: string;
}

/* ─── Storage Keys ───────────────────────────────────────────────── */

const REQUESTS_KEY = "hormang_requests";
const OFFERS_KEY = "hormang_offers";
const CHATS_KEY = "hormang_chats";

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
  localStorage.setItem(key, JSON.stringify(data));
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
): CustomerRequest {
  const region = location?.region || (answers["region"] as string | undefined);
  const district = location?.district || (answers["district"] as string | undefined);

  const req: CustomerRequest = {
    id: uid(),
    categoryId,
    categoryName,
    emoji: CATEGORY_EMOJIS[categoryId] ?? "📋",
    answers,
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

function updateRequestOfferCount(requestId: string, count: number): void {
  const reqs = readJSON<CustomerRequest[]>(REQUESTS_KEY, []);
  writeJSON(REQUESTS_KEY, reqs.map((r) => r.id === requestId ? { ...r, offerCount: count } : r));
}

export function updateRequestStatus(requestId: string, status: CustomerRequest["status"]): void {
  const reqs = readJSON<CustomerRequest[]>(REQUESTS_KEY, []);
  writeJSON(REQUESTS_KEY, reqs.map((r) => r.id === requestId ? { ...r, status } : r));
}

/* ─── Offers ─────────────────────────────────────────────────────── */

export function getOffers(): Offer[] {
  return readJSON<Offer[]>(OFFERS_KEY, []);
}

export function getOffersByRequestId(requestId: string): Offer[] {
  return getOffers().filter((o) => o.requestId === requestId);
}

export function updateOfferStatus(offerId: string, status: "accepted" | "rejected"): void {
  const offers = getOffers().map((o) => o.id === offerId ? { ...o, status } : o);
  writeJSON(OFFERS_KEY, offers);
}


/* ─── Chats ──────────────────────────────────────────────────────── */

export function getChats(): Chat[] {
  return readJSON<Chat[]>(CHATS_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getChatById(id: string): Chat | undefined {
  return getChats().find((c) => c.id === id);
}

/** Create or return an existing chat for a request+master pair */
export function getOrCreateChat(
  requestId: string,
  masterId: string,
  masterName: string,
  masterInitials: string,
  masterColor: string,
  avgResponseTime: number,
  categoryName: string
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
    messages: [],
    createdAt: new Date().toISOString(),
  };

  const existing2 = readJSON<Chat[]>(CHATS_KEY, []);
  writeJSON(CHATS_KEY, [chat, ...existing2]);
  return chat;
}

/** Send a message and return the updated chat */
export function sendMessage(chatId: string, sender: "customer" | "master", text: string): Chat | null {
  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return null;

  const msg: ChatMessage = { id: uid(), sender, text, timestamp: new Date().toISOString() };
  chats[idx] = { ...chats[idx], messages: [...chats[idx].messages, msg] };
  writeJSON(CHATS_KEY, chats);
  return chats[idx];
}

/** Get the latest chat across all requests (for bottom nav redirect) */
export function getLatestChatId(): string | null {
  const chats = getChats();
  return chats.length > 0 ? chats[0].id : null;
}
