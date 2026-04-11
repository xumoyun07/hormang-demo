/**
 * /admin — Hormang Admin Dashboard
 * Credentials: hormangVIP / ourhormang123
 * Color theme: RED
 *
 * Data keys (match main app exactly):
 *   hormang_requests        — CustomerRequest[]
 *   hormang_offers          — Offer[]  (buyer side)
 *   hormang_provider_offers — ProviderOffer[] (provider side)
 *   hormang_provider_chats  — ProviderChat[]
 *   hormang_local_profile_* — ProviderProfile (one per user)
 *   hormang_pricing_tiers   — PricingTier[]
 *   hormang_admin_log       — AdminLogEntry[]
 *
 * Real-time sync: listens to "hormang:store-change" (same bus as main app)
 * plus window "storage" for cross-tab updates.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, Legend,
} from "recharts";
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare, CreditCard,
  FileText, Settings, LogOut, ChevronRight, Eye, EyeOff,
  TrendingUp, AlertCircle, Check, X, Search, RefreshCw,
  Shield, Trash2, Ban, CheckCircle2, Inbox, DollarSign,
  Bell, Menu, ChevronLeft, Plus, MapPin, Clock, Wallet,
} from "lucide-react";
import { onStoreChange, emitStoreChange } from "@/lib/store-events";
import { formatDateTime, formatMonthYear } from "@/lib/date-utils";

/* ─── Credentials ───────────────────────────────────────────────── */
const ADMIN_USER = "hormangVIP";
const ADMIN_PASS = "ourhormang123";
const SESSION_KEY = "hormang_admin_session_v1";

/* ─── Storage keys (mirrors main app exactly) ────────────────────── */
const K = {
  REQUESTS:        "hormang_requests",
  OFFERS_BUYER:    "hormang_offers",
  OFFERS_PROVIDER: "hormang_provider_offers",
  CHATS_PROVIDER:  "hormang_provider_chats",
  CHATS_BUYER:     "hormang_chats",
  PRICING_TIERS:   "hormang_pricing_tiers",
  ADMIN_LOG:       "hormang_admin_log",
  PROFILE_PREFIX:  "hormang_local_profile_",
} as const;

/* ─── Platform reset ─────────────────────────────────────────────── */
const RESET_KEYS = [
  "hormang_requests",
  "hormang_offers",
  "hormang_provider_offers",
  "hormang_provider_chats",
  "hormang_chats",
  "hormang_provider_requests",
  "hormang_provider_seen",
  "hormang_provider_statuses",
  "hormang_provider_avg_response",
  "hormang_provider_seed_version",
  "hormang_customer_registry",
];
const RESET_INIT_EMPTY = [
  "hormang_requests","hormang_offers","hormang_provider_offers",
  "hormang_provider_chats","hormang_chats",
];

function resetPlatformData(): boolean {
  if (!confirm("⚠️ Barcha so'rovlar, takliflar, chatlar va foydalanuvchi ro'yxati o'chiriladi.\nFaqat joriy admin sessiyasi saqlanib qoladi.\n\nDavom etasizmi?")) return false;
  RESET_KEYS.forEach((key) => localStorage.removeItem(key));
  RESET_INIT_EMPTY.forEach((key) => localStorage.setItem(key, "[]"));
  logAction("PLATFORM_RESET", "all", "Barcha platform ma'lumotlari tozalandi");
  emitStoreChange();
  return true;
}

/* ─── 9 canonical categories ─────────────────────────────────────── */
const CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enagalik", "Tadbir xizmatlari",
  "Ko'chirish / yuk yetkazish", "Go'zallik", "Avto xizmat",
  "Repetitorlar", "Ustachilik",
];

/* ─── Types ─────────────────────────────────────────────────────── */
type Section = "overview" | "requests" | "offers" | "users" | "monetization" | "audit" | "categories";

interface AdminLogEntry {
  id: string; action: string; target: string;
  details: string; timestamp: string; adminUser: string;
}
interface CustomerRequest {
  id: string; categoryId: string; categoryName: string; emoji: string;
  answers: Record<string, unknown>; status: string; createdAt: string; offerCount: number;
  customerId?: string; customerName?: string;
  region?: string; district?: string;
}
interface BuyerOffer {
  id: string; requestId: string; masterId: string; masterName: string;
  masterInitials: string; masterColor: string; price: number; message: string;
  priceLabel?: string; completionTime?: string; startDate?: string;
  avgResponseTime: number; createdAt: string; status: string;
}
interface PricingTier {
  id: string; name: string; credits: number; price: number;
  salePrice?: number; bonusTokens?: number; validUntil?: string;
  desc: string; color: string; active: boolean;
}
interface LocalProfile {
  userId: string; name: string; bio?: string; phone?: string;
  categories?: string[]; rating?: number; reviewCount?: number;
  verified?: boolean; createdAt?: string;
}

/* ─── Storage helpers ───────────────────────────────────────────── */
function readKey<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
}
function writeKey<T>(key: string, val: T) { localStorage.setItem(key, JSON.stringify(val)); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

/* ─── Answer-field extractors (mirrors provider-store.ts) ─────────── */
function urgencyFrom(answers: Record<string, unknown>): string {
  const u = String(answers["urgency"] ?? "");
  if (u === "urgent" || u === "today" || u === "1_2_days") return "Shoshilinch";
  if (u === "3_7_days" || u === "1_2_weeks") return "Normal";
  if (u) return "Moslashuvchan";
  return "—";
}
function budgetLabel(answers: Record<string, unknown>): string {
  const b = answers["budget"] as number | undefined;
  const open = answers["budget_open"] as boolean | undefined;
  if (b && b > 0) return `${b.toLocaleString()} so'm`;
  if (open) return "Murosalashtirish";
  return "Kelishiladi";
}
function locationFrom(answers: Record<string, unknown>): string {
  for (const k of ["district", "location", "address", "region", "move_from", "turar_joy"]) {
    const v = answers[k];
    if (v && typeof v === "string" && v.trim()) return v.trim();
  }
  return "Toshkent";
}

/* ─── Audit log ─────────────────────────────────────────────────── */
function logAction(action: string, target: string, details: string) {
  const entry: AdminLogEntry = {
    id: uid(), action, target, details,
    timestamp: new Date().toISOString(), adminUser: ADMIN_USER,
  };
  const log = readKey<AdminLogEntry[]>(K.ADMIN_LOG, []);
  writeKey(K.ADMIN_LOG, [entry, ...log].slice(0, 500));
}

/* ─── Session ───────────────────────────────────────────────────── */
function getSession() { return sessionStorage.getItem(SESSION_KEY) === "1"; }
function setSession() { sessionStorage.setItem(SESSION_KEY, "1"); }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

/* ─── Formatting ─────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return formatDateTime(iso);
}
function fmtMoney(n: number) { return `${n.toLocaleString()} so'm`; }
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60)   return `${d} daqiqa oldin`;
  if (d < 1440) return `${Math.floor(d / 60)} soat oldin`;
  return `${Math.floor(d / 1440)} kun oldin`;
}

/* ─── Status badge ──────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:      "bg-red-50 text-red-700 border-red-100",
    accepted:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    completed: "bg-green-50 text-green-700 border-green-100",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    pending:   "bg-amber-50 text-amber-700 border-amber-100",
    rejected:  "bg-rose-100 text-rose-700 border-rose-200",
    responded: "bg-red-50 text-red-600 border-red-100",
    ignored:   "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels: Record<string, string> = {
    open: "Ochiq", accepted: "Qabul", completed: "Tugallangan",
    cancelled: "Bekor", pending: "Kutmoqda", rejected: "Rad etildi",
    responded: "Javob berildi", ignored: "O'tkazildi",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {labels[status] ?? status}
    </span>
  );
}

/* ─── Shared style constants ─────────────────────────────────────── */
const inputCls = "px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-all";
const RED_HEX  = "#DC2626";
const ORANGE_HEX = "#F97316";
const PIE_COLORS = ["#DC2626","#F97316","#10B981","#F59E0B","#EF4444","#06B6D4","#8B5CF6","#F43F5E","#84CC16"];

/* ════════════════════════════════════════════════════════════════════
   LOGIN GATE
   ════════════════════════════════════════════════════════════════════ */
function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        setSession();
        logAction("LOGIN", "admin", "Admin tizimga kirdi");
        onSuccess();
      } else {
        setError("Noto'g'ri login yoki parol");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1a0505 0%, #2d0a0a 40%, #1a0505 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #DC2626 0%, transparent 70%)" }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50"
              style={{ background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)" }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Hormang Admin</h1>
          <p className="text-red-300/60 text-sm">Boshqaruv paneliga kirish</p>
        </div>

        <form onSubmit={submit}
          className="rounded-2xl p-6 border shadow-2xl"
          style={{ background: "rgba(30,8,8,0.85)", borderColor: "rgba(220,38,38,0.2)", backdropFilter: "blur(10px)" }}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(252,165,165,0.8)" }}>Foydalanuvchi nomi</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="hormangVIP"
                className="w-full px-3.5 py-3 rounded-xl text-white placeholder:text-red-900/60 text-sm focus:outline-none transition-all"
                style={{ background: "rgba(127,29,29,0.3)", border: "1px solid rgba(220,38,38,0.25)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(220,38,38,0.7)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "rgba(220,38,38,0.25)"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(252,165,165,0.8)" }}>Parol</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••"
                  className="w-full px-3.5 py-3 pr-11 rounded-xl text-white placeholder:text-red-900/60 text-sm focus:outline-none transition-all"
                  style={{ background: "rgba(127,29,29,0.3)", border: "1px solid rgba(220,38,38,0.25)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(220,38,38,0.7)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(220,38,38,0.25)"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400/60 hover:text-red-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || !username || !password}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", boxShadow: "0 4px 20px rgba(220,38,38,0.4)" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Tekshirilmoqda...
              </span>
            ) : "Kirish →"}
          </button>
        </form>
        <p className="text-center text-xs mt-4" style={{ color: "rgba(220,38,38,0.3)" }}>Hormang Admin Panel v2.0</p>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SIDEBAR
   ════════════════════════════════════════════════════════════════════ */
const NAV_ITEMS: { id: Section; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "overview",     label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { id: "requests",     label: "So'rovlar",         icon: ClipboardList   },
  { id: "offers",       label: "Takliflar",          icon: MessageSquare   },
  { id: "users",        label: "Foydalanuvchilar",   icon: Users           },
  { id: "monetization", label: "Monetizatsiya",      icon: CreditCard      },
  { id: "audit",        label: "Audit log",          icon: FileText        },
  { id: "categories",   label: "Toifalar",           icon: Settings        },
];

function Sidebar({ active, onChange, collapsed, onToggle, onLogout }: {
  active: Section; onChange: (s: Section) => void;
  collapsed: boolean; onToggle: () => void; onLogout: () => void;
}) {
  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      style={{ background: "linear-gradient(180deg, #1a0505 0%, #0f0202 100%)", borderRight: "1px solid rgba(220,38,38,0.15)" }}>
      <div className="px-3 py-4 flex items-center gap-3 min-h-[60px]"
        style={{ borderBottom: "1px solid rgba(220,38,38,0.1)" }}>
        <button onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white transition-all hover:opacity-80 active:scale-95"
          style={{ background: "linear-gradient(135deg, #DC2626, #991B1B)" }}>
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <div>
            <span className="font-extrabold text-white text-sm tracking-tight">Hormang</span>
            <span className="font-extrabold text-sm tracking-tight" style={{ color: "#DC2626" }}> Admin</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? "text-white" : ""}`}
              style={isActive
                ? { background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", boxShadow: "0 4px 12px rgba(220,38,38,0.35)" }
                : { color: "rgba(252,165,165,0.5)" }
              }
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.1)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ""; }}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-2 py-4" style={{ borderTop: "1px solid rgba(220,38,38,0.1)" }}>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: "rgba(252,165,165,0.4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.15)"; (e.currentTarget as HTMLElement).style.color = "#FCA5A5"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "rgba(252,165,165,0.4)"; }}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && "Chiqish"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   METRIC CARD
   ════════════════════════════════════════════════════════════════════ */
function MetricCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub: string;
  icon: React.FC<{ className?: string }>; accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OVERVIEW SECTION
   ════════════════════════════════════════════════════════════════════ */
const DAY_NAMES = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

function OverviewSection({ refreshKey }: { refreshKey: number }) {
  void refreshKey;

  const requests       = readKey<CustomerRequest[]>(K.REQUESTS, []);
  const buyerOffers    = readKey<BuyerOffer[]>(K.OFFERS_BUYER, []);
  const chats          = readKey<{ id: string }[]>(K.CHATS_BUYER, []);

  // Count unique provider IDs from offers
  const uniqueProviderIds = new Set(buyerOffers.map((o) => o.masterId));
  const totalProviders = uniqueProviderIds.size;

  // Real accepted revenue from buyer offers
  const totalRevenue = buyerOffers
    .filter((o) => o.status === "accepted")
    .reduce((s, o) => s + (o.price ?? 0), 0);

  // Real activity for last 7 days — no fake sin/cos
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dayStr = d.toISOString().slice(0, 10);
    return {
      name: DAY_NAMES[d.getDay()],
      sorovlar:  requests.filter((r) => r.createdAt?.slice(0, 10) === dayStr).length,
      takliflar: buyerOffers.filter((o) => o.createdAt?.slice(0, 10) === dayStr).length,
    };
  });

  const catMap: Record<string, number> = {};
  requests.forEach((r) => { catMap[r.categoryName] = (catMap[r.categoryName] ?? 0) + 1; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const statusMap: Record<string, number> = {};
  requests.forEach((r) => { statusMap[r.status] = (statusMap[r.status] ?? 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Umumiy ko'rinish</h2>
        <p className="text-sm text-gray-500">Platformaning real-time holati</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Jami so'rovlar" value={requests.length}
          sub={`${requests.filter(r => r.status === "open").length} ta ochiq`} icon={ClipboardList} accent />
        <MetricCard label="Jami takliflar" value={buyerOffers.length}
          sub={`${buyerOffers.filter(o => o.status === "accepted").length} ta qabul qilindi`} icon={MessageSquare} />
        <MetricCard label="Suhbatlar / Ijrochilar" value={`${chats.length} / ${totalProviders}`}
          sub="Faol chatlar · Noyob ijrochilar" icon={TrendingUp} />
        <MetricCard label="Qabul qilingan summa" value={totalRevenue > 0 ? fmtMoney(totalRevenue) : "—"}
          sub="Qabul qilingan takliflar asosida" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Haftalik faollik</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED_HEX} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={RED_HEX} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE_HEX} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={ORANGE_HEX} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #FEE2E2", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="sorovlar"  name="So'rovlar"  stroke={RED_HEX}    fill="url(#gRed)"    strokeWidth={2.5} />
              <Area type="monotone" dataKey="takliflar" name="Takliflar"  stroke={ORANGE_HEX} fill="url(#gOrange)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Toifa taqsimoti</h3>
          {catData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-gray-400">So'rovlar yo'q</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={28}>
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #FEE2E2", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {catData.slice(0, 4).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 truncate max-w-[120px]">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {statusData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">So'rov holatlari</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} width={90} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #FEE2E2", fontSize: 11 }} />
              <Bar dataKey="value" fill={RED_HEX} radius={[0, 6, 6, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Danger Zone ─────────────────────────────────────────── */}
      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const [done, setDone] = useState(false);

  function handleReset() {
    const ok = resetPlatformData();
    if (ok) setDone(true);
  }

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Xavfli zona</h3>
          <p className="text-xs text-gray-500 mt-0.5">Bu amalni qaytarib bo'lmaydi. Ehtiyotkorlik bilan foydalaning.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
        <div className="min-w-0">
          <p className="text-sm font-bold text-red-800">Platforma ma'lumotlarini tozalash</p>
          <p className="text-xs text-red-500 mt-0.5">
            Barcha so'rovlar, takliflar va chatlar o'chiriladi. Sessiya va profil ma'lumotlari saqlanib qoladi.
          </p>
        </div>
        {done ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tozalandi
          </div>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)" }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Tozalash
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   REQUESTS SECTION
   ════════════════════════════════════════════════════════════════════ */
function RequestsSection({ refreshKey }: { refreshKey: number }) {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat]       = useState("all");

  const load = useCallback(() => {
    setRequests(
      readKey<CustomerRequest[]>(K.REQUESTS, [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  function updateStatus(id: string, status: string) {
    const updated = requests.map((r) => r.id === id ? { ...r, status } : r);
    writeKey(K.REQUESTS, updated);
    setRequests(updated);
    emitStoreChange();
    logAction("UPDATE_REQUEST_STATUS", id, `Status: ${status}`);
  }
  function deleteRequest(id: string) {
    if (!confirm("Bu so'rovni o'chirishni tasdiqlaysizmi?\nBarcha bog'liq takliflar ham ko'rinmay qoladi.")) return;
    const updated = requests.filter((r) => r.id !== id);
    writeKey(K.REQUESTS, updated);
    setRequests(updated);
    emitStoreChange();
    logAction("DELETE_REQUEST", id, "So'rov o'chirildi");
  }

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const name = (r.customerName ?? "").toLowerCase();
    return (
      (!q || r.categoryName.toLowerCase().includes(q) || r.id.includes(q) || name.includes(q))
      && (filterStatus === "all" || r.status === filterStatus)
      && (filterCat === "all" || r.categoryName === filterCat)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">So'rovlar</h2>
          <p className="text-sm text-gray-500">{filtered.length} / {requests.length} ta natija</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100">
          <RefreshCw className="w-3.5 h-3.5" /> Yangilash
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Toifa, mijoz yoki ID..."
            className={`${inputCls} w-full pl-9`} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls}>
          <option value="all">Barcha holatlar</option>
          <option value="open">Ochiq</option>
          <option value="accepted">Qabul</option>
          <option value="completed">Tugallangan</option>
          <option value="cancelled">Bekor</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={inputCls}>
          <option value="all">Barcha toifalar</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              {requests.length === 0 ? "Hali hech qanday so'rov yo'q" : "So'rovlar topilmadi"}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {requests.length === 0
                ? "Xaridorlar so'rov yuborganda bu yerda ko'rinadi"
                : "Filtrlash parametrlarini o'zgartiring"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-red-50/40">
                  {["Toifa", "Mijoz", "Joylashuv", "Shoshilinchlik", "Byudjet", "Holat", "Takliflar", "Sana", "Amallar"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-red-400 uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{r.emoji}</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs leading-tight">{r.categoryName}</p>
                          <p className="text-gray-400 text-[10px] font-mono">{r.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700 max-w-[90px] truncate">
                        {r.customerName ?? <span className="text-gray-300 italic">Noma'lum</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="max-w-[90px] truncate">
                          {r.district ?? r.region ?? locationFrom(r.answers)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        {urgencyFrom(r.answers)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Wallet className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="max-w-[100px] truncate">{budgetLabel(r.answers)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${r.offerCount > 0 ? "text-red-600" : "text-gray-300"}`}>{r.offerCount}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === "open" && (
                          <button onClick={() => updateStatus(r.id, "completed")}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Tugallangan deb belgilash">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status === "open" && (
                          <button onClick={() => updateStatus(r.id, "cancelled")}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Bekor qilish">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteRequest(r.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="O'chirish">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OFFERS SECTION
   Reads from hormang_offers (canonical shared key) — same as main app.
   ════════════════════════════════════════════════════════════════════ */
function OffersSection({ refreshKey }: { refreshKey: number }) {
  const [offers, setOffers]               = useState<BuyerOffer[]>([]);
  const [filterStatus, setFilterStatus]   = useState("all");
  const [search, setSearch]               = useState("");

  const load = useCallback(() => {
    setOffers(
      readKey<BuyerOffer[]>(K.OFFERS_BUYER, [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = offers.filter((o) => {
    const q = search.toLowerCase();
    return (
      (!q || o.masterName.toLowerCase().includes(q) || o.id.includes(q) || o.requestId.includes(q))
      && (filterStatus === "all" || o.status === filterStatus)
    );
  });

  // aggregate stats
  const pending  = offers.filter((o) => o.status === "pending").length;
  const accepted = offers.filter((o) => o.status === "accepted").length;
  const rejected = offers.filter((o) => o.status === "rejected").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Takliflar</h2>
          <p className="text-sm text-gray-500">{filtered.length} / {offers.length} ta natija</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100">
          <RefreshCw className="w-3.5 h-3.5" /> Yangilash
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Kutmoqda", value: pending,  color: "text-amber-600",   bg: "bg-amber-50 border-amber-100"   },
          { label: "Qabul",    value: accepted, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Rad",      value: rejected, color: "text-rose-600",    bg: "bg-rose-50 border-rose-100"     },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Usta nomi, taklif ID yoki so'rov ID..."
            className={`${inputCls} w-full pl-9`} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls}>
          <option value="all">Barcha holatlar</option>
          <option value="pending">Kutmoqda</option>
          <option value="accepted">Qabul</option>
          <option value="rejected">Rad etildi</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              {offers.length === 0 ? "Hali hech qanday taklif yo'q" : "Takliflar topilmadi"}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {offers.length === 0 ? "Ijrochilar taklif yuboргanда bu yerda ko'rinadi" : "Qidiruv parametrlarini o'zgartiring"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-red-50/40">
                  {["Ijrochi", "Narx", "Muddat", "Holat", "So'rov ID", "Javob vaqti", "Sana"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-red-400 uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: o.masterColor ?? "#DC2626" }}>
                          {o.masterInitials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{o.masterName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{o.masterId?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {o.priceLabel ?? fmtMoney(o.price)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {o.completionTime ?? "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{o.requestId?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {o.avgResponseTime ? `~${o.avgResponseTime} daqiqa` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{timeAgo(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   USERS SECTION
   Sources:
     • Providers  → unique masterIds from hormang_offers (real names/initials)
                    + hormang_local_profile_* (serviceAreas, region)
     • Customers  → hormang_customer_registry
     • "Both"     → userId appears in both provider offers AND registry
   ════════════════════════════════════════════════════════════════════ */
interface AdminUser {
  userId:           string;
  name:             string;
  initials:         string;
  color:            string;
  role:             "provider" | "customer" | "both";
  categories?:      string[];
  phone?:           string;
  phoneVerified?:   boolean;
  location?:        string;
  serviceAreas?:    string[];
  completionPct?:   number;  // % of offers accepted
  offerCount?:      number;
  acceptedCount?:   number;
  requestCount?:    number;
  rating?:          number;
  reviewCount?:     number;
  avgResponseTime?: number;
  verified?:        boolean;
  status:           "active" | "suspended";
  joinedAt?:        string;
}

/* ─── UserProfileModal ────────────────────────────────────────────── */
function AdminUserProfileModal({
  user, onClose,
}: { user: AdminUser | null; onClose: () => void }) {
  if (!user) return null;
  const u = user;
  const roleBg  = u.role === "provider" ? "bg-violet-600"
                : u.role === "both"     ? "bg-gradient-to-br from-violet-600 to-blue-600"
                :                        "bg-blue-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Header bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3.5 flex items-center justify-between z-10">
          <h2 className="text-base font-extrabold text-gray-900">Foydalanuvchi profili</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white flex-shrink-0 shadow-md ${roleBg}`}>
              {u.initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-extrabold text-gray-900 truncate">{u.name}</h3>
              <p className="text-[11px] text-gray-400 font-mono">{u.userId}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {(u.role === "provider" || u.role === "both") && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-violet-50 text-violet-700 border-violet-100">Ijrochi</span>
                )}
                {(u.role === "customer" || u.role === "both") && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-100">Xaridor</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  u.status === "suspended"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}>
                  {u.status === "suspended" ? "To'xtatilgan" : "Faol"}
                </span>
                {u.verified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-teal-50 text-teal-700 border-teal-100">✓ Tasdiqlangan</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kontakt</h4>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-32 text-[12px]">Telefon</span>
              <span className="font-semibold text-gray-800">{u.phone ?? "—"}</span>
              {u.phoneVerified && <span className="text-emerald-600 text-[10px] font-bold">✓</span>}
            </div>
            {u.location && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-32 text-[12px]">Joylashuv</span>
                <span className="font-semibold text-gray-800">{u.location}</span>
              </div>
            )}
            {u.joinedAt && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-32 text-[12px]">Ro'yxatdan o'tgan</span>
                <span className="font-semibold text-gray-800">{fmtDate(u.joinedAt)}</span>
              </div>
            )}
          </div>

          {/* Service areas (provider) */}
          {u.serviceAreas && u.serviceAreas.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Xizmat hududlari</h4>
              <div className="flex flex-wrap gap-1.5">
                {u.serviceAreas.map((a) => (
                  <span key={a} className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Categories (provider) */}
          {u.categories && u.categories.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Toifalar</h4>
              <div className="flex flex-wrap gap-1.5">
                {u.categories.map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-lg border border-violet-100">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Provider stats */}
          {(u.role === "provider" || u.role === "both") && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Ijrochi statistikasi</h4>
              <div className="grid grid-cols-2 gap-3">
                {u.rating !== undefined && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                    <p className="text-[9px] font-bold text-amber-500 uppercase mb-1">Reyting</p>
                    <p className="text-2xl font-extrabold text-amber-700">★ {u.rating.toFixed(1)}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">{u.reviewCount ?? 0} ta sharh</p>
                  </div>
                )}
                {u.offerCount !== undefined && (
                  <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 text-center">
                    <p className="text-[9px] font-bold text-violet-500 uppercase mb-1">Takliflar</p>
                    <p className="text-2xl font-extrabold text-violet-700">{u.offerCount}</p>
                    <p className="text-[10px] text-violet-600 mt-0.5">{u.acceptedCount ?? 0} ta qabul</p>
                  </div>
                )}
                {u.completionPct !== undefined && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase mb-1">Qabul %</p>
                    <p className="text-2xl font-extrabold text-emerald-700">{u.completionPct}%</p>
                  </div>
                )}
                {u.avgResponseTime !== undefined && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
                    <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">Javob vaqti</p>
                    <p className="text-2xl font-extrabold text-blue-700">~{u.avgResponseTime}m</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer stats */}
          {(u.role === "customer" || u.role === "both") && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Xaridor statistikasi</h4>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center inline-block min-w-[120px]">
                <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">So'rovlar</p>
                <p className="text-2xl font-extrabold text-blue-700">{u.requestCount ?? 0}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── UsersSection ────────────────────────────────────────────────── */
type RoleFilter   = "all" | "provider" | "customer" | "both";
type StatusFilter = "all" | "active" | "suspended" | "verified";

function UsersSection({ refreshKey }: { refreshKey: number }) {
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [suspended, setSuspended]       = useState<Set<string>>(() =>
    new Set(readKey<string[]>("hormang_admin_suspended_users", []))
  );
  const [search, setSearch]             = useState("");
  const [filterRole, setFilterRole]     = useState<RoleFilter>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterCats, setFilterCats]     = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    const allOffers   = readKey<BuyerOffer[]>(K.OFFERS_BUYER, []);
    const allRequests = readKey<CustomerRequest[]>(K.REQUESTS, []);
    const registry    = readKey<Record<string, { name: string; initials: string }>>(
      "hormang_customer_registry", {}
    );
    const suspended_  = readKey<string[]>("hormang_admin_suspended_users", []);
    const suspSet     = new Set(suspended_);

    /* ── Step 1: Build provider map from offers (canonical provider source) ── */
    const providerMap = new Map<string, AdminUser>();
    for (const offer of allOffers) {
      if (!offer.masterId) continue;
      if (!providerMap.has(offer.masterId)) {
        providerMap.set(offer.masterId, {
          userId:    offer.masterId,
          name:      offer.masterName   ?? "Ijrochi",
          initials:  offer.masterInitials ?? offer.masterName?.[0] ?? "I",
          color:     offer.masterColor  ?? "#7C3AED",
          role:      "provider",
          offerCount:    0,
          acceptedCount: 0,
          avgResponseTime: 0,
          status:    suspSet.has(offer.masterId) ? "suspended" : "active",
        });
      }
      const p = providerMap.get(offer.masterId)!;
      p.offerCount = (p.offerCount ?? 0) + 1;
      if (offer.status === "accepted") p.acceptedCount = (p.acceptedCount ?? 0) + 1;
      if (offer.avgResponseTime) {
        p.avgResponseTime = Math.round(
          ((p.avgResponseTime ?? 0) * ((p.offerCount ?? 1) - 1) + offer.avgResponseTime) / (p.offerCount ?? 1)
        );
      }
    }
    // Compute completionPct
    for (const p of providerMap.values()) {
      if (p.offerCount && p.offerCount > 0) {
        p.completionPct = Math.round(((p.acceptedCount ?? 0) / p.offerCount) * 100);
      }
    }

    /* ── Step 2: Enrich providers with LocalProfile data (serviceAreas, joinedAt) ── */
    for (let i = 0; i < localStorage.length; i++) {
      const lsKey = localStorage.key(i);
      if (!lsKey?.startsWith(K.PROFILE_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(lsKey);
        if (!raw) continue;
        const lp = JSON.parse(raw) as {
          serviceAreas?: string[]; region?: string; district?: string;
          createdAt?: string; photoUrl?: string;
        };
        const uid_ = lsKey.replace(K.PROFILE_PREFIX, "");
        const provider = providerMap.get(uid_);
        if (provider) {
          provider.serviceAreas = lp.serviceAreas ?? (lp.region ? [lp.region] : undefined);
          provider.joinedAt     = lp.createdAt;
          provider.location     = lp.district ?? lp.region;
        }
      } catch { /* skip */ }
    }

    /* ── Step 3: Customer registry → build customer list ── */
    const result: AdminUser[] = [...providerMap.values()];
    const providerIds = new Set(providerMap.keys());

    for (const [userId, entry] of Object.entries(registry)) {
      const custRequests = allRequests.filter((r) => r.customerId === userId);
      const location     = custRequests.length > 0
        ? (custRequests[0].district ?? custRequests[0].region ?? locationFrom(custRequests[0].answers))
        : undefined;

      if (providerIds.has(userId)) {
        // Upgrade existing provider to "both"
        const provider = providerMap.get(userId)!;
        provider.role         = "both";
        provider.requestCount = custRequests.length;
        provider.location     = provider.location ?? location;
      } else {
        result.push({
          userId,
          name:         entry.name ?? "Xaridor",
          initials:     entry.initials ?? "X",
          color:        "#2563EB",
          role:         "customer",
          requestCount: custRequests.length,
          location,
          status:       suspSet.has(userId) ? "suspended" : "active",
        });
      }
    }

    setUsers(result.sort((a, b) => {
      // providers + both first, then customers; within groups alphabetical
      const roleOrder = { both: 0, provider: 1, customer: 2 };
      const diff = roleOrder[a.role] - roleOrder[b.role];
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    }));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  /* ── Actions ── */
  function toggleSuspend(userId: string) {
    const next = new Set(suspended);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSuspended(next);
    writeKey("hormang_admin_suspended_users", Array.from(next));
    // Reflect immediately in local list
    setUsers((prev) => prev.map((u) =>
      u.userId === userId ? { ...u, status: next.has(userId) ? "suspended" : "active" } : u
    ));
    const u = users.find((x) => x.userId === userId);
    logAction("TOGGLE_USER_STATUS", userId, `${u?.name ?? userId} holati o'zgartirildi`);
  }

  function deleteUser(user: AdminUser) {
    if (!confirm(`"${user.name}" foydalanuvchisini o'chirishni tasdiqlaysizmi?\nBu amalni qaytarib bo'lmaydi.`)) return;
    // 1. Remove local profile (provider physical data)
    localStorage.removeItem(`${K.PROFILE_PREFIX}${user.userId}`);
    // 2. Remove from customer registry
    const registry = readKey<Record<string, unknown>>("hormang_customer_registry", {});
    delete registry[user.userId];
    writeKey("hormang_customer_registry", registry);
    // 3. Remove from suspended list
    const next = new Set(suspended);
    next.delete(user.userId);
    setSuspended(next);
    writeKey("hormang_admin_suspended_users", Array.from(next));
    // 4. Update local state
    setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    logAction("DELETE_USER", user.userId, `${user.name} o'chirildi`);
    emitStoreChange();
  }

  /* ── Category pill toggle ── */
  function toggleCat(cat: string) {
    setFilterCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  /* ── Filtering ── */
  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (q && !u.name.toLowerCase().includes(q) && !u.userId.includes(q) && !(u.phone?.includes(q))) return false;
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterStatus === "active"    && u.status !== "active")     return false;
    if (filterStatus === "suspended" && u.status !== "suspended")  return false;
    if (filterStatus === "verified"  && !u.verified)               return false;
    if (filterCats.size > 0 && !([...filterCats].some((c) => u.categories?.includes(c)))) return false;
    return true;
  });

  const providerCount  = users.filter((u) => u.role === "provider" || u.role === "both").length;
  const customerCount  = users.filter((u) => u.role === "customer" || u.role === "both").length;
  const bothCount      = users.filter((u) => u.role === "both").length;
  const verifiedCount  = users.filter((u) => u.verified).length;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Foydalanuvchilar</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} jami ·&nbsp;
            <span className="text-violet-600 font-semibold">{providerCount} ijrochi</span> ·&nbsp;
            <span className="text-blue-600 font-semibold">{customerCount} xaridor</span>
            {bothCount > 0 && <> · <span className="text-indigo-600 font-semibold">{bothCount} ikkalasi</span></>}
            {verifiedCount > 0 && <> · <span className="text-teal-600 font-semibold">{verifiedCount} tasdiqlangan</span></>}
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100 flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Yangilash
        </button>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon yoki ID bo'yicha qidirish..."
            className={`${inputCls} w-full pl-9`} />
        </div>
        {/* Role filter */}
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as RoleFilter)} className={inputCls}>
          <option value="all">Barcha rollar</option>
          <option value="provider">Ijrochilar</option>
          <option value="customer">Xaridorlar</option>
          <option value="both">Ikkalasi ham</option>
        </select>
        {/* Status filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className={inputCls}>
          <option value="all">Barcha holatlari</option>
          <option value="active">Faol</option>
          <option value="suspended">To'xtatilgan</option>
          <option value="verified">Tasdiqlangan</option>
        </select>
      </div>

      {/* ── Category multi-select pills ── */}
      {(filterRole === "all" || filterRole === "provider" || filterRole === "both") && (
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = filterCats.has(cat);
            return (
              <button key={cat} onClick={() => toggleCat(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  active
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                }`}>
                {cat}
              </button>
            );
          })}
          {filterCats.size > 0 && (
            <button onClick={() => setFilterCats(new Set())}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition-all">
              Tozalash ✕
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-base">
              {users.length === 0 ? "Hali foydalanuvchilar yo'q" : "Topilmadi"}
            </p>
            <p className="text-gray-300 text-sm mt-1.5">
              {users.length === 0
                ? "Tizimga kirgan foydalanuvchilar bu yerda ko'rinadi"
                : "Qidiruv yoki filtrlash parametrlarini o'zgartiring"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-red-50/40">
                  {[
                    "Foydalanuvchi", "Rol", "Telefon",
                    "Joylashuv / Hudud", "Toifalar",
                    "Takliflar / Qabul", "Javob vaqti",
                    "So'rovlar", "Holat", "Qo'shilgan", "Amallar",
                  ].map((h) => (
                    <th key={h}
                      className="text-left text-[9px] font-bold text-red-400 uppercase tracking-widest px-3 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const avatarBg =
                    u.role === "both"     ? "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
                    : u.role === "provider" ? "bg-violet-100 text-violet-700"
                    :                        "bg-blue-100 text-blue-700";
                  return (
                    <tr key={u.userId} className="hover:bg-red-50/20 transition-colors group">
                      {/* User */}
                      <td className="px-3 py-3 min-w-[160px]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 ${avatarBg}`}>
                            {u.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-[12px] leading-tight whitespace-nowrap">
                              {u.name}
                            </p>
                            <p className="text-[9px] text-gray-400 font-mono">
                              {u.userId.slice(0, 12)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          {(u.role === "provider" || u.role === "both") && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-violet-50 text-violet-700 border-violet-100 w-fit">
                              Ijrochi
                            </span>
                          )}
                          {(u.role === "customer" || u.role === "both") && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-blue-50 text-blue-700 border-blue-100 w-fit">
                              Xaridor
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-3">
                        {u.phone ? (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">{u.phone}</p>
                            {u.phoneVerified
                              ? <p className="text-[9px] text-emerald-600 font-bold">✓ Tasdiqlangan</p>
                              : <p className="text-[9px] text-gray-400">Tasdiqlanmagan</p>}
                          </div>
                        ) : <span className="text-gray-300 text-[11px]">—</span>}
                      </td>

                      {/* Location / Service Areas */}
                      <td className="px-3 py-3 max-w-[140px]">
                        {u.serviceAreas && u.serviceAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-0.5">
                            {u.serviceAreas.slice(0, 2).map((a) => (
                              <span key={a} className="px-1 py-0.5 bg-red-50 text-red-600 text-[8px] font-bold rounded border border-red-100 whitespace-nowrap">
                                {a.slice(0, 12)}
                              </span>
                            ))}
                            {u.serviceAreas.length > 2 && (
                              <span className="text-[8px] text-gray-400">+{u.serviceAreas.length - 2}</span>
                            )}
                          </div>
                        ) : u.location ? (
                          <span className="text-[11px] text-gray-600">{u.location}</span>
                        ) : (
                          <span className="text-gray-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Categories */}
                      <td className="px-3 py-3 max-w-[130px]">
                        {u.categories && u.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-0.5">
                            {u.categories.slice(0, 2).map((c) => (
                              <span key={c} className="px-1 py-0.5 bg-violet-50 text-violet-700 text-[8px] font-bold rounded border border-violet-100 whitespace-nowrap">
                                {c.slice(0, 10)}
                              </span>
                            ))}
                            {u.categories.length > 2 && (
                              <span className="text-[8px] text-gray-400">+{u.categories.length - 2}</span>
                            )}
                          </div>
                        ) : <span className="text-gray-300 text-[11px]">—</span>}
                      </td>

                      {/* Offers / Accepted */}
                      <td className="px-3 py-3">
                        {u.offerCount !== undefined ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[11px] font-bold text-gray-700">
                                {u.acceptedCount}/{u.offerCount}
                              </span>
                            </div>
                            {u.completionPct !== undefined && (
                              <div className="flex items-center gap-1">
                                <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{
                                    width: `${u.completionPct}%`,
                                    background: u.completionPct >= 70 ? "#10B981"
                                              : u.completionPct >= 40 ? "#F59E0B"
                                              : "#EF4444",
                                  }} />
                                </div>
                                <span className="text-[9px] font-bold text-gray-500">{u.completionPct}%</span>
                              </div>
                            )}
                          </div>
                        ) : <span className="text-gray-300 text-[11px]">—</span>}
                      </td>

                      {/* Avg Response Time */}
                      <td className="px-3 py-3 text-[11px] text-gray-600 whitespace-nowrap">
                        {u.avgResponseTime ? `~${u.avgResponseTime}m` : "—"}
                      </td>

                      {/* Request count (customer) */}
                      <td className="px-3 py-3 text-center">
                        {u.requestCount !== undefined ? (
                          <span className="text-[12px] font-bold text-gray-700">{u.requestCount}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap ${
                          u.status === "suspended"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}>
                          {u.status === "suspended" ? "To'xtatilgan" : "Faol"}
                        </span>
                      </td>

                      {/* Joined date */}
                      <td className="px-3 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                        {u.joinedAt ? fmtDate(u.joinedAt) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Profilni ko'rish">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleSuspend(u.userId)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.status === "suspended"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-orange-500 hover:bg-orange-50"
                            }`}
                            title={u.status === "suspended" ? "Faollashtirish" : "To'xtatish"}>
                            {u.status === "suspended"
                              ? <CheckCircle2 className="w-3.5 h-3.5" />
                              : <Ban className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Foydalanuvchini o'chirish">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result count */}
      {users.length > 0 && (
        <p className="text-[11px] text-gray-400 text-right">
          {filtered.length} / {users.length} foydalanuvchi ko'rsatilmoqda
        </p>
      )}

      {/* Profile modal */}
      <AnimatePresence>
        {selectedUser && (
          <AdminUserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MONETIZATION SECTION — no DEFAULT_TIERS, load from localStorage only
   ════════════════════════════════════════════════════════════════════ */
function MonetizationSection({ refreshKey }: { refreshKey: number }) {
  const [tiers, setTiers] = useState<PricingTier[]>(() => readKey<PricingTier[]>(K.PRICING_TIERS, []));
  const [editId, setEditId]               = useState<string | null>(null);
  const [editName, setEditName]           = useState("");
  const [editDesc, setEditDesc]           = useState("");
  const [editPrice, setEditPrice]         = useState(0);
  const [editCredits, setEditCredits]     = useState(0);
  const [editSalePrice, setEditSalePrice] = useState<number | "">("");
  const [editBonusTokens, setEditBonusTokens] = useState<number | "">("");
  const [editValidUntil, setEditValidUntil]   = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState({
    name: "", credits: 0, price: 0, salePrice: "", bonusTokens: "", validUntil: "", desc: "",
  });

  void refreshKey;

  const allOffers    = readKey<BuyerOffer[]>(K.OFFERS_BUYER, []);
  const totalRevenue = allOffers.filter((o) => o.status === "accepted").reduce((s, o) => s + (o.price ?? 0), 0);
  const commission   = Math.round(totalRevenue * 0.15);

  // Real monthly breakdowns from accepted offers
  const monthlyMap: Record<string, number> = {};
  allOffers.filter((o) => o.status === "accepted").forEach((o) => {
    const month = formatMonthYear(o.createdAt);
    monthlyMap[month] = (monthlyMap[month] ?? 0) + (o.price ?? 0);
  });
  const revenueData = Object.entries(monthlyMap).map(([name, daromad]) => ({
    name, daromad, komissiya: Math.round(daromad * 0.15),
  }));
  // If no real data yet, show an informative placeholder
  const showRevenueChart = revenueData.length > 0;

  function saveTiers(updated: PricingTier[]) {
    setTiers(updated);
    writeKey(K.PRICING_TIERS, updated);
    emitStoreChange();
  }
  function startEdit(t: PricingTier) {
    setEditId(t.id);
    setEditName(t.name);
    setEditDesc(t.desc);
    setEditPrice(t.price);
    setEditCredits(t.credits);
    setEditSalePrice(t.salePrice ?? "");
    setEditBonusTokens(t.bonusTokens ?? "");
    setEditValidUntil(t.validUntil ?? "");
  }
  function saveEdit(id: string) {
    saveTiers(tiers.map((t) => t.id === id ? {
      ...t,
      name: editName.trim() || t.name,
      desc: editDesc,
      price: editPrice,
      credits: editCredits,
      salePrice: editSalePrice !== "" ? Number(editSalePrice) : undefined,
      bonusTokens: editBonusTokens !== "" ? Number(editBonusTokens) : undefined,
      validUntil: editValidUntil || undefined,
    } : t));
    logAction("UPDATE_PRICING", id, `Narx: ${editPrice} so'm, ${editCredits} Tanga`);
    setEditId(null);
  }
  function toggleTier(id: string) {
    saveTiers(tiers.map((t) => t.id === id ? { ...t, active: !t.active } : t));
    logAction("TOGGLE_PRICING_TIER", id, "Narx rejimi o'zgartirildi");
  }
  function deleteTier(id: string) {
    saveTiers(tiers.filter((t) => t.id !== id));
    logAction("DELETE_PRICING_TIER", id, "Narx rejimi o'chirildi");
  }
  function addTier() {
    if (!newTier.name.trim() || newTier.credits <= 0) return;
    const tier: PricingTier = {
      id: uid(),
      name: newTier.name,
      credits: newTier.credits,
      price: newTier.price,
      salePrice: newTier.salePrice !== "" ? Number(newTier.salePrice) : undefined,
      bonusTokens: newTier.bonusTokens !== "" ? Number(newTier.bonusTokens) : undefined,
      validUntil: newTier.validUntil || undefined,
      desc: newTier.desc,
      color: "bg-amber-50 text-amber-700",
      active: true,
    };
    saveTiers([...tiers, tier]);
    logAction("ADD_PRICING_TIER", tier.id, `Yangi reja: ${tier.name}`);
    setNewTier({ name: "", credits: 0, price: 0, salePrice: "", bonusTokens: "", validUntil: "", desc: "" });
    setShowAddForm(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Monetizatsiya</h2>
        <p className="text-sm text-gray-500">Narx rejalari va daromad boshqaruvi</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Jami tranzaksiyalar</p>
          <p className="text-xl font-extrabold text-gray-900">{fmtMoney(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Komissiya (15%)</p>
          <p className="text-xl font-extrabold text-red-600">{fmtMoney(commission)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Faol rejalari</p>
          <p className="text-xl font-extrabold text-gray-900">{tiers.filter((t) => t.active).length} ta</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Oylik daromad (qabul qilingan takliflar)</h3>
        {showRevenueChart ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #FEE2E2", fontSize: 11 }} formatter={(v: number) => fmtMoney(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="daromad"   name="Tranzaksiyalar" fill={RED_HEX} radius={[4, 4, 0, 0]} />
              <Bar dataKey="komissiya" name="Komissiya"       fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[180px]">
            <DollarSign className="w-8 h-8 text-red-100 mb-2" />
            <p className="text-sm text-gray-400 font-semibold">Hali qabul qilingan takliflar yo'q</p>
            <p className="text-xs text-gray-300 mt-1">Xaridorlar taklif qabul qilganda daromad ko'rinadi</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-sm">Narx rejalari</h3>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Yangi reja
          </button>
        </div>

        {showAddForm && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
            <h4 className="font-bold text-amber-700 text-sm mb-3">Yangi Tanga rejasi qo'shish</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nomi</label>
                <input value={newTier.name} onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  placeholder="Pro" className={`${inputCls} w-full mt-1`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tanga soni</label>
                <input type="number" value={newTier.credits || ""}
                  onChange={(e) => setNewTier({ ...newTier, credits: Number(e.target.value) })}
                  placeholder="50" className={`${inputCls} w-full mt-1`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Narx (so'm)</label>
                <input type="number" value={newTier.price || ""}
                  onChange={(e) => setNewTier({ ...newTier, price: Number(e.target.value) })}
                  placeholder="49000" className={`${inputCls} w-full mt-1`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Chegirma narx</label>
                <input type="number" value={newTier.salePrice}
                  onChange={(e) => setNewTier({ ...newTier, salePrice: e.target.value })}
                  placeholder="39000 (ixtiyoriy)" className={`${inputCls} w-full mt-1`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Bonus Tanga</label>
                <input type="number" value={newTier.bonusTokens}
                  onChange={(e) => setNewTier({ ...newTier, bonusTokens: e.target.value })}
                  placeholder="10 (ixtiyoriy)" className={`${inputCls} w-full mt-1`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Muddati (sana/vaqt)</label>
                <input type="datetime-local" value={newTier.validUntil}
                  onChange={(e) => setNewTier({ ...newTier, validUntil: e.target.value })}
                  className={`${inputCls} w-full mt-1`} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tavsif</label>
                <input value={newTier.desc} onChange={(e) => setNewTier({ ...newTier, desc: e.target.value })}
                  placeholder="Ijrochilar uchun" className={`${inputCls} w-full mt-1`} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addTier}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors">
                Qo'shish
              </button>
              <button onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Bekor
              </button>
            </div>
          </div>
        )}

        {tiers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-red-200 p-8 text-center">
            <CreditCard className="w-8 h-8 text-red-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Hali narx rejalari yo'q</p>
            <p className="text-xs text-gray-300 mt-1">Yuqoridagi "Yangi reja" tugmasini bosing</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map((t) => (
              <div key={t.id} className={`bg-white rounded-2xl border p-4 shadow-sm transition-opacity ${t.active ? "border-red-100" : "border-gray-100 opacity-60"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.color}`}>{t.name}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleTier(t.id)}
                      className={`text-xs font-semibold ${t.active ? "text-red-400 hover:text-red-600" : "text-emerald-500 hover:text-emerald-700"}`}>
                      {t.active ? "O'ch" : "Yoq"}
                    </button>
                    <button onClick={() => deleteTier(t.id)} className="text-xs font-semibold text-gray-300 hover:text-red-500">✕</button>
                  </div>
                </div>
                {editId === t.id ? (
                  <div className="space-y-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nomi" className={`${inputCls} w-full font-semibold`} />
                    <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Tavsif" className={`${inputCls} w-full`} />
                    <input type="number" value={editCredits} onChange={(e) => setEditCredits(Number(e.target.value))}
                      placeholder="Tanga soni" className={`${inputCls} w-full`} />
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))}
                      placeholder="Narx (so'm)" className={`${inputCls} w-full`} />
                    <input type="number" value={editSalePrice}
                      onChange={(e) => setEditSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Chegirma narx (ixtiyoriy)" className={`${inputCls} w-full`} />
                    <input type="number" value={editBonusTokens}
                      onChange={(e) => setEditBonusTokens(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Bonus Tanga (ixtiyoriy)" className={`${inputCls} w-full`} />
                    <input type="datetime-local" value={editValidUntil}
                      onChange={(e) => setEditValidUntil(e.target.value)}
                      className={`${inputCls} w-full`} />
                    <div className="flex gap-1.5">
                      <button onClick={() => saveEdit(t.id)} className="flex-1 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700">Saqlash</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">Bekor</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-extrabold text-gray-900 mb-0.5">
                      {t.credits}
                      <span className="text-sm font-semibold text-gray-400 ml-1">Tanga</span>
                      {(t.bonusTokens ?? 0) > 0 && (
                        <span className="text-xs font-bold text-emerald-600 ml-1.5">+{t.bonusTokens} bonus</span>
                      )}
                    </p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-600">{t.price === 0 ? "Bepul" : fmtMoney(t.salePrice ?? t.price)}</p>
                      {t.salePrice !== undefined && t.price > t.salePrice && (
                        <p className="text-xs text-gray-400 line-through">{fmtMoney(t.price)}</p>
                      )}
                    </div>
                    {t.validUntil && (
                      <p className="text-[10px] text-amber-600 font-semibold mb-1 truncate">
                        Muddat: {new Date(t.validUntil).toLocaleDateString("uz-UZ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mb-3">{t.desc || "—"}</p>
                    <button onClick={() => startEdit(t)}
                      className="w-full py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors">
                      Tahrirlash
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   AUDIT LOG SECTION
   ════════════════════════════════════════════════════════════════════ */
function AuditLogSection({ refreshKey }: { refreshKey: number }) {
  const [log, setLog] = useState<AdminLogEntry[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(() => { setLog(readKey<AdminLogEntry[]>(K.ADMIN_LOG, [])); }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  function clearLog() {
    if (!confirm("Barcha audit loglarni o'chirishni tasdiqlaysizmi?")) return;
    writeKey(K.ADMIN_LOG, []); setLog([]);
  }

  const filtered = log.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.action.toLowerCase().includes(q) || e.target.includes(q) || e.details.toLowerCase().includes(q);
  });

  const ACTION_COLORS: Record<string, string> = {
    LOGIN:                 "bg-red-50 text-red-700 border border-red-100",
    LOGOUT:                "bg-rose-50 text-rose-500 border border-rose-100",
    DELETE_REQUEST:        "bg-rose-100 text-rose-700 border border-rose-200",
    UPDATE_REQUEST_STATUS: "bg-amber-50 text-amber-700 border border-amber-100",
    UPDATE_OFFER_STATUS:   "bg-red-50 text-red-600 border border-red-100",
    TOGGLE_USER_STATUS:    "bg-orange-50 text-orange-700 border border-orange-100",
    UPDATE_PRICING:        "bg-emerald-50 text-emerald-700 border border-emerald-100",
    ADD_PRICING_TIER:      "bg-teal-50 text-teal-700 border border-teal-100",
    DELETE_PRICING_TIER:   "bg-rose-100 text-rose-600 border border-rose-200",
    TOGGLE_PRICING_TIER:   "bg-orange-50 text-orange-600 border border-orange-100",
    NAVIGATE:              "bg-gray-100 text-gray-500 border border-gray-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500">{log.length} ta yozuv</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100">
            <RefreshCw className="w-3.5 h-3.5" /> Yangilash
          </button>
          <button onClick={clearLog} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold hover:bg-rose-100 transition-colors border border-rose-100">
            <Trash2 className="w-3.5 h-3.5" /> Tozalash
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Amallarni qidirish..."
          className={`${inputCls} w-full pl-9`} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">Loglar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
            {filtered.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3 hover:bg-red-50/20 transition-colors">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-600"}`}>
                  {entry.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{entry.details}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{entry.target}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{fmtDate(entry.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CATEGORIES SECTION
   ════════════════════════════════════════════════════════════════════ */
function CategoriesSection() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Toifalar va Savollar</h2>
        <p className="text-sm text-gray-500">Questionnaire tizimini boshqarish</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {CATEGORIES.map((c, i) => (
          <div key={c} className="bg-white rounded-xl border border-red-50 p-3 shadow-sm flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">{i + 1}</div>
            <span className="text-xs font-semibold text-gray-700 leading-tight">{c}</span>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-red-100 p-8 shadow-sm text-center"
        style={{ background: "linear-gradient(135deg, #fff 0%, #fff8f8 100%)" }}>
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Settings className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="font-bold text-gray-800 mb-2">Savol muharriri</h3>
        <p className="text-sm text-gray-500 mb-6">Har bir toifa uchun savol va variantlarni qo'shish, tahrirlash yoki o'chirish</p>
        <button
          onClick={() => { logAction("NAVIGATE", "admin/questions", "Toifalar sahifasiga o'tildi"); setLocation("/admin/questions"); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-sm hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", boxShadow: "0 4px 14px rgba(220,38,38,0.35)" }}>
          Savol muharririga o'tish <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TOP BAR
   ════════════════════════════════════════════════════════════════════ */
function TopBar({ section, unseenAlerts, onRefresh }: {
  section: Section; unseenAlerts: number; onRefresh: () => void;
}) {
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 700);
  }

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="font-extrabold text-gray-900 text-sm">{NAV_ITEMS.find((n) => n.id === section)?.label}</h1>
        <p className="text-xs text-gray-400">Hormang Admin · <span className="text-red-500">{ADMIN_USER}</span></p>
      </div>
      <div className="flex items-center gap-3">
        {unseenAlerts > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-100">
            <Bell className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-600">{unseenAlerts} ta taklif kutmoqda</span>
          </div>
        )}
        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", color: "white", boxShadow: "0 2px 8px rgba(220,38,38,0.3)" }}
          title="Barcha ma'lumotlarni yangilash">
          <RefreshCw className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Yangilash</span>
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "linear-gradient(135deg, #DC2626, #991B1B)" }}>A</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD — real-time sync via hormang:store-change + storage
   ════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [authed,    setAuthed]    = useState(getSession());
  const [section,   setSection]   = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /* Subscribe to main app store events + cross-tab storage events */
  useEffect(() => {
    if (!authed) return;
    const bump = () => setRefreshKey((k) => k + 1);
    const unsub = onStoreChange(bump);
    window.addEventListener("storage", bump);
    return () => { unsub(); window.removeEventListener("storage", bump); };
  }, [authed]);

  function logout() {
    logAction("LOGOUT", "admin", "Admin tizimdan chiqdi");
    clearSession();
    setAuthed(false);
  }

  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;

  const requests     = readKey<CustomerRequest[]>(K.REQUESTS, []);
  const unseenAlerts = requests.filter((r) => r.status === "open" && r.offerCount === 0).length;

  const sectionProps = { refreshKey };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-shrink-0 h-screen sticky top-0">
        <Sidebar active={section} onChange={setSection} collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)} onLogout={logout} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar section={section} unseenAlerts={unseenAlerts} onRefresh={() => setRefreshKey((k) => k + 1)} />

        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}>
              {section === "overview"     && <OverviewSection     {...sectionProps} />}
              {section === "requests"     && <RequestsSection     {...sectionProps} />}
              {section === "offers"       && <OffersSection       {...sectionProps} />}
              {section === "users"        && <UsersSection        {...sectionProps} />}
              {section === "monetization" && <MonetizationSection {...sectionProps} />}
              {section === "audit"        && <AuditLogSection     {...sectionProps} />}
              {section === "categories"   && <CategoriesSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
