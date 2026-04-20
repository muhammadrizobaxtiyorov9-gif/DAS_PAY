export type LatLng = [number, number];

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function cumulativeDistances(path: LatLng[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    out.push(out[i - 1] + haversine(path[i - 1], path[i]));
  }
  return out;
}

export function totalDistance(path: LatLng[]): number {
  const cum = cumulativeDistances(path);
  return cum[cum.length - 1] ?? 0;
}

export function pointAtProgress(path: LatLng[], progress: number): { point: LatLng; bearing: number } {
  if (path.length === 0) return { point: [0, 0], bearing: 0 };
  if (path.length === 1) return { point: path[0], bearing: 0 };

  const cum = cumulativeDistances(path);
  const total = cum[cum.length - 1];
  if (total === 0) return { point: path[0], bearing: 0 };

  const target = Math.max(0, Math.min(1, progress)) * total;

  for (let i = 1; i < path.length; i++) {
    if (cum[i] >= target) {
      const segStart = cum[i - 1];
      const segEnd = cum[i];
      const t = segEnd === segStart ? 0 : (target - segStart) / (segEnd - segStart);
      const a = path[i - 1];
      const b = path[i];
      return {
        point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        bearing: bearing(a, b),
      };
    }
  }

  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  return { point: last, bearing: bearing(prev, last) };
}

export function bearing(from: LatLng, to: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLng = toRad(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export interface RouteSegment {
  id: string;
  lat: number;
  lng: number;
  mode: 'start' | 'truck' | 'train';
  osrmGeometry?: LatLng[];
  label?: string;
}

export function segmentsToPath(segments: RouteSegment[]): LatLng[] {
  const path: LatLng[] = [];
  segments.forEach((seg, i) => {
    if (i === 0) {
      path.push([seg.lat, seg.lng]);
      return;
    }
    if (seg.osrmGeometry && seg.osrmGeometry.length > 0) {
      for (let j = 1; j < seg.osrmGeometry.length; j++) {
        path.push(seg.osrmGeometry[j]);
      }
    } else {
      path.push([seg.lat, seg.lng]);
    }
  });
  return path;
}

export function computeProgress(
  segments: RouteSegment[],
  status: string,
  currentLat?: number | null,
  currentLng?: number | null
): number {
  if (status === 'delivered') return 1;
  if (status === 'pending' || status === 'new') return 0;

  const path = segmentsToPath(segments);
  if (path.length < 2) return 0;

  if (currentLat != null && currentLng != null) {
    const cum = cumulativeDistances(path);
    const total = cum[cum.length - 1];
    if (total === 0) return 0.5;

    let bestProgress = 0;
    let bestDist = Infinity;
    for (let i = 0; i < path.length; i++) {
      const d = haversine(path[i], [currentLat, currentLng]);
      if (d < bestDist) {
        bestDist = d;
        bestProgress = cum[i] / total;
      }
    }
    return bestProgress;
  }

  if (status === 'customs') return 0.7;
  if (status === 'in_transit' || status === 'inTransit') return 0.5;
  if (status === 'processing') return 0.2;
  return 0.5;
}

async function fetchOsrmRoute(start: LatLng, end: LatLng): Promise<LatLng[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords)) return null;
    return coords.map((c: [number, number]) => [c[1], c[0]] as LatLng);
  } catch {
    return null;
  }
}

/**
 * Fetch real railway tracks from OpenStreetMap via Overpass API.
 * Queries a corridor between two points for railway=rail ways.
 */
async function fetchRailwayTracks(start: LatLng, end: LatLng): Promise<LatLng[] | null> {
  try {
    const minLat = Math.min(start[0], end[0]) - 0.5;
    const maxLat = Math.max(start[0], end[0]) + 0.5;
    const minLng = Math.min(start[1], end[1]) - 0.5;
    const maxLng = Math.max(start[1], end[1]) + 0.5;

    const query = `[out:json][timeout:15];
way["railway"="rail"](${minLat},${minLng},${maxLat},${maxLng});
(._;>;);
out body;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!res.ok) return null;
    const data = await res.json();

    // Build node coordinate map
    const nodes = new Map<number, LatLng>();
    for (const el of data.elements) {
      if (el.type === 'node' && el.lat != null && el.lon != null) {
        nodes.set(el.id, [el.lat, el.lon]);
      }
    }

    // Extract all railway way segments
    const ways: LatLng[][] = [];
    for (const el of data.elements) {
      if (el.type === 'way' && Array.isArray(el.nodes)) {
        const wayCoords: LatLng[] = [];
        for (const nodeId of el.nodes) {
          const coord = nodes.get(nodeId);
          if (coord) wayCoords.push(coord);
        }
        if (wayCoords.length >= 2) ways.push(wayCoords);
      }
    }

    if (ways.length === 0) return null;

    // Build a connected path from start to end using nearest-neighbor greedy approach
    const path = buildConnectedRailPath(ways, start, end);
    return path.length >= 2 ? path : null;
  } catch {
    return null;
  }
}

/** Find the nearest point in a set of coordinates */
function nearestPoint(target: LatLng, points: LatLng[]): { idx: number; dist: number } {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = haversine(target, points[i]);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return { idx: bestIdx, dist: bestDist };
}

/**
 * Greedy algorithm to build a connected rail path from start to end.
 * Selects ways that progressively get closer to the destination.
 */
function buildConnectedRailPath(ways: LatLng[][], start: LatLng, end: LatLng): LatLng[] {
  // Flatten all way endpoints for searching
  const result: LatLng[] = [start];
  const usedWays = new Set<number>();
  let current = start;
  const maxSteps = ways.length * 2;
  let steps = 0;

  while (steps++ < maxSteps) {
    const distToEnd = haversine(current, end);
    if (distToEnd < 2) break; // Close enough (2km)

    // Find nearest unused way endpoint
    let bestWayIdx = -1;
    let bestEndDist = Infinity;
    let bestWayReversed = false;

    for (let i = 0; i < ways.length; i++) {
      if (usedWays.has(i)) continue;
      const way = ways[i];
      const startDist = haversine(current, way[0]);
      const endDist = haversine(current, way[way.length - 1]);

      // The way's closest endpoint to current position
      const closerStart = startDist < endDist;
      const connectDist = closerStart ? startDist : endDist;

      if (connectDist > 50) continue; // Too far to connect (50km)

      // Score: prefer ways that bring us closer to the destination
      const wayEnd = closerStart ? way[way.length - 1] : way[0];
      const progressDist = haversine(wayEnd, end);

      if (progressDist < bestEndDist) {
        bestEndDist = progressDist;
        bestWayIdx = i;
        bestWayReversed = !closerStart;
      }
    }

    if (bestWayIdx === -1) break; // No connectable way found

    usedWays.add(bestWayIdx);
    const selectedWay = bestWayReversed ? [...ways[bestWayIdx]].reverse() : ways[bestWayIdx];
    result.push(...selectedWay);
    current = selectedWay[selectedWay.length - 1];
  }

  result.push(end);
  return result;
}

/**
 * Generate a smooth geodesic arc between two points.
 * Used as fallback when actual railway data is unavailable.
 */
function generateGeodesicArc(start: LatLng, end: LatLng, numPoints: number = 80): LatLng[] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(start[0]);
  const lng1 = toRad(start[1]);
  const lat2 = toRad(end[0]);
  const lng2 = toRad(end[1]);

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
    ),
  );

  if (d < 1e-10) return [start, end];

  const points: LatLng[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    points.push([toDeg(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2))), toDeg(Math.atan2(y, x))]);
  }
  return points;
}

export async function resolveRouteGeometry(
  start: LatLng,
  end: LatLng,
  mode: 'start' | 'truck' | 'train'
): Promise<LatLng[]> {
  if (mode === 'start') return [start, end];

  if (mode === 'truck') {
    // Road routing via OSRM
    const route = await fetchOsrmRoute(start, end);
    if (route && route.length > 0) return route;
    return [start, end];
  }

  // Railway routing: try Overpass API first, then geodesic arc fallback
  const railRoute = await fetchRailwayTracks(start, end);
  if (railRoute && railRoute.length > 2) return railRoute;

  // Fallback: smooth geodesic arc (great circle)
  return generateGeodesicArc(start, end);
}

const SPEED_KMH: Record<string, number> = {
  truck: 55,
  train: 45,
  start: 55,
};

export function computeEta(
  segments: RouteSegment[],
  status: string,
  currentLat?: number | null,
  currentLng?: number | null,
  from: Date = new Date(),
): { etaDate: Date | null; remainingKm: number; progress: number } {
  if (status === 'delivered') return { etaDate: from, remainingKm: 0, progress: 1 };

  const path = segmentsToPath(segments);
  if (path.length < 2) return { etaDate: null, remainingKm: 0, progress: 0 };

  const progress = computeProgress(segments, status, currentLat, currentLng);
  const total = totalDistance(path);
  const remainingKm = Math.max(0, total * (1 - progress));

  let hours = 0;
  let covered = progress * total;
  for (let i = 1; i < segments.length && covered < total; i++) {
    const seg = segments[i];
    const segmentPath: LatLng[] = seg.osrmGeometry && seg.osrmGeometry.length > 0
      ? seg.osrmGeometry
      : [[segments[i - 1].lat, segments[i - 1].lng], [seg.lat, seg.lng]];
    const segLen = totalDistance(segmentPath);
    const segStart = covered;
    const segEnd = segStart + segLen;
    if (segEnd <= progress * total) {
      covered = segEnd;
      continue;
    }
    const remainInThisSegment = segEnd - Math.max(segStart, progress * total);
    const speed = SPEED_KMH[seg.mode] ?? 50;
    hours += remainInThisSegment / speed;
    covered = segEnd;
  }

  if (hours === 0 && remainingKm > 0) {
    hours = remainingKm / 50;
  }

  const etaDate = new Date(from.getTime() + hours * 3600 * 1000);
  return { etaDate, remainingKm, progress };
}

export function formatEtaDate(date: Date, locale: 'uz' | 'ru' | 'en' = 'uz'): string {
  const localeMap = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
  return date.toLocaleString(localeMap[locale], {
    timeZone: 'Asia/Tashkent',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatEtaRelative(date: Date, locale: 'uz' | 'ru' | 'en' = 'uz', from: Date = new Date()): string {
  const diffMs = date.getTime() - from.getTime();
  const hours = Math.round(diffMs / 3600 / 1000);
  if (hours < 1) {
    return locale === 'ru' ? '< 1 ч.' : locale === 'en' ? '< 1 h' : "1 soatdan kam";
  }
  if (hours < 48) {
    return locale === 'ru' ? `~${hours} ч.` : locale === 'en' ? `~${hours} h` : `~${hours} soat`;
  }
  const days = Math.round(hours / 24);
  return locale === 'ru' ? `~${days} дн.` : locale === 'en' ? `~${days} d` : `~${days} kun`;
}
