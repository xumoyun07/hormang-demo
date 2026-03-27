/**
 * requests-store.ts
 * localStorage persistence for customer requests, offers, and chats.
 *
 * Keys:
 *   hormang_requests  — CustomerRequest[]
 *   hormang_offers    — Offer[]
 *   hormang_chats     — Chat[]
 */

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

/* ─── Mock Data ──────────────────────────────────────────────────── */

export const MOCK_MASTERS = [
  { id: "m1", name: "Alisher T.", initials: "AT", color: "#2563EB", avgResponseTime: 15 },
  { id: "m2", name: "Gulnora S.", initials: "GS", color: "#059669", avgResponseTime: 22 },
  { id: "m3", name: "Jasur B.", initials: "JB", color: "#7C3AED", avgResponseTime: 35 },
  { id: "m4", name: "Malika R.", initials: "MR", color: "#D97706", avgResponseTime: 12 },
  { id: "m5", name: "Firdavs N.", initials: "FN", color: "#DC2626", avgResponseTime: 45 },
  { id: "m6", name: "Barno U.", initials: "BU", color: "#0891B2", avgResponseTime: 28 },
];

const OFFER_MESSAGES = [
  "Assalomu alaykum! So'rovingizni ko'rdim. Yordam bera olaman, bugun bo'sh vaqtim bor.",
  "Salom! Bu ish bo'yicha tajribam bor. Kelishib olamiz.",
  "Xizmat ko'rsatishga tayyorman. Sifatni kafolatlayman va o'z vaqtida bajaraman.",
  "Men bu ishda mutaxassisман. Tez va sifatli bajaraman, narx kelishiladi.",
  "Assalomu alaykum! Taklifimni ko'rib chiqing. Savollar bo'lsa, javob beraman.",
  "Salom! Sizning so'rovingiz bilan ishlay olaman. Narxga kelishamiz.",
];

const MASTER_GREETINGS = [
  "Assalomu alaykum! So'rovingizni ko'rdim. Qanday yordam bera olaman?",
  "Salom! Taklifimni ko'rgan bo'lsangiz, savollar bo'lsa bering.",
  "Assalomu alaykum! Men ishni bajarishga tayyorman. Batafsil gaplashaylik.",
  "Salom! Bu ish bo'yicha savol bo'lsa so'rang.",
];

/** Base prices per category (so'm) for "open to offers" requests */
const CATEGORY_BASE_PRICES: Record<string, number> = {
  tamirlash: 250_000,
  tozalash: 150_000,
  avto: 120_000,
  kochirish: 350_000,
  repetitor: 80_000,
  tadbir: 600_000,
  gozallik: 130_000,
  enaga: 70_000,
  ustachilik: 400_000,
};

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
  answers: Record<string, unknown>
): CustomerRequest {
  const req: CustomerRequest = {
    id: uid(),
    categoryId,
    categoryName,
    emoji: CATEGORY_EMOJIS[categoryId] ?? "📋",
    answers,
    status: "open",
    createdAt: new Date().toISOString(),
    offerCount: 0,
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

/** Generates 2–4 mock offers for a given request and saves them */
export function generateOffersForRequest(
  requestId: string,
  categoryId: string,
  answers: Record<string, unknown>
): Offer[] {
  const budget = answers["budget"] as number | undefined;
  const openToOffers = answers["budget_open"] as boolean | undefined;
  const basePrice = budget && !openToOffers && budget > 0
    ? budget
    : (CATEGORY_BASE_PRICES[categoryId] ?? 200_000);

  // Pick 2-4 random masters
  const count = 2 + Math.floor(Math.random() * 3); // 2, 3 or 4
  const shuffled = [...MOCK_MASTERS].sort(() => Math.random() - 0.5).slice(0, count);

  const multipliers = [0.85, 0.95, 1.0, 1.1, 1.2, 1.3];

  const newOffers: Offer[] = shuffled.map((master, i) => ({
    id: uid(),
    requestId,
    masterId: master.id,
    masterName: master.name,
    masterInitials: master.initials,
    masterColor: master.color,
    price: Math.round(basePrice * multipliers[i % multipliers.length] / 1000) * 1000,
    message: OFFER_MESSAGES[Math.floor(Math.random() * OFFER_MESSAGES.length)],
    avgResponseTime: master.avgResponseTime,
    createdAt: new Date().toISOString(),
    status: "pending",
  }));

  const existing = readJSON<Offer[]>(OFFERS_KEY, []);
  writeJSON(OFFERS_KEY, [...newOffers, ...existing]);

  // Update request offer count
  updateRequestOfferCount(requestId, newOffers.length);

  // Pre-seed one chat with a greeting so the user can test immediately
  if (newOffers.length > 0) {
    const first = newOffers[0];
    const req = getRequestById(requestId);
    getOrCreateChat(
      requestId,
      first.masterId,
      first.masterName,
      first.masterInitials,
      first.masterColor,
      first.avgResponseTime,
      req?.categoryName ?? categoryId
    );
  }

  return newOffers;
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

  // First greeting from master
  const greeting: ChatMessage = {
    id: uid(),
    sender: "master",
    text: MASTER_GREETINGS[Math.floor(Math.random() * MASTER_GREETINGS.length)],
    timestamp: new Date().toISOString(),
  };

  const chat: Chat = {
    id: chatId,
    requestId,
    masterId,
    masterName,
    masterInitials,
    masterColor,
    avgResponseTime,
    categoryName,
    messages: [greeting],
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
