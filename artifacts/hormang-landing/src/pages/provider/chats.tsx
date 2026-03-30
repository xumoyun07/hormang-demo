/**
 * /provider/chats — Suhbatlarim page (Provider side)
 * - Search bar
 * - Sorting tabs: All | Unread | By service
 * - Chat rows with last message + unread badge
 * - Click opens the chat
 */
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageCircle, ChevronRight, X, ChevronDown,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import {
  getProviderChats, markChatRead, sendProviderMessage, getProviderChatById,
  type ProviderChat, type ProviderChatMessage,
} from "@/lib/provider-store";
import logoImg from "/hormang-logo.png";

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

const SERVICE_CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enagalik", "Tadbir xizmatlari",
  "Ko'chirish yuk yetkazish", "Go'zallik", "Avto xizmat", "Repetitorlar", "Ustachilik",
];

/* ─── Inline Chat View ───────────────────────────────────────────── */
function ChatView({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  useStoreRefresh();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const markedRef = useRef(false);

  // Mark read once on first render
  if (!markedRef.current) {
    markedRef.current = true;
    markChatRead(chatId);
  }

  const chat = getProviderChatById(chatId) ?? null;

  // Scroll to bottom when messages change
  if (chat) {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function send() {
    if (!text.trim()) return;
    sendProviderMessage(chatId, "provider", text.trim());
    setText("");
  }

  if (!chat) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed inset-0 bg-white z-40 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: chat.customerColor }}
        >
          {chat.customerInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{chat.customerName}</p>
          <p className="text-xs text-gray-400 truncate">{chat.categoryEmoji} {chat.categoryName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-3">
        {chat.messages.map((msg: ProviderChatMessage) => {
          const isMe = msg.sender === "provider";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "text-white rounded-br-sm"
                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                }`}
                style={isMe ? { background: VIOLET } : {}}
              >
                {msg.text}
                <p className={`text-[10px] mt-1 ${isMe ? "text-violet-200" : "text-gray-400"} text-right`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={(el) => { bottomRef.current = el; }} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Xabar yozing..."
          className="flex-1 h-10 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity shadow-sm active:scale-95"
          style={{ background: VIOLET }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
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
      className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 hover:border-violet-100 hover:shadow-sm transition-all duration-200 text-left"
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
        <p className="text-xs text-gray-500 font-medium mb-0.5">{chat.categoryEmoji} {chat.categoryName}</p>
        {lastMsg && (
          <p className="text-[11px] text-gray-400 truncate">
            {lastMsg.sender === "provider" ? "Siz: " : ""}{lastMsg.text}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-1">
        {chat.unread > 0 ? (
          <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "hsl(262,80%,54%)" }}>
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

            {/* Service menu */}
            <AnimatePresence>
              {tab === "by-service" && showServiceMenu && services.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-20"
                >
                  <button
                    onClick={() => {
                      setSelectedService(null);
                      setShowServiceMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors ${
                      selectedService === null
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={selectedService === null ? { background: VIOLET } : {}}
                  >
                    Barchasi
                  </button>
                  {services.map((service) => (
                    <button
                      key={service}
                      onClick={() => {
                        setSelectedService(service);
                        setShowServiceMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors border-t border-gray-100 last:rounded-b-xl ${
                        selectedService === service
                          ? "text-white"
                          : "text-gray-600 hover:bg-gray-50"
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

      {openChatId && (
        <ChatView
          chatId={openChatId}
          onClose={() => setOpenChatId(null)}
        />
      )}

      <BottomNav />
    </>
  );
}
