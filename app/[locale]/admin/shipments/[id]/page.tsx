import { prisma } from '@/lib/prisma';
import { Package, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { ShipmentForm } from './ShipmentForm';
import { ShipmentTimelineEditor } from './ShipmentTimelineEditor';
import { FinancialsCard } from './FinancialsCard';
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
  let hasClientTelegram = false;
  if (!isNew) {
    shipment = await prisma.shipment.findUnique({
      where: { id: parseInt(id) },
      include: { wagons: true }
    });
    if (!shipment) notFound();

    if (shipment.clientPhone) {
      const client = await prisma.client.findUnique({
        where: { phone: shipment.clientPhone },
        select: { telegramId: true },
      });
      hasClientTelegram = !!client?.telegramId;
    }
  }

  const events = shipment && Array.isArray(shipment.events)
    ? (shipment.events as unknown[]).map((e) => e as {
        status: string | { uz?: string; ru?: string; en?: string };
        location?: string;
        date?: string;
        note?: string;
        lat?: number;
        lng?: number;
        addedBy?: string;
      })
    : [];

  const allWagons = await prisma.wagon.findMany({
    where: { status: 'active' },
    orderBy: { number: 'asc' }
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Package className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Yangi Yuk (Tracking) Kiritish' : "Tracking ma'lumotlarini tahrirlash"}
          </h1>
          <p className="text-sm text-gray-500">
            {isNew
              ? 'Mijoz uchun yangi logistika marshrutini oching.'
              : "Yuk ma'lumotlari, marshrut va tarixni boshqaring."}
          </p>
        </div>
        {!isNew && shipment && (
          <Link
            href={`/uz/admin/invoices/new?shipmentId=${shipment.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <FileSignature className="h-4 w-4" /> Invoys yaratish
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <ShipmentForm initialData={shipment} allWagons={allWagons} />
      </div>

      {!isNew && shipment && (
        <FinancialsCard
          shipmentId={shipment.id}
          initial={{
            revenue: (shipment as unknown as { revenue?: number }).revenue ?? 0,
            cost: (shipment as unknown as { cost?: number }).cost ?? 0,
            currency: (shipment as unknown as { currency?: string }).currency ?? 'USD',
            transportMode: (shipment as unknown as { transportMode?: string | null }).transportMode ?? null,
            distanceKm: (shipment as unknown as { distanceKm?: number | null }).distanceKm ?? null,
            etaAt: (shipment as unknown as { etaAt?: Date | null }).etaAt?.toISOString() ?? null,
          }}
        />
      )}

      {!isNew && shipment && (
        <ShipmentTimelineEditor
          shipmentId={shipment.id}
          trackingCode={shipment.trackingCode}
          currentStatus={shipment.status}
          events={events}
          hasClientTelegram={hasClientTelegram}
        />
      )}
    </div>
  );
}
