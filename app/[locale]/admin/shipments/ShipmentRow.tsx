'use client';

import { useState } from 'react';
import { Trash2, Edit2, Loader2, Navigation } from 'lucide-react';
import { deleteShipment } from '@/app/actions/admin';
import Link from 'next/link';

export function ShipmentRow({ shipment }: { shipment: any }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Haqiqatan ham ushbu yukni bazadan o`chirmokchimisiz?')) return;
    setIsDeleting(true);
    await deleteShipment(shipment.id);
  }

  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_transit: 'bg-blue-100 text-blue-700',
    customs: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700'
  };

  const statusLabels: any = {
    pending: 'Kutilmoqda',
    in_transit: 'Yo`lda',
    customs: 'Bojxonada',
    delivered: 'Yetkazildi'
  };

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4 font-mono font-medium text-blue-600">{shipment.trackingCode}</td>
      <td className="px-6 py-4">
        {shipment.senderName} 
        <br/>
        <span className="text-xs text-gray-400">oluvchi: {shipment.receiverName}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-600">
           <Navigation className="w-3 h-3 rotate-45 text-blue-500" />
           {shipment.origin} <br/> 
           <span className="text-xs ml-5 text-emerald-600">→ {shipment.destination}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[shipment.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabels[shipment.status] || shipment.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
        <Link 
          href={`/uz/admin/shipments/${shipment.id}`}
          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1"
          title="Tahrirlash"
        >
          <Edit2 className="w-4 h-4" />
        </Link>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
          title="O'chirish"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}
