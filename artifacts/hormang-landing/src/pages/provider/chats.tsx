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
  Circle, Send, CheckCircle2, Clock, Loader2, Flag, CalendarPlus, CalendarCheck2, ImageIcon, Star,
} from "lucide-react";
import { compressImage } from "@/lib/image-utils";
import { BottomNav } from "@/components/bottom-nav";
import {
  getProviderChats, markChatRead, sendProviderMessage, getProviderChatById,
  addUpcomingService, getUpcomingServices,
  type ProviderChat, type ProviderChatMessage,
} from "@/lib/provider-store";
import {
  getOfferForChat, confirmCompletion, getRequestById, sendSystemMessage,
  type Offer,
} from "@/lib/requests-store";
import { addReview, hasReviewedRequest } from "@/lib/completion-store";
import { ReviewModal, type ReviewSubmitData } from "@/components/review-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { useAuth } from "@/contexts/auth-context";
import logoImg from "/hormang-logo.png";
import { PublicProfilePreviewModal } from "@/components/public-profile-preview-modal";
import { getLocalProfile } from "@/lib/local-profile";
import { formatDate } from "@/lib/date-utils";

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
    return d.toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return formatDate(iso);
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
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" />
        Bajarilmoqda
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
        <Flag className="w-3 h-3" />
        Yakunlandi
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
        className={`max-w-[75%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
          isMe
            ? "text-white rounded-br-md shadow-sm"
            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm"
        }`}
        style={isMe ? { background: VIOLET } : {}}
      >
        {msg.attachment?.type === "image" && (
          <img
            src={msg.attachment.url}
            alt="rasm"
            className="w-full max-w-[220px] object-cover rounded-t-2xl"
            style={{ display: "block" }}
          />
        )}
        <div className="px-3.5 py-2.5">
          {msg.text && <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>}
          <p className={`text-[10px] mt-1 text-right ${isMe ? "text-violet-200" : "text-gray-400"}`}>
            {formatTime(msg.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Schedule Modal ─────────────────────────────────────────────── */
interface ScheduleModalProps {
  onSave: (date: string, time: string, location: string) => void;
  onClose: () => void;
  defaultLocation?: string;
}
function ScheduleModal({ onSave, onClose, defaultLocation = "" }: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState(defaultLocation);

  const today = new Date().toISOString().split("T")[0];

  function handleSave() {
    if (!date) return;
    onSave(date, time, location.trim() || "—");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(10,10,30,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[61] flex justify-center"
      >
        <div
          className="bg-white w-full max-w-lg rounded-t-3xl px-5 pb-8 pt-4"
          style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.14)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-violet-600" />
              <h3 className="font-extrabold text-gray-900 text-base">Xizmatni rejalashtirish</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Sana</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
              />
            </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Vaqt</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                  style={{ colorScheme: "light" }}
                />
              </div>

              <p className="text-sm text-gray-600 mt-1">
                Tanlangan vaqt: <span className="font-mono font-bold text-gray-800">{time}</span>
              </p>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Manzil</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ko'cha, uy raqami..."
                  className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                />
              </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={!date}
              className="flex-1 h-11 rounded-2xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              style={{ background: VIOLET }}
            >
              Rejalashtirish
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Inline Chat View ───────────────────────────────────────────── */
function ChatView({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  useStoreRefresh();
  const [text, setText] = useState("");
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const masterId = user?.id ?? "";

  useEffect(() => {
    markChatRead(chatId);
  }, [chatId]);

  const chat = getProviderChatById(chatId) ?? null;
  const offer = chat ? getOfferForChat(chat.requestId, chat.masterId) : undefined;
  const request = chat ? getRequestById(chat.requestId) : undefined;
  const isRejected = offer?.status === "rejected";
  const isCompleted = offer?.status === "completed";
  const canComplete =
    offer &&
    chat &&
    (offer.status === "accepted" || offer.status === "in_progress") &&
    !offer.providerConfirmedCompleted;

  const providerWaiting =
    offer?.providerConfirmedCompleted &&
    !offer?.customerConfirmedCompleted &&
    offer?.status !== "completed";
  const canSchedule =
    offer && (offer.status === "accepted" || offer.status === "in_progress") && !isCompleted;
  const isAlreadyPlanned =
    canSchedule && offer
      ? getUpcomingServices(masterId).some((s) => s.offerId === offer.id)
      : false;
  const customerLocal = chat?.customerId ? getLocalProfile(chat.customerId) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [chat?.messages.length]);

  const alreadyCompleted = offer?.status === "completed";

  /* Auto-prompt review on every chat open (and when offer becomes completed).
   * reviewDismissed prevents re-prompting within the same session; it resets
   * on the next mount so the provider is prompted again next time they open. */
  useEffect(() => {
    if (alreadyCompleted && masterId && chat && !hasReviewedRequest(chat.requestId, masterId) && !reviewDismissed) {
      setShowReview(true);
    }
  }, [alreadyCompleted]);

  function send() {
    if ((!text.trim() && !attachPreview) || isRejected) return;
    const attachment = attachPreview ? { type: "image" as const, url: attachPreview } : undefined;
    sendProviderMessage(chatId, "provider", text.trim(), attachment);
    setText("");
    setAttachPreview(null);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await compressImage(file, 800, 0.72);
    setAttachPreview(url);
    e.target.value = "";
  }

  function handleComplete() {
    if (!offer || !chat) return;
    const result = confirmCompletion(offer.id, "provider");
    if (result === "completed" && !hasReviewedRequest(chat.requestId, masterId)) {
      setShowReview(true);
    }
  }

  function handleScheduleSave(date: string, time: string, location: string) {
    if (!chat || !offer) return;
    addUpcomingService({
      offerId: offer.id,
      requestId: chat.requestId,
      masterId,
      customerId: chat.customerId,
      title: chat.categoryName,
      customerName: chat.customerName,
      customerInitials: chat.customerInitials,
      customerColor: chat.customerColor,
      date,
      time,
      location,
      categoryEmoji: chat.categoryEmoji,
    });
    setShowSchedule(false);
    sendSystemMessage(chatId, `📅 Xizmat rejalashtirildi: ${date} soat ${time}`);
  }

  function handleReviewSubmit(data: ReviewSubmitData) {
    if (!offer || !chat) return;
    addReview({
      requestId: chat.requestId,
      offerId: offer.id,
      reviewerId: masterId,
      reviewerRole: "provider",
      reviewedId: chat.customerId,
      reviewedRole: "customer",
      rating: data.rating,
      comment: data.text || undefined,
      photoUrl: data.photoUrl,
      platformSentiment: data.platformSentiment,
      platformFeedback: data.platformFeedback,
      reviewerName: chat.masterName,
      reviewerInitials: chat.masterInitials,
      reviewerColor: chat.masterColor,
      reviewedName: chat.customerName,
      serviceCategory: chat.categoryName,
    });
    setShowReview(false);
    setReviewDismissed(true);
  }

  if (!chat) return null;

  const defaultLocation = [request?.district, request?.region].filter(Boolean).join(", ");

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
      className="fixed inset-x-0 top-0 bottom-14 bg-gray-50 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Clickable customer avatar */}
          <button
            onClick={() => setShowCustomerProfile(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm active:scale-95 transition-transform ring-2 ring-transparent hover:ring-violet-300 overflow-hidden"
            style={customerLocal?.photoUrl ? {} : { background: chat.customerColor }}
          >
            {customerLocal?.photoUrl ? (
              <img src={customerLocal.photoUrl} alt={chat.customerName} className="w-full h-full object-cover" />
            ) : (
              chat.customerInitials
            )}
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

          {/* Live offer status badge or Complete / Review button */}
          {canComplete ? (
            <button
              onClick={() => setShowCompleteConfirm(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[11px] font-bold transition-colors active:scale-95 shadow-sm"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tugatildi
            </button>
          ) : providerWaiting ? (
            <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              Mijoz kutilmoqda
            </div>
          ) : alreadyCompleted ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {chat && masterId && !hasReviewedRequest(chat.requestId, masterId) && (
                <button
                  onClick={() => { setReviewDismissed(false); setShowReview(true); }}
                  className="w-7 h-7 rounded-xl bg-white-400 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                  title="Baholash"
                >
                  <Star className="w-5 h-5 text-amber-500" />
                </button>
              )}
              <OfferStatusBadge status="completed" />
            </div>
          ) : offer ? (
            <div className="flex-shrink-0">
              <OfferStatusBadge status={offer.status} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages area */}
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
                  <MsgBubble
                    key={msg.id}
                    msg={msg}
                    isFirst={i === 0 || group.messages[i - 1].sender !== msg.sender}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Fallback status banner for old chats that pre-date system-message injection */}
          {offer && offer.status !== "pending" &&
            !chat.messages.some(
              (m) =>
                m.sender === "system" &&
                (m.text.includes("qabul qilindi") || m.text.includes("rad etildi"))
            ) && <StatusBanner status={offer.status} />}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Input — disabled when offer is rejected */}
      {isRejected ? (
        <div className="bg-red-50 border-t border-red-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-center gap-2">
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-500">
              Taklif rad etildi. Suhbat yopildi.
            </p>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-white border-t border-gray-100 z-20 pb-0">
          {attachPreview && (
            <div className="max-w-lg mx-auto px-4 pt-2">
              <div className="relative inline-block">
                <img src={attachPreview} alt="attachment" className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
                <button
                  onClick={() => setAttachPreview(null)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
            {/* Schedule button */}
            {canSchedule && (
              isAlreadyPlanned ? (
                <button
                  disabled
                  className="flex items-center gap-1.5 h-11 px-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-400 text-[11px] font-semibold flex-shrink-0 cursor-not-allowed opacity-60 select-none"
                  title="Xizmat rejalashtirilgan"
                >
                  <CalendarCheck2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSchedule(true)}
                  className="w-11 h-11 rounded-2xl border-2 border-dashed border-violet-300 flex items-center justify-center text-violet-500 hover:bg-violet-50 transition-colors flex-shrink-0 active:scale-95"
                  title="Xizmatni rejalashtirish"
                >
                  <CalendarPlus className="w-5 h-5" />
                </button>
              )
            )}
            <input
              ref={attachInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => attachInputRef.current?.click()}
              disabled={isRejected}
              className="w-11 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0 disabled:opacity-40"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Xabar yozing..."
              className="flex-1 h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
            <button
              onClick={send}
              disabled={!text.trim() && !attachPreview}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              style={{ background: VIOLET }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
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

      {/* Schedule modal */}
      <AnimatePresence>
        {showSchedule && (
          <ScheduleModal
            key="schedule-modal"
            defaultLocation={defaultLocation}
            onSave={handleScheduleSave}
            onClose={() => setShowSchedule(false)}
          />
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {showReview && offer && (
          <ReviewModal
            key="provider-review"
            subjectName={chat.customerName}
            subjectInitials={chat.customerInitials}
            subjectColor={chat.customerColor}
            prompt="Mijozni baholang"
            onSubmit={handleReviewSubmit}
            onSkip={() => { setShowReview(false); setReviewDismissed(true); }}
          />
        )}
      </AnimatePresence>

      {/* Completion confirmation modal */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <ConfirmModal
            key="provider-chats-complete-confirm"
            title="Xizmat yakunlanganligini tasdiqlaysizmi?"
            message={"Bu amalni ortga qaytarib bo'lmaydi.\n\nXizmat haqiqatan ham yakunlandimi?\nXizmat yakunida xaridor xizmat sifatini baholashi mumkin."}
            confirmText="Ha, yakunlandi"
            onConfirm={handleComplete}
            onClose={() => setShowCompleteConfirm(false)}
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
  const customerLocal = chat.customerId ? getLocalProfile(chat.customerId) : null;
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
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm overflow-hidden"
        style={customerLocal?.photoUrl ? {} : { background: chat.customerColor }}
      >
        {customerLocal?.photoUrl ? (
          <img src={customerLocal.photoUrl} alt={chat.customerName} className="w-full h-full object-cover" />
        ) : (
          chat.customerInitials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-bold text-sm text-gray-900 truncate">{chat.customerName}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {formatTime(lastMsg?.timestamp ?? chat.createdAt)}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium mb-1">{chat.categoryEmoji} {chat.categoryName}</p>
        {offer && (
          offer.providerConfirmedCompleted && !offer.customerConfirmedCompleted && offer.status !== "completed"
            ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                Mijoz kutilmoqda
              </span>
            )
            : <OfferStatusBadge status={offer.status} />
        )}
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
    <div className={openChatId ? "h-screen overflow-hidden bg-gray-50" : "min-h-screen bg-gray-50 pb-24"}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setLocation("/provider-home")} className="flex items-center flex-shrink-0">
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
              placeholder="Mijoz yoki xizmat..."
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
