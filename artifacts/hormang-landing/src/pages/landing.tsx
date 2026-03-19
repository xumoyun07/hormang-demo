import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppStoreBadges } from "@/components/ui/app-store-badges";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Wrench, Baby, ChefHat, Truck,
  Scissors, CarFront, GraduationCap, ShieldCheck,
  MessageSquare, CreditCard, Bot, Zap, CheckCircle2, TrendingUp,
  XCircle, Search, Users, Star, Edit3, ArrowRight, Loader2, MapPin, ArrowUpRight
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────── */

const DEMO_PROVIDERS: Record<string, { name: string; category: string; rating: number; reviews: number; price: string; tag: string; color: string; initials: string }[]> = {
  default: [
    { name: "Alisher T.", category: "Santexnika va ta'mirlash", rating: 4.9, reviews: 128, price: "50 000 so'mdan", tag: "Top Baholangan", color: "bg-blue-500", initials: "AT" },
    { name: "Dilnoza M.", category: "Uy tozalash", rating: 4.8, reviews: 94, price: "80 000 so'mdan", tag: "Tez Javob", color: "bg-purple-500", initials: "DM" },
    { name: "Rustam K.", category: "Elektr ishlari", rating: 5.0, reviews: 57, price: "60 000 so'mdan", tag: "Tasdiqlangan", color: "bg-green-500", initials: "RK" },
  ],
  clean: [
    { name: "Gulnora S.", category: "Uy tozalash", rating: 4.9, reviews: 211, price: "70 000 so'mdan", tag: "Top Baholangan", color: "bg-pink-500", initials: "GS" },
    { name: "Barno U.", category: "Chuqur tozalash", rating: 4.8, reviews: 86, price: "90 000 so'mdan", tag: "Tez Javob", color: "bg-rose-500", initials: "BU" },
    { name: "Cleaning Pro", category: "Ofis tozalash", rating: 4.7, reviews: 142, price: "100 000 so'mdan", tag: "Tasdiqlangan", color: "bg-indigo-500", initials: "CP" },
  ],
  plumb: [
    { name: "Alisher T.", category: "Santexnika", rating: 4.9, reviews: 128, price: "50 000 so'mdan", tag: "Top Baholangan", color: "bg-blue-500", initials: "AT" },
    { name: "Jasur B.", category: "Quvur ta'mirlash", rating: 4.8, reviews: 73, price: "45 000 so'mdan", tag: "Tez Javob", color: "bg-cyan-500", initials: "JB" },
    { name: "Firdavs N.", category: "Santexnika va isitish", rating: 4.9, reviews: 99, price: "55 000 so'mdan", tag: "Tasdiqlangan", color: "bg-teal-500", initials: "FN" },
  ],
  baby: [
    { name: "Malika R.", category: "Enaga / Bola parvarishi", rating: 5.0, reviews: 63, price: "30 000 so'm/soat", tag: "Top Baholangan", color: "bg-amber-500", initials: "MR" },
    { name: "Shahlo D.", category: "Bola parvarishi", rating: 4.9, reviews: 41, price: "25 000 so'm/soat", tag: "Tez Javob", color: "bg-yellow-500", initials: "SD" },
    { name: "Nargiza A.", category: "Enaga + Repetitor", rating: 4.8, reviews: 88, price: "35 000 so'm/soat", tag: "Tasdiqlangan", color: "bg-orange-500", initials: "NA" },
  ],
};

const EXAMPLE_PROMPTS = [
  "Oshxona kranidan suv oqmoqda",
  "Shanba kuni enaga kerak",
  "Uyni chuqur tozalash",
  "Rozetka ishlamayapti",
  "Mehmonlar uchun ovqat pishirish",
];

const UZ_REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Farg'ona viloyati",
  "Namangan viloyati",
  "Samarqand viloyati",
  "Buxoro viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Xorazm viloyati",
  "Qoraqalpog'iston Respublikasi",
];

function getProviderKey(query: string) {
  const q = query.toLowerCase();
  if (q.includes("tozal") || q.includes("clean")) return "clean";
  if (q.includes("kran") || q.includes("suv") || q.includes("quvur") || q.includes("santex") || q.includes("plumb") || q.includes("sink") || q.includes("leak")) return "plumb";
  if (q.includes("enaga") || q.includes("bola") || q.includes("baby") || q.includes("nanny")) return "baby";
  return "default";
}

/* ─── 3D Tilt Card Hook ─────────────────────────────────────── */
function use3DTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { rotateX: springRotateX, rotateY: springRotateY, handleMouse, handleLeave };
}

/* ─── Animated Counter ──────────────────────────────────────── */
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const spring = useSpring(count, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (isInView) spring.set(to);
  }, [isInView, to, spring]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

/* ─── Results Modal ──────────────────────────────────────────── */
function ResultsModal({ results, onClose }: { results: typeof DEMO_PROVIDERS.default; onClose: () => void }) {
  return (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="relative bg-card rounded-3xl shadow-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="font-bold text-sm text-foreground">
              {results.length} ta mutaxassis sizga yaqin topildi
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {results.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.09, type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center gap-4 bg-background border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-lg transition-all duration-250 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-foreground">{p.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${p.tag === "Top Baholangan" ? "bg-yellow-100 text-yellow-700" : p.tag === "Tez Javob" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold">{p.rating}</span>
                  <span className="text-xs text-muted-foreground">({p.reviews} sharh)</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-primary">{p.price}</span>
                <Button size="sm" className="h-8 px-4 text-xs rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  Bog'lanish <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border px-6 py-4 rounded-b-3xl">
          <p className="text-center text-xs text-muted-foreground mb-3">
            To'liq profil va tezkor bron uchun ro'yxatdan o'ting.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1 font-bold shadow-lg shadow-primary/20">Bepul ro'yxatdan o'tish</Button>
            <Button variant="outline" className="flex-1 font-bold">Ijrochi bo'lish</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Floating Orb ──────────────────────────────────────────── */
function FloatingOrb({ size, x, y, delay, opacity }: { size: number; x: string; y: string; delay: number; opacity: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, opacity }}
      animate={{ y: [0, -30, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className="w-full h-full rounded-full blur-3xl" style={{ background: "var(--brand-gradient)" }} />
    </motion.div>
  );
}

/* ─── Typewriter Words ──────────────────────────────────────── */
const ROTATE_WORDS = ["santexnikani", "tozalovchini", "enagani", "repetitorni", "ustani"];

function TypewriterHeadline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ROTATE_WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight mb-4">
      Kerakli{" "}
      <span className="relative inline-block">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -18, filter: "blur(4px)" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="text-gradient inline-block"
          >
            {ROTATE_WORDS[idx]}
          </motion.span>
        </AnimatePresence>
      </span>
      <br />
      bir zumda toping
    </h1>
  );
}

/* ─── Hero Section ───────────────────────────────────────────── */
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
    }, 1400);
  }

  function handlePromptClick(prompt: string) {
    setQuery(prompt);
    setTimeout(() => handleSearch(prompt), 50);
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-bg">
      <FloatingOrb size={560} x="60%" y="-10%" delay={0} opacity={0.18} />
      <FloatingOrb size={400} x="-8%" y="55%" delay={2.5} opacity={0.14} />
      <FloatingOrb size={280} x="38%" y="65%" delay={1.2} opacity={0.10} />

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(to right, hsl(145 20% 88% / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(145 20% 88% / 0.35) 1px, transparent 1px)",
        backgroundSize: "56px 56px"
      }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full relative z-10 text-center py-24 pt-36">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs mb-7 text-white shadow-lg shadow-primary/30"
          style={{ background: "var(--brand-gradient)" }}
        >
          <motion.div animate={{ rotate: [0, 20, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
            <Bot className="w-3.5 h-3.5" />
          </motion.div>
          Sun'iy intellekt yordamida mahalliy xizmat topish
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <TypewriterHeadline />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="text-base text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed"
        >
          Ehtiyojingizni yozing — sun'iy intellekt sizga eng yaxshi mahalliy mutaxassisni topadi.
        </motion.p>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="rounded-2xl mb-4 p-3 text-left shadow-2xl shadow-primary/10"
          style={{
            border: "2px solid transparent",
            background: "linear-gradient(#ffffff, #ffffff) padding-box, var(--brand-gradient) border-box",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: "var(--brand-gradient)" }}
            >
              <Bot className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Masalan: Oshxona kranidan suv oqmoqda..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isSearching}
              className="h-9 px-5 rounded-xl font-bold text-sm gap-1.5 flex-shrink-0"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? "Qidirilmoqda..." : "Topish"}
            </Button>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pl-11 border-t border-border/40 pt-2.5">
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "var(--g-bright)" }} />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-muted-foreground outline-none cursor-pointer hover:text-foreground transition-colors appearance-none"
            >
              {UZ_REGIONS.map((r) => (
                <option key={r} value={r}>{r}, O'zbekiston</option>
              ))}
            </select>
            <svg className="w-3 h-3 text-muted-foreground flex-shrink-0 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.div>

        {/* Prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          <span className="text-[11px] text-muted-foreground self-center">Sinab ko'ring:</span>
          {EXAMPLE_PROMPTS.map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handlePromptClick(p)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-card hover:text-white transition-all duration-200 shadow-sm"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-gradient)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "";
              }}
            >
              {p}
            </motion.button>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="flex items-center justify-center gap-6 text-xs font-semibold text-muted-foreground"
        >
          {[
            { icon: ShieldCheck, label: "Tasdiqlangan mutaxassislar", color: "var(--g-forest)" },
            { icon: CheckCircle2, label: "Yashirin to'lovlar yo'q", color: "var(--g-mid)" },
            { icon: CreditCard, label: "Karta yoki naqd", color: "var(--g-bright)" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4" style={{ color }} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && results && (
          <ResultsModal results={results} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Problem / Solution ─────────────────────────────────────── */
function ProblemSolutionSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const problems = [
    "Ishonchli mahalliy mutaxassis topish qiyin",
    "Sovuq, shaxssiz platformalar",
    "Sekin og'izdan-og'izga tarqalish",
    "Noaniq narxlar",
  ];

  const solutions = [
    "Yaqinlashtirilgan tasdiqlangan mutaxassislar",
    "Insoniy, iliq bozor maydoni",
    "Sun'iy intellekt bilan tezkor moslashtirish",
    "Shaffof narxlar va sharhlar",
  ];

  return (
    <section ref={ref} className="py-28 bg-card border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-5">
            Nima uchun <span className="text-gradient">Hormang</span> yaratildi
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Yangi shaharga ko'chganingizda yoki shoshilinch yordam kerak bo'lganda ishonchli mahalliy mutaxassis topish juda qiyin. An'anaviy platformalar sovuq va shaxssiz, og'izdan-og'izga tarqalish esa sekin va ishonchsiz.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="bg-destructive/5 border border-destructive/10 rounded-3xl p-8 lg:p-10 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-destructive/5" />
            <h3 className="text-2xl font-bold mb-8 text-destructive flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </span>
              Eski usul
            </h3>
            <ul className="space-y-5">
              {problems.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <XCircle className="w-5 h-5 text-destructive/50 shrink-0 mt-0.5" />
                  <span className="text-base text-foreground/80 font-medium">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="bg-primary/5 border border-primary/10 rounded-3xl p-8 lg:p-10 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/5" />
            <h3 className="text-2xl font-bold mb-8 text-primary flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              Hormang usuli
            </h3>
            <ul className="space-y-5">
              {solutions.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.32 + i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
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

/* ─── Stats Section ──────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: 5000, suffix: "+", label: "Ro'yxatdan o'tgan ijrochilar" },
    { value: 20, suffix: "+", label: "Xizmat turlari" },
    { value: 50000, suffix: "+", label: "Bajarilgan topshiriqlar" },
    { value: 4.8, suffix: "★", label: "O'rtacha reyting" },
  ];

  return (
    <section className="py-16 relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
        backgroundSize: "32px 32px"
      }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 18 }}
              className="px-4"
            >
              <p className="text-4xl md:text-5xl font-display font-extrabold text-white mb-2">
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm md:text-base font-medium text-white/75">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 3D Category Card ───────────────────────────────────────── */
function CategoryCard({ icon: Icon, name, desc, index }: { icon: React.FC<{ className?: string }>; name: string; desc: string; index: number }) {
  const { rotateX, rotateY, handleMouse, handleLeave } = use3DTilt();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 180, damping: 18 }}
      style={{ perspective: 900 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        className="group relative bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-2xl transition-shadow duration-400 cursor-pointer overflow-hidden"
      >
        {/* Gradient border on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "var(--brand-gradient)", padding: "1.5px" }}
        >
          <div className="w-full h-full rounded-2xl bg-card" />
        </div>
        <div className="absolute inset-[1.5px] rounded-[calc(1rem-1.5px)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-card" />

        <div className="relative z-10">
          <motion.div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-white shadow-lg"
            style={{ background: "var(--brand-gradient)", transformStyle: "preserve-3d", translateZ: 12 }}
            whileHover={{ scale: 1.12, rotateZ: -6 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
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
    <section id="categories" className="py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4 px-3 py-1.5 bg-primary/10 rounded-full">
              Kategoriyalar
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
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
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" className="border-2 font-semibold gap-2">
            Barcha 20+ kategoriyalarni ko'rish
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: "01", icon: Edit3, title: "Ehtiyojingizni yozing", desc: "Oddiy so'zlar bilan yozing — sun'iy intellekt eng yaxshi moslikni topadi." },
    { num: "02", icon: Search, title: "Ijrochilarni ko'ring", desc: "Profillar, reytinglar, portfolio va narxlarni ko'ring." },
    { num: "03", icon: MessageSquare, title: "Muzokaralar", desc: "Ijrochilar bilan to'g'ridan-to'g'ri muloqot qiling, narx va vaqtni belgilang." },
    { num: "04", icon: CreditCard, title: "Buyurtma, to'lov, baho", desc: "Karta yoki naqd to'lang, keyin sharh qoldiring." },
  ];

  return (
    <section id="how-it-works" className="py-28 bg-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4 px-3 py-1.5 bg-primary/10 rounded-full">
            Jarayon
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            So'rovdan bajarilishigacha —{" "}
            <span className="text-gradient">daqiqalarda</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oddiy, tez va haqiqiy odamlar uchun mo'ljallangan.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line desktop */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
              className="relative p-6 rounded-3xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="absolute -top-4 -left-3 text-6xl font-display font-extrabold text-border/35 select-none leading-none">
                {step.num}
              </div>
              <motion.div
                className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mb-6 relative z-10 shadow-lg"
                style={{ background: "var(--brand-gradient)" }}
                whileHover={{ scale: 1.12, rotate: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <step.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2.5 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Buyer Benefits ─────────────────────────────────────────── */
function BuyerBenefitsSection() {
  const features = [
    { icon: ShieldCheck, title: "Ishonchli mutaxassislar", desc: "Har bir ijrochida tasdiqlangan sharhlar va haqiqiy portfolio mavjud." },
    { icon: Bot, title: "Sun'iy intellekt qidiruvi", desc: "Oddiy so'zlar bilan yozing — Hormang eng yaxshi moslikni topadi." },
    { icon: MessageSquare, title: "Muloqot va kelishuv", desc: "Ijrochilar bilan to'g'ridan-to'g'ri muloqot, narx va vaqt haqida vositachisiz." },
    { icon: CreditCard, title: "Qulay to'lov", desc: "Karta yoki naqd to'lang. Yashirin to'lovlar yo'q." },
  ];

  return (
    <section className="py-28 overflow-hidden relative bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Floating mock cards */}
              <div className="relative h-72 flex items-center justify-center" style={{ perspective: 800 }}>
                {[
                  { name: "Alisher T.", cat: "Santexnika", rating: 4.9, bg: "bg-blue-500", initials: "AT", z: 0, x: -30, y: -10, rotate: -6 },
                  { name: "Dilnoza M.", cat: "Tozalik", rating: 4.8, bg: "bg-purple-500", initials: "DM", z: 10, x: 30, y: 20, rotate: 4 },
                  { name: "Rustam K.", cat: "Elektr", rating: 5.0, bg: "bg-green-500", initials: "RK", z: 20, x: 0, y: 0, rotate: 0 },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: card.y }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                    animate={{ y: [card.y, card.y - 8, card.y] }}
                    whileHover={{ scale: 1.06, zIndex: 30 }}
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${card.x}px - 110px)`,
                      zIndex: card.z,
                      rotate: card.rotate,
                    }}
                    className="w-56 bg-card rounded-2xl border border-border shadow-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-white font-bold text-sm`}>
                        {card.initials}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{card.name}</p>
                        <p className="text-xs text-muted-foreground">{card.cat}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-yellow-500 fill-yellow-500" />)}
                      <span className="text-xs font-bold ml-1">{card.rating}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-5 px-3 py-1.5 bg-primary/10 rounded-full">
                Xaridorlar uchun
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-10 text-foreground">
                Nima uchun xaridorlar Hormangni sevadi
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 + i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feat.icon className="w-6 h-6" />
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

/* ─── Testimonials ───────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { quote: "10 daqiqa ichida ajoyib tozalovchi topdim — narx ham adolatli. Qo'ng'iroq qilishdan ancha oson!", author: "Dilnoza M.", location: "Toshkent", type: "Xaridor", initials: "DM", color: "bg-blue-100 text-blue-700" },
    { quote: "Kech kuni Hormang orqali santexnik topdim. Bir soat ichida kelishdi. Ajoyib!", author: "Rustam K.", location: "Samarqand", type: "Xaridor", initials: "RK", color: "bg-emerald-100 text-emerald-700" },
    { quote: "Hormangga qo'shilganimdan beri mijozlarim tez-tez ko'paydi. Reklama xarajatim kamaydi, daromadim oshdi.", author: "Alisher", location: "Usta santexnik", type: "Ijrochi", initials: "A", color: "bg-orange-100 text-orange-700" },
  ];

  return (
    <section className="py-28 bg-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4 px-3 py-1.5 bg-primary/10 rounded-full">
            Sharhlar
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            Odamlar Hormang haqida nima deydi
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-muted/50 p-8 rounded-3xl border border-border/50 relative hover:shadow-xl transition-all duration-350 hover:border-primary/25 group"
            >
              <div className="flex gap-1 mb-5">
                {[1,2,3,4,5].map(s => (
                  <motion.div key={s} whileHover={{ scale: 1.3, rotate: 15 }} className="text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                  </motion.div>
                ))}
              </div>
              <p className="text-base font-medium text-foreground mb-7 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.author}</h4>
                  <p className="text-xs text-muted-foreground">{t.location} • {t.type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Provider Benefits ──────────────────────────────────────── */
function ProviderBenefitsSection() {
  const benefits = [
    "Reklama sarflamasdan doimiy mahalliy mijozlar oling",
    "Tasdiqlangan sharhlar bilan obro'ingizni oshiring",
    "Barcha so'rovlarni bir joyda boshqaring",
    "Tezda to'lov oling — karta yoki naqd",
  ];

  return (
    <section id="provider-benefits" className="py-28 relative overflow-hidden text-white" style={{ background: "var(--brand-gradient)" }}>
      <div className="absolute inset-0 opacity-8" style={{
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />
      <FloatingOrb size={400} x="65%" y="-20%" delay={0} opacity={0.08} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white font-semibold text-sm mb-6 border border-white/25">
              <TrendingUp className="w-4 h-4" />
              Mutaxassislar va biznes uchun
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 text-white">
              Hormang bilan biznesingizni o'stiring
            </h2>
            <ul className="space-y-5 mb-12">
              {benefits.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-start gap-4 text-base"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="w-6 h-6 rounded-full bg-white/20 shrink-0 flex items-center justify-center text-white mt-0.5"
                  >
                    ✓
                  </motion.div>
                  <span className="text-white/90 font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white font-bold text-lg h-14 px-8 rounded-xl hover:bg-white/92 transition-colors shadow-2xl gap-2 inline-flex items-center"
            >
              <span style={{ color: "var(--g-forest)" }}>Ijrochi bo'lish</span>
              <ArrowRight className="w-5 h-5" style={{ color: "var(--g-forest)" }} />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: 40 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, type: "spring", stiffness: 150, damping: 20 }}
            className="relative"
          >
            {/* Stats float cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: "5,000+", label: "Faol ijrochilar" },
                { icon: TrendingUp, value: "3×", label: "Daromad o'sishi" },
                { icon: Star, value: "4.9", label: "O'rtacha reyting" },
                { icon: Zap, value: "24/7", label: "Qo'llab-quvvatlash" },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <card.icon className="w-6 h-6 text-white/80 mb-2" />
                  <p className="text-2xl font-display font-extrabold text-white">{card.value}</p>
                  <p className="text-sm text-white/70 font-medium">{card.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────── */
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
    <section id="pricing" className="py-28 bg-card overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4 px-3 py-1.5 bg-primary/10 rounded-full">
            Narxlar
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Oddiy va shaffof narxlar</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hormangda biznesingizni o'stirish uchun o'zingizga mos rejani tanlang.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ y: plan.highlight ? -8 : -4, scale: 1.02 }}
              className={`rounded-3xl p-8 border-2 flex flex-col transition-shadow duration-300 ${
                plan.highlight
                  ? "shadow-2xl relative text-white md:-translate-y-4"
                  : "bg-card border-border shadow-sm hover:shadow-xl"
              }`}
              style={plan.highlight ? { background: "var(--brand-gradient)", border: "2px solid transparent" } : {}}
            >
              <h3 className={`text-2xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.desc}</p>
              <div className={`mb-6 pb-6 border-b ${plan.highlight ? "border-white/20" : "border-border"}`}>
                <span className={`text-4xl font-extrabold font-display ${plan.highlight ? "text-white" : "text-gradient"}`}>{plan.price}</span>
                <span className={`text-sm font-medium ${plan.highlight ? "text-white/60" : "text-muted-foreground"}`}>{plan.period}</span>
              </div>
              <ul className="space-y-3.5 mb-8 flex-grow">
                {plans[i].features.map((f, fi) => (
                  <li key={fi} className={`flex items-center gap-3 text-sm font-medium ${plan.highlight ? "text-white" : ""}`}>
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? "text-white/80" : "text-primary"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.highlight ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-12 text-base font-bold rounded-xl bg-white hover:bg-white/92 transition-colors shadow-lg"
                  style={{ color: "var(--g-forest)" }}
                >
                  {plan.cta}
                </motion.button>
              ) : (
                <Button variant="outline" className="w-full h-12 text-base font-bold border-2">
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

/* ─── CTA Section ────────────────────────────────────────────── */
function CTASection() {
  return (
    <section id="cta" className="py-28 relative overflow-hidden bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring", stiffness: 160, damping: 22 }}
          className="rounded-[2.5rem] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden"
          style={{ background: "var(--brand-gradient)" }}
        >
          <FloatingOrb size={300} x="70%" y="-30%" delay={0} opacity={0.12} />
          <FloatingOrb size={200} x="-5%" y="60%" delay={1.5} opacity={0.10} />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <Zap className="w-12 h-12 text-white/90" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Ishni boshlashga tayyormisiz?</h2>
            <p className="text-lg md:text-xl opacity-88 mb-10 max-w-2xl mx-auto leading-relaxed">
              Hormang ilovasini hozir yuklab oling va bir necha daqiqada tasdiqlangan mutaxassis toping.
            </p>
            <div className="flex justify-center">
              <AppStoreBadges />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <StatsSection />
        <CategoriesSection />
        <HowItWorksSection />
        <BuyerBenefitsSection />
        <TestimonialsSection />
        <ProviderBenefitsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
