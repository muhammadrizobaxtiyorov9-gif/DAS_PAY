'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo, useState } from 'react';
import { Navigation, ExternalLink } from 'lucide-react';

interface OfficeMapInnerProps {
  lat: number;
  lng: number;
  address: string;
  label: string;
}

const officeIcon = L.divIcon({
  className: 'daspay-office-icon',
  html: `
    <div style="position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:rgba(24,95,165,0.18);animation:daspayPing 2s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:absolute;width:65%;height:65%;border-radius:9999px;background:rgba(24,95,165,0.35);"></span>
      <span style="position:relative;z-index:10;width:34px;height:34px;border-radius:9999px;background:linear-gradient(135deg,#042C53,#185FA5);color:white;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 8px 24px rgba(4,44,83,0.45);font-weight:700;font-size:14px;">D</span>
    </div>
    <style>
      @keyframes daspayPing {
        0% { transform: scale(0.7); opacity: 0.9; }
        80% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  `,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

export default function OfficeMapInner({ lat, lng, address, label }: OfficeMapInnerProps) {
  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);
  const [mapReady, setMapReady] = useState(false);

  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${lat},${lng}&rtt=auto`;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />
        <ZoomControl position="bottomright" />
        <Marker position={center} icon={officeIcon}>
          <Popup>
            <div className="min-w-[200px] space-y-2">
              <div className="font-semibold text-[#042C53]">{label}</div>
              <div className="text-xs text-slate-600">{address}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] flex justify-between p-3 sm:p-4">
        <div className="pointer-events-auto rounded-xl bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm ring-1 ring-black/5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#185FA5]">
            DasPay Office
          </div>
          <div className="mt-0.5 text-xs text-slate-700">{address}</div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[400] flex justify-center gap-2 p-3 sm:p-4">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-black/5 transition-all hover:bg-slate-50 hover:shadow-xl"
        >
          <Navigation className="h-4 w-4 text-[#185FA5]" />
          Google Maps
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </a>
        <a
          href={yandexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#042C53] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#185FA5] hover:shadow-xl"
        >
          <Navigation className="h-4 w-4" />
          Yandex Maps
        </a>
      </div>

      {!mapReady && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60 backdrop-blur-sm" />
      )}
    </div>
  );
}
