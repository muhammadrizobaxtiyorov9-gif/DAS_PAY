'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { shipmentStatusMeta } from '@/lib/shipment-status';
import { MapPin, Package, Clock } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

function createCustomIcon(status: string) {
  const meta = shipmentStatusMeta(status);
  // Using lucide icon rendered to string for the marker
  const iconHtml = renderToStaticMarkup(
    <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${meta.pill} border-2 border-white`}>
      <span className={`w-3 h-3 rounded-full ${meta.dot}`} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({
  shipments,
  activeShipmentId,
  onMarkerClick
}: {
  shipments: any[];
  activeShipmentId: number | null;
  onMarkerClick: (id: number) => void;
}) {
  const activeShipment = shipments.find(s => s.id === activeShipmentId);
  const center: [number, number] | null = activeShipment?.currentLat && activeShipment?.currentLng 
    ? [activeShipment.currentLat, activeShipment.currentLng] 
    : null;

  return (
    <MapContainer 
      center={[41.2995, 69.2401]} // Default to Tashkent
      zoom={5} 
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapController center={center} zoom={6} />
      
      {shipments.map(s => {
        // If currentLat/Lng is missing, fallback to originLat/Lng if available
        const lat = s.currentLat || s.originLat;
        const lng = s.currentLng || s.originLng;
        
        if (!lat || !lng) return null;

        const meta = shipmentStatusMeta(s.status);

        return (
          <Marker 
            key={s.id} 
            position={[lat, lng]} 
            icon={createCustomIcon(s.status)}
            eventHandlers={{
              click: () => onMarkerClick(s.id)
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-[#185FA5]">{s.trackingCode}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.pill}`}>
                    {meta.labelText}
                  </span>
                </div>
                
                <div className="space-y-2 mt-3">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Mijoz</div>
                    <div className="text-sm font-medium">{s.client?.name || s.senderName}</div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Marshrut</div>
                    <div className="text-sm flex items-center gap-1">
                      {s.origin} <span className="text-gray-400">→</span> {s.destination}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Yangilandi: {new Date(s.updatedAt).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
