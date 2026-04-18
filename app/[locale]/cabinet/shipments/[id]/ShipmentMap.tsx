'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize, Minimize, Layers, Truck, Train } from 'lucide-react';
import {
  computeProgress,
  pointAtProgress,
  segmentsToPath,
  totalDistance,
  type RouteSegment,
} from '@/lib/map-utils';
import {
  originIcon,
  destinationIcon,
  waypointIcon,
  deliveredIcon,
  vehicleIcon,
} from '@/components/map/icons';

type Shipment = {
  status: string;
  origin?: string | null;
  destination?: string | null;
  routeSegments?: unknown;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  currentLat?: number | null;
  currentLng?: number | null;
};

type TileStyle = 'streets' | 'satellite' | 'light';

const TILE_PROVIDERS: Record<TileStyle, { url: string; attribution: string; subdomains?: string[] }> = {
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

function parseSegments(raw: unknown): RouteSegment[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as RouteSegment[]) : [];
  } catch {
    return [];
  }
}

function buildFallback(shipment: Shipment): RouteSegment[] {
  const out: RouteSegment[] = [];
  if (shipment.originLat != null && shipment.originLng != null) {
    out.push({ id: 'origin', lat: shipment.originLat, lng: shipment.originLng, mode: 'start' });
  }
  if (shipment.currentLat != null && shipment.currentLng != null) {
    out.push({ id: 'current', lat: shipment.currentLat, lng: shipment.currentLng, mode: 'truck' });
  }
  if (shipment.destinationLat != null && shipment.destinationLng != null) {
    out.push({ id: 'dest', lat: shipment.destinationLat, lng: shipment.destinationLng, mode: 'truck' });
  }
  return out;
}

function FitBounds({ segments }: { segments: RouteSegment[] }) {
  const map = useMap();
  useEffect(() => {
    if (segments.length === 0) return;
    const path = segmentsToPath(segments);
    if (path.length === 0) return;
    if (path.length === 1) {
      map.setView(path[0], 13);
      return;
    }
    const bounds = L.latLngBounds(path.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
  }, [map, segments]);
  return null;
}

interface ShipmentMapProps {
  shipment: Shipment;
}

export default function ShipmentMap({ shipment }: ShipmentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileStyle, setTileStyle] = useState<TileStyle>('streets');
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  /** Displayed progress — smoothly tweened toward the new baseProgress when the shipment status/location changes. No idle jitter. */
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);

  const segments = useMemo(() => {
    const parsed = parseSegments(shipment.routeSegments);
    return parsed.length > 0 ? parsed : buildFallback(shipment);
  }, [shipment]);

  const fullPath = useMemo(() => segmentsToPath(segments), [segments]);

  const baseProgress = useMemo(
    () =>
      computeProgress(
        segments,
        shipment.status,
        shipment.currentLat ?? undefined,
        shipment.currentLng ?? undefined
      ),
    [segments, shipment.status, shipment.currentLat, shipment.currentLng]
  );

  const isDelivered = shipment.status === 'delivered';
  const kmTotal = useMemo(() => totalDistance(fullPath), [fullPath]);

  const vehicleMode: 'truck' | 'train' = useMemo(() => {
    if (segments.length <= 1) return 'truck';
    const active = segments[segments.length - 1];
    return active.mode === 'train' ? 'train' : 'truck';
  }, [segments]);

  useEffect(() => {
    if (displayProgress === null) {
      setDisplayProgress(baseProgress);
      return;
    }
    if (Math.abs(displayProgress - baseProgress) < 0.0005) {
      if (displayProgress !== baseProgress) setDisplayProgress(baseProgress);
      return;
    }
    const from = displayProgress;
    const to = baseProgress;
    const duration = 1500;
    const startedAt = performance.now();
    let raf = 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = easeOutCubic(t);
      setDisplayProgress(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [baseProgress, displayProgress]);

  const animatedProgress = useMemo(() => {
    if (isDelivered) return 1;
    return displayProgress ?? baseProgress;
  }, [isDelivered, displayProgress, baseProgress]);

  const vehiclePosition = useMemo(
    () => pointAtProgress(fullPath, animatedProgress),
    [fullPath, animatedProgress]
  );

  const traveledPath = useMemo(() => {
    if (fullPath.length === 0) return [];
    const cutIndex = Math.max(
      1,
      Math.min(fullPath.length, Math.floor(fullPath.length * animatedProgress) + 1)
    );
    return [...fullPath.slice(0, cutIndex), vehiclePosition.point];
  }, [fullPath, animatedProgress, vehiclePosition.point]);

  const remainingPath = useMemo(() => {
    if (fullPath.length === 0) return [];
    const cutIndex = Math.max(
      0,
      Math.min(fullPath.length - 1, Math.floor(fullPath.length * animatedProgress))
    );
    return [vehiclePosition.point, ...fullPath.slice(cutIndex + 1)];
  }, [fullPath, animatedProgress, vehiclePosition.point]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const tile = TILE_PROVIDERS[tileStyle];
  const progressPercent = Math.round(animatedProgress * 100);
  const kmTraveled = kmTotal * animatedProgress;
  const kmRemaining = kmTotal - kmTraveled;
  const originSegment = segments[0];
  const destinationSegment = segments[segments.length - 1];
  const waypoints = segments.slice(1, -1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isFullscreen ? 'h-screen' : 'h-full min-h-[420px]'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {isDelivered ? 'Yetkazib berildi' : "Marshrut bo'ylab harakatda"}
              </span>
              <span className="rounded-full bg-[#042C53] px-2.5 py-0.5 text-[11px] font-bold text-white">
                {progressPercent}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isDelivered
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-[#185FA5] via-[#378ADD] to-[#042C53]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{shipment.origin ?? 'A'}</span>
              <span className="font-semibold text-slate-700">
                {kmTraveled.toFixed(0)} / {kmTotal.toFixed(0)} km
              </span>
              <span>{shipment.destination ?? 'B'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                isDelivered
                  ? 'bg-emerald-50 text-emerald-700'
                  : vehicleMode === 'train'
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
              title="Transport turi"
            >
              {vehicleMode === 'train' ? <Train className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
              {vehicleMode === 'train' ? "Temir yo'l" : 'Avto'}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-28 z-[500] flex flex-col gap-2 sm:top-24 sm:right-4">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg bg-white p-2 text-slate-700 shadow-md ring-1 ring-black/5 transition-colors hover:bg-slate-50"
          title={isFullscreen ? 'Kichraytirish' : "To'liq ekran"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayersOpen((v) => !v)}
            className="rounded-lg bg-white p-2 text-slate-700 shadow-md ring-1 ring-black/5 transition-colors hover:bg-slate-50"
            title="Qatlamlar"
          >
            <Layers className="h-5 w-5" />
          </button>
          {isLayersOpen && (
            <div className="absolute right-full top-0 mr-2 flex gap-1 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5">
              {(['streets', 'light', 'satellite'] as TileStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => {
                    setTileStyle(style);
                    setIsLayersOpen(false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tileStyle === style
                      ? 'bg-[#042C53] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {style === 'streets' ? "Ko'cha" : style === 'light' ? 'Oddiy' : 'Sputnik'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {segments.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-[400] flex justify-center">
          <span className="rounded-full border bg-red-50 px-4 py-2 text-sm font-bold text-red-600 shadow">
            Marshrut koordinatalari kiritilmagan.
          </span>
        </div>
      )}

      <MapContainer
        center={
          originSegment
            ? [originSegment.lat, originSegment.lng]
            : [41.3022, 69.3285]
        }
        zoom={5}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url={tile.url} attribution={tile.attribution} subdomains={tile.subdomains ?? []} />
        <ZoomControl position="bottomright" />
        <FitBounds segments={segments} />

        {fullPath.length > 1 && (
          <>
            <Polyline
              positions={remainingPath}
              pathOptions={{
                color: vehicleMode === 'train' ? '#c4b5fd' : '#cbd5e1',
                weight: 6,
                opacity: 0.9,
                dashArray: vehicleMode === 'train' ? '2 10' : '12 10',
                lineCap: 'round',
                lineJoin: 'round',
                className: isDelivered ? undefined : 'daspay-route-flow',
              }}
            />
            <Polyline
              positions={traveledPath}
              pathOptions={{
                color: vehicleMode === 'train' ? '#7c3aed' : '#185FA5',
                weight: 6,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {originSegment && (
          <Marker position={[originSegment.lat, originSegment.lng]} icon={originIcon}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-[#042C53]">Boshlang'ich nuqta</div>
                {shipment.origin && <div className="text-xs text-slate-600">{shipment.origin}</div>}
              </div>
            </Popup>
          </Marker>
        )}

        {waypoints.map((seg, i) => (
          <Marker key={seg.id ?? `wp-${i}`} position={[seg.lat, seg.lng]} icon={waypointIcon}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">Tranzit nuqtasi #{i + 1}</div>
                <div className="text-slate-500">
                  {seg.mode === 'train' ? 'Temir yo‘l' : 'Avtomobil'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {destinationSegment && destinationSegment !== originSegment && (
          <Marker
            position={[destinationSegment.lat, destinationSegment.lng]}
            icon={isDelivered ? deliveredIcon : destinationIcon}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-[#042C53]">
                  {isDelivered ? 'Yetkazildi' : 'Manzil'}
                </div>
                {shipment.destination && (
                  <div className="text-xs text-slate-600">{shipment.destination}</div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {!isDelivered && fullPath.length > 1 && (
          <Marker
            position={vehiclePosition.point}
            icon={vehicleIcon(vehicleMode, vehiclePosition.bearing)}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-[#042C53]">
                  {vehicleMode === 'train' ? 'Temir yo‘l' : 'Yuk mashinasi'}
                </div>
                <div className="text-xs text-slate-600">
                  {progressPercent}% • {kmRemaining.toFixed(0)} km qoldi
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {!isDelivered && fullPath.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] hidden sm:flex">
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow ring-1 ring-black/5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Jonli kuzatuv
          </span>
        </div>
      )}
    </div>
  );
}
