'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import { createShipment, updateShipment } from '@/app/actions/admin';

const LazyLocationPicker = lazy(() => import('./LocationPickerMap'));

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

export function ShipmentForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Extract initial segments if saved, else empty
  const initialSegments = typeof initialData?.routeSegments === 'string' 
      ? JSON.parse(initialData.routeSegments) 
      : (Array.isArray(initialData?.routeSegments) ? initialData.routeSegments : []);

  const [segments, setSegments] = useState<any[]>(initialSegments);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      trackingCode: formData.get('trackingCode') as string,
      senderName: formData.get('senderName') as string,
      receiverName: formData.get('receiverName') as string,
      origin: formData.get('origin') as string,
      destination: formData.get('destination') as string,
      status: formData.get('status') as string,
      clientPhone: formData.get('clientPhone') as string || undefined,
      weight: parseFloat(formData.get('weight') as string) || undefined,
      description: formData.get('description') as string,
      routeSegments: JSON.parse(formData.get('routeSegments') as string || '[]')
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
            <option value="pending">Kutilmoqda</option>
            <option value="in_transit">Yo'lda (Tranzit)</option>
            <option value="customs">Bojxonada</option>
            <option value="delivered">Yetkazildi</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jo'natuvchi</label>
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

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jo'natish manzili</label>
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

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Og'irligi (kg)</label>
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
        <h4 className="font-bold text-lg text-[#042C53] flex items-center gap-2">Xarita bo'ylab marshrut (Vizual)</h4>
        
        {/* Hidden inputs to pass state to FormData */}
        <input type="hidden" name="routeSegments" value={JSON.stringify(segments)} />

        <DynamicLocationPicker 
           segments={segments} 
           setSegments={setSegments}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Qo'shimcha izoh yoki tovar haqida</label>
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
