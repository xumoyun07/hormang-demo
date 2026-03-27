import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  User, Mail, Phone, Lock, ChevronLeft, Loader2, CheckCircle2,
  MapPin, Clock, Briefcase, Save, ArrowRight, AlertTriangle, RefreshCw,
} from "lucide-react";
import logoImg from "/hormang-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { updateProfile, updateProviderProfile, sendSmsCode, addPhone } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

const SERVICE_CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enaga / Bola parvarishi",
  "Tadbir xizmatlari", "Ko'chirish / Transport", "Go'zallik / Sartaroshlik",
  "Avto xizmat", "Repetitor / O'qituvchi", "Ustachilik", "Boshqalar",
];

const accountSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 harf"),
  lastName: z.string().min(2, "Familiya kamida 2 harf"),
});

const contactSchema = z.object({
  email: z.string().email("To'g'ri email kiriting").optional().or(z.literal("")),
});

const providerSchema = z.object({
  bio: z.string().max(500).optional(),
  workingHours: z.string().optional(),
  preferredLocation: z.string().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;
type ContactForm = z.infer<typeof contactSchema>;
type ProviderForm = z.infer<typeof providerSchema>;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}

function SectionCard({ title, icon: Icon, children, accent }: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-2xl border card-shadow p-6 mb-6 ${accent ? "border-amber-200" : "border-gray-100"}`}
    >
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-amber-50" : "bg-blue-50"}`}>
          <Icon className={`w-4.5 h-4.5 ${accent ? "text-amber-600" : "text-blue-600"}`} />
        </div>
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function MigrationBanner({ onAddPhone }: { onAddPhone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3"
    >
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold text-amber-800 text-sm mb-1">Telefon raqamini bog'lang</p>
        <p className="text-amber-700 text-xs leading-relaxed mb-3">
          Hisobingizda telefon raqami yo'q. Keyingi safar kirish uchun raqamingizni bog'lang — 
          SMS kodi orqali tez va xavfsiz kiring.
        </p>
        <Button
          size="sm"
          onClick={onAddPhone}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" /> Telefon qo'shish
        </Button>
      </div>
    </motion.div>
  );
}

function AddPhoneModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const { setAuth, user, providerProfile } = useAuth();
  const { toast } = useToast();

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
    if (digits.length < 9) { setError("To'g'ri telefon raqami kiriting"); return; }
    setLoading(true);
    try {
      const res = await sendSmsCode(getFullPhone(), "add-phone");
      setDevCode(res.devCode ?? null);
      setStep("otp");
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    if (otp.length < 6) { setError("6 xonali kodni kiriting"); return; }
    setLoading(true);
    try {
      const res = await addPhone({ phone: getFullPhone(), otp });
      setAuth(res.user, providerProfile);
      toast({ title: "Telefon raqami muvaffaqiyatli qo'shildi" });
      onSuccess(getFullPhone());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm card-shadow"
      >
        <h3 className="font-bold text-gray-900 text-lg mb-1">Telefon raqam qo'shish</h3>
        <p className="text-gray-500 text-sm mb-4">
          {step === "phone" ? "Raqamingizni kiriting, SMS kod yuboriladi" : `+998 ${phone} ga kod yuborildi`}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center">
                <span className="h-11 px-3 flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500 select-none">+998</span>
                <input type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} onKeyDown={e => e.key === "Enter" && handleSendCode()}
                  placeholder="90 123 45 67" maxLength={12} autoFocus
                  className="flex-1 h-11 px-4 rounded-r-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 h-10 border-2 font-semibold text-sm">Bekor qilish</Button>
                <Button onClick={handleSendCode} disabled={loading} className="flex-1 h-10 font-bold text-sm gap-1">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  Kodni yuborish
                </Button>
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {devCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700 font-semibold mb-0.5">Demo rejim</p>
                  <p className="text-amber-900 font-bold tracking-[0.3em]">{devCode}</p>
                </div>
              )}
              <input type="text" inputMode="numeric" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                placeholder="000000" maxLength={6} autoFocus
                className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-2xl font-bold tracking-[0.4em] text-center" />
              <Button onClick={handleVerify} disabled={loading || otp.length < 6} className="w-full h-10 font-bold gap-1 text-sm">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Tasdiqlash
              </Button>
              <div className="flex justify-between">
                <button type="button" onClick={() => { setStep("phone"); setOtp(""); setDevCode(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Raqamni o'zgartirish
                </button>
                <button type="button" onClick={() => { if (resendTimer > 0) return; handleSendCode(); }} disabled={resendTimer > 0}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50">
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

function AccountSection() {
  const { user, setAuth, providerProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  async function onSubmit(data: AccountForm) {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await updateProfile({ firstName: data.firstName, lastName: data.lastName });
      setAuth(res.user, providerProfile);
      setSuccess(true);
      toast({ title: "Profil yangilandi" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Asosiy ma'lumotlar" icon={User}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ism</label>
            <input {...register("firstName")}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Familiya</label>
            <input {...register("lastName")}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            <Phone className="w-3.5 h-3.5 inline mr-1" /> Telefon (kirish identifikatori)
          </label>
          <div className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span>{user?.phone ?? "—"}</span>
            <span className="ml-auto text-xs text-gray-400 bg-gray-200 rounded-lg px-2 py-0.5">O'zgartirib bo'lmaydi</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Telefon raqami kirish uchun ishlatiladi</p>
        </div>

        <div className="pt-1">
          <Button type="submit" disabled={saving} size="sm" className="gap-2 font-bold">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saqlanmoqda..." : success ? "Saqlandi!" : "O'zgarishlarni saqlash"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function ContactInfoSection() {
  const { user, setAuth, providerProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: user?.email ?? "",
    },
  });

  async function onSubmit(data: ContactForm) {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await updateProfile({ email: data.email || undefined });
      setAuth(res.user, providerProfile);
      setSuccess(true);
      toast({ title: "Kontakt ma'lumotlari yangilandi" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Kontakt ma'lumotlari" icon={Mail}>
      <div className="mb-4 bg-blue-50 rounded-xl px-3 py-2.5">
        <p className="text-blue-700 text-xs leading-relaxed">
          Email ixtiyoriy va tasdiqlanmaydigan maydon. Xabarnomalar yoki qo'shimcha aloqa uchun ishlatilishi mumkin.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            <Mail className="w-3.5 h-3.5 inline mr-1" /> Email (ixtiyoriy)
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="email@example.com"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="pt-1">
          <Button type="submit" disabled={saving} size="sm" className="gap-2 font-bold">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saqlanmoqda..." : success ? "Saqlandi!" : "Saqlash"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function ProviderProfileSection() {
  const { providerProfile, setProviderProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selected, setSelected] = useState<string[]>(providerProfile?.categories ?? []);

  const { register, handleSubmit, formState: { errors } } = useForm<ProviderForm>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      bio: providerProfile?.bio ?? "",
      workingHours: providerProfile?.workingHours ?? "",
      preferredLocation: providerProfile?.preferredLocation ?? "",
    },
  });

  function toggleCat(cat: string) {
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function onSubmit(data: ProviderForm) {
    if (!selected.length) {
      toast({ title: "Kamida bitta kategoriya tanlang", variant: "destructive" });
      return;
    }
    setSaving(true);
    setSuccess(false);
    try {
      const res = await updateProviderProfile({
        categories: selected,
        bio: data.bio,
        workingHours: data.workingHours,
        preferredLocation: data.preferredLocation,
      });
      setProviderProfile(res.profile);
      setSuccess(true);
      toast({ title: "Ijrochi profili yangilandi" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Ijrochi profili" icon={Briefcase}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Xizmat kategoriyalari <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map(cat => {
              const active = selected.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold border-2 transition-all duration-150 flex items-center gap-1 ${active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {active && <CheckCircle2 className="w-3 h-3" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bio — o'zingiz haqida</label>
          <textarea {...register("bio")} rows={3}
            placeholder="Tajribangiz, ko'nikmalaringiz haqida qisqacha yozing..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none" />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Ish vaqti
            </label>
            <input {...register("workingHours")} placeholder="09:00 – 20:00"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> Hudud
            </label>
            <input {...register("preferredLocation")} placeholder="Toshkent, Yunusobod"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
          </div>
        </div>

        <div className="pt-1">
          <Button type="submit" disabled={saving} size="sm" className="gap-2 font-bold">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saqlanmoqda..." : success ? "Saqlandi!" : "Profilni yangilash"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export default function ProfileSettingsPage() {
  const { user, providerProfile, activeRole, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showAddPhone, setShowAddPhone] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth/login");
    return null;
  }

  const showProviderSection = activeRole === "provider" || providerProfile !== null;
  const needsPhoneMigration = !user.phone;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 card-shadow">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/dashboard")}
              className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-900 text-sm">Profil sozlamalari</span>
          </div>
          <button onClick={() => setLocation("/")} className="flex items-center">
            <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl font-black">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-500">{activeRole === "buyer" ? "Xaridor rejimi" : "Ijrochi rejimi"}</p>
              {providerProfile && (
                <button
                  onClick={() => setLocation(`/providers/${user.id}`)}
                  className="text-xs text-blue-600 hover:underline font-semibold mt-0.5 flex items-center gap-1"
                >
                  Ommaviy profilni ko'rish <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {needsPhoneMigration && (
          <MigrationBanner onAddPhone={() => setShowAddPhone(true)} />
        )}

        <AnimatePresence>
          <AccountSection />
          <ContactInfoSection />
          {showProviderSection && <ProviderProfileSection />}
        </AnimatePresence>
      </main>

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
