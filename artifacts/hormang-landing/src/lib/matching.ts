/**
 * matching.ts
 * Centralized matching logic for category + location filtering.
 * Used by provider-store, provider views, and admin panel.
 */

/* ─── Provider service area type ────────────────────────────────── */

export interface ProviderServiceArea {
  toshkent_city: { all: boolean; districts: string[] };
  toshkent_region: { all: boolean; cities: string[] };
}

export function emptyProviderServiceArea(): ProviderServiceArea {
  return {
    toshkent_city: { all: false, districts: [] },
    toshkent_region: { all: false, cities: [] },
  };
}

export function isServiceAreaEmpty(area: ProviderServiceArea): boolean {
  return (
    !area.toshkent_city.all &&
    area.toshkent_city.districts.length === 0 &&
    !area.toshkent_region.all &&
    area.toshkent_region.cities.length === 0
  );
}

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

/** Legacy flat-array match — kept for backward compat */
export function doesLocationMatch(
  requestRegion: string | undefined | null,
  providerServiceAreas: string[],
): boolean {
  if (!providerServiceAreas || providerServiceAreas.length === 0) return false;
  if (!requestRegion) return true;
  const normReq = requestRegion.toLowerCase().trim();
  return providerServiceAreas.some((area) => {
    const normArea = area.toLowerCase().trim();
    return normArea === normReq;
  });
}

/**
 * V2 location match — supports structured provider service area.
 *
 * Customer request:
 *   region = "Toshkent shahri" + district = "Yunusobod"
 *   region = "Angren"  (viloyat city, district is undefined)
 *
 * Falls back to legacy flat-array match when providerAreaV2 is absent.
 */
export function doesLocationMatchV2(
  requestRegion: string | undefined | null,
  requestDistrict: string | undefined | null,
  providerAreaV2: ProviderServiceArea | null | undefined,
  legacyAreas: string[] = [],
): boolean {
  // No location on request → visible to any provider with coverage
  if (!requestRegion) {
    if (providerAreaV2) return !isServiceAreaEmpty(providerAreaV2);
    return legacyAreas.length > 0;
  }

  if (providerAreaV2) {
    if (requestRegion === "Toshkent shahri") {
      // City match
      if (providerAreaV2.toshkent_city.all) return true;
      if (!requestDistrict) {
        // Request didn't specify a district → match if provider covers any city district
        return providerAreaV2.toshkent_city.districts.length > 0;
      }
      return providerAreaV2.toshkent_city.districts.includes(requestDistrict);
    } else {
      // Viloyat city match
      if (providerAreaV2.toshkent_region.all) return true;
      return providerAreaV2.toshkent_region.cities.includes(requestRegion);
    }
  }

  // Legacy fallback
  return doesLocationMatch(requestRegion, legacyAreas);
}

/* ─── Combined matching ─────────────────────────────────────────── */

/** Legacy combined match — unchanged for backward compat */
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

/** V2 combined match — uses structured service area with district awareness */
export function doesRequestMatchV2(
  requestCategory: string,
  requestRegion: string | undefined | null,
  requestDistrict: string | undefined | null,
  providerCategories: string[],
  providerAreaV2: ProviderServiceArea | null | undefined,
  legacyAreas: string[] = [],
): boolean {
  return (
    doesCategoryMatch(requestCategory, providerCategories) &&
    doesLocationMatchV2(requestRegion, requestDistrict, providerAreaV2, legacyAreas)
  );
}
