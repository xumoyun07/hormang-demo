/**
 * AcceptConfirmModal — Shared checklist confirmation before accepting an offer.
 * Used by both the OfferCard (list view) and OfferDetailModal (Batafsil).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPT_CHECKLIST = [
  "Men taklif tafsilotlari (narx, muddat, shartlar) bilan tanishib chiqdim va tushundim",
  "Men ijrochi bilan hurmat va etiket doirasida muloqot qilaman",
  "Men ijrochi uchun xizmat yuzasidan kerakli ma'lumot va imkoniyatlarni taqdim etaman",
];

interface AcceptConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function AcceptConfirmModal({ onConfirm, onCancel }: AcceptConfirmModalProps) {
  const [checks, setChecks] = useState([false, false, false, false]);
  const allChecked = checks.every(Boolean);

  function toggle(i: number) {
    setChecks((prev) => prev.map((v, idx) => idx === i ? !v : v));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-base">Taklifni qabul qilish</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Ijrochi taklifini qabul qilishdan oldin quyidagilar bilan tanishib chiqing:
          </p>
          <ul className="mt-1.5 text-xs text-gray-500 space-y-0.5 pl-3">
            <li>• 1 ta so'rovga faqat 1 ta taklif qabul qilish mumkin;</li>
            <li>• Taklifni qabul qilishdan oldin qolgan ijrochilar bilan batafsil muhokama qilishingiz mumkin;</li>
          </ul>
        </div>

        {/* Checklist */}
        <div className="px-5 py-4 space-y-3">
          {ACCEPT_CHECKLIST.map((label, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-3 text-left"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                checks[i] ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"
              }`}>
                {checks[i] && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-gray-700 leading-relaxed">{label}</span>
            </button>
          ))}

          {/* 4th item with link */}
          <button
            onClick={() => toggle(3)}
            className="w-full flex items-start gap-3 text-left"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              checks[3] ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"
            }`}>
              {checks[3] && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs text-gray-700 leading-relaxed">
              Platforma{" "}
              <span
                className="text-blue-600 underline"
                onClick={(e) => e.stopPropagation()}
              >
                shartlari va qoidalariga
              </span>{" "}
              roziman
            </span>
          </button>
        </div>

        {/* Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 rounded-2xl text-sm font-bold border-gray-200 text-gray-600"
          >
            Bekor qilish
          </Button>
          <Button
            onClick={() => { if (allChecked) onConfirm(); }}
            disabled={!allChecked}
            className="flex-1 h-11 rounded-2xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Qabul qilaman
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
