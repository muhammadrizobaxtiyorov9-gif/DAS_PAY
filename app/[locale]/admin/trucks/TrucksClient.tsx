'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Truck as TruckIcon, MapPin, User, Package } from 'lucide-react';
import { TruckFormModal } from './TruckFormModal';
import { deleteTruck } from '@/app/actions/trucks';
import { useRouter } from 'next/navigation';
import { wagonStatusMeta } from '@/lib/wagon-status';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'sonner';

interface Truck {
  id: number;
  plateNumber: string;
  model: string;
  capacity: number;
  status: string;
  driver?: { id: number; name: string | null; username: string } | null;
  currentStation?: { id: number; nameUz: string; code: string } | null;
  shipments?: { id: number; trackingCode: string; status: string }[] | null;
  lockedByShipmentId?: number | null;
}

interface Props {
  initialTrucks: Truck[];
  drivers: any[];
  stations: any[];
}

export function TrucksClient({ initialTrucks, drivers, stations }: Props) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [trucks, setTrucks] = useState(initialTrucks);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);

  const filteredTrucks = trucks.filter(t => 
    t.plateNumber.toLowerCase().includes(search.toLowerCase()) || 
    t.model.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    setSelectedTruck(null);
    setIsModalOpen(true);
  }

  function handleEdit(truck: Truck) {
    setSelectedTruck(truck);
    setIsModalOpen(true);
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: 'Mashinani o\'chirish',
      message: 'Ushbu mashinani o\'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo\'lmaydi.',
      variant: 'danger',
    });
    if (!ok) return;

    const res = await deleteTruck(id);
    if (res.success) {
      router.refresh();
      setTrucks(trucks.filter(t => t.id !== id));
      toast.success('Mashina o\'chirildi');
    } else {
      toast.error(res.error || 'Xatolik yuz berdi');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-2">
            <TruckIcon className="w-7 h-7 text-[#185FA5]" /> Yuk Avtomobillari
          </h1>
          <p className="text-sm text-slate-500 mt-1">Avtoparkdagi mashinalarni va haydovchilarni boshqarish</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0A3D6E] transition-all"
        >
          <Plus className="h-4 w-4" /> Yangi Mashina
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Davlat raqami yoki model..."
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
                <th className="px-6 py-4">Avtomobil</th>
                <th className="px-6 py-4">Haydovchi</th>
                <th className="px-6 py-4">Holati</th>
                <th className="px-6 py-4">Kuzatuv (Stansiya)</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <TruckIcon className="h-12 w-12 mb-3 text-slate-200" />
                      <p className="text-base font-medium text-slate-600">Mashinalar topilmadi</p>
                      <p className="text-sm mt-1">Yangi mashina qo'shing yoki qidiruv so'rovini o'zgartiring.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((truck) => {
                  const statusMeta = wagonStatusMeta(truck.status);
                  const activeShipment = truck.lockedByShipmentId 
                    ? truck.shipments?.find(s => s.id === truck.lockedByShipmentId)
                    : truck.shipments?.[0];

                  return (
                    <tr key={truck.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 border border-gray-200 px-2 py-0.5 rounded w-max bg-gray-50">{truck.plateNumber}</div>
                        <div className="text-xs text-slate-500 mt-1">{truck.model} · {truck.capacity} t</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className={truck.driver ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                            {truck.driver?.name || truck.driver?.username || 'Biriktirilmagan'}
                          </span>
                        </div>
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
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className={truck.currentStation ? 'text-slate-700' : 'text-slate-400'}>
                            {truck.currentStation?.nameUz || 'Noma\'lum'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(truck)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(truck.id)}
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

      <TruckFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        truck={selectedTruck}
        drivers={drivers}
        stations={stations}
      />
    </div>
  );
}
