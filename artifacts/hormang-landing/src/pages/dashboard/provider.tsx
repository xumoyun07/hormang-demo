import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Inbox, TrendingUp, Star, Settings, LogOut,
  CheckCircle2, Eye, ChevronRight, MapPin, Clock,
} from "lucide-react";

export default function ProviderDashboard() {
  const { user, providerProfile, logout } = useAuth();
  const [, setLocation] = useLocation();

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  const menuItems = [
    {
      icon: Inbox,
      title: "Yangi so'rovlar",
      desc: "Kelayotgan buyurtma so'rovlarini ko'ring",
      action: undefined,
      badge: "0",
      badgeColor: "bg-blue-600 text-white",
    },
    {
      icon: TrendingUp,
      title: "Statistika",
      desc: "Ko'rishlar, buyurtmalar va daromad",
      action: undefined,
      comingSoon: true,
    },
    {
      icon: Star,
      title: "Sharhlarim",
      desc: "Mijozlar fikr-mulohazalari",
      action: undefined,
      comingSoon: true,
    },
    {
      icon: Eye,
      title: "Ommaviy profilim",
      desc: "Mijozlar ko'radigan profilingiz",
      action: () => setLocation(`/providers/${user?.id}`),
    },
    {
      icon: Settings,
      title: "Profil sozlamalari",
      desc: "Xizmatlar, bio, parol va hisobing",
      action: () => setLocation("/profile/settings"),
    },
  ];

  const hasProfile = providerProfile?.bio || providerProfile?.workingHours || providerProfile?.preferredLocation;
  const completeness = [
    !!providerProfile?.categories?.length,
    !!providerProfile?.bio,
    !!providerProfile?.workingHours,
    !!providerProfile?.preferredLocation,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 card-shadow">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
            style={{ background: "var(--brand-gradient)" }}
          >
            H
          </div>
          <span className="font-bold text-gray-900">Hormang</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            Ijrochi
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            onClick={() => setLocation("/profile/settings")}
            className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold cursor-pointer hover:bg-blue-100 transition-colors"
          >
            {user?.firstName?.[0]}
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md flex-shrink-0"
                style={{ background: "var(--brand-gradient)" }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
                <p className="text-gray-500 text-xs mt-0.5">Ijrochi · {user?.email ?? user?.phone}</p>
                {providerProfile?.preferredLocation && (
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                    <MapPin className="w-3 h-3" /> {providerProfile.preferredLocation}
                  </div>
                )}
                {providerProfile?.workingHours && (
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                    <Clock className="w-3 h-3" /> {providerProfile.workingHours}
                  </div>
                )}
              </div>
            </div>

            {providerProfile?.categories?.length ? (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {providerProfile.categories.slice(0, 4).map(cat => (
                  <span key={cat} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                    <CheckCircle2 className="w-3 h-3" /> {cat}
                  </span>
                ))}
                {providerProfile.categories.length > 4 && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-gray-50 text-gray-500 border border-gray-100">
                    +{providerProfile.categories.length - 4}
                  </span>
                )}
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Profil to'liqligi</span>
                <span className="font-bold text-blue-600">{Math.round((completeness / 4) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(completeness / 4) * 100}%`, background: "var(--brand-gradient)" }}
                />
              </div>
              {completeness < 4 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Profilingizni to'ldiring — bu ko'proq mijoz jalb qiladi
                </p>
              )}
            </div>
          </div>

          {!hasProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Settings className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-800">Profilingizni to'ldiring</p>
                <p className="text-xs text-blue-600">Bio, ish vaqti va hududni qo'shing</p>
              </div>
              <button
                onClick={() => setLocation("/profile/settings")}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          <div className="space-y-3">
            {menuItems.map(({ icon: Icon, title, desc, action, badge, badgeColor, comingSoon }, i) => (
              <motion.button
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06, duration: 0.4 }}
                whileHover={action ? { scale: 1.01, y: -1 } : {}}
                whileTap={action ? { scale: 0.99 } : {}}
                onClick={action}
                disabled={!action}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group
                  ${action
                    ? "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md card-shadow"
                    : "bg-white border-gray-100 opacity-60 cursor-not-allowed card-shadow"
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 transition-transform ${action ? "group-hover:scale-110" : ""}`}>
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900">{title}</h3>
                  <p className="text-xs text-gray-500 truncate">{desc}</p>
                </div>
                {badge !== undefined && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center ${badgeColor}`}>
                    {badge}
                  </span>
                )}
                {comingSoon && (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Tez kunda</span>
                )}
                {action && !badge && !comingSoon && (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button onClick={() => setLocation("/")} variant="outline" size="sm" className="border-2 font-semibold gap-2">
              Bosh sahifaga qaytish
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
