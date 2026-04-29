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
  points = [],
  stopPoints = [],
  routeSegments = []
}: { 
  points?: [number, number][];
  stopPoints?: [number, number][];
  routeSegments?: any[];
}) {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | undefined>();

  useEffect(() => {
    let allPoints: [number, number][] = [...points];
    if (routeSegments && routeSegments.length > 0) {
      allPoints = [...allPoints, ...routeSegments.map((s: any) => [s.lat, s.lng] as [number, number])];
    }
    if (allPoints.length > 0) {
      setBounds(L.latLngBounds(allPoints));
    }
  }, [points, routeSegments]);

  if ((!points || points.length === 0) && (!routeSegments || routeSegments.length === 0)) return null;

  const currentPos = points.length > 0 ? points[points.length - 1] : (routeSegments.length > 0 ? [routeSegments[routeSegments.length - 1].lat, routeSegments[routeSegments.length - 1].lng] as [number, number] : [0,0]);
  const startPos = points.length > 0 ? points[0] : (routeSegments.length > 0 ? [routeSegments[0].lat, routeSegments[0].lng] as [number, number] : [0,0]);

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
      <TileLayer
        url="https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
        attribution="&copy; OpenRailwayMap"
        opacity={0.85}
        maxZoom={19}
      />
      <MapUpdater bounds={bounds} />

      {/* Planned Route */}
      {routeSegments && routeSegments.map((seg, i) => {
        const prev = i > 0 ? routeSegments[i - 1] : null;
        if (!prev) return null;
        return (
          <div key={seg.id || i}>
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
      
      {/* GPS trail polyline */}
      {points.length > 1 && (
        <Polyline positions={points} color="#2563eb" weight={4} opacity={0.8} />
      )}
      
      {/* Start marker */}
      {points.length > 0 && (
        <Marker position={startPos} icon={startIcon}>
          <Popup>
            <div className="text-xs font-semibold">📍 Boshlang'ich nuqta</div>
          </Popup>
        </Marker>
      )}
      
      {/* Stop markers */}
      {stopPoints.map((p, i) => (
        <Marker key={`stop-${i}`} position={p} icon={stopIcon}>
          <Popup>
            <div className="text-xs font-semibold">🛑 To'xtash #{i + 1}</div>
          </Popup>
        </Marker>
      ))}
      
      {/* Current/Last known position */}
      {points.length > 0 && (
        <Marker position={currentPos} icon={truckIcon}>
          <Popup>
            <div className="text-xs font-semibold">🚂 So'nggi joylashuv</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
