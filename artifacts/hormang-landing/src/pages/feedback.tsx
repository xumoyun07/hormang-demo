import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import {
  saveFeedback, getFeedbacksByUser,
  type FeedbackType, type FeedbackStatus, type Feedback,
} from "@/lib/feedback-store";
import { getRequestsByCustomer } from "@/lib/requests-store";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Check, Upload, X, CheckCircle2, Loader2,
  Paperclip, MessagesSquare, Plus, ChevronRight,
} from "lucide-react";

/* ── constants ──────────────────────────────────────────────────── */

const TYPE_META: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  problem:    { emoji: "🆘", label: "Muammo",   color: "text-red-600",   bg: "bg-red-50",   border: "border-red-200"   },
  complaint:  { emoji: "⚠️", label: "Shikoyat", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  suggestion: { emoji: "💡", label: "Taklif",   color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-200"  },
};

const STATUS_META: Record<FeedbackStatus, { label: string; color: string; bg: string }> = {
  new:       { label: "Yangi",       color: "text-gray-500",  bg: "bg-gray-100" },
  in_review: { label: "Ko'rilmoqda", color: "text-blue-600",  bg: "bg-blue-50"  },
  resolved:  { label: "Hal qilindi", color: "text-green-600", bg: "bg-green-50" },
  rejected:  { label: "Rad etildi",  color: "text-red-600",   bg: "bg-red-50"   },
};

const TYPE_OPTIONS: { id: FeedbackType; emoji: string; label: string; sub: string }[] = [
  { id: "problem",    emoji: "🆘", label: "Muammo",   sub: "Texnik nosozlik yoki xato"         },
  { id: "complaint",  emoji: "⚠️", label: "Shikoyat", sub: "Foydalanuvchi yoki platforma haqida" },
  { id: "suggestion", emoji: "💡", label: "Taklif",   sub: "Yaxshilanish uchun fikr"           },
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
  { id: "ux",       label: "Interfeys (UX)",      emoji: "🎨" },
  { id: "features", label: "Yangi imkoniyatlar",   emoji: "✨" },
  { id: "payments", label: "To'lovlar",            emoji: "💳" },
] as const;

const STEPS = ["Tur", "Tafsilot", "Mazmun", "Rasm"];
const BLUE_GRAD = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

/* ── StepBar ────────────────────────────────────────────────────── */

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step  ? "bg-blue-600 text-white"
              : i === step ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── FeedbackFormDrawer ─────────────────────────────────────────── */

function FeedbackFormDrawer({
  open,
  userId,
  activeRole,
  myRequests,
  onClose,
  onSuccess,
}: {
  open: boolean;
  userId: string;
  activeRole: string;
  myRequests: { id: string; categoryName: string; createdAt: number }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]               = useState(0);
  const [type, setType]               = useState<FeedbackType | null>(null);
  const [targetType, setTargetType]   = useState<"provider"|"customer"|"platform"|"">("");
  const [problemArea, setProblemArea] = useState("");
  const [suggestionCat, setSuggestionCat] = useState("");
  const [relatedReqId, setRelatedReqId]   = useState("");
  const [title, setTitle]             = useState("");
  const [desc, setDesc]               = useState("");
  const [files, setFiles]             = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);

  function resetForm() {
    setStep(0); setType(null); setTargetType(""); setProblemArea("");
    setSuggestionCat(""); setRelatedReqId(""); setTitle(""); setDesc(""); setFiles([]);
  }

  function handleClose() { resetForm(); onClose(); }

  function canNext() {
    if (step === 0) return !!type;
    if (step === 1) {
      if (type === "complaint") return !!targetType;
      if (type === "problem")   return !!problemArea;
      return true;
    }
    if (step === 2) return title.trim().length >= 3 && desc.trim().length >= 10;
    return true;
  }

  function addFiles(raw: FileList | null) {
    if (!raw) return;
    Array.from(raw).slice(0, 5 - files.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const r = e.target?.result as string;
        setFiles(prev => prev.length < 5 ? [...prev, r] : prev);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      saveFeedback({
        userId,
        userRole: activeRole === "provider" ? "provider" : "customer",
        type: type!,
        title: title.trim(),
        description: desc.trim(),
        targetType:         type === "complaint"  ? (targetType as "provider"|"customer"|"platform") : undefined,
        problemArea:        type === "problem"    ? (problemArea as "chat"|"request"|"payment"|"other") : undefined,
        suggestionCategory: type === "suggestion" ? (suggestionCat as "ux"|"features"|"payments") : undefined,
        relatedRequestId: relatedReqId || undefined,
        attachments: files,
      });
      toast({ title: "Murojaatingiz yuborildi ✅", description: "Tez orada ko'rib chiqiladi." });
      resetForm();
      onSuccess();
    } catch {
      toast({ title: "Xatolik yuz berdi", description: "Iltimos qayta urinib ko'ring", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTypeMeta = type ? TYPE_META[type] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end"
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="w-full bg-white rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 pt-1 border-b border-gray-100 flex-shrink-0">
              <button
                onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <h2 className="font-extrabold text-gray-900 text-base leading-tight">Yangi murojaat</h2>
                <p className="text-xs text-gray-400">{STEPS[step]} — {step + 1}/{STEPS.length}</p>
              </div>
              {selectedTypeMeta && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${selectedTypeMeta.bg} ${selectedTypeMeta.color}`}>
                  {selectedTypeMeta.emoji} {selectedTypeMeta.label}
                </span>
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <StepBar step={step} />

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
              <AnimatePresence mode="wait">
                {/* Step 0: Type */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-3">
                    <p className="text-sm font-bold text-gray-700 px-1">Nima haqida murojaat qilmoqchisiz?</p>
                    {TYPE_OPTIONS.map(opt => {
                      const m = TYPE_META[opt.id];
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setType(opt.id)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                            type === opt.id ? `${m.bg} ${m.border}` : "bg-white border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <span className="text-3xl">{opt.emoji}</span>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${type === opt.id ? m.color : "text-gray-900"}`}>{opt.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                          </div>
                          {type === opt.id && (
                            <div className={`w-6 h-6 rounded-full ${m.bg} ${m.border} border-2 flex items-center justify-center`}>
                              <Check className={`w-3.5 h-3.5 ${m.color}`} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {/* Step 1: Dynamic fields */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                    {type === "complaint" && (
                      <>
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-2.5 px-1">Shikoyat kim haqida?</p>
                          <div className="grid grid-cols-3 gap-2">
                            {COMPLAINT_TARGETS.map(t => (
                              <button key={t.id} onClick={() => setTargetType(t.id)}
                                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${targetType === t.id ? "bg-amber-50 border-amber-300" : "bg-white border-gray-100 hover:border-gray-200"}`}
                              >
                                <span className="text-2xl">{t.emoji}</span>
                                <span className={`text-[11px] font-bold ${targetType === t.id ? "text-amber-700" : "text-gray-600"}`}>{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {myRequests.length > 0 && (
                          <div>
                            <p className="text-sm font-bold text-gray-700 mb-2 px-1">Bog'liq so'rov <span className="font-normal text-gray-400">(ixtiyoriy)</span></p>
                            <select value={relatedReqId} onChange={e => setRelatedReqId(e.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-700 focus:border-blue-300 outline-none"
                            >
                              <option value="">— Tanlang —</option>
                              {myRequests.map(r => (
                                <option key={r.id} value={r.id}>{r.categoryName} — {new Date(r.createdAt).toLocaleDateString("uz-UZ")}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    {type === "problem" && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-2.5 px-1">Qayerda muammoga duch keldinggiz?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {PROBLEM_AREAS.map(a => (
                            <button key={a.id} onClick={() => setProblemArea(a.id)}
                              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${problemArea === a.id ? "bg-red-50 border-red-200" : "bg-white border-gray-100 hover:border-gray-200"}`}
                            >
                              <span className="text-xl">{a.emoji}</span>
                              <span className={`text-sm font-bold ${problemArea === a.id ? "text-red-700" : "text-gray-700"}`}>{a.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {type === "suggestion" && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-2.5 px-1">Soha <span className="font-normal text-gray-400">(ixtiyoriy)</span></p>
                        <div className="space-y-2">
                          {SUGGESTION_CATS.map(c => (
                            <button key={c.id} onClick={() => setSuggestionCat(prev => prev === c.id ? "" : c.id)}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${suggestionCat === c.id ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 hover:border-gray-200"}`}
                            >
                              <span className="text-2xl">{c.emoji}</span>
                              <span className={`text-sm font-bold flex-1 text-left ${suggestionCat === c.id ? "text-blue-700" : "text-gray-700"}`}>{c.label}</span>
                              {suggestionCat === c.id && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Title + Desc */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Sarlavha <span className="text-red-500">*</span></label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="Qisqacha ifodalang..."
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 outline-none transition-colors"
                      />
                      <p className="text-[11px] text-gray-400 mt-1 px-1">{title.length}/100</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Batafsil <span className="text-red-500">*</span></label>
                      <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={1000} rows={6}
                        placeholder="Muammoni, shikoyatni yoki taklifni batafsil yozing..."
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 outline-none resize-none transition-colors"
                      />
                      <p className="text-[11px] text-gray-400 mt-1 px-1">{desc.length}/1000</p>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Attachments + Summary */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1 px-1">Fayllar <span className="font-normal text-gray-400">(ixtiyoriy, max 5)</span></p>
                      <p className="text-[11px] text-gray-400 mb-3 px-1">Rasm, video yoki boshqa fayl qo'shishingiz mumkin</p>
                      {files.length < 5 && (
                        <button onClick={() => fileRef.current?.click()}
                          className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-all active:scale-[0.98]"
                        >
                          <Upload className="w-7 h-7" />
                          <span className="text-sm font-semibold">Fayl yuklash</span>
                          <span className="text-[11px]">Rasm, video, hujjat</span>
                        </button>
                      )}
                      <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={e => addFiles(e.target.files)} />
                      {files.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {files.map((f, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                              {f.startsWith("data:image") ? (
                                <img src={f} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                  <Paperclip className="w-5 h-5 text-gray-400" />
                                  <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">Fayl {i + 1}</span>
                                </div>
                              )}
                              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
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
                      {type && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">{TYPE_META[type].emoji}</span>
                          <span className="text-xs font-semibold text-blue-800">{TYPE_META[type].label}</span>
                        </div>
                      )}
                      <p className="text-xs text-blue-700 font-semibold truncate">{title}</p>
                      <p className="text-[11px] text-blue-600 line-clamp-2">{desc}</p>
                      {files.length > 0 && <p className="text-[11px] text-blue-500">{files.length} ta fayl biriktirildi</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fixed CTA inside drawer */}
            <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white flex-shrink-0">
              <button
                disabled={!canNext() || submitting}
                onClick={() => { if (step < 3) setStep(s => s + 1); else handleSubmit(); }}
                className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: BLUE_GRAD, boxShadow: "0 6px 20px rgba(37,99,235,0.3)" }}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>
                ) : step < 3 ? (
                  <>Davom etish <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Yuborish</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── FeedbackDetailDrawer ───────────────────────────────────────── */

function FeedbackDetailDrawer({ fb, onClose }: { fb: Feedback | null; onClose: () => void }) {
  const tm = fb ? (TYPE_META[fb.type] ?? { emoji: "📋", label: fb.type, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" }) : null;
  const sm = fb ? STATUS_META[fb.status] : null;

  return (
    <AnimatePresence>
      {fb && tm && sm && (
        <motion.div
          key="detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="w-full bg-white rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-4 pt-1 border-b border-gray-100 flex-shrink-0">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${tm.bg}`}>
                {tm.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-400">{tm.label}</p>
                <h2 className="font-extrabold text-gray-900 text-base leading-tight truncate">{fb.title}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-all flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Status + date row */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${sm.bg} ${sm.color}`}>{sm.label}</span>
                <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString("uz-UZ")}</span>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">Izoh</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{fb.description}</p>
              </div>

              {/* Extra meta */}
              {(fb.targetType || fb.problemArea || fb.suggestionCategory) && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                  <p className="text-xs font-bold text-gray-500 mb-2">Tafsilot</p>
                  {fb.targetType && (
                    <p className="text-xs text-gray-700"><span className="font-semibold">Shikoyat:</span> {COMPLAINT_TARGETS.find(t => t.id === fb.targetType)?.label ?? fb.targetType}</p>
                  )}
                  {fb.problemArea && (
                    <p className="text-xs text-gray-700"><span className="font-semibold">Soha:</span> {PROBLEM_AREAS.find(a => a.id === fb.problemArea)?.label ?? fb.problemArea}</p>
                  )}
                  {fb.suggestionCategory && (
                    <p className="text-xs text-gray-700"><span className="font-semibold">Kategoriya:</span> {SUGGESTION_CATS.find(c => c.id === fb.suggestionCategory)?.label ?? fb.suggestionCategory}</p>
                  )}
                </div>
              )}

              {/* Attachments */}
              {fb.attachments && fb.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Fayllar ({fb.attachments.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {fb.attachments.map((f, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        {f.startsWith("data:image") ? (
                          <img src={f} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <Paperclip className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">Fayl {i + 1}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin note */}
              {fb.adminNote && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-700 mb-1.5">Admin izohi</p>
                  <p className="text-sm text-amber-800 leading-relaxed">{fb.adminNote}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */

export default function FeedbackPage() {
  const { user, activeRole } = useAuth();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]  = useState<Feedback | null>(null);
  const [history, setHistory]    = useState<Feedback[]>(() => user?.id ? getFeedbacksByUser(user.id) : []);

  const myRequests = user?.id ? getRequestsByCustomer(user.id) : [];

  const refreshHistory = useCallback(() => {
    if (user?.id) setHistory(getFeedbacksByUser(user.id));
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-gray-900 text-base leading-tight">Takliflar va shikoyatlar</h1>
            <p className="text-xs text-gray-400">Murojaatlaringiz va ularning holati</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold active:scale-95 transition-all shadow-md"
            style={{ background: BLUE_GRAD }}
          >
            <Plus className="w-3.5 h-3.5" />
            Yangi
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        {history.length === 0 ? (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
              <MessagesSquare className="w-10 h-10 text-blue-300" />
            </div>
            <h2 className="text-base font-extrabold text-gray-800 mb-1.5">Hali murojaatlar yo'q</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-[220px]">
              Muammo, shikoyat yoki taklif yuborish uchun bosing
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold active:scale-95 transition-all shadow-lg"
              style={{ background: BLUE_GRAD, boxShadow: "0 6px 20px rgba(37,99,235,0.25)" }}
            >
              <Plus className="w-4 h-4" />
              Birinchi murojaatni yuboring
            </button>
          </motion.div>
        ) : (
          /* ── History list ── */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-bold text-gray-700">Mening murojaatlarim</h2>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {history.map((fb, i) => {
                const tm = TYPE_META[fb.type] ?? { emoji: "📋", label: fb.type, color: "text-gray-600", bg: "bg-gray-50" };
                const sm = STATUS_META[fb.status];
                return (
                  <motion.button
                    key={fb.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(fb)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors ${
                      i < history.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${tm.bg}`}>
                      {tm.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{fb.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {tm.label} · {new Date(fb.createdAt).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sm.bg} ${sm.color}`}>
                        {sm.label}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drawers */}
      <FeedbackFormDrawer
        open={showForm}
        userId={user?.id ?? ""}
        activeRole={activeRole ?? "customer"}
        myRequests={myRequests}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); refreshHistory(); }}
      />

      <FeedbackDetailDrawer
        fb={selected}
        onClose={() => setSelected(null)}
      />

      <BottomNav />
    </div>
  );
}
