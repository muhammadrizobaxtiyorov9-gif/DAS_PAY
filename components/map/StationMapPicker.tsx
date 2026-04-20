'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

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

  return (
    <div className="space-y-2">
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
