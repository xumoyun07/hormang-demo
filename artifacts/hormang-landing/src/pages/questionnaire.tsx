import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import {
  ChevronLeft, ChevronRight, Check, Star, MapPin,
  MessageCircle, FileText, Clock, Zap, Upload, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategories, getAllQuestionsForCategory, getCategoryById,
  type Question, type CategoryConfig,
} from "@/lib/questionnaire-store";
import logoImg from "/hormang-logo.png";

/* ─── Types ─────────────────────────────────────────────────────── */
type Stage = "select-category" | "questions" | "summary" | "recommendations";
type Answers = Record<string, string | string[] | boolean | number | null>;

/* ─── Mock Providers ─────────────────────────────────────────────── */
interface MockProvider {
  id: string;
  name: string;
  initials: string;
  color: string;
  rating: number;
  reviews: number;
  location: string;
  priceLabel: string;
  minPrice: number;
  responseTime: string;
  urgencyFit: "high" | "medium" | "low";
  baseMatch: number;
}

const MOCK_PROVIDERS: MockProvider[] = [
  { id: "1", name: "Alisher T.", initials: "AT", color: "#2563EB", rating: 4.9, reviews: 128, location: "Yunusobod", priceLabel: "50 000 – 150 000 so'm", minPrice: 50000, responseTime: "~15 daqiqa", urgencyFit: "high", baseMatch: 95 },
  { id: "2", name: "Gulnora S.", initials: "GS", color: "#059669", rating: 4.8, reviews: 211, location: "Chilonzor", priceLabel: "70 000 – 200 000 so'm", minPrice: 70000, responseTime: "~30 daqiqa", urgencyFit: "high", baseMatch: 92 },
  { id: "3", name: "Jasur B.", initials: "JB", color: "#7C3AED", rating: 5.0, reviews: 73, location: "Mirobod", priceLabel: "60 000 – 180 000 so'm", minPrice: 60000, responseTime: "~1 soat", urgencyFit: "medium", baseMatch: 89 },
  { id: "4", name: "Malika R.", initials: "MR", color: "#D97706", rating: 4.9, reviews: 63, location: "Sergeli", priceLabel: "40 000 – 120 000 so'm", minPrice: 40000, responseTime: "~2 soat", urgencyFit: "medium", baseMatch: 85 },
  { id: "5", name: "Firdavs N.", initials: "FN", color: "#DC2626", rating: 4.7, reviews: 99, location: "Bektemir", priceLabel: "80 000 – 250 000 so'm", minPrice: 80000, responseTime: "~3 soat", urgencyFit: "low", baseMatch: 81 },
  { id: "6", name: "Barno U.", initials: "BU", color: "#0891B2", rating: 4.8, reviews: 86, location: "Shayxontohur", priceLabel: "55 000 – 160 000 so'm", minPrice: 55000, responseTime: "~4 soat", urgencyFit: "low", baseMatch: 78 },
];

function calcMatch(provider: MockProvider, answers: Answers): number {
  let score = provider.baseMatch;
  const urgency = answers["urgency"] as string | undefined;
  const budget = answers["budget"] as number | undefined;
  const openToOffers = answers["budget_open"] as boolean | undefined;

  if (urgency === "today_tomorrow" && provider.urgencyFit === "high") score += 3;
  if (urgency === "today_tomorrow" && provider.urgencyFit === "low") score -= 4;
  if ((urgency === "3_7_days" || urgency === "1_2_weeks") && provider.urgencyFit === "medium") score += 2;

  if (!openToOffers && budget && budget > 0) {
    if (budget >= provider.minPrice) score += 2;
    else score -= 3;
  }

  return Math.min(98, Math.max(60, score));
}

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

/* ─── Single question renderer ───────────────────────────────────── */
function QuestionInput({
  question,
  value,
  onChange,
  openToOffers,
  onOpenToOffersChange,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  openToOffers?: boolean;
  onOpenToOffersChange?: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pillBase = "px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer select-none";
  const pillOff = `${pillBase} border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600`;
  const pillOn = `${pillBase} border-blue-500 bg-blue-600 text-white shadow-sm`;

  if (question.type === "single-select") {
    return (
      <div className="flex flex-wrap gap-2.5">
        {question.options?.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(value === opt.value ? null : opt.value)}
            className={value === opt.value ? pillOn : pillOff}
          >
            {value === opt.value && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "multi-select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (v: string) => {
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      onChange(next);
    };
    return (
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
    const hasFile = !!value;
    return (
      <div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0]?.name ?? null)} />
        {hasFile ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-emerald-700 flex-1">{value as string}</span>
            <button onClick={() => onChange(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-3 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all duration-200"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Rasm tanlash uchun bosing</span>
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
  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader onBack={() => window.history.back()} />
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
    if (!q.required) return true;
    if (q.type === "multi-select") return Array.isArray(currentValue) && currentValue.length > 0;
    if (q.id === "budget") return openToOffers || (currentValue !== null && currentValue !== "");
    return currentValue !== null && currentValue !== "" && currentValue !== undefined;
  };

  const canSkip = !q.required;

  function goNext() {
    const updated = { ...answers, [q.id]: currentValue };
    if (q.id === "budget") updated["budget_open"] = openToOffers;
    setAnswers(updated);
    if (step < allQuestions.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      onComplete(updated);
    }
  }

  function goBack() {
    if (step === 0) { onBack(); return; }
    setDirection(-1);
    setStep(step - 1);
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
              <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{q.label}</h2>
            </div>

            <QuestionInput
              question={q}
              value={currentValue}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              openToOffers={openToOffers}
              onOpenToOffersChange={setOpenToOffers}
            />
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

  const specificQs = allQuestions.filter((q) => q.id !== "urgency" && q.id !== "budget");
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
            return (
              <div key={q.id} className="px-5 py-4">
                <p className="text-xs text-gray-400 font-semibold mb-1">{q.label}</p>
                <p className="text-sm font-semibold text-gray-900">{formatted}</p>
              </div>
            );
          })}
        </div>

        <Button
          onClick={onSeeProviders}
          className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2"
        >
          Mos keladigan ustalarni ko'rish
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Recommendations Screen ─────────────────────────────────────── */
function RecommendationsScreen({
  categoryId,
  answers,
  onBack,
}: {
  categoryId: string;
  answers: Answers;
  onBack: () => void;
}) {
  const cat = getCategoryById(categoryId);
  const [, setLocation] = useLocation();

  const ranked = [...MOCK_PROVIDERS]
    .map((p) => ({ ...p, match: calcMatch(p, answers) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 6);

  const urgency = answers["urgency"] as string | undefined;
  const urgencyInfo = urgency ? URGENCY_LABELS[urgency] : null;

  function matchColor(pct: number) {
    if (pct >= 90) return "bg-emerald-500";
    if (pct >= 80) return "bg-blue-500";
    return "bg-amber-500";
  }

  function matchReasons(p: typeof ranked[0]): string[] {
    const reasons: string[] = [];
    if (p.match >= 90) reasons.push("Yuqori mos keladi");
    if (p.urgencyFit === "high" && (urgency === "today_tomorrow" || urgency === "3_7_days"))
      reasons.push("Tez javob beradi");
    if (p.rating >= 4.9) reasons.push("Top baholangan");
    if (p.reviews > 100) reasons.push(`${p.reviews}+ sharh`);
    return reasons.slice(0, 3);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader onBack={onBack} categoryName={cat?.name} emoji={cat?.emoji} />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-extrabold text-gray-900">Sizga mos ustalar</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {ranked.length} ta mutaxassis so'rovingizga mos keldi
            {urgencyInfo ? ` · ${urgencyInfo.label}` : ""}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {ranked.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{p.name}</p>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold ${matchColor(p.match)}`}>
                      <Zap className="w-3 h-3" />
                      {p.match}% mos
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.responseTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-gray-800">{p.rating}</span>
                  <span className="text-xs text-gray-400">({p.reviews})</span>
                </div>
                <span className="text-xs font-semibold text-blue-600">{p.priceLabel}</span>
              </div>

              {matchReasons(p).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {matchReasons(p).map((r) => (
                    <span key={r} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                      {r}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-xs font-semibold border-gray-200 gap-1.5"
                  onClick={() => setLocation("/auth/login")}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat ochish
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 gap-1.5"
                  onClick={() => setLocation("/auth/login")}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Taklif so'rash
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-blue-800 mb-3">
            To'liq profil va tezkor bron uchun ro'yxatdan o'ting — bepul!
          </p>
          <Button className="w-full font-bold bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/auth/role")}>
            Bepul ro'yxatdan o'tish
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function QuestionnairePage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const presetCat = params.get("cat") ?? undefined;

  const [stage, setStage] = useState<Stage>(presetCat ? "questions" : "select-category");
  const [categoryId, setCategoryId] = useState<string>(presetCat ?? "");
  const [answers, setAnswers] = useState<Answers>({});

  function handleSelectCategory(id: string) {
    setCategoryId(id);
    setStage("questions");
  }

  function handleQuestionsComplete(a: Answers) {
    setAnswers(a);
    setStage("summary");
  }

  function handleSeeProviders() {
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
            onBack={() => setStage("summary")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
