import { uz, type Dict } from "./locales/uz";
import { ru } from "./locales/ru";
import { en } from "./locales/en";

export type Locale = "uz" | "ru" | "en";

export const LOCALES: { code: Locale; name: string }[] = [
  { code: "uz", name: "O'zbekcha" },
  { code: "ru", name: "Русский" },
  { code: "en", name: "English" },
];

export const dictionaries: Record<Locale, Dict> = { uz, ru, en };

export function tFormat(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export type { Dict };
