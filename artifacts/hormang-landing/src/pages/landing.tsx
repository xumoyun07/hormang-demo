import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView, useScroll, useMotionValueEvent } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Wrench, Baby, ChefHat, Truck,
  Scissors, CarFront, GraduationCap, ShieldCheck,
  MessageSquare, CreditCard, Bot, CheckCircle2, TrendingUp,
  XCircle, Search, Users, Star, Edit3, ArrowRight, Loader2, MapPin, ArrowUpRight, Zap
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────── */
const DEMO_PROVIDERS: Record<string, { name: string; category: string; rating: number; reviews: number; price: string; tag: string; gradient: string; initials: string }[]> = {
  default: [
    { name: "Alisher T.", category: "Santexnika va ta'mirlash", rating: 4.9, reviews: 128, price: "50 000 so'mdan", tag: "Top Baholangan", gradient: "linear-gradient(135deg,#0f4c75,#1b6ca8)", initials: "AT" },
    { name: "Dilnoza M.", category: "Uy tozalash", rating: 4.8, reviews: 94, price: "80 000 so'mdan", tag: "Tez Javob", gradient: "linear-gradient(135deg,#6a0572,#ab47bc)", initials: "DM" },
    { name: "Rustam K.", category: "Elektr ishlari", rating: 5.0, reviews: 57, price: "60 000 so'mdan", tag: "Tasdiqlangan", gradient: "linear-gradient(135deg,#00664f,#00c853)", initials: "RK" },
  ],
  clean: [
    { name: "Gulnora S.", category: "Uy tozalash", rating: 4.9, reviews: 211, price: "70 000 so'mdan", tag: "Top Baholangan", gradient: "linear-gradient(135deg,#880e4f,#e91e63)", initials: "GS" },
    { name: "Barno U.", category: "Chuqur tozalash", rating: 4.8, reviews: 86, price: "90 000 so'mdan", tag: "Tez Javob", gradient: "linear-gradient(135deg,#b71c1c,#ef5350)", initials: "BU" },
    { name: "Cleaning Pro", category: "Ofis tozalash", rating: 4.7, reviews: 142, price: "100 000 so'mdan", tag: "Tasdiqlangan", gradient: "linear-gradient(135deg,#283593,#42a5f5)", initials: "CP" },
  ],
  plumb: [
    { name: "Alisher T.", category: "Santexnika", rating: 4.9, reviews: 128, price: "50 000 so'mdan", tag: "Top Baholangan", gradient: "linear-gradient(135deg,#0f4c75,#1b6ca8)", initials: "AT" },
    { name: "Jasur B.", category: "Quvur ta'mirlash", rating: 4.8, reviews: 73, price: "45 000 so'mdan", tag: "Tez Javob", gradient: "linear-gradient(135deg,#00695c,#26a69a)", initials: "JB" },
    { name: "Firdavs N.", category: "Santexnika va isitish", rating: 4.9, reviews: 99, price: "55 000 so'mdan", tag: "Tasdiqlangan", gradient: "linear-gradient(135deg,#004d40,#00bfa5)", initials: "FN" },
  ],
  baby: [
    { name: "Malika R.", category: "Enaga / Bola parvarishi", rating: 5.0, reviews: 63, price: "30 000 so'm/soat", tag: "Top Baholangan", gradient: "linear-gradient(135deg,#e65100,#ff9800)", initials: "MR" },
    { name: "Shahlo D.", category: "Bola parvarishi", rating: 4.9, reviews: 41, price: "25 000 so'm/soat", tag: "Tez Javob", gradient: "linear-gradient(135deg,#f57f17,#fdd835)", initials: "SD" },
    { name: "Nargiza A.", category: "Enaga + Repetitor", rating: 4.8, reviews: 88, price: "35 000 so'm/soat", tag: "Tasdiqlangan", gradient: "linear-gradient(135deg,#bf360c,#ff7043)", initials: "NA" },
  ],
};

const EXAMPLE_PROMPTS = [
  "Oshxona kranidan suv oqmoqda",
  "Shanba kuni enaga kerak",
  "Uyni chuqur tozalash",
  "Rozetka ishlamayapti",
  "Mehmonlar uchun ovqat",
];

const UZ_REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon viloyati",
  "Farg'ona viloyati", "Namangan viloyati", "Samarqand viloyati",
  "Buxoro viloyati", "Navoiy viloyati", "Qashqadaryo viloyati",
  "Surxondaryo viloyati", "Jizzax viloyati", "Sirdaryo viloyati",
  "Xorazm viloyati", "Qoraqalpog'iston Respublikasi",
];

function getProviderKey(q: string) {
  const ql = q.toLowerCase();
  if (ql.includes("tozal")) return "clean";
  if (ql.includes("kran") || ql.includes("suv") || ql.includes("santex")) return "plumb";
  if (ql.includes("enaga") || ql.includes("bola")) return "baby";
  return "default";
}

/* ─── 3D Tilt Hook (dramatic 15°) ─────────────────────────────── */
function use3DTilt(intensity = 15) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-intensity, intensity]);
  const glowX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(y, [-0.5, 0.5], [0, 100]);
  const springRotateX = useSpring(rotateX, { stiffness: 120, damping: 22 });
  const springRotateY = useSpring(rotateY, { stiffness: 120, damping: 22 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const handleLeave = useCallback(() => {
    x.set(0); y.set(0);
  }, [x, y]);

  return { rotateX: springRotateX, rotateY: springRotateY, glowX, glowY, handleMouse, handleLeave };
}

/* ─── Animated Counter ─────────────────────────────────────────── */
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const spring = useSpring(count, { stiffness: 50, damping: 18 });

  useEffect(() => {
    if (isInView) spring.set(to);
  }, [isInView, to, spring]);

  return <span ref={ref} className="tabular-nums"><motion.span>{rounded}</motion.span>{suffix}</span>;
}

/* ─── Glowing Orb ──────────────────────────────────────────────── */
function GlowOrb({ size, x, y, delay, opacity, color = "155, 100%, 46%" }: {
  size: number; x: string; y: string; delay: number; opacity: number; color?: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{ y: [0, -40, 0], scale: [1, 1.08, 1], opacity: [opacity, opacity * 1.3, opacity] }}
      transition={{ duration: 10 + delay * 2, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div
        className="w-full h-full rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, hsl(${color}) 0%, transparent 70%)` }}
      />
    </motion.div>
  );
}

/* ─── Particle field ────────────────────────────────────────────── */
function ParticleField({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 6,
    duration: 8 + Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: "hsl(155, 100%, 60%)" }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Results Modal ─────────────────────────────────────────────── */
function ResultsModal({ results, onClose }: { results: typeof DEMO_PROVIDERS.default; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 40 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative glass-strong rounded-3xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto glow-md"
        onClick={(e) => e.stopPropagation()}
        style={{ perspective: "1000px" }}
      >
        <div className="sticky top-0 glass-strong border-b border-white/8 px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "var(--g-neon)" }}
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
            />
            <span className="font-bold text-sm text-foreground">
              {results.length} ta mutaxassis sizga yaqin topildi
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/14 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {results.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 glass rounded-2xl p-4 neon-border-hover cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg" style={{ background: p.gradient }}>
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-foreground">{p.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.tag === "Top Baholangan" ? "bg-yellow-500/15 text-yellow-400"
                    : p.tag === "Tez Javob" ? "bg-primary/15 text-primary"
                    : "bg-blue-500/15 text-blue-400"
                  }`}>{p.tag}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-foreground">{p.rating}</span>
                  <span className="text-xs text-muted-foreground">({p.reviews} sharh)</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-primary">{p.price}</span>
                <Button size="sm" className="h-8 px-4 text-xs rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 glow-sm">
                  Bog'lanish <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="sticky bottom-0 glass-strong border-t border-white/8 px-6 py-4 rounded-b-3xl">
          <p className="text-center text-xs text-muted-foreground mb-3">
            To'liq profil va tezkor bron uchun ro'yxatdan o'ting.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1 font-bold glow-sm">Bepul ro'yxatdan o'tish</Button>
            <Button variant="outline" className="flex-1 font-bold border-white/15 hover:border-primary/50">Ijrochi bo'lish</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Rotating Words ────────────────────────────────────────────── */
const ROTATE_WORDS = ["santexnikani", "tozalovchini", "enagani", "repetitorni", "ustani"];

function TypewriterHeadline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ROTATE_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.05] mb-6 tracking-tight">
      <motion.span
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="block text-foreground"
      >
        Kerakli
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative inline-block"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-gradient glow-text inline-block"
          >
            {ROTATE_WORDS[idx]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="block text-foreground"
      >
        bir zumda toping
      </motion.span>
    </h1>
  );
}

/* ─── 3D Provider Card (floating hero decoration) ───────────────── */
function FloatingProviderCard({ name, cat, rating, initials, gradient, x, y, rotate, delay, floatDir }: {
  name: string; cat: string; rating: number; initials: string; gradient: string;
  x: string; y: string; rotate: number; delay: number; floatDir: 1 | -1;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", left: x, top: y }}
      className="hidden lg:block"
    >
      <motion.div
        animate={{ y: [0, floatDir * 18, 0], rotate: [rotate, rotate + floatDir * 2, rotate] }}
        transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay: delay * 0.5 }}
        className="glass rounded-2xl p-4 w-52 neon-border glow-sm cursor-default select-none"
        style={{ rotate }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0" style={{ background: gradient }}>
            {initials}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{cat}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
          <span className="text-xs font-bold text-foreground ml-1">{rating}</span>
        </div>
        <div className="mt-2 h-0.5 rounded-full" style={{ background: "var(--brand-gradient)", opacity: 0.5 }} />
      </motion.div>
    </motion.div>
  );
}

/* ─── Hero Section ──────────────────────────────────────────────── */
function HeroSection() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(UZ_REGIONS[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof DEMO_PROVIDERS.default | null>(null);
  const [showModal, setShowModal] = useState(false);

  function handleSearch(q = query) {
    if (!q.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setResults(DEMO_PROVIDERS[getProviderKey(q)] ?? DEMO_PROVIDERS.default);
      setShowModal(true);
    }, 1600);
  }

  function handlePromptClick(p: string) {
    setQuery(p);
    setTimeout(() => handleSearch(p), 50);
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-bg grain">
      <ParticleField count={35} />

      {/* Ambient glows */}
      <GlowOrb size={700} x="55%" y="-18%" delay={0} opacity={0.12} />
      <GlowOrb size={500} x="-12%" y="50%" delay={3} opacity={0.09} />
      <GlowOrb size={350} x="80%" y="65%" delay={1.5} opacity={0.07} color="152, 80%, 38%" />

      {/* Perspective grid */}
      <div className="absolute inset-0 perspective-grid pointer-events-none" style={{ opacity: 0.6 }} />

      {/* Floating decorative provider cards */}
      <FloatingProviderCard name="Alisher T." cat="Santexnik" rating={4.9} initials="AT" gradient="linear-gradient(135deg,#0f4c75,#1b6ca8)" x="72%" y="18%" rotate={6} delay={0.6} floatDir={1} />
      <FloatingProviderCard name="Gulnora S." cat="Tozalovchi" rating={5.0} initials="GS" gradient="linear-gradient(135deg,#00664f,#00c853)" x="68%" y="54%" rotate={-5} delay={0.9} floatDir={-1} />
      <FloatingProviderCard name="Malika R." cat="Enaga" rating={4.9} initials="MR" gradient="linear-gradient(135deg,#880e4f,#e91e63)" x="60%" y="76%" rotate={3} delay={1.2} floatDir={1} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 text-center py-28 pt-36">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-xs mb-8 border border-primary/30 glow-sm"
          style={{ background: "hsl(155, 100%, 46%, 0.1)", color: "var(--g-neon)" }}
        >
          <motion.div
            animate={{ rotate: [0, 20, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          >
            <Bot className="w-3.5 h-3.5" />
          </motion.div>
          Sun'iy intellekt yordamida mahalliy xizmat topish
        </motion.div>

        {/* Headline */}
        <TypewriterHeadline />

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed font-light"
        >
          Ehtiyojingizni yozing — sun'iy intellekt sizga eng yaxshi mahalliy mutaxassisni topadi.
        </motion.p>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong rounded-2xl mb-5 p-3 text-left glow-md"
          style={{ border: "1px solid hsl(155, 100%, 50%, 0.25)" }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-black shadow-lg glow-sm"
              style={{ background: "var(--brand-gradient)" }}
            >
              <Bot className="w-5 h-5" />
            </motion.div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Masalan: Oshxona kranidan suv oqmoqda..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isSearching}
              className="h-10 px-5 rounded-xl font-bold text-sm gap-1.5 flex-shrink-0 glow-sm text-black"
              style={{ background: "var(--brand-gradient)" }}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? "Qidirilmoqda..." : "Topish"}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 pl-12 border-t border-white/8 pt-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--g-neon)" }} />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex-1 bg-transparent text-xs text-muted-foreground outline-none cursor-pointer hover:text-foreground transition-colors appearance-none"
            >
              {UZ_REGIONS.map((r) => <option key={r} value={r}>{r}, O'zbekiston</option>)}
            </select>
          </div>
        </motion.div>

        {/* Prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          <span className="text-[11px] text-muted-foreground self-center">Sinab ko'ring:</span>
          {EXAMPLE_PROMPTS.map((p, i) => (
            <motion.button
              key={p}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.92 + i * 0.06 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handlePromptClick(p)}
              className="text-[11px] px-3.5 py-1.5 rounded-full glass neon-border text-muted-foreground hover:text-primary transition-all duration-300"
            >
              {p}
            </motion.button>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground"
        >
          {[
            { icon: ShieldCheck, label: "Tasdiqlangan mutaxassislar" },
            { icon: CheckCircle2, label: "Yashirin to'lovlar yo'q" },
            { icon: CreditCard, label: "Karta yoki naqd" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4" style={{ color: "var(--g-neon)" }} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && results && <ResultsModal results={results} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </section>
  );
}

/* ─── Problem / Solution ─────────────────────────────────────────── */
function ProblemSolutionSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const problems = [
    "Ishonchli mahalliy mutaxassis topish qiyin",
    "Sovuq, shaxssiz platformalar",
    "Sekin og'izdan-og'izga tarqalish",
    "Noaniq va yashirin narxlar",
  ];

  const solutions = [
    "Tasdiqlangan mutaxassislar — sizga yaqin",
    "Insoniy, iliq bozor maydoni",
    "Sun'iy intellekt bilan tezkor moslashtirish",
    "Shaffof narxlar va haqiqiy sharhlar",
  ];

  return (
    <section ref={ref} className="py-32 overflow-hidden relative" style={{ background: "hsl(150, 38%, 5%)" }}>
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <GlowOrb size={500} x="80%" y="10%" delay={0} opacity={0.06} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-5">
            Nima uchun <span className="text-gradient">Hormang</span> yaratildi
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Yangi shaharga ko'chganingizda yoki shoshilinch yordam kerak bo'lganda ishonchli mahalliy mutaxassis topish juda qiyin.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50, rotateY: -6 }}
            animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: "1000px" }}
            className="glass rounded-3xl p-8 lg:p-10 relative overflow-hidden border border-destructive/15"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-destructive/4 blur-2xl" />
            <h3 className="text-2xl font-bold mb-8 text-destructive/80 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-destructive/12 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive/70" />
              </span>
              Eski usul
            </h3>
            <ul className="space-y-5">
              {problems.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.28 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4"
                >
                  <XCircle className="w-5 h-5 text-destructive/40 shrink-0 mt-0.5" />
                  <span className="text-base text-foreground/70 font-medium">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 6 }}
            animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: "1000px" }}
            className="glass rounded-3xl p-8 lg:p-10 relative overflow-hidden neon-border glow-sm"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/6 blur-2xl" />
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: "var(--g-neon)" }}>
              <span className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" style={{ color: "var(--g-neon)" }} />
              </span>
              Hormang usuli
            </h3>
            <ul className="space-y-5">
              {solutions.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.38 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--g-neon)" }} />
                  <span className="text-base text-foreground font-semibold">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Section ──────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: 5000, suffix: "+", label: "Ro'yxatdan o'tgan ijrochilar" },
    { value: 20, suffix: "+", label: "Xizmat turlari" },
    { value: 50000, suffix: "+", label: "Bajarilgan topshiriqlar" },
    { value: 4.8, suffix: "★", label: "O'rtacha reyting" },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--brand-gradient)" }} />
      <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
      <GlowOrb size={500} x="50%" y="-30%" delay={0} opacity={0.15} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="px-4"
            >
              <p className="text-5xl md:text-6xl font-display font-extrabold text-black mb-2" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm md:text-base font-semibold text-black/65">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 3D Category Card ──────────────────────────────────────────── */
function CategoryCard({ icon: Icon, name, desc, index }: { icon: React.FC<{ className?: string }>; name: string; desc: string; index: number }) {
  const { rotateX, rotateY, glowX, glowY, handleMouse, handleLeave } = use3DTilt(14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        className="group relative glass rounded-2xl border border-white/8 shadow-xl hover:border-primary/35 transition-colors duration-500 cursor-pointer overflow-hidden p-6 neon-border-hover"
      >
        {/* Dynamic spotlight */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
          style={{
            background: useTransform([glowX, glowY], ([gx, gy]) =>
              `radial-gradient(circle 120px at ${gx}% ${gy}%, hsl(155, 100%, 50%, 0.08) 0%, transparent 70%)`
            ),
          }}
        />
        <div className="relative z-10" style={{ transformStyle: "preserve-3d" }}>
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-black shadow-xl glow-sm"
            style={{ background: "var(--brand-gradient)", translateZ: "20px" }}
            whileHover={{ scale: 1.15, rotateZ: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            <Icon className="w-7 h-7" />
          </motion.div>
          <h3 className="font-bold text-lg mb-2 text-foreground">{name}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CategoriesSection() {
  const categories = [
    { icon: Sparkles, name: "Tozalik", desc: "Kvartira, ofis, oyna tozalash" },
    { icon: Wrench, name: "Ta'mirlash", desc: "Santexnika, elektr, qo'l ishlari" },
    { icon: Baby, name: "Enagalar", desc: "Bola va keksa parvarishi" },
    { icon: ChefHat, name: "Ovqat pishirish", desc: "Uy oshpazi, tortlar, katering" },
    { icon: Truck, name: "Ko'chirish", desc: "Ko'chirish va transport" },
    { icon: Scissors, name: "Go'zallik", desc: "Manikur, soch, makiyaj" },
    { icon: CarFront, name: "Avto xizmat", desc: "Diagnostika, yuvish, shinalar" },
    { icon: GraduationCap, name: "Repetitorlar", desc: "Tillar, maktab, musiqa" },
  ];

  return (
    <section id="categories" className="py-32 relative overflow-hidden" style={{ background: "hsl(150, 36%, 5%)" }}>
      <div className="absolute inset-0 perspective-grid pointer-events-none" />
      <GlowOrb size={600} x="-10%" y="30%" delay={1} opacity={0.07} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-5 px-4 py-2 rounded-full border border-primary/25 glow-sm" style={{ color: "var(--g-neon)", background: "hsl(155, 100%, 46%, 0.08)" }}>
              Kategoriyalar
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-4">
              <span className="text-gradient">Mashhur</span> xizmatlar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bir necha bosish bilan istalgan topshiriq uchun mutaxassis toping.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <CategoryCard key={i} icon={cat.icon} name={cat.name} desc={cat.desc} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 text-center"
        >
          <Button variant="outline" size="lg" className="border border-white/15 font-semibold gap-2 hover:border-primary/40 hover:bg-primary/6 transition-all duration-500">
            Barcha 20+ kategoriyalarni ko'rish
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: "01", icon: Edit3, title: "Ehtiyojingizni yozing", desc: "Oddiy so'zlar bilan yozing — sun'iy intellekt eng yaxshi moslikni topadi." },
    { num: "02", icon: Search, title: "Ijrochilarni ko'ring", desc: "Profillar, reytinglar, portfolio va narxlarni ko'ring." },
    { num: "03", icon: MessageSquare, title: "Muzokaralar", desc: "Ijrochilar bilan to'g'ridan-to'g'ri muloqot qiling." },
    { num: "04", icon: CreditCard, title: "Buyurtma, to'lov, baho", desc: "Karta yoki naqd to'lang, keyin sharh qoldiring." },
  ];

  return (
    <section id="how-it-works" className="py-32 overflow-hidden relative" style={{ background: "hsl(150, 40%, 4%)" }}>
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <GlowOrb size={500} x="100%" y="50%" delay={2} opacity={0.07} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-5 px-4 py-2 rounded-full border border-primary/25 glow-sm" style={{ color: "var(--g-neon)", background: "hsl(155, 100%, 46%, 0.08)" }}>
            Jarayon
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-4">
            So'rovdan bajarilishigacha —{" "}
            <span className="text-gradient">daqiqalarda</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px pointer-events-none" style={{ background: "linear-gradient(to right, transparent, hsl(155, 100%, 46%, 0.2), hsl(155, 100%, 46%, 0.4), hsl(155, 100%, 46%, 0.2), transparent)" }} />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.14, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative glass rounded-3xl p-7 border border-white/8 hover:border-primary/30 transition-all duration-500 group neon-border-hover"
            >
              {/* Step number */}
              <div className="absolute -top-5 -left-3 text-7xl font-display font-extrabold select-none leading-none" style={{ color: "hsl(155, 60%, 40%, 0.08)" }}>
                {step.num}
              </div>
              <motion.div
                className="w-14 h-14 rounded-2xl text-black flex items-center justify-center mb-6 relative z-10 shadow-xl glow-sm"
                style={{ background: "var(--brand-gradient)" }}
                whileHover={{ scale: 1.15, rotate: -10 }}
                transition={{ type: "spring", stiffness: 280, damping: 16 }}
              >
                <step.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Buyer Benefits ────────────────────────────────────────────── */
function BuyerBenefitsSection() {
  const features = [
    { icon: ShieldCheck, title: "Ishonchli mutaxassislar", desc: "Har bir ijrochida tasdiqlangan sharhlar va haqiqiy portfolio mavjud." },
    { icon: Bot, title: "Sun'iy intellekt qidiruvi", desc: "Oddiy so'zlar bilan yozing — Hormang eng yaxshi moslikni topadi." },
    { icon: MessageSquare, title: "Bevosita muloqot", desc: "Ijrochilar bilan to'g'ridan-to'g'ri, narx va vaqt haqida vositachisiz." },
    { icon: CreditCard, title: "Qulay to'lov", desc: "Karta yoki naqd to'lang. Yashirin to'lovlar yo'q." },
  ];

  const providerCards = [
    { name: "Alisher T.", cat: "Santexnika", rating: 4.9, gradient: "linear-gradient(135deg,#0f4c75,#1b6ca8)", initials: "AT", rotate: -6, x: "-30px", y: "-10px", z: 0 },
    { name: "Dilnoza M.", cat: "Tozalik", rating: 4.8, gradient: "linear-gradient(135deg,#6a0572,#ab47bc)", initials: "DM", rotate: 4, x: "30px", y: "20px", z: 1 },
    { name: "Rustam K.", cat: "Elektr", rating: 5.0, gradient: "linear-gradient(135deg,#00664f,#00c853)", initials: "RK", rotate: 0, x: "0px", y: "0px", z: 2 },
  ];

  return (
    <section className="py-32 overflow-hidden relative" style={{ background: "hsl(150, 38%, 5%)" }}>
      <div className="absolute inset-0 perspective-grid pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Floating mock cards */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="relative h-72 flex items-center justify-center" style={{ perspective: "900px" }}>
              {providerCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 + i * 0.18, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  animate={{ y: [0, -12, 0] }}
                  whileHover={{ scale: 1.08, zIndex: 30 }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${card.x} - 110px)`,
                    zIndex: card.z,
                    rotate: card.rotate,
                    animationDelay: `${i * 1.2}s`,
                    animationDuration: `${7 + i}s`,
                    animationIterationCount: "infinite",
                    animationTimingFunction: "ease-in-out",
                  }}
                  className="w-56 glass rounded-2xl p-4 neon-border glow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0" style={{ background: card.gradient }}>
                      {card.initials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground">{card.cat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                    <span className="text-xs font-bold text-foreground ml-1">{card.rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-5 px-4 py-2 rounded-full border border-primary/25 glow-sm" style={{ color: "var(--g-neon)", background: "hsl(155, 100%, 46%, 0.08)" }}>
                Xaridorlar uchun
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-10 text-foreground">
                Nima uchun xaridorlar Hormangni sevadi
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.14 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass p-6 rounded-2xl border border-white/8 hover:border-primary/30 transition-all duration-500 group neon-border-hover"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-400" style={{ border: "1px solid hsl(155, 100%, 50%, 0.2)" }}>
                    <feat.icon className="w-6 h-6" style={{ color: "var(--g-neon)" }} />
                  </div>
                  <h4 className="text-base font-bold mb-2 text-foreground">{feat.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { quote: "10 daqiqa ichida ajoyib tozalovchi topdim — narx ham adolatli. Qo'ng'iroq qilishdan ancha oson!", author: "Dilnoza M.", location: "Toshkent", type: "Xaridor", initials: "DM", gradient: "linear-gradient(135deg,#0f4c75,#1b6ca8)" },
    { quote: "Kech kuni Hormang orqali santexnik topdim. Bir soat ichida kelishdi. Ajoyib xizmat!", author: "Rustam K.", location: "Samarqand", type: "Xaridor", initials: "RK", gradient: "linear-gradient(135deg,#00664f,#00c853)" },
    { quote: "Hormangga qo'shilganimdan beri mijozlarim tez-tez ko'paydi. Reklama xarajatim kamaydi, daromadim oshdi.", author: "Alisher", location: "Usta santexnik", type: "Ijrochi", initials: "A", gradient: "linear-gradient(135deg,#e65100,#ff9800)" },
  ];

  return (
    <section className="py-32 relative overflow-hidden" style={{ background: "hsl(150, 40%, 4%)" }}>
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
      <GlowOrb size={600} x="50%" y="80%" delay={0} opacity={0.07} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-5 px-4 py-2 rounded-full border border-primary/25 glow-sm" style={{ color: "var(--g-neon)", background: "hsl(155, 100%, 46%, 0.08)" }}>
            Sharhlar
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold">
            Odamlar Hormang haqida nima deydi
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.14, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -10, scale: 1.02 }}
              style={{ perspective: "800px" }}
              className="glass rounded-3xl p-8 border border-white/8 relative hover:border-primary/25 transition-all duration-500 neon-border-hover"
            >
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(s => (
                  <motion.div key={s} whileHover={{ scale: 1.4, rotate: 15 }}>
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
              <p className="text-base font-medium text-foreground/85 mb-8 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0 glow-sm" style={{ background: t.gradient }}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.author}</h4>
                  <p className="text-xs text-muted-foreground">{t.location} · {t.type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Provider Benefits ──────────────────────────────────────────── */
function ProviderBenefitsSection() {
  const benefits = [
    "Reklama sarflamasdan doimiy mahalliy mijozlar oling",
    "Tasdiqlangan sharhlar bilan obro'ingizni oshiring",
    "Barcha so'rovlarni bir joyda boshqaring",
    "Tezda to'lov oling — karta yoki naqd",
  ];

  return (
    <section id="provider-benefits" className="py-32 relative overflow-hidden" style={{ background: "hsl(150, 36%, 5%)" }}>
      <div className="absolute inset-0" style={{ background: "var(--brand-gradient)", opacity: 0.08 }} />
      <div className="absolute inset-0 perspective-grid pointer-events-none" style={{ opacity: 0.5 }} />
      <GlowOrb size={600} x="70%" y="-20%" delay={0} opacity={0.12} />
      <GlowOrb size={400} x="-10%" y="60%" delay={2} opacity={0.08} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs mb-6 border border-primary/30 glow-sm" style={{ background: "hsl(155, 100%, 46%, 0.08)", color: "var(--g-neon)" }}>
              <TrendingUp className="w-4 h-4" />
              Mutaxassislar va biznes uchun
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-8 text-foreground">
              Hormang bilan biznesingizni{" "}
              <span className="text-gradient">o'stiring</span>
            </h2>
            <ul className="space-y-5 mb-12">
              {benefits.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.16 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4 text-base"
                >
                  <motion.div
                    whileHover={{ scale: 1.3, rotate: 15 }}
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-black text-xs font-bold mt-0.5 glow-sm"
                    style={{ background: "var(--brand-gradient)" }}
                  >
                    ✓
                  </motion.div>
                  <span className="text-foreground/85 font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="font-bold text-lg h-14 px-8 rounded-xl transition-all duration-400 shadow-2xl gap-2 inline-flex items-center text-black glow-md"
              style={{ background: "var(--brand-gradient)" }}
            >
              Ijrochi bo'lish
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: "5,000+", label: "Faol ijrochilar" },
                { icon: TrendingUp, value: "3×", label: "Daromad o'sishi" },
                { icon: Star, value: "4.9", label: "O'rtacha reyting" },
                { icon: Zap, value: "24/7", label: "Qo'llab-quvvatlash" },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.22 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.06, y: -5 }}
                  className="glass rounded-2xl p-5 border border-white/8 hover:border-primary/30 transition-all duration-500 neon-border-hover"
                >
                  <card.icon className="w-6 h-6 mb-2" style={{ color: "var(--g-neon)" }} />
                  <p className="text-2xl font-display font-extrabold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────── */
function PricingSection() {
  const plans = [
    {
      name: "Boshlang'ich",
      desc: "Hormangni sinab ko'rish uchun",
      price: "0 so'm",
      period: "/oy",
      features: ["Katalogda profil", "Oyiga 5 ta javob", "Asosiy qo'llab-quvvatlash"],
      cta: "Boshlash",
      highlight: false,
    },
    {
      name: "Professional",
      desc: "Doimiy daromad istagan ijrochilar uchun",
      price: "99 000 so'm",
      period: "/oy",
      features: ["Qidiruv natijalarida ustuvorlik", "Cheksiz javoblar", "Profilida «Pro» nishoni", "Shaxsiy menejer"],
      cta: "Profni tanlash",
      highlight: true,
    },
    {
      name: "Doiracha",
      desc: "Xizmatingizni yuqoriga ko'taring",
      price: "Sarflagan miqdoringizga",
      period: "",
      features: ["Yuqorida pin qilingan", "Rang bilan ajratilgan", "Yangi so'rovlar uchun SMS"],
      cta: "Batafsil",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-32 overflow-hidden relative" style={{ background: "hsl(150, 38%, 5%)" }}>
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <GlowOrb size={700} x="50%" y="50%" delay={0} opacity={0.06} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-5 px-4 py-2 rounded-full border border-primary/25 glow-sm" style={{ color: "var(--g-neon)", background: "hsl(155, 100%, 46%, 0.08)" }}>
            Narxlar
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-4">Oddiy va shaffof narxlar</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hormangda biznesingizni o'stirish uchun o'zingizga mos rejani tanlang.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.14, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: plan.highlight ? -10 : -5, scale: 1.02 }}
              style={{ 
                perspective: "800px",
                ...(plan.highlight ? { background: "var(--brand-gradient)" } : {})
              }}
              className={`rounded-3xl p-8 flex flex-col transition-all duration-500 ${
                plan.highlight
                  ? "relative md:-translate-y-4 glow-lg"
                  : "glass border border-white/8 hover:border-primary/25 neon-border-hover"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-black shadow-xl" style={{ background: "hsl(60, 100%, 60%)" }}>
                  Eng mashhur
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-1 ${plan.highlight ? "text-black" : "text-foreground"}`}>{plan.name}</h3>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-black/65" : "text-muted-foreground"}`}>{plan.desc}</p>
              <div className={`mb-6 pb-6 border-b ${plan.highlight ? "border-black/15" : "border-white/10"}`}>
                <span className={`text-4xl font-extrabold font-display ${plan.highlight ? "text-black" : "text-gradient"}`}>{plan.price}</span>
                <span className={`text-sm font-medium ${plan.highlight ? "text-black/55" : "text-muted-foreground"}`}>{plan.period}</span>
              </div>
              <ul className="space-y-3.5 mb-8 flex-grow">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`flex items-center gap-3 text-sm font-medium ${plan.highlight ? "text-black/85" : "text-foreground/80"}`}>
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-black/70" : ""}`} style={!plan.highlight ? { color: "var(--g-neon)" } : {}} />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.highlight ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-12 text-base font-bold rounded-xl bg-black/85 hover:bg-black transition-colors text-white shadow-xl"
                >
                  {plan.cta}
                </motion.button>
              ) : (
                <Button variant="outline" className="w-full h-12 font-bold border border-white/15 hover:border-primary/40 hover:bg-primary/8 transition-all duration-400">
                  {plan.cta}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden" style={{ background: "hsl(150, 40%, 4%)" }}>
      <div className="absolute inset-0" style={{ background: "var(--brand-gradient)", opacity: 0.06 }} />
      <GlowOrb size={800} x="50%" y="50%" delay={0} opacity={0.1} />
      <div className="absolute inset-0 perspective-grid pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong rounded-3xl p-16 neon-border glow-md"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-black mb-8 glow-lg"
            style={{ background: "var(--brand-gradient)" }}
          >
            <Zap className="w-8 h-8" />
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold mb-5">
            Bugun <span className="text-gradient">boshlang</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            O'zbekistonning eng yaxshi mahalliy xizmat platformasiga qo'shiling. Bepul ro'yxatdan o'ting va ijrochi yoki xaridor sifatida ishni boshlang.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="h-14 px-8 rounded-xl font-bold text-base text-black gap-2 inline-flex items-center justify-center shadow-2xl glow-md transition-all duration-300"
              style={{ background: "var(--brand-gradient)" }}
            >
              <Users className="w-5 h-5" />
              Xaridor sifatida boshlash
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="h-14 px-8 rounded-xl font-bold text-base gap-2 inline-flex items-center justify-center glass border border-white/15 hover:border-primary/40 transition-all duration-400"
            >
              <Zap className="w-5 h-5" style={{ color: "var(--g-neon)" }} />
              <span style={{ color: "var(--g-neon)" }}>Ijrochi bo'lish</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <ProblemSolutionSection />
      <CategoriesSection />
      <HowItWorksSection />
      <BuyerBenefitsSection />
      <TestimonialsSection />
      <ProviderBenefitsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
