import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Package, Truck, Clock, CheckCircle2, MapPin, Calendar, Weight, Ruler } from 'lucide-react';
import { computeEta, formatEtaDate, formatEtaRelative, type RouteSegment } from '@/lib/map-utils';

interface TrackingDetailsPageProps {
  params: Promise<{
    locale: string;
    code: string;
  }>;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  in_transit: Truck,
  inTransit: Truck,
  customs: Package,
  delivered: CheckCircle2,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-500 bg-yellow-500/10',
  processing: 'text-blue-500 bg-blue-500/10',
  in_transit: 'text-[#185FA5] bg-[#185FA5]/10',
  inTransit: 'text-[#185FA5] bg-[#185FA5]/10',
  customs: 'text-orange-500 bg-orange-500/10',
  delivered: 'text-green-500 bg-green-500/10',
};

export default async function TrackingDetailsPage({ params }: TrackingDetailsPageProps) {
  const { code, locale } = await params;
  const formattedCode = decodeURIComponent(code).replace(/[\s-]/g, '').toUpperCase();

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: formattedCode },
  });

  if (!shipment) {
    notFound();
  }

  const eventsArray = Array.isArray(shipment.events) 
    ? shipment.events 
    : typeof shipment.events === 'string' 
        ? JSON.parse(shipment.events) 
        : [];

  const events = eventsArray.map((event: any) => ({
    ...event,
    status: event.status?.[locale] || event.status?.uz || event.status,
  }));

  const StatusIcon = statusIcons[shipment.status] || Package;

  const rawSegments = typeof shipment.routeSegments === 'string'
    ? (() => { try { return JSON.parse(shipment.routeSegments as unknown as string); } catch { return []; } })()
    : Array.isArray(shipment.routeSegments) ? shipment.routeSegments : [];
  const segments: RouteSegment[] = (rawSegments as unknown[]).map((s) => s as RouteSegment);
  const eta = computeEta(segments, shipment.status, shipment.currentLat, shipment.currentLng);
  const localeCode: 'uz' | 'ru' | 'en' = locale === 'ru' || locale === 'en' ? locale : 'uz';
  const etaTitle =
    localeCode === 'ru' ? 'Ожидаемая доставка' : localeCode === 'en' ? 'Estimated delivery' : 'Taxminiy yetkazib berish';
  const remainingTitle =
    localeCode === 'ru' ? 'Осталось' : localeCode === 'en' ? 'Remaining' : 'Qolgan masofa';
  const progressTitle =
    localeCode === 'ru' ? 'Прогресс' : localeCode === 'en' ? 'Progress' : 'Progress';

  return (
    <div className="min-h-screen bg-secondary py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">
          {locale === 'uz' ? 'Yukingiz holati' : locale === 'ru' ? 'Статус груза' : 'Shipment Status'}
        </h1>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b bg-muted/30 p-6 md:flex-row md:items-center md:justify-between p-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {locale === 'uz' ? 'Treking kodi' : locale === 'ru' ? 'Трек-код' : 'Tracking Code'}
              </p>
              <h2 className="mt-1 flex items-center gap-3 text-2xl font-bold font-mono text-[#185FA5]">
                {shipment.trackingCode}
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div
                className={`mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${
                  statusColors[shipment.status] || 'text-gray-500 bg-gray-500/10'
                }`}
              >
                <StatusIcon className="h-5 w-5" />
                {shipment.status}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-6 border-b p-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-50 p-3 text-[#185FA5] dark:bg-blue-900/20">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jo'natuvchi & Manzil</p>
                  <p className="font-semibold text-lg">{shipment.origin}</p>
                  <p className="text-sm text-foreground/80">{shipment.senderName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-start gap-4">
                <div className="rounded-xl bg-green-50 p-3 text-green-600 dark:bg-green-900/20">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Qabul qiluvchi & Manzil</p>
                  <p className="font-semibold text-lg">{shipment.destination}</p>
                  <p className="text-sm text-foreground/80">{shipment.receiverName}</p>
                </div>
              </div>
            </div>
          </div>
          
          {eta.etaDate && shipment.status !== 'delivered' && segments.length >= 2 && (
            <div className="border-b p-8">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-5 ring-1 ring-emerald-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{etaTitle}</div>
                      <div className="text-xl font-bold text-slate-900">{formatEtaRelative(eta.etaDate, localeCode)}</div>
                      <div className="text-xs text-slate-600">{formatEtaDate(eta.etaDate, localeCode)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Ruler className="h-3 w-3" /> {remainingTitle}
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-slate-800">{eta.remainingKm.toFixed(0)} km</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{progressTitle}</div>
                      <div className="mt-0.5 text-lg font-bold text-slate-800">{Math.round(eta.progress * 100)}%</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                    style={{ width: `${Math.round(eta.progress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 border-b p-8 md:grid-cols-3 bg-muted/10">
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><Weight className="w-4 h-4"/> Og'irligi</p>
                  <p className="font-semibold">{shipment.weight ? `${shipment.weight} tonna` : 'Noma\'lum'}</p>
              </div>
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><Package className="w-4 h-4"/> Tarkibi</p>
                  <p className="font-semibold">{shipment.description || 'Noma\'lum'}</p>
              </div>
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Oxirgi yangilanish</p>
                  <p className="font-semibold">{shipment.updatedAt.toISOString().slice(0, 16).replace('T', ' ')}</p>
              </div>
          </div>

          {/* Timeline Events */}
          <div className="p-8">
            <h3 className="mb-6 text-lg font-bold">Kuzatuv tarixi (Timeline)</h3>
            {events.length > 0 ? (
              <div className="space-y-6">
                {events.reverse().map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          index === 0
                            ? 'bg-[#185FA5] text-white shadow-md'
                            : 'bg-muted border text-muted-foreground'
                        }`}
                      >
                         {index === 0 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      {index < events.length - 1 && (
                        <div className="h-full w-0.5 mt-2 bg-border relative"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                       <div className={`rounded-xl border p-4 ${index === 0 ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10' : 'bg-card'}`}>
                           <p className={`font-semibold ${index === 0 ? 'text-[#185FA5]' : 'text-foreground'}`}>{event.status}</p>
                           <p className="mt-1 text-sm text-muted-foreground">
                             {event.location} • {event.date}
                           </p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">
                    Hozircha tarix mavjud emas
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
