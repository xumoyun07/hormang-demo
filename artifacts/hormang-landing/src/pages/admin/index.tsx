/**
 * /admin — Hormang Admin Dashboard
 * Credentials: hormangVIP / ourhormang123
 *
 * Sections:
 *   Overview  · So'rovlar  · Takliflar  · Foydalanuvchilar
 *   Monetizatsiya  · Audit log  · Toifalar
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
  FileText, Settings, LogOut, ChevronRight, Eye, EyeOff, Lock,
  TrendingUp, AlertCircle, Check, X, Search, Download, RefreshCw,
  Shield, Trash2, Ban, CheckCircle2, Star, Inbox, DollarSign,
  BarChart2, Filter, ChevronDown, Bell, Menu, ChevronLeft,
} from "lucide-react";

/* ─── Credentials ───────────────────────────────────────────────── */
const ADMIN_USER = "hormangVIP";
const ADMIN_PASS = "ourhormang123";
const SESSION_KEY = "hormang_admin_session_v1";
const ADMIN_LOG_KEY = "hormang_admin_log";

/* ─── Types ─────────────────────────────────────────────────────── */
type Section = "overview" | "requests" | "offers" | "users" | "monetization" | "audit" | "categories";

interface AdminLogEntry {
  id: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  adminUser: string;
}

interface CustomerRequest {
  id: string; categoryId: string; categoryName: string; emoji: string;
  answers: Record<string, unknown>; status: string; createdAt: string; offerCount: number;
}
interface BuyerOffer {
  id: string; requestId: string; masterId: string; masterName: string;
  masterInitials: string; masterColor: string; price: number; message: string;
  avgResponseTime: number; createdAt: string; status: string;
}
interface ProviderOffer {
  id: string; requestId: string; price: number; priceLabel: string;
  message: string; completionTime: string; createdAt: string; status: string;
}

interface PricingTier {
  id: string; name: string; credits: number; price: number;
  desc: string; color: string; active: boolean;
}

/* ─── Storage helpers ───────────────────────────────────────────── */
function readKey<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; } catch { return fallback; }
}
function writeKey<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

/* ─── Audit log ─────────────────────────────────────────────────── */
function logAction(action: string, target: string, details: string) {
  const entry: AdminLogEntry = { id: uid(), action, target, details, timestamp: new Date().toISOString(), adminUser: ADMIN_USER };
  const log = readKey<AdminLogEntry[]>(ADMIN_LOG_KEY, []);
  writeKey(ADMIN_LOG_KEY, [entry, ...log].slice(0, 500));
}

/* ─── Session ───────────────────────────────────────────────────── */
function getSession() { return sessionStorage.getItem(SESSION_KEY) === "1"; }
function setSession() { sessionStorage.setItem(SESSION_KEY, "1"); }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

/* ─── Formatting ─────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtMoney(n: number) { return `${n.toLocaleString()} so'm`; }
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60) return `${d} daqiqa oldin`;
  if (d < 1440) return `${Math.floor(d / 60)} soat oldin`;
  return `${Math.floor(d / 1440)} kun oldin`;
}

/* ─── Status badge ──────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-100",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
    completed: "bg-green-50 text-green-700 border-green-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    rejected: "bg-red-50 text-red-700 border-red-100",
    responded: "bg-violet-50 text-violet-700 border-violet-100",
    ignored: "bg-gray-100 text-gray-500 border-gray-200",
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

/* ─────────────────────────────────────────────────────────────────
   LOGIN GATE
   ───────────────────────────────────────────────────────────────── */
function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Hormang Admin</h1>
          <p className="text-slate-400 text-sm">Boshqaruv paneliga kirish</p>
        </div>

        <form onSubmit={submit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Foydalanuvchi nomi</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hormangVIP"
                className="w-full px-3.5 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-3 pr-11 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/30 border border-red-700/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all active:scale-95 shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Tekshirilmoqda...
              </span>
            ) : "Kirish"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-4">Hormang Admin Panel v2.0</p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR
   ───────────────────────────────────────────────────────────────── */
const NAV_ITEMS: { id: Section; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "overview", label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { id: "requests", label: "So'rovlar", icon: ClipboardList },
  { id: "offers", label: "Takliflar", icon: MessageSquare },
  { id: "users", label: "Foydalanuvchilar", icon: Users },
  { id: "monetization", label: "Monetizatsiya", icon: CreditCard },
  { id: "audit", label: "Audit log", icon: FileText },
  { id: "categories", label: "Toifalar", icon: Settings },
];

function Sidebar({
  active, onChange, collapsed, onToggle, onLogout,
}: {
  active: Section; onChange: (s: Section) => void;
  collapsed: boolean; onToggle: () => void; onLogout: () => void;
}) {
  return (
    <div className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-800 min-h-[60px]">
        <button onClick={onToggle} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-white hover:bg-blue-500 transition-colors">
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {!collapsed && <span className="font-extrabold text-white text-base">Hormang Admin</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active_ = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active_ ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && "Chiqish"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   METRIC CARD
   ───────────────────────────────────────────────────────────────── */
function MetricCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub: string;
  icon: React.FC<{ className?: string }>; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   OVERVIEW SECTION
   ───────────────────────────────────────────────────────────────── */
function OverviewSection() {
  const requests = readKey<CustomerRequest[]>("hormang_requests", []);
  const buyerOffers = readKey<BuyerOffer[]>("hormang_offers", []);
  const providerOffers = readKey<ProviderOffer[]>("hormang_provider_offers", []);
  const providerChats = readKey<{ id: string }[]>("hormang_provider_chats", []);

  const totalOffers = [...buyerOffers, ...providerOffers].length;

  // Simulated weekly activity data
  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const activityData = days.map((name, i) => ({
    name,
    sorovlar: Math.max(0, requests.length + Math.floor(Math.sin(i) * 2 + (Math.random() < 0.5 ? 1 : 0))),
    takliflar: Math.max(0, totalOffers + Math.floor(Math.cos(i) * 2)),
  }));

  // Category distribution
  const catMap: Record<string, number> = {};
  requests.forEach((r) => { catMap[r.categoryName] = (catMap[r.categoryName] ?? 0) + 1; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const PIE_COLORS = ["#3B82F6", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#F97316", "#84CC16"];

  // Status distribution
  const statusMap: Record<string, number> = {};
  requests.forEach((r) => { statusMap[r.status] = (statusMap[r.status] ?? 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const totalRevenue = providerOffers.filter((o) => o.status === "accepted").reduce((s, o) => s + o.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Umumiy ko'rinish</h2>
        <p className="text-sm text-gray-500">Platformaning real-time holati</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Jami so'rovlar" value={requests.length} sub={`${requests.filter(r => r.status === "open").length} ta ochiq`} icon={ClipboardList} color="bg-blue-50 text-blue-600" />
        <MetricCard label="Jami takliflar" value={totalOffers} sub={`${providerOffers.filter(o => o.status === "accepted").length} ta qabul qilindi`} icon={MessageSquare} color="bg-violet-50 text-violet-600" />
        <MetricCard label="Suhbatlar" value={providerChats.length} sub="Faol muhokamalar" icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Daromad" value={fmtMoney(totalRevenue)} sub="Qabul qilingan takliflar" icon={DollarSign} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Haftalik faollik</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gViolet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="sorovlar" name="So'rovlar" stroke="#3B82F6" fill="url(#gBlue)" strokeWidth={2} />
              <Area type="monotone" dataKey="takliflar" name="Takliflar" stroke="#7C3AED" fill="url(#gViolet)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
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
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 11 }} />
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

      {/* Status bar chart */}
      {statusData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">So'rov holatlari</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} width={90} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 11 }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 6, 6, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   REQUESTS SECTION
   ───────────────────────────────────────────────────────────────── */
function RequestsSection() {
  const [requests, setRequests] = useState<CustomerRequest[]>(() =>
    readKey<CustomerRequest[]>("hormang_requests", [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  function refresh() {
    setRequests(readKey<CustomerRequest[]>("hormang_requests", [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }

  function updateStatus(id: string, status: CustomerRequest["status"]) {
    const updated = requests.map((r) => r.id === id ? { ...r, status } : r);
    writeKey("hormang_requests", updated);
    setRequests(updated);
    logAction("UPDATE_REQUEST_STATUS", id, `Status o'zgartirildi: ${status}`);
  }

  function deleteRequest(id: string) {
    if (!confirm("Bu so'rovni o'chirishni tasdiqlaysizmi?")) return;
    const updated = requests.filter((r) => r.id !== id);
    writeKey("hormang_requests", updated);
    setRequests(updated);
    logAction("DELETE_REQUEST", id, "So'rov o'chirildi");
  }

  const cats = Array.from(new Set(requests.map((r) => r.categoryName)));

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.categoryName.toLowerCase().includes(q) || r.id.includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchCat = filterCat === "all" || r.categoryName === filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">So'rovlar</h2>
          <p className="text-sm text-gray-500">{filtered.length} ta natija</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Yangilash
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400">
          <option value="all">Barcha holatlar</option>
          <option value="open">Ochiq</option>
          <option value="accepted">Qabul</option>
          <option value="completed">Tugallangan</option>
          <option value="cancelled">Bekor</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400">
          <option value="all">Barcha toifalar</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">So'rovlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">ID</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Toifa</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Holat</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Takliflar</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Sana</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span>{r.emoji}</span>
                        <span className="font-semibold text-gray-800">{r.categoryName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${r.offerCount > 0 ? "text-emerald-600" : "text-gray-400"}`}>{r.offerCount}</span>
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

/* ─────────────────────────────────────────────────────────────────
   OFFERS SECTION
   ───────────────────────────────────────────────────────────────── */
function OffersSection() {
  const [provOffers, setProvOffers] = useState<ProviderOffer[]>(() =>
    readKey<ProviderOffer[]>("hormang_provider_offers", [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [buyOffers] = useState<BuyerOffer[]>(() =>
    readKey<BuyerOffer[]>("hormang_offers", [])
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [tab, setTab] = useState<"provider" | "buyer">("provider");

  function updateProvStatus(id: string, status: string) {
    const updated = provOffers.map((o) => o.id === id ? { ...o, status } : o);
    writeKey("hormang_provider_offers", updated);
    setProvOffers(updated);
    logAction("UPDATE_OFFER_STATUS", id, `Taklif holati: ${status}`);
  }

  const filteredProv = provOffers.filter((o) => filterStatus === "all" || o.status === filterStatus);
  const filteredBuy = buyOffers.filter((o) => filterStatus === "all" || o.status === filterStatus);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Takliflar</h2>
        <p className="text-sm text-gray-500">Barcha platforma takliflari</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["provider", "buyer"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "provider" ? "Ijrochi takliflari" : "Xaridor takliflari"}
            </button>
          ))}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none">
          <option value="all">Barcha holatlar</option>
          <option value="pending">Kutmoqda</option>
          <option value="accepted">Qabul</option>
          <option value="rejected">Rad etildi</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tab === "provider" ? (
          filteredProv.length === 0 ? (
            <div className="p-12 text-center"><p className="text-gray-400">Takliflar yo'q</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">ID</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Narx</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Holat</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Muddat</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Sana</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProv.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-bold text-violet-700">{o.priceLabel}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{o.completionTime}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{timeAgo(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {o.status === "pending" && (
                            <>
                              <button onClick={() => updateProvStatus(o.id, "accepted")}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Qabul qilish">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateProvStatus(o.id, "rejected")}
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Rad etish">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredBuy.length === 0 ? (
            <div className="p-12 text-center"><p className="text-gray-400">Takliflar yo'q</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Usta</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Narx</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Holat</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Javob vaqti</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBuy.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: o.masterColor }}>{o.masterInitials}</div>
                          <span className="font-semibold text-gray-800 text-xs">{o.masterName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-violet-700">{fmtMoney(o.price)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">~{o.avgResponseTime} daqiqa</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{timeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   USERS SECTION
   ───────────────────────────────────────────────────────────────── */
const DEMO_USERS = [
  { id: "u1", name: "Alisher Toshmatov", phone: "+998 90 123 45 67", role: "provider", status: "active", joined: "2025-11-10", categories: ["Tozalash", "Ustachilik"] },
  { id: "u2", name: "Gulnora Saidova", phone: "+998 91 234 56 78", role: "buyer", status: "active", joined: "2025-12-01", categories: [] },
  { id: "u3", name: "Jasur Baxtiyorov", phone: "+998 93 345 67 89", role: "provider", status: "active", joined: "2025-12-15", categories: ["Ta'mirlash"] },
  { id: "u4", name: "Malika Rahimova", phone: "+998 97 456 78 90", role: "buyer", status: "suspended", joined: "2026-01-05", categories: [] },
  { id: "u5", name: "Firdavs Nazarov", phone: "+998 99 567 89 01", role: "provider", status: "active", joined: "2026-01-20", categories: ["Avto xizmat", "Repetitorlar"] },
  { id: "u6", name: "Barno Usmonova", phone: "+998 90 678 90 12", role: "buyer", status: "active", joined: "2026-02-01", categories: [] },
  { id: "u7", name: "Sherzod Qodirov", phone: "+998 91 789 01 23", role: "provider", status: "active", joined: "2026-02-14", categories: ["Go'zallik"] },
  { id: "u8", name: "Nodira Xolmatova", phone: "+998 93 890 12 34", role: "buyer", status: "active", joined: "2026-03-01", categories: [] },
];

function UsersSection() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  function toggleSuspend(id: string) {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
    const u = users.find((x) => x.id === id);
    logAction("TOGGLE_USER_STATUS", id, `${u?.name} holati o'zgartirildi`);
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.phone.includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Foydalanuvchilar</h2>
        <p className="text-sm text-gray-500">{filtered.length} ta foydalanuvchi (demo ma'lumotlar)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none">
          <option value="all">Barcha rollar</option>
          <option value="buyer">Xaridor</option>
          <option value="provider">Ijrochi</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none">
          <option value="all">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="suspended">To'xtatilgan</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Telefon</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Rol</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Toifalar</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Qo'shilgan</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-semibold text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.role === "provider" ? "bg-violet-50 text-violet-700 border-violet-100" : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                      {u.role === "provider" ? "Ijrochi" : "Xaridor"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                    }`}>
                      {u.status === "active" ? "Faol" : "To'xtatilgan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{u.categories.join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.joined}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSuspend(u.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        u.status === "active"
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}>
                      {u.status === "active" ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {u.status === "active" ? "To'xtatish" : "Faollashtirish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MONETIZATION SECTION
   ───────────────────────────────────────────────────────────────── */
const DEFAULT_TIERS: PricingTier[] = [
  { id: "free", name: "Bepul", credits: 5, price: 0, desc: "Yangi foydalanuvchilar uchun", color: "bg-gray-100 text-gray-700", active: true },
  { id: "starter", name: "Starter", credits: 20, price: 25000, desc: "Kichik ish hajmi uchun", color: "bg-blue-100 text-blue-700", active: true },
  { id: "pro", name: "Pro", credits: 60, price: 59000, desc: "Faol ijrochilar uchun", color: "bg-violet-100 text-violet-700", active: true },
  { id: "business", name: "Business", credits: 150, price: 129000, desc: "Ko'p buyurtmalar uchun", color: "bg-amber-100 text-amber-700", active: true },
];

function MonetizationSection() {
  const [tiers, setTiers] = useState<PricingTier[]>(() =>
    readKey<PricingTier[]>("hormang_pricing_tiers", DEFAULT_TIERS)
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editCredits, setEditCredits] = useState(0);

  const providerOffers = readKey<ProviderOffer[]>("hormang_provider_offers", []);
  const totalRevenue = providerOffers.filter((o) => o.status === "accepted").reduce((s, o) => s + o.price, 0);
  const commissionRevenue = Math.round(totalRevenue * 0.15);

  function startEdit(t: PricingTier) {
    setEditId(t.id);
    setEditPrice(t.price);
    setEditCredits(t.credits);
  }

  function saveEdit(id: string) {
    const updated = tiers.map((t) => t.id === id ? { ...t, price: editPrice, credits: editCredits } : t);
    setTiers(updated);
    writeKey("hormang_pricing_tiers", updated);
    logAction("UPDATE_PRICING", id, `Narx yangilandi: ${editPrice} so'm, ${editCredits} kredit`);
    setEditId(null);
  }

  function toggleTier(id: string) {
    const updated = tiers.map((t) => t.id === id ? { ...t, active: !t.active } : t);
    setTiers(updated);
    writeKey("hormang_pricing_tiers", updated);
    logAction("TOGGLE_PRICING_TIER", id, "Narx rejimi o'zgartirildi");
  }

  // Simulated revenue breakdown
  const revenueData = [
    { name: "Yanvar", daromad: 280000, komissiya: 42000 },
    { name: "Fevral", daromad: 420000, komissiya: 63000 },
    { name: "Mart", daromad: 615000 + totalRevenue, komissiya: 92250 + commissionRevenue },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Monetizatsiya</h2>
        <p className="text-sm text-gray-500">Narx rejalari va daromad boshqaruvi</p>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Umumiy tranzaksiyalar</p>
          <p className="text-xl font-extrabold text-gray-900">{fmtMoney(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Platforma komissiyasi (15%)</p>
          <p className="text-xl font-extrabold text-emerald-600">{fmtMoney(commissionRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Faol rejalari</p>
          <p className="text-xl font-extrabold text-gray-900">{tiers.filter((t) => t.active).length} ta</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Oylik daromad dinamikasi</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 11 }} formatter={(v: number) => fmtMoney(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="daromad" name="Tranzaksiyalar" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            <Bar dataKey="komissiya" name="Komissiya" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pricing tiers */}
      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-3">Narx rejalari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((t) => (
            <div key={t.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${t.active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.color}`}>{t.name}</span>
                <button onClick={() => toggleTier(t.id)} className={`text-xs font-semibold ${t.active ? "text-red-500 hover:text-red-700" : "text-emerald-600 hover:text-emerald-800"}`}>
                  {t.active ? "O'chirish" : "Yoqish"}
                </button>
              </div>
              {editId === t.id ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Narx (so'm)</label>
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 mt-0.5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400">Kreditlar</label>
                    <input type="number" value={editCredits} onChange={(e) => setEditCredits(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 mt-0.5" />
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => saveEdit(t.id)} className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600">Saqlash</button>
                    <button onClick={() => setEditId(null)} className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">Bekor</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{t.credits} <span className="text-sm font-semibold text-gray-400">kredit</span></p>
                  <p className="text-sm font-bold text-gray-600 mb-1">{t.price === 0 ? "Bepul" : fmtMoney(t.price)}</p>
                  <p className="text-xs text-gray-400 mb-3">{t.desc}</p>
                  <button onClick={() => startEdit(t)} className="w-full py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                    Tahrirlash
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AUDIT LOG SECTION
   ───────────────────────────────────────────────────────────────── */
function AuditLogSection() {
  const [log, setLog] = useState<AdminLogEntry[]>(() =>
    readKey<AdminLogEntry[]>(ADMIN_LOG_KEY, [])
  );
  const [search, setSearch] = useState("");

  function clearLog() {
    if (!confirm("Barcha audit loglarni o'chirishni tasdiqlaysizmi?")) return;
    writeKey(ADMIN_LOG_KEY, []);
    setLog([]);
  }

  function refresh() {
    setLog(readKey<AdminLogEntry[]>(ADMIN_LOG_KEY, []));
  }

  const filtered = log.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.action.toLowerCase().includes(q) || e.target.includes(q) || e.details.toLowerCase().includes(q);
  });

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: "bg-blue-50 text-blue-700",
    DELETE_REQUEST: "bg-red-50 text-red-700",
    UPDATE_REQUEST_STATUS: "bg-amber-50 text-amber-700",
    UPDATE_OFFER_STATUS: "bg-violet-50 text-violet-700",
    TOGGLE_USER_STATUS: "bg-orange-50 text-orange-700",
    UPDATE_PRICING: "bg-emerald-50 text-emerald-700",
    TOGGLE_PRICING_TIER: "bg-teal-50 text-teal-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500">{log.length} ta yozuv</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Yangilash
          </button>
          <button onClick={clearLog} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Tozalash
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Amallarni qidirish..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">Loglar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
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

/* ─────────────────────────────────────────────────────────────────
   CATEGORIES (link to existing admin)
   ───────────────────────────────────────────────────────────────── */
function CategoriesSection() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">Toifalar va Savollar</h2>
        <p className="text-sm text-gray-500">Questionnaire tizimini boshqarish</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-bold text-gray-800 mb-2">Toifalar boshqaruvi</h3>
        <p className="text-sm text-gray-500 mb-6">Har bir toifa uchun savol va variantlarni qo'shish, tahrirlash yoki o'chirish</p>
        <button
          onClick={() => {
            logAction("NAVIGATE", "admin/questions", "Toifalar sahifasiga o'tildi");
            setLocation("/admin/questions");
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          Toifalar boshqaruviga o'tish
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
   ───────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(getSession());
  const [section, setSection] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);

  function logout() {
    logAction("LOGOUT", "admin", "Admin tizimdan chiqdi");
    clearSession();
    setAuthed(false);
  }

  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;

  const requests = readKey<CustomerRequest[]>("hormang_requests", []);
  const unseenAlerts = requests.filter((r) => r.status === "open" && r.offerCount === 0).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0 h-screen sticky top-0">
        <Sidebar
          active={section}
          onChange={setSection}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onLogout={logout}
        />
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="font-extrabold text-gray-900 text-sm">{NAV_ITEMS.find((n) => n.id === section)?.label}</h1>
            <p className="text-xs text-gray-400">Hormang Admin · {ADMIN_USER}</p>
          </div>
          <div className="flex items-center gap-3">
            {unseenAlerts > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-100">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700">{unseenAlerts} ta taklif kutmoqda</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {section === "overview" && <OverviewSection />}
              {section === "requests" && <RequestsSection />}
              {section === "offers" && <OffersSection />}
              {section === "users" && <UsersSection />}
              {section === "monetization" && <MonetizationSection />}
              {section === "audit" && <AuditLogSection />}
              {section === "categories" && <CategoriesSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
