/**
 * /provider/chats — Suhbatlarim page (Provider side)
 * - Search bar
 * - Sorting tabs: All | Unread | By service
 * - Chat rows with last message + unread badge + offer status
 * - Inline ChatView matches customer chat quality (day groups, animated bubbles)
 * - Customer avatar in header is clickable → shows customer profile modal
 * - Input disabled when offer is rejected
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageCircle, ChevronRight, X, ChevronDown,
  Circle, Send, CheckCircle2, Clock,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import {
  getProviderChats, markChatRead, sendProviderMessage, getProviderChatById,
  type ProviderChat, type ProviderChatMessage,
} from "@/lib/provider-store";
import { getOfferForChat, type Offer } from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";
import logoImg from "/hormang-logo.png";
import { PublicProfilePreviewModal } from "@/components/public-profile-preview-modal";

/* ─── Constants ──────────────────────────────────────────────────── */
const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

const SERVICE_CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enagalik", "Tadbir xizmatlari",
  "Ko'chirish yuk yetkazish", "Go'zallik", "Avto xizmat", "Repetitorlar", "Ustachilik",
];

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Bugun";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Kecha";
  return d.toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

/* ─── Offer Status Badge ──────────────────────────────────────────── */
function OfferStatusBadge({ status }: { status: Offer["status"] }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Qabul qilindi
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <X className="w-3 h-3" />
        Rad etildi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      Kutilmoqda
    </span>
  );
}

/* ─── Status Banner (inside message list) ────────────────────────── */
function StatusBanner({ status }: { status: Offer["status"] }) {
  if (status === "accepted") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center my-4"
      >
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-emerald-700 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Taklif qabul qilindi — Suhbat davom etmoqda
        </div>
      </motion.div>
    );
  }
  if (status === "rejected") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center my-4"
      >
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 text-red-600 text-xs font-semibold shadow-sm">
          <X className="w-4 h-4 flex-shrink-0" />
          Taklif rad etildi. Suhbat yopildi.
        </div>
      </motion.div>
    );
  }
  return null;
}

/* ─── Day Separator ──────────────────────────────────────────────── */
function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] font-semibold text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

/* ─── Message Bubble (Provider side) ────────────────────────────── */
function MsgBubble({ msg, isFirst }: { msg: ProviderChatMessage; isFirst: boolean }) {
  // System notifications render as centered pills
  if (msg.sender === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-2"
      >
        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
          {msg.text}
        </span>
      </motion.div>
    );
  }
  const isMe = msg.sender === "provider";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${isFirst ? "" : "mt-1"}`}
    >
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? "text-white rounded-br-md shadow-sm"
            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm"
        }`}
        style={isMe ? { background: VIOLET } : {}}
      >
        <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-violet-200" : "text-gray-400"}`}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Inline Chat View ───────────────────────────────────────────── */
function ChatView({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  useStoreRefresh();
  const [text, setText] = useState("");
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    markChatRead(chatId);
  }, [chatId]);

  const chat = getProviderChatById(chatId) ?? null;
  const offer = chat ? getOfferForChat(chat.requestId, chat.masterId) : undefined;
  const isRejected = offer?.status === "rejected";

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(timer);
  }, [chat?.messages.length]);

  function send() {
    if (!text.trim() || isRejected) return;
    sendProviderMessage(chatId, "provider", text.trim());
    setText("");
  }

  if (!chat) return null;

  // Group messages by day
  const grouped: Array<{ day: string; messages: ProviderChatMessage[] }> = [];
  for (const msg of chat.messages) {
    const day = formatDay(msg.timestamp);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.messages.push(msg);
    else grouped.push({ day, messages: [msg] });
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed inset-0 bg-gray-50 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 shadow-sm">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clickable customer avatar */}
        <button
          onClick={() => setShowCustomerProfile(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm active:scale-95 transition-transform ring-2 ring-transparent hover:ring-violet-300"
          style={{ background: chat.customerColor }}
        >
          {chat.customerInitials}
        </button>

        {/* Clickable name + subtitle area */}
        <button
          onClick={() => setShowCustomerProfile(true)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="font-extrabold text-sm text-gray-900 truncate">{chat.customerName}</p>
          <div className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 flex-shrink-0" />
            <p className="text-[11px] text-gray-400">
              O'rtacha javob vaqti: {chat.avgResponseTime} daqiqa
            </p>
          </div>
        </button>

        {/* Live offer status badge */}
        {offer && (
          <div className="flex-shrink-0">
            <OfferStatusBadge status={offer.status} />
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {grouped.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Hozircha xabar yo'q
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.day}>
            <DaySeparator label={group.day} />
            <div className="space-y-1">
              {group.messages.map((msg, i) => (
                <MsgBubble
                  key={msg.id}
                  msg={msg}
                  isFirst={i === 0 || group.messages[i - 1].sender !== msg.sender}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Status banner after messages */}
        {offer && offer.status !== "pending" && (
          <StatusBanner status={offer.status} />
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input — disabled when offer is rejected */}
      {isRejected ? (
        <div className="bg-red-50 border-t border-red-100 px-4 py-4 flex items-center justify-center gap-2">
          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-500">
            Taklif rad etildi. Suhbat yopildi.
          </p>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 items-center shadow-sm">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Xabar yozing..."
            className="flex-1 h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            style={{ background: VIOLET }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer profile modal */}
      <AnimatePresence>
        {showCustomerProfile && (
          <PublicProfilePreviewModal
            key={`provider-chats-customer-${chat.customerId}`}
            mode="customer"
            customerData={{
              customerName: chat.customerName,
              customerInitials: chat.customerInitials,
              customerColor: chat.customerColor,
              customerId: chat.customerId,
              region: chat.region,
              district: chat.district,
            }}
            onClose={() => setShowCustomerProfile(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Chat Row ───────────────────────────────────────────────────── */
function ChatRow({ chat, index, onClick }: { chat: ProviderChat; index: number; onClick: () => void }) {
  const lastMsg = chat.messages[chat.messages.length - 1];
  const offer = getOfferForChat(chat.requestId, chat.masterId);
  const st = offer?.status ?? "pending";

  const borderCls =
    st === "accepted" ? "border-emerald-100 hover:border-emerald-200" :
    st === "rejected" ? "border-red-100 hover:border-red-200" :
    "border-gray-100 hover:border-violet-100";

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className={`w-full bg-white rounded-2xl border p-4 flex items-start gap-3 hover:shadow-sm transition-all duration-200 text-left active:scale-[.99] ${borderCls}`}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
        style={{ background: chat.customerColor }}
      >
        {chat.customerInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-bold text-sm text-gray-900 truncate">{chat.customerName}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {formatTime(lastMsg?.timestamp ?? chat.createdAt)}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium mb-1">{chat.categoryEmoji} {chat.categoryName}</p>
        {offer && <OfferStatusBadge status={offer.status} />}
        {lastMsg && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            {lastMsg.sender === "provider" ? "Siz: " : ""}{lastMsg.text}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-1">
        {chat.unread > 0 ? (
          <span
            className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            style={{ background: "hsl(262,80%,54%)" }}
          >
            {chat.unread}
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </motion.button>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
type SortTab = "all" | "unread" | "by-service";

export default function ProviderChatsPage() {
  useStoreRefresh();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<SortTab>("all");
  const [query, setQuery] = useState("");
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const { user } = useAuth();
  const masterId = user?.id ?? "";

  const chats = getProviderChats(masterId);
  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);
  const services = SERVICE_CATEGORIES;

  let displayed = chats;
  if (tab === "unread") displayed = chats.filter((c) => c.unread > 0);
  if (tab === "by-service") {
    const source = selectedService
      ? chats.filter((c) => c.categoryName === selectedService)
      : chats;
    displayed = [...source].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    displayed = displayed.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
    );
  }

  const tabs: Array<{ id: SortTab; label: string; count?: number }> = [
    { id: "all", label: "Barchasi", count: chats.length },
    { id: "unread", label: "O'qilmagan", count: totalUnread || undefined },
    { id: "by-service", label: "Xizmat bo'yicha" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setLocation("/provider")} className="flex items-center flex-shrink-0">
              <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
            </button>
            <div className="flex-1">
              <h1 className="font-extrabold text-sm text-gray-900">Suhbatlarim</h1>
              <p className="text-xs text-gray-400">
                {totalUnread > 0 ? `${totalUnread} ta o'qilmagan` : `${chats.length} ta suhbat`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Xaridor yoki xizmat..."
              className="w-full h-10 pl-9 pr-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  if (t.id !== "by-service") setSelectedService(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  tab === t.id
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={tab === t.id ? { background: VIOLET } : {}}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                    tab === t.id ? "bg-white text-violet-700" : "bg-violet-500 text-white"
                  }`}>
                    {t.count}
                  </span>
                )}
                {t.id === "by-service" && tab === "by-service" && (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>

          {/* Service filter dropdown */}
          {tab === "by-service" && (
            <div className="mt-2 relative">
              <button
                onClick={() => setShowServiceMenu((v) => !v)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-left flex items-center justify-between text-gray-700"
              >
                {selectedService ?? "Barcha xizmatlar"}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showServiceMenu && (
                <div className="absolute left-0 right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => { setSelectedService(null); setShowServiceMenu(false); }}
                    className="w-full px-4 py-2.5 text-xs text-left text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                  >
                    Barcha xizmatlar
                  </button>
                  {services.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedService(s); setShowServiceMenu(false); }}
                      className="w-full px-4 py-2.5 text-xs text-left text-gray-800 hover:bg-violet-50 hover:text-violet-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat list */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-bold text-gray-600 mb-1">Suhbatlar yo'q</p>
            <p className="text-sm text-gray-400">
              {tab === "unread" ? "Barcha xabarlar o'qilgan." : "Hozircha suhbat mavjud emas."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((chat, i) => (
              <ChatRow
                key={chat.id}
                chat={chat}
                index={i}
                onClick={() => setOpenChatId(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inline chat view */}
      <AnimatePresence>
        {openChatId && (
          <ChatView
            key={openChatId}
            chatId={openChatId}
            onClose={() => setOpenChatId(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
