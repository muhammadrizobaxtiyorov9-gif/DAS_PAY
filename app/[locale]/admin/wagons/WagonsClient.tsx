'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Train, MapPin, User, Package } from 'lucide-react';
import { WagonFormModal } from './WagonFormModal';
import { deleteWagon } from '@/app/actions/wagons';
import { useRouter } from 'next/navigation';
import { wagonStatusMeta } from '@/lib/wagon-status';

interface Wagon {
  id: number;
  number: string;
  type: string;
  capacity: number;
  status: string;
  currentStation?: { id: number; nameUz: string; code: string } | null;
  shipments?: { id: number; trackingCode: string; status: string }[] | null;
  lockedByShipmentId?: number | null;
}

interface Props {
  initialWagons: Wagon[];
  stations: any[];
}

export function WagonsClient({ initialWagons, stations }: Props) {
  const router = useRouter();
  const [wagons, setWagons] = useState(initialWagons);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWagon, setSelectedWagon] = useState<Wagon | null>(null);

  const filteredWagons = wagons.filter(w => 
    w.number.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    setSelectedWagon(null);
    setIsModalOpen(true);
  }

  function handleEdit(wagon: Wagon) {
    setSelectedWagon(wagon);
    setIsModalOpen(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('Ushbu vagonni o\'chirishni tasdiqlaysizmi?')) return;
    const res = await deleteWagon(id);
    if (res.success) {
      router.refresh();
      setWagons(wagons.filter(w => w.id !== id));
    } else {
      alert(res.error || 'Xatolik yuz berdi');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vagonlar bazasi</h1>
          <p className="text-sm text-slate-500 mt-1">Temir yo'l vagonlarini boshqarish va kuzatish.</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#185FA5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#042C53] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Vagon qo'shish
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Vagon raqami bo'yicha qidiruv..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Vagon raqami</th>
                <th className="px-6 py-4">Turi & Sig'imi</th>
                <th className="px-6 py-4">Holati</th>
                <th className="px-6 py-4">Kuzatuv ma'lumotlari</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredWagons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Train className="h-12 w-12 mb-3 text-slate-200" />
                      <p className="text-base font-medium text-slate-600">Vagonlar topilmadi</p>
                      <p className="text-sm mt-1">Yangi vagon qo'shing yoki qidiruv so'rovini o'zgartiring.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWagons.map((wagon) => {
                  const statusMeta = wagonStatusMeta(wagon.status);
                  // Find active shipment if locked
                  const activeShipment = wagon.lockedByShipmentId 
                    ? wagon.shipments?.find(s => s.id === wagon.lockedByShipmentId)
                    : wagon.shipments?.[0]; // Fallback to any active

                  return (
                    <tr key={wagon.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{wagon.number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{wagon.type}</div>
                        <div className="text-xs text-slate-500">{wagon.capacity} t</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.pill}`}>
                          {statusMeta.icon} {statusMeta.labelText}
                        </span>
                        {activeShipment && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-max">
                            <Package className="w-3 h-3" />
                            {activeShipment.trackingCode} ga band
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className={wagon.currentStation ? 'text-slate-700' : 'text-slate-400'}>
                            {wagon.currentStation?.nameUz || 'Noma\'lum'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(wagon)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(wagon.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WagonFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        wagon={selectedWagon}
        stations={stations}
      />
    </div>
  );
}
