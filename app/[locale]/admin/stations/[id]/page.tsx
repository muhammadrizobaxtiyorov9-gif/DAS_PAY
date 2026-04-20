import { prisma } from '@/lib/prisma';
import { Train } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StationForm } from './StationForm';

export const dynamic = 'force-dynamic';

export default async function StationEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const isNew = id === 'new';

  let station = null;
  if (!isNew) {
    station = await prisma.station.findUnique({ where: { id: parseInt(id) } });
    if (!station) notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#042C53] text-white shadow">
          <Train className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "Yangi stansiya qo'shish" : 'Stansiyani tahrirlash'}
          </h1>
          <p className="text-sm text-gray-500">
            {isNew
              ? "Stansiya nomi (3 tilda), kodi va xaritadagi joylashuvini kiriting."
              : "Ma'lumotlarni yangilang va saqlang."}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/stations`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Orqaga
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <StationForm initialData={station} locale={locale} />
      </div>
    </div>
  );
}
