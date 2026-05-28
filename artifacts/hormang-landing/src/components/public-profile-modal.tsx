/**
 * PublicProfileModal — Unified profile bottom-sheet used everywhere a user
 * clicks on another user's name/avatar to see their public profile.
 *
 * mode="provider"  → violet hero, photo/initials, experience, service areas,
 *                     portfolio, avg-response-time, categories, bio.
 * mode="customer"  → blue hero, initials, location, joined date, rating stub.
 *
 * Phone number is NEVER shown.
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, ShieldCheck, Star, MessageCircle,
  Award, Briefcase,
} from "lucide-react";
import { getLocalProfile, getServiceAreaLabels } from "@/lib/local-profile";
import { ImageGrid } from "@/components/image-grid";
import { CategoryIcon } from "@/components/category-icon";
import { formatMonthYear } from "@/lib/date-utils";
import { useI18n } from "@/contexts/i18n-context";
import { tFormat } from "@/lib/i18n";

/* ─── Theme ────────────────────────────────────────────────────────── */
const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";
const BLUE   = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

/* ─── Helpers ──────────────────────────────────────────────────────── */
function memberSince(iso: string, months: string[]): string {
  return formatMonthYear(iso, months);
}

function deriveInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";
}

/* ─── Prop types ───────────────────────────────────────────────────── */

export interface ProviderProfileData {
  masterId: string;
  masterName: string;
  masterInitials: string;
  masterColor: string;
  avgResponseTime?: number;
  categoryName?: string;
  categoryEmoji?: string;
}

export interface CustomerProfileData {
  customerName: string;
  customerInitials?: string;
  customerColor?: string;
  /**
   * Preferred: pass the customer's userId so the sheet can auto-load
   * their photo from localStorage (mirrors what ProviderSheet does with masterId).
   */
  customerId?: string;
  /** Explicit photo override — used when customerId is not available. */
  photoUrl?: string;
  region?: string;
  district?: string;
  joinedAt?: string;
  categoryName?: string;
  categoryEmoji?: string;
}

export interface PublicProfileModalProps {
  mode: "provider" | "customer";
  providerData?: ProviderProfileData;
  customerData?: CustomerProfileData;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════════════
   Provider variant
   ═══════════════════════════════════════════════════════════════════ */
function ProviderSheet({ data, onClose }: { data: ProviderProfileData; onClose: () => void }) {
  const { t } = useI18n();
  const tt = t.publicProfileModal;
  const local = getLocalProfile(data.masterId);

  const serviceAreas = getServiceAreaLabels(local);

  const albums = local.albums ?? [];
  const allPhotos = albums.flatMap((a) => a.photos.map((p) => p.url));

  /* Bio and categories are now first-class fields in LocalProfile,
     written by settings.tsx on every auto-save and explicit save. */
  const bio = local.bio;
  const categories = local.categories;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* ── Hero banner ── */}
        <div className="relative px-5 pt-6 pb-5 flex-shrink-0" style={{ background: VIOLET }}>
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end gap-4">
            {/* Avatar */}
            {local.photoUrl ? (
              <img
                src={local.photoUrl}
                alt={data.masterName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0 shadow-lg"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl border-2 border-white/30 flex items-center justify-center flex-shrink-0 font-black text-white text-xl shadow-lg"
                style={{ background: data.masterColor }}
              >
                {data.masterInitials}
              </div>
            )}

            {/* Name + role */}
            <div className="flex-1 min-w-0 pb-1">
              <h3 className="font-extrabold text-white text-lg leading-tight truncate">
                {data.masterName}
              </h3>
              <p className="text-violet-200 text-sm">{tt.providerRole}</p>
              {local.experience !== undefined && local.experience > 0 && (
                <p className="text-violet-100 text-xs mt-0.5 font-semibold">
                  {tFormat(tt.yearsExpTpl, { n: local.experience })}
                </p>
              )}
            </div>
          </div>

          {/* Category pill (contextual) */}
          {data.categoryName && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 border border-white/25 text-white">
                {data.categoryEmoji && (
                  <CategoryIcon
                    categoryId={(data as { categoryId?: string | null }).categoryId ?? null}
                    emoji={data.categoryEmoji}
                    size={14}
                    bare
                    className="text-white"
                  />
                )}
                {data.categoryName}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">

          {/* Verified badge */}
          <div className="flex items-center gap-2.5 bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">{tt.verified}</p>
          </div>

          {/* Avg response time */}
          {data.avgResponseTime !== undefined && (
            <div className="flex items-center gap-3 bg-violet-50 rounded-2xl p-3.5 border border-violet-100">
              <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">{tt.avgResponseLabel}</p>
                <p className="text-sm font-bold text-violet-800">{tFormat(tt.minutesTpl, { n: data.avgResponseTime })}</p>
              </div>
            </div>
          )}

          {/* Experience chip */}
          {local.experience !== undefined && local.experience > 0 && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <Award className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tt.experience}</p>
                <p className="text-sm font-bold text-gray-800">{tFormat(tt.yearsTpl, { n: local.experience })}</p>
              </div>
            </div>
          )}

          {/* Service areas */}
          {serviceAreas.length > 0 && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
                  {tt.serviceAreas}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-0.5"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
                  {tt.serviceTypes}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-2 py-0.5"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          {bio && (
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">{tt.bio}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{bio}</p>
            </div>
          )}

          {/* Rating stub */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tt.rating}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 h-3 text-gray-200 fill-gray-200" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-black text-gray-900">0.0</p>
              <p className="text-xs text-gray-400">{tt.ratingPlaceholderTpl}</p>
            </div>
          </div>

          {/* Portfolio albums */}
          {albums.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                {tFormat(tt.portfolioTpl, { photos: allPhotos.length, albums: albums.length })}
              </p>
              {albums.map((album) => (
                <div key={album.id}>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">
                    {album.title} <span className="text-gray-400 font-normal">{tFormat(tt.albumCountTpl, { n: album.photos.length })}</span>
                  </p>
                  <ImageGrid
                    urls={album.photos.map((p) => p.url)}
                    maxVisible={6}
                    columns={3}
                    compact
                  />
                </div>
              ))}
            </div>
          )}

          {/* Completed services */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tt.completedServices}</p>
              <p className="text-sm font-bold text-gray-800">{tFormat(tt.servicesCountTpl, { n: 0 })}</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 pb-1">
            {tt.privacyNote}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {tt.close}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Customer variant
   ═══════════════════════════════════════════════════════════════════ */
function CustomerSheet({ data, onClose }: { data: CustomerProfileData; onClose: () => void }) {
  const { t } = useI18n();
  const tt = t.publicProfileModal;
  const name = data.customerName?.trim() || tt.fallbackCustomer;
  const initials = data.customerInitials ?? deriveInitials(name);
  const color = data.customerColor ?? "hsl(221,78%,48%)";
  const location = data.district
    ? `${data.district}, ${data.region}`
    : data.region ?? "";
  const joined = data.joinedAt ? memberSince(data.joinedAt, t.shared.months) : null;

  /* Auto-load photo from customer's local profile (same pattern as ProviderSheet).
     Explicit data.photoUrl is the fallback when no customerId is available. */
  const customerLocal = data.customerId ? getLocalProfile(data.customerId) : null;
  const photoUrl = customerLocal?.photoUrl ?? data.photoUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* ── Hero ── */}
        <div className="px-5 pt-6 pb-5 text-center flex-shrink-0" style={{ background: BLUE }}>
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-lg border-2 border-white/25"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg border-2 border-white/25"
              style={{ background: color }}
            >
              <span className="text-2xl font-black text-white">{initials}</span>
            </div>
          )}

          <h3 className="font-extrabold text-white text-lg">{name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-blue-100 text-xs font-semibold">{tt.customerRole}</span>
            {joined && (
              <>
                <span className="text-blue-200 text-xs">·</span>
                <span className="text-blue-100 text-xs">{joined}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">

          {/* Category context */}
          {data.categoryName && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-3.5 border border-blue-100">
              <span className="text-xl flex-shrink-0">{data.categoryEmoji || "📋"}</span>
              <div>
                <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">{tt.requestCategory}</p>
                <p className="text-sm font-bold text-blue-800">{data.categoryName}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tt.location}</p>
                <p className="text-sm font-bold text-gray-800">{location}</p>
              </div>
            </div>
          )}

          {/* Rating stub — clickable for future reviews */}
          <button className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-colors hover:bg-blue-50/50 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{tt.feedback}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-gray-900">0.0</p>
                <p className="text-xs text-gray-400 mt-0.5">{tFormat(tt.feedbackCountTpl, { n: 0 })}</p>
              </div>
              <MessageCircle className="w-5 h-5 text-gray-300" />
            </div>
          </button>

          {/* Privacy note */}
          <p className="text-center text-xs text-gray-400 pb-1">
            {tt.privacyNoteCustomer}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {tt.close}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Unified export
   ═══════════════════════════════════════════════════════════════════ */
export function PublicProfileModal({ mode, providerData, customerData, onClose }: PublicProfileModalProps) {
  if (mode === "provider" && providerData) {
    return <ProviderSheet data={providerData} onClose={onClose} />;
  }
  if (mode === "customer" && customerData) {
    return <CustomerSheet data={customerData} onClose={onClose} />;
  }
  return null;
}
