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

// Origin marker (green circle with A)
const originPinHtml = `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#10b981;color:white;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);">A</div>`;
const originPinIcon = L.divIcon({ html: originPinHtml, className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 16] });

// Destination marker (red circle with B)
const destPinHtml = `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#ef4444;color:white;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);">B</div>`;
const destPinIcon = L.divIcon({ html: destPinHtml, className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 16] });

interface Props {
  points?: [number, number][];
  stopPoints?: [number, number][];
  routeSegments?: any[];
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  originLabel?: string;
  destLabel?: string;
}

export default function AdminMapClient({ 
  points = [],
  stopPoints = [],
  routeSegments = [],
  originLat,
  originLng,
  destLat,
  destLng,
  originLabel,
  destLabel,
}: Props) {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | undefined>();

  const hasOrigin = originLat != null && originLng != null;
  const hasDestination = destLat != null && destLng != null;
  const hasSegments = routeSegments && routeSegments.length > 0;
  const hasPoints = points && points.length > 0;

  // Nothing to show at all
  if (!hasPoints && !hasSegments && !hasOrigin && !hasDestination) {
    return (
      <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 rounded-lg">
        <div className="text-lg">🗺️</div>
        <div className="text-sm font-medium">Xarita ma&apos;lumotlari mavjud emas</div>
        <div className="text-xs">Yuk yaratilganda marshrut nuqtalarini belgilang</div>
      </div>
    );
  }

  useEffect(() => {
    const allPoints: [number, number][] = [...points];
    if (hasSegments) {
      routeSegments.forEach((s: any) => {
        if (s.lat && s.lng) allPoints.push([s.lat, s.lng]);
      });
    }
    if (hasOrigin) allPoints.push([originLat!, originLng!]);
    if (hasDestination) allPoints.push([destLat!, destLng!]);

    if (allPoints.length > 0) {
      setBounds(L.latLngBounds(allPoints));
    }
  }, [points, routeSegments, originLat, originLng, destLat, destLng, hasSegments, hasOrigin, hasDestination]);

  const center: [number, number] = hasPoints 
    ? points[points.length - 1] 
    : hasSegments
      ? [routeSegments[routeSegments.length - 1].lat, routeSegments[routeSegments.length - 1].lng]
      : hasOrigin 
        ? [originLat!, originLng!]
        : [41.2995, 69.2401];

  return (
    <MapContainer 
      center={center} 
      zoom={6} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <TileLayer
        url="https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
        attribution="&copy; OpenRailwayMap"
        opacity={0.85}
        maxZoom={19}
      />
      <MapUpdater bounds={bounds} />

      {/* Route segments (planned route from creation) */}
      {hasSegments && routeSegments.map((seg: any, i: number) => {
        const prev = i > 0 ? routeSegments[i - 1] : null;
        if (!prev) return null;
        return (
          <div key={seg.id || `seg-${i}`}>
            {seg.osrmGeometry ? (
              <>
                <Polyline
                  positions={seg.osrmGeometry}
                  pathOptions={{ color: 'white', weight: 8, opacity: 0.9 }}
                />
                <Polyline
                  positions={seg.osrmGeometry}
                  pathOptions={{
                    color: '#7c3aed',
                    weight: 5,
                    opacity: 0.95,
                    dashArray: '2, 10',
                    lineCap: 'square',
                  }}
                />
              </>
            ) : (
              <Polyline
                positions={[[prev.lat, prev.lng], [seg.lat, seg.lng]]}
                pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.8, dashArray: '4, 8' }}
              />
            )}
          </div>
        );
      })}

      {/* Fallback: Draw dashed line between origin and destination when no segments */}
      {!hasSegments && hasOrigin && hasDestination && (
        <Polyline
          positions={[[originLat!, originLng!], [destLat!, destLng!]]}
          pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.7, dashArray: '8, 12' }}
        />
      )}

      {/* Origin marker (A) */}
      {hasOrigin && (
        <Marker position={[originLat!, originLng!]} icon={originPinIcon}>
          <Popup>
            <div className="text-xs font-semibold">📍 Jo&apos;nash: {originLabel || `${originLat!.toFixed(4)}, ${originLng!.toFixed(4)}`}</div>
          </Popup>
        </Marker>
      )}

      {/* Destination marker (B) */}
      {hasDestination && (
        <Marker position={[destLat!, destLng!]} icon={destPinIcon}>
          <Popup>
            <div className="text-xs font-semibold">🏁 Borish: {destLabel || `${destLat!.toFixed(4)}, ${destLng!.toFixed(4)}`}</div>
          </Popup>
        </Marker>
      )}
      
      {/* GPS trail polyline */}
      {hasPoints && points.length > 1 && (
        <Polyline positions={points} color="#2563eb" weight={4} opacity={0.8} />
      )}
      
      {/* GPS Start marker */}
      {hasPoints && (
        <Marker position={points[0]} icon={startIcon}>
          <Popup>
            <div className="text-xs font-semibold">📍 Boshlang&apos;ich nuqta</div>
          </Popup>
        </Marker>
      )}
      
      {/* Stop markers */}
      {stopPoints.map((p, i) => (
        <Marker key={`stop-${i}`} position={p} icon={stopIcon}>
          <Popup>
            <div className="text-xs font-semibold">🛑 To&apos;xtash #{i + 1}</div>
          </Popup>
        </Marker>
      ))}
      
      {/* Current/Last known position */}
      {hasPoints && (
        <Marker position={points[points.length - 1]} icon={truckIcon}>
          <Popup>
            <div className="text-xs font-semibold">🚂 So&apos;nggi joylashuv</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
