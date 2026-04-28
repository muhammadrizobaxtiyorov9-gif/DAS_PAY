'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { Loader2, Search, X, Crosshair } from 'lucide-react';

interface Props {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  onChange: (c: { originLat?: number; originLng?: number; destLat?: number; destLng?: number }) => void;
  onAddressResolved?: (type: 'origin' | 'dest', address: string) => void;
}

interface Suggestion {
  displayName: string;
  value: string;
}

const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';

export default function YandexRoutePicker(props: Props) {
  const { onChange, onAddressResolved } = props;

  const [a, setA] = useState<[number, number] | null>(
    props.originLat && props.originLng ? [props.originLat, props.originLng] : null,
  );
  const [b, setB] = useState<[number, number] | null>(
    props.destLat && props.destLng ? [props.destLat, props.destLng] : null,
  );
  const [picking, setPicking] = useState<'A' | 'B'>('A');
  const [mapReady, setMapReady] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const ymapsRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs for latest state used inside the persistent click handler
  const aRef = useRef(a); aRef.current = a;
  const bRef = useRef(b); bRef.current = b;
  const pickRef = useRef(picking); pickRef.current = picking;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const onAddrRef = useRef(onAddressResolved); onAddrRef.current = onAddressResolved;

  // Reverse-geocode: coords → human address
  const doReverseGeocode = useCallback((lat: number, lng: number, type: 'origin' | 'dest') => {
    const ym = ymapsRef.current;
    if (!ym) return;
    ym.geocode([lat, lng], { results: 1 })
      .then((res: any) => {
        const obj = res.geoObjects.get(0);
        if (obj && onAddrRef.current) {
          onAddrRef.current(type, obj.getAddressLine());
        }
      })
      .catch(() => {
        // Geocoder unavailable (no apikey, quota, etc.) — silently ignore
      });
  }, []);

  // Forward-geocode: text → coords
  const doForwardGeocode = useCallback(async (query: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    const ym = ymapsRef.current;
    if (!ym) return null;
    try {
      const res = await ym.geocode(query, { results: 1 });
      const obj = res.geoObjects.get(0);
      if (!obj) return null;
      const coords = obj.geometry.getCoordinates();
      return { lat: coords[0], lng: coords[1], address: obj.getAddressLine() };
    } catch {
      return null;
    }
  }, []);

  // Build route between A and B
  const drawRoute = useCallback((from: [number, number], to: [number, number]) => {
    const ym = ymapsRef.current;
    const map = mapInstanceRef.current;
    if (!ym || !map) return;

    if (routeRef.current) {
      try { map.geoObjects.remove(routeRef.current); } catch { /* noop */ }
      routeRef.current = null;
    }

    try {
      const mr = new ym.multiRouter.MultiRoute(
        { referencePoints: [from, to], params: { routingMode: 'auto' } },
        {
          boundsAutoApply: true,
          wayPointVisible: false,
          routeActiveStrokeColor: '#185FA5',
          routeActiveStrokeWidth: 5,
        },
      );
      map.geoObjects.add(mr);
      routeRef.current = mr;
    } catch (err) {
      console.error('Route error:', err);
    }
  }, []);

  // Apply a chosen point (from search or click) to A or B
  const applyPoint = useCallback((lat: number, lng: number, address?: string) => {
    if (pickRef.current === 'A') {
      const newA: [number, number] = [lat, lng];
      setA(newA);
      const curB = bRef.current;
      onChangeRef.current({
        originLat: lat, originLng: lng,
        destLat: curB?.[0], destLng: curB?.[1],
      });
      if (address && onAddrRef.current) onAddrRef.current('origin', address);
      else doReverseGeocode(lat, lng, 'origin');
      if (curB) drawRoute(newA, curB);
      setPicking('B');
    } else {
      const newB: [number, number] = [lat, lng];
      setB(newB);
      const curA = aRef.current;
      onChangeRef.current({
        originLat: curA?.[0], originLng: curA?.[1],
        destLat: lat, destLng: lng,
      });
      if (address && onAddrRef.current) onAddrRef.current('dest', address);
      else doReverseGeocode(lat, lng, 'dest');
      if (curA) drawRoute(curA, newB);
      setPicking('A');
    }
    // Center the map on the new point
    const m = mapInstanceRef.current;
    if (m) {
      try { m.setCenter([lat, lng], 13, { duration: 400 }); } catch { /* noop */ }
    }
  }, [doReverseGeocode, drawRoute]);

  // Store map instance
  const handleMapInstance = useCallback((ref: any) => {
    if (!ref || mapInstanceRef.current === ref) return;
    mapInstanceRef.current = ref;
  }, []);

  const handleClear = () => {
    setA(null);
    setB(null);
    setPicking('A');
    setSearchText('');
    setSuggestions([]);
    onChange({});
    onAddressResolved?.('origin', '');
    onAddressResolved?.('dest', '');
    if (routeRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.geoObjects.remove(routeRef.current); } catch { /* noop */ }
      routeRef.current = null;
    }
  };

  // Debounced suggest as user types — uses Yandex's geocode (returns multiple results)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!mapReady || searchText.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const ym = ymapsRef.current;
      if (!ym) return;
      setSearching(true);
      ym.geocode(searchText.trim(), { results: 5 })
        .then((res: any) => {
          const items: Suggestion[] = [];
          res.geoObjects.each((obj: any) => {
            items.push({ displayName: obj.getAddressLine(), value: obj.getAddressLine() });
          });
          setSuggestions(items);
          setShowSuggestions(true);
          setSearching(false);
        })
        .catch(() => {
          setSuggestions([]);
          setSearching(false);
        });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText, mapReady]);

  // Picking from suggestions
  const handlePickSuggestion = async (s: Suggestion) => {
    setShowSuggestions(false);
    setSearchText(s.displayName);
    setSearching(true);
    const result = await doForwardGeocode(s.value);
    setSearching(false);
    if (result) {
      applyPoint(result.lat, result.lng, result.address);
    }
  };

  // Pressing Enter without picking from suggestions → just geocode the text
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setShowSuggestions(false);
    setSearching(true);
    const result = await doForwardGeocode(searchText.trim());
    setSearching(false);
    if (result) {
      applyPoint(result.lat, result.lng, result.address);
    }
  };

  return (
    <div className="space-y-3">
      {/* Picker toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => setPicking('A')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            picking === 'A'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
          📍 A — Jo&apos;nash {a ? '✓' : ''}
        </button>
        <button type="button" onClick={() => setPicking('B')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            picking === 'B'
              ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-200'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
          📍 B — Manzil {b ? '✓' : ''}
        </button>
        {(a || b) && (
          <button type="button" onClick={handleClear}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200">
            Tozalash
          </button>
        )}
      </div>

      {/* Built-in search bar with autocomplete */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={picking === 'A' ? "Jo'nash manzilini qidiring (masalan: Toshkent, Abdurauf Fitrat 33)" : 'Yetkazib berish manzilini qidiring'}
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            disabled={!mapReady}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
          )}
          {!searching && searchText && (
            <button
              type="button"
              onClick={() => { setSearchText(''); setSuggestions([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handlePickSuggestion(s); }}
                className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <Crosshair className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{s.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      <p className="text-[11px] text-slate-400">
        ⭐ {picking === 'A' ? "Jo'nash nuqtasini (A)" : "Manzil nuqtasini (B)"} tanlang — qidirish orqali yoki xaritadan bosib
      </p>

      {/* Map */}
      <div className="relative h-[420px] w-full rounded-xl overflow-hidden border border-slate-200">
        {!mapReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs text-slate-400">Yandex Maps yuklanmoqda...</span>
          </div>
        )}
        <YMaps query={{
          lang: 'ru_RU',
          load: 'package.full,multiRouter.MultiRoute,geocode',
          ...(YANDEX_API_KEY ? { apikey: YANDEX_API_KEY } : {}),
        }}>
          <Map
            defaultState={{ 
              center: [41.31, 64.58], 
              zoom: 6,
              controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
            }}
            width="100%"
            height="100%"
            instanceRef={handleMapInstance}
            onClick={(e: any) => {
              const coords = e.get('coords');
              if (coords) applyPoint(coords[0], coords[1]);
            }}
            onLoad={(ymaps: any) => {
              ymapsRef.current = ymaps;
              setMapReady(true);
            }}
          >
            {a && (
              <Placemark
                geometry={a}
                properties={{ iconContent: 'A', hintContent: "Jo'nash nuqtasi" }}
                options={{ preset: 'islands#greenStretchyIcon', draggable: true }}
                onDragEnd={(e: any) => {
                  const coords = e.get('target').geometry.getCoordinates();
                  const newA: [number, number] = [coords[0], coords[1]];
                  setA(newA);
                  onChangeRef.current({
                    originLat: newA[0], originLng: newA[1],
                    destLat: bRef.current?.[0], destLng: bRef.current?.[1],
                  });
                  doReverseGeocode(newA[0], newA[1], 'origin');
                  if (bRef.current) drawRoute(newA, bRef.current);
                }}
              />
            )}
            {b && (
              <Placemark
                geometry={b}
                properties={{ iconContent: 'B', hintContent: 'Manzil nuqtasi' }}
                options={{ preset: 'islands#redStretchyIcon', draggable: true }}
                onDragEnd={(e: any) => {
                  const coords = e.get('target').geometry.getCoordinates();
                  const newB: [number, number] = [coords[0], coords[1]];
                  setB(newB);
                  onChangeRef.current({
                    originLat: aRef.current?.[0], originLng: aRef.current?.[1],
                    destLat: newB[0], destLng: newB[1],
                  });
                  doReverseGeocode(newB[0], newB[1], 'dest');
                  if (aRef.current) drawRoute(aRef.current, newB);
                }}
              />
            )}
          </Map>
        </YMaps>
      </div>

      {(a || b) && (
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          {a && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <span className="font-bold text-emerald-700">A:</span> {a[0].toFixed(4)}, {a[1].toFixed(4)}
            </div>
          )}
          {b && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="font-bold text-red-700">B:</span> {b[0].toFixed(4)}, {b[1].toFixed(4)}
            </div>
          )}
        </div>
      )}

      {!YANDEX_API_KEY && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Yandex Maps API kaliti o&apos;rnatilmagan. Qidiruv cheklangan ishlaydi. To&apos;liq ishlashi uchun
          <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded">NEXT_PUBLIC_YANDEX_MAPS_API_KEY</code>
          env&apos;da kalitni qo&apos;shing.
        </p>
      )}
    </div>
  );
}
