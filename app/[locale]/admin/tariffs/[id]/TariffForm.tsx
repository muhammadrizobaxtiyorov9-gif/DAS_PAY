'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createTariff, updateTariff, type TariffInput } from '@/app/actions/admin';

interface TariffModel {
  id: number;
  name: string;
  originCountry: string;
  originCity: string | null;
  destCountry: string;
  destCity: string | null;
  mode: string;
  pricePerKg: number;
  baseFee: number;
  minWeight: number;
  currency: string;
  transitDays: number | null;
  notes: string | null;
  active: boolean;
}

export function TariffForm({ initialData }: { initialData: TariffModel | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload: TariffInput = {
      name: String(fd.get('name') || '').trim(),
      originCountry: String(fd.get('originCountry') || '').trim(),
      originCity: String(fd.get('originCity') || '').trim() || null,
      destCountry: String(fd.get('destCountry') || '').trim(),
      destCity: String(fd.get('destCity') || '').trim() || null,
      mode: String(fd.get('mode') || 'truck'),
      pricePerKg: parseFloat(String(fd.get('pricePerKg') || '0')) || 0,
      baseFee: parseFloat(String(fd.get('baseFee') || '0')) || 0,
      minWeight: parseFloat(String(fd.get('minWeight') || '0')) || 0,
      currency: String(fd.get('currency') || 'USD'),
      transitDays: fd.get('transitDays') ? parseInt(String(fd.get('transitDays'))) : null,
      notes: String(fd.get('notes') || '').trim() || null,
      active: fd.get('active') === 'on',
    };

    const result = initialData
      ? await updateTariff(initialData.id, payload)
      : await createTariff(payload);

    if (result.success) {
      router.push('/uz/admin/tariffs');
      router.refresh();
    } else {
      setError(result.error || 'Xatolik yuz berdi');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nom (label)</label>
        <input
          required
          name="name"
          defaultValue={initialData?.name || ''}
          placeholder="Xitoy → Toshkent (Avto)"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Jo'natish davlati</label>
          <input
            required
            name="originCountry"
            defaultValue={initialData?.originCountry || ''}
            placeholder="China"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Jo'natish shahri (ixtiyoriy)</label>
          <input
            name="originCity"
            defaultValue={initialData?.originCity || ''}
            placeholder="Guangzhou"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Yetkazish davlati</label>
          <input
            required
            name="destCountry"
            defaultValue={initialData?.destCountry || ''}
            placeholder="Uzbekistan"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Yetkazish shahri (ixtiyoriy)</label>
          <input
            name="destCity"
            defaultValue={initialData?.destCity || ''}
            placeholder="Toshkent"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Transport turi</label>
          <select
            name="mode"
            defaultValue={initialData?.mode || 'train'}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="train">Temir yo'l</option>
            <option value="truck">Avtomobil</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Valyuta</label>
          <select
            name="currency"
            defaultValue={initialData?.currency || 'USD'}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tranzit kunlari</label>
          <input
            type="number"
            min={0}
            name="transitDays"
            defaultValue={initialData?.transitDays ?? ''}
            placeholder="14"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">1 tonna narxi</label>
          <input
            required
            type="number"
            step="0.01"
            min={0}
            name="pricePerKg"
            defaultValue={initialData?.pricePerKg ?? 0}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Asosiy haq (base fee)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            name="baseFee"
            defaultValue={initialData?.baseFee ?? 0}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Min. og'irlik (tonna)</label>
          <input
            type="number"
            step="0.1"
            min={0}
            name="minWeight"
            defaultValue={initialData?.minWeight ?? 0}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Izoh (ichki)</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initialData?.notes || ''}
          placeholder="Maxsus shart yoki izohlar"
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          id="active"
          type="checkbox"
          name="active"
          defaultChecked={initialData ? initialData.active : true}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="active" className="text-sm text-slate-700">
          Faol — kalkulyator ushbu tarifni ko'rsatadi
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-6 py-2.5 text-gray-700 transition hover:bg-gray-50"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-6 py-2.5 font-medium text-white transition hover:bg-[#042C53]"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialData ? 'Saqlash' : 'Yaratish'}
        </button>
      </div>
    </form>
  );
}
