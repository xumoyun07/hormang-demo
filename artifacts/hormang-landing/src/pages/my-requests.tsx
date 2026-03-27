/**
 * /my-requests — Customer's posted service requests
 * Shows all saved requests with offer counts and quick-access chat icon.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, MessageCircle, ChevronRight,
  Clock, Wallet, Plus, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import {
  getRequests, getOffersByRequestId, getOrCreateChat,
  type CustomerRequest, type Offer,
} from "@/lib/requests-store";
import logoImg from "/hormang-logo.png";

/* ─── Urgency helpers ─────────────────────────────────────────────── */
const URGENCY_SHORT: Record<string, { label: string; cls: string }> = {
  today_tomorrow: { label: "Bugun / ertaga", cls: "bg-red-50 text-red-600 border-red-200" },
  "3_7_days": { label: "3–7 kun", cls: "bg-orange-50 text-orange-600 border-orange-200" },
  "1_2_weeks": { label: "1–2 hafta", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "1_month": { label: "1 oy", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  flexible: { label: "Shoshilinch emas", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Request Card ───────────────────────────────────────────────── */
function RequestCard({ req, index }: { req: CustomerRequest; index: number }) {
  const [, setLocation] = useLocation();
  const offers = getOffersByRequestId(req.id);
  const urgency = req.answers["urgency"] as string | undefined;
  const budget = req.answers["budget"] as number | undefined;
  const openToOffers = req.answers["budget_open"] as boolean | undefined;
  const urgencyInfo = urgency ? URGENCY_SHORT[urgency] : null;

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all duration-200"
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
          {req.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 leading-snug">{req.categoryName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
        </div>
        {/* Offer count badge */}
        {offers.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <Briefcase className="w-3 h-3" />
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
      </div>

      {/* Status */}
      <div className="px-4 pb-3">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          req.status === "open" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
        }`}>
          {req.status === "open" ? "Faol" : req.status === "accepted" ? "Qabul qilingan" : "Yopilgan"}
        </span>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-50 px-4 py-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs font-bold border-gray-200 gap-1.5"
          onClick={() => setLocation(`/offers?requestId=${req.id}`)}
        >
          Takliflar ko'rish
          {offers.length > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {offers.length}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
        <button
          onClick={openChat}
          disabled={offers.length === 0}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Chat ochish"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Lucide icon that wasn't imported at top — local alias
function Briefcase({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function MyRequestsPage() {
  const [, setLocation] = useLocation();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);

  // Reload from localStorage on mount and when window is focused
  function reload() {
    setRequests(getRequests());
  }

  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">Mening so'rovlarim</h1>
            <p className="text-xs text-gray-400">{requests.length} ta so'rov</p>
          </div>
          <button onClick={reload} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Barcha so'rovlar</p>
              <button
                onClick={() => setLocation("/questionnaire")}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Yangi so'rov
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {requests.map((req, i) => (
                  <RequestCard key={req.id} req={req} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
