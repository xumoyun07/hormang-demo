/**
 * /provider/requests — So'rovlar page (Provider side)
 * - Unseen requests badge + fullscreen sliding cards
 * - Scrollable filtered list below
 * - "Javob berish" opens the full OfferForm
 */
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Send, Inbox, MapPin, Filter, X, Check, CheckCircle2,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { OfferForm } from "@/components/offer-form";
import { useToast } from "@/hooks/use-toast";
import {
  getProviderRequests, getUnseenRequests, markSeen, markAllSeen,
  updateProviderRequestStatus, getOfferByRequestId,
  type ProviderRequest,
} from "@/lib/provider-store";
import logoImg from "/hormang-logo.png";

/* ─── Helpers ─────────────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

function urgencyLabel(u: ProviderRequest["urgency"]): { label: string; color: string; dot: string } {
  if (u === "urgent") return { label: "Shoshilinch", color: "text-red-600 bg-red-50 border-red-100", dot: "bg-red-500" };
  if (u === "normal") return { label: "Oddiy", color: "text-blue-600 bg-blue-50 border-blue-100", dot: "bg-blue-500" };
  return { label: "Moslashuvchan", color: "text-gray-500 bg-gray-100 border-gray-200", dot: "bg-gray-400" };
}

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

const CATEGORIES = [
  "Barchasi", "Ta'mirlash", "Tozalik", "Elektr", "Santexnika",
  "Repetitor", "Ko'chirish", "Go'zallik", "Avto",
];

/* ─── Fullscreen Sliding Modal ───────────────────────────────────── */
function FullscreenSlider({
  requests,
  startIndex,
  onClose,
  onOpenOffer,
  onIgnore,
}: {
  requests: ProviderRequest[];
  startIndex: number;
  onClose: () => void;
  onOpenOffer: (req: ProviderRequest) => void;
  onIgnore: (id: string) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const current = requests[index];

  const urg = current ? urgencyLabel(current.urgency) : null;

  useEffect(() => { if (current) markSeen(current.id); }, [current?.id]);

  function next() { if (index < requests.length - 1) setIndex((i) => i + 1); }
  function prev() { if (index > 0) setIndex((i) => i - 1); }

  function handleIgnore() {
    if (!current) return;
    updateProviderRequestStatus(current.id, "ignored");
    onIgnore(current.id);
    if (index < requests.length - 1) setIndex((i) => i + 1);
    else onClose();
  }

  function handleDrag(_: unknown, info: PanInfo) {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  }

  if (!current) { onClose(); return null; }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDrag}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto relative"
      >
        {/* Top handle */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute top-3 left-1/2 -translate-x-1/2" />
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-6 pt-2">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {requests.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-violet-600" : i < index ? "w-1.5 bg-violet-200" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Counter */}
          <p className="text-center text-xs text-gray-400 font-semibold mb-4">{index + 1} / {requests.length}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* Category + customer */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-2xl">
                  {current.emoji}
                </div>
                <div>
                  <p className="font-extrabold text-base text-gray-900">{current.categoryName}</p>
                  <p className="text-xs text-gray-400">{current.customerName} · {timeAgo(current.createdAt)}</p>
                </div>
              </div>

              {urg && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-4 ${urg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
                  {urg.label}
                </span>
              )}

              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">{current.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide mb-1">Byudjet</p>
                  <p className="text-sm font-extrabold text-violet-700">{current.budgetLabel}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Manzil</p>
                  <p className="text-xs font-bold text-gray-800">{current.location}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav + actions */}
          <div className="flex gap-2 mb-3">
            <button
              disabled={index === 0}
              onClick={prev}
              className="w-10 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 disabled:opacity-30 hover:border-gray-300 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleIgnore}
              className="flex-1 h-11 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 hover:bg-red-100 transition-all"
            >
              O'tkazish
            </button>
            <button
              onClick={() => onOpenOffer(current)}
              className="flex-1 h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
              style={{ background: VIOLET }}
            >
              <Send className="w-4 h-4" />
              Javob berish
            </button>
            <button
              disabled={index >= requests.length - 1}
              onClick={next}
              className="w-10 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 disabled:opacity-30 hover:border-gray-300 transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400">Chap yoki o'ng suring</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ProviderRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [unseen, setUnseen] = useState<ProviderRequest[]>([]);
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [showSlider, setShowSlider] = useState(false);
  const [sliderStart, setSliderStart] = useState(0);
  const [offerRequest, setOfferRequest] = useState<ProviderRequest | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setRequests(getProviderRequests());
    setUnseen(getUnseenRequests());
  }, []);

  useEffect(() => { reload(); }, [reload, version]);

  const allOpen = requests.filter((r) => r.status === "open");
  const allResponded = requests.filter((r) => r.status === "responded");

  const filtered = requests.filter((r) => {
    if (activeCategory === "Barchasi") return r.status === "open";
    return r.status === "open" && r.categoryName.toLowerCase().includes(activeCategory.toLowerCase());
  });

  function openSlider(startIdx = 0) {
    setSliderStart(startIdx);
    setShowSlider(true);
  }

  function handleMarkAllSeen() {
    markAllSeen();
    reload();
    toast({ title: "Barchasi ko'rilgan deb belgilandi" });
  }

  function openOfferForm(req: ProviderRequest) {
    setShowSlider(false);
    setOfferRequest(req);
  }

  function closeOfferForm() {
    setOfferRequest(null);
    reload();
  }

  function onOfferSubmitted() {
    setOfferRequest(null);
    reload();
    setLocation("/provider/chats");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 card-shadow">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/provider-home")} className="flex items-center">
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">So'rovlar</h1>
            <p className="text-xs text-gray-400">{allOpen.length} ta ochiq · {allResponded.length} ta javob berilgan</p>
          </div>
          {unseen.length > 0 && (
            <button
              onClick={handleMarkAllSeen}
              className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-xl hover:bg-violet-100 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Barchasi ko'rildi
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Unseen banner */}
        {unseen.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => openSlider(0)}
            className="mb-4 rounded-2xl p-4 cursor-pointer active:scale-[.99] transition-all flex items-center gap-3"
            style={{ background: VIOLET }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Yangi so'rovlar: {unseen.length}</p>
              <p className="text-violet-200 text-xs">Ko'rish uchun bosing</p>
            </div>
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </span>
          </motion.div>
        )}

        {/* Category filter */}
        <div className="flex items-center gap-1 mb-4 -mx-4 px-4 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={activeCategory === cat ? { background: VIOLET } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Open requests list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-400 mb-1">So'rovlar yo'q</p>
            <p className="text-sm text-gray-300">Bu kategoriyada hozircha so'rov yo'q</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {filtered.map((r, i) => {
              const urg = urgencyLabel(r.urgency);
              const isUnseen = unseen.some((u) => u.id === r.id);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl border card-shadow overflow-hidden ${
                    isUnseen ? "border-violet-100" : "border-gray-100"
                  }`}
                >
                  <div className="px-4 pt-3 pb-2 border-b border-gray-50 flex items-center gap-2">
                    <span className="text-sm">{r.emoji}</span>
                    <p className="text-xs font-semibold text-gray-500 flex-1">{r.categoryName}</p>
                    {isUnseen && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />}
                    <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="font-extrabold text-sm text-violet-700">{r.budgetLabel}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${urg.color}`}>
                        {urg.label}
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                        <MapPin className="w-3 h-3" />{r.location}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateProviderRequestStatus(r.id, "ignored");
                          markSeen(r.id);
                          reload();
                        }}
                        className="flex-1 h-9 rounded-xl border-2 border-red-100 bg-red-50 text-red-500 font-bold text-xs flex items-center justify-center active:scale-95 hover:bg-red-100 transition-all"
                      >
                        O'tkazish
                      </button>
                      <button
                        onClick={() => openOfferForm(r)}
                        className="flex-1 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                        style={{ background: VIOLET }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Javob berish
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Responded requests section */}
        {allResponded.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Taklif yuborilganlar
            </p>
            <div className="space-y-2">
              {allResponded.map((r, i) => {
                const offer = getOfferByRequestId(r.id);
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-green-100 overflow-hidden"
                  >
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-lg">
                        {r.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{r.categoryName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{r.customerName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Taklif yuborilgan
                        </span>
                        {offer && (
                          <span className="text-[10px] text-violet-600 font-bold">{offer.priceLabel}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sliding modal */}
      <AnimatePresence>
        {showSlider && unseen.length > 0 && (
          <FullscreenSlider
            requests={unseen}
            startIndex={sliderStart}
            onClose={() => { setShowSlider(false); reload(); }}
            onOpenOffer={(req) => openOfferForm(req)}
            onIgnore={() => { setVersion((v) => v + 1); }}
          />
        )}
      </AnimatePresence>

      {/* Offer form */}
      <AnimatePresence>
        {offerRequest && (
          <OfferForm
            request={offerRequest}
            onClose={closeOfferForm}
            onSubmitted={onOfferSubmitted}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
