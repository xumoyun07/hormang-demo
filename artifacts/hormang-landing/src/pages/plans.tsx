import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Timer, Sparkles, Check, Zap } from "lucide-react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  getTangaBalance, addTangaBalance, getActiveTiers, type PricingTier,
  isSaleActive, getSaleRemaining, incrementSalePurchaseCount,
} from "@/lib/tanga-store";

const GOLD_GRAD = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
const GOLD_DARK = "linear-gradient(135deg, #f59e0b 0%, #92400e 100%)";

/* ─── Coin Icon ──────────────────────────────────────────────────── */
export function CoinIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: size, height: size,
        background: GOLD_GRAD,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white",
        fontWeight: 900,
        fontSize: Math.round(size * 0.44),
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(217,119,6,0.35)",
        letterSpacing: "-0.5px",
      }}
    >
      T
    </div>
  );
}

/* ─── Tanga Balance Chip ─────────────────────────────────────────── */
export function TangaChip({ userId, onClick }: { userId: string; onClick?: () => void }) {
  useStoreRefresh();
  const balance = getTangaBalance(userId);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all"
    >
      <CoinIcon size={16} />
      <span className="text-xs font-bold text-amber-700 leading-none">{balance}</span>
    </button>
  );
}

/* ─── Countdown hook ─────────────────────────────────────────────── */
function useCountdown(validUntil?: string): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!validUntil) { setLabel(null); return; }

    function tick() {
      const diff = new Date(validUntil!).getTime() - Date.now();
      if (diff <= 0) { setLabel(null); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(d > 0 ? `${d}k ${h}s ${m}d` : `${h}s ${m}d ${s}sek`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [validUntil]);

  return label;
}

/* ─── Plan Card ──────────────────────────────────────────────────── */
function PlanCard({
  tier, buying, bought, onBuy,
}: {
  tier: PricingTier;
  buying: boolean;
  bought: boolean;
  onBuy: () => void;
}) {
  const countdown = useCountdown(tier.validUntil);
  const isExpired = tier.validUntil ? new Date(tier.validUntil) <= new Date() : false;
  const saleActive = isSaleActive(tier);
  const effectivePrice = saleActive ? tier.salePrice! : tier.price;
  const remaining = getSaleRemaining(tier);
  const totalTokens = tier.credits + (tier.bonusTokens ?? 0);

  if (bought) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[220px] gap-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="font-extrabold text-emerald-700 text-sm">Muvaffaqiyatli!</p>
        <p className="text-xs text-emerald-600">{totalTokens} Tanga qo'shildi 🎉</p>
      </div>
    );
  }

  if (buying) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[220px] gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-amber-400 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Sotib olinmoqda…</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-opacity ${isExpired ? "opacity-60" : "border-amber-100"}`}>
      <div className="h-1.5 w-full" style={{ background: GOLD_GRAD }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-extrabold text-sm text-gray-900">{tier.name}</p>
            {tier.desc && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{tier.desc}</p>}
          </div>
          {(tier.bonusTokens ?? 0) > 0 && (
            <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full whitespace-nowrap">
              <Zap className="w-2.5 h-2.5" />+{tier.bonusTokens}
            </span>
          )}
        </div>

        {/* Token amount */}
        <div className="flex items-center gap-2.5 mb-3">
          <CoinIcon size={32} />
          <div>
            <p className="text-3xl font-black text-gray-900 leading-none">{tier.credits}</p>
            {(tier.bonusTokens ?? 0) > 0 && (
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                +{tier.bonusTokens} bonus → jami {totalTokens} Tanga
              </p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-extrabold text-gray-900">
            {effectivePrice === 0 ? "Bepul" : `${effectivePrice.toLocaleString()} so'm`}
          </span>
          {saleActive && tier.salePrice !== undefined && tier.price > tier.salePrice && (
            <span className="text-xs text-gray-400 line-through">{tier.price.toLocaleString()} so'm</span>
          )}
          {!saleActive && tier.salePrice !== undefined && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Chegirma tugadi</span>
          )}
        </div>

        {/* Sale remaining slots */}
        {saleActive && remaining !== null && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
            <span className="text-[10px] font-black text-orange-600">🔥</span>
            <span className="text-[11px] font-bold text-orange-700">
              Chegirma: {remaining} ta joy qoldi
            </span>
          </div>
        )}

        {/* Countdown */}
        {countdown && !isExpired && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
            <Timer className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-[11px] font-bold text-amber-700">Qoldi: {countdown}</span>
          </div>
        )}
        {isExpired && tier.validUntil && (
          <div className="mb-3 px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-400 text-center">
            Muddati tugagan
          </div>
        )}

        {/* Buy button */}
        <button
          onClick={onBuy}
          disabled={isExpired}
          className="w-full h-10 rounded-xl font-bold text-sm text-white transition-all active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          style={{ background: isExpired ? "#d1d5db" : GOLD_DARK }}
        >
          Sotib olish
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function PlansPage() {
  useStoreRefresh();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const userId = user?.id ?? "";
  const balance = userId ? getTangaBalance(userId) : 0;
  const tiers = getActiveTiers();

  const [buying, setBuying] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);

  function handleBuy(tier: PricingTier) {
    if (!userId || buying) return;
    const wasOnSale = isSaleActive(tier);
    setBuying(tier.id);
    setTimeout(() => {
      const total = tier.credits + (tier.bonusTokens ?? 0);
      if (wasOnSale && tier.saleLimit !== undefined) {
        incrementSalePurchaseCount(tier.id);
      }
      addTangaBalance(userId, total);
      setBuying(null);
      setBought(tier.id);
      toast({
        title: `${total} Tanga qo'shildi! 🎉`,
        description: `Joriy balans: ${getTangaBalance(userId)} Tanga`,
      });
      setTimeout(() => setBought(null), 2500);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 card-shadow">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">Tanga Rejalari</h1>
            <p className="text-xs text-gray-400">Xizmatlar uchun tokenlar sotib oling</p>
          </div>
          <CoinIcon size={30} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Balance hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden shadow-md"
          style={{ background: GOLD_DARK }}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 80% 10%, white 0%, transparent 55%)" }}
          />
          <p className="text-sm font-semibold text-amber-100 mb-3">Joriy balans</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl font-black shadow-inner">
              T
            </div>
            <div>
              <p className="text-5xl font-black text-white leading-none">{balance}</p>
              <p className="text-amber-200 text-xs font-semibold mt-1">Tanga</p>
            </div>
          </div>
          <p className="text-amber-200/70 text-[10px] mt-3">
            * Tangalar mijoz xizmat-so'rovlariga ijrochi takliflarini yuborish uchun ishlatiladi
          </p>
        </motion.div>

        {/* Plans */}
        {tiers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <p className="font-bold text-gray-600 mb-1">Hozircha faol rejalar yo'q</p>
            <p className="text-sm text-gray-400">Admin tez orada yangi rejalar qo'shadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {tiers.map((tier, i) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <PlanCard
                    tier={tier}
                    buying={buying === tier.id}
                    bought={bought === tier.id}
                    onBuy={() => handleBuy(tier)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
