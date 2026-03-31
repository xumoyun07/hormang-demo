import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "/hormang-logo.png";
import {
  Search, ClipboardList, Heart, Settings, LogOut, ChevronRight,
  Inbox, TrendingUp, Star, Eye, CheckCircle2, MapPin,
  ShoppingBag, Briefcase, Loader2, ArrowRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { saveProviderProfile } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const SERVICE_CATEGORIES = [
  "Tozalik", "Ta'mirlash / Usta", "Enaga / Bola parvarishi",
  "Ovqat pishirish", "Ko'chirish / Transport", "Go'zallik / Sartaroshlik",
  "Avto xizmat", "Repetitor / O'qituvchi", "Elektr ishlari",
  "Santexnika", "Dizayn / Yaratuvchanlik", "Boshqalar",
];

const setupSchema = z.object({
  categories: z.array(z.string()).optional(),
  bio: z.string().max(300).optional(),
  preferredLocation: z.string().optional(),
});
type SetupForm = z.infer<typeof setupSchema>;

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

function ProviderSetupModal({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { user, setAuth, providerProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { categories: [] },
  });

  function toggleCat(cat: string) {
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function onSubmit(data: SetupForm) {
    if (!selected.length) return;
    setLoading(true);
    try {
      const res = await saveProviderProfile({
        categories: selected,
        bio: data.bio,
        preferredLocation: data.preferredLocation,
      });
      setAuth(user!, res.profile);
      toast({ title: "Ijrochi profili yaratildi!" });
      onDone();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
                style={{ background: "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)" }}>
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Ijrochi profilingizni yarating</h2>
              <p className="text-sm text-gray-500 mt-0.5">Xizmatlaringizni qo'shing va mijozlar toping</p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Xizmat turlari <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(cat => {
                  const active = selected.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCat(cat)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold border-2 transition-all flex items-center gap-1 ${
                        active
                          ? "text-white border-transparent shadow-sm"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300"
                      }`}
                      style={active ? { background: "linear-gradient(135deg, hsl(262,80%,54%), hsl(236,76%,60%))" } : {}}
                    >
                      {active && <CheckCircle2 className="w-3 h-3" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
              {errors.categories && <p className="text-red-500 text-xs mt-1.5">Kamida bitta tanlang</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Bio <span className="text-gray-400 font-normal normal-case">(ixtiyoriy)</span>
              </label>
              <textarea
                {...register("bio")}
                rows={2}
                placeholder="O'zingiz haqida qisqacha..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Hudud
              </label>
              <input
                {...register("preferredLocation")}
                placeholder="Toshkent"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={onCancel} size="sm" className="border-2 font-semibold flex-shrink-0">
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={loading || !selected.length}
                size="sm"
                className="flex-1 font-bold gap-2"
                style={{ background: "linear-gradient(135deg, hsl(262,80%,54%), hsl(236,76%,60%))" }}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {loading ? "Yaratilmoqda..." : "Profil yaratish"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BuyerContent({ onNavigate }: { onNavigate: (path: string) => void }) {
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
    </div>
  );
}

function ProviderContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, providerProfile } = useAuth();

  const completeness = [
    !!providerProfile?.categories?.length,
    !!providerProfile?.bio,
    !!providerProfile?.preferredLocation,
  ].filter(Boolean).length;

  const items = [
    {
      icon: Inbox,
      title: "Yangi so'rovlar",
      desc: "Kelayotgan buyurtmalar",
      badge: "0",
      badgeStyle: "bg-violet-100 text-violet-700",
    },
    {
      icon: TrendingUp,
      title: "Statistika",
      desc: "Ko'rishlar va daromad",
      badge: "Tez kunda",
      badgeStyle: "bg-gray-100 text-gray-400",
    },
    {
      icon: Star,
      title: "Sharhlarim",
      desc: "Mijozlar fikr-mulohazalari",
      badge: "Tez kunda",
      badgeStyle: "bg-gray-100 text-gray-400",
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
      desc: "Xizmatlar, bio, parol",
      action: () => onNavigate("/profile/settings"),
    },
  ];

  return (
    <div className="space-y-3">
      {providerProfile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 card-shadow p-4 mb-1"
        >
          {providerProfile.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {providerProfile.categories.slice(0, 3).map(cat => (
                <span key={cat} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                  <CheckCircle2 className="w-3 h-3" /> {cat}
                </span>
              ))}
              {providerProfile.categories.length > 3 && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-gray-50 text-gray-400 border border-gray-100">
                  +{providerProfile.categories.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-1.5">
            {providerProfile.preferredLocation && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" /> {providerProfile.preferredLocation}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(completeness / 3) * 100}%`,
                  background: "linear-gradient(90deg, hsl(262,80%,54%), hsl(236,76%,60%))",
                }}
              />
            </div>
            <span className="text-xs font-bold text-violet-600">{Math.round((completeness / 3) * 100)}%</span>
          </div>
        </motion.div>
      )}

      {items.map(({ icon: Icon, title, desc, action, badge, badgeStyle }, i) => (
        <motion.button
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.055, duration: 0.35 }}
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
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>{badge}</span>
          ) : action ? (
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 flex-shrink-0" />
          ) : null}
        </motion.button>
      ))}
    </div>
  );
}

export default function UnifiedDashboard() {
  const { user, providerProfile, activeRole, switchRole, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showSetup, setShowSetup] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  const isProvider = activeRole === "provider";

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  function handleSwitchRole(role: "buyer" | "provider") {
    if (role === "provider" && !providerProfile) {
      setShowSetup(true);
      return;
    }
    switchRole(role);
  }

  function handleSetupDone() {
    setShowSetup(false);
    switchRole("provider");
  }

  function handleSetupCancel() {
    setShowSetup(false);
  }

  const accentGradient = isProvider
    ? "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)"
    : "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 card-shadow">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <button
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setLocation("/")}
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

            <div className="flex-1 flex justify-center">
              <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
                {(["buyer", "provider"] as const).map((role) => {
                  const active = activeRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => handleSwitchRole(role)}
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
                        {role === "buyer"
                          ? <ShoppingBag className="w-3.5 h-3.5" />
                          : <Briefcase className="w-3.5 h-3.5" />
                        }
                      </span>
                      <span className="relative">{role === "buyer" ? "Xaridor" : "Ijrochi"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation("/profile/settings")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm transition-all duration-500"
                style={{ background: accentGradient }}
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.firstName?.[0]}
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
                    {isProvider ? "Ijrochi rejimi" : "Xaridor rejimi"}
                  </span>
                </div>
              </div>
            </div>

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
                  <BuyerContent onNavigate={setLocation} />
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

      <AnimatePresence>
        {showSetup && (
          <ProviderSetupModal onDone={handleSetupDone} onCancel={handleSetupCancel} />
        )}
      </AnimatePresence>

      <BottomNav />
    </>
  );
}
