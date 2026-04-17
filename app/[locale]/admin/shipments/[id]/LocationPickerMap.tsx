'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Train, Truck, MapPin, X } from 'lucide-react';

const iconTruck = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const iconTrain = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const iconStart = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface RouteSegment {
  id: string;
  lat: number;
  lng: number;
  mode: 'start' | 'truck' | 'train';
  osrmGeometry?: [number, number][]; // Cache route so we don't refetch
}

interface PickerProps {
  segments: RouteSegment[];
  setSegments: (val: RouteSegment[]) => void;
}

export default function LocationPickerMap({ segments, setSegments }: PickerProps) {
  const [activeMode, setActiveMode] = useState<'start' | 'truck' | 'train'>('truck');

  // Center to last segment or Tashkent by default
  const defaultCenter: [number, number] = segments.length > 0 
      ? [segments[segments.length-1].lat, segments[segments.length-1].lng] 
      : [41.2995, 69.2401];

  async function fetchRoute(start: [number, number], end: [number, number]): Promise<[number, number][]> {
      try {
         const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
         const data = await res.json();
         if (data?.routes?.[0]?.geometry?.coordinates) {
             return data.routes[0].geometry.coordinates.map((c: any[]) => [c[1], c[0]]);
         }
      } catch(e) {}
      return [start, end]; // fallback to straight line
  }

  function MapEvents() {
    useMapEvents({
      async click(e) {
        const modeToUse = segments.length === 0 ? 'start' : activeMode;
        
        let newSegment: RouteSegment = {
           id: Math.random().toString(36).substring(7),
           lat: e.latlng.lat,
           lng: e.latlng.lng,
           mode: modeToUse
        };

        // If it's a truck or train, we fetch OSRM route to avoid straight 'flying' lines.
        // Although OSRM uses roads, it realistically snaps to geography (avoiding oceans/straight lines) 
        if (segments.length > 0) {
           const prev = segments[segments.length - 1];
           if (modeToUse === 'truck' || modeToUse === 'train') {
               const geom = await fetchRoute([prev.lat, prev.lng], [newSegment.lat, newSegment.lng]);
               newSegment.osrmGeometry = geom;
           }
        }
        
        setSegments([...segments, newSegment]);
      }
    });
    return null;
  }

  function removeSegment(id: string) {
      setSegments(segments.filter(s => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveMode('truck')}
          disabled={segments.length === 0}
          className={`flex-1 min-w-[120px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${activeMode === 'truck' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Truck className="w-4 h-4" /> Avtomobilda kelish
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('train')}
          disabled={segments.length === 0}
          className={`flex-1 min-w-[120px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${activeMode === 'train' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Train className="w-4 h-4" /> Poezdda kelish
        </button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-wrap gap-2">
         {segments.length === 0 && <span className="text-sm text-gray-500">Dastlab xaritadan boshlang'ich nuqtani tanlang (cherting).</span>}
         {segments.map((seg, i) => (
             <div key={seg.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold ${seg.mode === 'start' ? 'bg-green-100 text-green-700' : seg.mode === 'truck' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                 {seg.mode === 'start' ? <MapPin className="w-3 h-3"/> : seg.mode === 'truck' ? <Truck className="w-3 h-3"/> : <Train className="w-3 h-3"/>}
                 <span>{i+1}-nuqta</span>
                 <button type="button" onClick={() => removeSegment(seg.id)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-3 h-3"/></button>
             </div>
         ))}
      </div>

      <div className="h-[400px] w-full rounded-xl overflow-hidden border border-blue-100 shadow-inner relative z-0">
        <MapContainer center={defaultCenter} zoom={4} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          
          {segments.map((seg, i) => {
              const prev = i > 0 ? segments[i-1] : null;
              return (
                 <div key={seg.id}>
                    <Marker 
                       position={[seg.lat, seg.lng]} 
                       icon={seg.mode === 'start' ? iconStart : seg.mode === 'truck' ? iconTruck : iconTrain}
                    >
                       <Popup><strong>{i+1}-nuqta</strong><br/>Koordinata: {seg.lat.toFixed(4)}, {seg.lng.toFixed(4)}</Popup>
                    </Marker>
                    
                    {seg.osrmGeometry && (
                       <Polyline 
                          positions={seg.osrmGeometry} 
                          color={seg.mode === 'train' ? "#8b5cf6" : "#3b82f6"} 
                          weight={seg.mode === 'train' ? 5 : 4} 
                          dashArray={seg.mode === 'train' ? "1, 10" : undefined}
                          lineCap={seg.mode === 'train' ? "square" : "round"}
                       />
                    )}
                 </div>
              );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
