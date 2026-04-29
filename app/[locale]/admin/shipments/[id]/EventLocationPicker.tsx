'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { Search, Loader2, X, MapPin } from 'lucide-react';

const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';

interface Props {
  lat: string;
  lng: string;
  location: string;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onLocationChange: (v: string) => void;
}

export default function EventLocationPicker({
  lat,
  lng,
  location,
  onLatChange,
  onLngChange,
  onLocationChange,
}: Props) {
  const [mapReady, setMapReady] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  const ymapsRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  const latNum = lat ? parseFloat(lat) : null;
  const lngNum = lng ? parseFloat(lng) : null;
  const hasMarker = latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum);

  const center: [number, number] = hasMarker ? [latNum, lngNum] : [41.2995, 69.2401];

  const doReverseGeocode = useCallback((latitude: number, longitude: number) => {
    const ym = ymapsRef.current;
    if (!ym) return;
    setIsReversing(true);
    ym.geocode([latitude, longitude], { results: 1 })
      .then((res: any) => {
        const obj = res.geoObjects.get(0);
        if (obj) {
          const address = obj.getAddressLine();
          onLocationChange(address);
        }
      })
      .catch(() => {})
      .finally(() => setIsReversing(false));
  }, [onLocationChange]);

  const handleMapClick = useCallback((e: any) => {
    const coords = e.get('coords');
    if (!coords) return;
    const [cLat, cLng] = coords;
    onLatChange(cLat.toFixed(6));
    onLngChange(cLng.toFixed(6));
    doReverseGeocode(cLat, cLng);
  }, [onLatChange, onLngChange, doReverseGeocode]);

  const runSearch = useCallback(async () => {
    const query = search.trim();
    const ym = ymapsRef.current;
    if (!query || !ym || !mapInstanceRef.current) return;

    setIsSearching(true);
    try {
      const res = await ym.geocode(query, { results: 1 });
      const obj = res.geoObjects.get(0);
      if (obj) {
        const coords = obj.geometry.getCoordinates();
        const address = obj.getAddressLine();
        onLatChange(coords[0].toFixed(6));
        onLngChange(coords[1].toFixed(6));
        onLocationChange(address);
        
        mapInstanceRef.current.setCenter(coords, 14, { checkZoomRange: true, duration: 500 });
      }
    } catch (err) {
      console.error('Yandex Geocode search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [search, onLatChange, onLngChange, onLocationChange]);

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
                runSearch();
              }
            }}
            placeholder="Manzilni qidirish..."
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#185FA5]" />}
          <button
            type="button"
            onClick={runSearch}
            className="rounded-md bg-[#185FA5] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#042C53]"
          >
            Qidirish
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[220px] w-full overflow-hidden rounded-lg border border-slate-200 shadow-inner">
        <YMaps query={{ apikey: YANDEX_API_KEY, lang: 'ru_RU', load: 'package.full' }}>
          <Map
            state={{ center, zoom: hasMarker ? 14 : 5 }}
            width="100%"
            height="100%"
            onClick={handleMapClick}
            instanceRef={mapInstanceRef}
            onLoad={(ymaps: any) => {
              ymapsRef.current = ymaps;
              setMapReady(true);
            }}
            options={{ suppressMapOpenBlock: true }}
          >
            {hasMarker && (
              <Placemark
                geometry={center}
                options={{ preset: 'islands#blueDotIcon' }}
              />
            )}
          </Map>
        </YMaps>

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
