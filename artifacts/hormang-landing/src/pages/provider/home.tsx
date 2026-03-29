/**
 * /provider-home — Provider (Ijrochi) home page
 * Sections:
 *   1. Profile Completion
 *   2. Upcoming Services
 *   3. Events (coming soon)
 *   4. Available Requests (tabs + swipeable cards)
 *   5. Share Profile
 */
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, CalendarDays, Sparkles, Share2, Link2,
  CheckCircle2, Clock, MapPin, AlertCircle, Inbox, Send, Check,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  getProviderRequests, getUpcomingServices, markServiceDone,
  updateProviderRequestStatus, getSeenIds, markSeen,
  type ProviderRequest, type UpcomingService,
} from "@/lib/provider-store";
import { getLocalProfile, getCompletionChecks, getCompletionPct } from "@/lib/local-profile";
import logoImg from "/hormang-logo.png";

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

function urgencyLabel(u: ProviderRequest["urgency"]): { label: string; color: string } {
  if (u === "urgent") return { label: "Shoshilinch", color: "text-red-600 bg-red-50 border-red-100" };
  if (u === "normal") return { label: "Oddiy", color: "text-blue-600 bg-blue-50 border-blue-100" };
  return { label: "Moslashuvchan", color: "text-gray-500 bg-gray-100 border-gray-200" };
}

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

/* ─── Circular Progress ──────────────────────────────────────────── */
function CircularProgress({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#EDE9FE" strokeWidth="7" />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="7"
        stroke="url(#vgrad)" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <defs>
        <linearGradient id="vgrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(262,80%,54%)" />
          <stop offset="100%" stopColor="hsl(236,76%,60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Profile Completion ─────────────────────────────────────────── */
function ProfileCompletion() {
  const { user, providerProfile } = useAuth();
  const [, setLocation] = useLocation();

  const local = user ? getLocalProfile(user.id) : {};
  const checks = getCompletionChecks(user ?? null, providerProfile, local);
  const pct = getCompletionPct(checks);
  const missing = checks.filter((c) => !c.done);

  if (pct === 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setLocation("/profile/settings")}
      className="bg-white rounded-2xl border border-violet-100 card-shadow p-4 mb-4 cursor-pointer active:scale-[.99] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <CircularProgress pct={pct} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-violet-700">
            {pct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm mb-0.5">Profilingizni to'ldiring</p>
          <p className="text-xs text-gray-500 mb-2">{checks.length - missing.length}/{checks.length} qadamlar bajarildi</p>
          <div className="space-y-1">
            {missing.slice(0, 3).map((m) => (
              <div key={m.key} className="flex items-center gap-1.5 text-xs text-violet-600">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {m.label}
              </div>
            ))}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-violet-400 flex-shrink-0" />
      </div>
    </motion.div>
  );
}

/* ─── Upcoming Services ──────────────────────────────────────────── */
function UpcomingServices() {
  const [services, setServices] = useState<UpcomingService[]>([]);

  useEffect(() => {
    setServices(getUpcomingServices().filter((s) => s.status === "upcoming"));
  }, []);

  function handleDone(id: string) {
    markServiceDone(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-violet-600" />
          <h2 className="font-bold text-sm text-gray-900">Yaqinlashayotgan xizmatlar</h2>
        </div>
        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{services.length} ta</span>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-5 text-center">
          <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-400">Hozircha rejalashtirilgan xizmat yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-gray-100 card-shadow p-4 flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-lg leading-none">{s.categoryEmoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{s.title}</p>
                <p className="text-xs text-gray-500 mb-1">{s.customerName}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-violet-600 font-semibold">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(s.date).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "short" })} · {s.time}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPin className="w-3 h-3" />{s.location}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDone(s.id)}
                className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors"
                title="Bajarildi"
              >
                <Check className="w-4 h-4 text-emerald-600" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Request Card (swipeable) ───────────────────────────────────── */
function RequestSlideCard({
  request,
  onRespond,
  onIgnore,
  onNext,
  isLast,
  index,
  total,
}: {
  request: ProviderRequest;
  onRespond: (id: string) => void;
  onIgnore: (id: string) => void;
  onNext: () => void;
  isLast: boolean;
  index: number;
  total: number;
}) {
  const urg = urgencyLabel(request.urgency);

  return (
    <motion.div
      key={request.id}
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-50 flex items-center gap-3">
        <span className="text-2xl">{request.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900">{request.categoryName}</p>
          <p className="text-xs text-gray-400">{request.customerName} · {timeAgo(request.createdAt)}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urg.color}`}>
          {urg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{request.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Byudjet</p>
            <p className="text-sm font-extrabold text-violet-700">{request.budgetLabel}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Manzil</p>
            <p className="text-sm font-bold text-gray-800 truncate">{request.location}</p>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-violet-600" : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onIgnore(request.id)}
            className="flex-1 h-11 rounded-2xl border-2 border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-red-100"
          >
            O'tkazish
          </button>
          <button
            onClick={() => onRespond(request.id)}
            className="flex-1 h-11 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            style={{ background: VIOLET }}
          >
            <Send className="w-4 h-4" />
            Javob berish
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Available Requests ─────────────────────────────────────────── */
type ReqTab = "all" | "new" | "seen";

function AvailableRequests() {
  const [tab, setTab] = useState<ReqTab>("new");
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const { toast } = useToast();

  const reload = useCallback(() => {
    setRequests(getProviderRequests());
    setSeen(getSeenIds());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = requests.filter((r) => {
    if (tab === "new") return !seen.includes(r.id) && r.status === "open";
    if (tab === "seen") return seen.includes(r.id) && r.status === "open";
    return r.status === "open";
  });

  const newCount = requests.filter((r) => !seen.includes(r.id) && r.status === "open").length;
  const slideReqs = requests.filter((r) => !seen.includes(r.id) && r.status === "open");
  const current = slideReqs[slideIndex];

  function handleRespond(id: string) {
    updateProviderRequestStatus(id, "responded");
    markSeen(id);
    toast({ title: "Javob yuborildi!", description: "Buyurtmachi siz bilan bog'lanadi." });
    reload();
    if (slideIndex >= slideReqs.length - 1) setSlideIndex(Math.max(0, slideReqs.length - 2));
  }

  function handleIgnore(id: string) {
    updateProviderRequestStatus(id, "ignored");
    markSeen(id);
    reload();
    if (slideIndex >= slideReqs.length - 1) setSlideIndex(Math.max(0, slideReqs.length - 2));
  }

  const tabs: { id: ReqTab; label: string; count?: number }[] = [
    { id: "all", label: "Barchasi" },
    { id: "new", label: "Yangi", count: newCount },
    { id: "seen", label: "Ko'rilgan" },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-violet-600" />
          <h2 className="font-bold text-sm text-gray-900">Mavjud so'rovlar</h2>
        </div>
      </div>

      {/* Slide cards for new requests */}
      {slideReqs.length > 0 && (
        <div className="mb-4">
          <AnimatePresence mode="wait">
            {current && (
              <RequestSlideCard
                key={current.id}
                request={current}
                onRespond={handleRespond}
                onIgnore={handleIgnore}
                onNext={() => setSlideIndex((i) => Math.min(i + 1, slideReqs.length - 1))}
                isLast={slideIndex === slideReqs.length - 1}
                index={slideIndex}
                total={slideReqs.length}
              />
            )}
          </AnimatePresence>
          <div className="flex justify-between mt-3">
            <button
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 disabled:opacity-30 hover:text-violet-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Oldingi
            </button>
            <button
              disabled={slideIndex >= slideReqs.length - 1}
              onClick={() => setSlideIndex((i) => Math.min(i + 1, slideReqs.length - 1))}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 disabled:opacity-30 hover:text-violet-600 transition-colors"
            >
              Keyingi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs + list */}
      <div className="flex gap-2 mb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === t.id
                ? "text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            style={tab === t.id ? { background: VIOLET } : {}}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                tab === t.id ? "bg-white text-violet-700" : "bg-violet-600 text-white"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">So'rovlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => {
            const urg = urgencyLabel(r.urgency);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 card-shadow p-4 flex items-start gap-3"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{r.categoryName}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${urg.color}`}>{urg.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">{r.description}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] font-bold text-violet-700">{r.budgetLabel}</span>
                    <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                      <MapPin className="w-3 h-3" />{r.location}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRespond(r.id)}
                  className="flex-shrink-0 h-8 px-3 rounded-xl text-white text-xs font-bold"
                  style={{ background: VIOLET }}
                >
                  Javob
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Share Profile ──────────────────────────────────────────────── */
function ShareProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const profileUrl = `${window.location.origin}/providers/${user?.id}`;

  function copyLink() {
    navigator.clipboard.writeText(profileUrl).catch(() => {});
    toast({ title: "Havola nusxalandi!", description: "Ulashish uchun tayyor." });
  }

  function shareToTelegram() {
    copyLink();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent("Mening Hormang profilim")}`, "_blank");
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-violet-600" />
        <h2 className="font-bold text-sm text-gray-900">Profil bilan ulashing</h2>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4">
        <p className="text-xs text-gray-500 mb-3">Profilingiz havolasini do'stlar va mijozlarga ulashing</p>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 h-10 rounded-xl border-2 border-violet-100 bg-violet-50 text-violet-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-violet-100"
          >
            <Link2 className="w-3.5 h-3.5" />
            Havolani nusxalash
          </button>
          <button
            onClick={shareToTelegram}
            className="flex-1 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Events Placeholder ─────────────────────────────────────────── */
function EventsSection() {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h2 className="font-bold text-sm text-gray-900">Tadbirlar</h2>
      </div>
      <div className="bg-white rounded-2xl border border-violet-50 card-shadow p-5 text-center">
        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
        </div>
        <p className="font-bold text-gray-500 text-sm mb-0.5">Tez orada</p>
        <p className="text-xs text-gray-400">Mahalliy tadbirlar va yangiliklar bu yerda ko'rsatiladi</p>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ProviderHomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const unseenCount = getProviderRequests().filter(
    (r) => !getSeenIds().includes(r.id) && r.status === "open"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 card-shadow">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2.5">
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-900 text-sm hidden sm:inline">Hormang</span>
          </button>
          <div className="flex-1" />
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: VIOLET }}>
            Ijrochi
          </span>
          {unseenCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
              {unseenCount} yangi
            </span>
          )}
          <button
            onClick={() => setLocation("/profile/settings")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
            style={{ background: VIOLET }}
          >
            {user?.firstName?.[0]}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-lg font-extrabold text-gray-900">
            Assalomu alaykum, {user?.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Bugungi so'rovlar va xizmatlaringiz</p>
        </motion.div>

        <ProfileCompletion />
        <UpcomingServices />
        <EventsSection />
        <AvailableRequests />
        <ShareProfile />
      </div>

      <BottomNav />
    </div>
  );
}
