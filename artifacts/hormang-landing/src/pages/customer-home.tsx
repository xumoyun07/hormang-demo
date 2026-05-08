import { useState, useEffect } from "react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import logoImg from "/hormang-logo.png";
import {
  ClipboardList, Inbox, CheckCircle2,
  Plus, MessageCircle, LayoutGrid, Briefcase, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getLocalProfile, hasProviderAccess,
  type LocalProfile,
} from "@/lib/local-profile";
import {
  getRequestsByCustomer, getOffersByCustomer, getChatsByCustomer,
  getRequestCooldown, formatCooldownRemaining,
} from "@/lib/requests-store";
import { getCompletedCount } from "@/lib/completion-store";
import { RollingCategories } from "@/components/ui/RollingCategories";

const BLUE      = "hsl(221,78%,50%)";
const BLUE_GRAD = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
function fmtDate(iso: string, withYear = false): string {
  const d = new Date(iso);
  return withYear
    ? `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`
    : `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`;
}

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

const ROLLING_CATS = [
  { emoji: "🧹", name: "Tozalash" },
  { emoji: "🚗", name: "Avto xizmat" },
  { emoji: "🔧", name: "Ta'mirlash" },
  { emoji: "💇", name: "Go'zallik" },
  { emoji: "🚛", name: "Ko'chirish" },
  { emoji: "📚", name: "Repetitorlar" },
];

export default function CustomerHomePage() {
  const { user, providerProfile, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [local, setLocal] = useState<LocalProfile>({});
  const [cooldown, setCooldown] = useState(() => getRequestCooldown(user?.id ?? ""));
  useEffect(() => {
    const tick = () => setCooldown(getRequestCooldown(user?.id ?? ""));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [user?.id]);
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

  const firstName = user?.firstName ?? "Foydalanuvchi";
  const fullName  = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials  = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const hasProviderRole = hasProviderAccess(user ?? null, providerProfile ?? null, local);

  const secondaryActions = [
    { icon: LayoutGrid,    label: "Kategoriyalar",  desc: "Barcha xizmatlar", path: "/questionnaire" },
    { icon: ClipboardList, label: "So'rovlarim",    desc: "Tarix va holat",   path: "/my-requests" },
    ...(!hasProviderRole
      ? [{ icon: Briefcase, label: "Ijrochi bo'lish", desc: "Daromad toping", path: "/dashboard" }]
      : []),
  ];

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    setLocation("/");
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">

        {/* ── STICKY WHITE HEADER ── */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 card-shadow">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
              <span className="font-bold text-gray-900 text-sm">Hormang</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation("/dashboard")}
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-100 active:scale-95 transition-transform"
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

        <main className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4">

          {/* ── GREETING + PRIMARY CTA CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-5 pt-5 pb-5"
            style={{ background: BLUE_GRAD }}
          >
            <p className="text-blue-100 text-sm font-medium mb-0.5">Assalomu Alaykum, {firstName} 👋</p>
            <h1 className="text-white text-xl font-extrabold leading-tight mb-1">
              Qanday xizmat kerak?
            </h1>
            <p className="text-blue-200 text-xs mb-4">
              Xizmat topish uchun yangi so'rov yarating
            </p>
            <motion.button
              whileTap={{ scale: cooldown.blocked ? 1 : 0.97 }}
              disabled={cooldown.blocked}
              onClick={() => !cooldown.blocked && setLocation("/questionnaire")}
              className="w-full bg-white text-blue-700 font-extrabold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-md active:bg-blue-50 transition-colors disabled:bg-white/70 disabled:text-blue-400 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {cooldown.blocked
                ? "Yangi so'rovlar oralig'ida kutish vaqti mavjud"
                : "Yangi so'rov yaratish"}
            </motion.button>

            {cooldown.blocked && (
              <div className="mt-2.5 rounded-xl bg-blue-900/40 border border-blue-300/30 px-3 py-2 flex items-center gap-2">
                <span className="text-base">⏳</span>
                <p className="text-[11px] font-bold text-white tabular-nums">
                  Keyingi so'rovgacha: {formatCooldownRemaining(cooldown.remainingMs)} qoldi
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Secondary Actions ── */}
          <div className="flex gap-2.5">
            {/* Kategoriyalar — special card with RollingCategories on the right */}
            <button
              onClick={() => setLocation("/questionnaire")}
              className="flex-1 bg-white border border-gray-100 card-shadow rounded-2xl p-3.5 text-left hover:border-blue-200 active:scale-[0.97] transition-all flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <LayoutGrid className="w-4 h-4 text-blue-600 mb-1.5" />
                <p className="font-bold text-gray-900 text-xs leading-tight">Kategoriyalar</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Barcha xizmatlar</p>
              </div>
              <RollingCategories
                items={ROLLING_CATS}
                interval={3000}
                onClick={() => setLocation("/questionnaire")}
              />
            </button>

            {/* Remaining secondary actions */}
            {secondaryActions.filter(a => a.label !== "Kategoriyalar").map((a) => (
              <button
                key={a.label}
                onClick={() => setLocation(a.path)}
                className="flex-1 bg-white border border-gray-100 card-shadow rounded-2xl p-3.5 text-left hover:border-blue-200 active:scale-[0.97] transition-all"
              >
                <a.icon className="w-4 h-4 text-blue-600 mb-2" />
                <p className="font-bold text-gray-900 text-xs leading-tight">{a.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
              </button>
            ))}
          </div>

          {/* ── Quick Stats ── */}
          <div className="flex gap-2.5">
            {[
              { label: "Faol so'rovlar",  val: activeRequests.length,    color: "text-blue-600",   bg: "bg-blue-50",   Icon: ClipboardList, href: "/my-requests",      ref: null },
              { label: "Yangi takliflar", val: pendingOffers.length,     color: "text-violet-600", bg: "bg-violet-50", Icon: Inbox,          href: "/chat-offers",      ref: null },
              { label: "Yakunlangan",     val: user?.id ? getCompletedCount(user.id, "customer") : 0, color: "text-green-600",  bg: "bg-green-50",  Icon: CheckCircle2,   href: "/request-history",  ref: "/customer-home" },
            ].map((s) => (
              <button key={s.label} onClick={() => { if (s.ref) sessionStorage.setItem("request_history_referrer", s.ref); setLocation(s.href); }} className={`flex-1 ${s.bg} rounded-2xl p-3 flex flex-col items-center text-center active:scale-95 transition-transform`}>
                <s.Icon className={`w-4 h-4 ${s.color} mb-1`} />
                <p className={`text-xl font-extrabold ${s.color} leading-none`}>{s.val}</p>
                <p className="text-[9px] text-gray-500 font-semibold leading-tight mt-1">{s.label}</p>
              </button>
            ))}
          </div>

          {/* ── Active Requests ── */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-extrabold text-gray-900 text-sm">Faol so'rovlarim</h2>
              <button onClick={() => setLocation("/my-requests")} className="text-xs font-semibold text-blue-600 hover:underline">
                Barchasi →
              </button>
            </div>

            {activeRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 flex flex-col items-center text-center">
                <ClipboardList className="w-8 h-8 text-gray-200 mb-2" />
                <p className="font-semibold text-gray-400 text-sm">Hozircha faol so'rovlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRequests.slice(0, 5).map((req, i) => (
                  <motion.button
                    key={req.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setLocation("/my-requests")}
                    className="w-full bg-white rounded-2xl border border-gray-100 card-shadow p-4 text-left hover:border-blue-200 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-lg">
                        {req.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{req.categoryName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtDate(req.createdAt, true)}{req.region ? ` · ${req.region}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === "open"      ? "bg-blue-50 text-blue-700"   :
                          req.status === "matched"   ? "bg-teal-50 text-teal-700"   :
                          req.status === "accepted"  ? "bg-green-50 text-green-700" :
                          req.status === "completed" ? "bg-green-50 text-green-700" :
                          req.status === "cancelled" ? "bg-red-50 text-red-500"     :
                                                       "bg-gray-100 text-gray-500"
                        }`}>
                          {req.status === "open"      ? "Faol"             :
                           req.status === "matched"   ? "Ijrochi tanlandi" :
                           req.status === "accepted"  ? "Qabul qilindi"    :
                           req.status === "completed" ? "Yakunlangan"      :
                           req.status === "cancelled" ? "Bekor qilindi"    :
                                                        req.status}
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

          {/* ── New Offers ── */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-extrabold text-gray-900 text-sm">Yangi takliflar</h2>
              <button onClick={() => setLocation("/chat-offers")} className="text-xs font-semibold text-blue-600 hover:underline">
                Barchasi →
              </button>
            </div>

            {recentOffers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 flex flex-col items-center text-center">
                <Inbox className="w-7 h-7 text-gray-200 mb-2" />
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
                      className="flex-shrink-0 w-40 bg-white rounded-2xl border border-gray-100 card-shadow p-3.5 text-left hover:border-blue-200 active:scale-[0.98] transition-all"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black mb-2.5"
                        style={{ background: offer.masterColor || BLUE_GRAD }}
                      >
                        {offer.masterInitials}
                      </div>
                      <p className="font-bold text-gray-900 text-sm leading-snug truncate">{offer.masterName}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{req?.categoryName}</p>
                      <p className="text-sm font-extrabold text-blue-600 mt-1.5">
                        {offer.price.toLocaleString()} so'm
                      </p>
                      <span className={`mt-1 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        offer.status === "pending"         ? "bg-amber-50 text-amber-700" :
                        offer.status === "accepted"        ? "bg-blue-50 text-blue-700" :
                        offer.status === "completed"       ? "bg-green-50 text-green-700" :
                        offer.status === "rejected"        ? "bg-red-50 text-red-600" :
                        offer.status === "closed_by_match" ? "bg-gray-100 text-gray-500" :
                                                             "bg-gray-100 text-gray-500"
                      }`}>
                        {offer.status === "pending"         ? "Kutilmoqda"    :
                         offer.status === "accepted"        ? "Qabul qilindi" :
                         offer.status === "completed"       ? "Yakunlangan"   :
                         offer.status === "rejected"        ? "Rad etilgan"   :
                         offer.status === "closed_by_match" ? "Yopilgan"      :
                                                              offer.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Recent Chats ── */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-extrabold text-gray-900 text-sm">Oxirgi suhbatlar</h2>
              <button onClick={() => setLocation("/chat-offers")} className="text-xs font-semibold text-blue-600 hover:underline">
                Barchasi →
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 flex flex-col items-center text-center">
                <MessageCircle className="w-7 h-7 text-gray-200 mb-2" />
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
                      className="w-full bg-white rounded-2xl border border-gray-100 card-shadow p-3.5 text-left hover:border-blue-200 active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                          style={{ background: chat.masterColor || BLUE_GRAD }}
                        >
                          {chat.masterInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-gray-900 text-sm truncate">{chat.masterName}</p>
                            {lastMsg && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {fmtDate(lastMsg.timestamp)}
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

          {/* ── Popular Categories ── */}
          <section>
            <h2 className="font-extrabold text-gray-900 text-sm mb-2.5">Mashhur xizmatlar</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {POPULAR_CATS.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setLocation("/questionnaire")}
                  className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 card-shadow px-3.5 py-2.5 text-center hover:border-blue-200 active:scale-[0.97] transition-all"
                >
                  <div className="text-xl mb-0.5">{cat.emoji}</div>
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
