'use client';

import { Navigation, Gauge, Clock, CalendarDays, MapPin, StopCircle, SquareArrowOutUpRight } from 'lucide-react';
import { haversine } from '@/lib/map-utils';
import dynamic from 'next/dynamic';

const AdminMapClient = dynamic(() => import('./AdminMapClient'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-2xl border border-gray-200">Xarita yuklanmoqda...</div>
});

const YandexTrackingMap = dynamic(() => import('./YandexTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-2xl border border-gray-200">Yandex Maps yuklanmoqda...</div>
});

interface LogEntry {
  lat: number;
  lng: number;
  speed: number | null;
  isStop: boolean;
  createdAt: string;
}

export default function AdminShipmentMap({ 
  shipmentId,
  logs,
  origin,
  destination,
  transportMode = 'train',
  routeSegments = []
}: { 
  shipmentId: number;
  logs: LogEntry[];
  origin?: string;
  destination?: string;
  transportMode?: string;
  routeSegments?: any[];
}) {
  if (!logs || logs.length === 0) return null;

  // Calculate total distance from GPS trail
  let totalDistanceKm = 0;
  for (let i = 1; i < logs.length; i++) {
    totalDistanceKm += haversine([logs[i-1].lat, logs[i-1].lng], [logs[i].lat, logs[i].lng]);
  }

  // Calculate stats
  const totalLogs = logs.length;
  const stopLogs = logs.filter(l => l.isStop);
  const stops = stopLogs.length;
  const speeds = logs.map(l => l.speed || 0).filter(s => s > 0);
  const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
  const maxSpeed = speeds.length > 0 ? Math.round(Math.max(...speeds)) : 0;
  
  const points: [number, number][] = logs.map(l => [l.lat, l.lng]);
  const stopPoints: [number, number][] = stopLogs.map(l => [l.lat, l.lng]);
  const start = logs[0];
  const end = logs[logs.length - 1];

  // Total duration
  const durationMs = new Date(end.createdAt).getTime() - new Date(start.createdAt).getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  // Stop duration estimation (each stop log ~ 15-30 seconds)
  const stopDurationMins = Math.round(stops * 0.5); // ~30s per log entry

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
          <Navigation className="w-5 h-5 text-blue-600" /> Haydovchi marshrut tarixi (GPS Tracking)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            {totalLogs} ta GPS nuqta
          </span>
          {origin && destination && (
            <a 
              href={`https://yandex.ru/maps/?rtext=${encodeURIComponent(origin)}~${encodeURIComponent(destination)}&rtt=auto`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <SquareArrowOutUpRight className="w-3 h-3" /> Yandex Maps
            </a>
          )}
        </div>
      </div>

      {/* GPS Trail Map */}
      <div className="h-96 w-full relative">
        {transportMode === 'truck' ? (
          <YandexTrackingMap 
            points={points} 
            stopPoints={stopPoints} 
            origin={origin} 
            destination={destination} 
          />
        ) : (
          <AdminMapClient 
            points={points} 
            stopPoints={stopPoints} 
            routeSegments={routeSegments} 
          />
        )}
      </div>

      {/* Detailed Stats Grid */}
      <div className="p-4 bg-slate-50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Navigation className="w-3 h-3"/> Bosib o'tilgan</div>
          <div className="font-mono text-xl font-bold text-slate-800">{totalDistanceKm.toFixed(1)} <span className="text-xs text-slate-500 font-medium">km</span></div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Gauge className="w-3 h-3"/> O'rtacha tezlik</div>
          <div className="font-mono text-xl font-bold text-slate-800">{avgSpeed} <span className="text-xs text-slate-500 font-medium">km/h</span></div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Gauge className="w-3 h-3"/> Max tezlik</div>
          <div className="font-mono text-xl font-bold text-slate-800">{maxSpeed} <span className="text-xs text-slate-500 font-medium">km/h</span></div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><StopCircle className="w-3 h-3"/> To'xtashlar</div>
          <div className="font-mono text-xl font-bold text-slate-800">{stops} <span className="text-xs text-slate-500 font-medium">marta</span></div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Umumiy vaqt</div>
          <div className="font-mono text-xl font-bold text-slate-800">{durationHours}<span className="text-xs text-slate-500 font-medium">s</span> {durationMins}<span className="text-xs text-slate-500 font-medium">d</span></div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Boshlangan</div>
          <div className="text-sm font-bold text-slate-800">{new Date(start.createdAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* Detailed Stop Log Table */}
      {stopLogs.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <StopCircle className="w-4 h-4 text-red-500" /> To'xtash joylari (batafsil)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase">
                  <th className="text-left py-2 px-3 rounded-l-lg">#</th>
                  <th className="text-left py-2 px-3">Koordinata</th>
                  <th className="text-left py-2 px-3">Vaqt</th>
                  <th className="text-left py-2 px-3 rounded-r-lg">Xaritada</th>
                </tr>
              </thead>
              <tbody>
                {stopLogs.slice(0, 20).map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-600">{i + 1}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</td>
                    <td className="py-2 px-3 text-slate-600">{new Date(s.createdAt).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td className="py-2 px-3">
                      <a 
                        href={`https://yandex.ru/maps/?pt=${s.lng},${s.lat}&z=17&l=map`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Ko'rish
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stopLogs.length > 20 && (
              <p className="text-xs text-slate-400 mt-2 text-center">... va yana {stopLogs.length - 20} ta to'xtash</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
