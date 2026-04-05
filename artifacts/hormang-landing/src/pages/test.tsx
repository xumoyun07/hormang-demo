/**
 * /test — Temporary system test dashboard.
 * Reads localStorage directly to report state across all stores.
 * Remove this page (and its route in App.tsx) when testing is done.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { getLocalProfile } from "@/lib/local-profile";
import {
  getRequests, getOffers, getChats,
} from "@/lib/requests-store";
import {
  getProviderChats,
} from "@/lib/provider-store";
import {
  ChevronLeft, Play, CheckCircle2, AlertTriangle, XCircle,
  User, Database, MessageSquare, FileText, RefreshCw, Zap,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────── */
interface TestResult {
  label: string;
  value: string | number;
  status: "ok" | "warn" | "error" | "info";
  detail?: string;
}

interface TestSection {
  title: string;
  icon: React.FC<{ className?: string }>;
  results: TestResult[];
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
function fmt(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("uz-Latn-UZ", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function relSec(iso: string | undefined): string {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s oldin`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m oldin`;
  return `${Math.floor(sec / 3600)}h oldin`;
}

function statusIcon(s: TestResult["status"]) {
  if (s === "ok")    return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  if (s === "warn")  return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  if (s === "error") return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  return <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />;
}

function statusBg(s: TestResult["status"]) {
  if (s === "ok")    return "bg-emerald-50 border-emerald-100";
  if (s === "warn")  return "bg-amber-50 border-amber-100";
  if (s === "error") return "bg-red-50 border-red-100";
  return "bg-blue-50 border-blue-100";
}

/* ─── Run the test ────────────────────────────────────────────────── */
function runTests(
  user: ReturnType<typeof useAuth>["user"],
  providerProfile: ReturnType<typeof useAuth>["providerProfile"],
  activeRole: ReturnType<typeof useAuth>["activeRole"],
): TestSection[] {
  const sections: TestSection[] = [];

  /* ── Section 1: User / Auth ── */
  const localProfile = user ? getLocalProfile(user.id) : null;
  sections.push({
    title: "Foydalanuvchi va profil",
    icon: User,
    results: [
      {
        label: "Tizimga kirish",
        value: user ? `${user.firstName} ${user.lastName}` : "Kirmagansiz",
        status: user ? "ok" : "error",
      },
      {
        label: "Faol rol",
        value: activeRole === "provider" ? "Ijrochi" : "Xaridor",
        status: "info",
      },
      {
        label: "Telefon",
        value: user?.phone ?? "Yo'q",
        status: user?.phone ? "ok" : "warn",
      },
      {
        label: "Profil roli (server)",
        value: user?.role ?? "—",
        status: "info",
      },
      {
        label: "Ijrochi profil",
        value: providerProfile ? `${providerProfile.categories?.join(", ") || "Kategoriya yo'q"}` : "Yo'q",
        status: providerProfile ? "ok" : "warn",
      },
      {
        label: "Xizmat hududlari",
        value: localProfile?.serviceAreas?.length
          ? localProfile.serviceAreas.join(", ")
          : "Tanlanmagan",
        status: localProfile?.serviceAreas?.length ? "ok" : "warn",
        detail: localProfile?.serviceAreas?.length
          ? `${localProfile.serviceAreas.length} ta hudud`
          : "Hech qanday so'rov ko'rinmaydi",
      },
    ],
  });

  /* ── Section 2: localStorage counts ── */
  const requests = getRequests();
  const offers   = getOffers();
  const chats    = getChats();

  const lsSize = (() => {
    let size = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("hormang")) size += (localStorage.getItem(key) ?? "").length;
    }
    return (size / 1024).toFixed(1);
  })();

  sections.push({
    title: "Mahalliy ma'lumotlar (localStorage)",
    icon: Database,
    results: [
      { label: "So'rovlar (requests)", value: requests.length, status: requests.length > 0 ? "ok" : "info" },
      { label: "Takliflar (offers)",   value: offers.length,   status: offers.length > 0   ? "ok" : "info" },
      { label: "Suhbatlar (chats)",    value: chats.length,    status: chats.length > 0    ? "ok" : "info" },
      {
        label: "Hormang localStorage hajmi",
        value: `${lsSize} KB`,
        status: parseFloat(lsSize) > 200 ? "warn" : "ok",
        detail: parseFloat(lsSize) > 200 ? "Juda katta — eski ma'lumotlarni tozalash kerak" : undefined,
      },
    ],
  });

  /* ── Section 3: Last 5 requests ── */
  const last5Req = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  sections.push({
    title: "Oxirgi 5 ta so'rov",
    icon: FileText,
    results: last5Req.length === 0
      ? [{ label: "So'rovlar yo'q", value: "—", status: "info" as const }]
      : last5Req.map((r) => ({
          label: `${r.categoryName} — ${r.region ?? "Hudud yo'q"}`,
          value: r.status,
          status: (r.status === "open" ? "ok" : r.status === "accepted" ? "info" : "warn") as TestResult["status"],
          detail: `${r.id.slice(0, 8)}… · yaratilgan: ${relSec(r.createdAt)}`,
        })),
  });

  /* ── Section 4: Last 5 offers ── */
  const last5Offers = [...offers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  sections.push({
    title: "Oxirgi 5 ta taklif",
    icon: FileText,
    results: last5Offers.length === 0
      ? [{ label: "Takliflar yo'q", value: "—", status: "info" as const }]
      : last5Offers.map((o) => ({
          label: `${o.masterName} → so'rov ${o.requestId.slice(0, 8)}…`,
          value: o.status === "pending" ? "Kutilmoqda" : o.status === "accepted" ? "Qabul" : "Rad etildi",
          status: (o.status === "pending" ? "info" : o.status === "accepted" ? "ok" : "warn") as TestResult["status"],
          detail: `${o.price.toLocaleString()} so'm · ${relSec(o.createdAt)}`,
        })),
  });

  /* ── Section 5: Real-time sync check ── */
  const providerChats = getProviderChats();
  const syncResults: TestResult[] = [];

  if (chats.length === 0) {
    syncResults.push({ label: "Suhbatlar yo'q", value: "—", status: "info" });
  } else {
    for (const unified of chats.slice(0, 5)) {
      const lastMsg = unified.messages[unified.messages.length - 1];
      const pChat = providerChats.find((p) => p.id === unified.id);

      if (!pChat) {
        syncResults.push({
          label: unified.id.slice(0, 20) + "…",
          value: "Ijrochi tomoni yo'q",
          status: "warn",
          detail: "Provider ko'rinishi topilmadi — ID noto'g'ri bo'lishi mumkin",
        });
        continue;
      }

      const pLastMsg = pChat.messages[pChat.messages.length - 1];
      const msgCountMatch = unified.messages.length === pChat.messages.length;
      const lastTsMatch = lastMsg?.timestamp === pLastMsg?.timestamp;

      syncResults.push({
        label: unified.id.slice(0, 20) + "…",
        value: msgCountMatch && lastTsMatch
          ? `✓ Sync (${unified.messages.length} xabar)`
          : `⚠ ${unified.messages.length} vs ${pChat.messages.length} xabar`,
        status: msgCountMatch && lastTsMatch ? "ok" : "error",
        detail: lastMsg
          ? `Oxirgi xabar: "${lastMsg.text.slice(0, 30)}…" · ${relSec(lastMsg.timestamp)}`
          : "Xabar yo'q",
      });
    }
  }

  sections.push({
    title: "Real-time sinxronizatsiya",
    icon: RefreshCw,
    results: syncResults,
  });

  /* ── Section 6: Inconsistency check ── */
  const inconsistencies: TestResult[] = [];
  const requestIds = new Set(requests.map((r) => r.id));

  // Offers without a request
  for (const o of offers) {
    if (!requestIds.has(o.requestId)) {
      inconsistencies.push({
        label: `Taklif: so'rov topilmadi`,
        value: o.requestId.slice(0, 16) + "…",
        status: "error",
        detail: `Offer ${o.id.slice(0, 8)} — requestId ${o.requestId.slice(0, 8)} mavjud emas`,
      });
    }
  }

  // Chats without a request
  for (const c of chats) {
    if (!requestIds.has(c.requestId)) {
      inconsistencies.push({
        label: `Suhbat: so'rov topilmadi`,
        value: c.requestId.slice(0, 16) + "…",
        status: "error",
        detail: `Chat ${c.id.slice(0, 8)} — requestId ${c.requestId.slice(0, 8)} mavjud emas`,
      });
    }
  }

  // Accepted offers without a chat
  for (const o of offers.filter((o) => o.status === "accepted")) {
    const chatId = `${o.requestId}_${o.masterId}`;
    const chatExists = chats.some((c) => c.id === chatId);
    if (!chatExists) {
      inconsistencies.push({
        label: "Qabul qilingan taklif: suhbat yo'q",
        value: chatId.slice(0, 24) + "…",
        status: "warn",
        detail: `Offer ${o.id.slice(0, 8)} accepted amma chat ${chatId.slice(0, 8)} topilmadi`,
      });
    }
  }

  // providerUnread mismatch between unified chats and provider view
  for (const unified of chats) {
    const pChat = providerChats.find((p) => p.id === unified.id);
    if (pChat && pChat.unread !== (unified.providerUnread ?? 0)) {
      inconsistencies.push({
        label: "O'qilmagan xabar soni mos emas",
        value: `${pChat.unread} vs ${unified.providerUnread ?? 0}`,
        status: "warn",
        detail: `Chat ${unified.id.slice(0, 12)} — provider: ${pChat.unread}, unified: ${unified.providerUnread ?? 0}`,
      });
    }
  }

  if (inconsistencies.length === 0) {
    inconsistencies.push({
      label: "Hech qanday nomuvofiqlik topilmadi",
      value: "✓ Tizim izchil",
      status: "ok",
    });
  }

  sections.push({
    title: "Tizim izchilligi (inconsistencies)",
    icon: AlertTriangle,
    results: inconsistencies,
  });

  /* ── Section 7: Message timestamps ── */
  const tsResults: TestResult[] = [];
  for (const c of chats.slice(0, 3)) {
    const last = c.messages[c.messages.length - 1];
    tsResults.push({
      label: `Chat ${c.id.slice(0, 16)}…`,
      value: last ? `"${last.text.slice(0, 20)}…"` : "(xabar yo'q)",
      status: "info",
      detail: last ? `${last.sender} · ${fmt(last.timestamp)} · ${relSec(last.timestamp)}` : "Suhbat bo'sh",
    });
  }
  if (tsResults.length === 0) {
    tsResults.push({ label: "Suhbatlar yo'q", value: "—", status: "info" });
  }

  sections.push({
    title: "Xabar vaqt belgilari",
    icon: MessageSquare,
    results: tsResults,
  });

  return sections;
}

/* ─── Result Row ──────────────────────────────────────────────────── */
function ResultRow({ r }: { r: TestResult }) {
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm ${statusBg(r.status)}`}>
      {statusIcon(r.status)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-semibold text-gray-800 text-xs">{r.label}</span>
          <span className="font-bold text-xs text-gray-600 bg-white/70 px-2 py-0.5 rounded-lg border border-gray-100 flex-shrink-0">
            {r.value}
          </span>
        </div>
        {r.detail && (
          <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{r.detail}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function TestPage() {
  const [, setLocation] = useLocation();
  const { user, providerProfile, activeRole } = useAuth();
  const [sections, setSections]   = useState<TestSection[]>([]);
  const [ran, setRan]             = useState(false);
  const [running, setRunning]     = useState(false);
  const [runAt, setRunAt]         = useState<string | null>(null);

  function handleRun() {
    setRunning(true);
    setTimeout(() => {
      const results = runTests(user, providerProfile, activeRole);
      setSections(results);
      setRan(true);
      setRunning(false);
      setRunAt(new Date().toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      console.log("[Hormang 🧪] Full system test run at", new Date().toISOString());
      console.log("[Hormang 🧪] Sections:", results.map((s) => ({
        title: s.title,
        results: s.results,
      })));
    }, 300);
  }

  const totalErrors = sections.reduce((s, sec) =>
    s + sec.results.filter((r) => r.status === "error").length, 0);
  const totalWarns = sections.reduce((s, sec) =>
    s + sec.results.filter((r) => r.status === "warn").length, 0);
  const totalOk = sections.reduce((s, sec) =>
    s + sec.results.filter((r) => r.status === "ok").length, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/dashboard")}
          className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-sm flex items-center gap-2">
            <span className="text-lg">🧪</span> Tizim test paneli
          </h1>
          {runAt && (
            <p className="text-[10px] text-gray-500 font-mono">So'nggi test: {runAt}</p>
          )}
        </div>
        {ran && (
          <div className="flex items-center gap-2 text-[10px] font-bold">
            {totalErrors > 0 && (
              <span className="bg-red-900/60 text-red-300 border border-red-700 px-2 py-1 rounded-lg">
                {totalErrors} xato
              </span>
            )}
            {totalWarns > 0 && (
              <span className="bg-amber-900/60 text-amber-300 border border-amber-700 px-2 py-1 rounded-lg">
                {totalWarns} ogohlantirish
              </span>
            )}
            {totalErrors === 0 && totalWarns === 0 && (
              <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-2 py-1 rounded-lg">
                Hammasi yaxshi
              </span>
            )}
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* Big run button */}
        <button
          onClick={handleRun}
          disabled={running}
          className="w-full h-14 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 transition-all active:scale-[.98] disabled:opacity-60 shadow-lg"
          style={{
            background: running
              ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
              : "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(199,89%,56%) 100%)",
          }}
        >
          {running ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Tekshirilmoqda…
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Tizimni to'liq tekshirish
            </>
          )}
        </button>

        {/* Info banner */}
        {!ran && !running && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              Ushbu sahifa tizimning holati, localStorage ma'lumotlari, real-time sinxronizatsiya
              va nomuvofiqliklarni tekshiradi. Boshlash uchun yuqoridagi tugmani bosing.
            </p>
          </div>
        )}

        {/* Test sections */}
        {sections.map((sec) => (
          <div key={sec.title} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-800 bg-gray-800/50">
              <sec.icon className="w-4 h-4 text-violet-400" />
              <h2 className="font-bold text-sm text-gray-200">{sec.title}</h2>
              <span className="ml-auto text-[10px] font-bold text-gray-500">
                {sec.results.length} ta natija
              </span>
            </div>
            <div className="p-3 space-y-2">
              {sec.results.map((r, i) => (
                <ResultRow key={i} r={r} />
              ))}
            </div>
          </div>
        ))}

        {/* Re-run button */}
        {ran && (
          <button
            onClick={handleRun}
            disabled={running}
            className="w-full h-10 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
            Qayta tekshirish
          </button>
        )}

        {/* Note */}
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3">
          <p className="text-[10px] text-amber-400 font-mono leading-relaxed">
            ⚠️ Bu sahifa vaqtincha! Faqat test maqsadida yaratilgan.
            Ishlab bo'lgach, /test marshruti App.tsx dan o'chiriladi.
          </p>
        </div>
      </div>
    </div>
  );
}
