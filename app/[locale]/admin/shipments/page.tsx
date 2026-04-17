import { prisma } from '@/lib/prisma';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { ShipmentRow } from './ShipmentRow';

import { getAdminSession } from '@/lib/adminAuth';

export const revalidate = 0;

export default async function ShipmentsAdminPage() {
  const session = await getAdminSession();
  
  // Filtering logic: SUPERADMIN sees all, ADMIN sees only their own shipments
  const queryFilter = (session?.role === 'SUPERADMIN' || session?.role === 'admin') 
    ? {} 
    : { createdById: session?.userId || -1 };

  const shipments = await prisma.shipment.findMany({
    where: queryFilter,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <Package className="h-6 w-6"/> Yuklar (Tracking) Boshqaruvi
        </h1>
        <Link 
          href="/uz/admin/shipments/new"
          className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]"
        >
          <Plus className="h-4 w-4" /> Yangi Yuk Qo'shish
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Treking Kod</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Jo'natuvchi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Marshrut</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">O'chirish / Tahrir</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Hozircha hech qanday yuklar bazaga kiritilmagan.
                   </td>
                </tr>
              ) : shipments.map(s => (
                <ShipmentRow key={s.id} shipment={s} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
