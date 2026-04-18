import { prisma } from '@/lib/prisma';
import { FileText, Plus, AlertCircle, CheckCircle2, Clock, Send, FileSignature, Download } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Qoralama', color: 'bg-slate-100 text-slate-600', icon: FileText },
  sent: { label: 'Yuborilgan', color: 'bg-blue-100 text-blue-700', icon: Send },
  paid: { label: "To'langan", color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Muddati o\'tgan', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelled: { label: 'Bekor qilingan', color: 'bg-gray-200 text-gray-600', icon: Clock },
};

export default async function InvoicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filterStatus = sp.status || undefined;

  const now = new Date();
  // Flip sent invoices past due date to overdue virtually (aggregate only)
  const where: Record<string, unknown> = {};
  if (filterStatus) where.status = filterStatus;

  const [invoices, groups] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        shipment: { select: { trackingCode: true } },
        client: { select: { name: true, phone: true } },
      },
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const statsByStatus = Object.fromEntries(
    groups.map((g) => [g.status, { count: g._count.status, total: g._sum.total || 0, paid: g._sum.paidAmount || 0 }]),
  );
  const totalOutstanding = groups
    .filter((g) => g.status === 'sent' || g.status === 'overdue')
    .reduce((s, g) => s + ((g._sum.total || 0) - (g._sum.paidAmount || 0)), 0);
  const totalPaid = statsByStatus.paid?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
            <FileSignature className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hisob-fakturalar</h1>
            <p className="text-sm text-gray-500">
              Jami <b>{invoices.length}</b> ta yozuv
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/export?entity=invoices${filterStatus ? `&status=${filterStatus}` : ''}`}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            download
          >
            <Download className="h-4 w-4" /> CSV
          </a>
          <Link
            href="/uz/admin/invoices/new"
            className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]"
          >
            <Plus className="h-4 w-4" /> Yangi invoys
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Qarz (sent + overdue)" value={formatMoney(totalOutstanding, 'USD')} accent="amber" />
        <StatCard label="To'langan" value={formatMoney(totalPaid, 'USD')} accent="emerald" />
        <StatCard label="Qoralama" value={String(statsByStatus.draft?.count || 0)} accent="slate" />
        <StatCard label="Muddati o'tgan" value={String(statsByStatus.overdue?.count || 0)} accent="red" />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip label="Barchasi" href="/uz/admin/invoices" active={!filterStatus} />
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <FilterChip
            key={key}
            label={`${meta.label} (${statsByStatus[key]?.count || 0})`}
            href={`/uz/admin/invoices?status=${key}`}
            active={filterStatus === key}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-semibold">Raqam</th>
                <th className="px-6 py-3 font-semibold">Mijoz</th>
                <th className="px-6 py-3 font-semibold">Yuk</th>
                <th className="px-6 py-3 font-semibold">Sanalar</th>
                <th className="px-6 py-3 font-semibold text-right">Summa</th>
                <th className="px-6 py-3 font-semibold text-center">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    Hozircha invoyslar yo'q.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const meta = STATUS_META[inv.status] || STATUS_META.draft;
                  const effectiveOverdue =
                    inv.status === 'sent' && inv.dueDate < now && inv.paidAmount < inv.total;
                  const displayMeta = effectiveOverdue ? STATUS_META.overdue : meta;
                  const Icon = displayMeta.icon;
                  return (
                    <tr key={inv.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-3 font-mono font-semibold text-[#185FA5]">
                        <Link href={`/uz/admin/invoices/${inv.id}`}>{inv.number}</Link>
                      </td>
                      <td className="px-6 py-3">
                        {inv.client?.name || inv.client?.phone || (inv.clientPhone ? `+${inv.clientPhone}` : '—')}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">
                        {inv.shipment?.trackingCode || '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        <div>Berilgan: {inv.issueDate.toLocaleDateString('uz-UZ')}</div>
                        <div className={effectiveOverdue ? 'text-red-600 font-semibold' : ''}>
                          Muddat: {inv.dueDate.toLocaleDateString('uz-UZ')}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-800">
                        {formatMoney(inv.total, inv.currency)}
                        {inv.paidAmount > 0 && inv.paidAmount < inv.total && (
                          <div className="text-[11px] font-normal text-emerald-600">
                            To'langan: {formatMoney(inv.paidAmount, inv.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${displayMeta.color}`}>
                          <Icon className="h-3 w-3" />
                          {displayMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'amber' | 'emerald' | 'slate' | 'red' }) {
  const colors = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
    red: 'border-red-200 bg-red-50 text-red-900',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'border-[#185FA5] bg-[#185FA5] text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </Link>
  );
}
