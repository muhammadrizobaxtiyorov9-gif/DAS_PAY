'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

function MapUpdater({ center, bounds }: { center?: [number, number]; bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (center) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, bounds, map]);
  return null;
}

const truckIconHtml = renderToStaticMarkup(
  <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-blue-600 text-white border-4 border-white animate-pulse">
    <Truck className="w-5 h-5" />
  </div>
);
const truckIcon = L.divIcon({ html: truckIconHtml, className: 'custom-div-icon', iconSize: [40, 40], iconAnchor: [20, 20] });

const destIconHtml = renderToStaticMarkup(
  <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-md bg-green-500 text-white border-2 border-white">
    <MapPin className="w-4 h-4" />
  </div>
);
const destIcon = L.divIcon({ html: destIconHtml, className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 32] });

export default function DriverMapClient({ 
  currentLat, 
  currentLng, 
  originLat, 
  originLng, 
  destLat, 
  destLng,
  routeGeometry
}: { 
  currentLat?: number;
  currentLng?: number;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  routeGeometry?: [number, number][];
}) {
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | undefined>();

  useEffect(() => {
    const points: [number, number][] = [];
    if (currentLat && currentLng) points.push([currentLat, currentLng]);
    if (originLat && originLng) points.push([originLat, originLng]);
    if (destLat && destLng) points.push([destLat, destLng]);
    
    if (routeGeometry && routeGeometry.length > 0) {
      setBounds(L.latLngBounds(routeGeometry));
    } else if (points.length > 1) {
      setBounds(L.latLngBounds(points));
    }
  }, [currentLat, currentLng, originLat, originLng, destLat, destLng, routeGeometry]);

  const center: [number, number] = (currentLat && currentLng) 
    ? [currentLat, currentLng] 
    : [41.311081, 69.240562]; // Default Tashkent

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={bounds ? undefined : center} bounds={bounds} />
      
      {routeGeometry && routeGeometry.length > 0 && (
        <Polyline positions={routeGeometry} color="#2563eb" weight={5} opacity={0.8} />
      )}
      
      {destLat && destLng && (
        <Marker position={[destLat, destLng]} icon={destIcon} />
      )}
      
      {currentLat && currentLng && (
        <Marker position={[currentLat, currentLng]} icon={truckIcon} />
      )}
    </MapContainer>
  );
}
