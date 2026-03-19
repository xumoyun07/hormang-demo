import { useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppStoreBadges } from "@/components/ui/app-store-badges";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Wrench, Baby, ChefHat, Truck, 
  Scissors, CarFront, GraduationCap, ShieldCheck, 
  MessageSquare, CreditCard, Bot, Zap, CheckCircle2, TrendingUp,
  XCircle, Search, Users, Star, Edit3
} from "lucide-react";

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-40 mix-blend-multiply blur-3xl pointer-events-none">
        <div className="w-[600px] h-[600px] bg-primary rounded-full" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-30 mix-blend-multiply blur-3xl pointer-events-none">
        <div className="w-[500px] h-[500px] bg-secondary rounded-full" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground font-semibold text-sm mb-6 border border-primary/10">
              <Zap className="w-4 h-4" fill="currentColor" />
              The #1 Platform for Local Services
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-foreground leading-[1.1] mb-6">
              Find Trusted <br/>
              <span className="text-gradient">Local Services</span><br/>
              in One Tap.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Hormang connects you with verified local professionals for everyday tasks — from home repairs to babysitting, cooking, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold shadow-lg shadow-primary/25">Find a Service</Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2">Become a Provider</Button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Verified Pros
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                No Hidden Fees
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none perspective-1000"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/app-mockup.png`} 
              alt="Hormang App Mockup" 
              className="w-full h-auto drop-shadow-2xl rounded-3xl"
            />
            {/* Floating badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-1/4 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-border flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <p className="text-sm font-bold text-foreground">Verified</p>
              </div>
            </motion.div>
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 -right-4 sm:-right-12 bg-white p-4 rounded-2xl shadow-xl border border-border flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                ⭐
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rating</p>
                <p className="text-sm font-bold text-foreground">4.9 out of 5</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
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
    <section className="py-16 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10 text-center">
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-secondary mb-2">5,000+</p>
            <p className="text-sm md:text-base font-medium opacity-80">Registered Providers</p>
          </div>
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-secondary mb-2">20+</p>
            <p className="text-sm md:text-base font-medium opacity-80">Service Categories</p>
          </div>
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-secondary mb-2">50,000+</p>
            <p className="text-sm md:text-base font-medium opacity-80">Tasks Completed</p>
          </div>
          <div className="px-4">
            <p className="text-4xl md:text-5xl font-display font-extrabold text-secondary mb-2">4.8<span className="text-3xl">★</span></p>
            <p className="text-sm md:text-base font-medium opacity-80">Average Rating</p>
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
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Popular Services</h2>
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
              className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-xl ${cat.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
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
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">From Request to Done — in Minutes</h2>
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
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-primary/20">
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
    <section id="provider-benefits" className="py-24 bg-foreground text-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80')] bg-cover bg-center mix-blend-luminosity"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-semibold text-sm mb-6 border border-white/20">
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
                  <div className="w-6 h-6 rounded-full bg-secondary shrink-0 flex items-center justify-center text-white mt-1">✓</div>
                  <span className="text-white/90 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <Button size="lg" className="w-full sm:w-auto bg-secondary text-white hover:bg-secondary/90 shadow-[0_0_30px_-5px_hsl(var(--secondary))] text-lg h-14 px-8">
              Become a Provider
            </Button>
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
          <div className="bg-foreground text-background rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4 border-2 border-foreground">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-secondary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Professional</h3>
            <p className="text-muted-foreground opacity-80 mb-6">For serious providers who want steady income</p>
            <div className="mb-6 pb-6 border-b border-white/10">
              <span className="text-5xl font-extrabold">99,000 sum</span>
              <span className="text-muted-foreground opacity-70 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-secondary" /> Priority in search results</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-secondary" /> Unlimited responses</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-secondary" /> "Pro" badge on profile</li>
              <li className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-secondary" /> Personal manager</li>
            </ul>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 text-base font-bold">Choose Pro</Button>
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
        <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl">
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
