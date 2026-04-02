import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Star, ChevronLeft, Award,
  Briefcase, ShieldCheck, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProviderPublicProfile, type SafeUser, type ProviderProfile } from "@/lib/auth-client";
import { useAuth } from "@/contexts/auth-context";
import { onStoreChange } from "@/lib/store-events";
import { getLocalProfile, type LocalProfile, type PortfolioItem } from "@/lib/local-profile";

const VIOLET_GRADIENT = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

function ProviderAvatar({
  photoUrl,
  initials,
  size = "lg",
}: {
  photoUrl?: string;
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "w-20 h-20 text-2xl" : size === "md" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt="Profil"
        className={`${dim} rounded-2xl object-cover border-2 border-white/30 flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center flex-shrink-0`}
    >
      <span className="font-black text-white">{initials || "?"}</span>
    </div>
  );
}

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  const r = Math.round(rating ?? 0);
  return (
    <div className="flex items-center gap-1 mt-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= r
              ? "fill-yellow-300 text-yellow-300"
              : "fill-white/30 text-white/30"
          }`}
        />
      ))}
      {rating ? (
        <span className="text-xs text-white/80 ml-1">{rating.toFixed(1)}</span>
      ) : (
        <span className="text-xs text-white/60 ml-1">Yangi</span>
      )}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-white/50">({count} sharh)</span>
      )}
    </div>
  );
}

export default function ProviderProfilePage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const [provider, setProvider] = useState<SafeUser | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [localData, setLocalData] = useState<LocalProfile>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwnProfile = !!currentUser && !!provider && currentUser.id === provider.id;

  function loadLocalData(providerId: string) {
    setLocalData(getLocalProfile(providerId));
  }

  function fetchProfile(showLoader = false) {
    if (!params.id) return;
    if (showLoader) setLoading(true);
    getProviderPublicProfile(params.id)
      .then((data) => {
        setProvider(data.user);
        setProfile(data.providerProfile);
        setError("");
        loadLocalData(data.user.id);
      })
      .catch(() => setError("Ijrochi topilmadi"))
      .finally(() => showLoader && setLoading(false));
  }

  useEffect(() => {
    fetchProfile(true);
  }, [params.id]);

  useEffect(() => {
    const unsub = onStoreChange(() => {
      fetchProfile(false);
    });
    return unsub;
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent"
        />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ijrochi topilmadi</h2>
        <p className="text-gray-500 text-sm mb-6">Bunday profil mavjud emas yoki o'chirilgan.</p>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="gap-2 border-2 font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Orqaga
        </Button>
      </div>
    );
  }

  const fullName = `${provider.firstName} ${provider.lastName}`;
  const initials = `${provider.firstName?.[0] ?? ""}${provider.lastName?.[0] ?? ""}`.toUpperCase();

  const photoUrl = localData.photoUrl;
  const region = localData.region ?? "";
  const district = localData.district ?? "";
  const experience = localData.experience;
  const portfolioItems: PortfolioItem[] = localData.portfolioItems ?? [];
  const bio = profile?.bio ?? "";
  const categories: string[] = profile?.categories ?? [];
  const locationStr = district ? `${district}, ${region}` : region;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-900 text-sm">Ijrochi profili</span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm"
            style={{ background: VIOLET_GRADIENT }}
          >
            H
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-4"
        >
          {/* ── Violet hero card ── */}
          <div
            className="rounded-2xl overflow-hidden shadow-md"
            style={{ background: VIOLET_GRADIENT }}
          >
            <div className="p-5 text-white">
              {/* Avatar + name + rating */}
              <div className="flex items-center gap-4 mb-4">
                <ProviderAvatar photoUrl={photoUrl} initials={initials} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-extrabold text-lg leading-tight">{fullName}</h1>
                    {profile?.isVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 border border-white/30 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Tasdiqlangan
                      </span>
                    )}
                  </div>
                  <StarRating rating={profile?.rating} count={profile?.completedJobs} />
                  {profile?.completedJobs ? (
                    <p className="text-xs text-white/60 mt-0.5">
                      {profile.completedJobs} ta bajarilgan ish
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Category chips */}
              <div className="flex flex-wrap gap-1.5">
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-0.5 bg-white/20 border border-white/25 rounded-lg text-xs font-semibold"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-white/50">Xizmatlar ko'rsatilmagan</span>
                )}
              </div>
            </div>
          </div>

          {/* ── 2-col info grid ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-3.5 flex items-center gap-2.5 border border-gray-100 shadow-sm">
              <MapPin className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Hudud</p>
                <p className="text-xs font-bold text-gray-800 truncate">
                  {locationStr || "Ko'rsatilmagan"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3.5 flex items-center gap-2.5 border border-gray-100 shadow-sm">
              <Award className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Tajriba</p>
                <p className="text-xs font-bold text-gray-800">
                  {experience ? `${experience} yil` : "Ko'rsatilmagan"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Bio ── */}
          <AnimatePresence>
            {bio && (
              <motion.div
                key="bio"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Bio</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{bio}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Portfolio ── */}
          <AnimatePresence>
            {portfolioItems.length > 0 && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Portfolio ({portfolioItems.length} ta ish)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {portfolioItems.map((item, i) => (
                    <div key={i} className="relative group aspect-square overflow-hidden rounded-xl border border-gray-100">
                      <img
                        src={item.url}
                        alt={item.caption || `Portfolio ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[9px] px-1.5 py-1.5 rounded-b-xl line-clamp-1">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Verification badges ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-2 flex-wrap">
            {provider.phone && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Telefon tasdiqlangan
              </span>
            )}
            {profile?.isVerified && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Hujjatlar tasdiqlangan
              </span>
            )}
            {!provider.phone && !profile?.isVerified && (
              <span className="text-xs text-gray-400">Tasdiqlash ma'lumotlari yo'q</span>
            )}
          </div>

          {/* ── CTA ── */}
          {isOwnProfile ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-2xl p-4 text-center border border-violet-100"
              style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)" }}
            >
              <p className="text-sm font-bold text-gray-700 mb-1">Bu sizning ommaviy profilingiz</p>
              <p className="text-xs text-gray-500 mb-3">Mijozlarga ko'rinadigan ko'rinish</p>
              <Button
                onClick={() => setLocation("/profile/settings")}
                className="gap-2 font-bold text-sm h-9"
                style={{ background: VIOLET_GRADIENT }}
              >
                Profilni tahrirlash <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-2xl p-5 text-white shadow-md"
              style={{ background: VIOLET_GRADIENT }}
            >
              <h3 className="font-bold text-base mb-1">{provider.firstName} bilan bog'laning</h3>
              <p className="text-white/70 text-sm mb-4">
                So'rovingizni yuboring — ijrochi tez orada javob beradi
              </p>
              <Button
                onClick={() =>
                  setLocation(currentUser ? "/dashboard/buyer" : "/auth/login")
                }
                className="w-full bg-white text-violet-700 hover:bg-white/90 font-bold gap-2 shadow-sm"
              >
                So'rov yuborish <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
