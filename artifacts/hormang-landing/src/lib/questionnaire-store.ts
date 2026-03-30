/**
 * questionnaire-store.ts
 * Central configuration for all category questions + localStorage persistence.
 * Key: hormang_questions_v1
 */

export type QuestionType =
  | "single-select"
  | "multi-select"
  | "text"
  | "textarea"
  | "number"
  | "yes-no"
  | "date"
  | "file";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  emoji: string;
  questions: Question[];
}

/** Appended at the END of every category's question list */
export const COMMON_QUESTIONS: Question[] = [
  {
    id: "urgency",
    label: "Shoshilinchlik darajasi",
    type: "single-select",
    required: true,
    options: [
      { label: "Bugun yoki ertaga kerak", value: "today_tomorrow" },
      { label: "3–7 kun ichida", value: "3_7_days" },
      { label: "1–2 hafta ichida", value: "1_2_weeks" },
      { label: "1 oy ichida", value: "1_month" },
      { label: "Shoshilinch emas (qulay vaqt)", value: "flexible" },
    ],
  },
  {
    id: "budget",
    label: "Taxminiy byudjet",
    type: "number",
    placeholder: "Masalan: 500 000",
    helpText: "so'm",
  },
];

const INITIAL_CATEGORIES: CategoryConfig[] = [
  {
    id: "tamirlash",
    name: "Ta'mirlash",
    emoji: "🔧",
    questions: [
      {
        id: "repair_items",
        label: "Nimani ta'mirlash kerak?",
        type: "multi-select",
        required: true,
        options: [
          { label: "Santexnika", value: "santexnika" },
          { label: "Elektr jihozlari", value: "elektr" },
          { label: "Mebel", value: "mebel" },
          { label: "Konditsioner", value: "konditsioner" },
          { label: "Muzlatgich", value: "muzlatgich" },
          { label: "Kir yuvish mashinasi", value: "kir_yuvish" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "repair_desc",
        label: "Muammoni qisqacha tasvirlab bering.",
        type: "textarea",
        placeholder: "Muammo haqida batafsil yozing...",
      },
      { id: "repair_photo", label: "Rasm yuklash", type: "file" },
    ],
  },
  {
    id: "tozalash",
    name: "Tozalash",
    emoji: "🧹",
    questions: [
      {
        id: "clean_type",
        label: "Tozalash turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Oddiy", value: "oddiy" },
          { label: "Chuqur", value: "chuqur" },
          { label: "Ko'chib kirishdan oldin", value: "kochib_kirish" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "clean_place",
        label: "Joy turi?",
        type: "single-select",
        options: [
          { label: "Kvartira", value: "kvartira" },
          { label: "Ofis", value: "ofis" },
          { label: "Hovli", value: "hovli" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "clean_size",
        label: "Joy hajmi? (xona soni yoki kvm)",
        type: "number",
        placeholder: "Masalan: 3 (xona) yoki 80 (kvm)",
      },
      {
        id: "clean_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
      { id: "clean_photo", label: "Rasm yuklash", type: "file" },
    ],
  },
  {
    id: "avto",
    name: "Avto xizmat",
    emoji: "🚗",
    questions: [
      {
        id: "avto_type",
        label: "Xizmat turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Yuvish", value: "yuvish" },
          { label: "Ta'mirlash", value: "tamirlash" },
          { label: "Diagnostika", value: "diagnostika" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "avto_car",
        label: "Mashina markasi?",
        type: "text",
        placeholder: "Masalan: Chevrolet Cobalt",
      },
      {
        id: "avto_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
      { id: "avto_photo", label: "Rasm yuklash", type: "file" },
    ],
  },
  {
    id: "kochirish",
    name: "Ko'chirish / yuk yetkazish",
    emoji: "🚚",
    questions: [
      {
        id: "move_cargo",
        label: "Yuk turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Xonadon jihozlari", value: "xonadon" },
          { label: "Ofis jihozlari", value: "ofis" },
          { label: "Oziq-ovqat mahsulotlari", value: "oziq_ovqat" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "move_from",
        label: "Qayerdan? (manzil)",
        type: "text",
        placeholder: "Yuk olinadigan manzil...",
      },
      {
        id: "move_to",
        label: "Qayerga? (manzil)",
        type: "text",
        placeholder: "Yuk yetkaziladigan manzil...",
      },
      { id: "move_lift", label: "Lift mavjudmi?", type: "yes-no" },
      {
        id: "move_floor",
        label: "Nechanchi qavat?",
        type: "number",
        placeholder: "Qavat raqami",
      },
      {
        id: "move_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
      { id: "move_photo", label: "Rasm yuklash", type: "file" },
    ],
  },
  {
    id: "repetitor",
    name: "Repetitorlar",
    emoji: "📚",
    questions: [
      {
        id: "rep_subject",
        label: "Fan turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Ingliz tili", value: "ingliz" },
          { label: "Rus tili", value: "rus" },
          { label: "Matematika", value: "matematika" },
          { label: "Musiqa", value: "musiqa" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "rep_level",
        label: "Hozirgi darajangiz?",
        type: "single-select",
        options: [
          { label: "Boshlang'ich", value: "boshlangich" },
          { label: "O'rta", value: "orta" },
          { label: "Yuqori", value: "yuqori" },
        ],
      },
      {
        id: "rep_format",
        label: "Dars formati?",
        type: "single-select",
        options: [
          { label: "Online", value: "online" },
          { label: "Offline", value: "offline" },
        ],
      },
      {
        id: "rep_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
    ],
  },
  {
    id: "tadbir",
    name: "Tadbir xizmatlari",
    emoji: "🎉",
    questions: [
      {
        id: "event_type",
        label: "Tadbir turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "To'y", value: "toy" },
          { label: "Tug'ilgan kun", value: "tugilgan_kun" },
          { label: "Kelin salom", value: "kelin_salom" },
          { label: "Gap", value: "gap" },
          { label: "Korporativ", value: "korporativ" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "event_services",
        label: "Xizmat turi?",
        type: "multi-select",
        options: [
          { label: "Ovqat pishirish", value: "ovqat" },
          { label: "Bezash xizmati", value: "bezash" },
          { label: "Video/rasm xizmati", value: "video_rasm" },
          { label: "Tashkillashtirish xizmati", value: "tashkil" },
          { label: "Ijara xizmati", value: "ijara" },
          { label: "Tozalash xizmati", value: "tozalash" },
          { label: "Kortej xizmati", value: "kortej" },
          { label: "Musiqiy xizmatlar", value: "musiqa" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      { id: "event_date", label: "Belgilangan sana?", type: "date" },
      {
        id: "event_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
    ],
  },
  {
    id: "gozallik",
    name: "Go'zallik",
    emoji: "💄",
    questions: [
      {
        id: "beauty_service",
        label: "Xizmat turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Makiyaj", value: "makiyaj" },
          { label: "Manikyur/pedikyur", value: "manikyur" },
          { label: "Soch turmak", value: "soch" },
          { label: "Qosh/kiprik", value: "qosh_kiprik" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "beauty_reason",
        label: "Xizmat sababi?",
        type: "single-select",
        options: [
          { label: "Kundalik", value: "kundalik" },
          { label: "To'y marosimlari", value: "toy" },
          { label: "Boshqa tadbirlar", value: "boshqa" },
        ],
      },
      {
        id: "beauty_location",
        label: "Xizmat joyi?",
        type: "single-select",
        options: [
          { label: "Uyda", value: "uyda" },
          { label: "Salonda", value: "salon" },
        ],
      },
      {
        id: "beauty_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
      { id: "beauty_photo", label: "Rasm yuklash", type: "file" },
    ],
  },
  {
    id: "enaga",
    name: "Enagalik",
    emoji: "👶",
    questions: [
      {
        id: "nanny_type",
        label: "Enagalik turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Yosh bola", value: "yosh_bola" },
          { label: "Qariya", value: "qariya" },
        ],
      },
      {
        id: "nanny_gender",
        label: "Enaga jinsi?",
        type: "single-select",
        options: [
          { label: "Erkak", value: "erkak" },
          { label: "Ayol", value: "ayol" },
        ],
      },
      {
        id: "nanny_notes",
        label: "Qo'shimcha ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
    ],
  },
  {
    id: "ustachilik",
    name: "Ustachilik",
    emoji: "🏗️",
    questions: [
      {
        id: "craft_service",
        label: "Xizmat turi?",
        type: "single-select",
        required: true,
        options: [
          { label: "Qurilish va tashqi fasad", value: "qurilish" },
          { label: "Ichki pardozlash ishlari", value: "pardozlash" },
          { label: "Kommunikatsiya ishlari", value: "kommunikatsiya" },
          { label: "Duradgorlik ishlari", value: "duradgorlik" },
          { label: "Landshaft va dizayn", value: "landshaft" },
          { label: "Boshqa", value: "boshqa" },
        ],
      },
      {
        id: "craft_place",
        label: "Joy turi?",
        type: "single-select",
        options: [
          { label: "Kvartira", value: "kvartira" },
          { label: "Hovli", value: "hovli" },
          { label: "Noturar bino", value: "noturar" },
        ],
      },
      {
        id: "craft_accommodation",
        label: "Ovqat va yotoq bilan ta'minlash?",
        type: "single-select",
        options: [
          { label: "Ha", value: "ha" },
          { label: "Faqat ovqat", value: "faqat_ovqat" },
          { label: "Faqat yotoq", value: "faqat_yotoq" },
          { label: "Yo'q", value: "yoq" },
        ],
      },
      {
        id: "craft_notes",
        label: "Boshqa ma'lumotlar",
        type: "textarea",
        placeholder: "Boshqa ma'lumotlar...",
      },
    ],
  },
];

const LS_KEY = "hormang_questions_v1";

export function getCategories(): CategoryConfig[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored) as CategoryConfig[];
  } catch (_) { /* ignore */ }
  return INITIAL_CATEGORIES;
}

export function saveCategories(cats: CategoryConfig[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cats));
}

export function getCategoryById(id: string): CategoryConfig | undefined {
  return getCategories().find((c) => c.id === id);
}

/** Full list: category-specific questions + 2 common ones */
export function getAllQuestionsForCategory(categoryId: string): Question[] {
  const cat = getCategoryById(categoryId);
  if (!cat) return [...COMMON_QUESTIONS];
  return [...cat.questions, ...COMMON_QUESTIONS];
}

export function resetCategories(): void {
  localStorage.removeItem(LS_KEY);
}
