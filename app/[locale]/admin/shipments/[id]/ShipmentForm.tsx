'use client';

import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Train, Truck, Route, FileText, Package, ChevronDown, Check } from 'lucide-react';
import { createShipment, updateShipment, searchClientByPhone } from '@/app/actions/admin';
import { SHIPMENT_STATUSES, ShipmentStatusKey } from '@/lib/shipment-status';
import { StationAutocomplete } from '@/components/forms/StationAutocomplete';
import { resolveRouteGeometry } from '@/lib/map-utils';
import { CARGO_TYPES, isWagonCompatible } from '@/lib/cargo-wagon-compatibility';
import { OcrScanButton } from '@/components/shared/OcrScanButton';
import type { CmrFields } from '@/lib/ocr';
import dynamic from 'next/dynamic';
import { FormSection } from '@/components/forms/FormSection';

const LazyLocationPicker = lazy(() => import('./LocationPickerMap'));
const YandexRoutePicker = dynamic(() => import('./YandexRoutePicker'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse flex items-center justify-center rounded-xl border border-gray-200"><MapPin className="text-gray-400 w-8 h-8" /></div>
});

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

export function ShipmentForm({ initialData, allWagons = [], allTrucks = [] }: { initialData: any, allWagons?: any[], allTrucks?: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [transportMode, setTransportMode] = useState(
    initialData?.transportMode || 'train'
  );
  const [isRouting, setIsRouting] = useState(false);
  const [trackingCode, setTrackingCode] = useState(initialData?.trackingCode || '');

  useEffect(() => {
    if (!initialData?.trackingCode) {
      setTrackingCode('DP-' + Math.floor(100000 + Math.random() * 900000));
    }
  }, [initialData]);

  const [cargoType, setCargoType] = useState(initialData?.cargoType || 'general');
  const [weightStr, setWeightStr] = useState(initialData?.weight?.toString() || '');
  const [weightError, setWeightError] = useState('');

  const [selectedWagonIds, setSelectedWagonIds] = useState<number[]>(
    initialData?.wagons?.map((w: any) => w.id) || []
  );

  const [selectedTruckIds, setSelectedTruckIds] = useState<number[]>(
    initialData?.trucks?.map((t: any) => t.id) || []
  );

  // Station autocomplete state
  const [fromStation, setFromStation] = useState(initialData?.origin || '');
  const [toStation, setToStation] = useState(initialData?.destination || '');
  const fromStationRef = useRef<StationData | null>(null);
  const toStationRef = useRef<StationData | null>(null);

  // Truck origin/destination for Yandex Maps preview
  const [truckOrigin, setTruckOrigin] = useState(initialData?.origin || '');
  const [truckDest, setTruckDest] = useState(initialData?.destination || '');
  
  // Coordinates for map picker
  const [truckCoords, setTruckCoords] = useState<{originLat?: number; originLng?: number; destLat?: number; destLng?: number}>({
    originLat: initialData?.originLat || undefined,
    originLng: initialData?.originLng || undefined,
    destLat: initialData?.destinationLat || undefined,
    destLng: initialData?.destinationLng || undefined,
  });

  // Extract initial segments if saved, else empty
  const initialSegments = typeof initialData?.routeSegments === 'string' 
      ? JSON.parse(initialData.routeSegments) 
      : (Array.isArray(initialData?.routeSegments) ? initialData.routeSegments : []);

  const [segments, setSegments] = useState<any[]>(initialSegments);

  // Fetch client details to auto-fill company name
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClientPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setClientPhone(phone);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (phone.length >= 7) {
      setIsSearchingClient(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const res = await searchClientByPhone(phone);
        if (res.success && res.client?.companyName) {
           const senderEl = formRef.current?.querySelector<HTMLInputElement>('[name="senderName"]');
           const receiverEl = formRef.current?.querySelector<HTMLInputElement>('[name="receiverName"]');
           
           // Faqat bo'sh bo'lsa to'ldiramiz, shunda qo'lda yozilgan narsa o'chib ketmaydi
           if (senderEl && !senderEl.value) {
             const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(senderEl), 'value')?.set;
             setter?.call(senderEl, res.client.companyName);
             senderEl.dispatchEvent(new Event('input', { bubbles: true }));
           }
           if (receiverEl && !receiverEl.value) {
             const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(receiverEl), 'value')?.set;
             setter?.call(receiverEl, res.client.companyName);
             receiverEl.dispatchEvent(new Event('input', { bubbles: true }));
           }
        }
        setIsSearchingClient(false);
      }, 800);
    }
  };

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
      cargoType: transportMode === 'train' ? cargoType : undefined,
      description: formData.get('description') as string,
      routeSegments: JSON.parse(formData.get('routeSegments') as string || '[]'),
      transportMode,
      wagonIds: transportMode === 'train' ? selectedWagonIds : undefined,
      truckIds: transportMode === 'truck' ? selectedTruckIds : undefined,
      originLat: transportMode === 'truck' ? truckCoords.originLat : (fromStationRef.current?.lat || undefined),
      originLng: transportMode === 'truck' ? truckCoords.originLng : (fromStationRef.current?.lng || undefined),
      destinationLat: transportMode === 'truck' ? truckCoords.destLat : (toStationRef.current?.lat || undefined),
      destinationLng: transportMode === 'truck' ? truckCoords.destLng : (toStationRef.current?.lng || undefined),
    };

    // Client-side weight validation for wagons
    if (transportMode === 'train' && selectedWagonIds.length > 0 && data.weight) {
      const selectedWagonObjects = allWagons.filter(w => selectedWagonIds.includes(w.id));
      const totalCapacity = selectedWagonObjects.reduce((sum, w) => sum + w.capacity, 0);
      if (data.weight > totalCapacity) {
        setError(`Yuk og'irligi (${data.weight}t) vagonlar umumiy sig'imidan (${totalCapacity}t) oshib ketdi. Qo'shimcha vagon tanlang.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Client-side weight validation for trucks
    if (transportMode === 'truck' && selectedTruckIds.length > 0 && data.weight) {
      const selectedTruckObjects = allTrucks.filter(t => selectedTruckIds.includes(t.id));
      const totalCapacity = selectedTruckObjects.reduce((sum, t) => sum + t.capacity, 0);
      if (data.weight > totalCapacity) {
        setError(`Yuk og'irligi (${data.weight}t) avtomobillar umumiy sig'imidan (${totalCapacity}t) oshib ketdi. Qo'shimcha avtomobil tanlang.`);
        setIsSubmitting(false);
        return;
      }
    }

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

  const formRef = useRef<HTMLFormElement>(null);

  // Auto-fill from CMR scan. Sets uncontrolled inputs by name + the controlled
  // state we own here. Uses native input setter so React re-runs onChange.
  const applyCmrFields = (fields: CmrFields) => {
    const setUncontrolled = (name: string, value: string | undefined) => {
      if (!value || !formRef.current) return;
      const el = formRef.current.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="${name}"]`,
      );
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el),
        'value',
      )?.set;
      setter?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setUncontrolled('senderName', fields.senderName);
    setUncontrolled('receiverName', fields.receiverName);
    setUncontrolled('clientPhone', undefined); // CMR rarely has client phone
    setUncontrolled('description', fields.cargoDescription);
    if (fields.weightTons !== undefined) {
      setWeightStr(String(fields.weightTons));
    }
    if (transportMode === 'truck') {
      if (fields.origin) setTruckOrigin(fields.origin);
      if (fields.destination) setTruckDest(fields.destination);
    } else {
      if (fields.origin) setFromStation(fields.origin);
      if (fields.destination) setToStation(fields.destination);
    }
  };

  const hasBasicInfo = !!(trackingCode && clientPhone);
  const hasRoute = transportMode === 'train' ? !!(fromStation && toStation) : !!(truckOrigin && truckDest);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

      {/* OCR Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Hujjatdan avto-to&apos;ldirish.</span>{' '}
          CMR yoki yo&apos;l xatini skanlang — maydonlar to&apos;ldiriladi.
        </div>
        <OcrScanButton<CmrFields> kind="cmr" onExtracted={applyCmrFields} />
      </div>

      {/* ═══ SECTION 1: Asosiy ma'lumotlar ═══ */}
      <FormSection title="Asosiy ma'lumotlar" icon={<FileText className="h-4 w-4" />} defaultOpen={true} completed={hasBasicInfo}>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treking Kod</label>
          <input 
            required 
            name="trackingCode"
            value={trackingCode}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors opacity-60 cursor-not-allowed"
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
            {transportMode !== 'truck' && <option value="wagons_arrived">{SHIPMENT_STATUSES['wagons_arrived'].label.uz}</option>}
            <option value="loaded">{SHIPMENT_STATUSES['loaded'].label.uz}</option>
            <option value="docs_ready">{SHIPMENT_STATUSES['docs_ready'].label.uz}</option>
            <option value="customs_cleared">{SHIPMENT_STATUSES['customs_cleared'].label.uz}</option>
            <option value="in_transit">{SHIPMENT_STATUSES['in_transit'].label.uz}</option>
            {transportMode !== 'truck' && <option value="arrived_at_station">{SHIPMENT_STATUSES['arrived_at_station'].label.uz}</option>}
            <option value="delivered">{SHIPMENT_STATUSES['delivered'].label.uz}</option>
            <option value="unloaded">{SHIPMENT_STATUSES['unloaded'].label.uz}</option>
          </select>
        </div>
      </div>

      {/* Transport mode & Client Mapping */}
      <div className="grid md:grid-cols-2 gap-5 items-start">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Mijoz telefon raqami (Mapping)
            {isSearchingClient && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
          </label>
          <input 
            type="text"
            name="clientPhone"
            value={clientPhone}
            onChange={handleClientPhoneChange}
            placeholder="998901234567"
            className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1.5">Kiritganda korxona nomi avtomatik yuklanadi</p>
        </div>
      </div>

      {transportMode === 'train' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Yuk turi</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(CARGO_TYPES).map(([key, info]) => (
              <label 
                key={key} 
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  cargoType === key ? 'border-[#185FA5] bg-blue-50 ring-1 ring-[#185FA5]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input 
                    type="radio" 
                    name="cargoType_radio"
                    checked={cargoType === key} 
                    onChange={() => setCargoType(key)}
                    className="text-[#185FA5] focus:ring-[#185FA5]"
                  />
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-semibold text-sm text-gray-900">{info.label.uz}</span>
                </div>
                <span className="text-[10px] text-gray-500 pl-6 leading-tight">{info.description.uz}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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
      </FormSection>

      {/* ═══ SECTION 2: Marshrut & Transport ═══ */}
      <FormSection title={transportMode === 'train' ? 'Marshrut va Vagonlar' : 'Marshrut va Avtomobillar'} icon={<Route className="h-4 w-4" />} defaultOpen={!hasBasicInfo || !hasRoute} completed={hasRoute} badge={transportMode === 'train' ? 'Temir yo\'l' : 'Avtomobil'}>

      {/* Origin / Destination */}
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

          {/* Wagons Selector */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Yukga biriktirilgan vagonlar</label>
              {selectedWagonIds.length > 0 && (
                <div className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">
                  Tanlandi: {selectedWagonIds.length} ta (Jami sig'im: {allWagons.filter(w => selectedWagonIds.includes(w.id)).reduce((sum, w) => sum + w.capacity, 0)}t)
                </div>
              )}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
              {allWagons.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-2">Faol vagonlar topilmadi. Avval bazaga vagon qo&apos;shing.</div>
              ) : (
                [...allWagons].sort((a: any, b: any) => {
                  const aSelected = selectedWagonIds.includes(a.id);
                  const bSelected = selectedWagonIds.includes(b.id);
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;

                  const originStationId = fromStationRef.current?.id;
                  const aNear = a.currentStationId === originStationId && originStationId != null;
                  const bNear = b.currentStationId === originStationId && originStationId != null;
                  if (aNear && !bNear) return -1;
                  if (!aNear && bNear) return 1;
                  return 0;
                }).map((w: any) => {
                  const isChecked = selectedWagonIds.includes(w.id);
                  const busyShipments = (w.shipments || []).filter(
                    (s: any) => !initialData || s.id !== initialData.id
                  );
                  const isBusy = busyShipments.length > 0;
                  const busyInfo = isBusy ? busyShipments[0] : null;
                  const isCompatible = isWagonCompatible(w.type, cargoType);
                  const isNear = fromStationRef.current?.id != null && w.currentStationId === fromStationRef.current.id;

                  return (
                    <label 
                      key={w.id} 
                      className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                        isBusy 
                          ? 'bg-red-50 border-red-200 opacity-70 cursor-not-allowed' 
                          : !isCompatible && !isChecked
                            ? 'bg-gray-50 border-gray-200 opacity-50 grayscale cursor-not-allowed'
                            : isChecked 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'hover:bg-slate-50 border-transparent'
                      }`}
                      title={!isCompatible ? `Bu vagon ${CARGO_TYPES[cargoType as keyof typeof CARGO_TYPES]?.label.uz} uchun mos emas` : ''}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded text-[#185FA5] focus:ring-[#185FA5]"
                        checked={isChecked}
                        disabled={isBusy || (!isCompatible && !isChecked)}
                        onChange={(e) => {
                          if (isBusy || (!isCompatible && !isChecked)) return;
                          if (e.target.checked) setSelectedWagonIds([...selectedWagonIds, w.id]);
                          else setSelectedWagonIds(selectedWagonIds.filter(id => id !== w.id));
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{w.number}</div>
                          {isNear && !isBusy && (
                            <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded whitespace-nowrap">📍 Eng yaqin</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{w.type} · {w.capacity}t</div>
                      </div>
                      {isBusy && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          🔒 Band ({busyInfo?.trackingCode})
                        </span>
                      )}
                      {!isCompatible && !isBusy && !isChecked && (
                        <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Mos emas
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            {weightError && (
              <p className="mt-2 text-sm text-red-600 font-medium">{weightError}</p>
            )}
          </div>

          {/* Rail Map */}
          {segments.length >= 2 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" /> Marshrut xaritasi
              </h4>
              <div className="relative" style={{ zIndex: 0, isolation: 'isolate' }}>
                <DynamicLocationPicker segments={segments} setSegments={setSegments} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jo&apos;natish manzili</label>
              <input 
                required 
                name="origin"
                value={truckOrigin}
                onChange={(e) => setTruckOrigin(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Davlat, Shahar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yetkazib berish manzili</label>
              <input 
                required 
                name="destination"
                value={truckDest}
                onChange={(e) => setTruckDest(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Trucks Selector */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Yukga biriktirilgan avtomobillar</label>
              {selectedTruckIds.length > 0 && (
                <div className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">
                  Tanlandi: {selectedTruckIds.length} ta (Jami sig'im: {allTrucks.filter(t => selectedTruckIds.includes(t.id)).reduce((sum, t) => sum + t.capacity, 0)}t)
                </div>
              )}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
              {allTrucks.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-2">Faol avtomobillar topilmadi. Avval bazaga avtomobil qo&apos;shing.</div>
              ) : (
                [...allTrucks].sort((a: any, b: any) => {
                  const aSelected = selectedTruckIds.includes(a.id);
                  const bSelected = selectedTruckIds.includes(b.id);
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;
                  return 0;
                }).map((t: any) => {
                  const isChecked = selectedTruckIds.includes(t.id);
                  const busyShipments = (t.shipments || []).filter(
                    (s: any) => !initialData || s.id !== initialData.id
                  );
                  const isBusy = busyShipments.length > 0;
                  const busyInfo = isBusy ? busyShipments[0] : null;

                  return (
                    <label 
                      key={t.id} 
                      className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                        isBusy 
                          ? 'bg-red-50 border-red-200 opacity-70 cursor-not-allowed' 
                          : isChecked 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded text-[#185FA5] focus:ring-[#185FA5]"
                        checked={isChecked}
                        disabled={isBusy}
                        onChange={(e) => {
                          if (isBusy) return;
                          if (e.target.checked) setSelectedTruckIds([...selectedTruckIds, t.id]);
                          else setSelectedTruckIds(selectedTruckIds.filter(id => id !== t.id));
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900 border border-gray-200 px-2 py-0.5 rounded bg-gray-50">{t.plateNumber}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{t.model} · {t.capacity}t</div>
                      </div>
                      {isBusy && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          🔒 Band ({busyInfo?.trackingCode})
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Yandex Maps Location Picker + Route */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-[#042C53] flex items-center gap-2">
              <Route className="h-4 w-4 text-[#185FA5]" />
              Xaritadan manzil tanlash (Yandex Maps)
            </h4>
            <YandexRoutePicker
              originLat={truckCoords.originLat}
              originLng={truckCoords.originLng}
              destLat={truckCoords.destLat}
              destLng={truckCoords.destLng}
              onChange={(c) => setTruckCoords(c)}
              onAddressResolved={(type, address) => {
                if (type === 'origin' && address) setTruckOrigin(address);
                if (type === 'dest' && address) setTruckDest(address);
              }}
            />
          </div>


        </div>
      )}

      <div className="max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Og&apos;irligi (tonna)</label>
          <input 
            type="number"
            step="0.01"
            name="weight"
            value={weightStr}
            onChange={(e) => {
              setWeightStr(e.target.value);
              const w = parseFloat(e.target.value);
              if (transportMode === 'train' && selectedWagonIds.length > 0 && w) {
                const selectedWagonObjects = allWagons.filter(wg => selectedWagonIds.includes(wg.id));
                const totalCapacity = selectedWagonObjects.reduce((sum, wg) => sum + wg.capacity, 0);
                if (w > totalCapacity) {
                  setWeightError(`⚠️ Yuk og'irligi (${w}t) vagonlar sig'imidan (${totalCapacity}t) oshdi.`);
                } else {
                  setWeightError('');
                }
              } else if (transportMode === 'truck' && selectedTruckIds.length > 0 && w) {
                const selectedTruckObjects = allTrucks.filter(tr => selectedTruckIds.includes(tr.id));
                const totalCapacity = selectedTruckObjects.reduce((sum, tr) => sum + tr.capacity, 0);
                if (w > totalCapacity) {
                  setWeightError(`⚠️ Yuk og'irligi (${w}t) avtomobillar sig'imidan (${totalCapacity}t) oshdi.`);
                } else {
                  setWeightError('');
                }
              } else {
                setWeightError('');
              }
            }}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
      </FormSection>

      {/* ═══ SECTION 3: Qo'shimcha ═══ */}
      <FormSection title="Qo'shimcha izoh" icon={<Package className="h-4 w-4" />} defaultOpen={false}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Qo&apos;shimcha izoh yoki tovar haqida</label>
        <textarea 
          name="description"
          rows={3}
          defaultValue={initialData?.description}
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        ></textarea>
      </div>
      </FormSection>

      {/* Hidden fields */}
      <input type="hidden" name="routeSegments" value={JSON.stringify(segments)} />

      {/* FOOTER */}
      <div className="sticky bottom-0 z-[999] -mx-6 md:-mx-8 mt-6 border-t border-slate-200 bg-white px-6 md:px-8 py-4 flex items-center justify-end gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Saqlash' : 'Kiritish'}
        </button>
      </div>
    </form>
  );
}
