import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Wallet, MapPin, Star, Repeat, BadgeCheck,
  CalendarDays, UserRound, FileText, Image as ImageIcon, MessageSquare, X,
  ChevronRight,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { CategoryIcon } from "@/components/category-icon";
import { OfferDetailModal } from "@/components/offer-detail-modal";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { formatDate } from "@/lib/date-utils";
import { getCategoryDisplayName } from "@/lib/categories";
import { getRequestLocation } from "@/lib/regions";
import { getOfferById } from "@/lib/requests-store";
import {
  getServiceHistoryByIdForProvider,
  setPortfolio,
} from "@/lib/service-history-store";

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

function PhotoGrid({ photos, onOpen }: { photos: string[]; onOpen: (url: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((url, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onOpen(url)}
          className="aspect-square overflow-hidden rounded-xl border border-gray-100"
        >
          <img src={url} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Star; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-violet-600" />
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function ProviderHistoryDetailPage() {
  const storeVersion = useStoreRefresh();
  const { t, locale } = useI18n();
  const tt = t.providerHistory;
  const td = tt.detail;
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [zoom, setZoom] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const item = useMemo(
    () => (params.id && user?.id ? getServiceHistoryByIdForProvider(user.id, params.id) : undefined),
    [params.id, user?.id, storeVersion]
  );

  const offerSnap = useMemo(
    () => (item ? getOfferById(item.offerId) : undefined),
    [item?.offerId]
  );

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-black text-gray-800 text-lg mb-2">{td.notFoundTitle}</p>
        <p className="text-sm text-gray-500 mb-6">{td.notFoundDesc}</p>
        <Button onClick={() => navigate("/provider/history")} className="bg-violet-600 hover:bg-violet-700 font-bold">
          {td.back}
        </Button>
      </div>
    );
  }

  const location = (item.region || item.district)
    ? getRequestLocation({ location: item.locationName ?? "", region: item.region, district: item.district }, locale)
    : null;
  const beforePhotos = item.beforePhotos ?? [];
  const afterPhotos = item.afterPhotos ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/provider/history")}
            className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-gray-900 text-lg truncate">{td.title}</h1>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Hero */}
        <div className="rounded-3xl p-5 text-white" style={{ background: VIOLET }}>
          <div className="flex items-start gap-3">
            <CategoryIcon
              categoryId={item.categoryId}
              emoji={item.emoji}
              size={52}
              shape="square"
              className="flex-shrink-0 ring-2 ring-white/30"
            />
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg leading-tight">
                {getCategoryDisplayName(item.categoryId, locale, item.serviceTitle)}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 mt-1.5">
                <CheckCircle2 className="w-3 h-3" />
                {tt.card.completed}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">{td.finalPrice}</p>
              <p className="text-2xl font-black">{Number(item.finalPrice).toLocaleString()} {tt.sumSuffix}</p>
            </div>
            {typeof item.rating === "number" && (
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span className="font-black">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <Section icon={FileText} title={td.details}>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span>{formatDate(item.completedAt, { months: t.shared.months })}</span>
            </div>
            {item.customerName && (
              <div className="flex items-center gap-2 text-gray-700">
                <UserRound className="w-4 h-4 text-gray-400" />
                <span>{item.customerName}</span>
                {item.isRepeatCustomer && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    <Repeat className="w-3 h-3" />
                    {tt.repeatCustomer}
                  </span>
                )}
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>{Number(item.finalPrice).toLocaleString()} {tt.sumSuffix}</span>
            </div>
          </div>

          {/* Open offer/request detail modal */}
          {offerSnap && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="w-full flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 hover:bg-violet-50 hover:border-violet-100 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 flex-shrink-0 transition-colors" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-violet-600 transition-colors">
                    {td.requestDescription}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-violet-600 flex-shrink-0">
                  <span className="text-xs font-bold">{td.viewRequest}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}
        </Section>

        {/* Photos */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <Section icon={ImageIcon} title={td.photos}>
            {beforePhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-500 mb-2">{td.beforePhotos}</p>
                <PhotoGrid photos={beforePhotos} onOpen={setZoom} />
              </div>
            )}
            {afterPhotos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">{td.afterPhotos}</p>
                <PhotoGrid photos={afterPhotos} onOpen={setZoom} />
              </div>
            )}
          </Section>
        )}

        {/* Review */}
        {(typeof item.rating === "number" || item.review) && (
          <Section icon={MessageSquare} title={td.review}>
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={item.rating ?? 0} />
              {typeof item.rating === "number" && (
                <span className="text-sm font-black text-gray-800">{item.rating.toFixed(1)}</span>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{item.review || td.noReview}</p>
            <Button
              variant="outline"
              className="w-full h-10 mt-3 font-bold border-violet-200 text-violet-700"
              onClick={() => navigate("/provider-reviews")}
            >
              {td.viewReview}
            </Button>
          </Section>
        )}

        {/* Portfolio toggle */}
        <button
          type="button"
          onClick={() => setPortfolio(item.id, !item.isPortfolio)}
          className={`w-full rounded-2xl border p-4 flex items-center justify-between gap-3 transition-colors ${
            item.isPortfolio
              ? "bg-fuchsia-50 border-fuchsia-200"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-2.5 text-left">
            <BadgeCheck className={`w-5 h-5 flex-shrink-0 ${item.isPortfolio ? "text-fuchsia-600" : "text-gray-400"}`} />
            <div>
              <p className={`font-black text-sm ${item.isPortfolio ? "text-fuchsia-700" : "text-gray-800"}`}>
                {item.isPortfolio ? td.removeFromPortfolio : td.addToPortfolio}
              </p>
              <p className="text-xs text-gray-500">{td.portfolioHint}</p>
            </div>
          </div>
          <span
            className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${
              item.isPortfolio ? "bg-fuchsia-500 justify-end" : "bg-gray-200 justify-start"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow" />
          </span>
        </button>
      </main>

      {/* Existing offer detail modal (read-only) */}
      <AnimatePresence>
        {sheetOpen && offerSnap && (
          <OfferDetailModal
            key="history-offer-details"
            offer={offerSnap}
            readOnly
            onClose={() => setSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setZoom(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white"
              onClick={() => setZoom(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
