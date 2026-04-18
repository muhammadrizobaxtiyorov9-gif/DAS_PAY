import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileSignature, ArrowLeft } from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ shipmentId?: string }>;
}) {
  const sp = await searchParams;
  const prefillShipmentId = sp.shipmentId ? parseInt(sp.shipmentId) : null;

  const [shipments, clients, contracts] = await Promise.all([
    prisma.shipment.findMany({
      select: { id: true, trackingCode: true, origin: true, destination: true, weight: true, clientPhone: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.client.findMany({
      select: { phone: true, name: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.contract.findMany({
      select: { id: true, contractNumber: true, companyName: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  let prefillShipment = null;
  if (prefillShipmentId) {
    prefillShipment = shipments.find((s) => s.id === prefillShipmentId) || null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
            <FileSignature className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yangi hisob-faktura</h1>
            <p className="text-sm text-gray-500">Mijoz uchun rasmiy to'lov hujjatini tayyorlang.</p>
          </div>
        </div>
        <Link
          href="/uz/admin/invoices"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <InvoiceForm
          shipments={shipments}
          clients={clients}
          contracts={contracts}
          prefillShipment={prefillShipment}
        />
      </div>
    </div>
  );
}
