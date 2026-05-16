/**
 * data/faq.ts
 * FAQ and platform guidelines as multilingual LocalizedText objects.
 *
 * Structure mirrors a future DB table:
 *   faq_items(id, question_uz, question_ru, question_en, answer_uz, answer_ru, answer_en)
 *
 * To add/edit FAQ: update the arrays below. When a real backend exists,
 * replace the static arrays with an API fetch — all consumers already
 * use getLocalizedText(), so zero frontend refactoring will be needed.
 */
import type { LocalizedText } from "@/lib/localization";

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface GuidelineItem {
  id: string;
  title: LocalizedText;
  desc: LocalizedText;
}

export const faqItems: FaqItem[] = [
  {
    id: "order_process",
    question: {
      uz: "Buyurtma qanday ishlaydi?",
      ru: "Как работает заказ?",
      en: "How does an order work?",
    },
    answer: {
      uz: "Kategoriyani tanlang, so'rov yuboring va tekshirilgan ijrochilardan takliflar oling.",
      ru: "Выберите категорию, отправьте запрос и получите предложения от проверенных исполнителей.",
      en: "Select a category, submit a request and receive offers from verified service providers.",
    },
  },
  {
    id: "payment",
    question: {
      uz: "To'lov qanday amalga oshiriladi?",
      ru: "Как осуществляется оплата?",
      en: "How is payment made?",
    },
    answer: {
      uz: "To'lov ijrochi bilan to'g'ridan-to'g'ri kelishiladi. Hormang ichki to'lov amalga oshirmaydi.",
      ru: "Оплата согласовывается напрямую с исполнителем. Hormang не обрабатывает платежи.",
      en: "Payment is agreed directly with the service provider. Hormang does not process payments.",
    },
  },
  {
    id: "choose_provider",
    question: {
      uz: "Ijrochini qanday tanlash mumkin?",
      ru: "Как выбрать исполнителя?",
      en: "How do I choose a service provider?",
    },
    answer: {
      uz: "Reyting, sharhlar va nishonlarga e'tibor bering. Ijrochi profilini diqqat bilan o'rganib chiqing.",
      ru: "Обращайте внимание на рейтинг, отзывы и значки. Внимательно изучайте профиль исполнителя.",
      en: "Pay attention to ratings, reviews, and badges. Study the provider profile carefully.",
    },
  },
  {
    id: "cancel_offer",
    question: {
      uz: "Taklifni bekor qilish mumkinmi?",
      ru: "Можно ли отменить предложение?",
      en: "Can I cancel an offer?",
    },
    answer: {
      uz: "Ha, taklif qabul qilinguniga qadar bekor qilish mumkin. Qabul qilinganidan so'ng faqat ijrochi bilan kelishgan holda bekor qilinadi.",
      ru: "Да, до принятия предложения его можно отменить. После принятия — только по договорённости с исполнителем.",
      en: "Yes, you can cancel before acceptance. After acceptance, cancellation requires agreement with the provider.",
    },
  },
  {
    id: "become_provider",
    question: {
      uz: "Ijrochi bo'lish uchun nima qilish kerak?",
      ru: "Что нужно сделать, чтобы стать исполнителем?",
      en: "How do I become a service provider?",
    },
    answer: {
      uz: "Bosh sahifadan 'Ijrochi' bo'limini tanlang, profilingizni to'ldiring va tasdiqlashni kutib turing.",
      ru: "На главной странице перейдите в раздел «Исполнитель», заполните профиль и ожидайте подтверждения.",
      en: "Go to the 'Provider' section on the main page, complete your profile, and wait for verification.",
    },
  },
  {
    id: "tanga",
    question: {
      uz: "Tanga nima va u nima uchun?",
      ru: "Что такое Tanga и для чего она нужна?",
      en: "What is Tanga and what is it for?",
    },
    answer: {
      uz: "Tanga — platformadagi ichki valyuta. Ijrochilar mijozlarga taklif yuborish uchun Tanga sarflaydi.",
      ru: "Tanga — внутренняя валюта платформы. Исполнители тратят Tanga, чтобы отправлять предложения клиентам.",
      en: "Tanga is the platform's internal currency. Providers spend Tanga to send offers to customers.",
    },
  },
];

export const guidelineItems: GuidelineItem[] = [
  {
    id: "respect",
    title: {
      uz: "Hurmat bilan muloqot",
      ru: "Уважительное общение",
      en: "Respectful Communication",
    },
    desc: {
      uz: "Boshqalarga nisbatan hurmat ko'rsating va muomala qoidalariga rioya qiling.",
      ru: "Проявляйте уважение к другим и соблюдайте правила общения.",
      en: "Show respect for others and follow communication guidelines.",
    },
  },
  {
    id: "no_fraud",
    title: {
      uz: "Firibgarlik yo'q",
      ru: "Без мошенничества",
      en: "No Fraud",
    },
    desc: {
      uz: "Firibgarlik yoki yolg'on ma'lumotlar qat'iyan taqiqlanadi.",
      ru: "Мошенничество или ложная информация строго запрещены.",
      en: "Fraud or false information is strictly prohibited.",
    },
  },
  {
    id: "no_threats",
    title: {
      uz: "Tahdid yo'q",
      ru: "Без угроз",
      en: "No Threats",
    },
    desc: {
      uz: "Boshqa foydalanuvchilarni tahqirlash yoki tahdid qilish mumkin emas.",
      ru: "Оскорбление или угрозы в адрес других пользователей недопустимы.",
      en: "Insulting or threatening other users is not permitted.",
    },
  },
];
