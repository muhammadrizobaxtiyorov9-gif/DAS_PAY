import { getAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import GlobalMapClient from './GlobalMapClient';
import { Globe2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GlobalMapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  
  if (!session) {
    redirect(`/${locale}/admin-login`);
  }

  // Fetch all shipments that are not delivered or cancelled, to show on map
  // or fetch all active shipments depending on requirements.
  const activeShipments = await prisma.shipment.findMany({
    where: {
      status: {
        notIn: ['delivered', 'cancelled'],
      }
    },
    include: {
      client: {
        select: { name: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#042C53] to-[#185FA5] text-white shadow-md">
          <Globe2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Xarita</h1>
          <p className="text-sm text-gray-500">
            Barcha faol yuklarni xaritada real vaqtda kuzatish
          </p>
        </div>
      </div>

      <GlobalMapClient initialShipments={activeShipments} />
    </div>
  );
}
