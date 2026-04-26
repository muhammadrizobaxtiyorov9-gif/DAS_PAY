import { prisma } from '@/lib/prisma';
import { generateQrDataUrl } from '@/lib/qr';
import { ensureReceiveToken } from '@/app/actions/receive';
import { notFound } from 'next/navigation';
import { WaybillPrintShell } from './WaybillPrintShell';

export const dynamic = 'force-dynamic';

export default async function WaybillPage({
  params,
}: {
  params: Promise<{ code: string; locale: string }>;
}) {
  const { code, locale } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: code },
    include: {
      client: true,
      trucks: { take: 1 },
      wagons: { take: 5 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!shipment) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://das-pay.com';
  const trackingUrl = `${base}/${locale}/tracking/${shipment.trackingCode}`;

  // Generate (or reuse) one-time receive token; QR points to the receive deep-link
  const { token } = await ensureReceiveToken(shipment.id);
  const receiveUrl = `${base}/${locale}/receive/${shipment.trackingCode}?t=${token}`;
  const qr = await generateQrDataUrl(receiveUrl);

  const invoice = shipment.invoices[0] ?? null;
  const truck = shipment.trucks[0] ?? null;

  return (
    <WaybillPrintShell
      shipment={{
        id: shipment.id,
        trackingCode: shipment.trackingCode,
        senderName: shipment.senderName,
        receiverName: shipment.receiverName,
        origin: shipment.origin,
        destination: shipment.destination,
        weight: shipment.weight,
        description: shipment.description,
        revenue: shipment.revenue,
        currency: shipment.currency,
        createdAt: shipment.createdAt.toISOString(),
        cargoType: shipment.cargoType,
        transportMode: shipment.transportMode,
      }}
      client={
        shipment.client
          ? { name: shipment.client.name, phone: shipment.client.phone }
          : null
      }
      truck={truck ? { plateNumber: truck.plateNumber, model: truck.model } : null}
      wagonNumbers={shipment.wagons.map((w) => w.number)}
      invoiceNumber={invoice?.number ?? null}
      qr={qr}
      trackingUrl={trackingUrl}
      receiveUrl={receiveUrl}
    />
  );
}
