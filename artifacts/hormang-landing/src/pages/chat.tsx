/**
 * /chat/:chatId — One-on-one chat with a master.
 * Messages persist in localStorage (unified hormang_chats store).
 * useStoreRefresh() ensures the page re-renders when the provider sends a message.
 * Tapping the master's avatar opens their public profile preview modal.
 */
import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Circle } from "lucide-react";
import { PublicProfileModal } from "@/components/public-profile-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import {
  getChatById, sendMessage,
  type Chat, type ChatMessage,
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
  return d.toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

/* ─── Message Bubble ─────────────────────────────────────────────── */
function MessageBubble({ msg, isFirst }: { msg: ChatMessage; isFirst: boolean }) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
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
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm active:scale-95 transition-transform ring-2 ring-transparent hover:ring-blue-300"
            style={{ background: chat.masterColor }}
          >
            {chat.masterInitials}
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

          <div className="flex-shrink-0 text-right">
            <p className="text-[11px] font-semibold text-gray-400 truncate max-w-[80px]">
              {chat.categoryName}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 pt-4 pb-4">
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

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 z-20">
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
          <PublicProfileModal
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
