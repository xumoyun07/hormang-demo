/**
 * questionnaire-store.ts
 * Central configuration for all category questions + localStorage persistence.
 * Key: hormang_questions_v1 / hormang_common_questions_v1
 */

export type QuestionType =
  | "single-select"
  | "multi-select"
  | "text"
  | "textarea"
  | "number"
  | "yes-no"
  | "date"
  | "file"
  | "range"
  | "section-header";

export interface QuestionOption {
  label: string;
  value: string;
  /** "other" → selecting this option reveals a free-text input below it */
  type?: "fixed" | "other";
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  isCore?: boolean;
  conditional?: { questionId: string; value: string };
  /** option value → follow-up questions shown when that option is selected */
  conditionalBranches?: Record<string, Question[]>;
}

export interface CategoryConfig {
  id: string;
  name: string;
  emoji: string;
  questions: Question[];
}

/** Default common questions (editable via admin, persisted separately) */
export const DEFAULT_COMMON_QUESTIONS: Question[] = [
  {
    id: "region",
    label: "Xizmat qayerda kerak?",
    type: "single-select",
    required: true,
    isCore: true,
    options: [
      { label: "Toshkent shahri", value: "Toshkent shahri" },
      { label: "Angren", value: "Angren" },
      { label: "Bekobod", value: "Bekobod" },
      { label: "Bo'ka", value: "Bo'ka" },
      { label: "Bo'stonliq", value: "Bo'stonliq" },
      { label: "Chinoz", value: "Chinoz" },
      { label: "Chirchiq", value: "Chirchiq" },
      { label: "Chorvoq", value: "Chorvoq" },
      { label: "Do'stobod", value: "Do'stobod" },
      { label: "G'azalkent", value: "G'azalkent" },
      { label: "Keles", value: "Keles" },
      { label: "Ohangaron", value: "Ohangaron" },
      { label: "Olmaliq", value: "Olmaliq" },
      { label: "Oqqo'rg'on", value: "Oqqo'rg'on" },
      { label: "O'rta Chirchiq", value: "O'rta Chirchiq" },
      { label: "Parkent", value: "Parkent" },
      { label: "Piskent", value: "Piskent" },
      { label: "Qibray", value: "Qibray" },
      { label: "Quyi Chirchiq", value: "Quyi Chirchiq" },
      { label: "To'ytepa", value: "To'ytepa" },
      { label: "Yangiobod", value: "Yangiobod" },
      { label: "Yangiyо'l", value: "Yangiyо'l" },
      { label: "Yuqori Chirchiq", value: "Yuqori Chirchiq" },
      { label: "Zangiota", value: "Zangiota" },
    ],
  },
  {
    id: "district",
    label: "Toshkent shahri tumani",
    type: "single-select",
    isCore: true,
    options: [
      { label: "Bektemir", value: "Bektemir" },
      { label: "Chilonzor", value: "Chilonzor" },
      { label: "Mirobod", value: "Mirobod" },
      { label: "Mirzo Ulug'bek", value: "Mirzo Ulug'bek" },
      { label: "Olmazor", value: "Olmazor" },
      { label: "Sergeli", value: "Sergeli" },
      { label: "Shayxontohur", value: "Shayxontohur" },
      { label: "Uchtepa", value: "Uchtepa" },
      { label: "Yakkasaroy", value: "Yakkasaroy" },
      { label: "Yangihayot", value: "Yangihayot" },
      { label: "Yashnobod", value: "Yashnobod" },
      { label: "Yunusobod", value: "Yunusobod" },
    ],
  },
  {
    id: "urgency",
    label: "Shoshilinchlik darajasi",
    type: "single-select",
    required: true,
    isCore: true,
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
    isCore: true,
    placeholder: "Masalan: 500 000",
    helpText: "so'm",
  },
];

/** Backward compat export — always reads from persistent store */
export const COMMON_QUESTIONS = DEFAULT_COMMON_QUESTIONS;

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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
        ],
      },
      {
        id: "beauty_reason",
        label: "Xizmat sababi?",
        type: "single-select",
        options: [
          { label: "Kundalik", value: "kundalik" },
          { label: "To'y marosimlari", value: "toy" },
          { label: "Boshqa tadbirlar", value: "boshqa_tadbir" },
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
          { label: "Boshqa", value: "boshqa", type: "other" as const },
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
const COMMON_LS_KEY = "hormang_common_questions_v1";

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

export function getCommonQuestions(): Question[] {
  try {
    const stored = localStorage.getItem(COMMON_LS_KEY);
    if (stored) return JSON.parse(stored) as Question[];
  } catch (_) { /* ignore */ }
  return DEFAULT_COMMON_QUESTIONS;
}

export function saveCommonQuestions(qs: Question[]): void {
  localStorage.setItem(COMMON_LS_KEY, JSON.stringify(qs));
}

export function resetCommonQuestions(): void {
  localStorage.removeItem(COMMON_LS_KEY);
}

/** Full list: category-specific questions + common ones */
export function getAllQuestionsForCategory(categoryId: string): Question[] {
  const cat = getCategoryById(categoryId);
  if (!cat) return getCommonQuestions();
  return [...cat.questions, ...getCommonQuestions()];
}

export function resetCategories(): void {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(COMMON_LS_KEY);
}
