import { useState } from "react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, MessageCircle, ChevronRight,
  Clock, Wallet, Plus, RefreshCw, X, CheckCircle2, History,
} from "lucide-react";
import { RequestPreviewModal } from "@/components/request-preview-modal";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import {
  getRequestsByCustomer, getOffersByRequestId, getOrCreateChat,
  updateRequestStatus, getRequestCounts, MAX_ACTIVE_OFFERS,
  type CustomerRequest,
} from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { tFormat } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n/locales/uz";
import { getCategoryDisplayName } from "@/lib/categories";
import logoImg from "/hormang-logo.png";
import { formatDate } from "@/lib/date-utils";

const URGENCY_CLS: Record<string, string> = {
  today_tomorrow: "bg-red-50 text-red-600 border-red-200",
  "3_7_days": "bg-orange-50 text-orange-600 border-orange-200",
  "1_2_weeks": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "1_month": "bg-emerald-50 text-emerald-600 border-emerald-200",
  flexible: "bg-gray-50 text-gray-600 border-gray-200",
};

function urgencyLabel(u: string, t: Dict): string | null {
  const map = t.requestHistory.urgency as Record<string, string>;
  return map[u] ?? null;
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

type CardMode = "active" | "cancelled";

function RequestCard({
  req, index, mode, onClose, onReopen,
}: {
  req: CustomerRequest;
  index: number;
  mode: CardMode;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const [, setLocation] = useLocation();
  const { t, locale } = useI18n();
  const [previewOpen, setPreviewOpen] = useState(false);
  const offers = getOffersByRequestId(req.id);
  const counts = getRequestCounts(req.id);
  const isMatched = req.status === "matched" || !!req.acceptedOfferId;
  const urgency = req.answers["urgency"] as string | undefined;
  const budget = req.answers["budget"] as number | undefined;
  const openToOffers = req.answers["budget_open"] as boolean | undefined;
  const urgencyText = urgency ? urgencyLabel(urgency, t) : null;
  const urgencyCls = urgency ? URGENCY_CLS[urgency] : null;

  const isActive = mode === "active";

  function openChat() {
    if (offers.length === 0) return;
    const o = offers[0];
    const chat = getOrCreateChat(
      req.id, o.masterId, o.masterName, o.masterInitials, o.masterColor,
      o.avgResponseTime, req.categoryName
    );
    setLocation(`/chat/${chat.id}`);
  }

  const statusChip =
    isMatched
      ? { label: t.myRequests.chipMatched, cls: "bg-blue-50 text-blue-600" }
      : mode === "active"
        ? { label: t.myRequests.chipActive, cls: "bg-emerald-50 text-emerald-600" }
        : { label: t.myRequests.chipCancelled, cls: "bg-gray-100 text-gray-500" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        isActive
          ? "border-gray-100 hover:border-gray-200 hover:shadow-sm"
          : "border-gray-100 opacity-75"
      }`}
    >
      <div
        className="px-4 pt-4 pb-3 flex items-start gap-3 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => setPreviewOpen(true)}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
          isActive ? "bg-blue-50" : "bg-gray-100"
        }`}>
          {req.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 leading-snug">{getCategoryDisplayName(req.categoryId, locale, req.categoryName)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt, { months: t.shared.months })}</p>
        </div>
        {offers.length > 0 && (
          <div className={`flex-shrink-0 flex items-center gap-1 text-white text-xs font-bold px-2.5 py-1 rounded-full ${
            isActive ? "bg-blue-600" : "bg-gray-400"
          }`}>
            <BriefcaseIcon className="w-3 h-3" />
            {offers.length}
          </div>
        )}
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {urgencyText && urgencyCls && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${urgencyCls}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {urgencyText}
          </span>
        )}
        {(openToOffers || (budget && budget > 0)) && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
            <Wallet className="w-3 h-3 inline mr-1" />
            {openToOffers ? t.myRequests.openToOffers : `${Number(budget).toLocaleString()} ${t.myRequests.sumSuffix}`}
          </span>
        )}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusChip.cls}`}>
          {statusChip.label}
        </span>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-600">
          {tFormat(t.myRequests.activeOffersTpl, { n: counts.active, max: MAX_ACTIVE_OFFERS })}
        </span>
        {isMatched && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 inline-flex items-center gap-1">
            {t.myRequests.closedLock}
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
          {t.myRequests.viewOffers}
          {offers.length > 0 && (
            <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white ${isActive ? "bg-blue-600" : "bg-gray-400"}`}>
              {offers.length}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </Button>

        <button
          onClick={openChat}
          disabled={offers.length === 0}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={t.myRequests.openChatTitle}
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        {mode === "active" && (
          <button
            onClick={() => onClose(req.id)}
            className="w-9 h-9 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
            title={t.myRequests.closeRequestTitle}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {mode === "cancelled" && (
          <button
            onClick={() => onReopen(req.id)}
            className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
            title={t.myRequests.reactivateTitle}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}

      </div>

      <AnimatePresence>
        {previewOpen && (
          <RequestPreviewModal req={req} onClose={() => setPreviewOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

export default function MyRequestsPage() {
  useStoreRefresh();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const requests = user ? getRequestsByCustomer(user.id) : [];

  function handleClose(id: string) {
    updateRequestStatus(id, "cancelled");
  }

  function handleReopen(id: string) {
    updateRequestStatus(id, "open");
  }

  const active = requests.filter((r) => r.status === "open");
  const cancelled = requests.filter((r) => r.status === "cancelled");
  const visibleRequests = [...active, ...cancelled];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex items-center flex-shrink-0">
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">{t.myRequests.title}</h1>
            <p className="text-xs text-gray-400">
              {tFormat(t.myRequests.countsTpl, { active: active.length, cancelled: cancelled.length })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {visibleRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="font-extrabold text-gray-800 text-lg mb-2">{t.myRequests.empty.title}</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              {t.myRequests.empty.desc}
            </p>
            <Button
              onClick={() => setLocation("/questionnaire")}
              className="bg-blue-600 hover:bg-blue-700 font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.myRequests.empty.newRequest}
            </Button>

            {requests.some((r) => r.status === "completed") && (
              <h3>
                <button
                  onClick={() => { sessionStorage.setItem("request_history_referrer", "/my-requests"); setLocation("/request-history"); }}
                  className="mt-4 text-xs font-bold text-blue-500 hover:underline hover:text-blue-600"
                >
                  {t.myRequests.empty.viewCompleted}
                </button>
              </h3>
            )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setLocation("/questionnaire")}
                className="h-7 px-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 gap-1.5 text-white rounded-xl flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.myRequests.newRequest}
              </button>
              <button
                onClick={() => { sessionStorage.setItem("request_history_referrer", "/my-requests"); setLocation("/request-history"); }}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                {t.myRequests.history}
              </button>
            </div>

            {active.length > 0 && (
              <div className="mb-6">
                <SectionLabel label={t.myRequests.sectionActive} count={active.length} color="bg-emerald-500" />
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {active.map((req, i) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        index={i}
                        mode="active"
                        onClose={handleClose}
                        onReopen={handleReopen}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {cancelled.length > 0 && (
              <div>
                <SectionLabel label={t.myRequests.sectionCancelled} count={cancelled.length} color="bg-gray-400" />
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {cancelled.map((req, i) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        index={i}
                        mode="cancelled"
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
