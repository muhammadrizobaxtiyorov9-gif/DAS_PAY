'use client';

import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize, Minimize } from 'lucide-react';

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

// A custom animated icon to show the EXACT current location of the shipment
const iconCurrentPulse = L.divIcon({
  className: 'custom-pulse-icon',
  html: `
    <div class="relative flex items-center justify-center w-12 h-12">
       <div class="absolute w-full h-full bg-red-500/40 rounded-full animate-ping"></div>
       <div class="relative z-10 w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
       </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

export default function ShipmentMap({ shipment }: { shipment: any }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Parse segments or fallback to old schema coordinates
  let parsedSegments: any[] = [];
  try {
     const saved = typeof shipment.routeSegments === 'string' ? JSON.parse(shipment.routeSegments) : shipment.routeSegments;
     if (Array.isArray(saved) && saved.length > 0) {
        parsedSegments = saved;
     }
  } catch(e) {}

  // Fallback for old data without routeSegments
  if (parsedSegments.length === 0 && (shipment.originLat || shipment.destinationLat)) {
     if (shipment.originLat && shipment.originLng) {
         parsedSegments.push({ id:'1', lat: shipment.originLat, lng: shipment.originLng, mode: 'start' });
     }
     if (shipment.currentLat && shipment.currentLng) {
         parsedSegments.push({ id:'2', lat: shipment.currentLat, lng: shipment.currentLng, mode: 'truck' });
     }
     if (shipment.destinationLat && shipment.destinationLng) {
         parsedSegments.push({ id:'3', lat: shipment.destinationLat, lng: shipment.destinationLng, mode: 'truck' });
     }
  }

  const defaultCenter: [number, number] = parsedSegments.length > 0 
      ? [parsedSegments[parsedSegments.length-1].lat, parsedSegments[parsedSegments.length-1].lng]
      : [41.2995, 69.2401];

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={mapRef} className={`w-full rounded-2xl overflow-hidden shadow-sm border relative bg-white ${isFullscreen ? 'h-screen z-50' : 'h-full'}`}>
      
      {/* Fullscreen Toggle Button */}
      <button 
         onClick={toggleFullscreen}
         className="absolute top-4 right-4 z-[400] bg-white p-2 rounded-lg shadow-md border hover:bg-gray-50 transition-colors text-gray-700"
         title={isFullscreen ? "Kichraytirish" : "To'liq ekran"}
      >
         {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>

      <MapContainer center={defaultCenter} zoom={4} className="h-full w-full" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {parsedSegments.map((seg, i) => {
            const isLast = i === parsedSegments.length - 1;
            
            // Set precise tooltip name for the progress step
            let labelText = "Yo'l oraliq nuqtasi (Tranzit)";
            if (i === 0) labelText = "Yuk Jo'natilgan Boshlang'ich Nuqta";
            
            // Logically, the *last* segment is the CURRENT location unless Status says Delivered
            const isDelivered = shipment.status === 'delivered';
            
            if (isLast) {
               labelText = isDelivered ? "Yuk yetkazib berilgan yakuniy manzil" : "Yuk HOZIR shuyerda (Harakatda)";
            }

            return (
               <div key={seg.id || i}>
                  {/* For intermediate points we just show the vehicle type */}
                  <Marker 
                     position={[seg.lat, seg.lng]} 
                     icon={seg.mode === 'start' ? iconStart : seg.mode === 'truck' ? iconTruck : iconTrain}
                  >
                     <Popup>
                         <strong className="text-gray-900">{labelText}</strong><br/>
                         {seg.mode === 'truck' ? "Tashuv Turi: Yuk Avtomashinasi" : seg.mode === 'train' ? "Tashuv Turi: Temir Yo'l / Vagon" : "Boshlang'ich Koordinata"}
                     </Popup>
                  </Marker>

                  {/* Overlap the red glowing pulse EXACTLY at the current active location */}
                  {isLast && !isDelivered && (
                    <Marker position={[seg.lat, seg.lng]} icon={iconCurrentPulse}>
                       <Popup><strong>Hozirgi Obyekt (Live Tracking)</strong></Popup>
                    </Marker>
                  )}
                  
                  {seg.osrmGeometry && (
                     <Polyline 
                        positions={seg.osrmGeometry} 
                        color={seg.mode === 'train' ? "#8b5cf6" : "#3b82f6"} 
                        weight={seg.mode === 'train' ? 5 : 4} 
                        dashArray={seg.mode === 'train' ? "1, 10" : undefined}
                        lineCap={seg.mode === 'train' ? "square" : "round"}
                        className={seg.mode === 'truck' ? "animate-pulse" : ""}
                     />
                  )}
               </div>
            );
        })}

        {parsedSegments.length === 0 && (
           <div className="absolute inset-x-0 bottom-10 z-[400] flex justify-center pointer-events-none">
              <span className="bg-red-50 text-red-600 px-4 py-2 rounded-full shadow border font-bold text-sm">
                 Marshrut kordinatalari kiritilmagan.
              </span>
           </div>
        )}
      </MapContainer>
    </div>
  );
}
