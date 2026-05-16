import { uz, type Dict } from "./locales/uz";
import { ru } from "./locales/ru";

export type Locale = "uz" | "ru";

export const LOCALES: { code: Locale; name: string }[] = [
  { code: "uz", name: "O'zbekcha" },
  { code: "ru", name: "Русский" },
];

export const dictionaries: Record<Locale, Dict> = { uz, ru };

export function tFormat(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export type { Dict };
