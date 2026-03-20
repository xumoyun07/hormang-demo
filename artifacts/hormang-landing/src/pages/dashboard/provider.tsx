import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Inbox, TrendingUp, Star, Settings, LogOut, CheckCircle2 } from "lucide-react";

export default function ProviderDashboard() {
  const { user, providerProfile, logout } = useAuth();
  const [, setLocation] = useLocation();

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow"
            style={{ background: "var(--brand-gradient)" }}
          >
            H
          </div>
          <span className="font-display font-bold text-foreground">Hormang</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Ijrochi</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
            {user?.firstName?.[0]}
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-black mx-auto mb-4">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              {user?.firstName} {user?.lastName}
            </h1>
            {providerProfile?.categories?.length ? (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {providerProfile.categories.slice(0, 3).map(cat => (
                  <span key={cat} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {cat}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            {[
              { icon: Inbox, title: "Yangi so'rovlar", desc: "Kelayotgan buyurtma so'rovlarini ko'ring", badge: "0" },
              { icon: TrendingUp, title: "Statistika", desc: "Ko'rishlar, buyurtmalar va daromad" },
              { icon: Star, title: "Sharhlarim", desc: "Mijozlar fikr-mulohazalari" },
              { icon: Settings, title: "Profil sozlamalari", desc: "Xizmatlar, bio va portfoningizni tahrirlash" },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <motion.button
                key={title}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="w-full text-left p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform relative">
                  <Icon className="w-5 h-5" />
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{title}</h3>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button onClick={() => setLocation("/")} variant="outline" className="border-2 font-semibold">
              Bosh sahifaga qaytish
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
