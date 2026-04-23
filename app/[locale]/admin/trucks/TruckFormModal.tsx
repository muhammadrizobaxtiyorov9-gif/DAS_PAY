'use client';

import { useState, useEffect, useTransition } from 'react';
import { X, Truck, Save, AlertCircle, User, MapPin } from 'lucide-react';
import { createTruck, updateTruck } from '@/app/actions/trucks';
import { useRouter } from 'next/navigation';
import { WAGON_STATUSES } from '@/lib/wagon-status';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  truck?: any | null;
  drivers: any[];
  stations: any[];
}

export function TruckFormModal({ isOpen, onClose, truck, drivers = [], stations = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('available');
  const [driverId, setDriverId] = useState('');
  const [currentStationId, setCurrentStationId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (truck) {
        setPlateNumber(truck.plateNumber || '');
        setModel(truck.model || '');
        setCapacity(truck.capacity?.toString() || '');
        setStatus(truck.status || 'available');
        setDriverId(truck.driver?.id?.toString() || '');
        setCurrentStationId(truck.currentStation?.id?.toString() || '');
      } else {
        setPlateNumber('');
        setModel('');
        setCapacity('');
        setStatus('available');
        setDriverId('');
        setCurrentStationId('');
      }
      setError(null);
    }
  }, [isOpen, truck]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      plateNumber,
      model,
      capacity: parseFloat(capacity) || 0,
      status,
      driverId: driverId ? parseInt(driverId) : undefined,
      currentStationId: currentStationId ? parseInt(currentStationId) : undefined,
    };

    startTransition(async () => {
      const res = truck
        ? await updateTruck(truck.id, payload)
        : await createTruck(payload);

      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setError(res.error || 'Xatolik yuz berdi');
      }
    });
  }

  const isLocked = truck?.lockedByShipmentId != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {truck ? 'Mashinani tahrirlash' : 'Yangi mashina qo\'shish'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Avtoparkingizga yuk mashinasi qo'shing yoki tahrirlang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="truck-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
            
            {isLocked && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm font-medium text-amber-800">
                  <p>Bu mashina ayni vaqtda yukka biriktirilgan.</p>
                  <p className="text-xs opacity-80 mt-1">Siz faqat uning texnik holatini o'zgartirishingiz mumkin (Masalan: Remontga tushdi).</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Davlat raqami
                </label>
                <input
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm uppercase transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="Masalan: 01 A 123 AA"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Modeli
                </label>
                <input
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="Masalan: Volvo FH16"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Yuk ko'tarish sig'imi (tonna)
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="Masalan: 22.5"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <User className="w-4 h-4 text-slate-400" /> Haydovchi
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                >
                  <option value="">-- Haydovchi biriktirilmagan --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name || d.username}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Texnik holati (Status)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(WAGON_STATUSES)
                  .filter(([k]) => ['available', 'needs_repair', 'maintenance'].includes(k))
                  .map(([key, info]) => (
                  <label 
                    key={key}
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                      status === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="status" 
                      value={key} 
                      checked={status === key} 
                      onChange={() => setStatus(key)} 
                      className="hidden" 
                    />
                    <span className="text-sm">{info.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 leading-tight">{info.label.uz}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" /> Hozirgi joylashuvi (Stansiya/Baza)
              </label>
              <select
                value={currentStationId}
                onChange={(e) => setCurrentStationId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
              >
                <option value="">-- Stansiya tanlanmagan --</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.nameUz} ({s.code})</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="truck-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0A3D6E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="animate-spin text-lg leading-none">⚙</span>
            ) : (
              <Save className="h-4 w-4" />
            )}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
