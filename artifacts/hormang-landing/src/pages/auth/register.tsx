import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import { Phone, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { sendSmsCode, registerUser, saveProviderProfile } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import logoImg from "/hormang-logo.png";

const SERVICE_CATEGORIES = [
  "Tozalik", "Ta'mirlash / Usta", "Enaga / Bola parvarishi",
  "Ovqat pishirish", "Ko'chirish / Transport", "Go'zallik / Sartaroshlik",
  "Avto xizmat", "Repetitor / O'qituvchi", "Elektr ishlari",
  "Santexnika", "Dizayn / Yaratuvchanlik", "Boshqalar",
];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}

const infoSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 harf"),
  lastName: z.string().min(2, "Familiya kamida 2 harf"),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: "Shartlarga rozilik bildirishingiz kerak" }) }),
});

const providerSchema = z.object({
  categories: z.array(z.string()).min(1, "Kamida bitta kategoriya tanlang"),
  bio: z.string().max(300).optional(),
  preferredLocation: z.string().optional(),
});

type InfoData = z.infer<typeof infoSchema>;
type ProviderData = z.infer<typeof providerSchema>;
type Step = "info" | "phone" | "otp" | "provider";

function InfoForm({ role, onDone }: { role: "buyer" | "provider"; onDone: (d: InfoData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<InfoData>({
    resolver: zodResolver(infoSchema),
  });

  return (
    <form onSubmit={handleSubmit(onDone)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Ism</label>
          <input {...register("firstName")} placeholder="Alisher"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Familiya</label>
          <input {...register("lastName")} placeholder="Toshmatov"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="flex items-start gap-2">
        <input {...register("agreeTerms")} id="terms" type="checkbox"
          className="w-4 h-4 mt-0.5 rounded accent-primary border-border" />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          <span className="text-primary font-semibold hover:underline">Foydalanish shartlari</span> va{" "}
          <span className="text-primary font-semibold hover:underline">Maxfiylik siyosatiga</span> roziman
        </label>
      </div>
      {errors.agreeTerms && <p className="text-destructive text-xs -mt-2">{errors.agreeTerms.message}</p>}
      <Button type="submit" className="w-full h-11 font-bold gap-2">
        Davom etish <ChevronRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

function ProviderForm({ onDone, onBack, loading }: { onDone: (d: ProviderData) => void; onBack: () => void; loading: boolean }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProviderData>({
    resolver: zodResolver(providerSchema),
    defaultValues: { categories: [] },
  });

  const selected = watch("categories") ?? [];

  function toggleCat(cat: string) {
    if (selected.includes(cat)) {
      setValue("categories", selected.filter(c => c !== cat));
    } else {
      setValue("categories", [...selected, cat]);
    }
  }

  return (
    <form onSubmit={handleSubmit(onDone)} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">
          Xizmat kategoriyalarini tanlang <span className="text-destructive">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map(cat => {
            const active = selected.includes(cat);
            return (
              <motion.button
                key={cat}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleCat(cat)}
                className={`text-xs px-3 py-2 rounded-xl font-semibold border-2 transition-all duration-200 flex items-center gap-1 ${active
                  ? "text-white border-transparent shadow-md"
                  : "bg-muted border-transparent text-muted-foreground hover:border-primary/30"}`}
                style={active ? { background: "var(--brand-gradient)" } : {}}
              >
                {active && <CheckCircle2 className="w-3 h-3" />}
                {cat}
              </motion.button>
            );
          })}
        </div>
        {errors.categories && <p className="text-destructive text-xs mt-2">{errors.categories.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          O'zingiz haqida <span className="text-muted-foreground font-normal">(ixtiyoriy)</span>
        </label>
        <textarea {...register("bio")} rows={3}
          placeholder="Tajribangiz, ko'nikmalaringiz haqida qisqacha yozing..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Hudud <span className="text-muted-foreground font-normal">(ixtiyoriy)</span></label>
        <input {...register("preferredLocation")} placeholder="Toshkent, Yunusobod"
          className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="h-11 px-5 border-2 font-semibold gap-1">
          <ChevronLeft className="w-4 h-4" /> Orqaga
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 h-11 font-bold gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {loading ? "Yaratilmoqda..." : "Profil yaratish"}
        </Button>
      </div>
    </form>
  );
}

export default function RegisterPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const role = (params.get("role") ?? "buyer") as "buyer" | "provider";
  const [, setLocation] = useLocation();
  const { setAuth, user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("info");
  const [infoData, setInfoData] = useState<InfoData | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  function getFullPhone() {
    return "+998" + phone.replace(/\D/g, "");
  }

  function startResendTimer() {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  const stepsForRole: Step[] = role === "provider"
    ? ["info", "phone", "otp", "provider"]
    : ["info", "phone", "otp"];

  async function handleSendCode() {
    setServerError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setServerError("To'g'ri telefon raqami kiriting (kamida 9 raqam)");
      return;
    }
    setLoading(true);
    try {
      const res = await sendSmsCode(getFullPhone(), "register");
      setDevCode(res.devCode ?? null);
      setStep("otp");
      startResendTimer();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setServerError("");
    setOtp("");
    setLoading(true);
    try {
      const res = await sendSmsCode(getFullPhone(), "register");
      setDevCode(res.devCode ?? null);
      startResendTimer();
      toast({ title: "Yangi kod yuborildi" });
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndRegister() {
    if (!infoData) return;
    setServerError("");
    if (otp.length < 6) {
      setServerError("6 xonali kodni kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({
        firstName: infoData.firstName,
        lastName: infoData.lastName,
        phone: getFullPhone(),
        otp,
        role,
      });

      if (role === "buyer") {
        setAuth(res.user, null);
        toast({ title: `Xush kelibsiz, ${res.user.firstName}! Hormangga xush kelibsiz.` });
        setLocation("/dashboard");
      } else {
        setAuth(res.user, null);
        setStep("provider");
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderDone(data: ProviderData) {
    setLoading(true);
    setServerError("");
    try {
      const { profile } = await saveProviderProfile({
        categories: data.categories,
        bio: data.bio,
        preferredLocation: data.preferredLocation,
      });
      setAuth(user!, profile);
      toast({ title: `Profilingiz tayyor, ${user?.firstName}! Endi so'rovlar kuting.` });
      setLocation("/dashboard");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <img src={logoImg} alt="Hormang" className="w-14 h-14 object-contain drop-shadow-md" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-4">
            {stepsForRole.map((s, i) => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-400"
                style={{
                  width: s === step ? 32 : 16,
                  background: i <= stepsForRole.indexOf(step) ? "var(--brand-gradient)" : undefined,
                  backgroundColor: i > stepsForRole.indexOf(step) ? "var(--muted)" : undefined,
                }}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {stepsForRole.indexOf(step) + 1}/{stepsForRole.length}
            </span>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {step === "info" && "Hisobingizni yarating"}
            {step === "phone" && "Telefon raqamingiz"}
            {step === "otp" && "Kodni tasdiqlang"}
            {step === "provider" && "Ijrochi profilingiz"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "info" && "Ismingizni kiriting"}
            {step === "phone" && "SMS tasdiqlash uchun raqamingizni kiriting"}
            {step === "otp" && `+998 ${phone} ga kod yuborildi`}
            {step === "provider" && "Xizmatlaringiz haqida ko'proq ma'lumot bering"}
          </p>
        </div>

        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
          >
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {serverError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "info" && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <InfoForm role={role} onDone={data => { setInfoData(data); setStep("phone"); }} />
            </motion.div>
          )}

          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                  Telefon raqam
                </label>
                <div className="flex items-center">
                  <span className="h-11 px-3 flex items-center rounded-l-xl border border-r-0 border-border bg-muted text-sm font-semibold text-muted-foreground select-none">
                    +998
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    onKeyDown={e => e.key === "Enter" && handleSendCode()}
                    placeholder="90 123 45 67"
                    maxLength={12}
                    className="flex-1 h-11 px-4 rounded-r-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("info")} className="h-11 px-5 border-2 font-semibold gap-1">
                  <ChevronLeft className="w-4 h-4" /> Orqaga
                </Button>
                <Button onClick={handleSendCode} disabled={loading} className="flex-1 h-11 font-bold gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? "Yuborilmoqda..." : "Kodni yuborish"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
              {devCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-700 font-semibold mb-0.5">Demo rejim — SMS simulyatsiya</p>
                  <p className="text-amber-900 font-bold text-lg tracking-[0.3em]">{devCode}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Tasdiqlash kodi</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && handleVerifyAndRegister()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full h-14 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-2xl font-bold tracking-[0.4em] text-center"
                  autoFocus
                />
              </div>
              <Button onClick={handleVerifyAndRegister} disabled={loading || otp.length < 6} className="w-full h-11 font-bold gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? (role === "buyer" ? "Ro'yxatdan o'tilmoqda..." : "Tekshirilmoqda...") : "Tasdiqlash"}
              </Button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { setStep("phone"); setOtp(""); setDevCode(null); setServerError(""); }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Raqamni o'zgartirish
                </button>
                <button type="button" onClick={handleResend} disabled={resendTimer > 0}
                  className="text-sm text-primary hover:underline flex items-center gap-1.5 disabled:opacity-50 transition-all">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendTimer > 0 ? `${resendTimer}s` : "Qayta yuborish"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "provider" && (
            <motion.div key="provider" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <ProviderForm onDone={handleProviderDone} onBack={() => setStep("otp")} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Allaqachon hisobingiz bormi?{" "}
          <button onClick={() => setLocation("/auth/login")} className="font-bold text-primary hover:underline">
            Kirish
          </button>
        </p>
      </motion.div>
    </div>
  );
}
