/**
 * local-profile.ts
 * Stores provider-specific profile data that isn't sent to the API:
 * photo, experience, portfolio images, region/district.
 *
 * Storage key: user_${userId}_localProfile
 *
 * ISOLATION GUARANTEE: every read and write is strictly scoped to the
 * provided userId. If userId is empty or falsy the operation is a no-op
 * (or returns {}) and a warning is logged — this prevents the
 * "user__localProfile" corruption key that would appear during a race
 * between logout and a debounced auto-save.
 */

import type { SafeUser, ProviderProfile } from "./auth-client";
import { emitStoreChange } from "./store-events";

/* ─── Types ─────────────────────────────────────────────────────── */

export interface PortfolioItem {
  url: string;
  caption?: string;
}

export interface LocalProfile {
  photoUrl?: string;
  experience?: number;
  /** Legacy — kept for backward compat on read. Never write this; use portfolioItems. */
  portfolioImages?: string[];
  /** Portfolio items with captions */
  portfolioItems?: PortfolioItem[];
  region?: string;
  district?: string;
  serviceAreas?: string[];
  /** Provider bio — stored locally so PublicProfileModal can display it without an API call */
  bio?: string;
  /** Provider service categories — stored locally for public profile display */
  categories?: string[];
}

export function hasProviderAccess(
  user: SafeUser | null,
  providerProfile: ProviderProfile | null,
  local: LocalProfile = {},
): boolean {
  return !!(
    (user?.id && hasStoredProviderAccess(user.id)) ||
    user?.role === "provider" ||
    providerProfile ||
    (local.categories && local.categories.length > 0)
  );
}

/* ─── Storage helpers ───────────────────────────────────────────── */

function key(userId: string): string {
  return `user_${userId}_localProfile`;
}

function providerAccessKey(userId: string): string {
  return `user_${userId}_hasProviderAccess`;
}

export function markProviderAccess(userId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(providerAccessKey(userId), "1");
  } catch {
    console.warn("[Hormang] Provider marker saqlanmadi — localStorage xotirasi to'liq bo'lishi mumkin.");
  }
}

export function hasStoredProviderAccess(userId: string): boolean {
  return !!userId && localStorage.getItem(providerAccessKey(userId)) === "1";
}

export function getLocalProfile(userId: string): LocalProfile {
  if (!userId) {
    console.warn("[Hormang] getLocalProfile: userId bo'sh — {} qaytarildi.");
    return {};
  }
  try {
    const raw = localStorage.getItem(key(userId));
    const p = raw ? (JSON.parse(raw) as LocalProfile) : {};
    /* Migrate legacy portfolioImages → portfolioItems */
    if (!p.portfolioItems && p.portfolioImages?.length) {
      p.portfolioItems = p.portfolioImages.map((url) => ({ url }));
    }
    /* Migrate legacy region → serviceAreas for providers */
    if ((!p.serviceAreas || p.serviceAreas.length === 0) && p.region) {
      p.serviceAreas = [p.region];
    }
    return p;
  } catch {
    return {};
  }
}

export function saveLocalProfile(userId: string, data: LocalProfile): void {
  /* CRITICAL defensive guard: never write to an empty key. */
  if (!userId) {
    console.error("[Hormang] saveLocalProfile: userId bo'sh — saqlash bekor qilindi. Ma'lumotlar yo'qolmadi.");
    return;
  }

  /* Strip the legacy `portfolioImages` field before saving */
  const { portfolioImages: _dropped, ...clean } = data;

  console.log(
    `[Hormang] 💾 saveLocalProfile: user=${userId.slice(0, 8)} photo=${!!clean.photoUrl} portfolio=${clean.portfolioItems?.length ?? 0} cats=${clean.categories?.length ?? 0} bio=${!!clean.bio} region=${clean.region ?? "—"}`,
  );

  try {
    localStorage.setItem(key(userId), JSON.stringify(clean));
    if (clean.categories?.length) markProviderAccess(userId);
    emitStoreChange();
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn(
        `[Hormang] ⚠️ LocalStorage quota oshdi — portfolio tushirilmoqda (user=${userId.slice(0, 8)}).`,
      );
      /* First fallback: keep photo + text fields, drop only portfolio images */
      const withoutPortfolio: LocalProfile = { ...clean, portfolioItems: [] };
      try {
        localStorage.setItem(key(userId), JSON.stringify(withoutPortfolio));
        emitStoreChange();
        console.warn("[Hormang] ⚠️ Portfolio rasmlari saqlanmadi (xotira to'liq). Matnli maydonlar saqlandi.");
        return;
      } catch {
        /* Second fallback: keep only text fields */
      }
      const minimal: LocalProfile = {
        bio: clean.bio,
        region: clean.region,
        district: clean.district,
        serviceAreas: clean.serviceAreas,
        experience: clean.experience,
        categories: clean.categories,
        portfolioItems: [],
      };
      try {
        localStorage.setItem(key(userId), JSON.stringify(minimal));
        emitStoreChange();
        console.warn("[Hormang] ⚠️ Faqat matnli maydonlar saqlandi (rasm ham sig'madi).");
      } catch (fallbackError) {
        console.error("[Hormang] ❌ Profil saqlanmadi (minimal ham sig'madi):", fallbackError);
      }
    } else {
      throw error;
    }
  }
}

/* ─── Completion logic ───────────────────────────────────────────── */

/**
 * Weighted completion checks (total = 100):
 *   photo        20 %
 *   name         10 %
 *   region       15 %
 *   services     20 %
 *   bio          20 %
 *   experience   10 %
 *   portfolio     5 %
 */
export interface CompletionCheck {
  key: string;
  label: string;
  done: boolean;
  weight: number;
  hint?: string;
}

export function getCompletionChecks(
  user: SafeUser | null,
  providerProfile: ProviderProfile | null,
  local: LocalProfile,
): CompletionCheck[] {
  const portfolioCount = (local.portfolioItems ?? []).length
    || (local.portfolioImages ?? []).length;
  const categories = (providerProfile?.categories?.length ? providerProfile.categories : local.categories) ?? [];
  const bio = providerProfile?.bio?.trim() || local.bio?.trim() || "";

  return [
    {
      key: "photo",
      label: "Profil surati yuklang",
      hint: "Surat bilan provayderlar 4x ko'proq buyurtma oladi",
      done: !!local.photoUrl,
      weight: 20,
    },
    {
      key: "name",
      label: "To'liq ismingizni kiriting",
      hint: "Ism va familiya kamida 2 ta harf bo'lishi kerak",
      done: !!(
        user?.firstName && user.firstName.length > 1 &&
        user?.lastName  && user.lastName.length  > 1
      ),
      weight: 10,
    },
    {
      key: "region",
      label: "Hudud / tumani tanlang",
      hint: "Yaqin atrofdagi buyurtmalar ko'rsatiladi",
      done: !!local.region,
      weight: 15,
    },
    {
      key: "services",
      label: "Kamida 1 ta xizmat turini tanlang",
      hint: "Tegishli buyurtmalar siz uchun ko'rsatiladi",
      done: categories.length > 0,
      weight: 20,
    },
    {
      key: "bio",
      label: "Bio: kamida 50 ta belgi yozing",
      hint: "O'zingizni taniting — bu ishonchni oshiradi",
      done: bio.length >= 50,
      weight: 20,
    },
    {
      key: "experience",
      label: "Tajriba yilini kiriting",
      hint: "Tajriba — asosiy tanlov mezonlaridan biri",
      done: !!(local.experience !== undefined && local.experience >= 0),
      weight: 10,
    },
    {
      key: "portfolio",
      label: "Kamida 2 ta portfolio rasm qo'shing",
      hint: "Rasmlar buyurtma olish ehtimolini 3x oshiradi",
      done: portfolioCount >= 2,
      weight: 5,
    },
  ];
}

/** Returns weighted completion 0–100 (sum of done check weights). */
export function getCompletionPct(checks: CompletionCheck[]): number {
  return checks.filter((c) => c.done).reduce((s, c) => s + c.weight, 0);
}
