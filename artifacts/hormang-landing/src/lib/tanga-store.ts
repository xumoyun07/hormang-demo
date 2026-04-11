import { emitStoreChange } from "./store-events";

export const TANGA_BALANCE_PREFIX = "provider_tokens";
export const PRICING_TIERS_KEY   = "hormang_pricing_tiers";

export interface PricingTier {
  id: string;
  name: string;
  credits: number;
  price: number;
  salePrice?: number;
  bonusTokens?: number;
  validUntil?: string;
  desc: string;
  color: string;
  active: boolean;
}

export function getTangaBalance(userId: string): number {
  try {
    const raw = localStorage.getItem(`${TANGA_BALANCE_PREFIX}_${userId}`);
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

export function addTangaBalance(userId: string, amount: number): number {
  const next = getTangaBalance(userId) + amount;
  localStorage.setItem(`${TANGA_BALANCE_PREFIX}_${userId}`, String(next));
  emitStoreChange();
  return next;
}

export function getAllTiers(): PricingTier[] {
  try {
    const raw = localStorage.getItem(PRICING_TIERS_KEY);
    return raw ? (JSON.parse(raw) as PricingTier[]) : [];
  } catch { return []; }
}

export function getActiveTiers(): PricingTier[] {
  return getAllTiers().filter((t) => t.active);
}

export function saveAllTiers(tiers: PricingTier[]): void {
  localStorage.setItem(PRICING_TIERS_KEY, JSON.stringify(tiers));
  emitStoreChange();
}
