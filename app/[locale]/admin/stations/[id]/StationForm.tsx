'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe } from 'lucide-react';
import { createStation, updateStation, type StationInput } from '@/app/actions/admin';
import { StationMapPicker } from '@/components/map/StationMapPicker';

interface StationModel {
  id: number;
  code: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  country: string;
  lat: number | null;
  lng: number | null;
  active: boolean;
}

const langTabs = [
  { key: 'uz', label: '🇺🇿 O\'zbekcha', flag: '🇺🇿' },
  { key: 'ru', label: '🇷🇺 Русский', flag: '🇷🇺' },
  { key: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
];

export function StationForm({
  initialData,
  locale,
}: {
  initialData: StationModel | null;
  locale: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeLang, setActiveLang] = useState('uz');
  const [lat, setLat] = useState<number | null>(initialData?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialData?.lng ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload: StationInput = {
      code: String(fd.get('code') || '').trim(),
      nameUz: String(fd.get('nameUz') || '').trim(),
      nameRu: String(fd.get('nameRu') || '').trim(),
      nameEn: String(fd.get('nameEn') || '').trim(),
      country: String(fd.get('country') || '').trim(),
      lat,
      lng,
      active: fd.get('active') === 'on',
    };

    if (!payload.code || !payload.nameUz || !payload.nameRu || !payload.nameEn) {
      setError('Barcha majburiy maydonlarni to\'ldiring');
      setSubmitting(false);
      return;
    }

    const result = initialData
      ? await updateStation(initialData.id, payload)
      : await createStation(payload);

    if (result.success) {
      router.push(`/${locale}/admin/stations`);
      router.refresh();
    } else {
      setError(result.error || 'Xatolik yuz berdi');
      setSubmitting(false);
    }
  }

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(Math.round(newLat * 10000) / 10000);
    setLng(Math.round(newLng * 10000) / 10000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Station Code */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Stansiya kodi <span className="text-red-500">*</span>
        </label>
        <input
          required
          name="code"
          defaultValue={initialData?.code || ''}
          placeholder="Masalan: 72800"
          className="w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-lg tracking-wider outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <p className="mt-1 text-xs text-gray-400">Stansiyaning noyob identifikatsiya kodi</p>
      </div>

      {/* Station Names - Multi-language tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Stansiya nomi <span className="text-red-500">*</span>
          </span>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {langTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveLang(tab.key)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                activeLang === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className={activeLang === 'uz' ? '' : 'hidden'}>
            <input
              required
              name="nameUz"
              defaultValue={initialData?.nameUz || ''}
              placeholder="Stansiya nomi o'zbek tilida"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className={activeLang === 'ru' ? '' : 'hidden'}>
            <input
              required
              name="nameRu"
              defaultValue={initialData?.nameRu || ''}
              placeholder="Название станции на русском"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className={activeLang === 'en' ? '' : 'hidden'}>
            <input
              required
              name="nameEn"
              defaultValue={initialData?.nameEn || ''}
              placeholder="Station name in English"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Davlat</label>
        <input
          name="country"
          defaultValue={initialData?.country || "O'zbekiston"}
          placeholder="O'zbekiston"
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Map Picker */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Xaritadagi joylashuvi
        </label>
        <StationMapPicker
          lat={lat}
          lng={lng}
          onLocationChange={handleLocationChange}
        />
        {lat !== null && lng !== null && (
          <div className="flex items-center gap-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm">
            <span className="text-emerald-700 font-medium">📍 Koordinatalar:</span>
            <span className="font-mono text-emerald-600">{lat}, {lng}</span>
            <button
              type="button"
              onClick={() => { setLat(null); setLng(null); }}
              className="ml-auto text-xs text-red-500 hover:text-red-700"
            >
              Tozalash
            </button>
          </div>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          id="active"
          type="checkbox"
          name="active"
          defaultChecked={initialData ? initialData.active : true}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="active" className="text-sm text-slate-700">
          Faol — kalkulyator va ariza formalarida ko&apos;rinadi
        </label>
      </div>

      {/* Actions */}
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
