'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Train, AlertCircle } from 'lucide-react';
import { WagonFormModal } from './WagonFormModal';
import { deleteWagon } from '@/app/actions/wagons';
import { useRouter } from 'next/navigation';

interface Wagon {
  id: number;
  number: string;
  type: string;
  capacity: number;
  status: string;
}

interface Props {
  initialWagons: Wagon[];
}

export function WagonsClient({ initialWagons }: Props) {
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
                <th className="px-6 py-4">Turi</th>
                <th className="px-6 py-4">Ko'tarish qobiliyati</th>
                <th className="px-6 py-4">Holati</th>
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
                filteredWagons.map((wagon) => (
                  <tr key={wagon.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {wagon.number}
                    </td>
                    <td className="px-6 py-4">{wagon.type}</td>
                    <td className="px-6 py-4">{wagon.capacity} t</td>
                    <td className="px-6 py-4">
                      {wagon.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Soz (Faol)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          Remontda
                        </span>
                      )}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WagonFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        wagon={selectedWagon} 
      />
    </div>
  );
}
