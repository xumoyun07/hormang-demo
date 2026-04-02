/**
 * /profile/settings — Provider Profile Settings (Enhanced)
 *
 * Features:
 *   - Weighted dynamic completion % (photo 20, name 10, region 15,
 *     services 20, bio 20, experience 10, portfolio 5)
 *   - Public Profile Preview modal ("Profilimni ko'rish")
 *   - Portfolio with captions + drag-to-reorder
 *   - Debounced localStorage auto-save for bio/experience
 *   - Helper texts + "Add now" scroll anchors for missing items
 *   - Phone-migration modal
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ChevronLeft, Camera, Phone, Lock, CheckCircle2, AlertCircle,
  Save, Loader2, MapPin, Briefcase, Star, ImagePlus,
  X, ArrowRight, RefreshCw, ChevronDown, User, AlertTriangle,
  Eye, Zap, GripVertical, TrendingUp, Award, ShoppingBag,
} from "lucide-react";
import logoImg from "/hormang-logo.png";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updateProviderProfile, sendSmsCode, addPhone } from "@/lib/auth-client";
import { regionsList } from "@/lib/regions";
import {
  getLocalProfile, saveLocalProfile,
  getCompletionChecks, getCompletionPct,
  type LocalProfile, type PortfolioItem,
} from "@/lib/local-profile";

/* ─── Theme constants ────────────────────────────────────────────── */
const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";
const VIOLET_SOLID = "hsl(262,80%,54%)";

const SERVICE_CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enagalik", "Tadbir xizmatlari",
  "Ko'chirish / yuk yetkazish", "Go'zallik", "Avto xizmat", "Repetitorlar", "Ustachilik",
];

/* ─── Debounce hook ──────────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/* ─── Circular Progress ──────────────────────────────────────────── */
function CircularProgress({ pct }: { pct: number }) {
  const r    = 34;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color = pct < 40 ? "#EF4444" : pct < 75 ? "#F97316" : VIOLET_SOLID;

  return (
    <svg width="88" height="88" className="rotate-[-90deg]" style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.2))" }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#EDE9FE" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r} fill="none" strokeWidth="7"
        stroke={pct < 75 ? color : "url(#pgradV2)"}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease" }}
      />
      <defs>
        <linearGradient id="pgradV2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(262,80%,54%)" />
          <stop offset="100%" stopColor="hsl(236,76%,60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────── */
function Field({ label, required, children, hint, error, boost }: {
  label: string; required?: boolean; children: React.ReactNode;
  hint?: string; error?: string; boost?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {boost && !error && (
        <p className="flex items-center gap-1 text-[11px] text-violet-500 mt-1 font-semibold">
          <Zap className="w-3 h-3" />{boost}
        </p>
      )}
      {hint && !error && !boost && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function inputCls() {
  return "w-full h-11 px-4 rounded-2xl border-2 border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-colors";
}

/* ─── Section header ─────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, sub }: {
  icon: React.FC<{ className?: string }>; title: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-violet-600" />
      </div>
      <div>
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PUBLIC PROFILE PREVIEW MODAL
   ════════════════════════════════════════════════════════════════════ */
function ProfilePreviewModal({ onClose, firstName, lastName, bio, categories, region, district,
  experience, photoUrl, portfolioItems }: {
  onClose: () => void;
  firstName: string; lastName: string; bio: string;
  categories: string[]; region: string; district: string;
  experience: string;
  photoUrl?: string; portfolioItems: PortfolioItem[];
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-white rounded-t-3xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div>
            <p className="font-extrabold text-gray-900 text-sm">Ommaviy profil ko'rinishi</p>
            <p className="text-xs text-gray-400">Mijozlarga ko'rinishi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Hero section */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)" }}>
            <div className="p-5 text-white">
              <div className="flex items-center gap-4 mb-4">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profil" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{initials || "?"}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-lg leading-tight">
                    {firstName || "Ism"} {lastName || "Familiya"}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= 4 ? "fill-yellow-300 text-yellow-300" : "fill-white/30 text-white/30"}`} />
                    ))}
                    <span className="text-xs text-white/70 ml-1">4.0 (Yangi)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categories.length > 0
                  ? categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-white/20 border border-white/25 rounded-lg text-xs font-semibold">{c}</span>
                    ))
                  : <span className="text-xs text-white/50">Xizmatlar tanlanmagan</span>
                }
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">Hudud</p>
                <p className="text-xs font-bold text-gray-800">
                  {region ? (district ? `${district}, ${region}` : region) : "Ko'rsatilmagan"}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
              <Award className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">Tajriba</p>
                <p className="text-xs font-bold text-gray-800">
                  {experience ? `${experience} yil` : "Ko'rsatilmagan"}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Bio</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{bio}</p>
            </div>
          )}

          {/* Portfolio */}
          {portfolioItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                Portfolio ({portfolioItems.length} ta ish)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {portfolioItems.map((item, i) => (
                  <div key={i} className="relative group">
                    <img src={item.url} alt={item.caption || `Portfolio ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border border-gray-100" />
                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[9px] px-1.5 py-1 rounded-b-xl line-clamp-1">
                        {item.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA for customer */}
          <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)" }}>
            <p className="text-sm font-bold text-gray-700 mb-1">Buyurtma berish uchun</p>
            <p className="text-xs text-gray-500">Mijoz xizmat bo'limida so'rov yubora oladi</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CUSTOMER PROFILE PREVIEW MODAL
   ════════════════════════════════════════════════════════════════════ */
function CustomerPreviewModal({ onClose, firstName, lastName, region, district, photoUrl, phone }: {
  onClose: () => void;
  firstName: string; lastName: string;
  region: string; district: string;
  photoUrl?: string; phone?: string | null;
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const location = district ? `${district}, ${region}` : region;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-white rounded-t-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div>
            <p className="font-extrabold text-gray-900 text-sm">Ommaviy profil ko'rinishi</p>
            <p className="text-xs text-gray-400">Ijrochilar sizni qanday ko'radi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Hero card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(221,78%,48%) 0%, hsl(199,89%,56%) 100%)" }}>
            <div className="p-5 text-white flex items-center gap-4">
              {photoUrl ? (
                <img src={photoUrl} alt="Profil" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black text-white">{initials || "?"}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-xl leading-tight mb-1">
                  {firstName || "Ism"} {lastName || "Familiya"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 border border-white/25 rounded-xl text-xs font-bold">
                  <ShoppingBag className="w-3 h-3" /> Xaridor
                </span>
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold">Manzil</p>
                <p className="text-xs font-bold text-gray-800 truncate">{location || "Ko'rsatilmagan"}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold">Telefon</p>
                <p className="text-xs font-bold text-gray-800 truncate">{phone || "Ko'rsatilmagan"}</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)" }}>
            <p className="text-sm font-bold text-gray-700 mb-1">Xizmat buyurtma berish uchun</p>
            <p className="text-xs text-gray-500">Ijrochilar profilingizni xizmat berish arafasida ko'radi</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ADD PHONE MODAL
   ════════════════════════════════════════════════════════════════════ */
function AddPhoneModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { setAuth, user, providerProfile } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone]           = useState("");
  const [otp, setOtp]               = useState("");
  const [devCode, setDevCode]       = useState<string | null>(null);
  const [step, setStep]             = useState<"phone" | "otp">("phone");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  }

  function startTimer() {
    setResendTimer(60);
    const t = setInterval(() => setResendTimer((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  }

  async function sendCode() {
    setError("");
    if (phone.replace(/\D/g, "").length < 9) { setError("To'g'ri raqam kiriting"); return; }
    setLoading(true);
    try {
      const res = await sendSmsCode("+998" + phone.replace(/\D/g, ""), "add-phone");
      setDevCode(res.devCode ?? null);
      setStep("otp");
      startTimer();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Xatolik"); }
    finally { setLoading(false); }
  }

  async function verify() {
    setError("");
    if (otp.length < 6) { setError("6 xonali kodni kiriting"); return; }
    setLoading(true);
    try {
      const res = await addPhone({ phone: "+998" + phone.replace(/\D/g, ""), otp });
      setAuth(res.user, providerProfile);
      toast({ title: "Telefon muvaffaqiyatli qo'shildi" });
      onSuccess();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Xatolik"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-extrabold text-gray-900 text-lg mb-1">Telefon raqam qo'shish</h3>
        <p className="text-gray-500 text-sm mb-4">
          {step === "phone" ? "Raqamingizni kiriting, SMS kod yuboriladi" : `+998 ${phone} ga kod yuborildi`}
        </p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-4">{error}</div>}
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex">
                <span className="h-11 px-3 flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500">+998</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()} placeholder="90 123 45 67" maxLength={12} autoFocus
                  className="flex-1 h-11 px-4 rounded-r-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20" />
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-50">Bekor</button>
                <button onClick={sendCode} disabled={loading}
                  className="flex-1 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1"
                  style={{ background: VIOLET }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Yuborish
                </button>
              </div>
            </motion.div>
          )}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {devCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700 font-semibold mb-0.5">Demo kod</p>
                  <p className="text-amber-900 font-bold tracking-[0.3em]">{devCode}</p>
                </div>
              )}
              <input type="text" inputMode="numeric" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="000000" maxLength={6} autoFocus
                className="w-full h-14 text-center text-2xl font-bold tracking-[0.4em] border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20" />
              <button onClick={verify} disabled={loading || otp.length < 6}
                className="w-full h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-60"
                style={{ background: VIOLET }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Tasdiqlash
              </button>
              <div className="flex justify-between">
                <button onClick={() => { setStep("phone"); setOtp(""); setDevCode(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Raqamni o'zgartirish
                </button>
                <button onClick={() => { if (resendTimer > 0) return; sendCode(); }} disabled={resendTimer > 0}
                  className="text-xs text-violet-600 hover:underline flex items-center gap-1 disabled:opacity-50">
                  <RefreshCw className="w-3 h-3" />
                  {resendTimer > 0 ? `${resendTimer}s` : "Qayta yuborish"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function ProfileSettingsPage() {
  const { user, providerProfile, setAuth, setProviderProfile, activeRole, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  /* Welcome banner for new providers */
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() =>
    sessionStorage.getItem("justBecameProvider") === "1"
  );
  function dismissBanner() {
    sessionStorage.removeItem("justBecameProvider");
    setShowWelcomeBanner(false);
  }

  /* Local profile state */
  const [local, setLocal] = useState<LocalProfile>({});
  useEffect(() => { if (user) setLocal(getLocalProfile(user.id)); }, [user?.id]);

  /* Form fields */
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [region, setRegion]         = useState("");
  const [district, setDistrict]     = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [bio, setBio]               = useState("");

  /* Populate from auth/local once loaded */
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
    if (providerProfile) {
      setSelectedServices(providerProfile.categories ?? []);
      setBio(providerProfile.bio ?? "");
    }
  }, [user?.id, providerProfile?.id]);

  useEffect(() => {
    setRegion(local.region ?? "");
    setDistrict(local.district ?? "");
    setExperience(local.experience !== undefined ? String(local.experience) : "");
  }, [local]);

  /* Photo */
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl]   = useState<string | undefined>(undefined);
  const [photoLoading, setPhotoLoading] = useState(false);
  useEffect(() => { setPhotoUrl(local.photoUrl); }, [local.photoUrl]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoUrl(ev.target?.result as string);
      setPhotoLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* Portfolio with captions + drag */
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    const items = local.portfolioItems ?? (local.portfolioImages ?? []).map((url) => ({ url }));
    setPortfolioItems(items);
  }, [local.portfolioItems, local.portfolioImages]);

  function handlePortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 6 - portfolioItems.length;
    if (remaining <= 0) return;
    setPortfolioLoading(true);
    let loaded = 0;
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPortfolioItems((prev) => [...prev, { url: ev.target?.result as string }].slice(0, 6));
        loaded++;
        if (loaded === Math.min(files.length, remaining)) setPortfolioLoading(false);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removePortfolioItem(idx: number) {
    setPortfolioItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCaption(idx: number, caption: string) {
    setPortfolioItems((prev) => prev.map((item, i) => i === idx ? { ...item, caption } : item));
  }

  /* Drag to reorder */
  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...portfolioItems];
    const [dragged] = next.splice(dragIdx, 1);
    next.splice(idx, 0, dragged);
    setPortfolioItems(next);
    setDragIdx(idx);
  }
  function handleDragEnd() { setDragIdx(null); }

  /* Region */
  const selectedRegionObj = regionsList.find((r) => r.value === region);
  const hasDistricts = selectedRegionObj?.isCapital && (selectedRegionObj.districts?.length ?? 0) > 0;
  function handleRegionChange(val: string) { setRegion(val); setDistrict(""); }

  /* ── Debounced auto-save to localStorage ── */
  const debouncedBio     = useDebounce(bio, 1200);
  const debouncedExp     = useDebounce(experience, 1200);
  const debouncedPhoto   = useDebounce(photoUrl, 300);
  const debouncedPortf   = useDebounce(portfolioItems, 800);
  const debouncedRegion  = useDebounce(region, 600);
  const debouncedDistrict = useDebounce(district, 600);
  const [autoSaveAt, setAutoSaveAt] = useState<Date | null>(null);

  const persistLocal = useCallback(() => {
    if (!user) return;
    const next: LocalProfile = {
      photoUrl: debouncedPhoto,
      region: debouncedRegion,
      district: debouncedDistrict,
      experience: debouncedExp ? Number(debouncedExp) : undefined,
      portfolioItems: debouncedPortf,
      portfolioImages: debouncedPortf.map((i) => i.url),
    };
    saveLocalProfile(user.id, next);
    setAutoSaveAt(new Date());
  }, [user, debouncedPhoto, debouncedRegion, debouncedDistrict, debouncedExp, debouncedPortf]);

  useEffect(() => { persistLocal(); }, [persistLocal]);

  /* ── Completion ── */
  const completionLocal: LocalProfile = {
    photoUrl,
    region,
    district,
    experience: experience ? Number(experience) : undefined,
    portfolioItems,
  };
  const checks = getCompletionChecks(
    user ?? null,
    { ...providerProfile, categories: selectedServices, bio } as typeof providerProfile,
    completionLocal,
  );
  const pct     = getCompletionPct(checks);
  const missing = checks.filter((c) => !c.done);

  /* Section refs for scroll-to */
  const refPhoto      = useRef<HTMLDivElement>(null);
  const refName       = useRef<HTMLDivElement>(null);
  const refRegion     = useRef<HTMLDivElement>(null);
  const refServices   = useRef<HTMLDivElement>(null);
  const refBio        = useRef<HTMLDivElement>(null);
  const refExperience = useRef<HTMLDivElement>(null);
  const refPortfolio  = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    photo: refPhoto, name: refName, region: refRegion,
    services: refServices, bio: refBio, experience: refExperience,
    portfolio: refPortfolio,
  };

  function scrollTo(key: string) {
    const ref = sectionRefs[key as keyof typeof sectionRefs];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (key === "photo") setTimeout(() => photoInputRef.current?.click(), 400);
    if (key === "portfolio") setTimeout(() => portfolioInputRef.current?.click(), 400);
  }

  /* ── Save ── */
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!firstName.trim() || firstName.trim().length < 2) errs.firstName = "Ism kamida 2 harf";
    if (!lastName.trim() || lastName.trim().length < 2)  errs.lastName  = "Familiya kamida 2 harf";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const shouldUpdateProvider = isProvider && selectedServices.length > 0;
      const [userRes, profileRes] = await Promise.all([
        updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }),
        shouldUpdateProvider
          ? updateProviderProfile({
              categories: selectedServices,
              bio: bio || undefined,
              preferredLocation: region ? (district ? `${region}, ${district}` : region) : undefined,
            })
          : Promise.resolve(null),
      ]);

      setAuth(userRes.user, providerProfile);
      if (profileRes) setProviderProfile(profileRes.profile);

      if (user) {
        const newLocal: LocalProfile = {
          photoUrl,
          region,
          district,
          experience: experience ? Number(experience) : undefined,
          portfolioItems,
          portfolioImages: portfolioItems.map((i) => i.url),
        };
        saveLocalProfile(user.id, newLocal);
        setLocal(newLocal);
      }

      setSaved(true);
      toast({ title: "Profil muvaffaqiyatli saqlandi!" });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik yuz berdi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /* ── UI state ── */
  const [showAddPhone, setShowAddPhone]         = useState(false);
  const [showPreview, setShowPreview]           = useState(false);
  const [showCustomerPreview, setShowCustomerPreview] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) { setLocation("/auth/login"); return null; }

  const isProvider = activeRole === "provider";
  const fullName   = `${firstName} ${lastName}`.trim();

  /* ── Customer completion (used when !isProvider) ── */
  const customerChecks = [
    { key: "photo",    label: "Profil surati",         weight: 30, done: !!photoUrl },
    { key: "name",     label: "Ism va Familiya",        weight: 30, done: !!(firstName.trim().length >= 2 && lastName.trim().length >= 2) },
    { key: "phone",    label: "Telefon raqami",         weight: 20, done: !!user.phone },
    { key: "region",   label: "Asosiy manzil",          weight: 20, done: !!region },
  ];
  const customerPct     = customerChecks.reduce((acc, c) => acc + (c.done ? c.weight : 0), 0);
  const customerMissing = customerChecks.filter((c) => !c.done);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation(isProvider ? "/dashboard" : "/dashboard")}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">Profil sozlamalari</h1>
            <p className="text-xs text-gray-400">{isProvider ? "Ijrochi profili" : "Xaridor profili"}</p>
          </div>
          <button
            onClick={() => isProvider ? setShowPreview(true) : setShowCustomerPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            style={{ background: VIOLET }}
          >
            <Eye className="w-3.5 h-3.5" /> Ko'rish
          </button>
          <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── New provider welcome banner (only for providers) ── */}
        <AnimatePresence>
          {showWelcomeBanner && isProvider && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden"
              style={{ background: VIOLET }}
            >
              <button
                onClick={dismissBanner}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-sm leading-tight mb-1">
                    Tabriklaymiz! Siz endi ijrochi sifatida ro'yxatdan o'tdingiz.
                  </p>
                  <p className="text-white/75 text-xs leading-relaxed">
                    Profilingizni to'liq to'ldiring — bu mijozlar sizning xizmatinggizni tanlash ehtimolini oshiradi.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Completion Card ── */}
        {(() => {
          const displayPct     = isProvider ? pct : customerPct;
          const displayMissing = isProvider ? missing : customerMissing;
          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <CircularProgress pct={displayPct} />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold"
                    style={{ color: displayPct < 40 ? "#EF4444" : displayPct < 75 ? "#F97316" : VIOLET_SOLID }}>
                    {displayPct}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 text-sm mb-0.5">
                    {displayPct === 100 ? "Profil to'liq to'ldirilgan! 🎉" : `Profil ${displayPct}% to'ldirilgan`}
                  </p>
                  {displayPct < 100 && (
                    <p className="text-xs text-gray-400 mb-1">{displayMissing.length} ta maydon qoldi</p>
                  )}
                  {displayPct < 100 && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${displayPct}%`, background: VIOLET }} />
                    </div>
                  )}
                  {displayPct === 100 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Barcha maydonlar to'ldirilgan
                    </div>
                  )}
                </div>
              </div>

              {/* Missing items with add-now buttons */}
              {displayMissing.length > 0 && (
                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400">Profilni to'ldiring - bu sizning so`rovlaringgizga keladigan takliflar sonini oshiradi</p>
                  {displayMissing.slice(0, 4).map((m) => (
                    <div key={m.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-black text-violet-500">{m.weight}%</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{m.label}</p>
                      </div>
                      <button
                        onClick={() => scrollTo(m.key)}
                        className="flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-lg hover:bg-violet-100 transition-colors flex-shrink-0"
                      >
                        <TrendingUp className="w-2.5 h-2.5" /> Qo'shish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* ── Phone migration banner ── */}
        {!user.phone && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm mb-1">Telefon raqamini bog'lang</p>
              <p className="text-amber-700 text-xs leading-relaxed mb-3">
                Keyingi kirish uchun telefon raqamini bog'lang.
              </p>
              <button onClick={() => setShowAddPhone(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl transition-colors">
                <Phone className="w-3.5 h-3.5" /> Telefon qo'shish
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Photo + Name card ── */}
        <motion.div ref={refPhoto}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader icon={User} title="Asosiy ma'lumotlar" />

          <div ref={refName} className="flex items-center gap-4 mb-5">
            <div className="relative flex-shrink-0">
              {photoLoading ? (
                <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : photoUrl ? (
                <img src={photoUrl} alt="Profil" className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center">
                  <span className="text-2xl font-black text-violet-400">
                    {(user.firstName[0] ?? "") + (user.lastName[0] ?? "")}
                  </span>
                </div>
              )}
              <button onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-md transition-colors"
                style={{ background: VIOLET }}>
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{fullName || "—"}</p>
              <p className="text-xs text-gray-400 mb-2">{isProvider ? "Ijrochi" : "Xaridor"}</p>
              <button onClick={() => photoInputRef.current?.click()}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors">
                {photoUrl ? "Suratni o'zgartirish" : "+ Profil suratini yuklash"}
              </button>
              {!photoUrl && (
                <p className="text-[10px] text-violet-400 mt-0.5">Surat bilan ko'proq ishonch qozonasiz</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Ism" required error={errors.firstName}>
              <input value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: "" })); }}
                placeholder="Ism" className={inputCls()} />
            </Field>
            <Field label="Familiya" required error={errors.lastName}>
              <input value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: "" })); }}
                placeholder="Familiya" className={inputCls()} />
            </Field>
          </div>

          <Field label="Telefon raqami" hint="Kirish uchun ishlatiladi, o'zgartirib bo'lmaydi">
            <div className="w-full h-11 px-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{user.phone ?? "—"}</span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg">O'zgartirib bo'lmaydi</span>
            </div>
          </Field>
        </motion.div>

        {/* ── Region card ── */}
        <motion.div ref={refRegion}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader icon={MapPin}
            title={isProvider ? "Xizmat hududi" : "Asosiy manzilim"}
            sub={isProvider ? "Yaqin atrofdagi buyurtmalar ko'rsatiladi" : "Yaqin atrofdagi xizmatlar ko'rsatiladi"} />

          <div className="space-y-3">
            <Field label="Shahar / tuman" required
              boost={isProvider ? "To'g'ri hudud → ko'proq tegishli buyurtmalar" : "Manzilingiz asosida yaqin xizmatchilar taklif etiladi"}>
              <div className="relative">
                <select value={region} onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full h-11 px-4 pr-9 rounded-2xl border-2 border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 appearance-none">
                  <option value="">Hudud tanlang...</option>
                  {regionsList.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <AnimatePresence>
              {hasDistricts && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Field label="Toshkent shahri tumani">
                    <div className="relative">
                      <select value={district} onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-11 px-4 pr-9 rounded-2xl border-2 border-violet-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 appearance-none">
                        <option value="">Tuman tanlang...</option>
                        {selectedRegionObj?.districts?.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Services card ── */}
        {isProvider && (
          <motion.div ref={refServices}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={Briefcase} title="Xizmatlarim"
              sub="Taklif qiluvchi xizmatlarni belgilang" />

            <div className="flex flex-wrap gap-2 mb-3">
              {SERVICE_CATEGORIES.map((cat) => {
                const active = selectedServices.includes(cat);
                return (
                  <button key={cat} type="button"
                    onClick={() =>
                      setSelectedServices((prev) =>
                        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                      )
                    }
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border-2 transition-all duration-150 ${
                      active ? "text-white border-transparent shadow-sm" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-200 hover:text-violet-700"
                    }`}
                    style={active ? { background: VIOLET } : {}}>
                    {active && <CheckCircle2 className="w-3 h-3" />}
                    {cat}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-violet-500 flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3" /> Har bir xizmat uchun alohida buyurtmalar keladi
            </p>
          </motion.div>
        )}

        {/* ── Bio / Details card ── */}
        {isProvider && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader icon={Star} title="Tajriba va ma'lumot"
              sub="To'liq profil — ko'proq ishonch va buyurtma" />

            <div className="space-y-4">
              {/* Experience */}
              <div ref={refExperience}>
                <Field label="Tajriba (yil)" hint="Ushbu sohada ishlagan yillar soni">
                  <input type="number" value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Masalan: 3" min={0} max={50} className={inputCls()} />
                </Field>
              </div>

              {/* Bio */}
              <div ref={refBio}>
                <Field label="Bio — o'zingiz haqida"
                  boost={bio.length < 50 ? `${50 - bio.length} ta belgi yozsangiz +15% ball` : "Ajoyib! Bio to'liq hisoblanadi"}
                  hint={bio.length >= 50 ? undefined : undefined}>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    placeholder="Tajribangiz, ko'nikmalaringiz va afzalliklaringiz haqida yozing..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 resize-none transition-colors placeholder:text-gray-300" />
                  <div className="flex justify-between items-center -mt-0.5">
                    <span className={`text-[11px] font-semibold ${bio.length >= 50 ? "text-emerald-500" : "text-gray-400"}`}>
                      {bio.length >= 50 ? "✓ Minimum bajarildi" : `Min. 50 belgi (${bio.length}/50)`}
                    </span>
                    <span className="text-[11px] text-gray-400">{bio.length}/500</span>
                  </div>
                </Field>
              </div>

              
            {/* Auto-save indicator */}
            {autoSaveAt && (
              <p className="text-[10px] text-gray-300 mt-3 text-right">
                Saqlandi {autoSaveAt.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            </div>
          </motion.div>
        )}

        {/* ── Portfolio card ── */}
        {isProvider && (
          <motion.div ref={refPortfolio}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <ImagePlus className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Portfolio rasmlari</h2>
                  <p className="text-[11px] text-gray-400">Bajargan ishlaringizdan namunalar</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {portfolioLoading && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${portfolioItems.length >= 2 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-violet-50 text-violet-600 border border-violet-100"}`}>
                  {portfolioItems.length}/6
                </span>
              </div>
            </div>

            {portfolioItems.length < 2 && (
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                <p className="text-xs text-violet-600 font-semibold">
                  2+ rasm qo'shing — buyurtma olish ehtimoli 3x oshadi (+5% profil balli)
                </p>
              </div>
            )}

            <div className="space-y-3">
              {portfolioItems.map((item, idx) => (
                <div key={idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing ${
                    dragIdx === idx ? "border-violet-300 bg-violet-50/50 shadow-lg scale-[1.01]" : "border-gray-100 bg-gray-50/30 hover:border-violet-100"
                  }`}>
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1.5" />
                  <img src={item.url} alt={item.caption || `Portfolio ${idx + 1}`}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Tavsif (ixtiyoriy)</p>
                    <input
                      value={item.caption ?? ""}
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      placeholder="Masalan: Oshxona ta'miri — oldin/keyin"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 bg-white transition-colors"
                    />
                  </div>
                  <button onClick={() => removePortfolioItem(idx)}
                    className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 flex-shrink-0 mt-1.5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {portfolioItems.length < 6 && (
              <button onClick={() => portfolioInputRef.current?.click()}
                className="w-full mt-3 h-12 rounded-xl border-2 border-dashed border-violet-200 flex items-center justify-center gap-2 text-violet-500 hover:border-violet-400 hover:bg-violet-50/50 transition-colors">
                <ImagePlus className="w-4 h-4" />
                <span className="text-sm font-semibold">Rasm qo'shish ({6 - portfolioItems.length} ta qoldi)</span>
              </button>
            )}

            <input ref={portfolioInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioChange} />
          </motion.div>
        )}

        {/* ── Save button ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <button onClick={handleSave} disabled={saving}
            className="w-full h-14 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[.98] disabled:opacity-70"
            style={{ background: saved ? "linear-gradient(135deg,#059669,#10B981)" : VIOLET }}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" />
              : saved  ? <CheckCircle2 className="w-5 h-5" />
              : <Save className="w-5 h-5" />}
            {saving ? "Saqlanmoqda..." : saved ? "Saqlandi!" : "Profilni saqlash"}
          </button>

          {saved && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-emerald-600 font-semibold mt-2">
              ✓ O'zgarishlar muvaffaqiyatli saqlandi
            </motion.p>
          )}

          <p className="text-center text-[11px] text-gray-300 mt-3">
            Profil ma'lumotlari avtomatik ravishda saqlanib boradi
          </p>
        </motion.div>
      </div>

      <BottomNav />

      {showAddPhone && (
        <AddPhoneModal onClose={() => setShowAddPhone(false)} onSuccess={() => setShowAddPhone(false)} />
      )}

      <AnimatePresence>
        {showPreview && (
          <ProfilePreviewModal
            onClose={() => setShowPreview(false)}
            firstName={firstName} lastName={lastName}
            bio={bio} categories={selectedServices}
            region={region} district={district}
            experience={experience}
            photoUrl={photoUrl} portfolioItems={portfolioItems}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomerPreview && (
          <CustomerPreviewModal
            onClose={() => setShowCustomerPreview(false)}
            firstName={firstName} lastName={lastName}
            region={region} district={district}
            photoUrl={photoUrl} phone={user.phone}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
