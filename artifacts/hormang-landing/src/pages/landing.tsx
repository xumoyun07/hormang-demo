import { useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppStoreBadges } from "@/components/ui/app-store-badges";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Wrench, Baby, ChefHat, Truck, 
  Scissors, CarFront, GraduationCap, ShieldCheck, 
  MessageSquare, CreditCard, Bot, Zap, CheckCircle2, TrendingUp 
} from "lucide-react";

// --- Sections ---

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
              Платформа №1 для локальных услуг
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-foreground leading-[1.1] mb-6">
              Найди мастера. <br/>
              <span className="text-gradient">Закажи услугу.</span><br/>
              Сегодня.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Ваш надежный помощник для любых задач. От уборки до сложного ремонта — тысячи проверенных специалистов уже ждут вашу заявку в Hormang.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <AppStoreBadges />
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Бесплатно
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Без скрытых комиссий
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
                <p className="text-xs text-muted-foreground font-medium">Статус</p>
                <p className="text-sm font-bold text-foreground">Проверен</p>
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
                <p className="text-xs text-muted-foreground font-medium">Рейтинг</p>
                <p className="text-sm font-bold text-foreground">4.9 из 5</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const categories = [
    { icon: Sparkles, name: "Клининг и уборка", desc: "Квартиры, офисы, окна", color: "bg-blue-100 text-blue-600" },
    { icon: Wrench, name: "Ремонт и стройка", desc: "Электрика, сантехника", color: "bg-orange-100 text-orange-600" },
    { icon: Baby, name: "Няни и сиделки", desc: "Уход за детьми и пожилыми", color: "bg-pink-100 text-pink-600" },
    { icon: ChefHat, name: "Повар на дом", desc: "Готовка, банкеты, торты", color: "bg-red-100 text-red-600" },
    { icon: Truck, name: "Переезды", desc: "Грузчики, транспорт", color: "bg-purple-100 text-purple-600" },
    { icon: Scissors, name: "Красота", desc: "Маникюр, стрижки, макияж", color: "bg-rose-100 text-rose-600" },
    { icon: CarFront, name: "Автосервис", desc: "Диагностика, мойка, шины", color: "bg-zinc-100 text-zinc-600" },
    { icon: GraduationCap, name: "Репетиторы", desc: "Языки, школа, музыка", color: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <section id="categories" className="py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Популярные услуги</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Найдите исполнителя для любой задачи в пару кликов.
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
          <Button variant="outline" size="lg">Посмотреть все 20+ категорий</Button>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 overflow-hidden relative">
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
              alt="AI Matching Technology" 
              className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
            />
          </motion.div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Умные технологии для вашего удобства
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Hormang делает процесс поиска и найма специалистов максимально простым и безопасным.
            </p>
            
            <div className="space-y-6">
              {[
                { icon: Bot, title: "AI-подбор", desc: "Просто опишите задачу своими словами, и алгоритм сам найдет лучших кандидатов." },
                { icon: ShieldCheck, title: "Проверенные отзывы", desc: "Мы тщательно модерируем отзывы. Вы видите только реальный рейтинг." },
                { icon: MessageSquare, title: "Встроенный чат", desc: "Обсуждайте детали, обменивайтесь фото и договаривайтесь прямо в приложении." },
                { icon: CreditCard, title: "Безопасная оплата", desc: "Платите картой или наличными. Ваши данные надежно защищены." }
              ].map((feat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">{feat.title}</h4>
                    <p className="text-muted-foreground">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
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
              Для бизнеса и фрилансеров
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-white">
              Зарабатывайте больше с Hormang
            </h2>
            <p className="text-lg text-muted-foreground opacity-90 mb-10">
              Не тратьте деньги на маркетинг. Получайте готовые заказы, развивайте свой профиль и выстраивайте очередь из клиентов.
            </p>
            
            <ul className="space-y-5 mb-10 text-lg">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white">✓</div>
                <span>Постоянный поток заявок в вашем районе</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white">✓</div>
                <span>Справедливый рейтинг и отзывы</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white">✓</div>
                <span>Прямое общение с клиентами</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white">✓</div>
                <span>Бесплатная базовая регистрация</span>
              </li>
            </ul>
            
            <Button size="lg" className="w-full sm:w-auto bg-secondary text-white hover:bg-secondary/90 shadow-[0_0_30px_-5px_hsl(var(--secondary))]">
              Зарегистрироваться как мастер
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
              className="w-full max-w-md mx-auto rounded-3xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Тарифы для специалистов</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Начните бесплатно или выберите профессиональный план для максимального охвата.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Базовый</h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">0 сум</span>
              <span className="text-muted-foreground">/мес</span>
            </div>
            <p className="text-muted-foreground mb-6 pb-6 border-b border-border">Идеально для старта и ознакомления с платформой.</p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-green-500" /> Профиль в каталоге</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-green-500" /> 5 откликов на заявки в месяц</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-green-500" /> Базовая поддержка</li>
            </ul>
            <Button variant="outline" className="w-full">Выбрать</Button>
          </div>
          
          {/* Pro */}
          <div className="bg-foreground text-background rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Популярный
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">99k сум</span>
              <span className="text-muted-foreground opacity-70">/мес</span>
            </div>
            <p className="text-muted-foreground opacity-80 mb-6 pb-6 border-b border-white/10">Для тех, кто хочет стабильный поток заказов.</p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-secondary" /> Приоритет в выдаче</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-secondary" /> Безлимитные отклики</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-secondary" /> Значок "Pro" в профиле</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-secondary" /> Персональный менеджер</li>
            </ul>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-white">Выбрать Pro</Button>
          </div>

          {/* Promotion */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Продвижение</h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gradient">Топ</span>
            </div>
            <p className="text-muted-foreground mb-6 pb-6 border-b border-border">Разовые услуги для привлечения максимума внимания.</p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-primary" /> Закрепление в топе категории</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-primary" /> Выделение цветом</li>
              <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-primary" /> SMS-уведомления о новых заявках</li>
            </ul>
            <Button variant="outline" className="w-full">Узнать подробнее</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-10"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Готовы решить вашу задачу?</h2>
          <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Скачайте приложение Hormang прямо сейчас и найдите проверенного специалиста за пару минут.
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
        <CategoriesSection />
        <FeaturesSection />
        <ProviderBenefitsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
