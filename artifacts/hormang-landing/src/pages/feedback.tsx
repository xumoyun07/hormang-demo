import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import {
  saveFeedback,
  type FeedbackType,
} from "@/lib/feedback-store";
import { getRequestsByCustomer } from "@/lib/requests-store";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, AlertCircle, TriangleAlert, Lightbulb,
  Check, Upload, X, CheckCircle2, Loader2, Paperclip,
} from "lucide-react";

const TYPE_OPTIONS: {
  id: FeedbackType;
  emoji: string;
  label: string;
  sub: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "problem",
    emoji: "🆘",
    label: "Muammo",
    sub: "Texnik nosozlik yoki xato",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  {
    id: "complaint",
    emoji: "⚠️",
    label: "Shikoyat",
    sub: "Foydalanuvchi yoki platforma haqida",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    id: "suggestion",
    emoji: "💡",
    label: "Taklif",
    sub: "Yaxshilanish uchun fikr",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
];

const PROBLEM_AREAS = [
  { id: "chat",    label: "Suhbat",  emoji: "💬" },
  { id: "request", label: "So'rov",  emoji: "📋" },
  { id: "payment", label: "To'lov",  emoji: "💳" },
  { id: "other",   label: "Boshqa",  emoji: "❓" },
] as const;

const COMPLAINT_TARGETS = [
  { id: "provider", label: "Ijrochi",  emoji: "🔧" },
  { id: "customer", label: "Mijoz",    emoji: "👤" },
  { id: "platform", label: "Platforma", emoji: "🏠" },
] as const;

const SUGGESTION_CATS = [
  { id: "ux",       label: "Interfeys (UX)",  emoji: "🎨" },
  { id: "features", label: "Yangi imkoniyatlar", emoji: "✨" },
  { id: "payments", label: "To'lovlar",        emoji: "💳" },
] as const;

const STEPS = ["Tur", "Tafsilot", "Mazmun", "Rasm"];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step
                ? "bg-blue-600 text-white"
                : i === step
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 rounded-full transition-all ${
                i < step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { user, activeRole } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep]           = useState(0);
  const [type, setType]           = useState<FeedbackType | null>(null);
  const [targetType, setTargetType] = useState<"provider" | "customer" | "platform" | "">("");
  const [problemArea, setProblemArea] = useState<string>("");
  const [suggestionCat, setSuggestionCat] = useState<string>("");
  const [relatedReqId, setRelatedReqId] = useState<string>("");
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [files, setFiles]         = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const myRequests = user?.id ? getRequestsByCustomer(user.id) : [];

  function canAdvanceStep0() { return !!type; }
  function canAdvanceStep1() {
    if (type === "complaint") return !!targetType;
    if (type === "problem")   return !!problemArea;
    return true;
  }
  function canAdvanceStep2() { return title.trim().length >= 3 && desc.trim().length >= 10; }

  function addFiles(raw: FileList | null) {
    if (!raw) return;
    const remaining = 5 - files.length;
    Array.from(raw)
      .slice(0, remaining)
      .forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFiles(prev => prev.length < 5 ? [...prev, result] : prev);
        };
        reader.readAsDataURL(file);
      });
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      saveFeedback({
        userId:   user.id,
        userRole: activeRole === "provider" ? "provider" : "customer",
        type:     type!,
        title:    title.trim(),
        description: desc.trim(),
        targetType: type === "complaint" ? (targetType as "provider" | "customer" | "platform") : undefined,
        problemArea: type === "problem" ? problemArea as "chat" | "request" | "payment" | "other" : undefined,
        suggestionCategory: type === "suggestion" ? suggestionCat as "ux" | "features" | "payments" : undefined,
        relatedRequestId: relatedReqId || undefined,
        attachments: files,
      });
      setDone(true);
    } catch {
      toast({ title: "Xatolik yuz berdi", description: "Iltimos qayta urinib ko'ring", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 shadow-lg shadow-green-100"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl font-extrabold text-gray-900 mb-2"
          >
            Murojaatingiz qabul qilindi!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-sm text-gray-500 mb-8 max-w-xs"
          >
            Tez orada ko'rib chiqiladi. Holat o'zgarganda sizga xabar beramiz.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setLocation("/dashboard")}
            className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 active:scale-[0.97] transition-all"
          >
            Profilga qaytish
          </motion.button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const selectedType = TYPE_OPTIONS.find(t => t.id === type);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => (step === 0 ? setLocation("/dashboard") : setStep(s => s - 1))}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-gray-900 text-base leading-tight">
              Takliflar va shikoyatlar
            </h1>
            <p className="text-xs text-gray-400">
              {STEPS[step]} — {step + 1}/{STEPS.length}
            </p>
          </div>
          {selectedType && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${selectedType.bg} ${selectedType.color}`}>
              {selectedType.emoji} {selectedType.label}
            </span>
          )}
        </div>
        <StepBar step={step} />
      </div>

      <div className="flex-1 p-4 space-y-3">
        <AnimatePresence mode="wait">
          {/* ── STEP 0: Type selection ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-sm font-bold text-gray-700 px-1">Nima yubormoqchisiz?</p>
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    type === opt.id
                      ? `${opt.bg} ${opt.border}`
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${type === opt.id ? opt.color : "text-gray-900"}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                  </div>
                  {type === opt.id && (
                    <div className={`w-6 h-6 rounded-full ${opt.bg} ${opt.border} border-2 flex items-center justify-center`}>
                      <Check className={`w-3.5 h-3.5 ${opt.color}`} />
                    </div>
                  )}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── STEP 1: Dynamic fields ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {type === "complaint" && (
                <>
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2.5 px-1">Kim haqida shikoyat?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {COMPLAINT_TARGETS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTargetType(t.id)}
                          className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${
                            targetType === t.id
                              ? "bg-amber-50 border-amber-300"
                              : "bg-white border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <span className="text-2xl">{t.emoji}</span>
                          <span className={`text-[11px] font-bold ${targetType === t.id ? "text-amber-700" : "text-gray-600"}`}>
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {myRequests.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-2 px-1">
                        Bog'liq so'rov <span className="font-normal text-gray-400">(ixtiyoriy)</span>
                      </p>
                      <select
                        value={relatedReqId}
                        onChange={e => setRelatedReqId(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-700 focus:border-blue-300 outline-none"
                      >
                        <option value="">— Tanlang —</option>
                        {myRequests.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.categoryName} — {new Date(r.createdAt).toLocaleDateString("uz-UZ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {type === "problem" && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2.5 px-1">Qayerda muammo?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROBLEM_AREAS.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setProblemArea(a.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          problemArea === a.id
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <span className="text-xl">{a.emoji}</span>
                        <span className={`text-sm font-bold ${problemArea === a.id ? "text-red-700" : "text-gray-700"}`}>
                          {a.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {type === "suggestion" && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2.5 px-1">
                    Soha <span className="font-normal text-gray-400">(ixtiyoriy)</span>
                  </p>
                  <div className="space-y-2">
                    {SUGGESTION_CATS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSuggestionCat(prev => prev === c.id ? "" : c.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          suggestionCat === c.id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <span className="text-2xl">{c.emoji}</span>
                        <span className={`text-sm font-bold flex-1 text-left ${suggestionCat === c.id ? "text-blue-700" : "text-gray-700"}`}>
                          {c.label}
                        </span>
                        {suggestionCat === c.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Title + Description ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                  Sarlavha <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Qisqacha ifodalang..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 outline-none transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1 px-1">{title.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                  Batafsil <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  maxLength={1000}
                  rows={6}
                  placeholder="Muammoni, shikoyatni yoki taklifni batafsil yozing..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 outline-none resize-none transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1 px-1">{desc.length}/1000</p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Attachments ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <p className="text-sm font-bold text-gray-700 mb-1 px-1">
                  Fayllar <span className="font-normal text-gray-400">(ixtiyoriy, max 5 ta)</span>
                </p>
                <p className="text-[11px] text-gray-400 mb-3 px-1">
                  Rasm, video yoki boshqa fayl qo'shishingiz mumkin
                </p>

                {/* Upload zone */}
                {files.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-all active:scale-[0.98]"
                  >
                    <Upload className="w-7 h-7" />
                    <span className="text-sm font-semibold">Fayl yuklash</span>
                    <span className="text-[11px]">Rasm, video, hujjat</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                />

                {/* Preview grid */}
                {files.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {files.map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        {f.startsWith("data:image") ? (
                          <img src={f} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <Paperclip className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
                              Fayl {i + 1}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-blue-700 mb-2">Xulosa</p>
                <div className="flex items-center gap-2">
                  <span className="text-base">{TYPE_OPTIONS.find(t => t.id === type)?.emoji}</span>
                  <span className="text-xs font-semibold text-blue-800">{TYPE_OPTIONS.find(t => t.id === type)?.label}</span>
                </div>
                <p className="text-xs text-blue-700 font-semibold truncate">{title}</p>
                <p className="text-[11px] text-blue-600 line-clamp-2">{desc}</p>
                {files.length > 0 && (
                  <p className="text-[11px] text-blue-500">{files.length} ta fayl biriktirildi</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2">
        <button
          disabled={
            (step === 0 && !canAdvanceStep0()) ||
            (step === 1 && !canAdvanceStep1()) ||
            (step === 2 && !canAdvanceStep2()) ||
            submitting
          }
          onClick={() => {
            if (step < 3) setStep(s => s + 1);
            else handleSubmit();
          }}
          className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)",
            boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
          }}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>
          ) : step < 3 ? (
            <>Davom etish</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Yuborish</>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
