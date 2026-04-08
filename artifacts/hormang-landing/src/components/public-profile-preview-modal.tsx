/**
 * PublicProfilePreviewModal — Redesigned unified public profile bottom-sheet.
 *
 * mode="provider"  → circular avatar, role badge, metrics row, bio, categories, portfolio.
 * mode="customer"  → circular avatar, role badge, metrics row, location.
 *
 * Pure UI redesign — same data-fetching logic as PublicProfileModal.
 * Phone number is NEVER shown.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, ShieldCheck, Star,
  Briefcase, Award, ChevronRight,
} from "lucide-react";
import { getLocalProfile } from "@/lib/local-profile";
import type {
  ProviderProfileData,
  CustomerProfileData,
  PublicProfileModalProps,
} from "@/components/public-profile-modal";

/* ─── Theme ──────────────────────────────────────────────────────────── */
const VIOLET       = "hsl(262,80%,54%)";
const VIOLET_LIGHT = "hsl(262,80%,97%)";
const BLUE         = "hsl(221,78%,48%)";
const BLUE_LIGHT   = "hsl(221,78%,97%)";

/* ─── Helpers ────────────────────────────────────────────────────────── */
function deriveInitials(name: string): string {
  return name.split(" ").map((p) => p[0] ?? "").join("").toUpperCase().slice(0, 2) || "??";
}
function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-Latn-UZ", { month: "long", year: "numeric" });
}

/* ─── Metric cell ────────────────────────────────────────────────────── */
function MetricCell({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.FC<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-0.5 px-2">
      <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} />
      <span className="text-sm font-black text-gray-900 leading-none">{value}</span>
      <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">{label}</span>
    </div>
  );
}

/* ─── Category chip ──────────────────────────────────────────────────── */
function CategoryChip({ label }: { label: string }) {
  return (
    <span
      className="text-[11px] font-bold px-3 py-1 rounded-full border"
      style={{
        color: VIOLET,
        background: VIOLET_LIGHT,
        borderColor: "hsl(262,80%,88%)",
      }}
    >
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PROVIDER PREVIEW SHEET
   ═══════════════════════════════════════════════════════════════════════ */
function ProviderPreviewSheet({
  data,
  onClose,
}: {
  data: ProviderProfileData;
  onClose: () => void;
}) {
  const local = getLocalProfile(data.masterId);
  const portfolioItems = local.portfolioItems ?? [];
  const bio = local.bio;
  const categories = local.categories ?? [];
  const serviceAreas: string[] =
    local.serviceAreas?.length ? local.serviceAreas : local.region ? [local.region] : [];

  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(15,10,30,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[61] flex justify-center"
      >
        <div
          className="bg-white w-full max-w-lg rounded-t-[28px] overflow-hidden flex flex-col"
          style={{ maxHeight: "92dvh", boxShadow: "0 -8px 48px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Drag handle ── */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* ── Close button ── */}
          <div className="flex justify-end px-4 pb-1 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 px-5 pb-6">

            {/* Hero: avatar + name + badge */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Avatar */}
              <div className="relative mb-4">
                {local.photoUrl ? (
                  <img
                    src={local.photoUrl}
                    alt={data.masterName}
                    className="w-32 h-32 rounded-full object-cover"
                    style={{
                      border: `3px solid ${VIOLET}`,
                      boxShadow: `0 0 0 6px hsl(262,80%,93%), 0 8px 28px rgba(139,92,246,0.22)`,
                    }}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center font-black text-white text-4xl"
                    style={{
                      background: `linear-gradient(135deg, ${data.masterColor}, hsl(236,76%,60%))`,
                      border: "3px solid white",
                      boxShadow: `0 0 0 6px hsl(262,80%,93%), 0 8px 28px rgba(139,92,246,0.22)`,
                    }}
                  >
                    {data.masterInitials}
                  </div>
                )}
                {/* Verified badge */}
                <div
                  className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: VIOLET, border: "2.5px solid white" }}
                  title="Tasdiqlangan ijrochi"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">
                {data.masterName}
              </h2>

              {/* Role + experience badges */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span
                  className="text-xs font-black px-3 py-1 rounded-full text-white"
                  style={{ background: `linear-gradient(135deg, ${VIOLET}, hsl(236,76%,60%))` }}
                >
                  Ijrochi
                </span>
                {local.experience !== undefined && local.experience > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full text-violet-700 bg-violet-50 border border-violet-200">
                    <Award className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {local.experience} yil tajriba
                  </span>
                )}
              </div>
            </div>

            {/* ── Metrics row: Rating | Completed services | Verified ── */}
            <div
              className="flex items-center rounded-2xl border border-gray-100 py-4 mb-5"
              style={{ background: "hsl(262,80%,99%)" }}
            >
              <MetricCell
                icon={Star}
                value={<span>0.0 <span className="text-amber-400">★</span></span>}
                label="0 ta baho"
                color="hsl(37,95%,55%)"
              />
              <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
              <MetricCell
                icon={Briefcase}
                value="0 ta"
                label="Bajarilgan"
                color="hsl(160,60%,40%)"
              />
              <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
              <MetricCell
                icon={ShieldCheck}
                value="✓"
                label="Tasdiqlangan"
                color={VIOLET}
              />
            </div>

            {/* ── Service areas / Location ── */}
            {serviceAreas.length > 0 && (
              <div className="flex items-start gap-2.5 mb-4">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: VIOLET_LIGHT }}
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: VIOLET }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">
                    Xizmat ko'rsatadigan hududlar
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg px-2.5 py-1"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Bio ── */}
            {bio && (
              <div
                className="rounded-2xl p-4 mb-4 border border-violet-100"
                style={{ background: VIOLET_LIGHT }}
              >
                <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wide mb-1.5">
                  Bio
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{bio}</p>
              </div>
            )}

            {/* ── Categories ── */}
            {categories.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">
                  Xizmat turlari
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <CategoryChip key={cat} label={cat} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Portfolio ── */}
            {portfolioItems.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                    Portfolio
                  </p>
                  <span className="text-xs text-violet-600 font-bold flex items-center gap-0.5">
                    {portfolioItems.length} ta ish <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {portfolioItems.slice(0, 6).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setExpandedPhoto(item.url)}
                      className="relative group overflow-hidden rounded-xl aspect-square bg-gray-100 border border-gray-200 hover:border-violet-300 transition-colors"
                    >
                      <img
                        src={item.url}
                        alt={item.caption ?? `Ish ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-3">
                          <p className="text-[9px] text-white font-semibold truncate">{item.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Privacy note ── */}
            <p className="text-center text-[11px] text-gray-400 leading-relaxed mb-2">
              📵 Telefon raqam ko'rsatilmaydi — faqat platforma orqali aloqa
            </p>

            {/* ── Close button ── */}
            <button
              onClick={onClose}
              className="w-full h-12 rounded-2xl font-black text-sm text-white mt-2 transition-all active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${VIOLET}, hsl(236,76%,60%))` }}
            >
              Yopish
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Lightbox for portfolio photo ── */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.88)" }}
            onClick={() => setExpandedPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              src={expandedPhoto}
              alt="Portfolio"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOMER PREVIEW SHEET
   ═══════════════════════════════════════════════════════════════════════ */
function CustomerPreviewSheet({
  data,
  onClose,
}: {
  data: CustomerProfileData;
  onClose: () => void;
}) {
  const name     = data.customerName?.trim() || "Xaridor";
  const initials = data.customerInitials ?? deriveInitials(name);
  const color    = data.customerColor ?? BLUE;
  const joined   = data.joinedAt ? memberSince(data.joinedAt) : null;
  const location = data.district
    ? `${data.district}, ${data.region}`
    : data.region ?? "";

  const customerLocal = data.customerId ? getLocalProfile(data.customerId) : null;
  const photoUrl = customerLocal?.photoUrl ?? data.photoUrl;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(10,15,35,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[61] flex justify-center"
      >
        <div
          className="bg-white w-full max-w-lg rounded-t-[28px] overflow-hidden flex flex-col"
          style={{ maxHeight: "82dvh", boxShadow: "0 -8px 48px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Close */}
          <div className="flex justify-end px-4 pb-1 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 pb-6">

            {/* Hero */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Avatar */}
              <div className="relative mb-4">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-32 h-32 rounded-full object-cover"
                    style={{
                      border: `3px solid ${BLUE}`,
                      boxShadow: `0 0 0 6px hsl(221,78%,93%), 0 8px 28px rgba(59,130,246,0.22)`,
                    }}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center font-black text-white text-4xl"
                    style={{
                      background: `linear-gradient(135deg, ${color}, hsl(199,89%,56%))`,
                      border: "3px solid white",
                      boxShadow: `0 0 0 6px hsl(221,78%,93%), 0 8px 28px rgba(59,130,246,0.22)`,
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{name}</h2>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span
                  className="text-xs font-black px-3 py-1 rounded-full text-white"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, hsl(199,89%,56%))` }}
                >
                  Xaridor
                </span>
                {joined && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full text-blue-700 bg-blue-50 border border-blue-200">
                    {joined}dan beri
                  </span>
                )}
              </div>
            </div>

            {/* ── Metrics row ── */}
            <div
              className="flex items-center rounded-2xl border border-gray-100 py-4 mb-5"
              style={{ background: BLUE_LIGHT }}
            >
              <MetricCell
                icon={Star}
                value={<span>0.0 <span className="text-amber-400">★</span></span>}
                label="0 ta baho"
                color="hsl(37,95%,55%)"
              />
              <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
              <MetricCell
                icon={Briefcase}
                value="0 ta"
                label="So'rovlar"
                color={BLUE}
              />
              <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
              <MetricCell
                icon={ShieldCheck}
                value="✓"
                label="Tasdiqlangan"
                color="hsl(160,60%,40%)"
              />
            </div>

            {/* ── Location ── */}
            {location && (
              <div className="flex items-start gap-2.5 mb-5">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: BLUE_LIGHT }}
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: BLUE }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">
                    Manzil
                  </p>
                  <p className="text-sm font-bold text-gray-800">{location}</p>
                </div>
              </div>
            )}

            {/* ── Category context ── */}
            {data.categoryName && (
              <div
                className="flex items-center gap-2.5 rounded-2xl p-3.5 mb-5 border border-blue-100"
                style={{ background: BLUE_LIGHT }}
              >
                <span className="text-xl flex-shrink-0">{data.categoryEmoji || "📋"}</span>
                <div>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">
                    So'rov kategoriyasi
                  </p>
                  <p className="text-sm font-bold text-blue-900">{data.categoryName}</p>
                </div>
              </div>
            )}

            {/* ── Privacy note ── */}
            <p className="text-center text-[11px] text-gray-400 leading-relaxed mb-4">
              📵 Telefon raqam ko'rsatilmaydi — faqat platforma orqali aloqa
            </p>

            {/* ── Close button ── */}
            <button
              onClick={onClose}
              className="w-full h-12 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${BLUE}, hsl(199,89%,56%))` }}
            >
              Yopish
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Unified export — same prop shape as PublicProfileModal (drop-in ready)
   ═══════════════════════════════════════════════════════════════════════ */
export function PublicProfilePreviewModal({
  mode,
  providerData,
  customerData,
  onClose,
}: PublicProfileModalProps) {
  if (mode === "provider" && providerData) {
    return <ProviderPreviewSheet data={providerData} onClose={onClose} />;
  }
  if (mode === "customer" && customerData) {
    return <CustomerPreviewSheet data={customerData} onClose={onClose} />;
  }
  return null;
}
