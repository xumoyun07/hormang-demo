/**
 * Admin Panel — Question Manager
 * Password: hormang2024
 * Allows viewing, adding, editing, deleting, and reordering questions per category.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Plus, Trash2, Edit3, ChevronUp, ChevronDown,
  Save, X, Check, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategories, saveCategories, COMMON_QUESTIONS, resetCategories,
  type CategoryConfig, type Question, type QuestionType,
} from "@/lib/questionnaire-store";
import logoImg from "/hormang-logo.png";

const ADMIN_PASSWORD = "hormang2024";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "single-select", label: "Bir tanlash" },
  { value: "multi-select", label: "Ko'p tanlash" },
  { value: "text", label: "Matn" },
  { value: "textarea", label: "Katta matn" },
  { value: "number", label: "Raqam" },
  { value: "yes-no", label: "Ha / Yo'q" },
  { value: "date", label: "Sana" },
  { value: "file", label: "Fayl yuklash" },
];

/* ─── Password Gate ──────────────────────────────────────────────── */
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-3xl border border-gray-100 p-8 w-full max-w-sm shadow-lg"
      >
        <div className="flex items-center gap-3 mb-8">
          <img src={logoImg} alt="Hormang" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-extrabold text-gray-900">Admin Panel</p>
            <p className="text-xs text-gray-400">Savollar boshqaruvi</p>
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Admin parolini kiriting"
                className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm transition-all ${
                  error
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:ring-blue-200"
                } focus:outline-none focus:ring-2`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1.5 font-medium">Parol noto'g'ri</p>}
          </div>
          <Button type="submit" className="w-full font-bold bg-blue-600 hover:bg-blue-700 py-3">
            Kirish
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Question Editor ─────────────────────────────────────────────── */
interface EditorState {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder: string;
  helpText: string;
  options: { label: string; value: string }[];
}

function blankEditor(): EditorState {
  return {
    id: `q_${Date.now()}`,
    label: "",
    type: "single-select",
    required: false,
    placeholder: "",
    helpText: "",
    options: [{ label: "", value: "" }],
  };
}

function editorFromQuestion(q: Question): EditorState {
  return {
    id: q.id,
    label: q.label,
    type: q.type,
    required: !!q.required,
    placeholder: q.placeholder ?? "",
    helpText: q.helpText ?? "",
    options: q.options?.length ? q.options.map((o) => ({ ...o })) : [{ label: "", value: "" }],
  };
}

function editorToQuestion(e: EditorState): Question {
  const q: Question = { id: e.id, label: e.label, type: e.type };
  if (e.required) q.required = true;
  if (e.placeholder) q.placeholder = e.placeholder;
  if (e.helpText) q.helpText = e.helpText;
  const needsOptions = e.type === "single-select" || e.type === "multi-select";
  if (needsOptions) {
    q.options = e.options.filter((o) => o.label && o.value);
  }
  return q;
}

function QuestionEditorModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: EditorState;
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<EditorState>(initial ?? blankEditor());

  const set = <K extends keyof EditorState>(k: K, v: EditorState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const needsOptions = state.type === "single-select" || state.type === "multi-select";

  function addOption() {
    setState((s) => ({ ...s, options: [...s.options, { label: "", value: "" }] }));
  }

  function removeOption(i: number) {
    setState((s) => ({ ...s, options: s.options.filter((_, idx) => idx !== i) }));
  }

  function updateOption(i: number, field: "label" | "value", val: string) {
    setState((s) => {
      const opts = s.options.map((o, idx) =>
        idx === i ? { ...o, [field]: val } : o
      );
      return { ...s, options: opts };
    });
  }

  function handleSave() {
    if (!state.label.trim()) return;
    onSave(editorToQuestion(state));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="bg-white rounded-3xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <p className="font-bold text-gray-900">{initial ? "Savolni tahrirlash" : "Yangi savol"}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Savol matni *</label>
            <textarea
              rows={2}
              value={state.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Savol matnini yozing..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Savol turi</label>
            <select
              value={state.type}
              onChange={(e) => set("type", e.target.value as QuestionType)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {needsOptions && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Variantlar</label>
              <div className="space-y-2">
                {state.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="Ko'rsatiladigan matn"
                      value={opt.label}
                      onChange={(e) => updateOption(i, "label", e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <input
                      placeholder="Qiymat (value)"
                      value={opt.value}
                      onChange={(e) => updateOption(i, "value", e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Variant qo'shish
                </button>
              </div>
            </div>
          )}

          {(state.type === "text" || state.type === "textarea" || state.type === "number") && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Placeholder</label>
              <input
                value={state.placeholder}
                onChange={(e) => set("placeholder", e.target.value)}
                placeholder="Misol matn..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={state.required}
              onChange={(e) => set("required", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-semibold text-gray-700">Majburiy savol</span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <Button variant="outline" onClick={onClose} className="flex-1 font-semibold border-gray-200">
            Bekor qilish
          </Button>
          <Button
            onClick={handleSave}
            disabled={!state.label.trim()}
            className="flex-1 font-bold bg-blue-600 hover:bg-blue-700 gap-2 disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> Saqlash
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Category Panel ──────────────────────────────────────────────── */
function CategoryPanel({
  cat,
  onChange,
}: {
  cat: CategoryConfig;
  onChange: (updated: CategoryConfig) => void;
}) {
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function moveQuestion(i: number, dir: -1 | 1) {
    const qs = [...cat.questions];
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    onChange({ ...cat, questions: qs });
  }

  function deleteQuestion(i: number) {
    onChange({ ...cat, questions: cat.questions.filter((_, idx) => idx !== i) });
  }

  function saveQuestion(q: Question) {
    let qs: Question[];
    if (editingIdx !== null) {
      qs = cat.questions.map((orig, i) => (i === editingIdx ? q : orig));
    } else {
      qs = [...cat.questions, q];
    }
    onChange({ ...cat, questions: qs });
    setEditing(null);
    setEditingIdx(null);
    setShowAdd(false);
  }

  const TYPE_LABELS: Record<string, string> = {
    "single-select": "Bir tanlash", "multi-select": "Ko'p tanlash",
    text: "Matn", textarea: "Katta matn", number: "Raqam",
    "yes-no": "Ha/Yo'q", date: "Sana", file: "Fayl",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <span className="text-xl">{cat.emoji}</span>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
          <p className="text-xs text-gray-400">{cat.questions.length} ta savol + 2 ta umumiy</p>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {cat.questions.map((q, i) => (
          <div key={q.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-gray-50 transition-colors">
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => moveQuestion(i, -1)}
                disabled={i === 0}
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveQuestion(i, 1)}
                disabled={i === cat.questions.length - 1}
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{q.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                  {TYPE_LABELS[q.type] ?? q.type}
                </span>
                {q.required && (
                  <span className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">Majburiy</span>
                )}
                {q.options && (
                  <span className="text-[11px] text-gray-400">{q.options.length} variant</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => { setEditing(editorFromQuestion(q)); setEditingIdx(i); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteQuestion(i)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Common questions — read only display */}
      <div className="border-t border-dashed border-gray-200 bg-gray-50 px-5 py-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Umumiy savollar (barcha kategoriyalar)</p>
        {COMMON_QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-center gap-2 py-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-gray-500 font-medium">{q.label}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-gray-50">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Savol qo'shish
        </button>
      </div>

      <AnimatePresence>
        {(editing || showAdd) && (
          <QuestionEditorModal
            initial={editing ?? undefined}
            onSave={saveQuestion}
            onClose={() => { setEditing(null); setEditingIdx(null); setShowAdd(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────── */
export default function AdminQuestionsPage() {
  const [authed, setAuthed] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig[]>(getCategories);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  function updateCategory(updated: CategoryConfig) {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSaved(false);
  }

  function handleSave() {
    saveCategories(categories);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (confirm("Barcha savol konfiguratsiyasi o'chiriladi. Davom etasizmi?")) {
      resetCategories();
      setCategories(getCategories());
    }
  }

  const displayed = activeTab ? categories.filter((c) => c.id === activeTab) : categories;

  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
          <div className="flex-1">
            <p className="font-extrabold text-sm text-gray-900">Admin — Savollar boshqaruvi</p>
            <p className="text-xs text-gray-400">{categories.length} ta kategoriya</p>
          </div>
          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Asl holatga qaytarish"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            onClick={handleSave}
            className={`h-9 px-4 font-bold text-sm gap-2 transition-all ${
              saved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saqlandi!" : "Saqlash"}
          </Button>
        </div>

        {/* Category tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeTab === null ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Hammasi
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(activeTab === c.id ? null : c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeTab === c.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="popLayout">
          {displayed.map((cat) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <CategoryPanel cat={cat} onChange={updateCategory} />
            </motion.div>
          ))}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-400 mt-6">
          O'zgarishlarni saqlash uchun "Saqlash" tugmasini bosing
        </p>
      </div>
    </div>
  );
}
