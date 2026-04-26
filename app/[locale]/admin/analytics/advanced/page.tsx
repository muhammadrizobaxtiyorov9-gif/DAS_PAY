import { prisma } from '@/lib/prisma';
import { AdvancedAnalyticsClient } from './AdvancedAnalyticsClient';

export const dynamic = 'force-dynamic';

interface MonthBucket {
  month: string;
  revenue: number;
  cost: number;
  count: number;
}

const FUNNEL_ORDER = [
  'pending',
  'confirmed',
  'arrived_at_loading',
  'loaded',
  'in_transit',
  'delivered',
];

const FUNNEL_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlandi',
  arrived_at_loading: 'Yuklashda',
  loaded: 'Yuklangan',
  in_transit: "Yo'lda",
  delivered: 'Yetkazildi',
};

export default async function AdvancedAnalyticsPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);

  const [shipments6m, shipments90d, deliveredWithDuration, statusGroups, retentionRows] =
    await Promise.all([
      prisma.shipment.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: {
          createdAt: true,
          revenue: true,
          cost: true,
          origin: true,
          destination: true,
          status: true,
          assignedToId: true,
          updatedAt: true,
        },
      }),
      prisma.shipment.findMany({
        where: { createdAt: { gte: ninetyDaysAgo } },
        select: { status: true, createdAt: true },
      }),
      prisma.shipment.findMany({
        where: { status: 'delivered', updatedAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true, updatedAt: true, assignedToId: true },
      }),
      prisma.shipment.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { createdAt: { gte: ninetyDaysAgo } },
      }),
      prisma.$queryRaw<Array<{ orders: bigint; clients: bigint }>>`
        SELECT count(*) as orders, count(distinct "clientPhone") as clients
        FROM "Shipment"
        WHERE "clientPhone" IS NOT NULL
          AND "createdAt" >= ${sixMonthsAgo}
      `,
    ]);

  // 6-month revenue trend (UZS-equivalent rough sum, no FX yet)
  const monthMap = new Map<string, MonthBucket>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(sixMonthsAgo.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { month: key, revenue: 0, cost: 0, count: 0 });
  }
  for (const s of shipments6m) {
    const d = s.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = monthMap.get(key);
    if (b) {
      b.revenue += s.revenue ?? 0;
      b.cost += s.cost ?? 0;
      b.count += 1;
    }
  }
  const revenueTrend = Array.from(monthMap.values());

  // Funnel
  const statusCount = new Map<string, number>();
  for (const r of statusGroups) statusCount.set(r.status, r._count.status);
  const funnel = FUNNEL_ORDER.map((status) => ({
    status,
    label: FUNNEL_LABEL[status] ?? status,
    count: statusCount.get(status) ?? 0,
  }));
  // Conversion: pending → delivered
  const totalIn = funnel[0].count + funnel.slice(1).reduce((a, b) => a + b.count, 0);
  const delivered = funnel[funnel.length - 1].count;
  const conversion = totalIn > 0 ? Math.round((delivered / totalIn) * 100) : 0;

  // Driver / employee performance — avg hours per shipment, count
  const driverMap = new Map<number, { count: number; totalHours: number }>();
  for (const s of deliveredWithDuration) {
    if (!s.assignedToId) continue;
    const hrs = (s.updatedAt.getTime() - s.createdAt.getTime()) / 3_600_000;
    const cur = driverMap.get(s.assignedToId) ?? { count: 0, totalHours: 0 };
    cur.count += 1;
    cur.totalHours += hrs;
    driverMap.set(s.assignedToId, cur);
  }
  const driverIds = Array.from(driverMap.keys());
  const drivers = driverIds.length
    ? await prisma.user.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true, username: true, role: true },
      })
    : [];
  const performance = drivers
    .map((d) => {
      const m = driverMap.get(d.id)!;
      return {
        id: d.id,
        name: d.name || d.username,
        role: d.role,
        delivered: m.count,
        avgHours: m.count > 0 ? +(m.totalHours / m.count).toFixed(1) : 0,
      };
    })
    .sort((a, b) => b.delivered - a.delivered)
    .slice(0, 10);

  // Geographic heatmap = top routes
  const routeMap = new Map<string, number>();
  for (const s of shipments6m) {
    if (!s.origin || !s.destination) continue;
    const key = `${s.origin} → ${s.destination}`;
    routeMap.set(key, (routeMap.get(key) ?? 0) + 1);
  }
  const topRoutes = Array.from(routeMap.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Client retention
  const retention = retentionRows[0];
  const ordersTotal = Number(retention?.orders ?? BigInt(0));
  const clientsTotal = Number(retention?.clients ?? BigInt(0));
  const retentionPct = clientsTotal > 0 ? +(ordersTotal / clientsTotal).toFixed(2) : 0;

  return (
    <AdvancedAnalyticsClient
      revenueTrend={revenueTrend}
      funnel={funnel}
      conversion={conversion}
      performance={performance}
      topRoutes={topRoutes}
      shipments90d={shipments90d.length}
      retention={{
        ordersTotal,
        clientsTotal,
        avgOrdersPerClient: retentionPct,
      }}
    />
  );
}
