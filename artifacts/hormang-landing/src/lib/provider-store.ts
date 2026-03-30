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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number, time = "10:00"): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return {
    date: d.toISOString().slice(0, 10),
    time,
  };
}

/* ─── Mock Data Seed ──────────────────────────────────────────────── */

const MOCK_REQUESTS: ProviderRequest[] = [
  {
    id: "pr1",
    categoryId: "tamirlash",
    categoryName: "Ta'mirlash / Usta",
    emoji: "🔧",
    description: "Oshxonadagi kran oqyapti, urgent kerak, bugun yoki ertaga",
    budget: 150_000,
    budgetLabel: "150 000 so'm",
    urgency: "urgent",
    location: "Chilonzor tumani, Toshkent",
    customerName: "Bobur A.",
    createdAt: daysAgo(0),
    status: "open",
  },
  {
    id: "pr2",
    categoryId: "tozalash",
    categoryName: "Tozalik",
    emoji: "🧹",
    description: "3 xonali uy tozalash, chuqur tozalash kerak, 120 kv.m",
    budget: 200_000,
    budgetLabel: "200 000 so'm",
    urgency: "normal",
    location: "Yunusobod tumani, Toshkent",
    customerName: "Nodira B.",
    createdAt: daysAgo(0),
    status: "open",
  },
  {
    id: "pr3",
    categoryId: "elektr",
    categoryName: "Elektr ishlari",
    emoji: "⚡",
    description: "Rozetka va chiroq o'rnatish, 4 ta joy",
    budget: null,
    budgetLabel: "Kelishiladi",
    urgency: "flexible",
    location: "Mirzo Ulugbek tumani",
    customerName: "Sarvar T.",
    createdAt: daysAgo(1),
    status: "open",
  },
  {
    id: "pr4",
    categoryId: "repetitor",
    categoryName: "Repetitor",
    emoji: "📚",
    description: "11-sinf uchun matematika repetitori kerak, DTBT tayyorgarlik",
    budget: 100_000,
    budgetLabel: "100 000 so'm / dars",
    urgency: "normal",
    location: "Shayhontohur tumani",
    customerName: "Malika X.",
    createdAt: daysAgo(1),
    status: "open",
  },
  {
    id: "pr5",
    categoryId: "santexnika",
    categoryName: "Santexnika",
    emoji: "🚿",
    description: "Hammomda duş o'rnatish va eski trubalarni almashtirish",
    budget: 350_000,
    budgetLabel: "350 000 so'm",
    urgency: "normal",
    location: "Bektemir tumani",
    customerName: "Ulugbek R.",
    createdAt: daysAgo(2),
    status: "open",
  },
  {
    id: "pr6",
    categoryId: "tamirlash",
    categoryName: "Ta'mirlash / Usta",
    emoji: "🔧",
    description: "Eshikni o'rniga qo'yish kerak, petli singan",
    budget: 80_000,
    budgetLabel: "80 000 so'm",
    urgency: "urgent",
    location: "Olmazor tumani",
    customerName: "Dilnoza S.",
    createdAt: daysAgo(2),
    status: "open",
  },
  {
    id: "pr7",
    categoryId: "kochirish",
    categoryName: "Ko'chirish",
    emoji: "🚚",
    description: "3 xonali uydan ko'chirishga yordam, mebel ham bor",
    budget: 500_000,
    budgetLabel: "500 000 so'm",
    urgency: "flexible",
    location: "Sergeli tumani → Yakkasaroy",
    customerName: "Farhod M.",
    createdAt: daysAgo(3),
    status: "open",
  },
];

const MOCK_SERVICES: UpcomingService[] = [
  {
    id: "s1",
    title: "Kran ta'mirlash",
    customerName: "Jahongir T.",
    customerInitials: "JT",
    customerColor: "#2563EB",
    ...daysFromNow(1, "11:00"),
    location: "Chilonzor, 7-uy",
    categoryEmoji: "🔧",
    status: "upcoming",
  },
  {
    id: "s2",
    title: "Elektr quvur o'rnatish",
    customerName: "Shaxlo N.",
    customerInitials: "SN",
    customerColor: "#059669",
    ...daysFromNow(3, "14:00"),
    location: "Yunusobod, 17A",
    categoryEmoji: "⚡",
    status: "upcoming",
  },
  {
    id: "s3",
    title: "Duş ta'mirlash",
    customerName: "Behruz K.",
    customerInitials: "BK",
    customerColor: "#7C3AED",
    ...daysFromNow(5, "10:30"),
    location: "Mirzo Ulugbek",
    categoryEmoji: "🚿",
    status: "upcoming",
  },
];

const MOCK_CHATS: ProviderChat[] = [
  {
    id: "pc1",
    customerId: "c1",
    customerName: "Jahongir Toshmatov",
    customerInitials: "JT",
    customerColor: "#2563EB",
    categoryName: "Ta'mirlash",
    categoryEmoji: "🔧",
    messages: [
      { id: "m1", sender: "customer", text: "Salom! Kran ta'mirlash bo'yicha so'rov yubordim.", timestamp: daysAgo(1) },
      { id: "m2", sender: "provider", text: "Assalomu alaykum! Ko'rdim, bugun bo'sh vaqtim bor.", timestamp: daysAgo(1) },
      { id: "m3", sender: "customer", text: "Qachon kela olasiz?", timestamp: new Date(Date.now() - 3600_000).toISOString() },
    ],
    unread: 1,
    createdAt: daysAgo(1),
  },
  {
    id: "pc2",
    customerId: "c2",
    customerName: "Shaxlo Nazarova",
    customerInitials: "SN",
    customerColor: "#059669",
    categoryName: "Elektr ishlari",
    categoryEmoji: "⚡",
    messages: [
      { id: "m4", sender: "customer", text: "Assalomu alaykum! 4 ta rozetka o'rnatish kerak.", timestamp: daysAgo(2) },
      { id: "m5", sender: "provider", text: "Salom! Narx 80 000 so'm, kelishsak bo'ladi.", timestamp: daysAgo(2) },
      { id: "m6", sender: "customer", text: "Yaxshi, kelishildi!", timestamp: daysAgo(2) },
      { id: "m7", sender: "provider", text: "Demak ertaga 14:00 da boraman.", timestamp: daysAgo(1) },
    ],
    unread: 0,
    createdAt: daysAgo(2),
  },
  {
    id: "pc3",
    customerId: "c3",
    customerName: "Nodira Baxtiyorova",
    customerInitials: "NB",
    customerColor: "#D97706",
    categoryName: "Santexnika",
    categoryEmoji: "🚿",
    messages: [
      { id: "m8", sender: "customer", text: "Salom, hozir borish mumkinmi?", timestamp: new Date(Date.now() - 1800_000).toISOString() },
    ],
    unread: 1,
    createdAt: daysAgo(0),
  },
];

/* ─── Seed ────────────────────────────────────────────────────────── */

function seed() {
  const version = localStorage.getItem(SEED_VERSION_KEY);
  if (version !== SEED_VERSION) {
    if (version !== null) {
      writeJSON(CHATS_KEY, []);
    }
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }

  if (!localStorage.getItem(REQUESTS_KEY)) {
    writeJSON(REQUESTS_KEY, MOCK_REQUESTS);
  }
  if (!localStorage.getItem(SERVICES_KEY)) {
    writeJSON(SERVICES_KEY, MOCK_SERVICES);
  }
  if (!localStorage.getItem(CHATS_KEY)) {
    writeJSON(CHATS_KEY, []);
  }
}

/* ─── Requests API ───────────────────────────────────────────────── */

export function getProviderRequests(): ProviderRequest[] {
  seed();
  return readJSON<ProviderRequest[]>(REQUESTS_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getProviderRequestById(id: string): ProviderRequest | undefined {
  return getProviderRequests().find((r) => r.id === id);
}

export function updateProviderRequestStatus(id: string, status: ProviderRequest["status"]): void {
  const reqs = readJSON<ProviderRequest[]>(REQUESTS_KEY, []);
  writeJSON(REQUESTS_KEY, reqs.map((r) => r.id === id ? { ...r, status } : r));
}

/* ─── Seen IDs ───────────────────────────────────────────────────── */

export function getSeenIds(): string[] {
  return readJSON<string[]>(SEEN_KEY, []);
}

export function markSeen(id: string): void {
  const seen = getSeenIds();
  if (!seen.includes(id)) writeJSON(SEEN_KEY, [...seen, id]);
}

export function markAllSeen(): void {
  const ids = getProviderRequests().map((r) => r.id);
  writeJSON(SEEN_KEY, ids);
}

export function getUnseenRequests(): ProviderRequest[] {
  const seen = getSeenIds();
  return getProviderRequests().filter((r) => !seen.includes(r.id) && r.status === "open");
}

/* ─── Upcoming Services ──────────────────────────────────────────── */

export function getUpcomingServices(): UpcomingService[] {
  seed();
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
  seed();
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

export function getRequestsWithZeroOffers(): ProviderRequest[] {
  const offers = getOffers();
  return getProviderRequests().filter(
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
