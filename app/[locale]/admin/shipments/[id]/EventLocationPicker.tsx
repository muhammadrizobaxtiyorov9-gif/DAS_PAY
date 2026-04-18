'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, MapPin, X } from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'daspay-event-pin',
  html: `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:rgba(24,95,165,0.2);"></span>
      <span style="position:relative;z-index:10;width:22px;height:22px;border-radius:9999px;background:#185FA5;border:3px solid white;box-shadow:0 4px 12px rgba(24,95,165,0.5);"></span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface Props {
  lat: string;
  lng: string;
  location: string;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onLocationChange: (v: string) => void;
}

function FlyToPoint({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { animate: true, duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function EventLocationPicker({
  lat,
  lng,
  location,
  onLatChange,
  onLngChange,
  onLocationChange,
}: Props) {
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: number; lon: number }>>([]);
  const [isReversing, setIsReversing] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const latNum = lat ? parseFloat(lat) : null;
  const lngNum = lng ? parseFloat(lng) : null;
  const hasMarker = latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum);

  const center: [number, number] = useMemo(() => {
    if (hasMarker) return [latNum!, lngNum!];
    return [41.2995, 69.2401]; // Tashkent default
  }, [hasMarker, latNum, lngNum]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setIsReversing(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'uz,ru,en' } },
      );
      const data = await res.json();
      if (data?.display_name) {
        // Extract a shorter location name
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        const short = parts.slice(0, 3).join(', ');
        onLocationChange(short);
      }
    } catch {
      // silently fail — user can type manually
    } finally {
      setIsReversing(false);
    }
  }, [onLocationChange]);

  const handleMapClick = useCallback(async (clickLat: number, clickLng: number) => {
    onLatChange(clickLat.toFixed(6));
    onLngChange(clickLng.toFixed(6));
    await reverseGeocode(clickLat, clickLng);
  }, [onLatChange, onLngChange, reverseGeocode]);

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

  function selectResult(r: { display_name: string; lat: number; lon: number }) {
    setSearchResults([]);
    setSearch('');
    onLatChange(r.lat.toFixed(6));
    onLngChange(r.lon.toFixed(6));
    const parts = r.display_name.split(',').map((s: string) => s.trim());
    onLocationChange(parts.slice(0, 3).join(', '));
  }

  function clearPin() {
    onLatChange('');
    onLngChange('');
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus-within:border-[#185FA5] focus-within:ring-2 focus-within:ring-[#185FA5]/20">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch(search);
              }
            }}
            placeholder="Manzilni qidirish..."
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#185FA5]" />}
          <button
            type="button"
            onClick={() => runSearch(search)}
            className="rounded-md bg-[#185FA5] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#042C53]"
          >
            Qidirish
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-[600] mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-1.5 text-left text-[11px] text-slate-700 last:border-0 hover:bg-slate-50"
              >
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#185FA5]" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[220px] w-full overflow-hidden rounded-lg border border-slate-200 shadow-inner">
        <MapContainer
          center={center}
          zoom={hasMarker ? 12 : 5}
          zoomControl={false}
          className="h-full w-full"
          ref={(m) => {
            if (m) mapRef.current = m;
          }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
            subdomains={['a', 'b', 'c', 'd']}
          />
          <ZoomControl position="bottomright" />
          <MapClickHandler onClick={handleMapClick} />
          {hasMarker && (
            <>
              <FlyToPoint lat={latNum!} lng={lngNum!} />
              <Marker position={[latNum!, lngNum!]} icon={pinIcon} />
            </>
          )}
        </MapContainer>

        {/* Reverse geocoding indicator */}
        {isReversing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[400] flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-slate-600 shadow-md backdrop-blur-sm">
              <Loader2 className="h-3 w-3 animate-spin" /> Manzil aniqlanmoqda...
            </span>
          </div>
        )}

        {/* Hint */}
        <div className="pointer-events-none absolute left-2 top-2 z-[400] rounded-lg bg-white/95 px-2 py-1 shadow ring-1 ring-black/5 backdrop-blur-sm">
          <span className="text-[10px] font-semibold text-slate-600">
            {hasMarker ? `📍 ${latNum!.toFixed(4)}, ${lngNum!.toFixed(4)}` : '🖱️ Xaritadan bosing'}
          </span>
        </div>

        {/* Clear button */}
        {hasMarker && (
          <button
            type="button"
            onClick={clearPin}
            className="absolute right-2 top-2 z-[400] rounded-lg bg-white p-1 text-slate-500 shadow-md ring-1 ring-black/5 hover:bg-red-50 hover:text-red-500"
            title="Nuqtani tozalash"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
