import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MapPin, Calendar, ArrowLeft, Clock, Ruler } from 'lucide-react';
import Link from 'next/link';
import ShipmentMapWrapper from '../../cabinet/shipments/[id]/ShipmentMapWrapper';
import { computeEta, formatEtaDate, formatEtaRelative, type RouteSegment } from '@/lib/map-utils';
import { shipmentStatusMeta } from '@/lib/shipment-status';
import { isValidLocale } from '@/lib/i18n';
import { PageHeader } from '@/components/shared/PageHeader';

interface PublicTrackingDetailsPageProps {
  params: Promise<{ locale: string; code: string }>;
}

export default async function PublicTrackingDetailsPage({ params }: PublicTrackingDetailsPageProps) {
  const { locale, code } = await params;
  if (!isValidLocale(locale)) notFound();

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: code },
  });

  if (!shipment) {
    return (
      <div className="text-center py-20 min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Yuk topilmadi</h2>
        <p className="text-gray-500 mb-6">Siz qidirayotgan "{code}" raqamli yuk tizimda mavjud emas.</p>
        <Link href={`/${locale}/tracking`} className="px-6 py-3 bg-[#042C53] text-white rounded-xl shadow hover:bg-[#185FA5] transition-colors">
          Boshqa yuk qidirish
        </Link>
      </div>
    );
  }

  type TimelineEvent = { date?: string; location?: string; description?: string; status?: string };
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
    <div className="min-h-screen bg-gray-50 pb-16">
      <PageHeader titleKey="tracking.title" subtitleKey="tracking.subtitle" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/${locale}/tracking`} className="p-3 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h2 className="text-2xl font-bold text-[#042C53] flex items-center gap-2 bg-white px-6 py-2 rounded-2xl shadow-sm border">
            Tracking: <span className="font-mono text-[#185FA5]">{shipment.trackingCode}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="map">
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
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Jo'natish manzili</span>
                    <p className="font-bold text-gray-800">{shipment.origin || 'Noma\'lum'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Yetkazib berish manzili</span>
                    <p className="font-bold text-gray-800">{shipment.destination || 'Noma\'lum'}</p>
                  </div>
                  
                  <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Vazni</span>
                        <p className="text-sm font-semibold">{shipment.weight ? `${shipment.weight} tonna` : 'Noma\'lum'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Yangilangan sana</span>
                        <p className="text-sm font-semibold">{shipment.updatedAt.toLocaleDateString()}</p>
                    </div>
                  </div>
              </div>
            </div>

            {eta.etaDate && shipment.status !== 'delivered' && segments.length >= 2 && (
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow">
                        <Clock className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Taxminiy yetkazib berish</div>
                        <div className="text-xs text-slate-500">Avtomatik hisoblangan</div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                        <div className="text-xl font-bold text-slate-900">{formatEtaRelative(eta.etaDate, localeCode)}</div>
                        <div className="text-xs text-slate-600">{formatEtaDate(eta.etaDate, localeCode)}</div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-600">
                          <Ruler className="h-3 w-3" /> {eta.remainingKm.toFixed(0)} km
                        </div>
                        <div className="text-[11px] text-slate-500">{Math.round(eta.progress * 100)}% o'tilgan</div>
                    </div>
                  </div>
              </div>
            )}

            {shipment.status === 'delivered' && (
              <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-100 to-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-xl shadow">
                        ✓
                    </div>
                    <div>
                        <div className="text-sm font-bold text-emerald-800">Yuk muvaffaqiyatli yetkazildi</div>
                        <div className="text-xs text-slate-600">{shipment.updatedAt.toLocaleString()}</div>
                    </div>
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
                          <p className="text-xs text-gray-600 mt-1">{event.description || event.status}</p>
                        </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Side: Map */}
          <div className="xl:col-span-2 bg-white rounded-3xl border shadow-sm p-2 flex flex-col h-[700px] shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 mb-2 border-b bg-gray-50/50 rounded-t-2xl">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="font-bold text-[#042C53]">Jonli Xarita (Live Routing)</span>
              
              {(!shipment.originLat || !shipment.destinationLat) && (
                  <span className="ml-auto text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full font-medium border border-orange-100 shadow-sm">
                    Kordinatalar kiritilmagan
                  </span>
              )}
            </div>
            <div className="flex-1 relative rounded-xl overflow-hidden border">
              <ShipmentMapWrapper shipment={shipment} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
