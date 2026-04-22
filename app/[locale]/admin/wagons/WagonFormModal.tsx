'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { createWagon, updateWagon } from '@/app/actions/wagons';

interface Wagon {
  id?: number;
  number: string;
  type: string;
  capacity: number;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wagon: Wagon | null;
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

export function WagonFormModal({ isOpen, onClose, wagon }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [number, setNumber] = useState('');
  const [type, setType] = useState('Yopiq vagon (Kritiy)');
  const [customType, setCustomType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('active');

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
      setStatus(wagon.status);
    } else {
      setNumber('');
      setType('Yopiq vagon (Kritiy)');
      setCustomType('');
      setCapacity('');
      setStatus('active');
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
      const data = { number: number.trim(), type: finalType, capacity: cap, status };
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-xl font-bold text-slate-900">
          {wagon ? 'Vagonni tahrirlash' : 'Yangi vagon qo\'shish'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Vagon raqami
            </label>
            <input
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-4 focus:ring-[#185FA5]/10"
              placeholder="Masalan: 54321678"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Vagon turi
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-4 focus:ring-[#185FA5]/10"
            >
              {WAGON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {type === 'Boshqa' && (
              <input
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-4 focus:ring-[#185FA5]/10"
                placeholder="Vagon turini kiriting..."
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Yuk ko'tarish qobiliyati (tonna)
            </label>
            <input
              required
              type="number"
              step="0.1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#185FA5] focus:outline-none focus:ring-4 focus:ring-[#185FA5]/10"
              placeholder="Masalan: 68.0"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Holati
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-[#185FA5] focus:ring-[#185FA5]"
                />
                Soz (Faol)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="maintenance"
                  checked={status === 'maintenance'}
                  onChange={() => setStatus('maintenance')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                Remont talab etiladi
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#042C53] transition-colors disabled:opacity-70"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
