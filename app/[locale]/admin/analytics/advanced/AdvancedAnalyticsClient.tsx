'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, Users, MapPin, Target, Award } from 'lucide-react';

type Trend = { month: string; revenue: number; cost: number; count: number };
type FunnelStep = { status: string; label: string; count: number };
type Perf = { id: number; name: string; role: string; delivered: number; avgHours: number };
type Route = { route: string; count: number };

interface Props {
  revenueTrend: Trend[];
  funnel: FunnelStep[];
  conversion: number;
  performance: Perf[];
  topRoutes: Route[];
  shipments90d: number;
  retention: { ordersTotal: number; clientsTotal: number; avgOrdersPerClient: number };
}

const FUNNEL_COLORS = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const tones: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-700',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-700',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-700',
    purple: 'from-purple-500/10 to-purple-500/0 text-purple-700',
  };
  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tones[tone]} bg-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        <div className="rounded-xl bg-white/80 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function AdvancedAnalyticsClient({
  revenueTrend,
  funnel,
  conversion,
  performance,
  topRoutes,
  shipments90d,
  retention,
}: Props) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Kengaytirilgan analitika</h1>
        <p className="mt-1 text-sm text-slate-500">
          Daromad tendensiyalari, konversiya va xodimlar samaradorligi (oxirgi 6 oy / 90 kun)
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Daromad (6 oy)"
          value={revenueTrend.reduce((a, b) => a + b.revenue, 0).toLocaleString('uz-UZ')}
          tone="blue"
          hint="USD ekvivalent"
        />
        <StatCard
          icon={Target}
          label="Konversiya"
          value={`${conversion}%`}
          hint="pending → delivered"
          tone="emerald"
        />
        <StatCard
          icon={Users}
          label="Mijoz takror buyurtma"
          value={retention.avgOrdersPerClient.toFixed(2)}
          hint={`${retention.clientsTotal} mijoz · ${retention.ordersTotal} buyurtma`}
          tone="purple"
        />
        <StatCard
          icon={MapPin}
          label="Yuklar (90 kun)"
          value={String(shipments90d)}
          tone="amber"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Daromad tendensiyasi (oylik)</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" name="Daromad" />
              <Area type="monotone" dataKey="cost" stroke="#f43f5e" fill="url(#cost)" name="Xarajat" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Yuk konversiya voronkasi</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={funnel} isAnimationActive>
                  <LabelList position="right" fill="#0f172a" stroke="none" dataKey="label" />
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Award className="h-4 w-4 text-amber-500" /> Xodimlar samaradorligi (TOP-10)
          </h2>
          {performance.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">
              Hozircha yetkazilgan yuklar yo&apos;q
            </p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="delivered" fill="#3b82f6" name="Yetkazilgan" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Eng mashhur yo'nalishlar (heatmap)</h2>
        {topRoutes.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            Hozircha ma&apos;lumot yo&apos;q
          </p>
        ) : (
          <div className="space-y-2">
            {topRoutes.map((r, i) => {
              const max = topRoutes[0].count;
              const pct = max > 0 ? (r.count / max) * 100 : 0;
              return (
                <div key={r.route} className="flex items-center gap-3">
                  <span className="w-7 shrink-0 rounded bg-slate-100 px-2 py-0.5 text-center text-[11px] font-semibold text-slate-600">
                    {i + 1}
                  </span>
                  <span className="w-48 truncate text-sm font-medium text-slate-700">{r.route}</span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold text-slate-600">{r.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
