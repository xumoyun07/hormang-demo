import { useState, useEffect } from "react";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "/hormang-logo.png";
import {
  Search, ClipboardList, Heart, Settings, UserPen, LogOut, ChevronRight,
  Inbox, TrendingUp, Star, CheckCircle2, MapPin,
  ShoppingBag, Briefcase, Loader2, ArrowRight, X,
  Phone, ShieldCheck, Plus, MessageCircle, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { saveProviderProfile } from "@/lib/auth-client";
import { processReferralReward } from "@/lib/referral-store";
import { useToast } from "@/hooks/use-toast";
import {
  getLocalProfile, saveLocalProfile, hasProviderAccess,
  markProviderAccess,
  getCompletionChecks, getCompletionPct,
  type LocalProfile,
} from "@/lib/local-profile";
import {
  getMatchingRequests, getSeenIds,
} from "@/lib/provider-store";
import {
  getRequestsByCustomer, getOffersByCustomer, getChatsByCustomer,
} from "@/lib/requests-store";
import { getAverageRatingForUser, getReviewsForUser, getCompletedCount } from "@/lib/completion-store";
import { TangaChip } from "@/pages/plans";
import { StarRating } from "@/components/star-rating";

const VIOLET_SOLID = "hsl(262,80%,54%)";
const VIOLET_GRAD  = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";


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

const PROVIDER_CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enagalik", "Tadbir xizmatlari",
  "Ko'chirish / yuk yetkazish", "Go'zallik", "Avto xizmat", "Repetitorlar", "Ustachilik",
];

function BecomeProviderModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (categories: string[]) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(cat: string) {
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: VIOLET_GRAD }}
            >
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight">Ijrochi bo'lish</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Faoliyat yuritish uchun kamida bitta xizmat turini tanlang
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category grid */}
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {PROVIDER_CATEGORIES.map(cat => {
              const active = selected.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    active
                      ? "text-white border-transparent shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                  style={active ? { background: VIOLET_GRAD } : {}}
                >
                  {active && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                  {cat}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-violet-600 font-semibold mt-3"
            >
              {selected.length} ta xizmat tanlandi
            </motion.p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-shrink-0 border-2 font-semibold"
            disabled={loading}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            disabled={selected.length === 0 || loading}
            onClick={() => onSubmit(selected)}
            className="flex-1 font-bold gap-2"
            style={{ background: VIOLET_GRAD }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? "Saqlanmoqda..." : "Davom etish"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const BUYER_BLUE = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

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

function BuyerContent({ onNavigate, onBecome }: { onNavigate: (path: string) => void; onBecome: () => void }) {
  const { user, providerProfile } = useAuth();
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
    { icon: Plus,          label: "Yangi so'rov",   desc: "Xizmat toping",     path: "/questionnaire", primary: true },
    { icon: LayoutGrid,    label: "Kategoriyalar",  desc: "Barcha xizmatlar",  path: "/questionnaire" },
    { icon: ClipboardList, label: "So'rovlarim",    desc: "Barcha so'rovlar",  path: "/my-requests" },
    ...(!hasProviderRole ? [{ icon: Briefcase, label: "Ijrochi bo'lish", desc: "Daromad toping", path: "", primary: false, action: onBecome }] : []),
  ].slice(0, 4);

  return (
    <div className="space-y-5">

      {/* ── 1. Welcome banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 text-white"
        style={{ background: BUYER_BLUE }}
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
            onClick={() => onNavigate("/profile/settings")}
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
              onClick={() => onNavigate("/profile/settings")}
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
          { label: "Faol so'rovlar",   val: activeRequests.length,    color: "text-blue-600",   bg: "bg-blue-50",   Icon: ClipboardList },
          { label: "Yangi takliflar",  val: pendingOffers.length,     color: "text-violet-600", bg: "bg-violet-50", Icon: Inbox },
          { label: "Yakunlangan",      val: completedRequests.length, color: "text-green-600",  bg: "bg-green-50",  Icon: CheckCircle2 },
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
          <button onClick={() => onNavigate("/my-requests")} className="text-xs font-semibold text-blue-600 hover:underline">
            Barchasi →
          </button>
        </div>

        {activeRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-8 flex flex-col items-center text-center">
            <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
            <p className="font-bold text-gray-400 text-sm mb-3">Hozircha faol so'rovlar yo'q</p>
            <button
              onClick={() => onNavigate("/questionnaire")}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: BUYER_BLUE }}
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
                onClick={() => onNavigate("/my-requests")}
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
          <button onClick={() => onNavigate("/chat-offers")} className="text-xs font-semibold text-blue-600 hover:underline">
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
                  onClick={() => onNavigate("/chat-offers")}
                  className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 card-shadow p-4 text-left hover:border-blue-200 active:scale-[0.98] transition-all"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-black mb-3"
                    style={{ background: offer.masterColor || BUYER_BLUE }}
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
          <button onClick={() => onNavigate("/chat-offers")} className="text-xs font-semibold text-blue-600 hover:underline">
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
                  onClick={() => onNavigate(`/chat/${chat.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 card-shadow p-4 text-left hover:border-blue-200 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ background: chat.masterColor || BUYER_BLUE }}
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
              onClick={() => "action" in a && a.action ? a.action() : onNavigate(a.path)}
              className={`p-4 rounded-2xl text-left transition-all active:scale-[0.97] ${
                a.primary
                  ? "text-white"
                  : "bg-white border border-gray-100 card-shadow hover:border-blue-200"
              }`}
              style={a.primary ? { background: BUYER_BLUE } : {}}
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
              onClick={() => onNavigate("/questionnaire")}
              className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 card-shadow px-4 py-3 text-center hover:border-blue-200 active:scale-[0.97] transition-all"
            >
              <div className="text-2xl mb-1">{cat.emoji}</div>
              <p className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{cat.name}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Become provider CTA ── */}
      {!hasProviderRole && <BecomeProviderCard onBecome={onBecome} />}

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
  const storeVersion = useStoreRefresh();
  const completionDismissKey = user?.id ? `profile_completion_dismissed_${user.id}` : "";
  const [completionDismissed, setCompletionDismissed] = useState(false);

  useEffect(() => {
    if (user?.id) setLocal(getLocalProfile(user.id));
  }, [user?.id, storeVersion]);

  useEffect(() => {
    if (!completionDismissKey) {
      setCompletionDismissed(false);
      return;
    }
    setCompletionDismissed(localStorage.getItem(completionDismissKey) === "1");
  }, [completionDismissKey]);

  const completionLocal = {
    photoUrl:       local.photoUrl,
    region:         local.region,
    district:       local.district,
    serviceAreas:   local.serviceAreas,
    serviceAreaV2:  local.serviceAreaV2,
    experience:     local.experience,
    portfolioItems: local.portfolioItems ?? [],
    bio:            local.bio,
    categories:     local.categories ?? [],
  };
  const checks  = getCompletionChecks(user ?? null, providerProfile ?? null, completionLocal);
  const pct     = getCompletionPct(checks);
  const missing = checks.filter((c) => !c.done);

  const avgRating      = user?.id ? getAverageRatingForUser(user.id, "provider") : 0;
  const reviewCount    = user?.id ? getReviewsForUser(user.id, "provider").length : 0;
  const completedCount = user?.id ? getCompletedCount(user.id, "provider") : 0;

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;
  const hasPhoto = !!local.photoUrl;

  const serviceAreas = local.serviceAreas ?? (local.region ? [local.region] : []);
  const serviceAreaV2 = local.serviceAreaV2;
  const selectedCategories = providerProfile?.categories?.length ? providerProfile.categories : (local.categories ?? []);
  const requests = getMatchingRequests(selectedCategories, serviceAreas, user?.id ?? "", serviceAreaV2);
  const seen = getSeenIds(user?.id ?? "");
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
      action: () => onNavigate("/provider-reviews"),
    },
    {
      icon: UserPen,
      title: "Profil sozlamalari",
      desc: "Xizmatlar, bio, parol va hisobing",
      action: () => onNavigate("/profile/settings"),
    },
    {
      icon: Settings,
      title: "Sozlamalar",
      desc: "Bildirishnomalar, til va boshqalar",
      action: () => onNavigate("/settings"),
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
                onClick={() => onNavigate("/provider-reviews")}
              >
                <StarRating rating={avgRating} size="w-3.5 h-3.5" />
                <span className="text-xs font-bold text-gray-700 ml-0.5 underline">
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
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selectedCategories.slice(0, 4).map(cat => (
              <span key={cat}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                {cat}
              </span>
            ))}
            {selectedCategories.length > 4 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-gray-50 text-gray-400 border border-gray-100">
                +{selectedCategories.length - 4}
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
      {!(pct === 100 && completionDismissed) && (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ delay: 0.05 }}
        className="relative bg-white rounded-2xl border border-gray-100 card-shadow p-4"
      >
        {pct === 100 && (
          <button
            type="button"
            onClick={() => {
              if (completionDismissKey) localStorage.setItem(completionDismissKey, "1");
              setCompletionDismissed(true);
            }}
            className="absolute right-3 top-3 w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Profil tugallangan kartasini yopish"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
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
      )}

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
  const { user, providerProfile, activeRole, switchRole, setProviderProfile, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [logoHovered, setLogoHovered] = useState(false);
  const [headerLocal, setHeaderLocal] = useState<LocalProfile>({});
  const [showBecomeModal, setShowBecomeModal] = useState(false);
  const [becomingProvider, setBecomingProvider] = useState(false);
  const storeVersion = useStoreRefresh();

  useEffect(() => {
    if (user?.id) setHeaderLocal(getLocalProfile(user.id));
  }, [user?.id, storeVersion]);

  const isProvider = activeRole === "provider";
  const hasBothRoles = hasProviderAccess(user ?? null, providerProfile ?? null, headerLocal) || activeRole === "provider";

  const accentGradient = isProvider
    ? "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)"
    : "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  function handleBecomeProvider() {
    setShowBecomeModal(true);
  }

  async function handleModalSubmit(categories: string[]) {
    if (!user || categories.length === 0) return;
    setBecomingProvider(true);
    try {
      const res = await saveProviderProfile({ categories });
      setProviderProfile(res.profile);
      markProviderAccess(user.id);
      saveLocalProfile(user.id, { ...getLocalProfile(user.id), categories });
      // Award referral reward to the inviter (if the new provider was invited).
      try { processReferralReward(user.id); } catch (_) {}
      switchRole("provider");
      sessionStorage.setItem("justBecameProvider", "1");
      setShowBecomeModal(false);
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
              {isProvider && (
                <TangaChip userId={user?.id ?? ""} onClick={() => setLocation("/plans")} />
              )}
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

          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showBecomeModal && (
          <BecomeProviderModal
            onClose={() => setShowBecomeModal(false)}
            onSubmit={handleModalSubmit}
            loading={becomingProvider}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </>
  );
}
