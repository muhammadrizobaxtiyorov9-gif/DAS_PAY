'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ClientDeleteButton({ clientId, clientName }: { clientId: number; clientName: string }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`"${clientName}" o'chirildi`);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'O\'chirishda xatolik');
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 transition"
        >
          Ha
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-200 transition"
        >
          Yo&apos;q
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition"
    >
      <Trash2 className="h-3 w-3" />
      O&apos;chirish
    </button>
  );
}
