import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppStoreBadges } from "@/components/ui/app-store-badges";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Wrench, Baby, ChefHat, Truck, 
  Scissors, CarFront, GraduationCap, ShieldCheck, 
  MessageSquare, CreditCard, Bot, Zap, CheckCircle2, TrendingUp,
  XCircle, Search, Users, Star, Edit3, ArrowRight, Loader2, MapPin
} from "lucide-react";

const DEMO_PROVIDERS: Record<string, { name: string; category: string; rating: number; reviews: number; price: string; tag: string; color: string; initials: string }[]> = {
  default: [
    { name: "Alisher T.", category: "Plumbing & Repairs", rating: 4.9, reviews: 128, price: "from 50,000 sum", tag: "Top Rated", color: "bg-blue-500", initials: "AT" },
    { name: "Dilnoza M.", category: "Home Cleaning", rating: 4.8, reviews: 94, price: "from 80,000 sum", tag: "Fast Reply", color: "bg-purple-500", initials: "DM" },
    { name: "Rustam K.", category: "Electrical Work", rating: 5.0, reviews: 57, price: "from 60,000 sum", tag: "Verified", color: "bg-green-500", initials: "RK" },
  ],
  clean: [
    { name: "Gulnora S.", category: "Home Cleaning", rating: 4.9, reviews: 211, price: "from 70,000 sum", tag: "Top Rated", color: "bg-pink-500", initials: "GS" },
    { name: "Barno U.", category: "Deep Cleaning", rating: 4.8, reviews: 86, price: "from 90,000 sum", tag: "Fast Reply", color: "bg-rose-500", initials: "BU" },
    { name: "Cleaning Pro", category: "Office Cleaning", rating: 4.7, reviews: 142, price: "from 100,000 sum", tag: "Verified", color: "bg-indigo-500", initials: "CP" },
  ],
  plumb: [
    { name: "Alisher T.", category: "Plumbing", rating: 4.9, reviews: 128, price: "from 50,000 sum", tag: "Top Rated", color: "bg-blue-500", initials: "AT" },
    { name: "Jasur B.", category: "Pipe Repair", rating: 4.8, reviews: 73, price: "from 45,000 sum", tag: "Fast Reply", color: "bg-cyan-500", initials: "JB" },
    { name: "Firdavs N.", category: "Plumbing & Heating", rating: 4.9, reviews: 99, price: "from 55,000 sum", tag: "Verified", color: "bg-teal-500", initials: "FN" },
  ],
  baby: [
    { name: "Malika R.", category: "Nanny / Babysitter", rating: 5.0, reviews: 63, price: "from 30,000 sum/hr", tag: "Top Rated", color: "bg-amber-500", initials: "MR" },
    { name: "Shahlo D.", category: "Childcare", rating: 4.9, reviews: 41, price: "from 25,000 sum/hr", tag: "Fast Reply", color: "bg-yellow-500", initials: "SD" },
    { name: "Nargiza A.", category: "Nanny + Tutor", rating: 4.8, reviews: 88, price: "from 35,000 sum/hr", tag: "Verified", color: "bg-orange-500", initials: "NA" },
  ],
};

const EXAMPLE_PROMPTS = [
  "My kitchen sink is leaking",
  "Need babysitter this Saturday",
  "Apartment deep cleaning",
  "Electrical socket not working",
  "Cook for a dinner party",
];

function getProviderKey(query: string) {
  const q = query.toLowerCase();
  if (q.includes("clean") || q.includes("уборк")) return "clean";
  if (q.includes("plumb") || q.includes("sink") || q.includes("leak") || q.includes("pipe") || q.includes("труб") || q.includes("кран")) return "plumb";
  if (q.includes("baby") || q.includes("nanny") || q.includes("child") || q.includes("няня") || q.includes("ребен")) return "baby";
  return "default";
}

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-card rounded-3xl shadow-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-base text-foreground">{results.length} providers matched near you</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Provider cards */}
        <div className="p-6 space-y-3">
          {results.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 bg-background border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-foreground">{p.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${p.tag === "Top Rated" ? "bg-yellow-100 text-yellow-700" : p.tag === "Fast Reply" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold text-foreground">{p.rating}</span>
                  <span className="text-xs text-muted-foreground">({p.reviews} reviews)</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-primary">{p.price}</span>
                <Button size="sm" className="h-8 px-4 text-xs rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Contact <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 rounded-b-3xl">
          <p className="text-center text-xs text-muted-foreground mb-3">
            Register to contact providers, see full profiles, and book instantly.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1 font-bold shadow-lg shadow-primary/20">Sign Up Free</Button>
            <Button variant="outline" className="flex-1 font-bold">Become a Provider</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-bg">
      {/* Background blobs — green shades */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-30 blur-3xl pointer-events-none">
        <div className="w-[550px] h-[550px] rounded-full" style={{ background: "var(--g-light)" }} />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 opacity-20 blur-3xl pointer-events-none">
        <div className="w-[450px] h-[450px] rounded-full" style={{ background: "var(--g-mid)" }} />
      </div>
      <div className="absolute top-1/3 left-1/4 opacity-12 blur-3xl pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full" style={{ background: "var(--g-deep)" }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 w-full relative z-10 text-center py-20">
        {/* Badge with tri-color gradient */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs mb-5 text-white"
          style={{ background: "var(--brand-gradient)" }}
        >
          <Bot className="w-3.5 h-3.5" />
          AI-powered local service matching
        </motion.div>

        {/* Compact headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-3xl sm:text-4xl font-display font-extrabold text-foreground leading-tight mb-2"
        >
          What do you <span className="text-gradient">need help with?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-sm text-muted-foreground mb-6"
        >
          Describe your task — our AI finds the right local pro instantly.
        </motion.p>

        {/* Search box with proper gradient border */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl mb-3 p-3 text-left shadow-xl"
          style={{
            border: "2px solid transparent",
            background: "linear-gradient(#ffffff, #ffffff) padding-box, var(--brand-gradient) border-box",
          }}
        >
          {/* Input row */}
          <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: "var(--brand-gradient)" }}>
                <Bot className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g. My kitchen sink is leaking..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={!query.trim() || isSearching}
                className="h-9 px-5 rounded-xl font-bold text-sm gap-1.5 flex-shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isSearching ? "Finding..." : "Find"}
              </Button>
            </div>

            {/* Region selector row */}
            <div className="flex items-center gap-1.5 mt-2 pl-10 border-t border-border/50 pt-2">
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

        {/* Example prompts with tri-color gradient border on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap justify-center gap-1.5 mb-8"
        >
          <span className="text-[11px] text-muted-foreground self-center">Try:</span>
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handlePromptClick(p)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card hover:text-white transition-all duration-200"
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-gradient)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.borderColor = ""; }}
            >
              {p}
            </button>
          ))}
        </motion.div>

        {/* Trust row — each icon in a different brand color */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center justify-center gap-5 text-xs font-semibold text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--g-forest)" }} />
            Verified Pros
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--g-mid)" }} />
            No Hidden Fees
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--g-bright)" }} />
            Pay Card or Cash
          </div>
        </motion.div>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {showModal && results && (
          <ResultsModal results={results} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

function ProblemSolutionSection() {
  return (
    <section className="py-24 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Why Hormang exists</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            When you move to a new city or need urgent help, finding honest, local professionals feels impossible. Traditional platforms feel cold and impersonal, while word‑of‑mouth is slow and unreliable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Problem */}
          <div className="bg-destructive/5 border border-destructive/10 rounded-3xl p-8 lg:p-12">
            <h3 className="text-2xl font-bold mb-8 text-destructive flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </span>
              The Old Way
            </h3>
            <ul className="space-y-6">
              {[
                "Hard to find trusted local pros",
                "Cold, corporate platforms",
                "Slow word-of-mouth",
                "Unclear pricing"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-destructive/50 shrink-0 mt-0.5" />
                  <span className="text-lg text-foreground/80 font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 lg:p-12">
            <h3 className="text-2xl font-bold mb-8 text-primary flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              The Hormang Way
            </h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Hormang connects you with verified local providers, so you can find, book, and pay for services all in one place — fast, simple, and built for real people.
            </p>
            <ul className="space-y-6">
              {[
                "Verified local providers near you",
                "Warm, human-scale marketplace",
                "Instant AI-powered matching",
                "Transparent pricing & reviews"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-lg text-foreground font-semibold">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-16" style={{ background: "var(--brand-gradient)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/20 text-center">
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-white mb-2">5,000+</p>
            <p className="text-sm md:text-base font-medium text-white/80">Registered Providers</p>
          </div>
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-white mb-2">20+</p>
            <p className="text-sm md:text-base font-medium text-white/80">Service Categories</p>
          </div>
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-white mb-2">50,000+</p>
            <p className="text-sm md:text-base font-medium text-white/80">Tasks Completed</p>
          </div>
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-white mb-2">4.8<span className="text-3xl">★</span></p>
            <p className="text-sm md:text-base font-medium text-white/80">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const categories = [
    { icon: Sparkles, name: "Cleaning", desc: "Apartments, offices, windows", color: "bg-blue-100 text-blue-600" },
    { icon: Wrench, name: "Repairs", desc: "Plumbing, electrical, handy", color: "bg-orange-100 text-orange-600" },
    { icon: Baby, name: "Nannies", desc: "Childcare & elderly care", color: "bg-pink-100 text-pink-600" },
    { icon: ChefHat, name: "Cooking", desc: "Home chefs, catering, cakes", color: "bg-red-100 text-red-600" },
    { icon: Truck, name: "Moving", desc: "Movers & transportation", color: "bg-purple-100 text-purple-600" },
    { icon: Scissors, name: "Beauty", desc: "Manicure, haircuts, makeup", color: "bg-rose-100 text-rose-600" },
    { icon: CarFront, name: "Auto Service", desc: "Diagnostics, wash, tires", color: "bg-zinc-100 text-zinc-600" },
    { icon: GraduationCap, name: "Tutors", desc: "Languages, school, music", color: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <section id="categories" className="py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            <span className="text-gradient">Popular</span> Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the right professional for any task in just a few clicks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-card p-6 rounded-2xl shadow-sm border border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              style={{ borderColor: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = "2px solid transparent";
                (e.currentTarget as HTMLDivElement).style.backgroundImage = "var(--brand-gradient), linear-gradient(white, white)";
                (e.currentTarget as HTMLDivElement).style.backgroundOrigin = "border-box";
                (e.currentTarget as HTMLDivElement).style.backgroundClip = "padding-box, border-box";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = "";
                (e.currentTarget as HTMLDivElement).style.backgroundImage = "";
                (e.currentTarget as HTMLDivElement).style.backgroundOrigin = "";
                (e.currentTarget as HTMLDivElement).style.backgroundClip = "";
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform text-white"
                style={{ background: "var(--brand-gradient)" }}
              >
                <cat.icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg mb-2">{cat.name}</h3>
              <p className="text-muted-foreground text-sm">{cat.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" className="border-2 font-semibold">View all 20+ categories</Button>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: Edit3,
      title: "Describe your need",
      desc: "Type what you need in plain text, our AI finds the best match."
    },
    {
      num: "02",
      icon: Search,
      title: "Browse providers",
      desc: "See profiles, ratings, portfolios, and prices."
    },
    {
      num: "03",
      icon: MessageSquare,
      title: "Chat & agree",
      desc: "Message providers directly, negotiate price and time in the app."
    },
    {
      num: "04",
      icon: CreditCard,
      title: "Book, pay, review",
      desc: "Pay by card or cash, then leave a review."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            From Request to Done — <span className="text-gradient">in Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, fast, and designed for real people.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-3xl bg-muted/30 border border-border/50"
            >
              <div className="absolute -top-5 -left-5 text-6xl font-display font-extrabold text-border/40 select-none">
                {step.num}
              </div>
              <div
                className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mb-6 relative z-10 shadow-lg"
                style={{ background: "var(--brand-gradient)" }}
              >
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuyerBenefitsSection() {
  return (
    <section className="py-24 overflow-hidden relative bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/ai-matching.png`} 
              alt="Hormang Technology" 
              className="w-full max-w-md mx-auto rounded-[2rem] shadow-2xl"
            />
          </motion.div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-10">
              Why buyers love Hormang
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { 
                  icon: ShieldCheck, 
                  title: "Trusted professionals", 
                  desc: "Every provider has verified reviews and a real portfolio." 
                },
                { 
                  icon: Bot, 
                  title: "AI-powered search", 
                  desc: "Just describe your need in plain words — Hormang finds the right match instantly." 
                },
                { 
                  icon: MessageSquare, 
                  title: "Chat & negotiate", 
                  desc: "Talk directly to providers, agree on price and timing without middlemen." 
                },
                { 
                  icon: CreditCard, 
                  title: "Pay your way", 
                  desc: "Pay online by card or directly in cash. No hidden fees." 
                }
              ].map((feat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card p-6 rounded-2xl border border-border shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary mb-4">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">{feat.title}</h4>
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

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Found a great cleaner within 10 minutes — and the price was fair. Way easier than calling around!",
      author: "Dilnoza M.",
      location: "Tashkent",
      type: "Buyer",
      initials: "DM",
      color: "bg-blue-100 text-blue-700"
    },
    {
      quote: "Used Hormang to find a plumber late at night. They arrived within an hour. Incredible!",
      author: "Rustam K.",
      location: "Samarkand",
      type: "Buyer",
      initials: "RK",
      color: "bg-emerald-100 text-emerald-700"
    },
    {
      quote: "Since I joined Hormang, my client base has grown steadily. I spend less on ads and earn more.",
      author: "Alisher",
      location: "Master Plumber",
      type: "Provider",
      initials: "A",
      color: "bg-orange-100 text-orange-700"
    }
  ];

  return (
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">What people say about Hormang</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-muted/50 p-8 rounded-3xl border border-border/50 relative"
            >
              <div className="flex gap-1 text-secondary mb-6">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-lg font-medium text-foreground mb-8">"{t.quote}"</p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.author}</h4>
                  <p className="text-sm text-muted-foreground">{t.location} • {t.type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProviderBenefitsSection() {
  return (
    <section id="provider-benefits" className="py-24 relative overflow-hidden text-white" style={{ background: "var(--brand-gradient)" }}>
      <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80')] bg-cover bg-center mix-blend-luminosity"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white font-semibold text-sm mb-6 border border-white/25">
              <TrendingUp className="w-4 h-4" />
              For Pros & Businesses
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 text-white">
              Grow your business with Hormang
            </h2>
            
            <ul className="space-y-6 mb-12 text-lg">
              {[
                "Get a steady stream of local clients without spending on ads",
                "Build your reputation with verified reviews",
                "Manage all your requests in one place",
                "Get paid instantly — card or cash"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/20 shrink-0 flex items-center justify-center text-white mt-1">✓</div>
                  <span className="text-white/90 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <button className="bg-white font-bold text-lg h-14 px-8 rounded-xl text-gradient hover:bg-white/90 transition-colors shadow-xl">
              Become a Provider
            </button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/provider-growth.png`} 
              alt="Growth for providers" 
              className="w-full max-w-md mx-auto rounded-3xl border-4 border-white/10 shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the right plan to grow your business on Hormang.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <div className="bg-card rounded-3xl p-8 border-2 border-border shadow-sm flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <p className="text-muted-foreground mb-6">Perfect for trying Hormang</p>
            <div className="mb-6 pb-6 border-b border-border">
              <span className="text-5xl font-extrabold">0 sum</span>
              <span className="text-muted-foreground font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Profile in the catalog</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> 5 responses per month</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Basic support</li>
            </ul>
            <Button variant="outline" className="w-full h-12 text-base font-bold border-2">Get Started</Button>
          </div>
          
          {/* Pro */}
          <div
            className="rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4 text-white"
            style={{ background: "var(--brand-gradient)" }}
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider text-gradient">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Professional</h3>
            <p className="text-white/70 mb-6">For serious providers who want steady income</p>
            <div className="mb-6 pb-6 border-b border-white/20">
              <span className="text-5xl font-extrabold text-white">99,000 sum</span>
              <span className="text-white/60 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium text-white"><CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" /> Priority in search results</li>
              <li className="flex items-center gap-3 text-sm font-medium text-white"><CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" /> Unlimited responses</li>
              <li className="flex items-center gap-3 text-sm font-medium text-white"><CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" /> "Pro" badge on profile</li>
              <li className="flex items-center gap-3 text-sm font-medium text-white"><CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" /> Personal manager</li>
            </ul>
            <button className="w-full h-12 text-base font-bold rounded-xl bg-white text-gradient hover:bg-white/90 transition-colors">Choose Pro</button>
          </div>

          {/* Promotion */}
          <div className="bg-card rounded-3xl p-8 border-2 border-border shadow-sm flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Spotlight</h3>
            <p className="text-muted-foreground mb-6">Boost your service to the top</p>
            <div className="mb-6 pb-6 border-b border-border">
              <span className="text-5xl font-extrabold text-gradient">Pay as you go</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Pinned at the top</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Highlighted in color</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> SMS alerts for new requests</li>
            </ul>
            <Button variant="outline" className="w-full h-12 text-base font-bold border-2">Learn More</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden bg-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-5"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl" style={{ background: "var(--brand-gradient)" }}>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Ready to get things done?</h2>
          <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Download the Hormang app right now and find a verified professional in minutes.
          </p>
          <div className="flex justify-center">
            <AppStoreBadges />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  // scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
