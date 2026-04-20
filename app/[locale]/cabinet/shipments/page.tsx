import { getAuthenticatedClient } from '../lib/clientAuth';
import { Package, Truck, Plus, ArrowRight, Globe2 } from 'lucide-react';
import Link from 'next/link';
import { shipmentStatusMeta } from '@/lib/shipment-status';

interface CabinetShipmentsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetShipmentsPage({ params, searchParams }: CabinetShipmentsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const shipments = client.shipments;
  const activeCount = shipments.filter((s) => s.status !== 'delivered' && s.status !== 'cancelled').length;
  const deliveredCount = shipments.filter((s) => s.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#185FA5]/10 text-[#185FA5]">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#042C53] sm:text-2xl">Mening Yuklarim</h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              {shipments.length} yuk · {activeCount} faol · {deliveredCount} yetkazilgan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/cabinet/shipments/map`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#185FA5]/30 bg-blue-50 px-4 py-2 text-sm font-bold text-[#185FA5] shadow-sm transition-colors hover:bg-blue-100"
          >
            <Globe2 className="h-4 w-4" /> Xaritada ko'rish
          </Link>
          <Link
            href={`/${locale}/cabinet/shipments/new`}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Yangi so'rov
          </Link>
        </div>
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">
          <Truck className="mx-auto mb-4 h-16 w-16 text-gray-200" />
          <p className="text-xl font-medium text-gray-600">Hozircha faol yuklaringiz yo'q</p>
          <p className="mt-2 text-sm text-gray-400">
            Yangi yuklar tizimga kiritilganda shu yerda xabardor bo'lasiz.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shipments.map((shipment) => {
            const status = shipmentStatusMeta(shipment.status);
            return (
              <Link
                href={`/${locale}/cabinet/shipments/${shipment.id}`}
                key={shipment.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#185FA5]/30 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-[0.04] transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.06]">
                  <Package className="h-32 w-32" />
                </div>

                <div className="mb-6 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Tracking Kod
                    </p>
                    <span className="inline-block rounded-lg border bg-gray-50 px-3 py-1 font-mono text-base font-black text-[#042C53] transition-colors group-hover:border-[#185FA5]/30 group-hover:bg-blue-50 group-hover:text-[#185FA5]">
                      {shipment.trackingCode}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.pill}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.labelText}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="relative rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                    <span
                      className="absolute left-[1.375rem] top-6 bottom-6 w-px border-l border-dashed border-gray-300"
                      aria-hidden="true"
                    />
                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-[3px] border-emerald-500 bg-white" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase text-gray-400">Qayerdan</p>
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {shipment.origin || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-[3px] border-[#185FA5] bg-white" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase text-gray-400">Qayerga</p>
                          <p className="truncate text-sm font-semibold text-[#042C53]">
                            {shipment.destination || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    {shipment.weight || '—'}
                  </div>
                  <span className="flex items-center gap-1 text-[#185FA5] opacity-0 transition-opacity group-hover:opacity-100">
                    Batafsil <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
