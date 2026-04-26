import { prisma } from '@/lib/prisma';
import {
  PackageSearch,
  Newspaper,
  Users,
  FileSignature,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';

export const revalidate = 0;

async function getLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  return locale;
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getLocale(params);

  const now = new Date();

  const [
    shipmentsCount,
    blogCount,
    leadsCount,
    contractsCount,
    newLeadsCount,
    invoiceGroups,
    overdueList,
  ] = await Promise.all([
    prisma.shipment.count(),
    prisma.blogPost.count(),
    prisma.lead.count(),
    prisma.contract.count(),
    prisma.lead.count({ where: { status: 'new' } }),
    prisma.invoice.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { total: true, paidAmount: true },
    }),
    prisma.invoice.findMany({
      where: {
        status: { in: ['sent', 'overdue'] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        client: { select: { name: true, phone: true, telegramId: true } },
        shipment: { select: { trackingCode: true } },
      },
    }),
  ]);

  const arStats = invoiceGroups.reduce(
    (acc, g) => {
      const outstanding = (g._sum.total || 0) - (g._sum.paidAmount || 0);
      if (g.status === 'sent' || g.status === 'overdue') {
        acc.outstanding += outstanding;
        acc.outstandingCount += g._count.status;
      }
      if (g.status === 'paid') {
        acc.collected += g._sum.total || 0;
        acc.paidCount += g._count.status;
      }
      if (g.status === 'overdue') acc.overdueCount += g._count.status;
      if (g.status === 'draft') acc.draftCount += g._count.status;
      return acc;
    },
    { outstanding: 0, outstandingCount: 0, collected: 0, paidCount: 0, overdueCount: 0, draftCount: 0 },
  );

  const overdueCountEffective = overdueList.length + arStats.overdueCount;

  const cards = [
    {
      name: 'Yuklar',
      value: shipmentsCount,
      href: `/${locale}/admin/shipments`,
      icon: PackageSearch,
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      name: 'Maqolalar',
      value: blogCount,
      href: `/${locale}/admin/blog`,
      icon: Newspaper,
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
    },
    {
      name: 'Arizalar',
      value: leadsCount,
      extra: newLeadsCount > 0 ? `+${newLeadsCount} yangi` : null,
      href: `/${locale}/admin/leads`,
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      name: 'Shartnomalar',
      value: contractsCount,
      href: `/${locale}/admin/contracts`,
      icon: FileSignature,
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Boshqaruv Paneli</h1>
        <p className="mt-1 text-sm text-gray-500">Tizim holati va asosiy ko'rsatkichlar</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{card.value}</span>
                  {card.extra && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                      {card.extra}
                    </span>
                  )}
                </div>
              </div>
              <div className={`rounded-xl bg-gradient-to-br ${card.gradient} p-2.5 shadow-lg ${card.shadow}`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-gray-400 transition-colors group-hover:text-blue-500">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Batafsil ko'rish</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Accounts Receivable */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 text-amber-800">
            <Wallet className="h-5 w-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">Qarz (Receivable)</h3>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-900">
            {formatMoney(arStats.outstanding, 'USD')}
          </div>
          <div className="mt-1 text-xs text-amber-700">
            {arStats.outstandingCount} ta invoys to'lovni kutmoqda
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <MiniRow
              label="Muddati o'tgan"
              value={arStats.overdueCount + (overdueList.length - arStats.overdueCount)}
              icon={AlertTriangle}
              tone="red"
            />
            <MiniRow label="Yuborilgan" value={arStats.outstandingCount - arStats.overdueCount} icon={Clock} tone="blue" />
            <MiniRow label="To'langan" value={arStats.paidCount} icon={CheckCircle2} tone="emerald" />
            <MiniRow label="Qoralama" value={arStats.draftCount} icon={FileSignature} tone="slate" />
          </div>

          <Link
            href={`/${locale}/admin/invoices`}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
          >
            Barcha invoyslarni ko'rish →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Muddati o'tgan invoyslar
              </h3>
              <p className="text-xs text-slate-400">Eng yaqin 5 ta — tez ta'sir kerak</p>
            </div>
            <Link
              href={`/${locale}/admin/invoices?status=overdue`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Barchasi ({overdueCountEffective})
            </Link>
          </div>

          {overdueList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              Muddati o'tgan invoyslar yo'q — zo'r ish!
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdueList.map((inv) => {
                const daysOver = Math.max(
                  0,
                  Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
                );
                const balance = inv.total - inv.paidAmount;
                const clientLabel =
                  inv.client?.name || inv.client?.phone || (inv.clientPhone ? `+${inv.clientPhone}` : 'Noma\'lum');
                return (
                  <li key={inv.id} className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Link
                        href={`/${locale}/admin/invoices/${inv.id}`}
                        className="font-mono text-sm font-semibold text-[#185FA5] hover:underline"
                      >
                        {inv.number}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {clientLabel}
                        {inv.shipment?.trackingCode && ` · #${inv.shipment.trackingCode}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-red-600">
                        {formatMoney(balance, inv.currency)}
                      </div>
                      <div className="text-[11px] text-red-500">
                        {daysOver} kun kechikdi
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Tizim Holati</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Ma'lumotlar bazasi</p>
                <p className="text-xs text-gray-400">Barcha yozuvlar saqlanmoqda</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Onlayn
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <PackageSearch className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Xavfsizlik tizimi</p>
                <p className="text-xs text-gray-400">Sessiya shifrlangan</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Aktiv
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniRow({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'red' | 'blue' | 'emerald' | 'slate';
}) {
  const toneMap = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    slate: 'text-slate-500',
  } as const;
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-600">
        <Icon className={`h-3.5 w-3.5 ${toneMap[tone]}`} />
        {label}
      </span>
      <span className={`font-mono font-semibold ${toneMap[tone]}`}>{value}</span>
    </div>
  );
}
