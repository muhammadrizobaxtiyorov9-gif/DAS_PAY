'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Edit2, Loader2, Trash2, Truck, Train, Plane, Ship, Boxes, Power } from 'lucide-react';
import { deleteTariff, toggleTariffActive } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'sonner';

interface TariffRowProps {
  tariff: {
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
    active: boolean;
  };
  pricePerKgFormatted: string;
  baseFeeFormatted: string;
  modeIconName: string;
}

const MODE_ICON: Record<string, typeof Truck> = {
  truck: Truck,
  train: Train,
  air: Plane,
  sea: Ship,
  multimodal: Boxes,
};

const MODE_LABEL: Record<string, string> = {
  truck: 'Avto',
  train: 'Temir yo\'l',
  air: 'Havo',
  sea: 'Dengiz',
  multimodal: 'Multimodal',
};

export function TariffRow({
  tariff,
  pricePerKgFormatted,
  baseFeeFormatted,
  modeIconName,
}: TariffRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [deleting, setDeleting] = useState(false);

  const Icon = MODE_ICON[modeIconName] || Truck;
  const origin = [tariff.originCity, tariff.originCountry].filter(Boolean).join(', ');
  const dest = [tariff.destCity, tariff.destCountry].filter(Boolean).join(', ');

  async function handleToggle() {
    startTransition(async () => {
      await toggleTariffActive(tariff.id, !tariff.active);
      router.refresh();
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Tarifni o\'chirish',
      message: `"${tariff.name}" tarifini o'chirishni tasdiqlaysizmi?`,
      variant: 'danger'
    });
    if (!ok) return;
    setDeleting(true);
    const res = await deleteTariff(tariff.id);
    if (res?.error) {
      toast.error(res.error);
      setDeleting(false);
    } else {
      toast.success('Tarif o\'chirildi');
      router.refresh();
    }
  }

  return (
    <tr className={`transition-colors hover:bg-slate-50/60 ${deleting ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4">
        <div className="font-semibold text-slate-800">{tariff.name}</div>
        <div className="text-xs text-slate-500">
          {origin} <span className="text-emerald-600">→</span> {dest}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          <Icon className="h-3.5 w-3.5" />
          {MODE_LABEL[tariff.mode] || tariff.mode}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-slate-800">
        {pricePerKgFormatted}
      </td>
      <td className="px-6 py-4 text-right font-mono text-sm text-slate-600">
        {baseFeeFormatted}
      </td>
      <td className="px-6 py-4 text-right text-sm text-slate-600">{tariff.minWeight} tonna</td>
      <td className="px-6 py-4 text-center text-sm text-slate-600">
        {tariff.transitDays ? `~${tariff.transitDays} kun` : '—'}
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            tariff.active
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Power className="h-3 w-3" />
          )}
          {tariff.active ? 'Faol' : 'Nofaol'}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/uz/admin/tariffs/${tariff.id}`}
            className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
            title="Tahrirlash"
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
            title="O'chirish"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}
