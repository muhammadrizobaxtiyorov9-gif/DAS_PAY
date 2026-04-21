import { getAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Handshake } from 'lucide-react';
import { PartnerRow } from './PartnerRow';

export const dynamic = 'force-dynamic';

export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin-login`);
  if (session.role !== 'SUPERADMIN') notFound();

  const partners = await prisma.partner.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hamkorlar</h1>
          <p className="text-sm text-gray-500">
            Tizimdagi barcha hamkorlar va ularning logotiplarini boshqarish.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/partners/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#185FA5] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#042C53]"
        >
          <Plus className="h-4 w-4" />
          Hamkor qo'shish
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Hamkor</th>
                <th className="px-6 py-4 font-medium">Tartib raqami</th>
                <th className="px-6 py-4 text-center font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Handshake className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    Hamkorlar qo'shilmagan
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <PartnerRow key={p.id} partner={p} locale={locale} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
