'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { resolveRouteGeometry } from '@/lib/map-utils';

const originIconHtml = `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#16a34a;color:white;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:bold;font-size:16px">A</div>`;
const originIcon = L.divIcon({ html: originIconHtml, className: 'custom-div-icon', iconSize: [36, 36], iconAnchor: [18, 18] });

const destIconHtml = `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#dc2626;color:white;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:bold;font-size:16px">B</div>`;
const destIcon = L.divIcon({ html: destIconHtml, className: 'custom-div-icon', iconSize: [36, 36], iconAnchor: [18, 18] });

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ origin, dest }: { origin?: [number, number]; dest?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (origin && dest) {
      map.fitBounds([origin, dest], { padding: [50, 50], animate: true });
    } else if (origin) {
      map.setView(origin, 10, { animate: true });
    } else if (dest) {
      map.setView(dest, 10, { animate: true });
    }
  }, [origin, dest, map]);
  return null;
}

interface TruckRoutePickerProps {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  onChange: (coords: { originLat?: number; originLng?: number; destLat?: number; destLng?: number }) => void;
}

export default function TruckRoutePickerMap({ originLat, originLng, destLat, destLng, onChange }: TruckRoutePickerProps) {
  const [picking, setPicking] = useState<'origin' | 'dest'>('origin');
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

  useEffect(() => {
    if (originLat && originLng && destLat && destLng) {
      resolveRouteGeometry([originLat, originLng], [destLat, destLng], 'truck')
        .then(route => {
          if (route && route.length > 0) setRouteGeometry(route);
          else setRouteGeometry([]);
        })
        .catch(() => setRouteGeometry([]));
    } else {
      setRouteGeometry([]);
    }
  }, [originLat, originLng, destLat, destLng]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (picking === 'origin') {
      onChange({ originLat: lat, originLng: lng, destLat, destLng });
      setPicking('dest');
    } else {
      onChange({ originLat, originLng, destLat: lat, destLng: lng });
      setPicking('origin');
    }
  }, [picking, originLat, originLng, destLat, destLng, onChange]);

  const origin: [number, number] | undefined = originLat && originLng ? [originLat, originLng] : undefined;
  const dest: [number, number] | undefined = destLat && destLng ? [destLat, destLng] : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setPicking('origin')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            picking === 'origin' 
              ? 'bg-green-100 text-green-700 border-green-300 ring-2 ring-green-300/50' 
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
        >
          📍 A — Jo&apos;nash {origin ? '✓' : ''}
        </button>
        <button
          type="button"
          onClick={() => setPicking('dest')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            picking === 'dest' 
              ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-300/50' 
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
        >
          📍 B — Manzil {dest ? '✓' : ''}
        </button>
        {(origin || dest) && (
          <button
            type="button"
            onClick={() => { onChange({}); setPicking('origin'); }}
            className="px-3 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-all ml-auto"
          >
            🗑️ Tozalash
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 italic">
        {picking === 'origin' 
          ? '👆 Xaritadan jo\'nash nuqtasini (A) bosib tanlang' 
          : '👆 Xaritadan manzil nuqtasini (B) bosib tanlang'}
      </p>
      <div className="h-[350px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
        <MapContainer 
          center={[41.311081, 64.585262]}
          zoom={6} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <ClickHandler onMapClick={handleMapClick} />
          <FitBounds origin={origin} dest={dest} />

          {origin && (
            <Marker position={origin} icon={originIcon} draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  onChange({ originLat: ll.lat, originLng: ll.lng, destLat, destLng });
                }
              }}
            >
              <Popup><b>A — Jo&apos;nash</b><br/>{origin[0].toFixed(5)}, {origin[1].toFixed(5)}</Popup>
            </Marker>
          )}

          {dest && (
            <Marker position={dest} icon={destIcon} draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  onChange({ originLat, originLng, destLat: ll.lat, destLng: ll.lng });
                }
              }}
            >
              <Popup><b>B — Manzil</b><br/>{dest[0].toFixed(5)}, {dest[1].toFixed(5)}</Popup>
            </Marker>
          )}

          {routeGeometry.length > 1 && (
            <Polyline positions={routeGeometry} color="#3b82f6" weight={4} opacity={0.8} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
