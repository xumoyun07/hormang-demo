import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import {
  ChevronLeft, ChevronRight, Check, CheckCircle2,
  FileText, Clock, Upload, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategories, getAllQuestionsForCategory, getCategoryById, collectActiveQuestions,
  type Question, type CategoryConfig,
} from "@/lib/questionnaire-store";
import {
  saveNewRequest,
} from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";
import { compressImage } from "@/lib/image-utils";
import logoImg from "/hormang-logo.png";

/* ─── Types ─────────────────────────────────────────────────────── */
type Stage = "select-category" | "questions" | "summary" | "recommendations";
type Answers = Record<string, string | string[] | boolean | number | null>;

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  today_tomorrow: { label: "Bugun yoki ertaga kerak", color: "text-red-600 bg-red-50 border-red-200" },
  "3_7_days": { label: "3–7 kun ichida", color: "text-orange-600 bg-orange-50 border-orange-200" },
  "1_2_weeks": { label: "1–2 hafta ichida", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  "1_month": { label: "1 oy ichida", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  flexible: { label: "Shoshilinch emas", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

/* ─── Answer formatting helpers ─────────────────────────────────── */
function formatAnswer(question: Question, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (question.type === "multi-select" && Array.isArray(value)) {
    if (value.length === 0) return "—";
    const opts = question.options ?? [];
    return value.map((v) => opts.find((o) => o.value === v)?.label ?? v).join(", ");
  }
  if (question.type === "single-select") {
    const opt = question.options?.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  if (question.type === "yes-no") return value ? "Ha" : "Yo'q";
  if (question.type === "file") return value ? "Rasm yuklandi ✓" : "—";
  if (question.type === "number") {
    const n = Number(value);
    if (!n) return "—";
    if (question.id === "budget") return `${n.toLocaleString()} so'm`;
    return String(n);
  }
  return String(value);
}

/* ─── Required follow-up validation helper ───────────────────────── */
function isRequiredBranchAnswered(bq: Question, answers: Answers): boolean {
  if (bq.required) {
    const val = answers[bq.id] ?? (bq.type === "multi-select" ? [] : null);
    if (bq.type === "multi-select") {
      if (!Array.isArray(val) || val.length === 0) return false;
    } else {
      if (val === null || val === undefined || val === "") return false;
    }
  }
  // Recurse into nested branches
  const nested = getActiveBranchesRaw(bq, answers);
  for (const nbq of nested) {
    if (!isRequiredBranchAnswered(nbq, answers)) return false;
  }
  return true;
}

function getActiveBranchesRaw(q: Question, answers: Answers): Question[] {
  if (!q.conditionalBranches) return [];
  if (q.type === "single-select") {
    const val = answers[q.id] as string | null;
    if (!val) return [];
    return q.conditionalBranches[val] ?? [];
  }
  if (q.type === "multi-select") {
    const vals = (answers[q.id] as string[]) ?? [];
    const result: Question[] = [];
    const seen = new Set<string>();
    for (const val of vals) {
      for (const bq of q.conditionalBranches[val] ?? []) {
        if (!seen.has(bq.id)) { seen.add(bq.id); result.push(bq); }
      }
    }
    return result;
  }
  return [];
}

/* ─── Conditional branch helpers ────────────────────────────────── */
function getActiveBranches(q: Question, answers: Answers): Question[] {
  if (!q.conditionalBranches) return [];
  if (q.type === "single-select") {
    const val = answers[q.id] as string | null;
    if (!val) return [];
    return q.conditionalBranches[val] ?? [];
  }
  if (q.type === "multi-select") {
    const vals = (answers[q.id] as string[]) ?? [];
    const result: Question[] = [];
    const seen = new Set<string>();
    for (const val of vals) {
      for (const bq of q.conditionalBranches[val] ?? []) {
        if (!seen.has(bq.id)) { seen.add(bq.id); result.push(bq); }
      }
    }
    return result;
  }
  return [];
}

/* ─── Inline conditional questions block ─────────────────────────── */
function ConditionalInlineBlock({
  questions,
  answers,
  onChange,
}: {
  questions: Question[];
  answers: Answers;
  onChange: (id: string, val: unknown) => void;
}) {
  if (questions.length === 0) return null;

  const pillBase = "px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer select-none";
  const pillOff = `${pillBase} border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600`;
  const pillOn = `${pillBase} border-blue-500 bg-blue-600 text-white shadow-sm`;
  const otherInputClass = "w-full px-4 py-3.5 rounded-2xl border border-blue-300 bg-blue-50/60 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      className="mt-5 border-l-2 border-blue-200 pl-4 space-y-6"
    >
      {questions.map((bq) => {
        const bVal = answers[bq.id] ?? (bq.type === "multi-select" ? [] : null);
        const nestedBranches = getActiveBranches(bq, answers);
        return (
          <div key={bq.id}>
            <div className="mb-3">
              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">↳ Qo'shimcha savol</span>
              <h3 className="text-base font-bold text-gray-800 mt-0.5 leading-snug">
                {bq.label}
                {bq.required && <span className="text-red-500 ml-1" title="Majburiy maydon">*</span>}
              </h3>
              {bq.helpText && <p className="text-xs text-gray-400 mt-0.5">{bq.helpText}</p>}
            </div>

            {/* Inline QuestionInput — only for common types to keep it concise */}
            {bq.type === "single-select" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {bq.options?.map((opt) => (
                    <button key={opt.value} onClick={() => { onChange(bq.id, bVal === opt.value ? null : opt.value); if (opt.type !== "other") onChange(bq.id + "_other", ""); }}
                      className={bVal === opt.value ? pillOn : pillOff}>
                      {bVal === opt.value && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{opt.label}
                    </button>
                  ))}
                </div>
                {bq.options?.find((o) => o.value === bVal && o.type === "other") && (
                  <input autoFocus value={(answers[bq.id + "_other"] as string) ?? ""} onChange={(e) => onChange(bq.id + "_other", e.target.value)} placeholder="Boshqasini yozing..." className={otherInputClass} />
                )}
              </div>
            )}
            {bq.type === "multi-select" && (() => {
              const sel = Array.isArray(bVal) ? (bVal as string[]) : [];
              return (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {bq.options?.map((opt) => {
                      const on = sel.includes(opt.value);
                      return (
                        <button key={opt.value} onClick={() => { const next = on ? sel.filter(x => x !== opt.value) : [...sel, opt.value]; onChange(bq.id, next); if (opt.type === "other" && on) onChange(bq.id + "_other", ""); }}
                          className={on ? pillOn : pillOff}>
                          {on && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {bq.options?.find((o) => o.type === "other" && sel.includes(o.value)) && (
                    <input autoFocus value={(answers[bq.id + "_other"] as string) ?? ""} onChange={(e) => onChange(bq.id + "_other", e.target.value)} placeholder="Boshqasini yozing..." className={otherInputClass} />
                  )}
                </div>
              );
            })()}
            {bq.type === "text" && (
              <input type="text" value={(bVal as string) ?? ""} onChange={(e) => onChange(bq.id, e.target.value)} placeholder={bq.placeholder}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            )}
            {bq.type === "textarea" && (
              <textarea rows={3} value={(bVal as string) ?? ""} onChange={(e) => onChange(bq.id, e.target.value)} placeholder={bq.placeholder}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition-all" />
            )}
            {bq.type === "number" && (
              <input type="number" value={(bVal as number) ?? ""} onChange={(e) => onChange(bq.id, e.target.value ? Number(e.target.value) : null)} placeholder={bq.placeholder}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            )}
            {bq.type === "yes-no" && (
              <div className="flex gap-3">
                {([{ label: "Ha", v: true }, { label: "Yo'q", v: false }] as const).map(({ label, v }) => (
                  <button key={label} onClick={() => onChange(bq.id, v)}
                    className={`flex-1 py-3 rounded-2xl border text-sm font-bold transition-all ${bVal === v ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"}`}>
                    {bVal === v && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{label}
                  </button>
                ))}
              </div>
            )}

            {/* Nested branches */}
            <AnimatePresence>
              {nestedBranches.length > 0 && (
                <ConditionalInlineBlock questions={nestedBranches} answers={answers} onChange={onChange} />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ─── Single question renderer ───────────────────────────────────── */
function QuestionInput({
  question,
  value,
  onChange,
  otherValue,
  onOtherChange,
  openToOffers,
  onOpenToOffersChange,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
  openToOffers?: boolean;
  onOpenToOffersChange?: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pillBase = "px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer select-none";
  const pillOff = `${pillBase} border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600`;
  const pillOn = `${pillBase} border-blue-500 bg-blue-600 text-white shadow-sm`;

  const otherInputClass = "w-full px-4 py-3.5 rounded-2xl border border-blue-300 bg-blue-50/60 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

  if (question.type === "single-select") {
    const selectedOpt = question.options?.find((o) => o.value === value);
    const showOther = !!selectedOpt && selectedOpt.type === "other";
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2.5">
          {question.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const next = value === opt.value ? null : opt.value;
                onChange(next);
                if (opt.type !== "other") onOtherChange?.("");
              }}
              className={value === opt.value ? pillOn : pillOff}
            >
              {value === opt.value && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
              {opt.label}
            </button>
          ))}
        </div>
        {showOther && (
          <input
            autoFocus
            value={otherValue ?? ""}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder="Boshqasini yozing..."
            className={otherInputClass}
          />
        )}
      </div>
    );
  }

  if (question.type === "multi-select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (v: string) => {
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      onChange(next);
      const opt = question.options?.find((o) => o.value === v);
      if (opt?.type === "other" && selected.includes(v)) onOtherChange?.("");
    };
    const activeOtherOpt = question.options?.find((o) => o.type === "other" && selected.includes(o.value));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2.5">
          {question.options?.map((opt) => {
            const on = selected.includes(opt.value);
            return (
              <button key={opt.value} onClick={() => toggle(opt.value)} className={on ? pillOn : pillOff}>
                {on && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                {opt.label}
              </button>
            );
          })}
        </div>
        {activeOtherOpt && (
          <input
            autoFocus
            value={otherValue ?? ""}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder="Boshqasini yozing..."
            className={otherInputClass}
          />
        )}
      </div>
    );
  }

  if (question.type === "yes-no") {
    return (
      <div className="flex gap-3">
        {[{ label: "Ha", v: true }, { label: "Yo'q", v: false }].map(({ label, v }) => (
          <button
            key={label}
            onClick={() => onChange(v)}
            className={`flex-1 py-4 rounded-2xl border text-base font-bold transition-all duration-150 ${
              value === v
                ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
            }`}
          >
            {value === v && <Check className="w-4 h-4 inline mr-1.5" />}
            {label}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <textarea
        rows={4}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition-all"
      />
    );
  }

  if (question.type === "text") {
    return (
      <input
        type="text"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
      />
    );
  }

  if (question.type === "date") {
    return (
      <input
        type="date"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
      />
    );
  }

  if (question.type === "number") {
    const isBudget = question.id === "budget";
    return (
      <div className="space-y-3">
        {isBudget && openToOffers ? (
          <div className="w-full px-4 py-3.5 rounded-2xl border border-emerald-300 bg-emerald-50 text-sm font-semibold text-emerald-700">
            Byudjet moslashuvchan / Taklifga ochiq
          </div>
        ) : (
          <div className="relative">
            <input
              type="number"
              value={(value as number) ?? ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              placeholder={question.placeholder}
              disabled={isBudget && openToOffers}
              className="w-full px-4 py-3.5 pr-16 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50"
            />
            {question.helpText && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                {question.helpText}
              </span>
            )}
          </div>
        )}
        {isBudget && (
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openToOffers ?? false}
              onChange={(e) => onOpenToOffersChange?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 font-medium">Taklifga ochiq (byudjet moslashuvchan)</span>
          </label>
        )}
      </div>
    );
  }

  if (question.type === "file") {
    const dataUrl = typeof value === "string" && value.startsWith("data:") ? value : null;
    const hasFile = !!value;

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      compressImage(file, 1024, 0.72).then(onChange).catch(() => {
        const reader = new FileReader();
        reader.onload = (ev) => onChange(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    return (
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {hasFile ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
            {dataUrl ? (
              <div className="relative">
                <img
                  src={dataUrl}
                  alt="Yuklangan rasm"
                  className="w-full max-h-64 object-cover"
                />
                <button
                  onClick={() => onChange(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-4 py-2 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700">Rasm yuklandi</span>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="ml-auto text-xs text-blue-600 font-semibold hover:text-blue-700"
                  >
                    Almashtirish
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-700 flex-1 truncate">{value as string}</span>
                <button onClick={() => onChange(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-3 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all duration-200"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Rasm tanlash uchun bosing</span>
            <span className="text-xs opacity-70">JPEG, PNG, HEIC — maksimal 10 MB</span>
          </button>
        )}
      </div>
    );
  }

  return null;
}

/* ─── Header ─────────────────────────────────────────────────────── */
function QuizHeader({
  onBack,
  step,
  total,
  categoryName,
  emoji,
}: {
  onBack: () => void;
  step?: number;
  total?: number;
  categoryName?: string;
  emoji?: string;
}) {
  const progress = step !== undefined && total ? ((step + 1) / total) * 100 : 0;
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          {categoryName && (
            <p className="text-xs text-gray-400 font-medium truncate">
              {emoji} {categoryName}
              {step !== undefined && total ? ` — ${step + 1} / ${total}` : ""}
            </p>
          )}
          {step !== undefined && total && (
            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
        <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain flex-shrink-0" />
      </div>
    </div>
  );
}

/* ─── Category Select Screen ─────────────────────────────────────── */
function CategorySelectScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const categories = getCategories();
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader onBack={() => setLocation("/")} />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Qaysi xizmat kerak?</h1>
          <p className="text-gray-500 text-sm">Kategoriya tanlang, so'rovingizni aniqlaymiz</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              onClick={() => onSelect(cat.id)}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="text-2xl mb-3">{cat.emoji}</div>
              <p className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                {cat.name}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Questions Screen ───────────────────────────────────────────── */
function QuestionsScreen({
  categoryId,
  onComplete,
  onBack,
}: {
  categoryId: string;
  onComplete: (answers: Answers) => void;
  onBack: () => void;
}) {
  const cat = getCategoryById(categoryId);
  const allQuestions = getAllQuestionsForCategory(categoryId);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [openToOffers, setOpenToOffers] = useState(false);
  const [direction, setDirection] = useState(1);

  const q = allQuestions[step];
  if (!q) return null;

  const currentValue = answers[q.id] ?? (q.type === "multi-select" ? [] : null);

  const isAnswered = () => {
    // Check the current top-level question first
    if (q.required) {
      if (q.type === "multi-select") {
        if (!Array.isArray(currentValue) || currentValue.length === 0) return false;
      } else if (q.id === "budget") {
        if (!openToOffers && (currentValue === null || currentValue === "")) return false;
      } else {
        if (currentValue === null || currentValue === "" || currentValue === undefined) return false;
      }
    }
    // Also validate any required follow-up questions that are currently visible
    const visibleBranches = getActiveBranches(q, { ...answers, [q.id]: currentValue });
    for (const bq of visibleBranches) {
      if (!isRequiredBranchAnswered(bq, answers)) return false;
    }
    return true;
  };

  const canSkip = !q.required;

  function goNext() {
    const updated = { ...answers, [q.id]: currentValue };
    if (q.id === "budget") updated["budget_open"] = openToOffers;
    setAnswers(updated);

    let nextStep = step + 1;
    while (nextStep < allQuestions.length) {
      const nextQ = allQuestions[nextStep];
      if (nextQ.id === "district" && updated["region"] !== "Toshkent shahri") {
        nextStep++;
        continue;
      }
      break;
    }

    if (nextStep < allQuestions.length) {
      setDirection(1);
      setStep(nextStep);
    } else {
      onComplete(updated);
    }
  }

  function goBack() {
    if (step === 0) { onBack(); return; }
    let prevStep = step - 1;
    while (prevStep > 0) {
      const prevQ = allQuestions[prevStep];
      if (prevQ.id === "district" && answers["region"] !== "Toshkent shahri") {
        prevStep--;
        continue;
      }
      break;
    }
    setDirection(-1);
    setStep(prevStep);
  }

  const isLast = step === allQuestions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader
        onBack={goBack}
        step={step}
        total={allQuestions.length}
        categoryName={cat?.name}
        emoji={cat?.emoji}
      />
      <div className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -32 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 block">
                Savol {step + 1}
              </span>
              <h2 className="text-xl font-extrabold text-gray-900 leading-snug">
                {q.label}
                {q.required && <span className="text-red-500 ml-1" title="Majburiy maydon">*</span>}
              </h2>
            </div>

            <QuestionInput
              question={q}
              value={currentValue}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              otherValue={(answers[q.id + "_other"] as string) ?? ""}
              onOtherChange={(v) => setAnswers((prev) => ({ ...prev, [q.id + "_other"]: v }))}
              openToOffers={openToOffers}
              onOpenToOffersChange={setOpenToOffers}
            />

            {/* Inline conditional follow-up questions */}
            <AnimatePresence>
              {getActiveBranches(q, { ...answers, [q.id]: currentValue }).length > 0 && (
                <ConditionalInlineBlock
                  questions={getActiveBranches(q, { ...answers, [q.id]: currentValue })}
                  answers={answers}
                  onChange={(id, val) => setAnswers((prev) => ({ ...prev, [id]: val }))}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-10">
          {canSkip && step > 0 && (
            <Button variant="outline" onClick={goNext} className="flex-1 font-semibold border-gray-200">
              O'tkazib yuborish
            </Button>
          )}
          <Button
            onClick={goNext}
            disabled={!isAnswered()}
            className="flex-1 font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 gap-2"
          >
            {isLast ? "Yakunlash" : "Keyingisi"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Summary Screen ─────────────────────────────────────────────── */
function SummaryScreen({
  categoryId,
  answers,
  onSeeProviders,
  onBack,
}: {
  categoryId: string;
  answers: Answers;
  onSeeProviders: () => void;
  onBack: () => void;
}) {
  const cat = getCategoryById(categoryId);
  const allQuestions = getAllQuestionsForCategory(categoryId);
  const urgency = answers["urgency"] as string | undefined;
  const openToOffers = answers["budget_open"] as boolean | undefined;
  const budget = answers["budget"] as number | undefined;
  const urgencyInfo = urgency ? URGENCY_LABELS[urgency] : null;

  // Include active branch questions so their answers are shown in the summary
  const activeQuestions = collectActiveQuestions(allQuestions, answers as Record<string, unknown>);
  const specificQs = activeQuestions.filter((q) => q.id !== "urgency" && q.id !== "budget");
  const commonQs = allQuestions.filter((q) => q.id === "urgency" || q.id === "budget");

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader onBack={onBack} categoryName={cat?.name} emoji={cat?.emoji} />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-gray-900">Sizning so'rovingiz</h1>
          </div>
          <p className="text-gray-500 text-sm">Barcha ma'lumotlarni tekshiring va ustalarni ko'ring</p>
        </div>

        {/* Urgency + Budget highlights */}
        <div className="flex gap-3 mb-5">
          {urgencyInfo && (
            <div className={`flex-1 rounded-2xl border px-4 py-3 ${urgencyInfo.color}`}>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5 opacity-70">Shoshilinchlik</p>
              <p className="text-sm font-bold">{urgencyInfo.label}</p>
            </div>
          )}
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide mb-0.5 text-gray-400">Byudjet</p>
            <p className="text-sm font-bold text-gray-900">
              {openToOffers ? "Taklifga ochiq" : budget ? `${Number(budget).toLocaleString()} so'm` : "Ko'rsatilmagan"}
            </p>
          </div>
        </div>

        {/* Specific answers */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-5">
          {specificQs.map((q) => {
            const val = answers[q.id];
            if (q.type === "file") return null;
            const formatted = formatAnswer(q, val);
            if (formatted === "—") return null;
            const otherText = answers[q.id + "_other"] as string | undefined;
            const hasOtherText = !!otherText?.trim();
            return (
              <div key={q.id} className="px-5 py-4">
                <p className="text-xs text-gray-400 font-semibold mb-1">{q.label}</p>
                <p className="text-sm font-semibold text-gray-900">{formatted}</p>
                {hasOtherText && (
                  <p className="text-xs text-blue-600 mt-0.5 font-medium">↳ {otherText}</p>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={onSeeProviders}
          className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2"
        >
          So`rov yuborish
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Recommendations Screen ─────────────────────────────────────── */
function RecommendationsScreen({
  categoryId,
  requestId,
}: {
  categoryId: string;
  answers: Answers;
  requestId: string | null;
  onBack: () => void;
}) {
  const cat = getCategoryById(categoryId);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-lg mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-sm"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-2xl mb-2">{cat?.emoji ?? "📋"}</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">So'rovingiz yuborildi!</h1>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-1">
            <span className="font-semibold text-gray-700">{cat?.name}</span> bo'yicha so'rovingiz
            platformaga yuborildi.
          </p>
          <p className="text-gray-400 text-xs max-w-xs mx-auto mb-8">
            Mutaxassislar takliflarini yuborishgach, siz bildirishnoma olasiz.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full space-y-3"
        >
          {requestId ? (
            <>
              <Button
                className="w-full py-4 font-bold bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2"
                onClick={() => setLocation("/my-requests")}
              >
                Mening so'rovlarimga o'tish
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full font-semibold border-gray-200 rounded-2xl"
                onClick={() => setLocation("/")}
              >
                Bosh sahifaga qaytish
              </Button>
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm font-semibold text-blue-800 mb-3">
                Takliflarni qabul qilish uchun ro'yxatdan o'ting — bepul!
              </p>
              <Button className="w-full font-bold bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/auth/role")}>
                Bepul ro'yxatdan o'tish
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function QuestionnairePage() {
  const { user } = useAuth();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const presetCat = params.get("cat") ?? undefined;

  const [stage, setStage] = useState<Stage>(presetCat ? "questions" : "select-category");
  const [categoryId, setCategoryId] = useState<string>(presetCat ?? "");
  const [answers, setAnswers] = useState<Answers>({});
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  function handleSelectCategory(id: string) {
    setCategoryId(id);
    setStage("questions");
  }

  function handleQuestionsComplete(a: Answers) {
    setAnswers(a);
    setStage("summary");
  }

  function handleSeeProviders() {
    const cat = getCategoryById(categoryId);
    const customerName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined : undefined;
    const req = saveNewRequest(categoryId, cat?.name ?? categoryId, answers, undefined, user?.id, customerName);
    setCurrentRequestId(req.id);
    setStage("recommendations");
  }

  return (
    <AnimatePresence mode="wait">
      {stage === "select-category" && (
        <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <CategorySelectScreen onSelect={handleSelectCategory} />
        </motion.div>
      )}
      {stage === "questions" && categoryId && (
        <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuestionsScreen
            categoryId={categoryId}
            onComplete={handleQuestionsComplete}
            onBack={() => setStage("select-category")}
          />
        </motion.div>
      )}
      {stage === "summary" && (
        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <SummaryScreen
            categoryId={categoryId}
            answers={answers}
            onSeeProviders={handleSeeProviders}
            onBack={() => setStage("questions")}
          />
        </motion.div>
      )}
      {stage === "recommendations" && (
        <motion.div key="recs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <RecommendationsScreen
            categoryId={categoryId}
            answers={answers}
            requestId={currentRequestId}
            onBack={() => setStage("summary")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
