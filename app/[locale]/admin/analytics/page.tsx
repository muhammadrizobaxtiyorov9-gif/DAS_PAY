import { prisma } from '@/lib/prisma';
import { TrendingUp, Package, Clock, CheckCircle2, AlertTriangle, Target, Users, DollarSign, Wallet } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { AnalyticsTabs } from './AnalyticsTabs';

export const dynamic = 'force-dynamic';

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const now = new Date();
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);
  const last7 = new Date(now);
  last7.setDate(last7.getDate() - 7);

  const [
    shipmentsByStatus,
    shipments30,
    deliveredShipments,
    leadsGroups,
    leadsLast30,
    invoicesGroups,
    invoicesPaid30,
    trackingQueries30,
  ] = await Promise.all([
    prisma.shipment.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.shipment.findMany({
      where: { createdAt: { gte: last30 } },
      select: { createdAt: true, status: true, origin: true, destination: true },
    }),
    prisma.shipment.findMany({
      where: { status: 'delivered', updatedAt: { gte: last30 } },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.lead.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.lead.count({ where: { createdAt: { gte: last30 } } }),
    prisma.invoice.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { total: true, paidAmount: true },
    }),
    prisma.invoice.findMany({
      where: { status: 'paid', paidAt: { gte: last30 } },
      select: { total: true, currency: true, paidAt: true },
    }),
    prisma.trackingQuery.groupBy({
      by: ['trackingCode'],
      _count: { trackingCode: true },
      where: { createdAt: { gte: last30 } },
      orderBy: { _count: { trackingCode: 'desc' } },
      take: 10,
    }).catch(() => [] as Array<{ trackingCode: string; _count: { trackingCode: number } }>),
  ]);

  const marginRows = await prisma.shipment.findMany({
    where: { createdAt: { gte: last30 } },
    select: {
      revenue: true,
      cost: true,
      currency: true,
    } as never,
  }).catch(() => [] as Array<{ revenue: number; cost: number; currency: string }>);

  const marginUSD = (marginRows as Array<{ revenue: number; cost: number; currency: string }>)
    .filter((r) => (r.currency || 'USD') === 'USD')
    .reduce(
      (acc, r) => {
        acc.revenue += r.revenue || 0;
        acc.cost += r.cost || 0;
        return acc;
      },
      { revenue: 0, cost: 0 },
    );
  const marginValue = marginUSD.revenue - marginUSD.cost;
  const marginPct = marginUSD.revenue > 0 ? Math.round((marginValue / marginUSD.revenue) * 100) : 0;

  const shipmentStatusMap = Object.fromEntries(
    shipmentsByStatus.map((g) => [g.status, g._count.status]),
  );
  const totalShipments = shipmentsByStatus.reduce((s, g) => s + g._count.status, 0);
  const deliveredCount = shipmentStatusMap.delivered || 0;
  const inTransitCount = shipmentStatusMap.in_transit || 0;
  const pendingCount = shipmentStatusMap.pending || 0;

  const leadsStatusMap = Object.fromEntries(leadsGroups.map((g) => [g.status, g._count.status]));
  const wonCount = leadsStatusMap.won || 0;
  const lostCount = leadsStatusMap.lost || 0;
  const totalClosed = wonCount + lostCount;
  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

  const avgTransitMs = deliveredShipments.length
    ? deliveredShipments.reduce(
        (sum, s) => sum + (s.updatedAt.getTime() - s.createdAt.getTime()),
        0,
      ) / deliveredShipments.length
    : 0;
  const avgTransitDays = avgTransitMs > 0 ? (avgTransitMs / (1000 * 60 * 60 * 24)).toFixed(1) : '—';

  // 30-day shipment volume by day
  const dailyBuckets: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyBuckets[startOfDayUTC(d).toISOString().slice(0, 10)] = 0;
  }
  for (const s of shipments30) {
    const key = startOfDayUTC(s.createdAt).toISOString().slice(0, 10);
    if (dailyBuckets[key] !== undefined) dailyBuckets[key]++;
  }
  const dailySeries = Object.entries(dailyBuckets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
  const maxDaily = Math.max(1, ...dailySeries.map((d) => d.count));

  // Top lanes
  const laneMap: Record<string, number> = {};
  for (const s of shipments30) {
    const key = `${s.origin} → ${s.destination}`;
    laneMap[key] = (laneMap[key] || 0) + 1;
  }
  const topLanes = Object.entries(laneMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Financials
  const invoiceOutstanding = invoicesGroups
    .filter((g) => g.status === 'sent' || g.status === 'overdue')
    .reduce((s, g) => s + ((g._sum.total || 0) - (g._sum.paidAmount || 0)), 0);
  const collectedLast30USD = invoicesPaid30
    .filter((i) => i.currency === 'USD')
    .reduce((s, i) => s + i.total, 0);
  const overdueInvoicesCount = invoicesGroups.find((g) => g.status === 'overdue')?._count.status || 0;

  const last7Count = shipments30.filter((s) => s.createdAt >= last7).length;
  const prior7Count = shipments30.filter((s) => {
    const d = s.createdAt;
    const prev = new Date(last7);
    prev.setDate(prev.getDate() - 7);
    return d >= prev && d < last7;
  }).length;
  const deltaPct =
    prior7Count === 0
      ? last7Count > 0
        ? 100
        : 0
      : Math.round(((last7Count - prior7Count) / prior7Count) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operatsion Analitika</h1>
        <p className="mt-1 text-sm text-gray-500">Oxirgi 30 kunlik ko'rsatkichlar va tendensiyalar</p>
      </div>

      <AnalyticsTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Jami yuklar"
          value={String(totalShipments)}
          sub={`Oxirgi 7 kun: ${last7Count} (${deltaPct >= 0 ? '+' : ''}${deltaPct}%)`}
          icon={Package}
          accent="blue"
        />
        <KpiCard
          label="Yo'lda"
          value={String(inTransitCount)}
          sub={`Kutilmoqda: ${pendingCount}`}
          icon={Clock}
          accent="amber"
        />
        <KpiCard
          label="O'rtacha transit"
          value={avgTransitDays === '—' ? '—' : `${avgTransitDays} kun`}
          sub={`Yetkazildi (30 kun): ${deliveredShipments.length}`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          label="Win-rate"
          value={`${winRate}%`}
          sub={`Yutildi ${wonCount} / Yutilmadi ${lostCount}`}
          icon={Target}
          accent="purple"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Marja (30 kun, USD)"
          value={`$${marginValue.toFixed(0)}`}
          sub={`Daromad: $${marginUSD.revenue.toFixed(0)} · Xarajat: $${marginUSD.cost.toFixed(0)} · ${marginPct}%`}
          icon={Wallet}
          accent={marginValue >= 0 ? 'emerald' : 'red'}
        />
        <KpiCard
          label="Qabul qilindi (30 kun)"
          value={formatMoney(collectedLast30USD, 'USD')}
          sub={`Ochiq qarz: ${formatMoney(invoiceOutstanding, 'USD')}`}
          icon={DollarSign}
          accent="blue"
        />
        <KpiCard
          label="Muddati o'tgan invoyslar"
          value={String(overdueInvoicesCount)}
          sub={`Jami mijozlar arizasi: ${leadsLast30}`}
          icon={AlertTriangle}
          accent={overdueInvoicesCount > 0 ? 'red' : 'slate'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Kunlik yuk hajmi</h3>
              <p className="text-xs text-slate-400">Oxirgi 30 kun</p>
            </div>
            <TrendingUp className="h-5 w-5 text-[#185FA5]" />
          </div>
          <div className="flex h-48 items-end gap-1">
            {dailySeries.map((d) => {
              const heightPct = (d.count / maxDaily) * 100;
              return (
                <div
                  key={d.date}
                  className="group relative flex-1 rounded-t bg-gradient-to-t from-[#185FA5] to-[#4D8FDF] transition-all hover:from-[#042C53]"
                  style={{ height: `${Math.max(2, heightPct)}%` }}
                  title={`${d.date}: ${d.count}`}
                >
                  <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>{dailySeries[0]?.date.slice(5)}</span>
            <span>{dailySeries[dailySeries.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">Yuk holati</h3>
          <div className="space-y-3">
            {Object.entries(shipmentStatusMap).map(([status, count]) => {
              const pct = totalShipments > 0 ? (count / totalShipments) * 100 : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{status}</span>
                    <span className="font-mono text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#185FA5] to-[#4D8FDF]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
            TOP marshrutlar (30 kun)
          </h3>
          {topLanes.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Ma'lumot yetarli emas</p>
          ) : (
            <ul className="space-y-2">
              {topLanes.map(([lane, count]) => {
                const maxCount = topLanes[0][1];
                const pct = (count / maxCount) * 100;
                return (
                  <li key={lane} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate font-medium text-slate-700">{lane}</span>
                        <span className="font-mono font-semibold text-slate-600">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#185FA5]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800">
              <DollarSign className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Qabul qilindi (30d)</h3>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-900">
              {formatMoney(collectedLast30USD, 'USD')}
            </div>
            <Link
              href={`/${locale}/admin/invoices?status=paid`}
              className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline"
            >
              To'langan invoyslar →
            </Link>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Qarz (Outstanding)</h3>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-900">
              {formatMoney(invoiceOutstanding, 'USD')}
            </div>
            <div className="mt-1 text-xs text-amber-700">
              Muddati o'tgan: <b>{overdueInvoicesCount}</b>
            </div>
            <Link
              href={`/${locale}/admin/invoices?status=overdue`}
              className="mt-3 inline-block text-xs font-semibold text-amber-700 hover:underline"
            >
              Muddati o'tganlar →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#185FA5]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Arizalar pipeline</h3>
          </div>
          <div className="space-y-2">
            {['new', 'contacted', 'quoted', 'won', 'lost'].map((st) => {
              const count = leadsStatusMap[st] || 0;
              return (
                <div key={st} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700 capitalize">{st}</span>
                  <span className="font-mono text-sm font-bold text-slate-800">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Oxirgi 30 kunda: <b>{leadsLast30}</b> ta ariza
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
            TOP tracking so'rovlari
          </h3>
          {trackingQueries30.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Ma'lumot yo'q</p>
          ) : (
            <ul className="space-y-1.5">
              {trackingQueries30.map((q) => (
                <li key={q.trackingCode} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                  <span className="font-mono text-[#185FA5]">{q.trackingCode}</span>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    {q._count.trackingCode}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'blue' | 'amber' | 'emerald' | 'purple' | 'red' | 'slate';
}) {
  const accents = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    red: 'from-red-500 to-rose-500 shadow-red-500/20',
    slate: 'from-slate-400 to-slate-500 shadow-slate-500/20',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${accents[accent]} p-2.5 shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">{sub}</div>
    </div>
  );
}
