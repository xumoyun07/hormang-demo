import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Xizmatlar", href: "#categories" },
    { name: "Qanday ishlaydi", href: "#how-it-works" },
    { name: "Narxlar", href: "#pricing" },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-2xl shadow-[0_4px_32px_-8px_rgba(0,0,0,0.12)] border-b border-border/40 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg"
              whileHover={{ scale: 1.1, rotate: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center text-white font-display font-black text-xl"
                style={{ background: "var(--brand-gradient)" }}
              >
                H
              </div>
            </motion.div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-foreground">
              hormang
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <a
                    href={link.href}
                    className="relative text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                  >
                    {link.name}
                    <span
                      className="absolute -bottom-0.5 left-0 w-0 h-0.5 rounded-full group-hover:w-full transition-all duration-300"
                      style={{ background: "var(--brand-gradient)" }}
                    />
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="flex items-center gap-3 border-l border-border pl-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                <a href="#cta">
                  <Button variant="ghost" className="hidden lg:inline-flex font-semibold">
                    Kirish
                  </Button>
                </a>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}>
                <a href="#provider-benefits">
                  <Button className="font-bold shadow-lg shadow-primary/25 gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Ijrochi bo'lish
                  </Button>
                </a>
              </motion.div>
            </div>
          </nav>

          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileMenuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-border shadow-xl"
          >
            <div className="p-4 flex flex-col gap-3">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="border-t border-border pt-3 mt-1 flex flex-col gap-2">
                <Button variant="outline" className="w-full font-bold">
                  Kirish
                </Button>
                <Button className="w-full font-bold gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Ijrochi bo'lish
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
