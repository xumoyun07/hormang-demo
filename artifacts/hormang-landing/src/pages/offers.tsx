/**
 * /offers — All received offers, optionally filtered by ?requestId=
 * Masters send offers; customer can accept/reject or open chat.
 */
import { useState } from "react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Check, X, ChevronLeft, Briefcase, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import {
  getOffersByCustomer, getRequestById, updateOfferStatus,
  type Offer,
} from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";
import { OfferDetailModal } from "@/components/offer-detail-modal";
import { getLocalProfile } from "@/lib/local-profile";
import logoImg from "/hormang-logo.png";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

/* ─── Offer Card ─────────────────────────────────────────────────── */
function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const [showDetail, setShowDetail] = useState(false);

  const req = getRequestById(offer.requestId);
  const isAccepted = offer.status === "accepted";
  const isRejected = offer.status === "rejected";
  const providerLocal = getLocalProfile(offer.masterId);

  function accept(e: React.MouseEvent) {
    e.stopPropagation();
    updateOfferStatus(offer.id, "accepted");
  }

  function reject(e: React.MouseEvent) {
    e.stopPropagation();
    updateOfferStatus(offer.id, "rejected");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        onClick={() => setShowDetail(true)}
        className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer ${
          isAccepted ? "border-emerald-200 ring-1 ring-emerald-100"
          : isRejected ? "border-gray-100 opacity-60"
          : "border-gray-100 hover:border-blue-100 hover:shadow-md"
        }`}
      >
        {/* Request context strip */}
        {req && (
          <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">{req.emoji}</span>
            <p className="text-xs font-semibold text-gray-500 truncate">{req.categoryName}</p>
            <span className="ml-auto text-[10px] text-gray-400">{formatDate(offer.createdAt)}</span>
          </div>
        )}

        <div className="p-4">
          {/* Provider info row */}
          <div className="flex items-start gap-3 mb-3">
            {providerLocal.photoUrl ? (
              <img
                src={providerLocal.photoUrl}
                alt={offer.masterName}
                className="w-11 h-11 rounded-2xl object-cover border border-gray-200 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                style={{ background: offer.masterColor }}
              >
                {offer.masterInitials}
              </div>
            )}
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
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-[11px] text-gray-400 font-medium">
                  ~{offer.avgResponseTime} daqiqa
                </span>
              </div>
            </div>
            {/* Price */}
            <div className="flex-shrink-0 text-right">
              <p className="font-extrabold text-base text-blue-600">
                {offer.priceLabel ?? (offer.price.toLocaleString() + " so'm")}
              </p>
              {offer.completionTime && (
                <p className="text-[10px] text-gray-400 mt-0.5">{offer.completionTime}</p>
              )}
            </div>
          </div>

          {/* Offer message preview */}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{offer.message}</p>
          </div>

          {/* File indicator */}
          {offer.fileUrls && offer.fileUrls.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>{offer.fileUrls.length} ta fayl ilova qilingan</span>
            </div>
          )}

          {/* Action buttons */}
          {!isRejected && (
            <div className="flex gap-2">
              {/* "Batafsil" opens the detail modal */}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
                className="flex-1 h-9 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 gap-1.5"
              >
                Batafsil
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
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
                  className="flex-1 h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  Batafsil
                </Button>
              )}
            </div>
          )}

          {isRejected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const raw = localStorage.getItem("hormang_offers");
                if (!raw) return;
                try {
                  const all = JSON.parse(raw) as Array<{ id: string; status: string }>;
                  const updated = all.map((o) => o.id === offer.id ? { ...o, status: "pending" } : o);
                  localStorage.setItem("hormang_offers", JSON.stringify(updated));
                  window.dispatchEvent(new CustomEvent("hormang:store-change"));
                } catch (_) {}
              }}
              className="text-xs text-gray-400 underline"
            >
              Qaytarish
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <OfferDetailModal offer={offer} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function OffersPage() {
  useStoreRefresh();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const filterRequestId = params.get("requestId") ?? undefined;

  const all = getOffersByCustomer(user?.id ?? "");
  const filtered = filterRequestId ? all.filter((o) => o.requestId === filterRequestId) : all;
  const offers = [...filtered].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
            <button onClick={() => setLocation("/")} className="flex items-center flex-shrink-0">
              <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
            </button>
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
              So'rov yuborganingizdan so'ng ijrochilar takliflar yuborishadi.
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
                <OfferCard key={offer.id} offer={offer} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
