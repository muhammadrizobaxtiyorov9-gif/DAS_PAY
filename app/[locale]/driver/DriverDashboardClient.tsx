'use client';

import { useState, useEffect, useRef } from 'react';
import { updateDriverLocation, updateShipmentStatusByDriver } from '@/app/actions/driver';
import { MapPin, Navigation, Package, Phone, CheckCircle2, ChevronRight, Truck, Gauge, Route, ExternalLink, WifiOff, Wifi, MessageCircle, Bell, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { haversine } from '@/lib/map-utils';
import { ShipmentDocuments } from '@/components/shared/ShipmentDocuments';
import { enqueuePing, drainQueue, queueSize, type QueuedPing } from '@/lib/offline-queue';
import Link from 'next/link';
import { PushButton } from '@/components/shared/PushButton';

const DRIVER_STATUS_FLOW = [
  { status: 'pending', actionLabel: 'Tasdiqlash', nextStatus: 'confirmed', icon: CheckCircle2, color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' },
  { status: 'confirmed', actionLabel: 'Yuklash manziliga yetdim', nextStatus: 'arrived_at_loading', icon: MapPin, color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' },
  { status: 'arrived_at_loading', actionLabel: 'Hujjatlar rasmiylashtirildi', nextStatus: 'docs_ready', icon: Package, color: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30' },
  { status: 'docs_ready', actionLabel: 'Yuk yuklandi', nextStatus: 'loaded', icon: Truck, color: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30' },
  { status: 'loaded', actionLabel: "Yo'lga chiqdim", nextStatus: 'in_transit', icon: Route, color: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' },
  { status: 'in_transit', actionLabel: 'Manzilga yetdim', nextStatus: 'delivered', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-700 shadow-green-600/30' }
];

const STATUS_LABELS: Record<string, string> = {
  pending: "KUTILMOQDA",
  confirmed: "TASDIQLANDI",
  arrived_at_loading: "YUKLASH MANZILIDA",
  docs_ready: "HUJJATLAR TAYYOR",
  loaded: "YUKLANGAN",
  in_transit: "YO'LDA",
  delivered: "YETKAZILDI"
};

export default function DriverDashboardClient({ truck, username, locale }: { truck: any; username: string; locale: string }) {
  const [loading, setLoading] = useState(false);
  const activeShipment = truck?.lockedByShipmentId 
    ? truck.shipments?.find((s:any) => s.id === truck.lockedByShipmentId)
    : truck?.shipments?.[0];

  const [currentLat, setCurrentLat] = useState<number | undefined>(truck?.currentLat || undefined);
  const [currentLng, setCurrentLng] = useState<number | undefined>(truck?.currentLng || undefined);
  const [speed, setSpeed] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const lastSentRef = useRef<number>(0);
  // For computing speed when the GPS doesn't supply it directly. We track the
  // previous reading's lat/lng + timestamp so the delta is real wall-clock time,
  // not a hard-coded 10s assumption (which produced fake 1000+ km/h spikes).
  const lastReadingRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [gpsReady, setGpsReady] = useState(false);

  // Register the service worker once. The PWA shell + push handler live in
  // /public/sw.js and we want it active even before the user installs.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((err) =>
      console.error('[sw] register failed', err),
    );
  }, []);

  // Sends a ping to the server; falls back to the offline queue on failure.
  // Returns true on success so the queue drainer can decide whether to keep going.
  const sendPing = async (ping: QueuedPing): Promise<boolean> => {
    try {
      const res = await updateDriverLocation(ping.lat, ping.lng);
      // Server actions return an object on error; treat any non-null `error` as failure.
      if (res && (res as { error?: string }).error) return false;
      return true;
    } catch {
      return false;
    }
  };

  // Watch online/offline transitions. When we come back online, drain the queue.
  useEffect(() => {
    const update = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        drainQueue(sendPing).then(({ drained, remaining }) => {
          setQueued(remaining);
          if (drained > 0) {
            toast.success(`${drained} ta GPS yozuvi serverga yuborildi`);
          }
        });
      }
    };
    setIsOnline(navigator.onLine);
    setQueued(queueSize());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // GPS tracking — ALWAYS ON regardless of shipment status.
  // Requests permission immediately and continuously tracks the driver's location.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      toast.error("Sizning qurilmangiz GPS qo'llab-quvvatlamaydi.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed: gpsSpeed } = pos.coords;
        const now = Date.now();

        if (!gpsReady) setGpsReady(true);

        // Prefer GPS-supplied speed (m/s) when available — most reliable.
        if (gpsSpeed !== null && gpsSpeed >= 0 && Number.isFinite(gpsSpeed)) {
          setSpeed(Math.round(gpsSpeed * 3.6));
        } else if (lastReadingRef.current) {
          // Fall back to deriving speed from the actual time delta. Cap at
          // 200 km/h so a single GPS jitter doesn't display 1000+ km/h.
          const prev = lastReadingRef.current;
          const dt = (now - prev.ts) / 1000; // seconds
          if (dt > 0.5) {
            const distKm = haversine([prev.lat, prev.lng], [latitude, longitude]);
            const kmh = (distKm / dt) * 3600;
            setSpeed(kmh < 200 && kmh >= 0 ? Math.round(kmh) : 0);
          }
        }
        lastReadingRef.current = { lat: latitude, lng: longitude, ts: now };

        setCurrentLat(latitude);
        setCurrentLng(longitude);

        if (activeShipment?.destinationLat && activeShipment?.destinationLng) {
          setDistanceRemaining(
            haversine(
              [latitude, longitude],
              [activeShipment.destinationLat, activeShipment.destinationLng],
            ),
          );
        }

        // Throttle backend updates to every 15 seconds
        if (now - lastSentRef.current > 15000) {
          lastSentRef.current = now;
          const ping: QueuedPing = { lat: latitude, lng: longitude, ts: now };
          if (!navigator.onLine) {
            enqueuePing(ping);
            setQueued(queueSize());
            return;
          }
          const ok = await sendPing(ping);
          if (!ok) {
            enqueuePing(ping);
            setQueued(queueSize());
          }
        }
      },
      (err) => {
        console.error('GPS Xatolik:', err);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('GPS ruxsati berilmadi. Iltimos, joylashuvga ruxsat bering.', { duration: 10000 });
        } else {
          toast.error('GPS joylashuvini aniqlashda xatolik yuz berdi.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
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

  function handleLogout() {
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = `/${locale}/admin-login`;
  }

  // --- Inline Toolbar (replaces header) ---
  const toolbar = (
    <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:px-0">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-800 leading-tight">DasPay Driver</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase">{username}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href={`/${locale}/driver/chat`}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
          title="Dispetcher bilan chat"
        >
          <MessageCircle className="w-4 h-4" />
        </Link>
        <PushButton compact />
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
          title="Chiqish"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (!truck) {
    return (
      <>
        {toolbar}
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Mashina biriktirilmagan</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Sizga hozircha hech qanday avtomobil biriktirilmagan. Iltimos, dispetcher bilan bog&apos;laning.
          </p>
        </div>
      </>
    );
  }

  if (!activeShipment) {
    return (
      <>
        {toolbar}
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
          {gpsReady && currentLat && currentLng && (
            <div className="mt-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-full text-left">
              <div className="text-xs font-semibold text-green-600 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> GPS faol
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Build Yandex Maps route URL
  const origin = encodeURIComponent(activeShipment.origin || '');
  const destination = encodeURIComponent(activeShipment.destination || '');
  const yandexMapUrl = `https://yandex.com/map-widget/v1/?rtext=${origin}~${destination}&rtt=auto&z=7`;
  const yandexNavUrl = `https://yandex.ru/maps/?rtext=${origin}~${destination}&rtt=auto`;
  const googleNavUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;

  const currentFlowItem = DRIVER_STATUS_FLOW.find(s => s.status === activeShipment.status) || DRIVER_STATUS_FLOW[0];
  const ActionIcon = currentFlowItem.icon;

  return (
    <div className="pb-28">
      {/* Inline Toolbar */}
      {toolbar}

      {/* Connection status banner — only shown when offline or queue has items */}
      {(!isOnline || queued > 0) && (
        <div
          className={`mx-4 mt-2 lg:mx-0 mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            !isOnline
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline rejimda — GPS yozuvlari saqlanmoqda ({queued})</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 shrink-0" />
              <span>{queued} ta GPS yozuvi yuborilishi kutilmoqda</span>
            </>
          )}
        </div>
      )}

      {/* Route Info Badge (Moved out of map so it doesn't overlap) */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4 mx-4 mt-2 lg:mx-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Hozirgi Marshrut</p>
            <p className="text-sm font-bold text-slate-800 truncate">{activeShipment.origin} → {activeShipment.destination}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
           <div className="flex-1 flex flex-col items-center justify-center">
             <div className="flex items-center gap-1 text-slate-500 mb-1"><Gauge className="w-3 h-3"/> <span className="text-[10px] font-bold uppercase">Tezlik</span></div>
             <div className="font-mono font-bold text-lg text-slate-800">{speed} <span className="text-xs font-medium text-slate-500">km/h</span></div>
           </div>
           <div className="w-px bg-slate-100"></div>
           <div className="flex-1 flex flex-col items-center justify-center">
             <div className="flex items-center gap-1 text-slate-500 mb-1"><Route className="w-3 h-3"/> <span className="text-[10px] font-bold uppercase">Masofa</span></div>
             <div className="font-mono font-bold text-lg text-slate-800">{distanceRemaining !== null ? distanceRemaining.toFixed(1) : '—'} <span className="text-xs font-medium text-slate-500">km</span></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 px-4 lg:px-0">
        <div className="space-y-4">
          {/* Yandex Maps Embedded Route */}
          <div className="h-[400px] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200">
            <iframe
              src={yandexMapUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              style={{ border: 0, display: 'block' }}
            />
          </div>

          {/* Open in Navigator buttons */}
          <div className="flex gap-2">
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
        </div>

        <div className="space-y-4">
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
                activeShipment.status === 'in_transit' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {STATUS_LABELS[activeShipment.status] || activeShipment.status.toUpperCase()}
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
        </div>

        {/* Documents/Photos */}
        <div className="px-4 lg:px-0 mt-4">
          <ShipmentDocuments
            shipmentId={activeShipment.id}
            defaultKind="photo"
            cameraCapture
            title="Yuk rasmlari va hujjatlar"
          />
        </div>

      {/* Action Buttons Footer (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe z-50">
        <div className="max-w-5xl mx-auto flex gap-3">
          <button
            onClick={() => handleStatusChange(currentFlowItem.nextStatus)}
            disabled={loading}
            className={`flex-1 text-white rounded-xl py-3.5 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${currentFlowItem.color}`}
          >
            {currentFlowItem.actionLabel} <ActionIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
