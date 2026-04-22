'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { shipmentStatusMeta } from '@/lib/shipment-status';
import { wagonStatusMeta } from '@/lib/wagon-status';
import { Clock, Train, Package, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

function createCustomIcon(meta: any, isWagon: boolean = false) {
  const iconHtml = renderToStaticMarkup(
    <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${meta.pill || 'bg-slate-100 text-slate-700'} border-2 border-white`}>
      {isWagon ? <Train className="w-4 h-4" /> : <span className={`w-3 h-3 rounded-full ${meta.dot || 'bg-slate-400'}`} />}
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
  wagons = [],
  activeItemId,
  onMarkerClick,
  activeTab,
}: {
  shipments: any[];
  wagons?: any[];
  activeItemId: string | null;
  onMarkerClick: (id: string) => void;
  activeTab: 'shipments' | 'wagons';
}) {
  let center: [number, number] | null = null;
  
  if (activeItemId) {
    if (activeItemId.startsWith('s_')) {
      const id = parseInt(activeItemId.replace('s_', ''));
      const activeShipment = shipments.find(s => s.id === id);
      const lat = activeShipment?.currentLat || activeShipment?.originLat;
      const lng = activeShipment?.currentLng || activeShipment?.originLng;
      if (lat && lng) center = [lat, lng];
    } else if (activeItemId.startsWith('w_')) {
      const id = parseInt(activeItemId.replace('w_', ''));
      const activeWagon = wagons.find(w => w.id === id);
      if (activeWagon?.currentLat && activeWagon?.currentLng) {
        center = [activeWagon.currentLat, activeWagon.currentLng];
      }
    }
  }

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
      
      {activeTab === 'shipments' && shipments.map(s => {
        const lat = s.currentLat || s.originLat;
        const lng = s.currentLng || s.originLng;
        
        if (!lat || !lng) return null;

        const meta = shipmentStatusMeta(s.status);

        return (
          <Marker 
            key={`s_${s.id}`} 
            position={[lat, lng]} 
            icon={createCustomIcon(meta, false)}
            eventHandlers={{
              click: () => onMarkerClick(`s_${s.id}`)
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-[#185FA5] flex items-center gap-1"><Package className="w-3 h-3"/> {s.trackingCode}</span>
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
                  
                  {s.wagons?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Vagonlar</div>
                      <div className="text-sm font-medium">{s.wagons.map((w:any) => w.number).join(', ')}</div>
                    </div>
                  )}

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

      {activeTab === 'wagons' && wagons.map(w => {
        if (!w.currentLat || !w.currentLng) return null;

        const meta = wagonStatusMeta(w.status);
        const activeShipment = w.shipments?.[0]; // Usually locked to 1 shipment if assigned

        return (
          <Marker 
            key={`w_${w.id}`} 
            position={[w.currentLat, w.currentLng]} 
            icon={createCustomIcon(meta, true)}
            eventHandlers={{
              click: () => onMarkerClick(`w_${w.id}`)
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-[#185FA5] flex items-center gap-1"><Train className="w-3 h-3"/> {w.number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${meta.pill}`}>
                    {meta.labelText}
                  </span>
                </div>
                
                <div className="space-y-2 mt-3">
                  {activeShipment && (
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Biriktirilgan Yuk</div>
                      <div className="text-sm font-medium">{activeShipment.trackingCode}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Stansiya</div>
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {w.currentStation?.nameUz || `${w.currentLat.toFixed(4)}, ${w.currentLng.toFixed(4)}`}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Yangilandi: {new Date(w.lastLocationUpdate || w.updatedAt).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
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
