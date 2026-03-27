/**
 * /offers — All received offers, optionally filtered by ?requestId=
 * Masters send offers; customer can accept/reject or open chat.
 */
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, MessageCircle, Check, X, ChevronLeft,
  Briefcase, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import {
  getOffers, getRequestById, updateOfferStatus, getOrCreateChat,
  type Offer,
} from "@/lib/requests-store";
import logoImg from "/hormang-logo.png";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

/* ─── Offer Card ─────────────────────────────────────────────────── */
function OfferCard({ offer, onUpdate, index }: { offer: Offer; onUpdate: () => void; index: number }) {
  const [, setLocation] = useLocation();
  const req = getRequestById(offer.requestId);

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
    setLocation(`/chat/${chat.id}`);
  }

  function accept() {
    updateOfferStatus(offer.id, "accepted");
    onUpdate();
  }

  function reject() {
    updateOfferStatus(offer.id, "rejected");
    onUpdate();
  }

  const isAccepted = offer.status === "accepted";
  const isRejected = offer.status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        isAccepted ? "border-emerald-200 ring-1 ring-emerald-100"
        : isRejected ? "border-gray-100 opacity-60"
        : "border-gray-100 hover:border-blue-100 hover:shadow-sm"
      }`}
    >
      {/* Request context */}
      {req && (
        <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">{req.emoji}</span>
          <p className="text-xs font-semibold text-gray-500 truncate">{req.categoryName}</p>
          <span className="ml-auto text-[10px] text-gray-400">{formatDate(offer.createdAt)}</span>
        </div>
      )}

      <div className="p-4">
        {/* Master info row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
            style={{ background: offer.masterColor }}
          >
            {offer.masterInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-gray-900">{offer.masterName}</p>
              {isAccepted && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                  Qabul qilingan
                </span>
              )}
              {isRejected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Rad etilgan
                </span>
              )}
            </div>
            {/* Average response time */}
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] text-gray-400 font-medium">
                O'rtacha javob vaqti: {offer.avgResponseTime} daqiqa
              </span>
            </div>
          </div>
          {/* Price */}
          <div className="flex-shrink-0 text-right">
            <p className="font-extrabold text-base text-blue-600">
              {offer.price.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400">so'm</p>
          </div>
        </div>

        {/* Offer message */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
          <p className="text-sm text-gray-600 leading-relaxed">{offer.message}</p>
        </div>

        {/* Action buttons */}
        {!isRejected && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openChat}
              className="flex-1 h-9 text-xs font-bold border-gray-200 gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat ochish
            </Button>
            {!isAccepted ? (
              <>
                <Button
                  size="sm"
                  onClick={accept}
                  className="flex-1 h-9 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Qabul qilish
                </Button>
                <button
                  onClick={reject}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={openChat}
                className="flex-1 h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chatga o'tish
              </Button>
            )}
          </div>
        )}

        {isRejected && (
          <button
            onClick={reject}
            className="text-xs text-gray-400 underline"
          >
            Qaytarish
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function OffersPage() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const filterRequestId = params.get("requestId") ?? undefined;

  const [offers, setOffers] = useState<Offer[]>([]);

  function reload() {
    const all = getOffers();
    const filtered = filterRequestId
      ? all.filter((o) => o.requestId === filterRequestId)
      : all;
    // Newest first, then pending first
    setOffers(
      [...filtered].sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );
  }

  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [filterRequestId]);

  const filteredReq = filterRequestId ? getRequestById(filterRequestId) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {filterRequestId && (
            <button
              onClick={() => setLocation("/my-requests")}
              className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {!filterRequestId && (
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-sm text-gray-900 truncate">
              {filteredReq ? `${filteredReq.emoji} ${filteredReq.categoryName}` : "Olingan takliflar"}
            </h1>
            <p className="text-xs text-gray-400">
              {offers.length} ta taklif
              {offers.filter((o) => o.status === "pending").length > 0 &&
                ` · ${offers.filter((o) => o.status === "pending").length} ta yangi`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {offers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="font-extrabold text-gray-800 text-lg mb-2">Takliflar yo'q</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              So'rov yuborganingizdan so'ng ustalar takliflar yuborishadi.
            </p>
            <Button
              onClick={() => setLocation("/questionnaire")}
              className="bg-blue-600 hover:bg-blue-700 font-bold"
            >
              So'rov yuborish
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {offers.map((offer, i) => (
                <OfferCard key={offer.id} offer={offer} onUpdate={reload} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
