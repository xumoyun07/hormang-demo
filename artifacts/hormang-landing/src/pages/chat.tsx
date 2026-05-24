/**
 * /chat/:chatId — One-on-one chat with a master.
 * Messages persist in localStorage (unified hormang_chats store).
 * useStoreRefresh() ensures the page re-renders when the provider sends a message.
 * Tapping the master's avatar opens their public profile preview modal.
 */
import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Circle, CheckCircle2, X, Clock, Loader2, Flag, ImageIcon, Star } from "lucide-react";
import { compressImage } from "@/lib/image-utils";
import { PublicProfilePreviewModal } from "@/components/public-profile-preview-modal";
import { ReviewModal, type ReviewSubmitData } from "@/components/review-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { getLocalProfile } from "@/lib/local-profile";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/date-utils";
import {
  getChatById, sendMessage, getOfferForChat, confirmCompletion,
  type Chat, type ChatMessage, type Offer,
} from "@/lib/requests-store";
import { addReview, hasReviewedRequest } from "@/lib/completion-store";
import { isUserSuspended, SUSPENDED_MESSAGE } from "@/lib/safety-store";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/i18n-context";
import { tFormat } from "@/lib/i18n";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string, today: string, yesterday: string, months: string[]): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return today;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return yesterday;
  return formatDate(iso, { months });
}

/* ─── Offer status badge ─────────────────────────────────────────── */
function OfferStatusBadge({ status }: { status: Offer["status"] }) {
  const { t } = useI18n();
  const tt = t.chatPage;
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        {tt.statusAccepted}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <X className="w-3 h-3" />
        {tt.statusRejected}
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" />
        {tt.statusInProgress}
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
        <Flag className="w-3 h-3" />
        {tt.statusCompleted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      {tt.statusPending}
    </span>
  );
}

/* ─── Status banner shown inside message list ────────────────────── */
function StatusBanner({ status }: { status: Offer["status"] }) {
  const { t } = useI18n();
  if (status === "accepted") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-2 my-4"
      >
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-emerald-700 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {t.chatPage.bannerAccepted}
        </div>
      </motion.div>
    );
  }
  return null;
}

/* ─── Message Bubble ─────────────────────────────────────────────── */
const SYSTEM_MSG_KEYS = [
  "systemMsgOfferAccepted",
  "systemMsgOfferRejected",
  "systemMsgOfferSiblingClosed",
  "systemMsgProviderConfirmed",
  "systemMsgCustomerConfirmed",
  "systemMsgCompleted",
] as const;
type SystemMsgKey = (typeof SYSTEM_MSG_KEYS)[number];

function MessageBubble({ msg, isFirst }: { msg: ChatMessage; isFirst: boolean }) {
  const { t } = useI18n();
  const tt = t.chatPage;
  // System messages render as centered banners
  if (msg.sender === "system") {
    const knownTexts: Record<string, SystemMsgKey> = {
      "Taklif qabul qilindi — Suhbat davom etmoqda": "systemMsgOfferAccepted",
      "Taklif rad etildi. Suhbat yopildi.": "systemMsgOfferRejected",
      "Mijoz boshqa ijrochi taklifini qabul qildi": "systemMsgOfferSiblingClosed",
      "⏳ Ijrochi xizmat yakunlanganligini tasdiqladi. Mijoz tasdig'i kutilmoqda.": "systemMsgProviderConfirmed",
      "⏳ Mijoz xizmat yakunlanganligini tasdiqladi. Ijrochi tasdig'i kutilmoqda.": "systemMsgCustomerConfirmed",
      "✅ Xizmat yakunlandi! Hamkorlik uchun rahmat.": "systemMsgCompleted",
      "Предложение принято — чат продолжается": "systemMsgOfferAccepted",
      "Предложение отклонено. Чат закрыт.": "systemMsgOfferRejected",
      "Клиент принял предложение другого исполнителя": "systemMsgOfferSiblingClosed",
      "⏳ Исполнитель подтвердил завершение. Ожидается подтверждение клиента.": "systemMsgProviderConfirmed",
      "⏳ Клиент подтвердил завершение. Ожидается подтверждение исполнителя.": "systemMsgCustomerConfirmed",
      "✅ Услуга завершена! Спасибо за сотрудничество.": "systemMsgCompleted",
    };
    const key = knownTexts[msg.text];
    const displayText = key ? tt[key] : msg.text;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-2"
      >
        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
          {displayText}
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
        className={`max-w-[75%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
          isCustomer
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm"
        }`}
      >
        {msg.attachment?.type === "image" && (
          <img
            src={msg.attachment.url}
            alt={msg.attachment.url}
            className="w-full max-w-[220px] object-cover rounded-t-2xl"
            style={{ display: "block" }}
          />
        )}
        <div className="px-3.5 py-2.5">
          {msg.text && <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>}
          <p className={`text-[10px] mt-1 text-right ${isCustomer ? "text-blue-200" : "text-gray-400"}`}>
            {formatTime(msg.timestamp)}
          </p>
        </div>
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const tt = t.chatPage;

  useStoreRefresh();

  const [input, setInput] = useState("");
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [showMasterProfile, setShowMasterProfile] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const chat: Chat | undefined = chatId ? getChatById(chatId) : undefined;
  const offer: Offer | undefined = chat
    ? getOfferForChat(chat.requestId, chat.masterId)
    : undefined;
  const masterLocal = chat?.masterId ? getLocalProfile(chat.masterId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [chat?.messages.length]);

  /* Auto-prompt review when the OTHER side marks the offer completed.
   * Only triggers once per visit; user can re-open via the badge button. */
  useEffect(() => {
    if (
      offer?.status === "completed" &&
      user?.id &&
      chat &&
      !hasReviewedRequest(chat.requestId, user.id) &&
      !reviewDismissed
    ) {
      setShowReview(true);
    }
  }, [offer?.status]);

  if (!match || !chat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-semibold mb-4">{tt.notFound}</p>
          <button
            onClick={() => setLocation("/my-requests")}
            className="text-blue-600 font-bold text-sm"
          >
            {tt.backToRequests}
          </button>
        </div>
      </div>
    );
  }

  function handleSend() {
    if (!input.trim() && !attachPreview) return;
    if (user && isUserSuspended(user.id)) {
      toast({ title: SUSPENDED_MESSAGE, variant: "destructive" });
      return;
    }
    const text = input.trim();
    const attachment = attachPreview ? { type: "image" as const, url: attachPreview } : undefined;
    setInput("");
    setAttachPreview(null);
    sendMessage(chatId, "customer", text, attachment);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await compressImage(file, 800, 0.72);
    setAttachPreview(url);
    e.target.value = "";
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleComplete() {
    if (!offer || !chat) return;
    if (user && isUserSuspended(user.id)) {
      toast({ title: SUSPENDED_MESSAGE, variant: "destructive" });
      return;
    }
    const result = confirmCompletion(offer.id, "customer", {
      providerConfirmed: tt.systemMsgProviderConfirmed,
      customerConfirmed: tt.systemMsgCustomerConfirmed,
      completed:         tt.systemMsgCompleted,
    });
    if (result === "completed" && !hasReviewedRequest(chat.requestId, user?.id ?? "")) {
      setShowReview(true);
    }
  }

  function handleReviewSubmit(data: ReviewSubmitData) {
    if (!offer || !user || !chat) return;
    addReview({
      requestId: chat.requestId,
      offerId: offer.id,
      reviewerId: user.id,
      reviewerRole: "customer",
      reviewedId: chat.masterId,
      reviewedRole: "provider",
      rating: data.rating,
      comment: data.text || undefined,
      photoUrl: data.photoUrl,
      platformSentiment: data.platformSentiment,
      platformFeedback: data.platformFeedback,
      providerMetrics: data.providerMetrics,
      reviewerName: chat.customerName,
      reviewerInitials: chat.customerInitials,
      reviewerColor: chat.customerColor,
      reviewedName: chat.masterName,
      serviceCategory: (chat as any).categoryName ?? undefined,
    });
    setShowReview(false);
    setReviewDismissed(true);
  }

  const grouped: Array<{ day: string; messages: ChatMessage[] }> = [];
  for (const msg of chat.messages) {
    const day = formatDay(msg.timestamp, tt.today, tt.yesterday, t.shared.months);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.messages.push(msg);
    else grouped.push({ day, messages: [msg] });
  }
  const canComplete =
    offer &&
    chat &&
    (offer.status === "accepted" || offer.status === "in_progress") &&
    !offer.customerConfirmedCompleted;

  const customerWaiting =
    offer?.customerConfirmedCompleted &&
    !offer?.providerConfirmedCompleted &&
    offer?.status !== "completed";

  const alreadyCompleted = offer?.status === "completed";

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-100 shrink-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
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
                {tFormat(tt.avgResponseTpl, { n: chat.avgResponseTime })}
              </p>
            </div>
          </button>

          {/* Live offer status badge in header */}
          {offer && !canComplete && !alreadyCompleted && !customerWaiting && (
            <div className="flex-shrink-0">
              <OfferStatusBadge status={offer.status} />
            </div>
          )}

          {/* Waiting for provider confirmation */}
          {customerWaiting && (
            <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              {tt.waitingProvider}
            </div>
          )}

          {/* Complete button */}
          {canComplete && (
            <button
              onClick={() => setShowCompleteConfirm(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tt.completeBtn}
            </button>
          )}

          {/* Already completed: show review button if user hasn't rated yet */}
          {alreadyCompleted && (
            <div className="flex-shrink-0 flex items-center gap-2">
              {chat && user && !hasReviewedRequest(chat.requestId, user.id) && (
                <button
                  onClick={() => { setReviewDismissed(false); setShowReview(true); }}
                  className="w-7 h-7 rounded-xl bg-white-400 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                    title={tt.rateTitle}
                  >
                    <Star className="w-5 h-5 text-amber-500" />
                </button>
              )}
              <OfferStatusBadge status="completed" />
            </div>
          )}
        </div>
      </div>

      {/* Messages area — scrolls internally, fills all remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-4">
          {grouped.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {tt.noMessages}
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

          {/* Fallback status banner for old chats that pre-date system-message injection */}
          {offer && offer.status !== "pending" &&
            !chat.messages.some(
              (m) =>
                m.sender === "system" &&
                (m.text.includes("qabul qilindi") || m.text.includes("rad etildi") ||
                 m.text.includes("принято") || m.text.includes("отклонено"))
            ) && <StatusBanner status={offer.status} />}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Input bar — in flow, sits above BottomNav */}
      <div className="shrink-0 bg-white border-t border-gray-100 z-20 pb-16">
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
          <input
            ref={attachInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => attachInputRef.current?.click()}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={tt.inputPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() && !attachPreview}
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

      {/* Review modal */}
      <AnimatePresence>
        {showReview && offer && (
          <ReviewModal
            key="customer-review"
            subjectName={chat.masterName}
            subjectInitials={chat.masterInitials}
            subjectColor={chat.masterColor}
            prompt={tt.rateProvider}
            showProviderSliders
            onSubmit={handleReviewSubmit}
            onSkip={() => setShowReview(false)}
          />
        )}
      </AnimatePresence>

      {/* Completion confirmation modal */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <ConfirmModal
            key="customer-complete-confirm"
            title={tt.completeConfirmTitle}
            message={tt.completeConfirmMsg}
            confirmText={tt.completeConfirmYes}
            onConfirm={handleComplete}
            onClose={() => setShowCompleteConfirm(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
