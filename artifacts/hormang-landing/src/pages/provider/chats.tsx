/**
 * /provider/chats — Suhbatlarim page (Provider side)
 * - Search bar
 * - Sorting tabs: All | Unread | By service
 * - Chat rows with last message + unread badge
 * - Inline ChatView matches customer chat quality (day groups, animated bubbles)
 * - Customer avatar in header is clickable → shows customer profile modal
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageCircle, ChevronRight, X, ChevronDown,
  Circle, Send, Clock,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import {
  getProviderChats, markChatRead, sendProviderMessage, getProviderChatById,
  type ProviderChat, type ProviderChatMessage,
} from "@/lib/provider-store";
import logoImg from "/hormang-logo.png";

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

/* ─── Customer Profile Modal ─────────────────────────────────────── */
function CustomerProfileModal({ chat, onClose }: { chat: ProviderChat; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden"
      >
        {/* Hero — violet gradient */}
        <div className="px-5 pt-6 pb-5 text-center" style={{ background: VIOLET }}>
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{ background: chat.customerColor }}
          >
            <span className="text-2xl font-black text-white">{chat.customerInitials}</span>
          </div>
          <h3 className="font-extrabold text-white text-lg">{chat.customerName}</h3>
          <p className="text-violet-200 text-sm mt-0.5">Xaridor · Mijoz</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Category */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
            <span className="text-xl">{chat.categoryEmoji}</span>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">So'rov kategoriyasi</p>
              <p className="text-sm font-bold text-gray-800">{chat.categoryName}</p>
            </div>
          </div>

          {/* Avg response time */}
          <div className="flex items-center gap-3 bg-violet-50 rounded-2xl p-3.5 border border-violet-100">
            <Clock className="w-4 h-4 text-violet-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-violet-600 font-semibold uppercase tracking-wide">Sizning javob vaqtingiz</p>
              <p className="text-sm font-bold text-violet-800">{chat.avgResponseTime} daqiqa (o'rtacha)</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 pt-1">
            Mijoz telefon raqami ko'rsatilmaydi — faqat platforma orqali aloqa
          </p>
        </div>

        <div className="px-5 pb-6">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Yopish
          </button>
        </div>
      </motion.div>
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

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(timer);
  }, [chat?.messages.length]);

  function send() {
    if (!text.trim()) return;
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

        {/* Category badge */}
        <div className="flex-shrink-0">
          <span className="text-[11px] font-semibold text-gray-400 truncate max-w-[70px] block text-right">
            {chat.categoryEmoji} {chat.categoryName}
          </span>
        </div>
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

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
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

      {/* Customer profile modal */}
      <AnimatePresence>
        {showCustomerProfile && (
          <CustomerProfileModal
            chat={chat}
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

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 hover:border-violet-100 hover:shadow-sm transition-all duration-200 text-left active:scale-[.99]"
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
        {lastMsg && (
          <p className="text-[11px] text-gray-400 truncate">
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

  const chats = getProviderChats();
  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);
  const services = SERVICE_CATEGORIES;

  let displayed = chats;
  if (tab === "unread") displayed = chats.filter((c) => c.unread > 0);
  if (tab === "by-service") {
    if (selectedService) {
      displayed = chats.filter((c) => c.categoryName === selectedService);
    } else {
      displayed = [...chats].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    }
  }
  if (query) {
    const q = query.toLowerCase();
    displayed = displayed.filter(
      (c) => c.customerName.toLowerCase().includes(q) || c.categoryName.toLowerCase().includes(q)
    );
  }

  const tabs: { id: SortTab; label: string; count?: number }[] = [
    { id: "all", label: "Barchasi", count: chats.length },
    { id: "unread", label: "O'qilmagan", count: totalUnread },
    { id: "by-service", label: "Xizmat bo'yicha" },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 card-shadow">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setLocation("/provider-home")} className="flex items-center">
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
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suhbat yoki xizmat qidirish..."
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 items-center relative">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "by-service") setShowServiceMenu(!showServiceMenu);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tab === t.id ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={tab === t.id ? { background: VIOLET } : {}}
              >
                {t.label}
                {t.id === "by-service" && <ChevronDown className="w-3.5 h-3.5" />}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                    tab === t.id ? "bg-white text-violet-700" : "bg-violet-600 text-white"
                  }`}>{t.count}</span>
                )}
              </button>
            ))}

            <AnimatePresence>
              {tab === "by-service" && showServiceMenu && services.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-20"
                >
                  <button
                    onClick={() => { setSelectedService(null); setShowServiceMenu(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors ${
                      selectedService === null ? "text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={selectedService === null ? { background: VIOLET } : {}}
                  >
                    Barchasi
                  </button>
                  {services.map((service) => (
                    <button
                      key={service}
                      onClick={() => { setSelectedService(service); setShowServiceMenu(false); }}
                      className={`block w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors border-t border-gray-100 last:rounded-b-xl ${
                        selectedService === service ? "text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}
                      style={selectedService === service ? { background: VIOLET } : {}}
                    >
                      {service}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-4">
          {displayed.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-bold text-gray-400 mb-1">Suhbatlar yo'q</p>
              <p className="text-sm text-gray-300">
                {query ? "Qidiruv bo'yicha natija topilmadi" : "Buyurtmachilar bilan suhbat bu yerda ko'rinadi"}
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
      </div>

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
    </>
  );
}
