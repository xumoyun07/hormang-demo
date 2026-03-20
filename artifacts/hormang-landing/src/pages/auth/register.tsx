import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { registerUser, saveProviderProfile } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

const SERVICE_CATEGORIES = [
  "Tozalik", "Ta'mirlash / Usta", "Enaga / Bola parvarishi",
  "Ovqat pishirish", "Ko'chirish / Transport", "Go'zallik / Sartaroshlik",
  "Avto xizmat", "Repetitor / O'qituvchi", "Elektr ishlari",
  "Santexnika", "Dizayn / Yaratuvchanlik", "Boshqalar",
];

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Juda zaif", "Zaif", "O'rtacha", "Kuchli", "Juda kuchli"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-600"];
  return { score, label: labels[score], color: colors[score] };
}

const step1Schema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 harf"),
  lastName: z.string().min(2, "Familiya kamida 2 harf"),
  contactType: z.enum(["email", "phone"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "Kamida 8 belgi").regex(/[A-Z]/, "Kamida bitta katta harf").regex(/[0-9]/, "Kamida bitta raqam"),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: "Shartlarga rozilik bildirishingiz kerak" }) }),
}).superRefine((d, ctx) => {
  if (d.contactType === "email" && !d.email?.includes("@")) {
    ctx.addIssue({ code: "custom", path: ["email"], message: "To'g'ri email kiriting" });
  }
  if (d.contactType === "phone" && (d.phone?.replace(/\D/g, "").length ?? 0) < 9) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "To'g'ri telefon raqami kiriting" });
  }
});

const step2Schema = z.object({
  categories: z.array(z.string()).min(1, "Kamida bitta kategoriya tanlang"),
  bio: z.string().max(300).optional(),
  workingHours: z.string().optional(),
  preferredLocation: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = passwordStrength(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? color : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Step1Form({ role, onDone }: { role: "buyer" | "provider"; onDone: (d: Step1Data) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [contactType, setContactType] = useState<"email" | "phone">("email");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { contactType: "email" },
  });

  const pw = watch("password") ?? "";

  return (
    <form onSubmit={handleSubmit(onDone)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Ism</label>
          <input {...register("firstName")} placeholder="Alisher" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Familiya</label>
          <input {...register("lastName")} placeholder="Toshmatov" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Aloqa turi</label>
        <div className="flex gap-2 mb-3">
          {(["email", "phone"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setContactType(t); setValue("contactType", t); }}
              className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-all ${contactType === t ? "text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              style={contactType === t ? { background: "var(--brand-gradient)" } : {}}
            >
              {t === "email" ? "Email" : "Telefon"}
            </button>
          ))}
        </div>

        {contactType === "email" ? (
          <input {...register("email")} type="email" placeholder="email@example.com" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        ) : (
          <input {...register("phone")} type="tel" placeholder="+998 90 123 45 67" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        )}
        {(errors.email || errors.phone) && (
          <p className="text-destructive text-xs mt-1">{errors.email?.message ?? errors.phone?.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Parol</label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPw ? "text" : "password"}
            placeholder="Kamida 8 belgi, 1 katta harf, 1 raqam"
            className="w-full h-11 px-4 pr-11 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <StrengthBar password={pw} />
        {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div className="flex items-start gap-2">
        <input {...register("agreeTerms")} id="terms" type="checkbox" className="w-4 h-4 mt-0.5 rounded accent-primary border-border" />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          <span className="text-primary font-semibold hover:underline cursor-pointer">Foydalanish shartlari</span> va{" "}
          <span className="text-primary font-semibold hover:underline cursor-pointer">Maxfiylik siyosatiga</span> roziman
        </label>
      </div>
      {errors.agreeTerms && <p className="text-destructive text-xs -mt-2">{errors.agreeTerms.message}</p>}

      <Button type="submit" className="w-full h-11 font-bold gap-2">
        {role === "buyer" ? "Ro'yxatdan o'tish" : "Davom etish"} <ChevronRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

function Step2Form({ onDone, onBack, loading }: { onDone: (d: Step2Data) => void; onBack: () => void; loading: boolean }) {
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
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
                className={`text-xs px-3 py-2 rounded-xl font-semibold border-2 transition-all duration-200 flex items-center gap-1 ${active ? "text-white border-transparent shadow-md" : "bg-muted border-transparent text-muted-foreground hover:border-primary/30"}`}
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
        <textarea
          {...register("bio")}
          rows={3}
          placeholder="Tajribangiz, ko'nikmalaringiz, mahalliy xizmatlaringiz haqida qisqacha yozing..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Ish vaqti <span className="text-muted-foreground font-normal">(ixtiyoriy)</span></label>
          <input {...register("workingHours")} placeholder="Masalan: 09:00 – 20:00" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Hudud <span className="text-muted-foreground font-normal">(ixtiyoriy)</span></label>
          <input {...register("preferredLocation")} placeholder="Toshkent, Yunusobod" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
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
  const { setAuth } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalSteps = role === "provider" ? 2 : 1;

  async function handleStep1(data: Step1Data) {
    if (role === "buyer") {
      setLoading(true);
      setServerError("");
      try {
        const res = await registerUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.contactType === "email" ? data.email : undefined,
          phone: data.contactType === "phone" ? data.phone : undefined,
          password: data.password,
          role: "buyer",
        });
        setAuth(res.user, null);
        toast({ title: `Xush kelibsiz, ${res.user.firstName}! Hormangga xush kelibsiz.` });
        setLocation("/dashboard/buyer");
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    } else {
      setStep1Data(data);
      setStep(2);
    }
  }

  async function handleStep2(data: Step2Data) {
    if (!step1Data) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await registerUser({
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        email: step1Data.contactType === "email" ? step1Data.email : undefined,
        phone: step1Data.contactType === "phone" ? step1Data.phone : undefined,
        password: step1Data.password,
        role: "provider",
      });
      const { profile } = await saveProviderProfile({
        categories: data.categories,
        bio: data.bio,
        workingHours: data.workingHours,
        preferredLocation: data.preferredLocation,
      });
      setAuth(res.user, profile);
      toast({ title: `Profilingiz tayyor, ${res.user.firstName}! Endi so'rovlar kuting.` });
      setLocation("/dashboard/provider");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = role === "buyer" ? "Xaridor" : "Ijrochi";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center gap-2 mb-5 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ background: "var(--brand-gradient)" }}
          >
            Hormang · {roleLabel}
          </div>

          {totalSteps > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-400"
                  style={{
                    width: i + 1 === step ? 32 : 16,
                    background: i + 1 <= step ? "var(--brand-gradient)" : undefined,
                    backgroundColor: i + 1 > step ? "var(--muted)" : undefined,
                  }}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{step}/{totalSteps}</span>
            </div>
          )}

          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {step === 1 ? "Hisobingizni yarating" : "Ijrochi profilingiz"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1
              ? "Asosiy ma'lumotlarni kiriting"
              : "Xizmatlaringiz haqida ko'proq ma'lumot bering"}
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
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Step1Form role={role} onDone={handleStep1} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Step2Form onDone={handleStep2} onBack={() => setStep(1)} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Allaqachon hisobingiz bormi?{" "}
          <button
            onClick={() => setLocation("/auth/login")}
            className="font-bold text-primary hover:underline"
          >
            Kirish
          </button>
        </p>
      </motion.div>
    </div>
  );
}
