import { Link } from "wouter";
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

const socialLinks = [
  { icon: Facebook, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Twitter, href: "#" },
];

export function Footer() {
  return (
    <footer className="relative bg-foreground text-background pt-20 pb-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[300px] rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: "var(--brand-gradient)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[200px] rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: "var(--brand-gradient)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-black text-xl shadow-lg"
                style={{ background: "var(--brand-gradient)" }}
              >
                H
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                hormang
              </span>
            </Link>
            <p className="text-muted-foreground opacity-75 leading-relaxed text-sm">
              Mahalliy mutaxassislar va xizmatlarni topish uchun ishonchli platforma. Tez, xavfsiz va qulay.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-base mb-6 text-white">Mijozlarga</h4>
            <ul className="space-y-3 text-sm">
              {[
                "Xizmat buyurtma qilish",
                "Barcha kategoriyalar",
                "Xavfsizlik va kafolatlar",
                "Ko'p so'raladigan savollar",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-muted-foreground opacity-75 hover:text-white hover:opacity-100 transition-all duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-base mb-6 text-white">Ijrochilar uchun</h4>
            <ul className="space-y-3 text-sm">
              {[
                "Ijrochi bo'lish",
                "Tarif va reklama",
                "Platforma qoidalari",
                "Bilimlar bazasi",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-muted-foreground opacity-75 hover:text-white hover:opacity-100 transition-all duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-base mb-6 text-white">Aloqa</h4>
            <ul className="space-y-4 text-sm text-muted-foreground opacity-75">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--g-bright)" }} />
                <span>Toshkent, Amir Temur ko'chasi, 108</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "var(--g-bright)" }} />
                <span>+998 (71) 200-00-00</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--g-bright)" }} />
                <span>support@hormang.uz</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground opacity-50">
          <p>© 2026 Hormang. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white hover:opacity-100 transition-all">
              Maxfiylik siyosati
            </a>
            <a href="#" className="hover:text-white hover:opacity-100 transition-all">
              Foydalanish shartlari
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
