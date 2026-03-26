import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  User, Mail, Phone, Lock, ChevronLeft, Loader2, CheckCircle2,
  Eye, EyeOff, MapPin, Clock, Briefcase, Save, ArrowRight,
} from "lucide-react";
import logoImg from "/hormang-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { updateProfile, updateProviderProfile, changePassword } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

const SERVICE_CATEGORIES = [
  "Tozalash", "Ta'mirlash", "Enaga / Bola parvarishi",
  "Tadbir xizmatlari", "Ko'chirish / Transport", "Go'zallik / Sartaroshlik",
  "Avto xizmat", "Repetitor / O'qituvchi", "Ustachilik", "Boshqalar",
];

const accountSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 harf"),
  lastName: z.string().min(2, "Familiya kamida 2 harf"),
  email: z.string().email("To'g'ri email kiriting").optional().or(z.literal("")),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Joriy parolni kiriting"),
  newPassword: z.string().min(8, "Kamida 8 belgi").regex(/[A-Z]/, "Kamida 1 katta harf").regex(/[0-9]/, "Kamida 1 raqam"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Parollar mos kelmayapti",
});

const providerSchema = z.object({
  bio: z.string().max(500).optional(),
  workingHours: z.string().optional(),
  preferredLocation: z.string().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type ProviderForm = z.infer<typeof providerSchema>;

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 mb-6"
    >
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-blue-600" />
        </div>
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
      </div>
      {children}
    </motion.div>
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
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  async function onSubmit(data: AccountForm) {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
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
            <input
              {...register("firstName")}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Familiya</label>
            <input
              {...register("lastName")}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            <Mail className="w-3.5 h-3.5 inline mr-1" /> Email
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="email@example.com"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            <Phone className="w-3.5 h-3.5 inline mr-1" /> Telefon
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+998 90 123 45 67"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
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

function PasswordSection() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(data: PasswordForm) {
    setSaving(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast({ title: "Parol muvaffaqiyatli o'zgartirildi" });
      reset();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Xatolik", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Parolni o'zgartirish" icon={Lock}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Joriy parol</label>
          <div className="relative">
            <input
              {...register("currentPassword")}
              type={showCurrent ? "text" : "password"}
              className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yangi parol</label>
          <div className="relative">
            <input
              {...register("newPassword")}
              type={showNew ? "text" : "password"}
              placeholder="Kamida 8 belgi, 1 katta harf, 1 raqam"
              className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yangi parolni tasdiqlang</label>
          <input
            {...register("confirmPassword")}
            type="password"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <div className="pt-1">
          <Button type="submit" disabled={saving} size="sm" variant="outline" className="gap-2 font-bold border-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {saving ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
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
          <label className="block text-xs font-semibold text-gray-600 mb-2">Xizmat kategoriyalari <span className="text-red-500">*</span></label>
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
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Bio — o'zingiz haqida
          </label>
          <textarea
            {...register("bio")}
            rows={3}
            placeholder="Tajribangiz, ko'nikmalaringiz haqida qisqacha yozing..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
          />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Ish vaqti
            </label>
            <input
              {...register("workingHours")}
              placeholder="09:00 – 20:00"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> Hudud
            </label>
            <input
              {...register("preferredLocation")}
              placeholder="Toshkent, Yunusobod"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
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
          <img src={logoImg} alt="Hormang" className="w-8 h-8 object-contain" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
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

        <AnimatePresence>
          <AccountSection />
          {showProviderSection && <ProviderProfileSection />}
          <PasswordSection />
        </AnimatePresence>
      </main>
    </div>
  );
}
