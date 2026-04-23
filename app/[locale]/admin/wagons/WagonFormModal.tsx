'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Loader2, MapPin, User } from 'lucide-react';
import { createWagon, updateWagon } from '@/app/actions/wagons';
import { WAGON_STATUSES, WagonStatusKey } from '@/lib/wagon-status';

interface Wagon {
  id?: number;
  number: string;
  type: string;
  capacity: number;
  status: string;
  currentLat?: number | null;
  currentLng?: number | null;
  currentStationId?: number | null;
  assignedToId?: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wagon: Wagon | null;
  stations?: any[];
}

const WAGON_TYPES = [
  'Yopiq vagon (Kritiy)',
  'Yarim ochiq vagon (Poluvagon)',
  'Platforma',
  'Sisterna',
  'Xopper',
  'Refrijerator',
  'Boshqa'
];

export function WagonFormModal({ isOpen, onClose, wagon, users = [], stations = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [number, setNumber] = useState('');
  const [type, setType] = useState('Yopiq vagon (Kritiy)');
  const [customType, setCustomType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('available');
  const [currentStationId, setCurrentStationId] = useState<string>('');

  useEffect(() => {
    if (wagon) {
      setNumber(wagon.number);
      if (WAGON_TYPES.includes(wagon.type)) {
        setType(wagon.type);
        setCustomType('');
      } else {
        setType('Boshqa');
        setCustomType(wagon.type);
      }
      setCapacity(wagon.capacity.toString());
      setStatus(wagon.status || 'available');
      setCurrentStationId(wagon.currentStationId?.toString() || '');
    } else {
      setNumber('');
      setType('Yopiq vagon (Kritiy)');
      setCustomType('');
      setCapacity('');
      setStatus('available');
      setCurrentStationId('');
    }
    setError(null);
  }, [wagon, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cap = parseFloat(capacity);
    if (!number.trim() || isNaN(cap)) {
      setError("Iltimos, barcha maydonlarni to'g'ri to'ldiring.");
      return;
    }

    const finalType = type === 'Boshqa' ? customType.trim() : type;
    if (!finalType) {
      setError("Vagon turini kiriting.");
      return;
    }

    startTransition(async () => {
      const data = { 
        number: number.trim(), 
        type: finalType, 
        capacity: cap, 
        status,
        currentStationId: currentStationId ? parseInt(currentStationId) : undefined,
      };
      
      let res;
      if (wagon?.id) {
        res = await updateWagon(wagon.id, data);
      } else {
        res = await createWagon(data);
      }

      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setError(res.error || 'Xatolik yuz berdi');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {wagon ? 'Vagonni tahrirlash' : 'Yangi vagon qo\'shish'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form id="wagon-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Vagon raqami
                </label>
                <input
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="Masalan: 54321678"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Sig'im (tonna)
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="68.0"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Vagon turi
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
              >
                {WAGON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {type === 'Boshqa' && (
                <input
                  required
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="Vagon turini kiriting..."
                />
              )}
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Hozirgi stansiya (Ixtiyoriy)
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

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="wagon-form"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#185FA5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#042C53] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {wagon ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </div>
      </div>
    </div>
  );
}
