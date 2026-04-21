'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface StationMapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

export function StationMapPicker({ lat, lng, onLocationChange }: StationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const defaultLat = lat || 41.2995;
  const defaultLng = lng || 69.2401;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    let L: any;
    const initMap = async () => {
      L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: lat && lng ? 10 : 5,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Custom train station icon
      const stationIcon = L.divIcon({
        html: `<div style="background:#042C53;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], {
          icon: stationIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onLocationChange(pos.lat, pos.lng);
        });
      }

      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], {
            icon: stationIcon,
            draggable: true,
          }).addTo(map);

          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng();
            onLocationChange(pos.lat, pos.lng);
          });
        }

        onLocationChange(clickLat, clickLng);
      });

      mapInstanceRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted]);

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current?.panTo([lat, lng]);
    }
  }, [lat, lng]);

  if (!mounted) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
        <div className="text-center text-gray-400">
          <MapPin className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm">Xarita yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const handleSearch = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        alert("Manzil topilmadi");
      }
    } catch (err) {
      alert("Qidiruvda xatolik yuz berdi");
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (latStr: string, lonStr: string, displayName: string) => {
    const nLat = parseFloat(latStr);
    const nLng = parseFloat(lonStr);
    setSearchQuery(displayName.split(',')[0]);
    setSearchResults([]);
    onLocationChange(nLat, nLng);
    mapInstanceRef.current?.setView([nLat, nLng], 14);
    
    if (markerRef.current) {
      markerRef.current.setLatLng([nLat, nLng]);
    }
  };

  return (
    <div className="space-y-2 relative">
      <div className="relative z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Manzil yoki stansiya nomini qidiring (Masalan: Keles railway)..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-4 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Qidirish
          </button>
        </div>

        {searchResults.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl z-[1000] divide-y divide-gray-100">
            {searchResults.map((item: any, i: number) => (
              <li 
                key={i}
                onClick={() => selectLocation(item.lat, item.lon, item.display_name)}
                className="px-4 py-3 text-sm hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="font-medium text-[#042C53]">{item.display_name.split(',')[0]}</div>
                <div className="text-xs text-gray-500 truncate">{item.display_name}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        ref={mapRef}
        className="h-[350px] w-full rounded-xl border border-gray-200 shadow-sm"
        style={{ zIndex: 1 }}
      />
      <p className="text-xs text-gray-500">
        💡 Xaritada bosing yoki markerni sureting — koordinatalar avtomatik o'rnatiladi
      </p>
    </div>
  );
}
