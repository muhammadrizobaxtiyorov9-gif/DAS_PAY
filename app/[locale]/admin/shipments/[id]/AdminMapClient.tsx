'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, OctagonX } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

function MapUpdater({ bounds }: { bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [bounds, map]);
  return null;
}

const truckIconHtml = renderToStaticMarkup(
  <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-blue-600 text-white border-3 border-white">
    <Truck className="w-5 h-5" />
  </div>
);
const truckIcon = L.divIcon({ html: truckIconHtml, className: 'custom-div-icon', iconSize: [40, 40], iconAnchor: [20, 20] });

const stopIconHtml = renderToStaticMarkup(
  <div className="flex items-center justify-center w-6 h-6 rounded-full shadow bg-red-500 text-white border-2 border-white">
    <OctagonX className="w-3 h-3" />
  </div>
);
const stopIcon = L.divIcon({ html: stopIconHtml, className: 'custom-div-icon', iconSize: [24, 24], iconAnchor: [12, 12] });

const startIconHtml = `<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>`;
const startIcon = L.divIcon({ html: startIconHtml, className: 'custom-div-icon', iconSize: [16, 16], iconAnchor: [8, 8] });

export default function AdminMapClient({ 
  points,
  stopPoints = []
}: { 
  points: [number, number][];
  stopPoints?: [number, number][];
}) {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | undefined>();

  useEffect(() => {
    if (points && points.length > 0) {
      setBounds(L.latLngBounds(points));
    }
  }, [points]);

  if (!points || points.length === 0) return null;

  const currentPos = points[points.length - 1];
  const startPos = points[0];

  return (
    <MapContainer 
      center={currentPos} 
      zoom={13} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapUpdater bounds={bounds} />
      
      {/* GPS trail polyline */}
      {points.length > 1 && (
        <Polyline positions={points} color="#2563eb" weight={4} opacity={0.8} />
      )}
      
      {/* Start marker */}
      <Marker position={startPos} icon={startIcon}>
        <Popup>
          <div className="text-xs font-semibold">📍 Boshlang'ich nuqta</div>
        </Popup>
      </Marker>
      
      {/* Stop markers */}
      {stopPoints.map((p, i) => (
        <Marker key={`stop-${i}`} position={p} icon={stopIcon}>
          <Popup>
            <div className="text-xs font-semibold">🛑 To'xtash #{i + 1}</div>
          </Popup>
        </Marker>
      ))}
      
      {/* Current/Last known position */}
      <Marker position={currentPos} icon={truckIcon}>
        <Popup>
          <div className="text-xs font-semibold">🚛 So'nggi joylashuv</div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
