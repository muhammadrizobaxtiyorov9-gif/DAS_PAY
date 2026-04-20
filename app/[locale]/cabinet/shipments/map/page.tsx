import { getAuthenticatedClient } from '../../lib/clientAuth';
import GlobalMapClient from '../../../admin/global-map/GlobalMapClient';
import { Globe2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CabinetShipmentsMapPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const activeShipments = client.shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/cabinet/shipments`} className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#185FA5]/10 text-[#185FA5] shadow-sm">
            <Globe2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#042C53]">Yuklar xaritasi</h1>
            <p className="text-sm text-gray-500">
              Sizning barcha faol yuklaringizni xaritada kuzatish
            </p>
          </div>
        </div>
      </div>

      <GlobalMapClient initialShipments={activeShipments} />
    </div>
  );
}
