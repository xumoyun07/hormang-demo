import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Phone, ArrowRight, Loader2, LogIn, ChevronLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { sendSmsCode, loginUser } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import logoImg from "/hormang-logo.png";

type Step = "phone" | "otp";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  async function handleSendCode() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("To'g'ri telefon raqami kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await sendSmsCode(getFullPhone(), "login");
      setDevCode(res.devCode ?? null);
      setStep("otp");
      startResendTimer();
      toast({ title: "Tasdiqlash kodi yuborildi" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    if (otp.length < 6) {
      setError("6 xonali kodni kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser({ phone: getFullPhone(), otp });
      setAuth(res.user, res.providerProfile ?? null);
      toast({ title: `Xush kelibsiz, ${res.user.firstName}!` });
      setLocation("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setError("");
    setOtp("");
    setLoading(true);
    try {
      const res = await sendSmsCode(getFullPhone(), "login");
      setDevCode(res.devCode ?? null);
      startResendTimer();
      toast({ title: "Yangi kod yuborildi" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setError(msg);
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
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex justify-center mb-3"
          >
            <img src={logoImg} alt="Hormang" className="w-24 h-24 object-contain drop-shadow-lg" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Hisobingizga kiring</h1>
          <p className="text-muted-foreground text-sm">
            {step === "phone"
              ? "Telefon raqamingizni kiriting"
              : `+998 ${phone} ga kod yuborildi`}
          </p>
        </div>

        {error && (
          <motion.div
            key={error}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-4"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                  Telefon raqam
                </label>
                <div className="flex items-center gap-0">
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
                    className="flex-1 h-11 px-4 rounded-r-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full h-11 font-bold text-sm gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? "Yuborilmoqda..." : "Tasdiqlash kodi yuborish"}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                SMS orqali 6 xonali tasdiqlash kodi yuboriladi
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {devCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-700 font-semibold mb-0.5">Demo rejim — SMS simulyatsiya</p>
                  <p className="text-amber-900 font-bold text-lg tracking-[0.3em]">{devCode}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Tasdiqlash kodi
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full h-14 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-2xl font-bold tracking-[0.4em] text-center"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full h-11 font-bold text-sm gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </Button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); setDevCode(null); setError(""); }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Raqamni o'zgartirish
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className="text-sm text-primary hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:no-underline transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendTimer > 0 ? `${resendTimer}s` : "Qayta yuborish"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Hali ro'yxatdan o'tmaganmisiz?{" "}
          <button
            onClick={() => setLocation("/auth/role")}
            className="font-bold text-primary hover:underline"
          >
            Ro'yxatdan o'tish
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Eski hisobingiz bormi?{" "}
          <button
            onClick={() => setLocation("/auth/migrate")}
            className="font-medium text-muted-foreground hover:text-primary hover:underline transition-colors"
          >
            Ko'chirish
          </button>
        </p>
      </motion.div>
    </div>
  );
}
