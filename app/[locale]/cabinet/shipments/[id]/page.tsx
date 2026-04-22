import { prisma } from '@/lib/prisma';
import { getAuthenticatedClient } from '../../lib/clientAuth';
import { MapPin, Calendar, ArrowLeft, Clock, Ruler, FileSignature } from 'lucide-react';
import Link from 'next/link';
import ShipmentMapWrapper from './ShipmentMapWrapper';
import { computeEta, formatEtaDate, formatEtaRelative, type RouteSegment } from '@/lib/map-utils';
import { formatMoney } from '@/lib/money';
import { shipmentStatusMeta } from '@/lib/shipment-status';

interface CabinetShipmentDetailsPageProps {
  params: Promise<{ locale: string, id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetShipmentDetailsPage({ params, searchParams }: CabinetShipmentDetailsPageProps) {
  const { locale, id } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const shipmentId = parseInt(id);

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { wagons: true }
  });

  if (!shipment || shipment.clientPhone !== client.phone) {
    return (
      <div className="text-center p-16">
        <h2 className="text-2xl font-bold text-gray-800">Yuk topilmadi</h2>
        <Link href={`/${locale}/cabinet/shipments`} className="text-blue-600 mt-4 inline-block">← Ortga qaytish</Link>
      </div>
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: { shipmentId: shipment.id, status: { not: 'draft' } },
    orderBy: { createdAt: 'desc' },
  });

  type TimelineEvent = { date?: string; location?: string; description?: string; status?: any; note?: string };
  const events: TimelineEvent[] = (() => {
    const raw = shipment.events;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? (parsed as TimelineEvent[]) : [];
    } catch {
      return [];
    }
  })();

  const rawSegments = typeof shipment.routeSegments === 'string'
    ? (() => { try { return JSON.parse(shipment.routeSegments as unknown as string); } catch { return []; } })()
    : Array.isArray(shipment.routeSegments) ? shipment.routeSegments : [];
  const segments: RouteSegment[] = (rawSegments as unknown[]).map((s) => s as RouteSegment);

  const eta = computeEta(
    segments,
    shipment.status,
    shipment.currentLat,
    shipment.currentLng,
  );
  const localeCode = (locale === 'ru' || locale === 'en') ? locale : 'uz';

  const statusMeta = shipmentStatusMeta(shipment.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/cabinet/shipments`} className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h2 className="text-2xl font-bold text-[#042C53] flex items-center gap-2">
           Tracking: <span className="font-mono text-[#185FA5]">{shipment.trackingCode}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Details & Events */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                 <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Holat</span>
                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusMeta.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.labelText}
                 </span>
              </div>
              
              <div className="space-y-3">
                 <div>
                    <span className="text-xs text-gray-400 font-bold uppercase">Jo'natuvchi</span>
                    <p className="font-bold text-gray-800">{shipment.senderName}</p>
                 </div>
                 <div>
                    <span className="text-xs text-gray-400 font-bold uppercase">Qabul Qiluvchi</span>
                    <p className="font-bold text-gray-800">{shipment.receiverName}</p>
                 </div>
                 
                 <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Vazni</span>
                       <p className="text-sm font-semibold">{shipment.weight ? `${shipment.weight} tonna` : 'Noma\'lum'}</p>
                    </div>
                    <div>
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Sana</span>
                       <p className="text-sm font-semibold">{shipment.createdAt.toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>
           </div>

           {(shipment as any).wagons && (shipment as any).wagons.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border shadow-sm">
                 <h3 className="font-bold text-[#042C53] mb-4 flex items-center gap-2">
                    <span className="text-xl">🚂</span> Biriktirilgan vagonlar
                 </h3>
                 <div className="space-y-3">
                    {(shipment as any).wagons.map((wagon: any) => (
                       <div key={wagon.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                          <div>
                             <div className="font-bold text-[#185FA5] text-sm">{wagon.number}</div>
                             <div className="text-xs text-slate-500">{wagon.type}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-sm font-semibold">{wagon.capacity}t</div>
                             <div className="text-[10px] uppercase font-bold text-emerald-600">
                                {wagon.status === 'active' ? 'Soz' : 'Remontda'}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
                 {events.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm">
                       <span className="font-bold text-blue-800">Joriy stansiya: </span>
                       <span className="text-blue-900">{events[events.length - 1].location || 'Noma\'lum'}</span>
                    </div>
                 )}
              </div>
           )}

           {shipment.status === 'delivered' && (
              <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-100 to-white p-5 shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-xl">
                       ✅
                    </div>
                    <div>
                       <div className="text-sm font-bold text-emerald-800">Yuk yetkazildi</div>
                       <div className="text-xs text-slate-600">{shipment.updatedAt.toLocaleString()}</div>
                    </div>
                 </div>
              </div>
           )}

           {invoices.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border shadow-sm">
                 <h3 className="font-bold text-[#042C53] mb-4 flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-[#185FA5]" /> Hisob-fakturalar
                 </h3>
                 <div className="space-y-2">
                    {invoices.map((inv) => {
                       const balance = inv.total - inv.paidAmount;
                       const statusColor =
                          inv.status === 'paid' ? 'text-emerald-700 bg-emerald-50' :
                          inv.status === 'overdue' ? 'text-red-700 bg-red-50' :
                          'text-blue-700 bg-blue-50';
                       return (
                          <Link
                             key={inv.id}
                             href={`/${locale}/cabinet/invoices/${inv.id}`}
                             className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-[#185FA5] hover:bg-white"
                          >
                             <div>
                                <div className="font-mono text-sm font-bold text-[#185FA5]">{inv.number}</div>
                                <div className="text-[11px] text-slate-500">
                                   Muddat: {inv.dueDate.toLocaleDateString('uz-UZ')}
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="font-semibold text-slate-800">{formatMoney(inv.total, inv.currency)}</div>
                                {balance > 0 && inv.paidAmount > 0 && (
                                   <div className="text-[11px] text-red-600">Qoldiq: {formatMoney(balance, inv.currency)}</div>
                                )}
                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor}`}>
                                   {inv.status}
                                </span>
                             </div>
                          </Link>
                       );
                    })}
                 </div>
              </div>
           )}

           <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <h3 className="font-bold text-[#042C53] mb-4 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-[#185FA5]" /> Tracking Tarixi
              </h3>
              
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent pl-4">
                 {events.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center relative z-10 w-full">Hech qanday tarix mavjud emas</p>
                 ) : events.map((event, index) => (
                    <div key={index} className="relative flex items-start justify-between gap-4 py-2">
                       <div className="absolute left-[-23px] top-3 h-3 w-3 rounded-full bg-[#185FA5] ring-4 ring-blue-50" />
                       <div className="flex-1 bg-gray-50 border rounded-xl p-3 shadow-sm">
                          <p className="text-xs text-[#185FA5] font-bold mb-1">{event.date}</p>
                          <p className="text-sm font-semibold text-gray-800">{event.location}</p>
                          <p className="text-xs text-gray-600 mt-1">{event.note || event.description}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Side: Map */}
        <div className="xl:col-span-2 bg-white rounded-3xl border shadow-sm p-2 flex flex-col h-[600px]">
           <div className="flex items-center gap-2 px-4 py-3 mb-2 border-b">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="font-bold text-[#042C53]">Jonli Xarita (Live Routing)</span>
              
              {(!shipment.originLat || !shipment.destinationLat) && (
                 <span className="ml-auto text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium border border-orange-100">
                    Kordinatalar kiritilmagan
                 </span>
              )}
           </div>
           <div className="flex-1 relative">
              <ShipmentMapWrapper shipment={shipment} />
           </div>
        </div>
      </div>
    </div>
  );
}
