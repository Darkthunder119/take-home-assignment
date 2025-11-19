export function parseISOToDate(iso?: string | null): Date | null {
  if (!iso) return null;
  try {
    return new Date(iso);
  } catch (e) {
    return null;
  }
}

export function formatUTCDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
  const d = parseISOToDate(iso);
  if (!d) return "";
  const defaults: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" };
  return d.toLocaleDateString(undefined, { ...defaults, ...opts });
}

export function formatUTCDateShort(iso?: string | null) {
  const d = parseISOToDate(iso);
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatUTCTime(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
  const d = parseISOToDate(iso);
  if (!d) return "";
  const defaults: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" };
  return d.toLocaleTimeString(undefined, { ...defaults, ...opts });
}

export function formatUTCDateTimeShort(iso?: string | null) {
  const d = parseISOToDate(iso);
  if (!d) return "";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}
