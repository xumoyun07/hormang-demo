/**
 * data/faq.ts
 * FAQ and platform guidelines as multilingual LocalizedText objects (UZ + RU).
 *
 * Structure mirrors a future DB table:
 *   faq_items(id, question_uz, question_ru, answer_uz, answer_ru)
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
    },
    answer: {
      uz: "Kategoriyani tanlang, so'rov yuboring va tekshirilgan ijrochilardan takliflar oling.",
      ru: "Выберите категорию, отправьте запрос и получите предложения от проверенных исполнителей.",
    },
  },
  {
    id: "payment",
    question: {
      uz: "To'lov qanday amalga oshiriladi?",
      ru: "Как осуществляется оплата?",
    },
    answer: {
      uz: "To'lov ijrochi bilan to'g'ridan-to'g'ri kelishiladi. Hormang ichki to'lov amalga oshirmaydi.",
      ru: "Оплата согласовывается напрямую с исполнителем. Hormang не обрабатывает платежи.",
    },
  },
  {
    id: "choose_provider",
    question: {
      uz: "Ijrochini qanday tanlash mumkin?",
      ru: "Как выбрать исполнителя?",
    },
    answer: {
      uz: "Reyting, sharhlar va nishonlarga e'tibor bering. Ijrochi profilini diqqat bilan o'rganib chiqing.",
      ru: "Обращайте внимание на рейтинг, отзывы и значки. Внимательно изучайте профиль исполнителя.",
    },
  },
  {
    id: "cancel_offer",
    question: {
      uz: "Taklifni bekor qilish mumkinmi?",
      ru: "Можно ли отменить предложение?",
    },
    answer: {
      uz: "Ha, taklif qabul qilinguniga qadar bekor qilish mumkin. Qabul qilinganidan so'ng faqat ijrochi bilan kelishgan holda bekor qilinadi.",
      ru: "Да, до принятия предложения его можно отменить. После принятия — только по договорённости с исполнителем.",
    },
  },
  {
    id: "become_provider",
    question: {
      uz: "Ijrochi bo'lish uchun nima qilish kerak?",
      ru: "Что нужно сделать, чтобы стать исполнителем?",
    },
    answer: {
      uz: "Bosh sahifadan 'Ijrochi' bo'limini tanlang, profilingizni to'ldiring va tasdiqlashni kutib turing.",
      ru: "На главной странице перейдите в раздел «Исполнитель», заполните профиль и ожидайте подтверждения.",
    },
  },
  {
    id: "tanga",
    question: {
      uz: "Tanga nima va u nima uchun?",
      ru: "Что такое Tanga и для чего она нужна?",
    },
    answer: {
      uz: "Tanga — platformadagi ichki valyuta. Ijrochilar mijozlarga taklif yuborish uchun Tanga sarflaydi.",
      ru: "Tanga — внутренняя валюта платформы. Исполнители тратят Tanga, чтобы отправлять предложения клиентам.",
    },
  },
];

export const guidelineItems: GuidelineItem[] = [
  {
    id: "respect",
    title: {
      uz: "Hurmat bilan muloqot",
      ru: "Уважительное общение",
    },
    desc: {
      uz: "Boshqalarga nisbatan hurmat ko'rsating va muomala qoidalariga rioya qiling.",
      ru: "Проявляйте уважение к другим и соблюдайте правила общения.",
    },
  },
  {
    id: "no_fraud",
    title: {
      uz: "Firibgarlik yo'q",
      ru: "Без мошенничества",
    },
    desc: {
      uz: "Firibgarlik yoki yolg'on ma'lumotlar qat'iyan taqiqlanadi.",
      ru: "Мошенничество или ложная информация строго запрещены.",
    },
  },
  {
    id: "no_threats",
    title: {
      uz: "Tahdid yo'q",
      ru: "Без угроз",
    },
    desc: {
      uz: "Boshqa foydalanuvchilarni tahqirlash yoki tahdid qilish mumkin emas.",
      ru: "Оскорбление или угрозы в адрес других пользователей недопустимы.",
    },
  },
];
