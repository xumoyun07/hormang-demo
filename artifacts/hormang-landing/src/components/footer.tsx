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
    <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg bg-blue-600 shadow-sm">
                H
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">Hormang</span>
            </Link>
            <p className="text-gray-500 leading-relaxed text-sm">
              Mahalliy mutaxassislar va xizmatlarni topish uchun ishonchli platforma. Tez, xavfsiz va qulay.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors duration-200 card-shadow"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Mijozlarga */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-gray-900 uppercase tracking-wide">Mijozlarga</h4>
            <ul className="space-y-3 text-sm">
              {[
                "Xizmat buyurtma qilish",
                "Barcha kategoriyalar",
                "Xavfsizlik va kafolatlar",
                "Ko'p so'raladigan savollar",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors duration-200 font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ijrochilar uchun */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-gray-900 uppercase tracking-wide">Ijrochilar uchun</h4>
            <ul className="space-y-3 text-sm">
              {[
                "Ijrochi bo'lish",
                "Tarif va reklama",
                "Platforma qoidalari",
                "Bilimlar bazasi",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors duration-200 font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Aloqa */}
          <div>
            <h4 className="font-bold text-sm mb-5 text-gray-900 uppercase tracking-wide">Aloqa</h4>
            <ul className="space-y-3.5 text-sm text-gray-500">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <span>Toshkent, Amir Temur ko'chasi, 108</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span>+998 (71) 200-00-00</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span>support@hormang.uz</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-7 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Hormang. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-700 transition-colors font-medium">
              Maxfiylik siyosati
            </a>
            <a href="#" className="hover:text-gray-700 transition-colors font-medium">
              Foydalanish shartlari
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
