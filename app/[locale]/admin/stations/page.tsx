import { prisma } from '@/lib/prisma';
import { Train, Plus, MapPin } from 'lucide-react';
import Link from 'next/link';
import { StationRow } from './StationRow';
import { CountryFilter } from './CountryFilter';

export const dynamic = 'force-dynamic';

export default async function StationsAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; country?: string; active?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const query = sp.q?.trim() || '';
  const countryFilter = sp.country?.trim() || '';
  const onlyActive = sp.active === '1';

  const where: any = {};
  if (onlyActive) where.active = true;
  if (countryFilter) where.country = { contains: countryFilter, mode: 'insensitive' };
  if (query) {
    where.OR = [
      { nameUz: { contains: query, mode: 'insensitive' } },
      { nameRu: { contains: query, mode: 'insensitive' } },
      { nameEn: { contains: query, mode: 'insensitive' } },
      { code: { contains: query, mode: 'insensitive' } },
    ];
  }

  const stations = await prisma.station.findMany({
    where,
    select: {
      id: true,
      code: true,
      nameUz: true,
      nameRu: true,
      nameEn: true,
      country: true,
      lat: true,
      lng: true,
      active: true,
    },
    orderBy: [{ active: 'desc' }, { nameUz: 'asc' }],
  });

  const activeCount = stations.filter((s) => s.active).length;

  // Get unique countries for filter
  const allCountries = await prisma.station.findMany({
    distinct: ['country'],
    select: { country: true },
    orderBy: { country: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#042C53] text-white shadow">
            <Train className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Temir yo&apos;l stansiyalari</h1>
            <p className="text-sm text-gray-500">
              Jami <b>{stations.length}</b> ta stansiya · <b>{activeCount}</b> faol
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={onlyActive ? `/${locale}/admin/stations` : `/${locale}/admin/stations?active=1`}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              onlyActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {onlyActive ? 'Faqat faol' : 'Barcha stansiyalar'}
          </Link>
          <Link
            href={`/${locale}/admin/stations/new`}
            className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]"
          >
            <Plus className="h-4 w-4" /> Yangi stansiya
          </Link>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[200px]" action="" method="get">
          <input
            name="q"
            defaultValue={query}
            placeholder="Stansiya nomi yoki kodi bo'yicha qidirish..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          {countryFilter && <input type="hidden" name="country" value={countryFilter} />}
          {onlyActive && <input type="hidden" name="active" value="1" />}
        </form>
        <CountryFilter countries={allCountries} currentCountry={countryFilter} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-semibold">Nomi</th>
                <th className="px-6 py-3 font-semibold">Kod</th>
                <th className="px-6 py-3 font-semibold">Davlat</th>
                <th className="px-6 py-3 font-semibold text-center">Koordinatalar</th>
                <th className="px-6 py-3 font-semibold text-center">Holat</th>
                <th className="px-6 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Train className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                    <p className="font-medium">Hozircha stansiyalar yo&apos;q</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Yangi stansiya qo&apos;shish uchun yuqoridagi tugmani bosing
                    </p>
                  </td>
                </tr>
              ) : (
                stations.map((s) => (
                  <StationRow key={s.id} station={s} locale={locale} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
