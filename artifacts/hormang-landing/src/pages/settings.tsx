import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell, ShieldCheck, Info, LogOut, Globe, ChevronLeft,
  ChevronRight, MessageCircle, Tag, Coins, Package,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";

const VIOLET = "hsl(262,80%,54%)";
const VIOLET_GRAD = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

/* ─── Toggle Switch ─────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
      style={{ background: checked ? VIOLET : "#D1D5DB" }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ─── Section wrapper ───────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400 px-1 mb-2">
        {title}
      </h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {children}
      </div>
    </section>
  );
}

/* ─── Plain row (icon + text + optional right) ──────────────────── */
function Row({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  desc,
  right,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  title: string;
  desc?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors ${onClick ? "hover:bg-gray-50 active:bg-gray-100" : ""}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg ?? "hsl(262,80%,96%)" }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor ?? VIOLET }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900">{title}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {right ?? (onClick ? <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" /> : null)}
    </Tag>
  );
}

/* ─── Toggle row ────────────────────────────────────────────────── */
function ToggleRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row
      icon={Icon}
      iconBg={iconBg}
      iconColor={iconColor}
      title={title}
      desc={desc}
      right={<Toggle checked={checked} onChange={onChange} />}
    />
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { activeRole, logout } = useAuth();
  const [, setLocation] = useLocation();

  const isProvider = activeRole === "provider";

  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers]   = useState(true);

  const [showAbout, setShowAbout] = useState(false);

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-base text-gray-900 leading-tight">Sozlamalar</h1>
            <p className="text-[11px] text-gray-400">
              {isProvider ? "Ijrochi" : "Xaridor"} paneli
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-lg mx-auto px-4 py-5 space-y-5"
      >

        {/* ── Notifications ── */}
        <Section title="Bildirishnomalar">
          <ToggleRow
            icon={MessageCircle}
            title="Yangi xabarlar"
            desc="Kimdir xabar yuborganda xabar oling"
            checked={notifMessages}
            onChange={setNotifMessages}
          />
          <ToggleRow
            icon={Tag}
            title={isProvider ? "Yangi so'rovlar" : "Yangi takliflar"}
            desc={isProvider ? "Yangi buyurtma so'rovi kelganda" : "Ijrochidan taklif kelganda"}
            checked={notifOffers}
            onChange={setNotifOffers}
          />
        </Section>

        {/* ── Language ── */}
        <Section title="Til">
          <Row
            icon={Globe}
            iconBg="hsl(221,78%,96%)"
            iconColor="hsl(221,78%,48%)"
            title="Interfeys tili"
            right={
              <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-violet-300 transition-all cursor-pointer">
                <option value="uz">O'zbekcha</option>
                <option value="ru">Русский</option>
              </select>
            }
          />
        </Section>

        {/* ── Provider-only: Token history ── */}
        {isProvider && (
          <Section title="Ijrochi">
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(262,80%,96%)" }}>
                <Coins className="w-5 h-5" style={{ color: VIOLET }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">Tokenlar tarixi</p>
                <p className="text-xs text-gray-500 mt-0.5">Token sarflanishi haqida ma'lumot</p>
              </div>
            </div>
            {/* Empty state */}
            <div className="px-4 pb-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-0.5">Hozircha tarix yo'q</p>
              <p className="text-xs text-gray-400">Token sarflash tarixi bu yerda ko'rinadi</p>
            </div>
          </Section>
        )}

        {/* ── Account ── */}
        <Section title="Hisob">
          <Row
            icon={ShieldCheck}
            iconBg="hsl(160,60%,95%)"
            iconColor="hsl(160,60%,40%)"
            title="Maxfiylik va xavfsizlik"
            desc="Hisob va xavfsizlik sozlamalari"
            onClick={() => {}}
          />
          <Row
            icon={Info}
            iconBg="hsl(221,78%,96%)"
            iconColor="hsl(221,78%,48%)"
            title="Hormang haqida"
            desc="Ilova versiyasi va ma'lumot"
            onClick={() => setShowAbout(true)}
          />
        </Section>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 border border-red-100 rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 font-bold text-sm hover:bg-red-100 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </button>

        <p className="text-center text-[11px] text-gray-300 pb-2">Hormang v1.0.0</p>
      </motion.main>

      {/* ── About sheet ── */}
      {showAbout && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setShowAbout(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl px-6 pb-10 pt-5"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md"
                style={{ background: VIOLET_GRAD }}
              >
                H
              </div>
            </div>
            <h3 className="text-center font-extrabold text-lg text-gray-900 mb-1">Hormang</h3>
            <p className="text-center text-xs text-gray-400 mb-5">Versiya 1.0.0</p>
            <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
              Hormang — O'zbekistonda mahalliy xizmatlar bozoridagi platforma.
              Xaridorlarni tekshirilgan ijrochilar bilan ulaydi.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full h-12 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98]"
              style={{ background: VIOLET_GRAD }}
            >
              Yopish
            </button>
          </motion.div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
