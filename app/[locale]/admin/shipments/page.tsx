import { prisma } from '@/lib/prisma';
import { Package, Plus, Download } from 'lucide-react';
import Link from 'next/link';
import { ShipmentsTable } from './ShipmentsTable';

import { getAdminSession } from '@/lib/adminAuth';
import { branchWhere } from '@/lib/branch';

export const revalidate = 0;

export default async function ShipmentsAdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }

  const queryFilter = {
    ...branchWhere(session),
    ...(session.role === 'SUPERADMIN' || session.role === 'DIRECTOR' || session.role === 'ADMIN'
      ? {}
      : { createdById: session.userId }),
  };

  const shipments = await prisma.shipment.findMany({
    where: queryFilter,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      trackingCode: true,
      senderName: true,
      receiverName: true,
      origin: true,
      destination: true,
      status: true,
      etaAt: true,
      lastStatusUpdate: true,
    } as never,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <Package className="h-6 w-6" /> Yuklar (Tracking) Boshqaruvi
        </h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export?entity=shipments"
            download
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV
          </a>
          <Link
            href="/uz/admin/shipments/new"
            className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]"
          >
            <Plus className="h-4 w-4" /> Yangi Yuk Qo&apos;shish
          </Link>
        </div>
      </div>

      <ShipmentsTable shipments={shipments as never} />
    </div>
  );
}
