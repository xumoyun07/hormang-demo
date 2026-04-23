import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, UserRound, X } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { BottomNav } from "@/components/bottom-nav";
import { PublicProfilePreviewModal } from "@/components/public-profile-preview-modal";
import { useAuth } from "@/contexts/auth-context";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import {
  getAverageRatingForUser,
  getReviewsForUser,
  type Review,
} from "@/lib/completion-store";
import { getLocalProfile } from "@/lib/local-profile";
import { formatDate } from "@/lib/date-utils";

const VIOLET = "hsl(262,80%,54%)";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "X";
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

/* ── Detail modal ─────────────────────────────────────────────────────── */
function ReviewPreviewModal({
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
        className="fixed inset-0 z-[70]"
        style={{ background: "rgba(10,10,30,0.62)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[71] flex justify-center"
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
              <div className="flex items-center justify-between gap-3 mb-3">
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
                <p className="text-sm text-gray-600">
                  {review.platformFeedback || "Qo'shimcha izoh yo'q."}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Review card ──────────────────────────────────────────────────────── */
function ReviewCard({
  review,
  onPreview,
  onProfile,
}: {
  review: Review;
  onPreview: () => void;
  onProfile: () => void;
}) {
  const meta = getReviewerMeta(review);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 card-shadow p-4"
    >
      <div className="flex items-start gap-3">
        <button onClick={onProfile} className="flex-shrink-0 active:scale-95 transition-transform">
          {meta.photoUrl ? (
            <img src={meta.photoUrl} alt={meta.name} className="w-12 h-12 rounded-2xl object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black"
              style={{ background: meta.color }}
            >
              {meta.initials}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={onProfile} className="font-black text-gray-900 text-left truncate block w-full">
            {meta.name}
          </button>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <StarRating rating={review.rating} />
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
          {review.serviceCategory && (
            <p className="text-[11px] font-bold text-blue-600 mt-1">{review.serviceCategory}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mt-3 line-clamp-3">
        {review.comment || "Izoh qoldirilmagan."}
      </p>

      <button
        onClick={onPreview}
        className="mt-3 w-full h-10 rounded-2xl bg-blue-50 text-blue-700 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
      >
        Sharhni ko'rish
      </button>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function CustomerReviewsPage() {
  useStoreRefresh();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const customerId = user?.id ?? "";

  const reviews = getReviewsForUser(customerId, "customer").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const avg = getAverageRatingForUser(customerId, "customer");

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [profileReview, setProfileReview] = useState<Review | null>(null);
  const profileMeta = profileReview ? getReviewerMeta(profileReview) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/request-history")}
            className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-gray-900 text-lg">Baholashlarim</h1>
            <p className="text-xs text-gray-400">Ijrochilar qoldirgan fikrlar</p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4">
        <div
          className="rounded-2xl border border-gray-100 p-4 shadow-sm mb-4"
          style={{ background: "linear-gradient(-55deg, #c9d9ff, #ffffff)" }}
        >
          <p className="text-[11px] uppercase font-bold tracking-wide text-gray-500 mb-1">Umumiy baho</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-3xl font-bold text-gray-900">
              {avg > 0 ? avg.toFixed(1) : "—"}
            </span>
            <StarRating rating={avg} size="w-5 h-5" />
            <span className="text-sm text-gray-500">{reviews.length} ta sharh</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <UserRound className="w-7 h-7 text-gray-400" />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">Hozircha sharh yo'q</h2>
            <p className="text-sm text-gray-400">
              Yakunlangan xizmatlardan keyin ijrochilar baholari shu yerda ko'rinadi
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onPreview={() => setSelectedReview(review)}
                onProfile={() => setProfileReview(review)}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedReview && (
          <ReviewPreviewModal
            key={selectedReview.id}
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileReview && profileMeta && (
          <PublicProfilePreviewModal
            key={`reviewer-${profileReview.reviewerId}`}
            mode="provider"
            providerData={{
              masterId: profileReview.reviewerId,
              masterName: profileMeta.name,
              masterInitials: profileMeta.initials,
              masterColor: profileMeta.color,
            }}
            onClose={() => setProfileReview(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
