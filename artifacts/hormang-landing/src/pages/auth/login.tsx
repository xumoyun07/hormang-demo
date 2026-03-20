import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { loginUser } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  contact: z.string().min(3, "Email yoki telefon talab qilinadi"),
  password: z.string().min(1, "Parol talab qilinadi"),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      const isEmail = data.contact.includes("@");
      const res = await loginUser({
        email: isEmail ? data.contact : undefined,
        phone: !isEmail ? data.contact : undefined,
        password: data.password,
      });
      setAuth(res.user, res.providerProfile);
      toast({ title: `Xush kelibsiz, ${res.user.firstName}!` });
      setLocation(res.user.role === "provider" ? "/dashboard/provider" : "/dashboard/buyer");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setServerError(msg);
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
          <div
            className="inline-flex items-center gap-2 mb-5 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ background: "var(--brand-gradient)" }}
          >
            Hormang
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Hisobingizga kiring</h1>
          <p className="text-muted-foreground text-sm">Ro'yxatdan o'tishda ishlatgan ma'lumotlaringizni kiriting</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3"
            >
              {serverError}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Email yoki telefon
            </label>
            <input
              {...register("contact")}
              type="text"
              placeholder="+998901234567 yoki email@example.com"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
            />
            {errors.contact && (
              <p className="text-destructive text-xs mt-1">{errors.contact.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-foreground">Parol</label>
              <button
                type="button"
                onClick={() => setLocation("/auth/forgot-password")}
                className="text-xs text-primary hover:underline font-medium"
              >
                Parolni unutdingizmi?
              </button>
            </div>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="Parolingizni kiriting"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register("rememberMe")}
              id="remember"
              type="checkbox"
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Meni eslab qol
            </label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 font-bold text-sm gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {isSubmitting ? "Kirish..." : "Kirish"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Hali ro'yxatdan o'tmaganmisiz?{" "}
          <button
            onClick={() => setLocation("/auth/role")}
            className="font-bold text-primary hover:underline"
          >
            Ro'yxatdan o'tish
          </button>
        </p>
      </motion.div>
    </div>
  );
}
