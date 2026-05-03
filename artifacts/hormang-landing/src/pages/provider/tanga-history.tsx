/**
 * /provider/tanga-history — Provider Tanga spending history
 * Shows all offers sent + Tanga cost for each, with balance summary.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { getTangaTransactions, type TangaTransaction } from "@/lib/tanga-history-store";
import { getTangaBalance } from "@/lib/tanga-store";
import { getOffers, type Offer } from "@/lib/requests-store";
import { TangaChip } from "@/pages/plans";
import { OfferDetailModal } from "@/components/offer-detail-modal";
import { BottomNav } from "@/components/bottom-nav";
import { formatDate } from "@/lib/date-utils";

const VIOLET = "linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)";

/* ─── Transaction row ────────────────────────────────────────────── */
function TxRow({
  tx,
  offer,
  onView,
}: {
  tx: TangaTransaction;
  offer: Offer | undefined;
  onView: () => void;
}) {
  // Direction: "in" = added to balance (+), "out" = deducted (−)
  // Admin adjustments have positive `amount` regardless of direction; detect from description.
  const isAdminDeduct =
    tx.type === "admin_adjustment" &&
    (tx.description?.includes("ayirdi") || tx.description?.includes("−"));
  const direction: "in" | "out" =
    tx.type === "spend"
      ? "out"
      : tx.type === "purchase" || tx.type === "referral"
        ? "in"
        : tx.type === "admin_adjustment"
          ? (isAdminDeduct ? "out" : "in")
          : "out"; // legacy untyped → spend

  const isIn = direction === "in";
  const tone = isIn
    ? { card: "bg-emerald-50 border-emerald-100", icon: "bg-emerald-100", amount: "text-emerald-600", sign: "+" }
    : { card: "bg-white border-gray-100",         icon: "bg-amber-50",    amount: "text-amber-600",   sign: "−" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-sm overflow-hidden border ${tone.card}`}
    >
      <div className="px-4 py-3.5 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${tone.icon}`}
        >
          {tx.categoryEmoji || "📋"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">
            {tx.categoryName}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {formatDate(tx.createdAt)}
            {" · "}
            {new Date(tx.createdAt).toLocaleTimeString("uz-Latn-UZ", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-sm font-extrabold ${tone.amount}`}>
            {tone.sign}{tx.amount}&nbsp;🪙
          </span>
          {offer && (
            <button
              onClick={onView}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 transition-colors active:scale-95"
            >
              Batafsil
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function TangaHistoryPage() {
  useStoreRefresh();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [viewOfferId, setViewOfferId] = useState<string | null>(null);

  const transactions = user ? getTangaTransactions(user.id) : [];
  const balance = user ? getTangaBalance(user.id) : 0;
  const allOffers = getOffers();

  // Only "spend" type counts as offer-sending cost
  const spendTxs    = transactions.filter((t) => t.type === "spend" || (!t.type && t.amount > 0));
  const referralTxs = transactions.filter((t) => t.type === "referral");
  const totalSpent  = spendTxs.reduce((s, t) => s + t.amount, 0);
  const totalEarnedReferral = referralTxs.reduce((s, t) => s + t.amount, 0);
  const avgSpent = spendTxs.length > 0 ? Math.round(totalSpent / spendTxs.length) : 0;

  const viewedOffer = viewOfferId
    ? allOffers.find((o) => o.id === viewOfferId)
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 card-shadow">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/plans")}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-base text-gray-900">Tanga tarixi</h1>
            <p className="text-xs text-gray-400">Sarflangan Tanga tranzaksiyalari</p>
          </div>
          <TangaChip userId={user?.id ?? ""} onClick={() => setLocation("/plans")} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Balance card ── */}
        <div
          className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
          style={{ background: VIOLET }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              background: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)",
            }}
          />
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-200 mb-1 relative">
            Joriy Tanga balansi
          </p>
          <p className="text-4xl font-extrabold leading-tight relative">
            🪙 {balance}
          </p>
          <p className="text-violet-200 text-xs mt-2 relative">
            {spendTxs.length} ta taklif · {totalSpent} Tanga sarflangan
            {totalEarnedReferral > 0 && ` · +${totalEarnedReferral} Tanga referral mukofoti`}
          </p>
        </div>

        {/* ── Stats row ── */}
        {transactions.length > 0 && (
          <div className={`grid gap-3 ${totalEarnedReferral > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm text-center">
              <p className="text-[10px] font-semibold text-gray-400 mb-1">Jami sarflandi</p>
              <p className="font-extrabold text-amber-600 text-xl">
                {totalSpent}&nbsp;<span className="text-base">🪙</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm text-center">
              <p className="text-[10px] font-semibold text-gray-400 mb-1">O'rtacha xarajat</p>
              <p className="font-extrabold text-violet-600 text-xl">
                {avgSpent}&nbsp;<span className="text-base">🪙</span>
              </p>
            </div>
            {totalEarnedReferral > 0 && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3.5 shadow-sm text-center">
                <p className="text-[10px] font-semibold text-emerald-600 mb-1">Referral mukofot</p>
                <p className="font-extrabold text-emerald-600 text-xl">
                  +{totalEarnedReferral}&nbsp;<span className="text-base">🪙</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Transaction list ── */}
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🪙</p>
            <p className="font-bold text-gray-500 text-sm mb-1">
              Hali tranzaksiyalar yo'q
            </p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[220px] mx-auto">
              Taklif yuborganingizda Tanga sarflanishi bu yerda ko'rinadi
            </p>
            <button
              onClick={() => setLocation("/provider/requests")}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              style={{ background: VIOLET }}
            >
              So'rovlarni ko'rish
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              Barcha tranzaksiyalar · {transactions.length} ta
              {referralTxs.length > 0 && ` (${referralTxs.length} ta referral mukofoti)`}
            </p>
            {transactions.map((tx) => {
              const offer = allOffers.find((o) => o.id === tx.offerId);
              return (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  offer={offer}
                  onView={() => setViewOfferId(tx.offerId)}
                />
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />

      <AnimatePresence>
        {viewedOffer && (
          <OfferDetailModal
            offer={viewedOffer}
            onClose={() => setViewOfferId(null)}
            readOnly
          />
        )}
      </AnimatePresence>
    </div>
  );
}
