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
      ru: "Выберите категорию, отправьте запрос и получайте предложения от проверенных исполнителей.",
    },
  },
  {
    id: "tanga",
    question: {
      uz: "Tanga tizimi qanday ishlaydi?",
      ru: "Как работает система Tanga?",
    },
    answer: {
      uz: "Tanga — bu ijrochilar uchun ichki valyuta bo'lib, takliflar yuborish uchun ishlatiladi.",
      ru: "Tanga — это внутренняя валюта для исполнителей, используемая для отправки предложений.",
    },
  },
  {
    id: "cancel",
    question: {
      uz: "So'rovni bekor qilish mumkinmi?",
      ru: "Можно ли отменить запрос?",
    },
    answer: {
      uz: "Ha, ijrochi tomonidan hali qabul qilinmagan bo'lsa, so'rovni bekor qilish mumkin.",
      ru: "Да, вы можете отменить запрос, пока исполнитель ещё не принял его.",
    },
  },
  {
    id: "review",
    question: {
      uz: "Ijrochiga baho qanday qoldiriladi?",
      ru: "Как оставить отзыв об исполнителе?",
    },
    answer: {
      uz: "Xizmat tugagandan so'ng siz ijrochiga baho va sharh qoldirishingiz mumkin.",
      ru: "После завершения услуги вы можете оставить оценку и отзыв об исполнителе.",
    },
  },
  {
    id: "safety",
    question: {
      uz: "Platforma qanchalik xavfsiz?",
      ru: "Насколько безопасна платформа?",
    },
    answer: {
      uz: "Barcha ijrochilar tekshiriladi. Xavfsizligingiz uchun shaxsiy ma'lumotlaringizni himoya qilamiz.",
      ru: "Все исполнители проверяются. Мы защищаем ваши личные данные для вашей безопасности.",
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
      uz: "HORMANG platformasida barcha foydalanuvchilar bir-biriga hurmat bilan munosabatda bo'lishi kerak. Haqorat, tahdid, kamsitish yoki bezovta qiluvchi xatti-harakatlar qat'iyan ta'qiqlanadi.",
      ru: "Все пользователи платформы HORMANG обязаны относиться друг к другу с уважением. Оскорбления, угрозы, дискриминация или домогательства строго запрещены.",
    },
  },
  {
    id: "no_fraud",
    title: {
      uz: "Halollik va soflik",
      ru: "Честность и правдивость",
    },
    desc: {
      uz: "Profilingiz, xizmatlaringiz, narxlaringiz va sharhlaringizda faqat haqiqiy va to'g'ri ma'lumotlardan foydalaning. Firibgarlik yoki yolg'on ma'lumotlar qat'iyan taqiqlanadi.",
      ru: "Используйте только достоверную и точную информацию в своём профиле, описании услуг, ценах и отзывах. Мошенничество или предоставление ложной информации строго запрещено.",
    },
  },
  {
    id: "no_threats",
    title: {
      uz: "Platformadan adolatli foydalanish",
      ru: "Добросовестное использование платформы",
    },
    desc: {
      uz: "Spam, tizimdan noto'g'ri foydalanish, soxta so'rov yoki takliflar yuborish, yoki platforma qoidalarini chetlab o'tishga urinish taqiqlanadi. Hormang barcha foydalanuvchilar uchun xavfsiz va adolatli bo'lishi kerak.",
      ru: "Спам, злоупотребление системой, отправка поддельных запросов или предложений, а также попытки обойти правила платформы запрещены. Hormang должен быть безопасным и справедливым для всех пользователей.",
    },
  },
];
