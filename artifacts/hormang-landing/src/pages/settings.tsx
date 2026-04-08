import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bell, ShieldCheck, Info, LogOut, Globe, MessageSquareMore, SquareCheckBig, Coins } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400 px-1">
        {title}
      </h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  desc,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 last:border-b-0">
      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      {right}
    </div>
  );
}

export default function SettingsPage() {
  const { activeRole, logout } = useAuth();
  const [, setLocation] = useLocation();

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-lg font-black text-gray-900">Sozlamalar</h1>
          <p className="text-xs text-gray-400">
            {activeRole === "provider" ? "Ijrochi" : "Xaridor"} uchun asosiy sozlamalar
          </p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <Section title="Umumiy">
          <Row
            icon={Bell}
            title="Bildirishnomalar"
            desc="Yangi xabarlar va takliflar/so'rovlar"
            right={
              <div className="flex flex-col gap-2 items-end">
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" defaultChecked className="accent-violet-600" />
                  Xabarlar
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" defaultChecked className="accent-violet-600" />
                  Takliflar/so'rovlar
                </label>
              </div>
            }
          />
          <Row
            icon={Globe}
            title="Til"
            desc="Interfeys tili"
            right={
              <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 outline-none">
                <option>O'zbekcha</option>
                <option>Русский</option>
              </select>
            }
          />
          <Row icon={ShieldCheck} title="Maxfiylik va xavfsizlik" desc="Hisob va xavfsizlik sozlamalari" />
          <Row icon={Info} title="Hormang haqida" desc="Ilova haqida qisqacha ma'lumot" />
        </Section>

        {activeRole === "provider" && (
          <Section title="Ijrochi">
            <Row
              icon={Coins}
              title="Tokenlar tarixi"
              desc="Hozircha ma'lumot yo'q"
              right={<span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-400">Bo'sh</span>}
            />
          </Section>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 border border-red-100 rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 font-black text-sm shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </button>
      </main>
    </div>
  );
}