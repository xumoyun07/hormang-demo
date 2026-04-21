import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, Clock, MessageCircle, Wallet,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { RequestPreviewModal } from "@/components/request-preview-modal";
import {
  getRequestsByCustomer,
  getOffersByRequestId,
  getOrCreateChat,
  type CustomerRequest,
} from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/date-utils";

const URGENCY_SHORT: Record<string, { label: string; cls: string }> = {
  today_tomorrow: { label: "Bugun / ertaga", cls: "bg-red-50 text-red-600 border-red-200" },
  "3_7_days": { label: "3–7 kun", cls: "bg-orange-50 text-orange-600 border-orange-200" },
  "1_2_weeks": { label: "1–2 hafta", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "1_month": { label: "1 oy", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  flexible: { label: "Shoshilinch emas", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function CompletedRequestCard({ req, index }: { req: CustomerRequest; index: number }) {
  const [, setLocation] = useLocation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const offers = getOffersByRequestId(req.id);
  const completedOffer = offers.find((o) => o.status === "completed")
    ?? offers.find((o) => o.status === "in_progress" || o.status === "accepted")
    ?? offers[0];
  const urgency = req.answers["urgency"] as string | undefined;
  const budget = req.answers["budget"] as number | undefined;
  const openToOffers = req.answers["budget_open"] as boolean | undefined;
  const urgencyInfo = urgency ? URGENCY_SHORT[urgency] : null;

  function openChat() {
    if (!completedOffer) return;
    const chat = getOrCreateChat(
      req.id,
      completedOffer.masterId,
      completedOffer.masterName,
      completedOffer.masterInitials,
      completedOffer.masterColor,
      completedOffer.avgResponseTime,
      req.categoryName
    );
    setLocation(`/chat/${chat.id}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="bg-white rounded-2xl border border-blue-100 overflow-hidden card-shadow"
    >
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="w-full px-4 pt-4 pb-3 flex items-start gap-3 text-left active:bg-gray-50 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
          {req.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-gray-900 leading-snug">{req.categoryName}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              <CheckCircle2 className="w-3 h-3" />
              Yakunlangan
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
          {completedOffer && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              Ijrochi: <span className="font-semibold text-gray-700">{completedOffer.masterName}</span>
            </p>
          )}
        </div>
        {offers.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1 text-white text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500">
            <BriefcaseIcon className="w-3 h-3" />
            {offers.length}
          </div>
        )}
      </button>

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

      <div className="border-t border-gray-50 px-4 py-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs font-bold border-gray-200 gap-1.5"
          onClick={() => setLocation(`/chat-offers?requestId=${req.id}`)}
        >
          Takliflar ko'rish
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
        <button
          onClick={openChat}
          disabled={!completedOffer}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Chat ochish"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {previewOpen && (
          <RequestPreviewModal req={req} onClose={() => setPreviewOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RequestHistoryPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const requests = user ? getRequestsByCustomer(user.id) : [];
  const completed = requests
    .filter((r) => r.status === "completed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-sm text-gray-900">Buyurtmalarim</h1>
            <p className="text-xs text-gray-400">{completed.length} ta yakunlangan xizmat</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {completed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="font-extrabold text-gray-800 text-lg mb-2">Hali yakunlangan buyurtmalar yo'q</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Xizmat yakunlangandan keyin buyurtma tarixi shu yerda ko'rinadi.
            </p>
            <Button
              onClick={() => setLocation("/my-requests")}
              className="bg-blue-600 hover:bg-blue-700 font-bold"
            >
              Faol so'rovlarga o'tish
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {completed.map((req, i) => (
                <CompletedRequestCard key={req.id} req={req} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}