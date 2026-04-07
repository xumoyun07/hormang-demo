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
import { getLocalProfile, type PortfolioItem } from "@/lib/local-profile";

/* ─── Theme ────────────────────────────────────────────────────────── */
const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";
const BLUE   = "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)";

/* ─── Helpers ──────────────────────────────────────────────────────── */
function memberSince(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-Latn-UZ", { month: "long", year: "numeric" });
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
  const local = getLocalProfile(data.masterId);

  const serviceAreas: string[] =
    local.serviceAreas && local.serviceAreas.length > 0
      ? local.serviceAreas
      : local.region
      ? [local.region]
      : [];

  const portfolioItems: PortfolioItem[] = local.portfolioItems ?? [];

  /* Bio from local profile (stored as any key — check common names) */
  const bio = (local as Record<string, unknown>)["bio"] as string | undefined;

  /* Categories from local profile */
  const categories = (local as Record<string, unknown>)["categories"] as string[] | undefined;

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
              <p className="text-violet-200 text-sm">Ijrochi</p>
              {local.experience !== undefined && local.experience > 0 && (
                <p className="text-violet-100 text-xs mt-0.5 font-semibold">
                  {local.experience} yil tajriba
                </p>
              )}
            </div>
          </div>

          {/* Category pill (contextual) */}
          {data.categoryName && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 border border-white/25 text-white">
                {data.categoryEmoji && <span className="mr-1">{data.categoryEmoji}</span>}
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
            <p className="text-xs font-semibold text-emerald-700">Platforma tomonidan tekshirilgan ijrochi</p>
          </div>

          {/* Avg response time */}
          {data.avgResponseTime !== undefined && (
            <div className="flex items-center gap-3 bg-violet-50 rounded-2xl p-3.5 border border-violet-100">
              <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">O'rtacha javob vaqti</p>
                <p className="text-sm font-bold text-violet-800">{data.avgResponseTime} daqiqa</p>
              </div>
            </div>
          )}

          {/* Experience chip */}
          {local.experience !== undefined && local.experience > 0 && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <Award className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Tajriba</p>
                <p className="text-sm font-bold text-gray-800">{local.experience} yil</p>
              </div>
            </div>
          )}

          {/* Service areas */}
          {serviceAreas.length > 0 && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
                  Xizmat ko'rsatadigan hududlar
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
                  Xizmat turlari
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
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Bio</p>
              <p className="text-sm text-gray-700 leading-relaxed">{bio}</p>
            </div>
          )}

          {/* Rating stub */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Reyting</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 h-3 text-gray-200 fill-gray-200" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-black text-gray-900">0.0</p>
              <p className="text-xs text-gray-400">· 0 ta baho · Tez orada</p>
            </div>
          </div>

          {/* Portfolio */}
          {portfolioItems.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
                Portfolio ({portfolioItems.length} ta ish)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {portfolioItems.slice(0, 6).map((item, i) => (
                  <div key={i} className="relative">
                    <img
                      src={item.url}
                      alt={item.caption ?? `Ish ${i + 1}`}
                      className="aspect-square object-cover rounded-xl border border-gray-200 w-full"
                    />
                    {item.caption && (
                      <p className="text-[9px] text-gray-500 mt-0.5 truncate px-0.5">{item.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed services */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Bajarilgan xizmatlar</p>
              <p className="text-sm font-bold text-gray-800">0 ta xizmat</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 pb-1">
            📵 Telefon raqam ko'rsatilmaydi — faqat platforma orqali aloqa
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Yopish
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
  const name = data.customerName?.trim() || "Xaridor";
  const initials = data.customerInitials ?? deriveInitials(name);
  const color = data.customerColor ?? "hsl(221,78%,48%)";
  const location = data.district
    ? `${data.district}, ${data.region}`
    : data.region ?? "";
  const joined = data.joinedAt ? memberSince(data.joinedAt) : null;

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
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg border-2 border-white/25"
            style={{ background: color }}
          >
            <span className="text-2xl font-black text-white">{initials}</span>
          </div>

          <h3 className="font-extrabold text-white text-lg">{name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-blue-100 text-xs font-semibold">Xaridor</span>
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
                <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">So'rov kategoriyasi</p>
                <p className="text-sm font-bold text-blue-800">{data.categoryName}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Manzil</p>
                <p className="text-sm font-bold text-gray-800">{location}</p>
              </div>
            </div>
          )}

          {/* Rating stub — clickable for future reviews */}
          <button className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-colors hover:bg-blue-50/50 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Fikrlar</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-gray-900">0.0</p>
                <p className="text-xs text-gray-400 mt-0.5">0 ta fikr</p>
              </div>
              <MessageCircle className="w-5 h-5 text-gray-300" />
            </div>
          </button>

          {/* Privacy note */}
          <p className="text-center text-xs text-gray-400 pb-1">
            📵 Telefon raqam ko'rsatilmaydi — faqat platforma orqali aloqa
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Yopish
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
