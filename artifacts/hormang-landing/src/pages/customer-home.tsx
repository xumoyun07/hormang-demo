import { useState, useEffect } from "react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import logoImg from "/hormang-logo.png";
import {
  ClipboardList, Inbox, CheckCircle2, MapPin,
  Plus, MessageCircle, LayoutGrid, Briefcase, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  getLocalProfile, hasProviderAccess,
  getCompletionChecks, getCompletionPct,
  type LocalProfile,
} from "@/lib/local-profile";
import {
  getRequestsByCustomer, getOffersByCustomer, getChatsByCustomer,
} from "@/lib/requests-store";

const BLUE_GRAD = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

const POPULAR_CATS = [
  { emoji: "🧹", name: "Tozalash" },
  { emoji: "🔧", name: "Ta'mirlash" },
  { emoji: "👶", name: "Enagalik" },
  { emoji: "🎉", name: "Tadbirlar" },
  { emoji: "🚛", name: "Ko'chirish" },
  { emoji: "💇", name: "Go'zallik" },
  { emoji: "🚗", name: "Avto xizmat" },
  { emoji: "📚", name: "Repetitorlar" },
];

export default function CustomerHomePage() {
  const { user, providerProfile, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [local, setLocal] = useState<LocalProfile>({});
  const storeVersion = useStoreRefresh();

  useEffect(() => {
    if (user?.id) setLocal(getLocalProfile(user.id));
  }, [user?.id, storeVersion]);

  const allRequests = user?.id ? getRequestsByCustomer(user.id) : [];
  const allOffers   = user?.id ? getOffersByCustomer(user.id)   : [];
  const allChats    = user?.id ? getChatsByCustomer(user.id)    : [];

  const activeRequests    = allRequests.filter(r => r.status !== "completed" && r.status !== "cancelled");
  const completedRequests = allRequests.filter(r => r.status === "completed");
  const pendingOffers     = allOffers.filter(o => o.status === "pending");

  const recentOffers = [...allOffers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentChats = [...allChats]
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.timestamp ?? a.createdAt;
      const bLast = b.messages[b.messages.length - 1]?.timestamp ?? b.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    })
    .slice(0, 5);

  const checks        = getCompletionChecks(user ?? null, providerProfile ?? null, local);
  const completionPct = getCompletionPct(checks);
  const firstName     = user?.firstName ?? "Foydalanuvchi";
  const fullName      = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials      = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const locationStr   = local.district ? `${local.district}, ${local.region}` : local.region;
  const hasProviderRole = hasProviderAccess(user ?? null, providerProfile ?? null, local);

  const quickActions = [
    { icon: Plus,          label: "Yangi so'rov",   desc: "Xizmat toping",    path: "/questionnaire", primary: true  },
    { icon: LayoutGrid,    label: "Kategoriyalar",  desc: "Barcha xizmatlar", path: "/questionnaire", primary: false },
    { icon: ClipboardList, label: "So'rovlarim",    desc: "Barcha so'rovlar", path: "/my-requests",   primary: false },
    ...(!hasProviderRole
      ? [{ icon: Briefcase, label: "Ijrochi bo'lish", desc: "Daromad toping", path: "/dashboard", primary: false }]
      : []),
  ].slice(0, 4);

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    setLocation("/");
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
              <span className="font-bold text-gray-900 text-sm hidden sm:inline">Hormang</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation("/profile/settings")}
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-100"
                style={local.photoUrl ? {} : { background: BLUE_GRAD }}
              >
                {local.photoUrl ? (
                  <img src={local.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {initials || "?"}
                  </span>
                )}
              </button>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-5">

          {/* ── 1. Welcome banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 text-white"
            style={{ background: BLUE_GRAD }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-blue-100 text-xs font-medium">Xush kelibsiz 👋</p>
                <h1 className="font-extrabold text-xl mt-0.5 leading-tight">
                  Assalomu alaykum,<br />{firstName}!
                </h1>
                {locationStr && (
                  <p className="text-blue-100 text-xs mt-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {locationStr}
                  </p>
                )}
              </div>
              <button
                onClick={() => setLocation("/profile/settings")}
                className="w-[60px] h-[60px] rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/40 active:scale-95 transition-transform"
              >
                {local.photoUrl ? (
                  <img src={local.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-lg font-black">
                    {initials || "?"}
                  </div>
                )}
              </button>
            </div>

            {completionPct < 100 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-blue-100 font-medium">Profil to'ldirilishi</span>
                  <span className="text-xs font-extrabold text-white">{completionPct}%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <button
                  onClick={() => setLocation("/profile/settings")}
                  className="mt-2 text-xs font-bold text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Profilni to'ldirish →
                </button>
              </div>
            )}
          </motion.div>

          {/* ── 2. Quick Stats ── */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: "Faol so'rovlar",  val: activeRequests.length,    color: "text-blue-600",   bg: "bg-blue-50",   Icon: ClipboardList },
              { label: "Yangi takliflar", val: pendingOffers.length,     color: "text-violet-600", bg: "bg-violet-50", Icon: Inbox },
              { label: "Yakunlangan",     val: completedRequests.length, color: "text-green-600",  bg: "bg-green-50",  Icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className={`flex-shrink-0 w-[120px] ${s.bg} rounded-2xl p-3.5 flex flex-col items-center text-center`}>
                <s.Icon className={`w-5 h-5 ${s.color} mb-1.5`} />
                <p className={`text-2xl font-extrabold ${s.color} leading-none`}>{s.val}</p>
                <p className="text-[10px] text-gray-500 font-semibold leading-tight mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── 3. Active Requests ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900 text-sm">Faol so'rovlarim</h2>
              <button onClick={() => setLocation("/my-requests")} className="text-xs font-semibold text-blue-600 hover:underline">
                Barchasi →
              </button>
            </div>

            {activeRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-8 flex flex-col items-center text-center">
                <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
                <p className="font-bold text-gray-400 text-sm mb-3">Hozircha faol so'rovlar yo'q</p>
                <button
                  onClick={() => setLocation("/questionnaire")}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: BLUE_GRAD }}
                >
                  + Yangi so'rov yaratish
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRequests.slice(0, 5).map((req, i) => (
                  <motion.button
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setLocation("/my-requests")}
                    className="w-full bg-white rounded-2xl border border-gray-100 card-shadow p-4 text-left hover:border-blue-200 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">
                        {req.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{req.categoryName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}
                          {req.region ? ` · ${req.region}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === "open"     ? "bg-blue-50 text-blue-700" :
                          req.status === "accepted" ? "bg-green-50 text-green-700" :
                                                      "bg-gray-100 text-gray-500"
                        }`}>
                          {req.status === "open" ? "Ochiq" : req.status === "accepted" ? "Qabul qilindi" : req.status}
                        </span>
                        {req.offerCount > 0 && (
                          <span className="text-[10px] font-semibold text-violet-600">{req.offerCount} taklif</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </section>

          {/* ── 4. New Offers ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900 text-sm">Yangi takliflar</h2>
              <button onClick={() => setLocation("/chat-offers")} className="text-xs font-semibold text-blue-600 hover:underline">
                Barchasi →
              </button>
            </div>

            {recentOffers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 flex flex-col items-center text-center">
                <Inbox className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm font-semibold text-gray-400">Hozircha takliflar yo'q</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {recentOffers.map((offer) => {
                  const req = allRequests.find(r => r.id === offer.requestId);
                  return (
                    <button
                      key={offer.id}
                      onClick={() => setLocation("/chat-offers")}
                      className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 card-shadow p-4 text-left hover:border-blue-200 active:scale-[0.98] transition-all"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-black mb-3"
                        style={{ background: offer.masterColor || BLUE_GRAD }}
                      >
                        {offer.masterInitials}
                      </div>
                      <p className="font-bold text-gray-900 text-sm leading-snug truncate">{offer.masterName}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{req?.categoryName}</p>
                      <p className="text-sm font-extrabold text-blue-600 mt-2">
                        {offer.price.toLocaleString()} so'm
                      </p>
                      <span className={`mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        offer.status === "pending"  ? "bg-amber-50 text-amber-700" :
                        offer.status === "accepted" ? "bg-green-50 text-green-700" :
                                                      "bg-gray-100 text-gray-500"
                      }`}>
                        {offer.status === "pending" ? "Kutilmoqda" : offer.status === "accepted" ? "Qabul qilindi" : offer.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── 5. Recent Chats ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900 text-sm">Oxirgi suhbatlar</h2>
              <button onClick={() => setLocation("/chat-offers")} className="text-xs font-semibold text-blue-600 hover:underline">
                Barchasi →
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 flex flex-col items-center text-center">
                <MessageCircle className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm font-semibold text-gray-400">Suhbatlar hali mavjud emas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((chat) => {
                  const lastMsg = chat.messages[chat.messages.length - 1];
                  const hasNewMsg = lastMsg?.sender === "master";
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setLocation(`/chat/${chat.id}`)}
                      className="w-full bg-white rounded-2xl border border-gray-100 card-shadow p-4 text-left hover:border-blue-200 active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                          style={{ background: chat.masterColor || BLUE_GRAD }}
                        >
                          {chat.masterInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-gray-900 text-sm truncate">{chat.masterName}</p>
                            {lastMsg && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {new Date(lastMsg.timestamp).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {lastMsg
                              ? lastMsg.attachment ? "📎 Fayl" : lastMsg.text
                              : chat.categoryName}
                          </p>
                        </div>
                        {hasNewMsg && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── 6. Quick Actions ── */}
          <section>
            <h2 className="font-extrabold text-gray-900 text-sm mb-3">Tezkor harakatlar</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setLocation(a.path)}
                  className={`p-4 rounded-2xl text-left transition-all active:scale-[0.97] ${
                    a.primary
                      ? "text-white"
                      : "bg-white border border-gray-100 card-shadow hover:border-blue-200"
                  }`}
                  style={a.primary ? { background: BLUE_GRAD } : {}}
                >
                  <a.icon className={`w-5 h-5 mb-2 ${a.primary ? "text-white" : "text-blue-600"}`} />
                  <p className={`font-bold text-sm ${a.primary ? "text-white" : "text-gray-900"}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 ${a.primary ? "text-blue-100" : "text-gray-400"}`}>{a.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── 7. Recommended Categories ── */}
          <section>
            <h2 className="font-extrabold text-gray-900 text-sm mb-3">Mashhur xizmatlar</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {POPULAR_CATS.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setLocation("/questionnaire")}
                  className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 card-shadow px-4 py-3 text-center hover:border-blue-200 active:scale-[0.97] transition-all"
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <p className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{cat.name}</p>
                </button>
              ))}
            </div>
          </section>

        </main>
      </div>
      <BottomNav />
    </>
  );
}
