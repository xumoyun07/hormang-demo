import { Link } from "wouter";
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-xl shadow-lg">
                H
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                Hormang
              </span>
            </Link>
            <p className="text-muted-foreground opacity-80 leading-relaxed">
              Ваш надежный маркетплейс для поиска локальных специалистов и услуг. Быстро, безопасно, удобно.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6">Клиентам</h4>
            <ul className="space-y-4 text-muted-foreground opacity-80">
              <li><a href="#" className="hover:text-white transition-colors">Как заказать услугу</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Все категории</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Безопасность и гарантии</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Частые вопросы</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6">Специалистам</h4>
            <ul className="space-y-4 text-muted-foreground opacity-80">
              <li><a href="#" className="hover:text-white transition-colors">Стать исполнителем</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Тарифы и продвижение</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Правила платформы</a></li>
              <li><a href="#" className="hover:text-white transition-colors">База знаний</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6">Контакты</h4>
            <ul className="space-y-4 text-muted-foreground opacity-80">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-secondary" />
                <span>г. Ташкент, ул. Амира Темура, 108</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary" />
                <span>+998 (71) 200-00-00</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary" />
                <span>support@hormang.uz</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground opacity-60">
          <p>© {new Date().getFullYear()} Hormang. Все права защищены.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
