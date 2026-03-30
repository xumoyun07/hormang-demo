/**
 * /profile/settings — Provider Profile Settings page
 * Sections:
 *   - Profile completion card (circular progress + missing items)
 *   - Profile photo upload
 *   - Name, phone (read-only)
 *   - Region / district dropdowns
 *   - Services multi-select
 *   - Experience, bio, working hours
 *   - Portfolio images (up to 6)
 *   - Add-phone modal for migrated users
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ChevronLeft, Camera, Phone, Lock, CheckCircle2, AlertCircle,
  Save, Loader2, MapPin, Clock, Briefcase, Star, ImagePlus,
  X, ArrowRight, RefreshCw, ChevronDown, User, AlertTriangle,
} from "lucide-react";
import logoImg from "/hormang-logo.png";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updateProviderProfile, sendSmsCode, addPhone } from "@/lib/auth-client";
import { regionsList } from "@/lib/regions";
import {
  getLocalProfile, saveLocalProfile, getCompletionChecks, getCompletionPct,
  type LocalProfile,
} from "@/lib/local-profile";

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

const SERVICE_CATEGORIES = [
  "Tozalash",
  "Ta'mirlash",
  "Enagalik",
  "Tadbir xizmatlari",
  "Ko'chirish / yuk yetkazish",
  "Go'zallik",
  "Avto xizmat",
  "Repetitorlar",
  "Ustachilik",
];
// ↑ These names must stay in sync with questionnaire-store.ts category names
//   (normalized comparison strips spaces/slashes, so minor differences are tolerated)

/* ─── Circular Progress ──────────────────────────────────────────── */
function CircularProgress({ pct }: { pct: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="80" height="80" className="rotate-[-90deg]">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#EDE9FE" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r} fill="none" strokeWidth="8"
        stroke="url(#pgrad)" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <defs>
        <linearGradient id="pgrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(262,80%,54%)" />
          <stop offset="100%" stopColor="hsl(236,76%,60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────── */
function Field({
  label, required, children, hint, error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function inputClass(active?: boolean) {
  return `w-full h-11 px-4 rounded-2xl border-2 text-sm text-gray-900 bg-white focus:outline-none transition-colors ${
    active ? "border-violet-400 ring-2 ring-violet-400/20" : "border-gray-200 focus:border-violet-400"
  }`;
}

/* ─── Add Phone Modal ────────────────────────────────────────────── */
function AddPhoneModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { setAuth, user, providerProfile } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
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

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ProfileSettingsPage() {
  const { user, providerProfile, setAuth, setProviderProfile, activeRole, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  /* Local profile state */
  const [local, setLocal] = useState<LocalProfile>({});
  useEffect(() => {
    if (user) setLocal(getLocalProfile(user.id));
  }, [user?.id]);

  /* Form fields */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [experience, setExperience] = useState<string>("");
  const [bio, setBio] = useState("");
  const [workingHours, setWorkingHours] = useState("");

  /* Populate from auth/local once loaded */
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
    if (providerProfile) {
      setSelectedServices(providerProfile.categories ?? []);
      setBio(providerProfile.bio ?? "");
      setWorkingHours(providerProfile.workingHours ?? "");
    }
  }, [user?.id, providerProfile?.id]);

  useEffect(() => {
    setRegion(local.region ?? "");
    setDistrict(local.district ?? "");
    setExperience(local.experience !== undefined ? String(local.experience) : "");
  }, [local]);

  /* Photo */
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  useEffect(() => { setPhotoUrl(local.photoUrl); }, [local.photoUrl]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPhotoUrl(url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* Portfolio */
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  useEffect(() => { setPortfolioImages(local.portfolioImages ?? []); }, [local.portfolioImages]);

  function handlePortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 6 - portfolioImages.length;
    if (remaining <= 0) return;
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPortfolioImages((prev) => [...prev, ev.target?.result as string].slice(0, 6));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  /* Region selection */
  const selectedRegionObj = regionsList.find((r) => r.value === region);
  const hasDistricts = selectedRegionObj?.isCapital && (selectedRegionObj.districts?.length ?? 0) > 0;

  function handleRegionChange(val: string) {
    setRegion(val);
    setDistrict("");
  }

  /* Completion */
  const completionLocal: LocalProfile = {
    photoUrl,
    region,
    district,
    experience: experience ? Number(experience) : undefined,
    portfolioImages,
  };
  const checks = getCompletionChecks(
    user ?? null,
    { ...providerProfile, categories: selectedServices, bio } as typeof providerProfile,
    completionLocal,
  );
  const pct = getCompletionPct(checks);
  const missing = checks.filter((c) => !c.done);

  /* Save */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!firstName.trim() || firstName.trim().length < 2) errs.firstName = "Ism kamida 2 harf";
    if (!lastName.trim() || lastName.trim().length < 2) errs.lastName = "Familiya kamida 2 harf";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const [userRes, profileRes] = await Promise.all([
        updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }),
        selectedServices.length > 0
          ? updateProviderProfile({
              categories: selectedServices,
              bio: bio || undefined,
              workingHours: workingHours || undefined,
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
          portfolioImages,
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

  /* Add-phone modal */
  const [showAddPhone, setShowAddPhone] = useState(false);

  /* Loading state */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) { setLocation("/auth/login"); return null; }

  const isProvider = activeRole === "provider" || !!providerProfile;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 card-shadow">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation(isProvider ? "/provider-home" : "/dashboard")}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm text-gray-900">Profil sozlamalari</h1>
            <p className="text-xs text-gray-400">{isProvider ? "Ijrochi profili" : "Xaridor profili"}</p>
          </div>
          <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Completion card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-violet-100 card-shadow p-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <CircularProgress pct={pct} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-violet-700">
                {pct}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-gray-900 text-sm mb-0.5">
                Profilingiz {pct === 100 ? "to'liq to'ldirilgan!" : `${pct}% to'ldirilgan`}
              </p>
              {pct < 100 && (
                <p className="text-xs text-gray-400 mb-2">{missing.length} ta maydon to'ldirilmagan</p>
              )}
              <div className="space-y-1">
                {missing.slice(0, 3).map((m) => (
                  <div key={m.key} className="flex items-center gap-1.5 text-xs text-violet-600">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {m.label}
                  </div>
                ))}
                {pct === 100 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Barcha maydonlar to'ldirilgan
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Phone migration banner ── */}
        {!user.phone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm mb-1">Telefon raqamini bog'lang</p>
              <p className="text-amber-700 text-xs leading-relaxed mb-3">
                Hisobingizda telefon raqami yo'q. Keyingi kirish uchun bog'lang.
              </p>
              <button
                onClick={() => setShowAddPhone(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Telefon qo'shish
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Photo + Name card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 card-shadow p-5"
        >
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <User className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="font-bold text-gray-900">Asosiy ma'lumotlar</h2>
          </div>

          {/* Photo */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Profil" className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center">
                  <span className="text-2xl font-black text-violet-400">
                    {(user.firstName[0] ?? "") + (user.lastName[0] ?? "")}
                  </span>
                </div>
              )}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-md transition-colors"
                style={{ background: VIOLET }}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 mb-2">{isProvider ? "Ijrochi" : "Xaridor"}</p>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                {photoUrl ? "Suratni o'zgartirish" : "+ Surat yuklash"}
              </button>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Ism" required error={errors.firstName}>
              <input
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: "" })); }}
                placeholder="Ism"
                className={inputClass()}
              />
            </Field>
            <Field label="Familiya" required error={errors.lastName}>
              <input
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: "" })); }}
                placeholder="Familiya"
                className={inputClass()}
              />
            </Field>
          </div>

          {/* Phone */}
          <Field label="Telefon raqami" hint="Telefon raqami kirish uchun ishlatiladi, o'zgartirib bo'lmaydi">
            <div className="w-full h-11 px-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{user.phone ?? "—"}</span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg">O'zgartirib bo'lmaydi</span>
            </div>
          </Field>
        </motion.div>

        {/* ── Region card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-gray-100 card-shadow p-5"
        >
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="font-bold text-gray-900">Hudud</h2>
          </div>

          <div className="space-y-3">
            <Field label="Shahar / tuman" required>
              <div className="relative">
                <select
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full h-11 px-4 pr-9 rounded-2xl border-2 border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 appearance-none"
                >
                  <option value="">Hudud tanlang...</option>
                  {regionsList.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <AnimatePresence>
              {hasDistricts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field label="Toshkent shahri tumani">
                    <div className="relative">
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-11 px-4 pr-9 rounded-2xl border-2 border-violet-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 appearance-none"
                      >
                        <option value="">Tuman tanlang...</option>
                        {selectedRegionObj?.districts?.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 card-shadow p-5"
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Xizmatlarim</h2>
                <p className="text-[11px] text-gray-400">Taklif qiluvchi xizmatlarni belgilang</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((cat) => {
                const active = selectedServices.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedServices((prev) =>
                        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                      )
                    }
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border-2 transition-all duration-150 ${
                      active
                        ? "text-white border-transparent shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-200 hover:text-violet-700"
                    }`}
                    style={active ? { background: VIOLET } : {}}
                  >
                    {active && <CheckCircle2 className="w-3 h-3" />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Bio / Details card ── */}
        {isProvider && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl border border-gray-100 card-shadow p-5"
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                <Star className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="font-bold text-gray-900">Tajriba va ma'lumot</h2>
            </div>

            <div className="space-y-4">
              <Field label="Tajriba (yil)" hint="Ushbu sohada ishlagan yillar soni">
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Masalan: 3"
                  min={0}
                  max={50}
                  className={inputClass()}
                />
              </Field>

              <Field label="Bio — o'zingiz haqida" hint="Mijozlarga o'zingizni taniting (maks. 500 belgi)">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Tajribangiz, ko'nikmalaringiz va afzalliklaringiz haqida yozing..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 resize-none transition-colors placeholder:text-gray-300"
                />
                <p className="text-right text-[11px] text-gray-400 -mt-0.5">{bio.length}/500</p>
              </Field>

              <Field label="Ish vaqti" hint="Masalan: Du-Ju 09:00–20:00, Sha 10:00–18:00">
                <div className="flex items-center gap-2 border-2 border-gray-200 rounded-2xl px-4 h-11 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20 bg-white transition-colors">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="09:00 – 20:00"
                    className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none placeholder:text-gray-300"
                  />
                </div>
              </Field>
            </div>
          </motion.div>
        )}

        {/* ── Portfolio card ── */}
        {isProvider && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-white rounded-2xl border border-gray-100 card-shadow p-5"
          >
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <ImagePlus className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Portfolio rasmlari</h2>
                  <p className="text-[11px] text-gray-400">Bajargan ishlaringizdan namunalar (maks. 6)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                {portfolioImages.length}/6
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {portfolioImages.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img src={img} alt={`Portfolio ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-gray-100" />
                  <button
                    onClick={() => setPortfolioImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {portfolioImages.length < 6 && (
                <button
                  onClick={() => portfolioInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Qo'shish</span>
                </button>
              )}
            </div>

            <input
              ref={portfolioInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePortfolioChange}
            />
          </motion.div>
        )}

        {/* ── Save button ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[.98] disabled:opacity-70"
            style={{ background: saved ? "linear-gradient(135deg,#059669,#10B981)" : VIOLET }}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Saqlanmoqda..." : saved ? "Saqlandi!" : "Profilni saqlash"}
          </button>

          {saved && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-emerald-600 font-semibold mt-2"
            >
              ✓ O'zgarishlar muvaffaqiyatli saqlandi
            </motion.p>
          )}
        </motion.div>
      </div>

      <BottomNav />

      {showAddPhone && (
        <AddPhoneModal
          onClose={() => setShowAddPhone(false)}
          onSuccess={() => setShowAddPhone(false)}
        />
      )}
    </div>
  );
}
