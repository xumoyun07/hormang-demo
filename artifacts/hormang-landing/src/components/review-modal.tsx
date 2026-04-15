/**
 * ReviewModal — bottom-sheet for leaving a star rating + optional comment.
 * Used after offer completion on both customer and provider sides.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";

interface ReviewModalProps {
  subjectName: string;
  subjectInitials: string;
  subjectColor: string;
  prompt?: string;
  onSubmit: (rating: number, text: string) => void;
  onSkip: () => void;
}

export function ReviewModal({
  subjectName,
  subjectInitials,
  subjectColor,
  prompt = "Xizmatni baholang",
  onSubmit,
  onSkip,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");

  function handleSubmit() {
    if (rating === 0) return;
    onSubmit(rating, text.trim());
  }

  const display = hovered || rating;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70]"
        style={{ background: "rgba(10,10,30,0.60)", backdropFilter: "blur(4px)" }}
        onClick={onSkip}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%", opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[71] flex justify-center"
      >
        <div
          className="bg-white w-full max-w-lg rounded-t-3xl px-5 pb-8 pt-4"
          style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.16)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Skip button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={onSkip}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-3 shadow-sm"
              style={{ background: subjectColor }}
            >
              {subjectInitials}
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
              {prompt}
            </p>
            <p className="font-extrabold text-gray-900 text-lg leading-tight text-center">
              {subjectName}
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star
                  className="w-9 h-9 transition-colors"
                  fill={star <= display ? "#F59E0B" : "none"}
                  stroke={star <= display ? "#F59E0B" : "#D1D5DB"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          {/* Optional comment */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Izoh qoldiring (ixtiyoriy)..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none transition-all mb-4"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="flex-1 h-11 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              O'tkazib yuborish
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1 h-11 rounded-2xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Yuborish ★
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
