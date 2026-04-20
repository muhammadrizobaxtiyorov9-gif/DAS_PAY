'use client';

import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Train, Truck, Route } from 'lucide-react';
import { createShipment, updateShipment } from '@/app/actions/admin';
import { SHIPMENT_STATUSES, ShipmentStatusKey } from '@/lib/shipment-status';
import { StationAutocomplete } from '@/components/forms/StationAutocomplete';
import { resolveRouteGeometry } from '@/lib/map-utils';

const LazyLocationPicker = lazy(() => import('./LocationPickerMap'));

interface StationData {
  id: number;
  code: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

function MapLoader() {
  return (
    <div className="h-[400px] w-full bg-gray-100 animate-pulse flex items-center justify-center rounded-xl border border-gray-200">
      <MapPin className="text-gray-400 w-8 h-8" />
    </div>
  );
}

function DynamicLocationPicker(props: { segments: any[]; setSegments: (val: any[]) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <MapLoader />;
  return (
    <Suspense fallback={<MapLoader />}>
      <LazyLocationPicker {...props} />
    </Suspense>
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ShipmentForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [transportMode, setTransportMode] = useState(
    initialData?.transportMode || 'train'
  );
  const [isRouting, setIsRouting] = useState(false);

  // Station autocomplete state
  const [fromStation, setFromStation] = useState(initialData?.origin || '');
  const [toStation, setToStation] = useState(initialData?.destination || '');
  const fromStationRef = useRef<StationData | null>(null);
  const toStationRef = useRef<StationData | null>(null);

  // Extract initial segments if saved, else empty
  const initialSegments = typeof initialData?.routeSegments === 'string' 
      ? JSON.parse(initialData.routeSegments) 
      : (Array.isArray(initialData?.routeSegments) ? initialData.routeSegments : []);

  const [segments, setSegments] = useState<any[]>(initialSegments);

  // Auto-build railway route when both stations are selected
  const buildRailRoute = useCallback(async (from: StationData, to: StationData) => {
    if (!from.lat || !from.lng || !to.lat || !to.lng) return;

    setIsRouting(true);
    try {
      const startPoint: [number, number] = [from.lat, from.lng];
      const endPoint: [number, number] = [to.lat, to.lng];
      const geometry = await resolveRouteGeometry(startPoint, endPoint, 'train');

      const newSegments = [
        {
          id: uid(),
          lat: from.lat,
          lng: from.lng,
          mode: 'start' as const,
          label: from.nameUz,
        },
        {
          id: uid(),
          lat: to.lat,
          lng: to.lng,
          mode: 'train' as const,
          osrmGeometry: geometry,
          label: to.nameUz,
        },
      ];
      setSegments(newSegments);
    } catch {
      // fallback: straight line
      setSegments([
        { id: uid(), lat: from.lat, lng: from.lng, mode: 'start', label: from.nameUz },
        { id: uid(), lat: to.lat, lng: to.lng, mode: 'train', label: to.nameUz },
      ]);
    } finally {
      setIsRouting(false);
    }
  }, []);

  const handleFromStationSelect = useCallback((s: StationData | null) => {
    if (s) {
      setFromStation(s.nameUz);
      fromStationRef.current = s;
      if (toStationRef.current) {
        buildRailRoute(s, toStationRef.current);
      }
    } else {
      setFromStation('');
      fromStationRef.current = null;
    }
  }, [buildRailRoute]);

  const handleToStationSelect = useCallback((s: StationData | null) => {
    if (s) {
      setToStation(s.nameUz);
      toStationRef.current = s;
      if (fromStationRef.current) {
        buildRailRoute(fromStationRef.current, s);
      }
    } else {
      setToStation('');
      toStationRef.current = null;
    }
  }, [buildRailRoute]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      trackingCode: formData.get('trackingCode') as string,
      senderName: formData.get('senderName') as string,
      receiverName: formData.get('receiverName') as string,
      origin: transportMode === 'train' ? fromStation : (formData.get('origin') as string),
      destination: transportMode === 'train' ? toStation : (formData.get('destination') as string),
      status: formData.get('status') as string,
      clientPhone: formData.get('clientPhone') as string || undefined,
      weight: parseFloat(formData.get('weight') as string) || undefined,
      description: formData.get('description') as string,
      routeSegments: JSON.parse(formData.get('routeSegments') as string || '[]'),
      transportMode,
    };

    let result;
    if (initialData) {
      result = await updateShipment(initialData.id, data);
    } else {
      result = await createShipment(data);
    }

    if (result.success) {
      router.push('/uz/admin/shipments');
    } else {
      setError(result.error || 'Serverda xatolik yuz berdi');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treking Kod</label>
          <input 
            required 
            name="trackingCode"
            defaultValue={initialData?.trackingCode}
            readOnly={!!initialData}
            className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${!!initialData && 'opacity-60 cursor-not-allowed'}`}
            placeholder="Masalan: DP-12345"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Holati (Status)</label>
          <select 
            name="status"
            defaultValue={initialData?.status || 'pending'}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="pending">{SHIPMENT_STATUSES['pending'].label.uz}</option>
            <option value="wagons_arrived">{SHIPMENT_STATUSES['wagons_arrived'].label.uz}</option>
            <option value="loaded">{SHIPMENT_STATUSES['loaded'].label.uz}</option>
            <option value="docs_ready">{SHIPMENT_STATUSES['docs_ready'].label.uz}</option>
            <option value="customs_cleared">{SHIPMENT_STATUSES['customs_cleared'].label.uz}</option>
            <option value="in_transit">{SHIPMENT_STATUSES['in_transit'].label.uz}</option>
            <option value="arrived_at_station">{SHIPMENT_STATUSES['arrived_at_station'].label.uz}</option>
            <option value="delivered">{SHIPMENT_STATUSES['delivered'].label.uz}</option>
            <option value="unloaded">{SHIPMENT_STATUSES['unloaded'].label.uz}</option>
          </select>
        </div>
      </div>

      {/* Transport mode selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Transport turi</label>
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => setTransportMode('train')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              transportMode === 'train'
                ? 'bg-[#042C53] text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white'
            }`}
          >
            <Train className="h-4 w-4" /> Temir yo&apos;l
          </button>
          <button
            type="button"
            onClick={() => setTransportMode('truck')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              transportMode === 'truck'
                ? 'bg-[#185FA5] text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white'
            }`}
          >
            <Truck className="h-4 w-4" /> Avtomobil
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jo&apos;natuvchi</label>
          <input 
            required 
            name="senderName"
            defaultValue={initialData?.senderName}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qabul qiluvchi</label>
          <input 
            required 
            name="receiverName"
            defaultValue={initialData?.receiverName}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Origin / Destination — Station autocomplete for rail, text for road */}
      {transportMode === 'train' ? (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-5 p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
            <div>
              <StationAutocomplete
                label="Jo'nash stansiyasi"
                placeholder="Stansiya nomi yoki kodi"
                value={fromStation}
                onSelect={handleFromStationSelect}
              />
            </div>
            <div>
              <StationAutocomplete
                label="Borish stansiyasi"
                placeholder="Stansiya nomi yoki kodi"
                value={toStation}
                onSelect={handleToStationSelect}
              />
            </div>
          </div>

          {/* Routing status indicator */}
          {isRouting && (
            <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Temir yo&apos;l marshruti hisoblanmoqda...</span>
            </div>
          )}

          {/* Route ready indicator */}
          {!isRouting && segments.length >= 2 && fromStationRef.current && toStationRef.current && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Route className="h-4 w-4" />
              <span className="font-medium">
                Marshrut tayyor: {fromStationRef.current.nameUz} → {toStationRef.current.nameUz}
              </span>
              <span className="ml-auto text-xs text-emerald-500">
                {segments.length} nuqta · Temir yo&apos;l
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jo&apos;natish manzili</label>
            <input 
              required 
              name="origin"
              defaultValue={initialData?.origin}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Davlat, Shahar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yetkazib berish manzili</label>
            <input 
              required 
              name="destination"
              defaultValue={initialData?.destination}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Og&apos;irligi (tonna)</label>
          <input 
            type="number"
            step="0.01"
            name="weight"
            defaultValue={initialData?.weight}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">Mijoz telefon raqami (Mapping)</label>
          <input 
            type="text"
            name="clientPhone"
            defaultValue={initialData?.clientPhone || ''}
            placeholder="998901234567"
            className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-xs text-gray-500 mt-2">Mijoz kabinetiga avtomatik ulanadi</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h4 className="font-bold text-lg text-[#042C53] flex items-center gap-2">
          <Route className="h-5 w-5 text-[#185FA5]" />
          Xarita bo&apos;ylab marshrut (Vizual)
        </h4>
        <p className="text-xs text-gray-500">
          {transportMode === 'train' 
            ? "Stansiyalar tanlanganda marshrut avtomatik chiziladi. Qo'shimcha nuqtalar qo'shish uchun xaritadan bosing."
            : "Xaritadan nuqtalar tanlang yoki qidiruv orqali manzilni toping."
          }
        </p>
        
        {/* Hidden inputs to pass state to FormData */}
        <input type="hidden" name="routeSegments" value={JSON.stringify(segments)} />

        <DynamicLocationPicker 
           segments={segments} 
           setSegments={setSegments}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Qo&apos;shimcha izoh yoki tovar haqida</label>
        <textarea 
          name="description"
          rows={3}
          defaultValue={initialData?.description}
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        ></textarea>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Saqlash' : 'Kiritish'}
        </button>
      </div>
    </form>
  );
}
