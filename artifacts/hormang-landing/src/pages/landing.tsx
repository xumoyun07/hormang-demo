import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Wrench, Baby, ChefHat, Truck,
  Scissors, CarFront, GraduationCap, ShieldCheck,
  MessageSquare, CreditCard, Bot, CheckCircle2, TrendingUp,
  XCircle, Search, Users, Star, Edit3, ArrowRight, Loader2,
  MapPin, ArrowUpRight, Zap, Quote
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────── */
const DEMO_PROVIDERS: Record<string, { name: string; category: string; rating: number; reviews: number; price: string; tag: string; color: string; initials: string }[]> = {
  default: [
    { name: "Alisher T.", category: "Santexnika va ta'mirlash", rating: 4.9, reviews: 128, price: "50 000 so'mdan", tag: "Top Baholangan", color: "#2563EB", initials: "AT" },
    { name: "Dilnoza M.", category: "Uy tozalash", rating: 4.8, reviews: 94, price: "80 000 so'mdan", tag: "Tez Javob", color: "#7C3AED", initials: "DM" },
    { name: "Rustam K.", category: "Elektr ishlari", rating: 5.0, reviews: 57, price: "60 000 so'mdan", tag: "Tasdiqlangan", color: "#059669", initials: "RK" },
  ],
  clean: [
    { name: "Gulnora S.", category: "Uy tozalash", rating: 4.9, reviews: 211, price: "70 000 so'mdan", tag: "Top Baholangan", color: "#DB2777", initials: "GS" },
    { name: "Barno U.", category: "Chuqur tozalash", rating: 4.8, reviews: 86, price: "90 000 so'mdan", tag: "Tez Javob", color: "#DC2626", initials: "BU" },
    { name: "Cleaning Pro", category: "Ofis tozalash", rating: 4.7, reviews: 142, price: "100 000 so'mdan", tag: "Tasdiqlangan", color: "#2563EB", initials: "CP" },
  ],
  plumb: [
    { name: "Alisher T.", category: "Santexnika", rating: 4.9, reviews: 128, price: "50 000 so'mdan", tag: "Top Baholangan", color: "#2563EB", initials: "AT" },
    { name: "Jasur B.", category: "Quvur ta'mirlash", rating: 4.8, reviews: 73, price: "45 000 so'mdan", tag: "Tez Javob", color: "#0D9488", initials: "JB" },
    { name: "Firdavs N.", category: "Santexnika va isitish", rating: 4.9, reviews: 99, price: "55 000 so'mdan", tag: "Tasdiqlangan", color: "#059669", initials: "FN" },
  ],
  baby: [
    { name: "Malika R.", category: "Enaga / Bola parvarishi", rating: 5.0, reviews: 63, price: "30 000 so'm/soat", tag: "Top Baholangan", color: "#D97706", initials: "MR" },
    { name: "Shahlo D.", category: "Bola parvarishi", rating: 4.9, reviews: 41, price: "25 000 so'm/soat", tag: "Tez Javob", color: "#B45309", initials: "SD" },
    { name: "Nargiza A.", category: "Enaga + Repetitor", rating: 4.8, reviews: 88, price: "35 000 so'm/soat", tag: "Tasdiqlangan", color: "#EA580C", initials: "NA" },
  ],
};

const EXAMPLE_PROMPTS = [
  "Oshxona kranidan suv oqmoqda",
  "Shanba kuni enaga kerak",
  "Uyni chuqur tozalash",
  "Rozetka ishlamayapti",
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

/* ─── Animated Counter ─────────────────────────────────────────── */
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1400;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
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
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white rounded-2xl border border-gray-100 w-full max-w-2xl max-h-[85vh] overflow-y-auto card-shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-sm text-gray-800">
              {results.length} ta mutaxassis sizga yaqin topildi
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {results.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-4 bg-gray-50 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-100 rounded-xl p-4 cursor-pointer group transition-all duration-200"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                style={{ background: p.color }}
              >
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.tag === "Top Baholangan" ? "bg-amber-100 text-amber-700"
                    : p.tag === "Tez Javob" ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                  }`}>{p.tag}</span>
                </div>
                <p className="text-xs text-gray-500">{p.category}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-800">{p.rating}</span>
                  <span className="text-xs text-gray-400">({p.reviews} sharh)</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">{p.price}</span>
                <Button size="sm" className="h-8 px-4 text-xs rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 gap-1 bg-blue-600 hover:bg-blue-700">
                  Bog'lanish <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
          <p className="text-center text-xs text-gray-400 mb-3">
            To'liq profil va tezkor bron uchun ro'yxatdan o'ting.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1 font-semibold bg-blue-600 hover:bg-blue-700">Bepul ro'yxatdan o'tish</Button>
            <Button variant="outline" className="flex-1 font-semibold">Ijrochi bo'lish</Button>
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
    <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-display font-extrabold leading-[1.08] mb-6 tracking-tight">
      <motion.span
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="block text-gray-900"
      >
        Kerakli
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="relative inline-block"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-gradient inline-block"
          >
            {ROTATE_WORDS[idx]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="block text-gray-900"
      >
        bir zumda toping
      </motion.span>
    </h1>
  );
}

/* ─── Floating Provider Card ────────────────────────────────────── */
function FloatingProviderCard({ name, cat, rating, initials, color, rotate, delay, floatDuration }: {
  name: string; cat: string; rating: number; initials: string; color: string;
  rotate: number; delay: number; floatDuration: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.0, delay, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:block"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}
        className="bg-white rounded-2xl p-4 w-52 card-shadow border border-gray-100 cursor-default select-none"
        style={{ rotate }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm" style={{ background: color }}>
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{cat}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          <span className="text-xs font-semibold text-gray-800 ml-1">{rating}</span>
        </div>
        <div className="mt-2.5 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-sky-400 opacity-60" />
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
    }, 1400);
  }

  function handlePromptClick(p: string) {
    setQuery(p);
    setTimeout(() => handleSearch(p), 50);
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-bg">
      {/* Floating decorative provider cards */}
      <div className="absolute right-0 top-0 bottom-0 w-[42%] pointer-events-none">
        <div className="relative w-full h-full">
          <div className="absolute" style={{ right: "12%", top: "22%" }}>
            <FloatingProviderCard name="Alisher T." cat="Santexnik" rating={4.9} initials="AT" color="#2563EB" rotate={6} delay={0.7} floatDuration={7} />
          </div>
          <div className="absolute" style={{ right: "22%", top: "50%" }}>
            <FloatingProviderCard name="Gulnora S." cat="Tozalovchi" rating={5.0} initials="GS" color="#059669" rotate={-5} delay={1.0} floatDuration={9} />
          </div>
          <div className="absolute" style={{ right: "8%", top: "68%" }}>
            <FloatingProviderCard name="Malika R." cat="Enaga" rating={4.9} initials="MR" color="#DB2777" rotate={3} delay={1.3} floatDuration={8} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 py-28 pt-36">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="pill-label mb-8"
        >
          <Bot className="w-3.5 h-3.5" />
          Sun'iy intellekt yordamida mahalliy xizmat topish
        </motion.div>

        {/* Headline */}
        <TypewriterHeadline />

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed font-normal"
        >
          Ehtiyojingizni yozing — sun'iy intellekt sizga eng yaxshi mahalliy mutaxassisni topadi.
        </motion.p>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.54, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl mb-4 border border-gray-200 card-shadow-md overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Bot className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Masalan: Oshxona kranidan suv oqmoqda..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none font-medium"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isSearching}
              className="h-9 px-5 rounded-xl font-semibold text-sm gap-1.5 flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? "Qidirilmoqda..." : "Topish"}
            </Button>
          </div>
          <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-100 pt-2.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex-1 bg-transparent text-xs text-gray-500 outline-none cursor-pointer hover:text-gray-700 transition-colors appearance-none font-medium"
            >
              {UZ_REGIONS.map((r) => <option key={r} value={r}>{r}, O'zbekiston</option>)}
            </select>
          </div>
        </motion.div>

        {/* Prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap gap-2 mb-12"
        >
          <span className="text-xs text-gray-400 self-center font-medium">Sinab ko'ring:</span>
          {EXAMPLE_PROMPTS.map((p, i) => (
            <motion.button
              key={p}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.82 + i * 0.06 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePromptClick(p)}
              className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium card-shadow"
            >
              {p}
            </motion.button>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="flex flex-wrap items-center gap-6 text-xs font-medium text-gray-500"
        >
          {[
            { icon: ShieldCheck, label: "Tasdiqlangan mutaxassislar" },
            { icon: CheckCircle2, label: "Yashirin to'lovlar yo'q" },
            { icon: CreditCard, label: "Karta yoki naqd" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-blue-500" />
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

/* ─── Stats Section ──────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: 5000, suffix: "+", label: "Ro'yxatdan o'tgan ijrochilar" },
    { value: 20, suffix: "+", label: "Xizmat turlari" },
    { value: 50000, suffix: "+", label: "Bajarilgan topshiriqlar" },
    { value: 4.8, suffix: "★", label: "O'rtacha reyting" },
  ];

  return (
    <section className="py-20 bg-blue-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 dot-grid pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)" }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="px-4"
            >
              <p className="text-4xl md:text-5xl font-extrabold text-white mb-1.5 tracking-tight">
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm font-medium text-blue-100">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
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
    <section ref={ref} className="py-28 bg-gray-50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">
            Nima uchun <span className="text-gradient">Hormang</span> yaratildi
          </h2>
          <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Yangi shaharga ko'chganingizda yoki shoshilinch yordam kerak bo'lganda ishonchli mahalliy mutaxassis topish juda qiyin.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl p-8 border border-red-100 card-shadow"
          >
            <h3 className="text-xl font-bold mb-7 text-red-500 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </span>
              Eski usul
            </h3>
            <ul className="space-y-4">
              {problems.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.24 + i * 0.09, duration: 0.6 }}
                  className="flex items-start gap-3.5"
                >
                  <XCircle className="w-4.5 h-4.5 text-red-300 shrink-0 mt-0.5 w-[18px] h-[18px]" />
                  <span className="text-sm text-gray-600 font-medium leading-relaxed">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl p-8 border border-blue-100 card-shadow"
          >
            <h3 className="text-xl font-bold mb-7 text-blue-600 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </span>
              Hormang usuli
            </h3>
            <ul className="space-y-4">
              {solutions.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.32 + i * 0.09, duration: 0.6 }}
                  className="flex items-start gap-3.5"
                >
                  <CheckCircle2 className="w-[18px] h-[18px] shrink-0 mt-0.5 text-blue-500" />
                  <span className="text-sm text-gray-800 font-semibold leading-relaxed">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Categories ─────────────────────────────────────────────────── */
function CategoryCard({ icon: Icon, name, desc, index }: { icon: React.FC<{ className?: string }>; name: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white rounded-2xl border border-gray-100 p-6 card-shadow hover:card-shadow-hover hover:border-blue-100 transition-all duration-250 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors duration-200">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="font-bold text-base mb-1.5 text-gray-900">{name}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
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
    <section id="categories" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="pill-label mb-5 inline-flex">Kategoriyalar</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900">
              <span className="text-gradient">Mashhur</span> xizmatlar
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Bir necha bosish bilan istalgan topshiriq uchun mutaxassis toping.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <CategoryCard key={i} icon={cat.icon} name={cat.name} desc={cat.desc} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" className="border border-gray-200 font-semibold gap-2 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
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
    <section id="how-it-works" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="pill-label mb-5 inline-flex">Jarayon</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900">
            So'rovdan bajarilishigacha —{" "}
            <span className="text-gradient">daqiqalarda</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-11 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent pointer-events-none" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative bg-white rounded-2xl p-6 border border-gray-100 card-shadow hover:card-shadow-hover hover:border-blue-100 transition-all duration-250"
            >
              <div className="absolute top-5 right-5 text-5xl font-extrabold text-gray-100 leading-none select-none">
                {step.num}
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-5 shadow-sm relative z-10">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold mb-2 text-gray-900">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
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
    { name: "Alisher T.", cat: "Santexnika", rating: 4.9, color: "#2563EB", initials: "AT", rotate: -5, y: "-10px" },
    { name: "Dilnoza M.", cat: "Tozalik", rating: 4.8, color: "#7C3AED", initials: "DM", rotate: 4, y: "18px" },
    { name: "Rustam K.", cat: "Elektr", rating: 5.0, color: "#059669", initials: "RK", rotate: 0, y: "0px" },
  ];

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Floating mock cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="relative h-72 flex items-center justify-center">
              {providerCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.88, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.15, duration: 0.7 }}
                  animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }}
                  whileHover={{ scale: 1.06, zIndex: 20 }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${i === 0 ? "-140px" : i === 1 ? "20px" : "-60px"} - 100px)`,
                    top: `calc(50% + ${card.y} - 65px)`,
                    zIndex: i,
                    rotate: card.rotate,
                  }}
                  className="w-52 bg-white rounded-2xl p-4 card-shadow border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm" style={{ background: card.color }}>
                      {card.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{card.name}</p>
                      <p className="text-xs text-gray-500">{card.cat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs font-bold text-gray-800 ml-1">{card.rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="pill-label mb-5 inline-flex">Xaridorlar uchun</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-gray-900">
                Nima uchun xaridorlar Hormangni sevadi
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 + i * 0.09, duration: 0.6 }}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:bg-blue-50/50 hover:border-blue-100 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-3.5 card-shadow">
                    <feat.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold mb-1.5 text-gray-900">{feat.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{feat.desc}</p>
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
    { quote: "10 daqiqa ichida ajoyib tozalovchi topdim — narx ham adolatli. Qo'ng'iroq qilishdan ancha oson!", author: "Dilnoza M.", location: "Toshkent", type: "Xaridor", initials: "DM", color: "#2563EB" },
    { quote: "Kech kuni Hormang orqali santexnik topdim. Bir soat ichida kelishdi. Ajoyib xizmat!", author: "Rustam K.", location: "Samarqand", type: "Xaridor", initials: "RK", color: "#059669" },
    { quote: "Hormangga qo'shilganimdan beri mijozlarim tez-tez ko'paydi. Reklama xarajatim kamaydi, daromadim oshdi.", author: "Alisher", location: "Usta santexnik", type: "Ijrochi", initials: "A", color: "#D97706" },
  ];

  return (
    <section className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="pill-label mb-5 inline-flex">Sharhlar</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Odamlar Hormang haqida nima deydi
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-7 border border-gray-100 card-shadow hover:card-shadow-hover hover:border-blue-100 transition-all duration-250 flex flex-col"
            >
              <Quote className="w-8 h-8 text-blue-100 mb-4 flex-shrink-0" />
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-6 leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm" style={{ background: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{t.author}</h4>
                  <p className="text-xs text-gray-400">{t.location} · {t.type}</p>
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
    <section id="provider-benefits" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="pill-label mb-5 inline-flex">
              <TrendingUp className="w-3.5 h-3.5" />
              Mutaxassislar va biznes uchun
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900">
              Hormang bilan biznesingizni{" "}
              <span className="text-gradient">o'stiring</span>
            </h2>
            <ul className="space-y-4 mb-10">
              {benefits.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 + i * 0.09, duration: 0.6 }}
                  className="flex items-start gap-3.5"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 shrink-0 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
            <Button
              className="h-12 px-7 rounded-xl font-semibold text-sm gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              Ijrochi bo'lish
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.18 + i * 0.09, duration: 0.6 }}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/40 transition-all duration-200"
                >
                  <card.icon className="w-5 h-5 text-blue-600 mb-2.5" />
                  <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{card.value}</p>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
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
    <section id="pricing" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="pill-label mb-5 inline-flex">Narxlar</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900">Oddiy va shaffof narxlar</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Hormangda biznesingizni o'stirish uchun o'zingizga mos rejani tanlang.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-2xl p-7 flex flex-col relative ${
                plan.highlight
                  ? "bg-blue-600 md:-translate-y-3 shadow-xl shadow-blue-200"
                  : "bg-white border border-gray-100 card-shadow"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 shadow-sm">
                  Eng mashhur
                </div>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
              <p className={`text-sm mb-5 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>{plan.desc}</p>
              <div className={`mb-5 pb-5 border-b ${plan.highlight ? "border-white/15" : "border-gray-100"}`}>
                <span className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-gradient"}`}>{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? "text-blue-100" : "text-gray-400"}`}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-7 flex-grow">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`flex items-center gap-2.5 text-sm font-medium ${plan.highlight ? "text-blue-50" : "text-gray-700"}`}>
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.highlight ? (
                <button className="w-full h-11 text-sm font-bold rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
                  {plan.cta}
                </button>
              ) : (
                <Button variant="outline" className="w-full h-11 font-semibold border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
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
    <section className="py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-xl shadow-blue-200"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative z-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-7">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
              Bugun boshlang
            </h2>
            <p className="text-base text-blue-100 mb-9 max-w-lg mx-auto leading-relaxed">
              O'zbekistonning eng yaxshi mahalliy xizmat platformasiga qo'shiling. Bepul ro'yxatdan o'ting va ijrochi yoki xaridor sifatida ishni boshlang.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-12 px-7 rounded-xl font-semibold text-sm bg-white text-blue-600 gap-2 inline-flex items-center justify-center shadow-sm hover:bg-blue-50 transition-colors"
              >
                <Users className="w-4 h-4" />
                Xaridor sifatida boshlash
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-12 px-7 rounded-xl font-semibold text-sm bg-white/15 hover:bg-white/25 text-white gap-2 inline-flex items-center justify-center border border-white/25 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Ijrochi bo'lish
              </motion.button>
            </div>
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
