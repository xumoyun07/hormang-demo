/**
 * /offers — All received offers, optionally filtered by ?requestId=
 * Masters send offers; customer can accept/reject or open chat.
 */
import { useState } from "react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, MessageCircle, Check, X, ChevronLeft,
  Briefcase, MapPin, Calendar, FileText,
  ShieldCheck, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import {
  getOffers, getRequestById, updateOfferStatus, getOrCreateChat,
  type Offer,
} from "@/lib/requests-store";
import { getLocalProfile } from "@/lib/local-profile";
import logoImg from "/hormang-logo.png";

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

/* ─── Provider Profile Preview Modal ────────────────────────────── */
function ProviderProfileModal({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const local = getLocalProfile(offer.masterId);

  const serviceAreas = local.serviceAreas && local.serviceAreas.length > 0
    ? local.serviceAreas
    : local.region
    ? [local.region]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden"
      >
        {/* Hero banner */}
        <div className="relative px-5 pt-6 pb-5" style={{ background: VIOLET }}>
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end gap-4">
            {local.photoUrl ? (
              <img
                src={local.photoUrl}
                alt={offer.masterName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl border-2 border-white/30 flex items-center justify-center flex-shrink-0 font-black text-white text-xl"
                style={{ background: offer.masterColor }}
              >
                {offer.masterInitials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-white text-lg leading-tight">{offer.masterName}</h3>
              <p className="text-violet-200 text-sm">Ijrochi (Usta)</p>
              {local.experience && (
                <p className="text-violet-100 text-xs mt-0.5">{local.experience} yil tajriba</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {/* Avg response time */}
          <div className="flex items-center gap-3 bg-violet-50 rounded-2xl p-3.5 border border-violet-100">
            <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">O'rtacha javob vaqti</p>
              <p className="text-sm font-bold text-violet-800">{offer.avgResponseTime} daqiqa</p>
            </div>
          </div>

          {/* Service areas */}
          {serviceAreas.length > 0 && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Xizmat ko'rsatadigan hududlar</p>
                <div className="flex flex-wrap gap-1.5">
                  {serviceAreas.map((area) => (
                    <span key={area} className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio */}
          {local.portfolioItems && local.portfolioItems.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Portfolio</p>
              <div className="grid grid-cols-3 gap-2">
                {local.portfolioItems.slice(0, 6).map((item, i) => (
                  <div key={i} className="relative">
                    <img
                      src={item.url}
                      alt={item.caption ?? `Ish ${i + 1}`}
                      className="aspect-square object-cover rounded-xl border border-gray-200 w-full"
                    />
                    {item.caption && (
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification note */}
          <div className="flex items-center gap-2 py-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">Platforma tomonidan tekshirilgan ijrochi</p>
          </div>
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

/* ─── Offer Card ─────────────────────────────────────────────────── */
function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const [, setLocation] = useLocation();
  const [showProviderProfile, setShowProviderProfile] = useState(false);
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
  }

  function reject() {
    updateOfferStatus(offer.id, "rejected");
  }

  const isAccepted = offer.status === "accepted";
  const isRejected = offer.status === "rejected";

  return (
    <>
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
          {/* Provider info row */}
          <div className="flex items-start gap-3 mb-3">
            <button onClick={() => setShowProviderProfile(true)} className="flex-shrink-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm hover:scale-105 transition-transform"
                style={{ background: offer.masterColor }}
              >
                {offer.masterInitials}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProviderProfile(true)}
                  className="font-bold text-sm text-gray-900 hover:text-violet-700 transition-colors"
                >
                  {offer.masterName}
                </button>
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
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[11px] text-gray-400 font-medium">
                    {offer.avgResponseTime} daqiqa
                  </span>
                </div>
                <button
                  onClick={() => setShowProviderProfile(true)}
                  className="text-[11px] font-semibold text-violet-500 hover:text-violet-700 flex items-center gap-0.5 transition-colors"
                >
                  <User className="w-3 h-3" />
                  Profil
                </button>
              </div>
            </div>
            {/* Price */}
            <div className="flex-shrink-0 text-right">
              <p className="font-extrabold text-base text-blue-600">
                {(offer.priceLabel ?? offer.price.toLocaleString() + " so'm")}
              </p>
              {offer.completionTime && (
                <p className="text-[10px] text-gray-400 mt-0.5">{offer.completionTime}</p>
              )}
            </div>
          </div>

          {/* Offer message */}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
            <p className="text-sm text-gray-600 leading-relaxed">{offer.message}</p>
          </div>

          {/* Extra details row */}
          {(offer.startDate || (offer.fileUrls && offer.fileUrls.length > 0)) && (
            <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
              {offer.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Boshlanish: {offer.startDate}</span>
                </div>
              )}
              {offer.fileUrls && offer.fileUrls.length > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>{offer.fileUrls.length} ta fayl</span>
                </div>
              )}
            </div>
          )}

          {/* Attached images */}
          {offer.fileUrls && offer.fileUrls.filter((u) => u.startsWith("data:image")).length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {offer.fileUrls.filter((u) => u.startsWith("data:image")).slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt={`Fayl ${i + 1}`} className="aspect-square object-cover rounded-xl border border-gray-200" />
              ))}
            </div>
          )}

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
              onClick={() => {
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
        {showProviderProfile && (
          <ProviderProfileModal offer={offer} onClose={() => setShowProviderProfile(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function OffersPage() {
  useStoreRefresh();
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const filterRequestId = params.get("requestId") ?? undefined;

  const all = getOffers();
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
