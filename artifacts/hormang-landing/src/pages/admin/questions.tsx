/**
 * Admin Panel — Advanced Question Manager
 * Password: hormang2024
 * Changes are only persisted when the "Saqlash" button is clicked.
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Plus, Trash2, Edit3, ChevronUp, ChevronDown,
  Save, X, Check, RefreshCw, Eye, EyeOff, GripVertical,
  AlertTriangle, Star, Layers, GitBranch, Hash, ToggleLeft,
  Calendar, FileUp, AlignLeft, List, Type, Sliders,
  SlidersHorizontal, ChevronRight, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategories, saveCategories,
  getCommonQuestions, saveCommonQuestions,
  resetCategories, resetCommonQuestions,
  type CategoryConfig, type Question, type QuestionType, type QuestionOption,
} from "@/lib/questionnaire-store";
import logoImg from "/hormang-logo.png";

const ADMIN_PASSWORD = "hormang2024";

/* ─── Type meta ─────────────────────────────────────────────────── */
interface TypeMeta { value: QuestionType; label: string; icon: React.ReactNode }
const QUESTION_TYPES: TypeMeta[] = [
  { value: "single-select",  label: "Bir tanlash",    icon: <List className="w-3.5 h-3.5" /> },
  { value: "multi-select",   label: "Ko'p tanlash",   icon: <List className="w-3.5 h-3.5" /> },
  { value: "text",           label: "Matn (1 qator)", icon: <Type className="w-3.5 h-3.5" /> },
  { value: "textarea",       label: "Katta matn",     icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { value: "number",         label: "Raqam",          icon: <Hash className="w-3.5 h-3.5" /> },
  { value: "range",          label: "Slider (range)", icon: <Sliders className="w-3.5 h-3.5" /> },
  { value: "yes-no",         label: "Ha / Yo'q",      icon: <ToggleLeft className="w-3.5 h-3.5" /> },
  { value: "date",           label: "Sana",           icon: <Calendar className="w-3.5 h-3.5" /> },
  { value: "file",           label: "Fayl yuklash",   icon: <FileUp className="w-3.5 h-3.5" /> },
  { value: "section-header", label: "Bo'lim sarlavhasi", icon: <Layers className="w-3.5 h-3.5" /> },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t.label]));

/* ─── Editor types ───────────────────────────────────────────────── */
interface EditorOption {
  _key: string;
  label: string;
  value: string;
  isOther: boolean;
  otherLabel: string;
}

interface EditorState {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  isCore: boolean;
  helpText: string;
  placeholder: string;
  min: string;
  max: string;
  step: string;
  options: EditorOption[];
  condEnabled: boolean;
  condQuestionId: string;
  condValue: string;
}

function mkKey() { return `_${Math.random().toString(36).slice(2, 8)}`; }

function blankEditor(): EditorState {
  return {
    id: `q_${Date.now()}`,
    label: "",
    type: "single-select",
    required: false,
    isCore: false,
    helpText: "",
    placeholder: "",
    min: "",
    max: "",
    step: "",
    options: [{ _key: mkKey(), label: "", value: "", isOther: false, otherLabel: "Boshqa" }],
    condEnabled: false,
    condQuestionId: "",
    condValue: "",
  };
}

function editorFromQuestion(q: Question): EditorState {
  return {
    id: q.id,
    label: q.label,
    type: q.type,
    required: !!q.required,
    isCore: !!q.isCore,
    helpText: q.helpText ?? "",
    placeholder: q.placeholder ?? "",
    min: q.min != null ? String(q.min) : "",
    max: q.max != null ? String(q.max) : "",
    step: q.step != null ? String(q.step) : "",
    options: q.options?.length
      ? q.options.map((o) => ({ _key: mkKey(), label: o.label, value: o.value, isOther: !!o.isOther, otherLabel: o.otherLabel ?? "Boshqa" }))
      : [{ _key: mkKey(), label: "", value: "", isOther: false, otherLabel: "Boshqa" }],
    condEnabled: !!q.conditional,
    condQuestionId: q.conditional?.questionId ?? "",
    condValue: q.conditional?.value ?? "",
  };
}

function editorToQuestion(e: EditorState): Question {
  const q: Question = { id: e.id, label: e.label, type: e.type };
  if (e.required) q.required = true;
  if (e.isCore) q.isCore = true;
  if (e.placeholder.trim()) q.placeholder = e.placeholder.trim();
  if (e.helpText.trim()) q.helpText = e.helpText.trim();
  if (e.min !== "") q.min = Number(e.min);
  if (e.max !== "") q.max = Number(e.max);
  if (e.step !== "") q.step = Number(e.step);
  const needsOptions = e.type === "single-select" || e.type === "multi-select";
  if (needsOptions) {
    q.options = e.options
      .filter((o) => o.label.trim())
      .map((o): QuestionOption => {
        const out: QuestionOption = { label: o.label.trim(), value: o.value.trim() || o.label.trim().toLowerCase().replace(/\s+/g, "_") };
        if (o.isOther) { out.isOther = true; out.otherLabel = o.otherLabel || "Boshqa"; }
        return out;
      });
  }
  if (e.condEnabled && e.condQuestionId) {
    q.conditional = { questionId: e.condQuestionId, value: e.condValue };
  }
  return q;
}

/* ─── Password Gate ──────────────────────────────────────────────── */
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { onSuccess(); }
    else { setError(true); setTimeout(() => setError(false), 1500); }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-sm shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <img src={logoImg} alt="Hormang" className="w-10 h-10 object-contain" />
          <div><p className="font-extrabold text-gray-900">Admin Panel</p><p className="text-xs text-gray-400">Savollar boshqaruvi</p></div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="Admin parolini kiriting" autoFocus
                className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm transition-all ${error ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:ring-blue-200"} focus:outline-none focus:ring-2`} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1.5 font-medium">Parol noto'g'ri</p>}
          </div>
          <Button type="submit" className="w-full font-bold bg-blue-600 hover:bg-blue-700 py-3">Kirish</Button>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── iOS Toggle ─────────────────────────────────────────────────── */
function Toggle({ checked, onChange, size = "sm" }: { checked: boolean; onChange: (v: boolean) => void; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-6 w-11" : "h-5 w-9";
  const knob = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const tx = size === "md" ? "translateX(22px)" : "translateX(18px)";
  return (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex ${h} items-center rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none`}
      style={{ background: checked ? "#2563EB" : "#D1D5DB" }}>
      <span className={`inline-block ${knob} rounded-full bg-white shadow-sm transition-transform duration-200`}
        style={{ transform: checked ? tx : "translateX(2px)" }} />
    </button>
  );
}

/* ─── Live Question Preview ──────────────────────────────────────── */
function QuestionPreview({ q }: { q: EditorState }) {
  const [selectedSingle, setSelectedSingle] = useState<string>("");
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [rangeVal, setRangeVal] = useState(q.min || "0");

  if (q.type === "section-header") {
    return (
      <div className="py-3 px-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-xl">
        <p className="font-extrabold text-blue-700 text-sm">{q.label || "Bo'lim sarlavhasi"}</p>
        {q.helpText && <p className="text-xs text-blue-500 mt-0.5">{q.helpText}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1">
        <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">{q.label || <span className="text-gray-300 italic">Savol matni…</span>}</p>
        {q.required && <span className="text-red-500 text-xs font-bold mt-0.5">*</span>}
      </div>
      {q.helpText && <p className="text-xs text-gray-400">{q.helpText}</p>}

      {q.type === "single-select" && (
        <div className="flex flex-wrap gap-1.5">
          {q.options.filter(o => o.label).map((o) => (
            <button key={o._key} onClick={() => { setSelectedSingle(o._key); setShowOther(o.isOther); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${selectedSingle === o._key ? "border-blue-500 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"}`}>
              {o.label}
            </button>
          ))}
          {showOther && <input placeholder="Boshqasini yozing..." className="mt-1 w-full px-3 py-1.5 rounded-lg border border-blue-300 text-xs focus:outline-none" />}
        </div>
      )}

      {q.type === "multi-select" && (
        <div className="flex flex-wrap gap-1.5">
          {q.options.filter(o => o.label).map((o) => {
            const on = selectedMulti.includes(o._key);
            return (
              <button key={o._key} onClick={() => {
                const next = on ? selectedMulti.filter(k => k !== o._key) : [...selectedMulti, o._key];
                setSelectedMulti(next);
                setShowOther(next.includes(o._key) && o.isOther || (showOther && !on));
              }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${on ? "border-blue-500 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"}`}>
                {on && <Check className="w-3 h-3" />}{o.label}
              </button>
            );
          })}
          {showOther && <input placeholder="Boshqasini yozing..." className="mt-1 w-full px-3 py-1.5 rounded-lg border border-blue-300 text-xs focus:outline-none" />}
        </div>
      )}

      {q.type === "text" && <input placeholder={q.placeholder || "Matn kiriting…"} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-300" />}
      {q.type === "textarea" && <textarea rows={2} placeholder={q.placeholder || "Matn kiriting…"} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-300 resize-none" />}
      {q.type === "number" && (
        <div className="flex items-center gap-2">
          <input type="number" placeholder={q.placeholder || "0"} min={q.min || undefined} max={q.max || undefined} step={q.step || undefined}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-300" />
          {q.helpText && <span className="text-xs text-gray-400 font-medium">{q.helpText}</span>}
        </div>
      )}
      {q.type === "range" && (
        <div className="space-y-1">
          <input type="range" min={q.min || 0} max={q.max || 100} step={q.step || 1} value={rangeVal} onChange={e => setRangeVal(e.target.value)} className="w-full accent-blue-600" />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{q.min || 0}</span><span className="font-semibold text-blue-600">{rangeVal}</span><span>{q.max || 100}</span>
          </div>
        </div>
      )}
      {q.type === "yes-no" && (
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">✓ Ha</button>
          <button className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold">✗ Yo'q</button>
        </div>
      )}
      {q.type === "date" && <input type="date" className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-300" />}
      {q.type === "file" && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
          <FileUp className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Fayl yuklash</p>
        </div>
      )}
    </div>
  );
}

/* ─── Single Option Row (in editor) ─────────────────────────────── */
function OptionRow({
  opt, index, total,
  onChange, onDelete, onMove,
  isDragging, onDragStart, onDragOver, onDrop,
}: {
  opt: EditorOption; index: number; total: number;
  onChange: (f: keyof EditorOption, v: string | boolean) => void;
  onDelete: () => void; onMove: (dir: -1 | 1) => void;
  isDragging: boolean;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDrop: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={onDrop}
      className={`rounded-xl border p-2.5 space-y-2 transition-all ${isDragging ? "opacity-40 border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
    >
      <div className="flex items-center gap-2">
        <div className="cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>
        <input value={opt.label} onChange={(e) => onChange("label", e.target.value)}
          placeholder={`Variant ${index + 1} (ko'rsatiladigan matn)`}
          className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400" />
        <input value={opt.value} onChange={(e) => onChange("value", e.target.value)}
          placeholder="value"
          className="w-28 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-300" />
        <div className="flex gap-0.5">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 pl-6 cursor-pointer">
        <input type="checkbox" checked={opt.isOther} onChange={(e) => onChange("isOther", e.target.checked)}
          className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
        <span className="text-xs text-gray-600">Bu <strong>"Boshqa"</strong> varianti — tanlanganda matn kiritish maydoni paydo bo'ladi</span>
      </label>
      {opt.isOther && (
        <div className="pl-6">
          <input value={opt.otherLabel} onChange={(e) => onChange("otherLabel", e.target.value)}
            placeholder='Teg matni (default: "Boshqa")'
            className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300" />
        </div>
      )}
    </div>
  );
}

/* ─── Question Editor Modal ──────────────────────────────────────── */
function QuestionEditorModal({
  initial,
  allQuestions,
  onSave,
  onClose,
}: {
  initial?: EditorState;
  allQuestions: Question[];
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState<EditorState>(initial ?? blankEditor());
  const [showPreview, setShowPreview] = useState(true);
  const dragIdx = useRef<number | null>(null);

  const set = <K extends keyof EditorState>(k: K, v: EditorState[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const needsOptions = s.type === "single-select" || s.type === "multi-select";
  const needsNumeric = s.type === "number" || s.type === "range";
  const needsPlaceholder = ["text", "textarea", "number"].includes(s.type);

  function addOption() {
    setS((prev) => ({ ...prev, options: [...prev.options, { _key: mkKey(), label: "", value: "", isOther: false, otherLabel: "Boshqa" }] }));
  }
  function updateOption(i: number, field: keyof EditorOption, val: string | boolean) {
    setS((prev) => ({ ...prev, options: prev.options.map((o, idx) => idx === i ? { ...o, [field]: val } : o) }));
  }
  function removeOption(i: number) {
    setS((prev) => ({ ...prev, options: prev.options.filter((_, idx) => idx !== i) }));
  }
  function moveOption(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= s.options.length) return;
    const opts = [...s.options];
    [opts[i], opts[j]] = [opts[j], opts[i]];
    setS((prev) => ({ ...prev, options: opts }));
  }

  function handleSave() {
    if (!s.label.trim() && s.type !== "section-header") return;
    onSave(editorToQuestion(s));
  }

  const validQuestions = allQuestions.filter(q => q.id !== s.id && (q.type === "single-select" || q.type === "yes-no"));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 32 }}
        className="bg-white w-full sm:rounded-3xl sm:border sm:border-gray-100 sm:max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="font-bold text-gray-900 text-base">{initial ? "Savolni tahrirlash" : "Yangi savol qo'shish"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Barcha o'zgarishlar sahifaga "Saqlash" tugmasida qo'llanadi</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(!showPreview)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${showPreview ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <Eye className="w-3.5 h-3.5" />{showPreview ? "" : ""}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left: Fields ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 min-w-0">

            {/* Savol matni */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1.5">
                Savol matni {s.type !== "section-header" && <span className="text-red-400">*</span>}
              </label>
              <textarea rows={2} value={s.label} onChange={(e) => set("label", e.target.value)}
                placeholder={s.type === "section-header" ? "Bo'lim nomi…" : "Savol matnini yozing..."}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none transition-all" />
            </div>

            {/* Savol turi */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Savol turi</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {QUESTION_TYPES.map((t) => (
                  <button key={t.value} onClick={() => set("type", t.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${s.type === t.value ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50"}`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            {needsOptions && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">
                  Variantlar <span className="text-gray-300 font-normal normal-case">(tortib joyini o'zgartiring)</span>
                </label>
                <div className="space-y-2">
                  {s.options.map((opt, i) => (
                    <OptionRow key={opt._key} opt={opt} index={i} total={s.options.length}
                      onChange={(f, v) => updateOption(i, f, v)}
                      onDelete={() => removeOption(i)}
                      onMove={(d) => moveOption(i, d)}
                      isDragging={dragIdx.current === i}
                      onDragStart={() => { dragIdx.current = i; }}
                      onDragOver={() => {}}
                      onDrop={() => {
                        if (dragIdx.current === null || dragIdx.current === i) return;
                        const opts = [...s.options];
                        const [moved] = opts.splice(dragIdx.current, 1);
                        opts.splice(i, 0, moved);
                        setS((prev) => ({ ...prev, options: opts }));
                        dragIdx.current = null;
                      }}
                    />
                  ))}
                </div>
                <button onClick={addOption}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Variant qo'shish
                </button>
              </div>
            )}

            {/* Placeholder */}
            {needsPlaceholder && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Placeholder matni</label>
                <input value={s.placeholder} onChange={(e) => set("placeholder", e.target.value)}
                  placeholder="Foydalanuvchi uchun misol matn…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all" />
              </div>
            )}

            {/* Numeric range */}
            {needsNumeric && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Min / Max / Qadam</label>
                <div className="grid grid-cols-3 gap-2">
                  {([["min", "Min"], ["max", "Max"], ["step", "Qadam"]] as const).map(([k, pl]) => (
                    <div key={k}>
                      <p className="text-[10px] text-gray-400 mb-1">{pl}</p>
                      <input type="number" value={(s as any)[k]} onChange={(e) => set(k as any, e.target.value)}
                        placeholder={pl}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help text */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Yordam matni / tavsif</label>
              <input value={s.helpText} onChange={(e) => set("helpText", e.target.value)}
                placeholder="Foydalanuvchiga qo'shimcha izoh…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all" />
            </div>

            {/* Toggles row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Majburiy</p>
                  <p className="text-xs text-gray-400">* belgisi qo'shiladi</p>
                </div>
                <Toggle checked={s.required} onChange={(v) => set("required", v)} size="sm" />
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />Yadro</p>
                  <p className="text-xs text-amber-600">Barcha kategoriyada</p>
                </div>
                <Toggle checked={s.isCore} onChange={(v) => set("isCore", v)} size="sm" />
              </div>
            </div>

            {/* Conditional display */}
            {validQuestions.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => set("condEnabled", !s.condEnabled)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Shartli ko'rinish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.condEnabled && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">YOQIQ</span>}
                    <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${s.condEnabled ? "rotate-90" : ""}`} />
                  </div>
                </button>
                {s.condEnabled && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-blue-50/30">
                    <p className="text-xs text-gray-500">Bu savolni faqat quyidagi shart bajarilganda ko'rsatish:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1">Savol</p>
                        <select value={s.condQuestionId} onChange={(e) => set("condQuestionId", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-300">
                          <option value="">Tanlang…</option>
                          {validQuestions.map((q) => (
                            <option key={q.id} value={q.id}>{q.label.slice(0, 40)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1">Javob qiymati</p>
                        {s.condQuestionId && validQuestions.find(q => q.id === s.condQuestionId)?.options?.length ? (
                          <select value={s.condValue} onChange={(e) => set("condValue", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-300">
                            <option value="">Tanlang…</option>
                            {validQuestions.find(q => q.id === s.condQuestionId)?.options?.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input value={s.condValue} onChange={(e) => set("condValue", e.target.value)}
                            placeholder="Ha yoki yo'q…"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Live Preview ── */}
          {showPreview && (
            <div className="hidden sm:flex w-72 flex-shrink-0 border-l border-gray-100 bg-gray-50/60 flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ko'rinish</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <QuestionPreview q={s} />
                </div>
                {s.condEnabled && s.condQuestionId && (
                  <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-medium">Bu savol faqat shart bajarilganda ko'rinadi</p>
                  </div>
                )}
                {s.isCore && (
                  <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5 fill-yellow-400" />
                    <p className="text-xs text-yellow-700 font-medium">Yadro savol — barcha kategoriyalarda ko'rinadi</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 font-semibold border-gray-200">Bekor qilish</Button>
          <Button onClick={handleSave} disabled={!s.label.trim() && s.type !== "section-header"}
            className="flex-1 font-bold bg-blue-600 hover:bg-blue-700 gap-2 disabled:opacity-40">
            <Save className="w-4 h-4" /> Qo'shish
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Question Card ──────────────────────────────────────────────── */
function QuestionCard({
  q, index, total,
  onEdit, onDelete, onMove,
}: {
  q: Question; index: number; total: number;
  onEdit: () => void; onDelete: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const hasOther = q.options?.some(o => o.isOther);
  const typeLabel = TYPE_LABELS[q.type] ?? q.type;

  if (q.type === "section-header") {
    return (
      <div className="group flex items-center gap-3 px-5 py-3 bg-blue-50 border-b border-gray-50 hover:bg-blue-100 transition-colors">
        <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="flex-1 text-sm font-extrabold text-blue-700">{q.label}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="group px-5 py-3.5 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
        <button onClick={() => onMove(-1)} disabled={index === 0}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">{q.label}</p>
          {q.required && <span className="text-red-500 text-xs font-bold">*</span>}
          {q.isCore && <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />}
          {q.conditional && <GitBranch className="w-3 h-3 text-blue-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{typeLabel}</span>
          {q.options && (
            <span className="text-[11px] text-gray-400">{q.options.length} variant</span>
          )}
          {hasOther && (
            <span className="text-[11px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">+ Boshqa</span>
          )}
          {q.options && q.options.length > 0 && (
            <span className="text-[11px] text-gray-300 truncate max-w-[160px]">
              {q.options.slice(0, 3).map(o => o.label).join(", ")}{q.options.length > 3 ? "…" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={onEdit} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Questions Panel (reusable for category + common) ─────────────── */
function QuestionsPanel({
  title, emoji, subtitle,
  questions, onChange, allQuestionsForCond,
  accent = "blue",
}: {
  title: string; emoji?: string; subtitle?: string;
  questions: Question[];
  onChange: (qs: Question[]) => void;
  allQuestionsForCond: Question[];
  accent?: "blue" | "amber";
}) {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const qs = [...questions];
    [qs[i], qs[j]] = [qs[j], qs[i]];
    onChange(qs);
  }
  function del(i: number) {
    onChange(questions.filter((_, idx) => idx !== i));
  }
  function save(q: Question) {
    let qs: Question[];
    if (editingIdx !== null) {
      qs = questions.map((orig, i) => (i === editingIdx ? q : orig));
    } else {
      qs = [...questions, q];
    }
    onChange(qs);
    setEditorState(null);
    setEditingIdx(null);
    setShowAdd(false);
  }

  const borderColor = accent === "amber" ? "border-amber-200" : "border-gray-100";
  const headerBg = accent === "amber" ? "bg-amber-50" : "bg-white";
  const addColor = accent === "amber" ? "text-amber-600 hover:text-amber-700" : "text-blue-600 hover:text-blue-700";

  return (
    <div className={`bg-white rounded-2xl border ${borderColor} overflow-hidden mb-4 shadow-sm`}>
      <div className={`px-5 py-4 border-b border-gray-50 ${headerBg} flex items-center gap-3`}>
        {emoji && <span className="text-2xl leading-none">{emoji}</span>}
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">{questions.length} savol</span>
      </div>

      {questions.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">Hali savol yo'q</p>
        </div>
      )}

      <div>
        {questions.map((q, i) => (
          <QuestionCard key={q.id} q={q} index={i} total={questions.length}
            onEdit={() => { setEditorState(editorFromQuestion(q)); setEditingIdx(i); }}
            onDelete={() => del(i)}
            onMove={(d) => move(i, d)} />
        ))}
      </div>

      <div className="px-5 py-4 border-t border-gray-50">
        <button onClick={() => { setShowAdd(true); setEditorState(null); setEditingIdx(null); }}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors ${addColor}`}>
          <Plus className="w-4 h-4" /> Savol qo'shish
        </button>
      </div>

      <AnimatePresence>
        {(editorState !== null || showAdd) && (
          <QuestionEditorModal
            initial={editorState ?? undefined}
            allQuestions={allQuestionsForCond}
            onSave={save}
            onClose={() => { setEditorState(null); setEditingIdx(null); setShowAdd(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Category Panel (wraps QuestionsPanel + system Q toggles) ────── */
function CategoryPanel({
  cat, onChange,
  commonQuestions,
}: {
  cat: CategoryConfig;
  onChange: (c: CategoryConfig) => void;
  commonQuestions: Question[];
}) {
  const allQuestionsForCond = [...cat.questions, ...commonQuestions];

  return (
    <QuestionsPanel
      title={cat.name}
      emoji={cat.emoji}
      subtitle={`${cat.questions.length} ta o'ziga xos savol · ${commonQuestions.length} ta umumiy savol qo'shiladi`}
      questions={cat.questions}
      onChange={(qs) => onChange({ ...cat, questions: qs })}
      allQuestionsForCond={allQuestionsForCond}
    />
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────── */
export default function AdminQuestionsPage() {
  const [authed, setAuthed] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig[]>(getCategories);
  const [commonQuestions, setCommonQuestions] = useState<Question[]>(getCommonQuestions);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function updateCategory(updated: CategoryConfig) {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setDirty(true);
    setSaved(false);
  }

  function updateCommon(qs: Question[]) {
    setCommonQuestions(qs);
    setDirty(true);
    setSaved(false);
  }

  function handleSave() {
    saveCategories(categories);
    saveCommonQuestions(commonQuestions);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    resetCategories();
    resetCommonQuestions();
    setCategories(getCategories());
    setCommonQuestions(getCommonQuestions());
    setDirty(false);
    setSaved(false);
    setShowResetConfirm(false);
  }

  const displayed = activeTab && activeTab !== "common"
    ? categories.filter((c) => c.id === activeTab)
    : categories;

  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-sm text-gray-900 truncate">Savollar boshqaruvi</p>
            <p className="text-xs text-gray-400">{categories.length} ta kategoriya · {commonQuestions.length} ta umumiy savol</p>
          </div>
          {dirty && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3" /> Saqlanmagan
            </span>
          )}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Asl holatga qaytarish">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={handleSave}
            className={`h-9 px-4 font-bold text-sm gap-2 flex-shrink-0 transition-all ${saved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"}`}>
            {saved ? <><Check className="w-4 h-4" /> Saqlandi!</> : <><Save className="w-4 h-4" /> Saqlash</>}
          </Button>
        </div>

        {/* Category tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === null ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Hammasi
          </button>
          <button onClick={() => setActiveTab("common")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${activeTab === "common" ? "bg-amber-500 text-white shadow-sm" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>
            <Star className="w-3 h-3 fill-current" /> Umumiy
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveTab(activeTab === c.id ? null : c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === c.id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Common questions tab */}
        {(activeTab === null || activeTab === "common") && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <QuestionsPanel
              title="Umumiy savollar (Barcha kategoriyalar)"
              emoji="⭐"
              subtitle="Bu savollar har bir kategoriyaning oxirida avtomatik qo'shiladi"
              questions={commonQuestions}
              onChange={updateCommon}
              allQuestionsForCond={commonQuestions}
              accent="amber"
            />
          </motion.div>
        )}

        {/* Category panels */}
        {activeTab !== "common" && (
          <AnimatePresence mode="popLayout">
            {displayed.map((cat) => (
              <motion.div key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}>
                <CategoryPanel cat={cat} onChange={updateCategory} commonQuestions={commonQuestions} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        <p className="text-center text-xs text-gray-400 mt-4 pb-8">
          O'zgarishlar faqat "Saqlash" tugmasini bosganingizda qo'llanadi
        </p>
      </div>

      {/* ── Reset confirm modal ── */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowResetConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 w-full max-w-sm shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-extrabold text-gray-900 mb-2">Qayta tiklash</h3>
                <p className="text-sm text-gray-500 mb-6">Barcha savol konfiguratsiyasi <strong>asl holatga</strong> qaytariladi. Bu amalni bekor qilib bo'lmaydi.</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowResetConfirm(false)} className="flex-1 border-gray-200 font-semibold">Bekor</Button>
                  <Button onClick={handleReset} className="flex-1 bg-red-500 hover:bg-red-600 font-bold text-white">Ha, tiklash</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
