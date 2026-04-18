import { prisma } from '@/lib/prisma';
import { getAuthenticatedClient } from '../../lib/clientAuth';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ShipmentRequestForm } from './ShipmentRequestForm';

export const dynamic = 'force-dynamic';

export default async function CabinetNewShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const addresses = await prisma.clientAddress.findMany({
    where: { clientId: client.id },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/cabinet/shipments`}
          className="rounded-full border bg-white p-2 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-[#185FA5]" />
          <h1 className="text-2xl font-bold text-[#042C53]">Yangi yuk so'rovi</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
          So'rovingiz yuborilgandan so'ng, operatorlarimiz u bilan bog'lanib, marshrut va narxni tasdiqlaydi.
          Tracking kod sizga yuboriladi va kabinetingizda kuzatib borishingiz mumkin.
        </p>

        <ShipmentRequestForm
          locale={locale}
          senderAddresses={addresses.filter((a) => a.role === 'sender')}
          receiverAddresses={addresses.filter((a) => a.role === 'receiver')}
        />
      </div>
    </div>
  );
}
