const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

/**
 * Returns "11-Aprel" when the year matches the current year,
 * or "11-Aprel, 2026" when the year differs.
 * Pass `alwaysShowYear: true` to always include the year.
 */
export function formatDate(iso: string, opts: { alwaysShowYear?: boolean } = {}): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  if (opts.alwaysShowYear || year !== new Date().getFullYear()) {
    return `${day}-${month}, ${year}`;
  }
  return `${day}-${month}`;
}

/**
 * Returns "Aprel, 2026" — month + year only (for join dates, billing periods, etc.)
 */
export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  return `${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/**
 * Returns "11-Aprel · 14:30" or "11-Aprel, 2026 · 14:30" for admin timestamps.
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("uz-Latn-UZ", { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(iso)} · ${time}`;
}
