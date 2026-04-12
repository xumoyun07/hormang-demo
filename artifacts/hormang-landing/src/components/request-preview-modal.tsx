/**
 * RequestPreviewModal — Customer-side read-only view of their own request.
 * Shows request Q&A, meta (urgency, budget, location), and customer photos.
 * Used from /my-requests so the customer can review what they submitted.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Clock, MapPin, DollarSign } from "lucide-react";
import {
  getAllQuestionsForCategory,
  collectActiveQuestions,
} from "@/lib/questionnaire-store";
import { ImageGrid, getAnswerImageUrls } from "@/components/image-grid";
import { formatDate } from "@/lib/date-utils";
import type { CustomerRequest } from "@/lib/requests-store";

/* ─── Skip keys (shown elsewhere in UI) ──────────────────────────── */
const SKIP_KEYS = new Set(["budget_open", "urgency", "budget", "region", "district"]);

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatAnswerValue(
  value: unknown,
  options?: { label: string; value: string; type?: string }[],
  otherText?: string,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && value.startsWith("data:")) return "__IMAGE__";
  if (typeof value === "boolean") return value ? "Ha" : "Yo'q";
  if (typeof value === "number")
    return value.toLocaleString("uz-Latn-UZ") + (String(value).length > 3 ? " so'm" : "");
  const otherOpt = options?.find((o) => o.type === "other");
  if (typeof value === "string") {
    if (otherOpt && value === otherOpt.value && otherText) return otherText;
    return options?.find((o) => o.value === value)?.label ?? value;
  }
  if (Array.isArray(value)) {
    return (value as string[])
      .map((v) => {
        if (otherOpt && v === otherOpt.value && otherText) return otherText;
        return options?.find((o) => o.value === v)?.label ?? v;
      })
      .join(", ");
  }
  return String(value);
}

const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  today_tomorrow: { label: "Bugun / ertaga", color: "text-red-600 bg-red-50 border border-red-100" },
  "3_7_days":     { label: "3–7 kun",        color: "text-orange-600 bg-orange-50 border border-orange-100" },
  "1_2_weeks":    { label: "1–2 hafta",       color: "text-yellow-700 bg-yellow-50 border border-yellow-100" },
  "1_month":      { label: "1 oy",            color: "text-emerald-600 bg-emerald-50 border border-emerald-100" },
  flexible:       { label: "Shoshilinch emas", color: "text-gray-500 bg-gray-100 border border-gray-200" },
};

/* ─── Component ───────────────────────────────────────────────────── */
interface Props {
  req: CustomerRequest;
  onClose: () => void;
}

export function RequestPreviewModal({ req, onClose }: Props) {
  const allQuestions = getAllQuestionsForCategory(req.categoryId);
  const activeQuestions = collectActiveQuestions(
    allQuestions,
    (req.answers ?? {}) as Record<string, unknown>,
  );

  const qaPairs = activeQuestions
    .filter((q) => !SKIP_KEYS.has(q.id))
    .map((q) => {
      const raw = req.answers?.[q.id];
      if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0))
        return null;
      const otherText = req.answers?.[q.id + "_other"] as string | undefined;
      const formatted = formatAnswerValue(raw, q.options, otherText);
      if (formatted === "__IMAGE__") return null;
      return { label: q.label, value: formatted };
    })
    .filter(Boolean) as { label: string; value: string }[];

  const photoUrls = req.answers ? getAnswerImageUrls(req.answers as Record<string, unknown>) : [];

  const urgency = req.answers?.["urgency"] as string | undefined;
  const urgInfo = urgency ? (URGENCY_MAP[urgency] ?? null) : null;
  const location = [req.district, req.region].filter(Boolean).join(", ");
  const budgetAnswer = req.answers?.["budget"];
  const openToOffers = req.answers?.["budget_open"] as boolean | undefined;
  const budgetLabel =
    openToOffers
      ? "Taklifga ochiq"
      : typeof budgetAnswer === "number"
      ? budgetAnswer.toLocaleString("uz-Latn-UZ") + " so'm"
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[92vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-extrabold text-base text-gray-900">So'rov tafsilotlari</h2>
            <p className="text-xs text-gray-400">Ko'rish rejimi · o'qish uchun</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">

            {/* Request top bar */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">
                  {req.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm text-gray-900">{req.categoryName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
                </div>
                {urgInfo && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${urgInfo.color}`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {urgInfo.label}
                  </span>
                )}
              </div>

              {/* Key meta */}
              {(location || budgetLabel) && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>{location}</span>
                    </div>
                  )}
                  {budgetLabel && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{budgetLabel}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Q&A pairs */}
            {qaPairs.length > 0 && (
              <div className="px-4 py-3 space-y-2.5 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Savol · Javob
                </p>
                {qaPairs.map((pair, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <div className="flex-shrink-0 w-1 rounded-full bg-blue-200 self-stretch" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-400 font-medium">{pair.label}:</span>
                      <span className="font-bold text-gray-800 ml-1">{pair.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer uploaded photos */}
            {photoUrls.length > 0 && (
              <div className="px-4 py-3">
                <ImageGrid urls={photoUrls} label="Mening rasmlarim" columns={3} />
              </div>
            )}

            {/* Empty state for Q&A */}
            {qaPairs.length === 0 && photoUrls.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-400">Qo'shimcha ma'lumot yo'q</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Yopish
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
