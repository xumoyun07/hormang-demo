/**
 * matching.ts
 * Centralized matching logic for category + location filtering.
 * Used by provider-store, provider views, and admin panel.
 */

/* ─── Category matching ─────────────────────────────────────────── */

function normalizeCategory(name: string): string {
  return name.toLowerCase().replace(/[\s/]+/g, "").trim();
}

export function doesCategoryMatch(
  requestCategory: string,
  providerCategories: string[],
): boolean {
  if (providerCategories.length === 0) return true;
  const norm = normalizeCategory(requestCategory);
  return providerCategories.some((c) => normalizeCategory(c) === norm);
}

/* ─── Location matching ─────────────────────────────────────────── */

export function doesLocationMatch(
  requestRegion: string | undefined | null,
  providerServiceAreas: string[],
): boolean {
  if (!providerServiceAreas || providerServiceAreas.length === 0) return true;
  if (!requestRegion) return true;

  const normReq = requestRegion.toLowerCase().trim();

  return providerServiceAreas.some((area) => {
    const normArea = area.toLowerCase().trim();
    return normArea === normReq;
  });
}

/* ─── Combined matching ─────────────────────────────────────────── */

export function doesRequestMatch(
  requestCategory: string,
  requestRegion: string | undefined | null,
  providerCategories: string[],
  providerServiceAreas: string[],
): boolean {
  return (
    doesCategoryMatch(requestCategory, providerCategories) &&
    doesLocationMatch(requestRegion, providerServiceAreas)
  );
}
