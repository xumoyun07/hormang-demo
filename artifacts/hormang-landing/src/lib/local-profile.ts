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

export interface LocalProfile {
  photoUrl?: string;
  experience?: number;
  portfolioImages?: string[];
  region?: string;
  district?: string;
}

function key(userId: string) {
  return `hormang_local_profile_${userId}`;
}

export function getLocalProfile(userId: string): LocalProfile {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as LocalProfile) : {};
  } catch {
    return {};
  }
}

export function saveLocalProfile(userId: string, data: LocalProfile): void {
  localStorage.setItem(key(userId), JSON.stringify(data));
}

/* ─── Completion logic ───────────────────────────────────────────── */

export interface CompletionCheck {
  key: string;
  label: string;
  done: boolean;
  settingsHash?: string;
}

export function getCompletionChecks(
  user: SafeUser | null,
  providerProfile: ProviderProfile | null,
  local: LocalProfile,
): CompletionCheck[] {
  return [
    {
      key: "photo",
      label: "Profil surati yuklang",
      done: !!local.photoUrl,
    },
    {
      key: "name",
      label: "Ism va familiyangizni kiriting",
      done: !!(user?.firstName && user?.lastName && user.firstName.length > 1 && user.lastName.length > 1),
    },
    {
      key: "phone",
      label: "Telefon raqamini bog'lang",
      done: !!user?.phone,
    },
    {
      key: "region",
      label: "Hudud / shahringizni tanlang",
      done: !!local.region,
    },
    {
      key: "services",
      label: "Kamida bitta xizmat turini tanlang",
      done: !!(providerProfile?.categories?.length),
    },
    {
      key: "bio",
      label: "O'zingiz haqida qisqacha yozing",
      done: !!(providerProfile?.bio && providerProfile.bio.length > 10),
    },
  ];
}

export function getCompletionPct(checks: CompletionCheck[]): number {
  const done = checks.filter((c) => c.done).length;
  return Math.round((done / checks.length) * 100);
}
