import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Sparkles } from "lucide-react";
import logoImg from "/hormang-logo.png";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  getTangaBalance, addTangaBalance, getActiveTiers, type PricingTier,
  incrementSalePurchaseCount,
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

interface PlanCardProps {
  tier: PricingTier;
  buying: boolean;
  bought: boolean;
  onBuy: () => void;
}

function PlanCard({ tier, buying, bought, onBuy }: PlanCardProps) {
  const remaining = useCountdown(tier.validUntil);
  return (
    <motion.div
      className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{tier.name}</h3>
            {tier.desc ? <p className="text-xs text-gray-400 mt-1">{tier.desc}</p> : null}
          </div>
          <div className="text-right">
            <div className="font-black text-xl text-amber-600">{tier.credits}</div>
            <div className="text-[10px] text-gray-400">Tanga</div>
          </div>
        </div>

        {remaining && (
          <p className="text-[11px] text-amber-700 font-semibold mb-3 flex items-center gap-1">
            <Timer className="w-3 h-3" /> {remaining}
          </p>
        )}

        <button
          onClick={onBuy}
          disabled={buying || bought}
          className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: bought ? "#10B981" : GOLD_GRAD }}
        >
          {buying ? "Sotib olinmoqda..." : bought ? "Sotib olindi" : "Sotib olish"}
        </button>
      </div>
    </motion.div>
  );
}

export default function PlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [balance, setBalance] = useState(0);
  const [buying, setBuying] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);

  useEffect(() => {
    setTiers(getActiveTiers());
    if (user?.id) setBalance(getTangaBalance(user.id));
  }, [user?.id]);

  async function handleBuy(tier: PricingTier) {
    if (!user?.id) return;
    setBuying(tier.id);
    try {
      const tokensToAdd = tier.credits + (tier.bonusTokens ?? 0);
      addTangaBalance(user.id, tokensToAdd);
      incrementSalePurchaseCount(tier.id);
      setBalance(getTangaBalance(user.id));
      setBought(tier.id);
      toast({ title: `+${tokensToAdd} Tanga hisobingizga qo'shildi` });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik yuz berdi", variant: "destructive" });
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 card-shadow">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/provider-home")}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
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
          <button
            onClick={() => setLocation("/provider/tanga-history")}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-amber-100 hover:text-white transition-colors"
          >
            🧾 Tanga sarflash tarixini ko'rish →
          </button>
        </motion.div>

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
