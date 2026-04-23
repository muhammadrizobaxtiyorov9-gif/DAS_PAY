'use client';

import { useState, useEffect, useRef } from 'react';
import { updateDriverLocation, updateShipmentStatusByDriver } from '@/app/actions/driver';
import { MapPin, Navigation, Package, Phone, CheckCircle2, ChevronRight, Truck, Gauge, Route, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { haversine } from '@/lib/map-utils';

export default function DriverDashboardClient({ truck }: { truck: any }) {
  const [loading, setLoading] = useState(false);
  const activeShipment = truck?.lockedByShipmentId 
    ? truck.shipments?.find((s:any) => s.id === truck.lockedByShipmentId)
    : truck?.shipments?.[0];

  const [currentLat, setCurrentLat] = useState<number | undefined>(truck?.currentLat || undefined);
  const [currentLng, setCurrentLng] = useState<number | undefined>(truck?.currentLng || undefined);
  const [speed, setSpeed] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const lastSentRef = useRef<number>(0);

  // GPS tracking with throttled backend updates (every 15 seconds)
  useEffect(() => {
    if (!activeShipment || activeShipment.status === 'delivered') return;

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed: gpsSpeed } = pos.coords;
          
          if (gpsSpeed !== null && gpsSpeed > 0) {
            setSpeed(Math.round(gpsSpeed * 3.6));
          } else if (currentLat && currentLng) {
            const dist = haversine([currentLat, currentLng], [latitude, longitude]);
            setSpeed(dist > 0.01 ? Math.round(dist / (10 / 3600)) : 0);
          }

          setCurrentLat(latitude);
          setCurrentLng(longitude);

          // Calculate remaining distance (straight line to destination)
          if (activeShipment?.destinationLat && activeShipment?.destinationLng) {
            setDistanceRemaining(haversine([latitude, longitude], [activeShipment.destinationLat, activeShipment.destinationLng]));
          }

          // Throttle backend updates to every 15 seconds
          const now = Date.now();
          if (now - lastSentRef.current > 15000) {
            lastSentRef.current = now;
            updateDriverLocation(latitude, longitude).catch(console.error);
          }
        },
        (err) => {
          console.error('GPS Xatolik:', err);
          toast.error('GPS ruxsati berilmadi. Iltimos, joylashuvga ruxsat bering.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      toast.error("Sizning qurilmangiz GPS qo'llab-quvvatlamaydi.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShipment?.id]);

  async function handleStatusChange(status: string) {
    if (!activeShipment) return;
    
    if (!confirm('Statusni yangilashni tasdiqlaysizmi?')) return;
    
    setLoading(true);
    const res = await updateShipmentStatusByDriver(activeShipment.id, status);
    setLoading(false);
    
    if (res.success) {
      toast.success('Status yangilandi!');
      window.location.reload();
    } else {
      toast.error(res.error || 'Xatolik yuz berdi');
    }
  }

  if (!truck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
          <Truck className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Mashina biriktirilmagan</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Sizga hozircha hech qanday avtomobil biriktirilmagan. Iltimos, dispetcher bilan bog&apos;laning.
        </p>
      </div>
    );
  }

  if (!activeShipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Yangi buyurtma yo&apos;q</h2>
        <p className="text-slate-500 mt-2">
          Dam oling. Hozircha sizda faol yuk tashish marshruti mavjud emas.
        </p>
        <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100 w-full text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase">Mashinangiz</div>
          <div className="font-bold text-lg text-slate-800 mt-1">{truck.plateNumber}</div>
          <div className="text-sm text-slate-500">{truck.model}</div>
        </div>
      </div>
    );
  }

  // Build Yandex Maps route URL
  const origin = encodeURIComponent(activeShipment.origin || '');
  const destination = encodeURIComponent(activeShipment.destination || '');
  const yandexMapUrl = `https://yandex.com/map-widget/v1/?rtext=${origin}~${destination}&rtt=auto&z=7`;
  const yandexNavUrl = `https://yandex.ru/maps/?rtext=${origin}~${destination}&rtt=auto`;
  const googleNavUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;

  return (
    <div className="pb-28">
      {/* Yandex Maps Embedded Route */}
      <div className="h-80 w-full relative overflow-hidden bg-slate-100">
        <iframe
          src={yandexMapUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          style={{ border: 0, display: 'block' }}
        />
        
        {/* Route Info Badge on Map */}
        <div className="absolute top-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Hozirgi Marshrut</p>
              <p className="text-sm font-bold text-slate-800 truncate">{activeShipment.origin} → {activeShipment.destination}</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/60">
             <div className="flex-1 flex flex-col items-center justify-center">
               <div className="flex items-center gap-1 text-slate-500 mb-1"><Gauge className="w-3 h-3"/> <span className="text-[10px] font-bold uppercase">Tezlik</span></div>
               <div className="font-mono font-bold text-lg text-slate-800">{speed} <span className="text-xs font-medium text-slate-500">km/h</span></div>
             </div>
             <div className="w-px bg-slate-200/60"></div>
             <div className="flex-1 flex flex-col items-center justify-center">
               <div className="flex items-center gap-1 text-slate-500 mb-1"><Route className="w-3 h-3"/> <span className="text-[10px] font-bold uppercase">Masofa</span></div>
               <div className="font-mono font-bold text-lg text-slate-800">{distanceRemaining !== null ? distanceRemaining.toFixed(1) : '—'} <span className="text-xs font-medium text-slate-500">km</span></div>
             </div>
          </div>
        </div>
      </div>

      {/* Open in Navigator buttons */}
      <div className="px-4 -mt-4 relative z-10 flex gap-2 mb-3">
        <a
          href={yandexNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-red-500/20 transition-all hover:shadow-lg"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Yandex Navigator
        </a>
        <a
          href={googleNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Google Maps
        </a>
      </div>

      <div className="px-4 space-y-4">
        {/* Details Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Treking kod</p>
              <p className="font-mono font-bold text-lg text-[#185FA5]">{activeShipment.trackingCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Status</p>
              <div className={`font-semibold text-xs px-2 py-1 rounded-md mt-1 inline-block ${
                activeShipment.status === 'in_transit' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {activeShipment.status === 'in_transit' ? "YO'LDA" : activeShipment.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mt-1 shrink-0">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Jo&apos;nash</p>
                <p className="text-sm font-semibold text-slate-800">{activeShipment.origin}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mt-1 shrink-0">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Manzil</p>
                <p className="text-sm font-semibold text-slate-800">{activeShipment.destination}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mt-1 shrink-0">
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Mijoz (Qabul qiluvchi)</p>
                <p className="text-sm font-semibold text-slate-800">{activeShipment.client?.name || activeShipment.receiverName}</p>
              </div>
              {activeShipment.client?.phone && (
                <a href={`tel:${activeShipment.client.phone}`} className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 transition-colors hover:bg-green-100">
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe z-50">
        <div className="max-w-md mx-auto flex gap-3">
          {activeShipment.status !== 'in_transit' && (
             <button
              onClick={() => handleStatusChange('in_transit')}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              Yo&apos;lga chiqdim <ChevronRight className="w-4 h-4" />
            </button>
          )}
          
          {activeShipment.status === 'in_transit' && (
            <button
              onClick={() => handleStatusChange('delivered')}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-bold text-sm shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2"
            >
              Manzilga yetdim <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
