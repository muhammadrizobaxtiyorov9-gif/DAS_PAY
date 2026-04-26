import { prisma } from '@/lib/prisma';
import { DispatchGanttClient } from './DispatchGanttClient';
import { getAdminSession } from '@/lib/adminAuth';
import { branchWhere } from '@/lib/branch';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DispatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin-login`);

  const sp = await searchParams;
  const startDate = sp.start ? new Date(sp.start) : new Date();
  startDate.setHours(0, 0, 0, 0);
  // Snap to Monday of that week
  const dow = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - dow);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14); // 2-week window

  const branchScope = branchWhere(session);

  const [trucks, shipments] = await Promise.all([
    prisma.truck.findMany({
      where: { status: { not: 'maintenance' }, ...branchScope },
      orderBy: [{ status: 'asc' }, { plateNumber: 'asc' }],
      include: {
        driver: { select: { id: true, name: true, username: true } },
      },
    }),
    prisma.shipment.findMany({
      where: {
        trucks: { some: {} },
        ...branchScope,
        OR: [
          { status: { notIn: ['delivered', 'unloaded', 'cancelled'] } },
          { updatedAt: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        id: true,
        trackingCode: true,
        origin: true,
        destination: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        etaAt: true,
        receivedAt: true,
        trucks: { select: { id: true } },
      },
    }),
  ]);

  // Build per-truck bar list
  const bars: Array<{
    truckId: number;
    shipmentId: number;
    trackingCode: string;
    origin: string;
    destination: string;
    status: string;
    startMs: number;
    endMs: number;
  }> = [];

  for (const s of shipments) {
    for (const t of s.trucks) {
      const start = s.createdAt.getTime();
      // End: receivedAt > etaAt > updatedAt (for delivered) > start + 1d
      const end =
        s.receivedAt?.getTime() ??
        s.etaAt?.getTime() ??
        (s.status === 'delivered' || s.status === 'unloaded' ? s.updatedAt.getTime() : start + 24 * 3600_000);
      bars.push({
        truckId: t.id,
        shipmentId: s.id,
        trackingCode: s.trackingCode,
        origin: s.origin,
        destination: s.destination,
        status: s.status,
        startMs: start,
        endMs: Math.max(end, start + 4 * 3600_000), // min 4h bar so always visible
      });
    }
  }

  return (
    <DispatchGanttClient
      trucks={trucks.map((t) => ({
        id: t.id,
        plateNumber: t.plateNumber,
        model: t.model,
        status: t.status,
        driverName: t.driver?.name || t.driver?.username || null,
      }))}
      bars={bars}
      startMs={startDate.getTime()}
      days={14}
    />
  );
}
