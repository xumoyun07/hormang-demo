/**
 * local-profile.ts
 * Stores provider-specific profile data that isn't sent to the API:
 * photo, experience, portfolio images, region/district.
 * Key: hormang_local_profile_{userId}
 *
 * Also exports shared profile-completion logic used by both
 * provider/home.tsx and profile/settings.tsx.
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
  /** Legacy — kept for backward compat. Prefer portfolioItems. */
  portfolioImages?: string[];
  /** New: portfolio items with captions */
  portfolioItems?: PortfolioItem[];
  region?: string;
  district?: string;
}

/* ─── Storage helpers ───────────────────────────────────────────── */

function key(userId: string) {
  return `hormang_local_profile_${userId}`;
}

export function getLocalProfile(userId: string): LocalProfile {
  try {
    const raw = localStorage.getItem(key(userId));
    const p = raw ? (JSON.parse(raw) as LocalProfile) : {};
    /* Migrate legacy portfolioImages → portfolioItems */
    if (!p.portfolioItems && p.portfolioImages?.length) {
      p.portfolioItems = p.portfolioImages.map((url) => ({ url }));
    }
    return p;
  } catch {
    return {};
  }
}

export function saveLocalProfile(userId: string, data: LocalProfile): void {
  localStorage.setItem(key(userId), JSON.stringify(data));
  emitStoreChange();
}

/* ─── Completion logic ───────────────────────────────────────────── */

/**
 * Weighted completion checks (total = 100):
 *   photo        20 %
 *   name         10 %
 *   region       15 %
 *   services     20 %
 *   bio          15 %
 *   experience   10 %
 *   hours         5 %
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
      done: !!(providerProfile?.categories?.length),
      weight: 20,
    },
    {
      key: "bio",
      label: "Bio: kamida 50 ta belgi yozing",
      hint: "O'zingizni taniting — bu ishonchni oshiradi",
      done: !!(providerProfile?.bio && providerProfile.bio.length >= 50),
      weight: 15,
    },
    {
      key: "experience",
      label: "Tajriba yilini kiriting",
      hint: "Tajriba — asosiy tanlov mezonlaridan biri",
      done: !!(local.experience !== undefined && local.experience >= 0),
      weight: 10,
    },
    {
      key: "hours",
      label: "Ish vaqtini belgilang",
      hint: "Masalan: Du–Ju 09:00–20:00",
      done: !!(providerProfile?.workingHours && providerProfile.workingHours.trim().length > 3),
      weight: 5,
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
