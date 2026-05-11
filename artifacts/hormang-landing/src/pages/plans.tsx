import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Timer, Sparkles, Check, Zap } from "lucide-react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import logoImg from "/hormang-logo.png";
import {
  getTangaBalance, getActiveTiers, type PricingTier,
  isSaleActive, getSaleRemaining, purchaseTier,
  getUserPlanPurchaseCount,
} from "@/lib/tanga-store";
import { recordTangaTransaction } from "@/lib/tanga-history-store";
import { ReferralCard } from "@/components/referral-card";
import { isUserSuspended, SUSPENDED_MESSAGE } from "@/lib/safety-store";

const GOLD_GRAD = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
const GOLD_DARK = "linear-gradient(135deg, #f59e0b 0%, #92400e 100%)";

/* ─── Coin Icon ──────────────────────────────────────────────────── */
export function CoinIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/tanga-coin.jpg"
      alt="Tanga"
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(217,119,6,0.35)",
      }}
    />
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
      const totalSec = Math.floor(diff / 1_000);
      const d = Math.floor(totalSec / 86_400);
      const h = Math.floor((totalSec % 86_400) / 3_600);
      const m = Math.floor((totalSec % 3_600) / 60);
      const s = totalSec % 60;
      if (d >= 1)  setLabel(`${d} kun qoldi`);
      else if (h >= 1) setLabel(`${h} soat ${m} daqiqa qoldi`);
      else if (m >= 1) setLabel(`${m} daqiqa ${s} soniya qoldi`);
      else         setLabel(`${s} soniya qoldi`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [validUntil]);

  return label;
}

/* ─── Plan Card ──────────────────────────────────────────────────── */
function PlanCard({
  tier, buying, bought, onBuy, userId,
}: {
  tier: PricingTier;
  buying: boolean;
  bought: boolean;
  onBuy: () => void;
  userId: string;
}) {
  const countdown  = useCountdown(tier.validUntil);
  const isExpired  = tier.validUntil ? new Date(tier.validUntil) <= new Date() : false;
  const saleActive = isSaleActive(tier);
  const effectivePrice = saleActive ? tier.salePrice! : tier.price;
  const remaining  = getSaleRemaining(tier);
  const totalTokens = tier.credits + (tier.bonusTokens ?? 0);

  const perUserLimit = tier.perUserLimit ?? 0;
  const userCount    = perUserLimit > 0 && userId ? getUserPlanPurchaseCount(userId, tier.id) : 0;
  const userLimitHit = perUserLimit > 0 && userCount >= perUserLimit;
  const userRemaining = perUserLimit > 0 ? perUserLimit - userCount : null;

  const disabled = isExpired || userLimitHit;

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
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-opacity ${disabled ? "opacity-60" : "border-amber-100"}`}>
      <div className="h-1.5 w-full" style={{ background: GOLD_GRAD }} />
      <div className="p-4">
        {/* Highlighting badges */}
        {(tier.featured || tier.hotOffer || tier.bonusPlan || tier.badge) && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {tier.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{tier.badge}</span>}
            {tier.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Tavsiya etilgan</span>}
            {tier.hotOffer && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">🔥 Qaynoq taklif</span>}
            {tier.bonusPlan && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🎁 Bonusli</span>}
          </div>
        )}

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
            <>
              <span className="text-xs text-gray-400 line-through">{tier.price.toLocaleString()} so'm</span>
              <span className="text-[10px] font-black text-white bg-orange-500 px-1.5 py-0.5 rounded-full">
                {Math.round((1 - tier.salePrice / tier.price) * 100)}% tejash
              </span>
            </>
          )}
          {!saleActive && tier.salePrice !== undefined && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Aksiya tugadi</span>
          )}
        </div>

        {/* Campaign remaining slots */}
        {saleActive && remaining !== null && (
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
            <span className="text-[10px] font-black text-orange-600">🔥</span>
            <span className="text-[11px] font-bold text-orange-700">{remaining} ta joy qoldi</span>
          </div>
        )}

        {/* Per-user limit info */}
        {perUserLimit > 0 && !userLimitHit && userRemaining !== null && (
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-[10px] font-black text-blue-600">👤</span>
            <span className="text-[11px] font-bold text-blue-700">Siz uchun: {userRemaining} ta imkoniyat</span>
          </div>
        )}
        {userLimitHit && (
          <div className="mb-2 px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-500 text-center">
            Sizning limitingiz tugadi
          </div>
        )}

        {/* Countdown */}
        {countdown && !isExpired && (
          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
            <Timer className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-[11px] font-bold text-amber-700">⏳ {countdown}</span>
          </div>
        )}
        {isExpired && tier.validUntil && (
          <div className="mb-2 px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-400 text-center">
            Muddati tugagan
          </div>
        )}

        {/* Buy button */}
        <button
          onClick={onBuy}
          disabled={disabled}
          className="w-full h-10 rounded-xl font-bold text-sm text-white transition-all active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm mt-1"
          style={{ background: disabled ? "#d1d5db" : GOLD_DARK }}
        >
          {userLimitHit ? "Limit tugdi" : "Sotib olish"}
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
    if (isUserSuspended(userId)) {
      toast({ title: SUSPENDED_MESSAGE, variant: "destructive" });
      return;
    }
    setBuying(tier.id);
    // Run the atomic purchase synchronously (no double-spend race) and only
    // use the timeout for UI feedback.
    const result = purchaseTier(userId, tier.id);
    setTimeout(() => {
      setBuying(null);
      if (!result.ok) {
        const msg =
          result.error === "sale_sold_out"          ? "Aksiya joylari tugadi."
          : result.error === "per_user_limit_exceeded" ? "Siz ushbu reja uchun limitga yetdingiz."
          : result.error === "not_started"           ? "Aksiya hali boshlanmagan."
          : result.error === "expired"               ? "Reja muddati tugagan."
          : result.error === "tier_inactive"         ? "Reja faol emas."
          : "Reja topilmadi.";
        toast({ title: "Sotib olib bo'lmadi", description: msg, variant: "destructive" });
        return;
      }
      const total = result.total!;
      recordTangaTransaction({
        userId,
        offerId: "",
        requestId: "",
        categoryName: tier.name,
        categoryEmoji: "💳",
        description: `"${tier.name}" rejasi xaridi: ${tier.credits} Tanga${(tier.bonusTokens ?? 0) > 0 ? ` + ${tier.bonusTokens} bonus` : ""}`,
        amount: total,
        priceSom: result.pricePaid,
        type: "purchase",
        source: result.source,
      });
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
          <button onClick={() => setLocation("/provider-home")} className="flex items-center flex-shrink-0">
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
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
            <img
              src="/tanga-coin.jpg"
              alt="Tanga"
              draggable={false}
              className="w-18 h-18 rounded-2xl object-cover flex-shrink-0"              
            />
            <div>
              <p className="text-5xl font-black text-white leading-none">{balance}</p>
              <p className="text-amber-200 text-xs font-semibold mt-1">Tanga</p>
            </div>
          </div>
          <p className="text-amber-200/70 text-[10px] mt-3">
            * Tangalar mijoz xizmat-so'rovlariga ijrochi takliflarini yuborish uchun ishlatiladi
          </p>
          <button
            onClick={() => setLocation("/provider/tanga-history")}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-amber-100 hover:text-white transition-colors"
          >
            🧾 Tanga sarflash tarixini ko'rish →
          </button>
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
                    userId={userId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Referral card */}
        <div className="mt-6">
          <ReferralCard title="Bepul Tanga ishlab oling" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
