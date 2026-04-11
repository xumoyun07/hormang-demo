/**
 * /my-requests — Customer's posted service requests
 * Sections: Faol so'rovlar (open) + Yakunlangan so'rovlar (closed)
 */
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, MessageCircle, ChevronRight,
  Clock, Wallet, Plus, RefreshCw, X, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import {
  getRequestsByCustomer, getOffersByRequestId, getOrCreateChat,
  updateRequestStatus,
  type CustomerRequest,
} from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";
import logoImg from "/hormang-logo.png";
import { formatDate } from "@/lib/date-utils";

/* ─── Urgency helpers ─────────────────────────────────────────────── */
const URGENCY_SHORT: Record<string, { label: string; cls: string }> = {
  today_tomorrow: { label: "Bugun / ertaga", cls: "bg-red-50 text-red-600 border-red-200" },
  "3_7_days": { label: "3–7 kun", cls: "bg-orange-50 text-orange-600 border-orange-200" },
  "1_2_weeks": { label: "1–2 hafta", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "1_month": { label: "1 oy", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  flexible: { label: "Shoshilinch emas", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

/* ─── Briefcase icon (local) ──────────────────────────────────────── */
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

/* ─── Request Card ───────────────────────────────────────────────── */
function RequestCard({
  req, index, onClose, onReopen,
}: {
  req: CustomerRequest;
  index: number;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const [, setLocation] = useLocation();
  const offers = getOffersByRequestId(req.id);
  const urgency = req.answers["urgency"] as string | undefined;
  const budget = req.answers["budget"] as number | undefined;
  const openToOffers = req.answers["budget_open"] as boolean | undefined;
  const urgencyInfo = urgency ? URGENCY_SHORT[urgency] : null;
  const isOpen = req.status === "open";

  function openChat() {
    if (offers.length === 0) return;
    const o = offers[0];
    const chat = getOrCreateChat(
      req.id, o.masterId, o.masterName, o.masterInitials, o.masterColor,
      o.avgResponseTime, req.categoryName
    );
    setLocation(`/chat/${chat.id}`);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        isOpen
          ? "border-gray-100 hover:border-gray-200 hover:shadow-sm"
          : "border-gray-100 opacity-75"
      }`}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
          isOpen ? "bg-blue-50" : "bg-gray-100"
        }`}>
          {req.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 leading-snug">{req.categoryName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
        </div>
        {/* Offer count badge */}
        {offers.length > 0 && (
          <div className={`flex-shrink-0 flex items-center gap-1 text-white text-xs font-bold px-2.5 py-1 rounded-full ${
            isOpen ? "bg-blue-600" : "bg-gray-400"
          }`}>
            <BriefcaseIcon className="w-3 h-3" />
            {offers.length}
          </div>
        )}
      </div>

      {/* Key details */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {urgencyInfo && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${urgencyInfo.cls}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {urgencyInfo.label}
          </span>
        )}
        {(openToOffers || (budget && budget > 0)) && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
            <Wallet className="w-3 h-3 inline mr-1" />
            {openToOffers ? "Taklifga ochiq" : `${Number(budget).toLocaleString()} so'm`}
          </span>
        )}
        {/* Status chip */}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          isOpen
            ? "bg-emerald-50 text-emerald-600"
            : "bg-gray-100 text-gray-500"
        }`}>
          {isOpen ? "Faol" : "Yopilgan"}
        </span>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-50 px-4 py-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs font-bold border-gray-200 gap-1.5"
          onClick={() => setLocation(`/chat-offers?requestId=${req.id}`)}
        >
          Takliflar ko'rish
          {offers.length > 0 && (
            <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white ${isOpen ? "bg-blue-600" : "bg-gray-400"}`}>
              {offers.length}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </Button>

        {/* Chat button */}
        <button
          onClick={openChat}
          disabled={offers.length === 0}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Chat ochish"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        {/* Close / Reopen button */}
        {isOpen ? (
          <button
            onClick={() => onClose(req.id)}
            className="w-9 h-9 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
            title="So'rovni yopish"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => onReopen(req.id)}
            className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
            title="Qayta faollashtirish"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────── */
function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function MyRequestsPage() {
  useStoreRefresh();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const requests = user ? getRequestsByCustomer(user.id) : [];

  function handleClose(id: string) {
    updateRequestStatus(id, "cancelled");
  }

  function handleReopen(id: string) {
    updateRequestStatus(id, "open");
  }

  const active = requests.filter((r) => r.status === "open");
  const closed = requests.filter((r) => r.status !== "open");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex items-center flex-shrink-0">
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">Mening so'rovlarim</h1>
            <p className="text-xs text-gray-400">
              {active.length} faol · {closed.length} yopilgan
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {requests.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="font-extrabold text-gray-800 text-lg mb-2">So'rovlar yo'q</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Xizmat izlash uchun kategoriya tanlang va so'rovingizni yuboring.
            </p>
            <Button
              onClick={() => setLocation("/questionnaire")}
              className="bg-blue-600 hover:bg-blue-700 font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              Yangi so'rov yuborish
            </Button>
          </motion.div>
        ) : (
          <>
            {/* New request button */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Jami {requests.length} ta so'rov
              </p>
              <button
                onClick={() => setLocation("/questionnaire")}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Yangi so'rov
              </button>
            </div>

            {/* ── Active section ── */}
            {active.length > 0 && (
              <div className="mb-6">
                <SectionLabel label="Faol so'rovlar" count={active.length} color="bg-emerald-500" />
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {active.map((req, i) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        index={i}
                        onClose={handleClose}
                        onReopen={handleReopen}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Closed section ── */}
            {closed.length > 0 && (
              <div>
                <SectionLabel label="Yakunlangan so'rovlar" count={closed.length} color="bg-gray-400" />
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {closed.map((req, i) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        index={i}
                        onClose={handleClose}
                        onReopen={handleReopen}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
