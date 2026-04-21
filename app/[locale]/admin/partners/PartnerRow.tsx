'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { togglePartnerActive, deletePartner } from '@/app/actions/admin';
import Image from 'next/image';

interface PartnerData {
  id: number;
  name: string;
  logoUrl: string | null;
  color: string | null;
  active: boolean;
  order: number;
}

export function PartnerRow({ partner, locale }: { partner: PartnerData; locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      await togglePartnerActive(partner.id, !partner.active);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!confirm(`"${partner.name}" hamkorni o'chirmoqchimisiz?`)) return;
    setDeleting(true);
    await deletePartner(partner.id);
    router.refresh();
  };

  return (
    <tr className={`transition-colors hover:bg-gray-50 ${!partner.active ? 'opacity-50' : ''}`}>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-20 items-center justify-center rounded-lg bg-gray-50 border overflow-hidden"
          >
            {partner.logoUrl ? (
              <img src={partner.logoUrl} alt={partner.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs font-bold" style={{ color: partner.color || '#64748b' }}>{partner.name}</span>
            )}
          </div>
          <span className="font-semibold text-gray-900">{partner.name}</span>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <span className="text-sm text-gray-500">
          {partner.order}
        </span>
      </td>
      <td className="px-6 py-3.5 text-center">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            partner.active
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {partner.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </td>
      <td className="px-6 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => router.push(`/${locale}/admin/partners/${partner.id}`)}
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
