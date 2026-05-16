import type { Locale } from "@/lib/i18n";

export type { Locale };

/**
 * Multilingual content object — the canonical structure for all
 * dynamic (admin-created) translatable content.
 *
 * Uzbek is the primary language. Russian is strongly recommended.
 * English is optional.
 *
 * This structure is designed to map 1-to-1 with future DB columns:
 *   title_uz TEXT, title_ru TEXT, title_en TEXT
 * or JSONB:
 *   title JSONB  -- { "uz": "...", "ru": "...", "en": "..." }
 */
export type LocalizedText = {
  uz?: string;
  ru?: string;
  en?: string;
};

/**
 * Backward-compatible union — accepts either a plain string (legacy
 * data stored before this architecture was introduced) or a full
 * LocalizedText object (new data).
 *
 * `getLocalizedText()` handles both cases transparently.
 */
export type Translatable = string | LocalizedText;

/**
 * Per-language completeness status — used to render UZ ✅ / RU ⚠️ / EN ❌
 * indicators in the admin panel.
 */
export type TranslationStatus = "filled" | "missing" | "partial";

export interface TranslationCompleteness {
  uz: "filled" | "empty";
  ru: "filled" | "empty";
  en: "filled" | "empty";
  /** Percentage of supported languages that have content (0–100). */
  pct: number;
}
