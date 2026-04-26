import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ReceiveConfirmClient } from './ReceiveConfirmClient';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReceivePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string; locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { code, locale } = await params;
  const { t } = await searchParams;
  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: code },
    select: {
      id: true,
      trackingCode: true,
      senderName: true,
      receiverName: true,
      origin: true,
      destination: true,
      weight: true,
      receiveToken: true,
      receivedAt: true,
      status: true,
    },
  });
  if (!shipment) notFound();

  const tokenOk = !!t && shipment.receiveToken === t && !shipment.receivedAt;

  if (shipment.receivedAt) {
    return (
      <main className="min-h-screen bg-emerald-50 py-12 px-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="text-xl font-bold text-slate-800">Yuk allaqachon qabul qilingan</h1>
          <p className="mt-2 text-sm text-slate-500">
            {shipment.trackingCode} · {new Date(shipment.receivedAt).toLocaleString('uz-UZ')}
          </p>
        </div>
      </main>
    );
  }

  if (!tokenOk) {
    return (
      <main className="min-h-screen bg-red-50 py-12 px-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-slate-800">Havola noto'g'ri</h1>
          <p className="mt-2 text-sm text-slate-500">
            QR-kodni qaytadan skanerlang yoki dispetcherga murojaat qiling.
          </p>
        </div>
      </main>
    );
  }

  return (
    <ReceiveConfirmClient
      shipment={{
        trackingCode: shipment.trackingCode,
        senderName: shipment.senderName,
        receiverName: shipment.receiverName,
        origin: shipment.origin,
        destination: shipment.destination,
        weight: shipment.weight,
      }}
      token={t!}
      locale={locale}
    />
  );
}
