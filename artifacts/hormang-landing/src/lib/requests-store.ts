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

/* ─── Types ──────────────────────────────────────────────────────── */

export interface CustomerRequest {
  id: string;
  customerId?: string;       // The user.id of the customer who created this request
  customerName?: string;     // Display name of the customer (shown on provider side)
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
  priceLabel?: string;
  message: string;
  completionTime?: string;
  startDate?: string;
  fileUrls?: string[];
  avgResponseTime: number; // minutes
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "master" | "system"; // master = provider/ijrochi; system = automated notification
  text: string;
  timestamp: string;
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
): CustomerRequest {
  const region = location?.region || (answers["region"] as string | undefined);
  const district = location?.district || (answers["district"] as string | undefined);

  const req: CustomerRequest = {
    id: uid(),
    customerId: customerId || undefined,
    customerName: customerName || undefined,
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

export function updateOfferStatus(offerId: string, status: "accepted" | "rejected"): void {
  const allOffers = getOffers();
  const target = allOffers.find((o) => o.id === offerId);
  const updated = allOffers.map((o) => o.id === offerId ? { ...o, status } : o);
  writeJSON(OFFERS_KEY, updated);
  console.log(`[Hormang] ✅ Offer ${status === "accepted" ? "qabul qilindi" : "rad etildi"}`, { offerId, status });

  // When an offer is accepted, notify all OTHER providers who also offered on this request
  if (status === "accepted" && target) {
    const siblings = allOffers.filter(
      (o) => o.requestId === target.requestId && o.id !== offerId
    );
    for (const sib of siblings) {
      sendSystemMessage(
        `${sib.requestId}_${sib.masterId}`,
        "Xaridor boshqa ijrochi taklifini qabul qildi"
      );
    }
  }

  emitStoreChange();
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
    customerName: customerMeta?.name ?? "Xaridor",
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
export function sendMessage(chatId: string, sender: "customer" | "master", text: string): Chat | null {
  const chats = readJSON<Chat[]>(CHATS_KEY, []);
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return null;

  const msg: ChatMessage = { id: uid(), sender, text, timestamp: new Date().toISOString() };
  const prevUnread = chats[idx].providerUnread ?? 0;
  const providerUnread = sender === "customer" ? prevUnread + 1 : prevUnread;
  chats[idx] = { ...chats[idx], messages: [...chats[idx].messages, msg], providerUnread };
  writeJSON(CHATS_KEY, chats);
  console.log(`[Hormang] 💬 Xabar yuborildi`, { chatId, sender, text: text.slice(0, 50) });
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
