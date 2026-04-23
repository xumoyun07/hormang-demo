/**
 * CustomerReviewsSheet — bottom-sheet showing all reviews about a customer.
 * Layered at z-[72]/z-[73] so it appears above the public profile modal (z-[61]).
 * Customer reviews never have metric sliders.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserRound } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import {
  getAverageRatingForUser,
  getReviewsForUser,
  type Review,
} from "@/lib/completion-store";
import { getLocalProfile } from "@/lib/local-profile";
import { formatDate } from "@/lib/date-utils";

const VIOLET = "hsl(262,80%,54%)";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2) || "X";
}

function getReviewerMeta(review: Review) {
  const local = getLocalProfile(review.reviewerId);
  const name = review.reviewerName || "Ijrochi";
  return {
    name,
    initials: review.reviewerInitials || initials(name),
    color: review.reviewerColor || VIOLET,
    photoUrl: local.photoUrl,
  };
}

/* ── Detail Modal ─────────────────────────────────────────────────────── */
function ReviewDetailModal({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const meta = getReviewerMeta(review);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(10,10,30,0.62)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[81] flex justify-center"
      >
        <div
          className="bg-white w-full max-w-lg rounded-t-3xl flex flex-col"
          style={{ maxHeight: "88dvh", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-4 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {meta.photoUrl ? (
                <img src={meta.photoUrl} alt={meta.name} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0"
                  style={{ background: meta.color }}
                >
                  {meta.initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-black text-gray-900 truncate">{meta.name}</p>
                <p className="text-xs font-semibold text-gray-400">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 pb-8 space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <StarRating rating={review.rating} size="w-5 h-5" />
                {review.serviceCategory && (
                  <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                    {review.serviceCategory}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                {review.comment || "Izoh qoldirilmagan."}
              </p>
            </div>

            {review.photoUrl && (
              <img
                src={review.photoUrl}
                alt="Sharh rasmi"
                className="w-full h-52 object-cover rounded-2xl border border-gray-100"
              />
            )}

            {(review.platformSentiment || review.platformFeedback) && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-sm font-black text-gray-900 mb-1">Hormang haqida fikri</p>
                <p className="text-sm text-gray-600">{review.platformFeedback || "Qo'shimcha izoh yo'q."}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Review row ───────────────────────────────────────────────────────── */
function ReviewRow({ review, onOpen }: { review: Review; onOpen: () => void }) {
  const meta = getReviewerMeta(review);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-2">
        {meta.photoUrl ? (
          <img src={meta.photoUrl} alt={meta.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: meta.color }}
          >
            {meta.initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm truncate">{meta.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size="w-3.5 h-3.5" />
            <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
          {review.comment}
        </p>
      )}

      <button
        onClick={onOpen}
        className="w-full h-9 rounded-xl bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
      >
        Batafsil
      </button>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────── */
export function CustomerReviewsSheet({
  customerId,
  customerName,
  onClose,
}: {
  customerId: string;
  customerName: string;
  onClose: () => void;
}) {
  const reviews = getReviewsForUser(customerId, "customer").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const avg = getAverageRatingForUser(customerId, "customer");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[72]"
        style={{ background: "rgba(10,10,30,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%", opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[73] flex justify-center"
      >
        <div
          className="bg-gray-50 w-full max-w-lg rounded-t-3xl flex flex-col"
          style={{ maxHeight: "88dvh", boxShadow: "0 -8px 40px rgba(0,0,0,0.20)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <div>
              <p className="font-black text-gray-900">{customerName}</p>
              <p className="text-xs text-gray-400">Ijrochilar qoldirgan fikrlar</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3 pb-6">
            <div
              className="rounded-2xl border border-gray-100 p-4 shadow-sm"
              style={{ background: "linear-gradient(-55deg, #c9d9ff, #ffffff)" }}
            >
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mb-2">Umumiy baho</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-gray-900">
                  {avg > 0 ? avg.toFixed(1) : "—"}
                </span>
                <StarRating rating={avg} size="w-5 h-5" />
                <span className="text-sm text-gray-500 ml-1">{reviews.length} ta sharh</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <UserRound className="w-7 h-7 text-gray-400" />
                </div>
                <p className="font-black text-gray-700 mb-1">Hozircha sharh yo'q</p>
                <p className="text-xs text-gray-400">Yakunlangan xizmatlardan keyin sharhlar bu yerda ko'rinadi.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  onOpen={() => setSelectedReview(review)}
                />
              ))
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedReview && (
          <ReviewDetailModal
            key={selectedReview.id}
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
