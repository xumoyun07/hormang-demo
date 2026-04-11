/**
 * /chat/:chatId — One-on-one chat with a master.
 * Messages persist in localStorage (unified hormang_chats store).
 * useStoreRefresh() ensures the page re-renders when the provider sends a message.
 * Tapping the master's avatar opens their public profile preview modal.
 */
import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Circle, CheckCircle2, X, Clock } from "lucide-react";
import { PublicProfilePreviewModal } from "@/components/public-profile-preview-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { getLocalProfile } from "@/lib/local-profile";
import { formatDate } from "@/lib/date-utils";
import {
  getChatById, sendMessage, getOfferForChat,
  type Chat, type ChatMessage, type Offer,
} from "@/lib/requests-store";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Bugun";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Kecha";
  return formatDate(iso);
}

/* ─── Offer status badge ─────────────────────────────────────────── */
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

/* ─── Status banner shown inside message list ────────────────────── */
function StatusBanner({ status }: { status: Offer["status"] }) {
  if (status === "accepted") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-2 my-4"
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
        className="flex items-center justify-center gap-2 my-4"
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

/* ─── Message Bubble ─────────────────────────────────────────────── */
function MessageBubble({ msg, isFirst }: { msg: ChatMessage; isFirst: boolean }) {
  // System messages render as centered banners
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
  const isCustomer = msg.sender === "customer";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isCustomer ? "justify-end" : "justify-start"} ${isFirst ? "" : "mt-1"}`}
    >
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isCustomer
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm"
        }`}
      >
        <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
        <p className={`text-[10px] mt-1 text-right ${isCustomer ? "text-blue-200" : "text-gray-400"}`}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Day Separator ──────────────────────────────────────────────── */
function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-semibold text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/chat/:chatId");
  const chatId = params?.chatId ?? "";

  useStoreRefresh();

  const [input, setInput] = useState("");
  const [showMasterProfile, setShowMasterProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat: Chat | undefined = chatId ? getChatById(chatId) : undefined;
  const offer: Offer | undefined = chat
    ? getOfferForChat(chat.requestId, chat.masterId)
    : undefined;
  const masterLocal = chat?.masterId ? getLocalProfile(chat.masterId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length]);

  if (!match || !chat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-semibold mb-4">Chat topilmadi</p>
          <button
            onClick={() => setLocation("/my-requests")}
            className="text-blue-600 font-bold text-sm"
          >
            So'rovlarimga qaytish
          </button>
        </div>
      </div>
    );
  }

  function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    sendMessage(chatId, "customer", text);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const grouped: Array<{ day: string; messages: ChatMessage[] }> = [];
  for (const msg of chat.messages) {
    const day = formatDay(msg.timestamp);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.messages.push(msg);
    else grouped.push({ day, messages: [msg] });
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-100 shrink-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/my-requests")}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Clickable master avatar */}
          <button
            onClick={() => setShowMasterProfile(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm active:scale-95 transition-transform ring-2 ring-transparent hover:ring-blue-300 overflow-hidden"
            style={masterLocal?.photoUrl ? {} : { background: chat.masterColor }}
          >
            {masterLocal?.photoUrl ? (
              <img src={masterLocal.photoUrl} alt={chat.masterName} className="w-full h-full object-cover" />
            ) : (
              chat.masterInitials
            )}
          </button>

          <button
            onClick={() => setShowMasterProfile(true)}
            className="flex-1 min-w-0 text-left"
          >
            <p className="font-extrabold text-sm text-gray-900">{chat.masterName}</p>
            <div className="flex items-center gap-1.5">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 flex-shrink-0" />
              <p className="text-[11px] text-gray-400">
                O'rtacha javob vaqti: {chat.avgResponseTime} daqiqa
              </p>
            </div>
          </button>

          {/* Live offer status badge in header */}
          {offer && (
            <div className="flex-shrink-0">
              <OfferStatusBadge status={offer.status} />
            </div>
          )}
        </div>
      </div>

      {/* Messages area — scrolls internally, fills all remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-4">
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
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isFirst={i === 0 || group.messages[i - 1].sender !== msg.sender}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Status banner — shown after messages when offer is resolved */}
          {offer && offer.status !== "pending" && (
            <StatusBanner status={offer.status} />
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Input bar — in flow, sits above BottomNav */}
      <div className="shrink-0 bg-white border-t border-gray-100 z-20 pb-16">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Xabar yozing..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Master profile modal */}
      <AnimatePresence>
        {showMasterProfile && (
          <PublicProfilePreviewModal
            key={`chat-provider-${chat.masterId}`}
            mode="provider"
            providerData={{
              masterId: chat.masterId,
              masterName: chat.masterName,
              masterInitials: chat.masterInitials,
              masterColor: chat.masterColor,
              avgResponseTime: chat.avgResponseTime,
              categoryName: chat.categoryName,
              categoryEmoji: chat.categoryEmoji,
            }}
            onClose={() => setShowMasterProfile(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
