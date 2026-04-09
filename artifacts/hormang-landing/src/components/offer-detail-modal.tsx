/**
 * OfferDetailModal — Customer-side read-only view of a received offer.
 * Shows the original request Q&A + the provider's offer details.
 * Tapping "Ijrochi profilini ko'rish" opens the unified PublicProfileModal.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, Clock, MapPin, Calendar,
  MessageCircle, Check, User, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  getRequestById, getOrCreateChat, updateOfferStatus,
  getOffers,
  type Offer,
} from "@/lib/requests-store";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { getAllQuestionsForCategory } from "@/lib/questionnaire-store";
import { getLocalProfile } from "@/lib/local-profile";
import { PublicProfilePreviewModal } from "@/components/public-profile-preview-modal";
import { AcceptConfirmModal } from "@/components/accept-confirm-modal";
import { ImageGrid, getAnswerImageUrls } from "@/components/image-grid";

/* ─── Constants ────────────────────────────────────────────────────── */

const BLUE = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

const SKIP_ANSWER_KEYS = new Set(["budget_open", "urgency", "budget", "region", "district"]);

/* ─── Helpers ──────────────────────────────────────────────────────── */

function formatAnswerValue(
  value: unknown,
  options?: { label: string; value: string; type?: string }[],
  otherText?: string,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && value.startsWith("data:")) return "__IMAGE__";
  if (typeof value === "boolean") return value ? "Ha" : "Yo'q";
  if (typeof value === "number") return value.toLocaleString("uz-Latn-UZ") + (String(value).length > 3 ? " so'm" : "");
  const otherOpt = options?.find((o) => o.type === "other");
  if (typeof value === "string") {
    if (otherOpt && value === otherOpt.value && otherText) return otherText;
    return options?.find((o) => o.value === value)?.label ?? value;
  }
  if (Array.isArray(value)) {
    return (value as string[]).map((v) => {
      if (otherOpt && v === otherOpt.value && otherText) return otherText;
      return options?.find((o) => o.value === v)?.label ?? v;
    }).join(", ");
  }
  return String(value);
}

function urgencyLabel(u: unknown): { label: string; color: string } {
  if (u === "urgent") return { label: "Shoshilinch", color: "text-red-600 bg-red-50 border border-red-100" };
  if (u === "normal") return { label: "Oddiy", color: "text-blue-600 bg-blue-50 border border-blue-100" };
  return { label: "Moslashuvchan", color: "text-gray-500 bg-gray-100 border border-gray-200" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "long", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

/* ─── Offer Detail Modal ───────────────────────────────────────────── */

interface OfferDetailModalProps {
  offer: Offer;
  onClose: () => void;
}

export function OfferDetailModal({ offer, onClose }: OfferDetailModalProps) {
  const [, setLocation] = useLocation();
  const [showProviderProfile, setShowProviderProfile] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Reactive live data ───────────────────────────────────────────
     Subscribe to store changes so the modal re-renders whenever
     updateOfferStatus() is called (either here or in the list card).
     Re-read from localStorage each render to get the current truth. */
  useStoreRefresh();
  const allOffers = getOffers();
  const liveOffer = allOffers.find((o) => o.id === offer.id) ?? offer;

  /* Has ANY other offer on this same request already been accepted? */
  const anyAccepted =
    liveOffer.status !== "accepted" &&
    allOffers.some(
      (o) => o.requestId === offer.requestId && o.id !== offer.id && o.status === "accepted"
    );

  const isAccepted = liveOffer.status === "accepted";
  const isRejected = liveOffer.status === "rejected";
  /* Can still accept: offer is pending and no sibling offer is accepted */
  const canAccept = !isAccepted && !isRejected && !anyAccepted;

  const req = getRequestById(offer.requestId);
  const providerLocal = getLocalProfile(offer.masterId);

  /* Build Q&A pairs from request (skip image answers) */
  const allQuestions = req ? getAllQuestionsForCategory(req.categoryId) : [];
  const qaPairs = allQuestions
    .filter((q) => !SKIP_ANSWER_KEYS.has(q.id))
    .map((q) => {
      const raw = req?.answers?.[q.id];
      if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) return null;
      const otherText = req?.answers?.[q.id + "_other"] as string | undefined;
      const formatted = formatAnswerValue(raw, q.options, otherText);
      if (formatted === "__IMAGE__") return null;
      return { label: q.label, value: formatted };
    })
    .filter(Boolean) as { label: string; value: string }[];

  /* Customer uploaded photos */
  const customerPhotoUrls = req?.answers ? getAnswerImageUrls(req.answers as Record<string, unknown>) : [];

  /* Provider offer attachment images */
  const offerImageUrls = (offer.fileUrls ?? []).filter(
    (u) => u.startsWith("data:image") || u.startsWith("http") || u.startsWith("blob:")
  );

  /* Derive request metadata */
  const urgency = req?.answers?.["urgency"] as string | undefined;
  const urg = urgencyLabel(urgency);
  const location = [req?.district, req?.region].filter(Boolean).join(", ");
  const budgetAnswer = req?.answers?.["budget"];
  const budgetLabel = typeof budgetAnswer === "number"
    ? budgetAnswer.toLocaleString("uz-Latn-UZ") + " so'm"
    : null;

  function openChat() {
    const chat = getOrCreateChat(
      offer.requestId,
      offer.masterId,
      offer.masterName,
      offer.masterInitials,
      offer.masterColor,
      offer.avgResponseTime,
      req?.categoryName ?? ""
    );
    onClose();
    setLocation(`/chat/${chat.id}`);
  }

  function confirmAccept() {
    updateOfferStatus(offer.id, "accepted");
    setShowConfirm(false);
    onClose();
  }

  function reject() {
    updateOfferStatus(offer.id, "rejected");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="w-full max-w-lg bg-white rounded-t-3xl max-h-[96vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="font-extrabold text-base text-gray-900">Taklif tafsilotlari</h2>
              <p className="text-xs text-gray-400">Ko'rish rejimi · o'qish uchun</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

            {/* ── Provider offer section ─── */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ijrochi taklifi</p>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Provider header */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  {providerLocal.photoUrl ? (
                    <img
                      src={providerLocal.photoUrl}
                      alt={offer.masterName}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-200 flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                      style={{ background: offer.masterColor }}
                    >
                      {offer.masterInitials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-gray-900">{offer.masterName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[11px] text-gray-400">~{offer.avgResponseTime} daqiqa javob beradi</span>
                    </div>
                  </div>
                  {/* Status badge */}
                  {isAccepted && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
                      Qabul qilingan
                    </span>
                  )}
                  {isRejected && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                      Rad etilgan
                    </span>
                  )}
                </div>

                {/* "Ijrochi profilini ko'rish" button */}
                <button
                  onClick={() => setShowProviderProfile(true)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  Ijrochi profilini ko'rish
                </button>
              </div>

              {/* Price + time grid */}
              <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                <div className="px-4 py-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Narx</p>
                  <p className="font-extrabold text-base text-blue-600">
                    {offer.priceLabel ?? (offer.price.toLocaleString() + " so'm")}
                  </p>
                </div>
                {offer.completionTime && (
                  <div className="px-4 py-3">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Muddat</p>
                    <p className="font-bold text-sm text-gray-800">{offer.completionTime}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Xabar</p>
                <p className="text-sm text-gray-700 leading-relaxed">{offer.message}</p>
              </div>

              {/* Start date */}
              {offer.startDate && (
                <div className="px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500 border-b border-gray-100">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Boshlanish: {offer.startDate}</span>
                </div>
              )}

              {/* Provider attached images */}
              {offerImageUrls.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <ImageGrid
                    urls={offerImageUrls}
                    label="Ijrochi rasmlari"
                    columns={3}
                  />
                </div>
              )}

              {/* Date sent */}
              <div className="px-4 py-2.5">
                <p className="text-[10px] text-gray-400">Yuborildi: {formatDate(offer.createdAt)} · {timeAgo(offer.createdAt)}</p>
              </div>
            </div>

            {/* ── Request section ─── */}
            {req && (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mijoz so'rovi</p>

                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Request top bar */}
                  <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">
                        {req.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm text-gray-900">{req.categoryName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(req.createdAt)}</p>
                      </div>
                      {urgency && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${urg.color}`}>
                          {urg.label}
                        </span>
                      )}
                    </div>

                    {/* Key meta */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      {location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span>{location}</span>
                        </div>
                      )}
                      {budgetLabel && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{budgetLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Q&A pairs */}
                  {qaPairs.length > 0 && (
                    <div className="px-4 py-3 space-y-2.5 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Savol · Javob</p>
                      {qaPairs.map((pair, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <div className="flex-shrink-0 w-1 rounded-full bg-blue-200 self-stretch" />
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-400 font-medium">{pair.label}:</span>
                            <span className="font-bold text-gray-800 ml-1">{pair.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer uploaded photos */}
                  {customerPhotoUrls.length > 0 && (
                    <div className="px-4 py-3">
                      <ImageGrid
                        urls={customerPhotoUrls}
                        label="Mening rasmlarim"
                        columns={3}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action footer */}
          {!isRejected && (
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
              {/* If another offer on this request was already accepted, show a notice */}
              {anyAccepted && (
                <p className="text-center text-xs text-gray-400 font-semibold bg-gray-50 rounded-xl py-2 px-3">
                  Bu so'rovga boshqa taklif allaqachon qabul qilingan
                </p>
              )}

              <Button
                onClick={openChat}
                className="w-full h-11 font-bold gap-2 text-sm"
                style={{ background: BLUE }}
              >
                <MessageCircle className="w-4 h-4" />
                Chat ochish
              </Button>

              {canAccept && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowConfirm(true)}
                    className="flex-1 h-10 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Qabul qilish
                  </Button>
                  <button
                    onClick={reject}
                    className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-xs font-bold text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Rad etish
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Provider profile overlay */}
      <AnimatePresence>
        {showProviderProfile && (
          <PublicProfilePreviewModal
            key={`offer-detail-provider-${offer.masterId}`}
            mode="provider"
            providerData={{
              masterId: offer.masterId,
              masterName: offer.masterName,
              masterInitials: offer.masterInitials,
              masterColor: offer.masterColor,
              avgResponseTime: offer.avgResponseTime,
            }}
            onClose={() => setShowProviderProfile(false)}
          />
        )}
      </AnimatePresence>

      {/* Accept confirm checklist (z-[70] so it sits above the detail modal) */}
      <AnimatePresence>
        {showConfirm && (
          <AcceptConfirmModal
            onConfirm={confirmAccept}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
