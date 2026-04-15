import { prisma } from '@/lib/prisma';
import { Package } from 'lucide-react';
import { ShipmentForm } from './ShipmentForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ShipmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === 'new';

  let shipment = null;
  if (!isNew) {
    shipment = await prisma.shipment.findUnique({
      where: { id: parseInt(id) }
    });
    if (!shipment) notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Yangi Yuk (Tracking) Kiritish' : "Tracking ma'lumotlarini tahrirlash"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isNew ? 'Mijoz uchun yangi logistika marshrutini oching.' : "Kiritilgan yuk statusini yoki marshrutini o'zgartiring."}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <ShipmentForm initialData={shipment} />
      </div>
    </div>
  );
}
