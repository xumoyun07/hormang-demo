import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ShoppingBag, Briefcase, ArrowRight } from "lucide-react";

export default function RoleSelectPage() {
  const [, setLocation] = useLocation();

  function pick(role: "buyer" | "provider") {
    setLocation(`/auth/register?role=${role}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center gap-2 mb-6 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ background: "var(--brand-gradient)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Hormang
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Xush kelibsiz!
          </h1>
          <p className="text-muted-foreground text-base">
            Hormangdan qanday foydalanmoqchisiz?
          </p>
        </div>

        <div className="grid gap-4">
          {[
            {
              role: "buyer" as const,
              icon: ShoppingBag,
              title: "Xizmat qidiraman",
              desc: "Tozalovchi, usta, enaga va boshqa mahalliy xizmatlarni toping",
            },
            {
              role: "provider" as const,
              icon: Briefcase,
              title: "Xizmat ko'rsataman",
              desc: "Profilingizni yarating va mahalliy mijozlarni toping",
            },
          ].map(({ role, icon: Icon, title, desc }) => (
            <motion.button
              key={role}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => pick(role)}
              className="group w-full text-left p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/60 hover:shadow-xl transition-all duration-250 flex items-start gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-110 transition-transform"
                style={{ background: "var(--brand-gradient)" }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
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
