import 'server-only';

/** Average kph by transport mode. Tuned to typical Uzbekistan/CIS routes. */
const AVG_KPH: Record<string, number> = {
  road: 55,
  rail: 45,
  air: 700,
  sea: 30,
};

/** Fixed handling overhead (customs, loading, rest stops) in hours per mode. */
const OVERHEAD_HOURS: Record<string, number> = {
  road: 8,
  rail: 24,
  air: 6,
  sea: 72,
};

export function resolveMode(mode?: string | null): string {
  const key = (mode || 'road').toLowerCase();
  return AVG_KPH[key] ? key : 'road';
}

/**
 * Compute ETA given an origin timestamp, route distance, and transport mode.
 * Returns null if distance/mode are missing.
 */
export function computeEta(args: {
  startAt: Date;
  distanceKm: number | null | undefined;
  mode: string | null | undefined;
}): Date | null {
  const { startAt, distanceKm } = args;
  const mode = resolveMode(args.mode);
  if (!distanceKm || distanceKm <= 0) return null;
  const transitHours = distanceKm / AVG_KPH[mode] + OVERHEAD_HOURS[mode];
  return new Date(startAt.getTime() + transitHours * 60 * 60 * 1000);
}

/** Haversine fallback when a route distance hasn't been persisted. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatEta(eta: Date | null, locale: 'uz' | 'ru' | 'en' = 'uz'): string {
  if (!eta) return '—';
  const tz = locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'uz-UZ';
  return eta.toLocaleString(tz, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function etaStatus(eta: Date | null, delivered: boolean): 'delivered' | 'onTime' | 'due' | 'overdue' | 'unknown' {
  if (delivered) return 'delivered';
  if (!eta) return 'unknown';
  const now = Date.now();
  const diffHours = (eta.getTime() - now) / 3_600_000;
  if (diffHours < 0) return 'overdue';
  if (diffHours < 24) return 'due';
  return 'onTime';
}
