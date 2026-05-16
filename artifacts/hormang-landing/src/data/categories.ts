/**
 * data/categories.ts
 * Canonical multilingual display names for all built-in service categories.
 *
 * IDs must match CategoryConfig.id in lib/questionnaire-store.ts.
 *
 * Structure mirrors a future DB table:
 *   categories(id, name_uz, name_ru, name_en, emoji)
 *
 * When a CategoryConfig has a nameLocalized field it takes precedence over
 * this list (allowing admin overrides). Use getCategoryDisplayName() which
 * applies that logic automatically.
 */
import type { LocalizedText } from "@/lib/localization";
import { getLocalizedText, type Locale } from "@/lib/localization";
import type { CategoryConfig } from "@/lib/questionnaire-store";

export interface CategoryMeta {
  id: string;
  name: LocalizedText;
  emoji: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: "tamirlash",
    name: { uz: "Ta'mirlash", ru: "Ремонт", en: "Repair" },
    emoji: "🔧",
  },
  {
    id: "tozalash",
    name: { uz: "Tozalash", ru: "Уборка", en: "Cleaning" },
    emoji: "🧹",
  },
  {
    id: "avto",
    name: { uz: "Avto xizmat", ru: "Авто услуги", en: "Auto Service" },
    emoji: "🚗",
  },
  {
    id: "kochirish",
    name: {
      uz: "Ko'chirish / yuk yetkazish",
      ru: "Переезд / доставка",
      en: "Moving / Delivery",
    },
    emoji: "🚚",
  },
  {
    id: "repetitor",
    name: { uz: "Repetitorlar", ru: "Репетиторы", en: "Tutors" },
    emoji: "📚",
  },
  {
    id: "tadbir",
    name: { uz: "Tadbir xizmatlari", ru: "Ивент услуги", en: "Event Services" },
    emoji: "🎉",
  },
  {
    id: "gozallik",
    name: { uz: "Go'zallik", ru: "Красота", en: "Beauty" },
    emoji: "💄",
  },
  {
    id: "enaga",
    name: { uz: "Enagalik", ru: "Няня", en: "Childcare" },
    emoji: "👶",
  },
  {
    id: "ustachilik",
    name: { uz: "Ustachilik", ru: "Строительство", en: "Construction" },
    emoji: "🏗️",
  },
];

/**
 * Returns the LocalizedText name for a built-in category.
 * Returns undefined for custom (admin-created) categories.
 */
export function getCategoryMeta(id: string): CategoryMeta | undefined {
  return CATEGORY_META.find((c) => c.id === id);
}

/**
 * Resolves the display name for a CategoryConfig in the given locale.
 * Priority: config.nameLocalized → CATEGORY_META → config.name (Uzbek string)
 */
export function getCategoryDisplayName(
  cat: CategoryConfig,
  lang: Locale,
): string {
  if (cat.nameLocalized) return getLocalizedText(cat.nameLocalized, lang);
  const meta = getCategoryMeta(cat.id);
  if (meta) return getLocalizedText(meta.name, lang);
  return cat.name;
}
