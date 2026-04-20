'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Train,
  Truck,
  MapPin,
  X,
  Undo2,
  Trash2,
  Layers,
  Search,
  Loader2,
  Ruler,
  Flag,
  Info,
} from 'lucide-react';
import {
  originIcon,
  waypointIcon,
  destinationIcon,
} from '@/components/map/icons';
import {
  resolveRouteGeometry,
  segmentsToPath,
  totalDistance,
  type LatLng,
} from '@/lib/map-utils';

export interface RouteSegment {
  id: string;
  lat: number;
  lng: number;
  mode: 'start' | 'truck' | 'train';
  osrmGeometry?: [number, number][];
  label?: string;
}

interface PickerProps {
  segments: RouteSegment[];
  setSegments: (val: RouteSegment[]) => void;
}

type LayerKey = 'voyager' | 'light' | 'satellite' | 'railway';

const TILE_LAYERS: Record<LayerKey, { url: string; attribution: string; subdomains?: string[] }> = {
  voyager: {
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
  railway: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO &copy; OpenRailwayMap',
    subdomains: ['a', 'b', 'c', 'd'],
  },
};

const OPENRAILWAYMAP_URL = 'https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function FitBounds({ points, trigger }: { points: LatLng[]; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map(([a, b]) => L.latLng(a, b)));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
  }, [trigger, map, points]);
  return null;
}

export default function LocationPickerMap({ segments, setSegments }: PickerProps) {
  const [activeMode, setActiveMode] = useState<'truck' | 'train'>('train');
  const [layer, setLayer] = useState<LayerKey>('voyager');
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: number; lon: number }>>([]);
  const [fitTick, setFitTick] = useState(0);
  const mapRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = useMemo(() => (
    segments.length > 0
      ? [segments[segments.length - 1].lat, segments[segments.length - 1].lng]
      : [41.2995, 69.2401]
  ), [segments]);

  const pathAsLatLng: LatLng[] = useMemo(() => segments.map((s) => [s.lat, s.lng] as LatLng), [segments]);

  const totalKm = useMemo(() => {
    const full = segmentsToPath(segments.map((s) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      mode: s.mode,
      osrmGeometry: s.osrmGeometry as LatLng[] | undefined,
    })));
    return totalDistance(full);
  }, [segments]);

  useEffect(() => {
    setFitTick((t) => t + 1);
  }, [segments.length]);

  const addPoint = useCallback(async (lat: number, lng: number) => {
    const modeToUse: 'start' | 'truck' | 'train' = segments.length === 0 ? 'start' : activeMode;
    const newSegment: RouteSegment = { id: uid(), lat, lng, mode: modeToUse };

    if (segments.length > 0 && (modeToUse === 'truck' || modeToUse === 'train')) {
      const prev = segments[segments.length - 1];
      setIsFetching(true);
      try {
        const geom = await resolveRouteGeometry([prev.lat, prev.lng], [lat, lng], modeToUse);
        newSegment.osrmGeometry = geom as [number, number][];
      } finally {
        setIsFetching(false);
      }
    }
    setSegments([...segments, newSegment]);
  }, [segments, setSegments, activeMode]);

  function MapEvents() {
    useMapEvents({
      async click(e) {
        await addPoint(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function removeSegment(id: string) {
    setSegments(segments.filter((s) => s.id !== id));
  }

  function undoLast() {
    if (segments.length === 0) return;
    setSegments(segments.slice(0, -1));
  }

  function clearAll() {
    setSegments([]);
  }

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'uz,ru,en' } },
      );
      const data = await res.json();
      setSearchResults(
        (Array.isArray(data) ? data : []).map((d: { display_name: string; lat: string; lon: string }) => ({
          display_name: d.display_name,
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
        })),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function selectSearchResult(r: { display_name: string; lat: number; lon: number }) {
    setSearchResults([]);
    setSearch(r.display_name);
    mapRef.current?.setView([r.lat, r.lon], 12, { animate: true });
    await addPoint(r.lat, r.lon);
  }

  function iconForSegment(seg: RouteSegment, isLast: boolean) {
    if (seg.mode === 'start') return originIcon;
    if (isLast) return destinationIcon;
    return waypointIcon;
  }

  return (
    <div className="space-y-3">
      {/* Top toolbar */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setActiveMode('truck')}
              disabled={segments.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeMode === 'truck'
                  ? 'bg-white text-[#185FA5] shadow'
                  : 'text-slate-500 hover:text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Truck className="h-4 w-4" /> Avtomobil
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('train')}
              disabled={segments.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeMode === 'train'
                  ? 'bg-white text-[#7c3aed] shadow'
                  : 'text-slate-500 hover:text-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Train className="h-4 w-4" /> Poezd
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Ruler className="h-3.5 w-3.5 text-[#185FA5]" />
            {totalKm.toFixed(1)} km
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Flag className="h-3.5 w-3.5 text-[#10b981]" />
            {segments.length} ta nuqta
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undoLast}
            disabled={segments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" /> Orqaga
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={segments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Tozalash
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-[#185FA5] focus-within:ring-2 focus-within:ring-[#185FA5]/20">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch(search);
              }
            }}
            placeholder="Manzil, shahar yoki ob'ekt nomini qidiring..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-[#185FA5]" />}
          <button
            type="button"
            onClick={() => runSearch(search)}
            className="rounded-md bg-[#185FA5] px-3 py-1 text-xs font-semibold text-white hover:bg-[#042C53]"
          >
            Qidirish
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-[500] mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSearchResult(r)}
                className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 last:border-0 hover:bg-slate-50"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#185FA5]" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Segment chips */}
      {segments.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <Info className="h-4 w-4 text-[#185FA5]" />
          Xaritadan boshlang&apos;ich nuqtani tanlang yoki yuqoridagi qidiruvdan foydalaning.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const chipBase = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold';
            const chipColor =
              seg.mode === 'start'
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                : isLast
                ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                : seg.mode === 'truck'
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                : 'bg-purple-100 text-purple-700 ring-1 ring-purple-200';
            const Icon = seg.mode === 'start' ? MapPin : seg.mode === 'truck' ? Truck : Train;
            return (
              <div key={seg.id} className={`${chipBase} ${chipColor}`}>
                <Icon className="h-3 w-3" />
                <span>
                  {i + 1}. {seg.mode === 'start' ? 'Boshlanish' : isLast ? 'Yakun' : seg.mode === 'truck' ? 'Avto' : 'Poezd'}
                </span>
                <span className="opacity-60 font-mono">
                  {seg.lat.toFixed(3)}, {seg.lng.toFixed(3)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSegment(seg.id)}
                  className="ml-1 rounded-full p-0.5 opacity-60 hover:bg-black/10 hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Map */}
      <div className="relative h-[460px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner">
        <MapContainer
          center={defaultCenter}
          zoom={segments.length > 0 ? 8 : 5}
          zoomControl={false}
          className="h-full w-full"
          ref={(m) => {
            if (m) mapRef.current = m;
          }}
        >
          <TileLayer
            key={layer}
            url={TILE_LAYERS[layer].url}
            attribution={TILE_LAYERS[layer].attribution}
            subdomains={TILE_LAYERS[layer].subdomains ?? []}
          />
          {/* OpenRailwayMap overlay — shows railway tracks when train mode is active */}
          {(activeMode === 'train' || layer === 'railway') && (
            <TileLayer
              url={OPENRAILWAYMAP_URL}
              attribution="&copy; OpenRailwayMap"
              opacity={0.85}
              maxZoom={19}
            />
          )}
          <ZoomControl position="bottomright" />
          <MapEvents />
          <FitBounds points={pathAsLatLng} trigger={fitTick} />

          {segments.map((seg, i) => {
            const prev = i > 0 ? segments[i - 1] : null;
            const isLast = i === segments.length - 1;
            return (
              <div key={seg.id}>
                <Marker position={[seg.lat, seg.lng]} icon={iconForSegment(seg, isLast)}>
                  <Popup>
                    <div className="min-w-[180px] space-y-1">
                      <div className="font-semibold text-slate-800">
                        {i + 1}-nuqta ·{' '}
                        {seg.mode === 'start' ? 'Boshlanish' : isLast ? 'Yakun' : seg.mode === 'truck' ? 'Avto' : 'Poezd'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {seg.lat.toFixed(5)}, {seg.lng.toFixed(5)}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {prev && seg.osrmGeometry && (
                  <>
                    <Polyline
                      positions={seg.osrmGeometry}
                      pathOptions={{
                        color: 'white',
                        weight: seg.mode === 'train' ? 8 : 7,
                        opacity: 0.9,
                      }}
                    />
                    <Polyline
                      positions={seg.osrmGeometry}
                      pathOptions={{
                        color: seg.mode === 'train' ? '#7c3aed' : '#185FA5',
                        weight: seg.mode === 'train' ? 5 : 4,
                        opacity: 0.95,
                        dashArray: seg.mode === 'train' ? '2, 10' : undefined,
                        lineCap: seg.mode === 'train' ? 'square' : 'round',
                      }}
                    />
                  </>
                )}
                {prev && !seg.osrmGeometry && seg.mode !== 'start' && (
                  <Polyline
                    positions={[[prev.lat, prev.lng], [seg.lat, seg.lng]]}
                    pathOptions={{
                      color: '#94a3b8',
                      weight: 3,
                      opacity: 0.8,
                      dashArray: '4, 8',
                    }}
                  />
                )}
              </div>
            );
          })}
        </MapContainer>

        {/* Layer switcher */}
        <div className="pointer-events-auto absolute right-3 top-3 z-[400] flex overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm">
          {(Object.keys(TILE_LAYERS) as LayerKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayer(key)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                layer === key ? 'bg-[#042C53] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {key === 'voyager' ? 'Streets' : key === 'light' ? 'Light' : key === 'satellite' ? 'Satellite' : '🚂 Railway'}
            </button>
          ))}
        </div>

        {/* Hint */}
        <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm ring-1 ring-black/5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <Layers className="h-3.5 w-3.5 text-[#185FA5]" />
            {segments.length === 0 ? 'Boshlanish nuqtasini qo\u2019shing' : `Keyingi nuqta: ${activeMode === 'truck' ? 'Avtomobil' : 'Poezd'}`}
          </div>
        </div>

        {/* Fetching overlay */}
        {isFetching && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[400] flex justify-center">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#042C53] px-4 py-2 text-xs font-semibold text-white shadow-xl">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Marshrut hisoblanmoqda...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
