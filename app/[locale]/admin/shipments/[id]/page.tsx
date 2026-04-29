import { prisma } from '@/lib/prisma';
import { Package, FileSignature, FileText, Edit2, CalendarPlus, Eye } from 'lucide-react';
import Link from 'next/link';
import { ShipmentForm } from './ShipmentForm';
import { ShipmentTimelineEditor } from './ShipmentTimelineEditor';
import { FinancialsCard } from './FinancialsCard';
import AdminShipmentMap from './AdminShipmentMap';
import { ShipmentDocuments } from '@/components/shared/ShipmentDocuments';
import { notFound } from 'next/navigation';
import { getAdminSession } from '@/lib/adminAuth';
import { branchWhere } from '@/lib/branch';

export const dynamic = 'force-dynamic';

type Tab = 'edit' | 'events' | 'track';

const TABS: { key: Tab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { key: 'edit', label: 'Tahrirlash', icon: <Edit2 className="h-4 w-4" />, color: 'text-slate-500 hover:text-blue-600 hover:bg-blue-50', activeColor: 'text-blue-700 bg-blue-50 border-blue-600' },
  { key: 'events', label: 'Voqealar', icon: <CalendarPlus className="h-4 w-4" />, color: 'text-slate-500 hover:text-amber-600 hover:bg-amber-50', activeColor: 'text-amber-700 bg-amber-50 border-amber-600' },
  { key: 'track', label: 'Kuzatish', icon: <Eye className="h-4 w-4" />, color: 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50', activeColor: 'text-emerald-700 bg-emerald-50 border-emerald-600' },
];

export default async function ShipmentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const tab: Tab = isNew ? 'edit' : (['edit', 'events', 'track'].includes(sp.tab || '') ? sp.tab as Tab : 'edit');

  let shipment = null;
  let hasClientTelegram = false;
  if (!isNew) {
    shipment = await prisma.shipment.findUnique({
      where: { id: parseInt(id) },
      include: { wagons: true, trucks: true }
    });
    if (!shipment) notFound();

    if (shipment.clientPhone) {
      const client = await prisma.client.findUnique({
        where: { phone: shipment.clientPhone },
        select: { telegramId: true },
      });
      hasClientTelegram = !!client?.telegramId;
    }
  }

  const session = await getAdminSession();
  const branchScope = session ? branchWhere(session) : {};

  // Only fetch wagons/trucks for edit tab, logs for track tab
  const needsVehicles = isNew || tab === 'edit';
  const needsLogs = !isNew && tab === 'track';

  const [logs, allWagons, allTrucks] = await Promise.all([
    needsLogs
      ? prisma.truckLocationLog.findMany({
          where: { shipmentId: parseInt(id) },
          orderBy: { createdAt: 'asc' },
          select: { lat: true, lng: true, speed: true, isStop: true, createdAt: true },
        })
      : Promise.resolve([]),
    needsVehicles
      ? prisma.wagon.findMany({
          where: { ...branchScope, status: { notIn: ['maintenance'] } },
          orderBy: { number: 'asc' },
          include: {
            shipments: {
              where: { status: { notIn: ['delivered', 'unloaded'] } },
              select: { id: true, trackingCode: true, status: true },
            },
          },
        })
      : Promise.resolve([]),
    needsVehicles
      ? prisma.truck.findMany({
          where: { ...branchScope, status: { notIn: ['maintenance'] } },
          orderBy: { plateNumber: 'asc' },
          include: {
            shipments: {
              where: { status: { notIn: ['delivered', 'unloaded'] } },
              select: { id: true, trackingCode: true, status: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const serializedLogs = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  const events =
    shipment && Array.isArray(shipment.events)
      ? (shipment.events as unknown[]).map(
          (e) =>
            e as {
              status: string | { uz?: string; ru?: string; en?: string };
              location?: string;
              date?: string;
              note?: string;
              lat?: number;
              lng?: number;
              addedBy?: string;
            },
        )
      : [];

  const pageTitle = isNew ? 'Yangi Yuk Kiritish' : `${shipment?.trackingCode} — ${tab === 'edit' ? 'Tahrirlash' : tab === 'events' ? 'Voqealar' : 'Kuzatish'}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Package className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500">
            {isNew ? 'Mijoz uchun yangi logistika marshrutini oching.' : `Yuk: ${shipment?.origin} → ${shipment?.destination}`}
          </p>
        </div>
        {!isNew && shipment && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/uz/admin/waybill/${shipment.trackingCode}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <FileText className="h-4 w-4" /> CMR / Waybill
            </Link>
            <Link
              href={`/uz/admin/invoices/new?shipmentId=${shipment.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FileSignature className="h-4 w-4" /> Invoys yaratish
            </Link>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      {!isNew && shipment && (
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/uz/admin/shipments/${id}?tab=${t.key}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                tab === t.key ? t.activeColor : `${t.color} border-transparent`
              }`}
            >
              {t.icon} {t.label}
            </Link>
          ))}
        </div>
      )}

      {/* TAB: Edit */}
      {tab === 'edit' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <ShipmentForm initialData={shipment} allWagons={allWagons} allTrucks={allTrucks} />
          </div>
          {!isNew && shipment && (
            <FinancialsCard
              shipmentId={shipment.id}
              initial={{
                revenue: (shipment as any).revenue ?? 0,
                cost: (shipment as any).cost ?? 0,
                currency: (shipment as any).currency ?? 'USD',
                transportMode: (shipment as any).transportMode ?? null,
                distanceKm: (shipment as any).distanceKm ?? null,
                etaAt: (shipment as any).etaAt?.toISOString() ?? null,
              }}
            />
          )}
        </div>
      )}

      {/* TAB: Events */}
      {tab === 'events' && !isNew && shipment && (
        <ShipmentTimelineEditor
          shipmentId={shipment.id}
          trackingCode={shipment.trackingCode}
          currentStatus={shipment.status}
          events={events}
          hasClientTelegram={hasClientTelegram}
          transportMode={(shipment as any).transportMode || 'train'}
        />
      )}

      {/* TAB: Track */}
      {tab === 'track' && !isNew && shipment && (
        <>
          <AdminShipmentMap 
            shipmentId={shipment.id} 
            logs={serializedLogs}
            origin={shipment.origin}
            destination={shipment.destination}
            transportMode={(shipment as any).transportMode || 'train'}
            originLat={(shipment as any).originLat ?? undefined}
            originLng={(shipment as any).originLng ?? undefined}
            destLat={(shipment as any).destinationLat ?? undefined}
            destLng={(shipment as any).destinationLng ?? undefined}
            routeSegments={
              typeof (shipment as any).routeSegments === 'string'
                ? (() => { try { return JSON.parse((shipment as any).routeSegments); } catch { return []; } })()
                : Array.isArray((shipment as any).routeSegments) ? (shipment as any).routeSegments : []
            }
          />

          <ShipmentDocuments shipmentId={shipment.id} defaultKind="cmr" />
        </>
      )}
    </div>
  );
}
