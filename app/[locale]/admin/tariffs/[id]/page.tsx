import { prisma } from '@/lib/prisma';
import { Banknote } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TariffForm } from './TariffForm';

export const dynamic = 'force-dynamic';

export default async function TariffEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === 'new';

  let tariff = null;
  if (!isNew) {
    tariff = await prisma.tariff.findUnique({ where: { id: parseInt(id) } });
    if (!tariff) notFound();
  }

  const stations = await prisma.station.findMany({
    where: { active: true },
    select: { id: true, code: true, nameUz: true, country: true },
    orderBy: { nameUz: 'asc' }
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
          <Banknote className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Yangi tarif qo\'shish' : 'Tarifni tahrirlash'}
          </h1>
          <p className="text-sm text-gray-500">
            {isNew
              ? 'Yo\'nalish bo\'yicha tonna/baza narxini kiriting — kalkulyator shuni ishlatadi.'
              : 'Narx, transport turi yoki yo\'nalishni o\'zgartiring.'}
          </p>
        </div>
        <Link
          href="/uz/admin/tariffs"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Orqaga
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <TariffForm initialData={tariff} stations={stations} />
      </div>
    </div>
  );
}
