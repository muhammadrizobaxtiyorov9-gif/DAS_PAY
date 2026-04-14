import { prisma } from '@/lib/prisma';
import { PackageSearch, Newspaper, Users, FileSignature, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

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

  const [shipmentsCount, blogCount, leadsCount, contractsCount, newLeadsCount] = await Promise.all([
    prisma.shipment.count(),
    prisma.blogPost.count(),
    prisma.lead.count(),
    prisma.contract.count(),
    prisma.lead.count({ where: { status: 'new' } }),
  ]).catch(() => [0, 0, 0, 0, 0]);

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
                <p className="text-sm font-medium text-gray-700">Ma'lumotlar bazasi (Prisma)</p>
                <p className="text-xs text-gray-400">PostgreSQL</p>
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
                <p className="text-xs text-gray-400">JWT (jose) orqali himoyalangan</p>
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
