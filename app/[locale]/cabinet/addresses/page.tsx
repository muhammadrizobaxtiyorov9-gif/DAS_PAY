import { prisma } from '@/lib/prisma';
import { getAuthenticatedClient } from '../lib/clientAuth';
import { BookUser } from 'lucide-react';
import { AddressList } from './AddressList';

export const dynamic = 'force-dynamic';

export default async function CabinetAddressesPage({
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

  const senders = addresses.filter((a) => a.role === 'sender');
  const receivers = addresses.filter((a) => a.role === 'receiver');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#185FA5] text-white shadow">
          <BookUser className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manzillar kitobi</h1>
          <p className="text-sm text-gray-500">
            Tez-tez foydalanadigan jo'natuvchi va qabul qiluvchilarni saqlang
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddressList
          role="sender"
          title="Jo'natuvchilar"
          iconName="sender"
          items={senders}
        />
        <AddressList
          role="receiver"
          title="Qabul qiluvchilar"
          iconName="receiver"
          items={receivers}
        />
      </div>
    </div>
  );
}
