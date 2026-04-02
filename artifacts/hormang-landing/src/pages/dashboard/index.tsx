import { useState, useEffect } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "/hormang-logo.png";
import {
  Search, ClipboardList, Heart, Settings, LogOut, ChevronRight,
  Inbox, TrendingUp, Star, Eye, CheckCircle2, MapPin,
  ShoppingBag, Briefcase, Loader2, ArrowRight,
  Phone, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { saveProviderProfile } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import {
  getLocalProfile, getCompletionChecks, getCompletionPct,
  type LocalProfile,
} from "@/lib/local-profile";
import {
  getMatchingRequests, getSeenIds,
} from "@/lib/provider-store";

const VIOLET_SOLID = "hsl(262,80%,54%)";
const VIOLET_GRAD  = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

function RoleSwitcher() {
  const { activeRole, switchRole } = useAuth();

  return (
    <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
      {(["buyer", "provider"] as const).map((role) => {
        const active = activeRole === role;
        return (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors duration-150 z-10 ${
              active ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {active && (
              <motion.div
                layoutId="role-pill"
                className="absolute inset-0 rounded-xl shadow-sm"
                style={{
                  background: role === "buyer"
                    ? "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)"
                    : "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">
              {role === "buyer" ? <ShoppingBag className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
            </span>
            <span className="relative hidden sm:inline">
              {role === "buyer" ? "Xaridor" : "Ijrochi"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BecomeProviderCard({ onBecome }: { onBecome: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 text-white mb-5 shadow-md"
      style={{ background: VIOLET_GRAD }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-base leading-tight">Ijrochi bo'lishni istaysizmi?</h3>
          <p className="text-white/75 text-xs mt-0.5">Profil to'ldiring va mijozlar toping</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-xs text-white/80 mb-4">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-white/60 flex-shrink-0" /> Xizmatlaringizni e'lon qiling</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-white/60 flex-shrink-0" /> Yangi buyurtmalar oling</div>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-white/60 flex-shrink-0" /> O'z jadvalingizda ishlang</div>
      </div>
      <button
        onClick={onBecome}
        className="w-full bg-white text-violet-700 font-extrabold py-2.5 rounded-xl text-sm hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        Ijrochi bo'lish <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function BuyerContent({ onNavigate, onBecome }: { onNavigate: (path: string) => void; onBecome: () => void }) {
  const { providerProfile } = useAuth();
  const items = [
    {
      icon: Search,
      title: "Xizmat qidirish",
      desc: "Mahalliy mutaxassislarni toping",
      action: () => onNavigate("/"),
      highlight: true,
    },
    {
      icon: ClipboardList,
      title: "Buyurtmalarim",
      desc: "Barcha buyurtmalar va holati",
      badge: "Tez kunda",
    },
    {
      icon: Heart,
      title: "Saqlanganlar",
      desc: "Sevimli ijrochilar",
      badge: "Tez kunda",
    },
    {
      icon: Settings,
      title: "Profil sozlamalari",
      desc: "Ma'lumotlar, parol va hisobing",
      action: () => onNavigate("/profile/settings"),
    },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ icon: Icon, title, desc, action, highlight, badge }, i) => (
        <motion.button
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          whileHover={action ? { scale: 1.01, y: -1 } : {}}
          whileTap={action ? { scale: 0.99 } : {}}
          onClick={action}
          disabled={!action}
          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
            highlight
              ? "text-white border-transparent"
              : action
              ? "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md card-shadow"
              : "bg-white border-gray-100 opacity-55 cursor-not-allowed card-shadow"
          }`}
          style={highlight ? { background: "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)" } : {}}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${action ? "group-hover:scale-110" : ""} ${highlight ? "bg-white/20" : "bg-blue-50"}`}>
            <Icon className={`w-5 h-5 ${highlight ? "text-white" : "text-blue-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm ${highlight ? "text-white" : "text-gray-900"}`}>{title}</h3>
            <p className={`text-xs truncate ${highlight ? "text-blue-100" : "text-gray-500"}`}>{desc}</p>
          </div>
          {badge ? (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{badge}</span>
          ) : action ? (
            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-blue-200" : "text-gray-400 group-hover:text-blue-500"}`} />
          ) : null}
        </motion.button>
      ))}
      {!providerProfile && <BecomeProviderCard onBecome={onBecome} />}
    </div>
  );
}

function CircularProgress({ pct }: { pct: number }) {
  const r    = 34;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct < 40 ? "#EF4444" : pct < 75 ? "#F97316" : VIOLET_SOLID;
  return (
    <svg width="88" height="88" className="rotate-[-90deg]"
      style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.2))" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#EDE9FE" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r} fill="none" strokeWidth="7"
        stroke={pct < 75 ? color : "url(#pgradUnified)"}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease" }}
      />
      <defs>
        <linearGradient id="pgradUnified" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(262,80%,54%)" />
          <stop offset="100%" stopColor="hsl(236,76%,60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ProviderContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, providerProfile } = useAuth();
  const { toast } = useToast();
  const [local, setLocal] = useState<LocalProfile>({});

  useEffect(() => {
    if (user?.id) setLocal(getLocalProfile(user.id));
  }, [user?.id]);

  const completionLocal = {
    photoUrl:       local.photoUrl,
    region:         local.region,
    district:       local.district,
    experience:     local.experience,
    portfolioItems: local.portfolioItems ?? [],
  };
  const checks  = getCompletionChecks(user ?? null, providerProfile ?? null, completionLocal);
  const pct     = getCompletionPct(checks);
  const missing = checks.filter((c) => !c.done);

  const avgRating      = 0;
  const reviewCount    = 0;
  const completedCount = 0;

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;
  const hasPhoto = !!local.photoUrl;

  const selectedCategories = providerProfile?.categories ?? [];
  const requests = getMatchingRequests(selectedCategories);
  const seen = getSeenIds();
  const unseenCount = requests.filter((r) => !seen.includes(r.id) && r.status === "open").length;

  const menuItems = [
    {
      icon: Inbox,
      title: "Yangi so'rovlar",
      desc: "Kelayotgan buyurtma so'rovlarini ko'ring",
      badge: unseenCount.toString(),
      badgeColor: "bg-blue-600 text-white",
      action: () => onNavigate("/provider/requests"),
    },
    {
      icon: TrendingUp,
      title: "Statistika",
      desc: "Ko'rishlar, buyurtmalar va daromad",
      comingSoon: true,
    },
    {
      icon: Star,
      title: "Sharhlarim",
      desc: "Mijozlar fikr-mulohazalari",
      comingSoon: true,
    },
    {
      icon: Eye,
      title: "Ommaviy profilim",
      desc: "Mijozlar ko'radigan profilingiz",
      action: () => onNavigate(`/providers/${user?.id}`),
    },
    {
      icon: Settings,
      title: "Profil sozlamalari",
      desc: "Xizmatlar, bio, parol va hisobing",
      action: () => onNavigate("/profile/settings"),
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Profile header card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 card-shadow p-4"
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {hasPhoto ? (
              <img
                src={local.photoUrl}
                alt={user?.firstName}
                className="w-[72px] h-[72px] rounded-2xl object-cover ring-2 ring-violet-100"
              />
            ) : (
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white text-xl font-black ring-2 ring-violet-100"
                style={{ background: VIOLET_GRAD }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                style={{ background: VIOLET_GRAD }}>
                Ijrochi
              </span>
            </div>

            {(local.region || providerProfile?.preferredLocation) && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                <MapPin className="w-3 h-3" />
                {local.region || providerProfile?.preferredLocation}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1"
                onClick={() => toast({ title: "Sharhlar modali tez kunda qo'shiladi" })}
              >
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
                <span className="text-xs font-bold text-gray-700 ml-0.5">
                  {avgRating > 0 ? avgRating.toFixed(1) : "–"}
                </span>
                {reviewCount > 0 && (
                  <span className="text-xs text-gray-400">({reviewCount})</span>
                )}
              </button>
              <span className="text-gray-200">·</span>
              <button
                className="flex items-center gap-1"
                onClick={() => toast({ title: "Xizmatlar tarixi tez kunda qo'shiladi" })}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-semibold text-gray-600">{completedCount} bajarildi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category chips */}
        {(providerProfile?.categories?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {providerProfile!.categories.slice(0, 4).map(cat => (
              <span key={cat}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                {cat}
              </span>
            ))}
            {providerProfile!.categories.length > 4 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-gray-50 text-gray-400 border border-gray-100">
                +{providerProfile!.categories.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Verification badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {user?.phone ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-green-50 text-green-700 border border-green-100">
              <Phone className="w-3 h-3" /> Telefon tasdiqlangan
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <Phone className="w-3 h-3" /> Telefon tasdiqlanmagan
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-gray-50 text-gray-400 border border-gray-100">
            <ShieldCheck className="w-3 h-3" /> ID tekshiruvi — tez kunda
          </span>
        </div>
      </motion.div>

      {/* ── Completion card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-100 card-shadow p-4"
      >
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <CircularProgress pct={pct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black"
                style={{ color: pct === 100 ? VIOLET_SOLID : pct < 40 ? "#EF4444" : pct < 75 ? "#F97316" : VIOLET_SOLID }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 mb-1">
              {pct === 100 ? "Profil to'liq! 🎉" : "Profilni to'ldiring"}
            </p>
            {/* Bar */}
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: pct < 40 ? "#EF4444" : pct < 75 ? "#F97316" : VIOLET_GRAD,
                }}
              />
            </div>
            {pct < 100 && (
              <p className="text-xs text-gray-400">{missing.length} ta maydon qoldi</p>
            )}
          </div>
        </div>

        {/* Missing items list */}
        {missing.length > 0 && (
          <div className="mt-3 space-y-2">
            {missing.map((item) => (
              <div key={item.key}
                className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-violet-600 flex-shrink-0 bg-violet-50 border border-violet-100 rounded-lg px-1.5 py-0.5">
                    {item.weight}%
                  </span>
                  <span className="text-xs text-gray-600 truncate">{item.label}</span>
                </div>
                <button
                  onClick={() => onNavigate("/profile/settings")}
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex-shrink-0 transition-colors"
                >
                  Qo'shish →
                </button>
              </div>
            ))}
          </div>
        )}

        {pct === 100 && (
          <div className="mt-3 flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-violet-700">
              Profil to'liq to'ldirilgan
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Menu items ── */}
      {menuItems.map(({ icon: Icon, title, desc, action, badge, badgeColor, comingSoon }, i) => (
        <motion.button
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.055, duration: 0.35 }}
          whileHover={action ? { scale: 1.01, y: -1 } : {}}
          whileTap={action ? { scale: 0.99 } : {}}
          onClick={action}
          disabled={!action}
          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group card-shadow ${
            action
              ? "bg-white border-gray-100 hover:border-violet-200 hover:shadow-md"
              : "bg-white border-gray-100 opacity-55 cursor-not-allowed"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 transition-transform ${action ? "group-hover:scale-110" : ""}`}>
            <Icon className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 truncate">{desc}</p>
          </div>
          {badge ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          ) : comingSoon ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Tez kunda</span>
          ) : action ? (
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 flex-shrink-0" />
          ) : null}
        </motion.button>
      ))}
    </div>
  );
}

export default function UnifiedDashboard() {
  const { user, providerProfile, activeRole, switchRole, setAuth, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [logoHovered, setLogoHovered] = useState(false);
  const [headerLocal, setHeaderLocal] = useState<LocalProfile>({});
  const [becomingProvider, setBecomingProvider] = useState(false);

  useEffect(() => {
    if (user?.id) setHeaderLocal(getLocalProfile(user.id));
  }, [user?.id]);

  const isProvider = activeRole === "provider";
  const hasBothRoles = !!providerProfile;

  const accentGradient = isProvider
    ? "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)"
    : "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  async function handleBecomeProvider() {
    if (!user) return;
    setBecomingProvider(true);
    try {
      const res = await saveProviderProfile({ categories: [] });
      setAuth(user, res.profile);
      switchRole("provider");
      sessionStorage.setItem("justBecameProvider", "1");
      setLocation("/profile/settings");
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik yuz berdi", variant: "destructive" });
    } finally {
      setBecomingProvider(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 card-shadow">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            {/* Logo */}
            <button
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setLocation("/provider-home")}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
            >
              <motion.img
                src={logoImg}
                alt="Hormang"
                animate={logoHovered
                  ? { rotate: [-8, 8], transition: { repeat: Infinity, repeatType: "reverse", duration: 0.35, ease: "easeInOut" } }
                  : { rotate: 0, transition: { duration: 0.25, ease: "easeOut" } }
                }
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-gray-900 text-sm hidden sm:inline">Hormang</span>
            </button>

            {/* Center: role switcher (both roles) OR "Ijrochi bo'lish" (buyer only) */}
            <div className="flex-1 flex justify-center">
              {hasBothRoles ? (
                <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
                  {(["buyer", "provider"] as const).map((role) => {
                    const active = activeRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => switchRole(role)}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors duration-150 z-10 ${
                          active ? "text-white" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="role-pill"
                            className="absolute inset-0 rounded-xl shadow-sm"
                            style={{ background: accentGradient }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative">
                          {role === "buyer" ? <ShoppingBag className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                        </span>
                        <span className="relative">{role === "buyer" ? "Xaridor" : "Ijrochi"}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={handleBecomeProvider}
                  disabled={becomingProvider}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                  style={{ background: VIOLET_GRAD }}
                >
                  {becomingProvider
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Briefcase className="w-3.5 h-3.5" />
                  }
                  Ijrochi bo'lish
                </button>
              )}
            </div>

            {/* Right: avatar + logout */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation("/profile/settings")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm transition-all duration-500 overflow-hidden flex-shrink-0"
                style={headerLocal.photoUrl ? {} : { background: accentGradient }}
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {headerLocal.photoUrl ? (
                  <img src={headerLocal.photoUrl} alt={user?.firstName} className="w-full h-full object-cover" />
                ) : (
                  user?.firstName?.[0]
                )}
              </button>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 pb-28">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {!isProvider && (
              <div className="flex items-center gap-4 mb-7">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md transition-all duration-500"
                  style={{ background: accentGradient }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                      style={{ background: accentGradient }}
                    >
                      Xaridor rejimi
                    </span>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isProvider ? (
                <motion.div
                  key="provider"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProviderContent onNavigate={setLocation} />
                </motion.div>
              ) : (
                <motion.div
                  key="buyer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <BuyerContent onNavigate={setLocation} onBecome={handleBecomeProvider} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 text-center">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                size="sm"
                className="border-2 font-semibold gap-2"
              >
                Bosh sahifaga qaytish <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </main>
      </div>

      <BottomNav />
    </>
  );
}
