import { prisma } from '@/lib/prisma';
import { Banknote, Plus, Truck, Train, Plane, Ship, Boxes } from 'lucide-react';
import Link from 'next/link';
import { TariffRow } from './TariffRow';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

const MODE_ICON: Record<string, typeof Truck> = {
  truck: Truck,
  train: Train,
  air: Plane,
  sea: Ship,
  multimodal: Boxes,
};

export default async function TariffsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ active?: string }>;
}) {
  const sp = await searchParams;
  const onlyActive = sp.active === '1';

  const tariffs = await prisma.tariff.findMany({
    where: onlyActive ? { active: true } : {},
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  });

  const activeCount = tariffs.filter((t) => t.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tariflar katalogi</h1>
            <p className="text-sm text-gray-500">
              Jami <b>{tariffs.length}</b> ta yo'nalish · <b>{activeCount}</b> faol
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={onlyActive ? '?' : '?active=1'}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              onlyActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {onlyActive ? 'Faqat faol' : 'Barcha tariflar'}
          </Link>
          <Link
            href="/uz/admin/tariffs/new"
            className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]"
          >
            <Plus className="h-4 w-4" /> Yangi tarif
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-semibold">Yo'nalish</th>
                <th className="px-6 py-3 font-semibold">Turi</th>
                <th className="px-6 py-3 font-semibold text-right">Kg narxi</th>
                <th className="px-6 py-3 font-semibold text-right">Asosiy haq</th>
                <th className="px-6 py-3 font-semibold text-right">Min kg</th>
                <th className="px-6 py-3 font-semibold text-center">Kun</th>
                <th className="px-6 py-3 font-semibold text-center">Holat</th>
                <th className="px-6 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tariffs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    Hozircha tariflar yo'q. Yangi tarif qo'shing.
                  </td>
                </tr>
              ) : (
                tariffs.map((t) => {
                  const Icon = MODE_ICON[t.mode] || Truck;
                  return (
                    <TariffRow
                      key={t.id}
                      tariff={{
                        id: t.id,
                        name: t.name,
                        originCountry: t.originCountry,
                        originCity: t.originCity,
                        destCountry: t.destCountry,
                        destCity: t.destCity,
                        mode: t.mode,
                        pricePerKg: t.pricePerKg,
                        baseFee: t.baseFee,
                        minWeight: t.minWeight,
                        currency: t.currency,
                        transitDays: t.transitDays,
                        active: t.active,
                      }}
                      pricePerKgFormatted={formatMoney(t.pricePerKg, t.currency)}
                      baseFeeFormatted={formatMoney(t.baseFee, t.currency)}
                      modeIconName={t.mode}
                    />
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
