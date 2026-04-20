'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Check, X, Pencil, Trash2 } from 'lucide-react';
import { toggleStationActive, deleteStation } from '@/app/actions/admin';

interface StationData {
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

export function StationRow({ station, locale }: { station: StationData; locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      await toggleStationActive(station.id, !station.active);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!confirm(`"${station.nameUz}" stansiyasini o'chirmoqchimisiz?`)) return;
    setDeleting(true);
    await deleteStation(station.id);
    router.refresh();
  };

  return (
    <tr className={`transition-colors hover:bg-gray-50 ${!station.active ? 'opacity-50' : ''}`}>
      <td className="px-6 py-3.5">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{station.nameUz}</span>
          <span className="text-xs text-gray-400 mt-0.5">{station.nameRu} / {station.nameEn}</span>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono font-semibold text-gray-600">
          {station.code}
        </span>
      </td>
      <td className="px-6 py-3.5 text-sm text-gray-600">{station.country}</td>
      <td className="px-6 py-3.5 text-center">
        {station.lat && station.lng ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <MapPin className="h-3.5 w-3.5" />
            {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-3.5 text-center">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            station.active
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {station.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </td>
      <td className="px-6 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => router.push(`/${locale}/admin/stations/${station.id}`)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Tahrirlash"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="O'chirish"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
