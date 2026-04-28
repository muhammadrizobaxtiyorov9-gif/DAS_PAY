import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserCircle, Phone, Search, Package, FileSignature } from 'lucide-react';
import { getAdminSession } from '@/lib/adminAuth';
import { ClientDeleteButton } from './ClientDeleteButton';

export const dynamic = 'force-dynamic';

export default async function ClientsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const session = await getAdminSession();
  const isSuperAdmin = session?.role === 'SUPERADMIN';

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { phone: { contains: q } },
            { name: { contains: q, mode: 'insensitive' } },
            { telegramId: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      _count: { select: { shipments: true, invoices: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#185FA5] text-white shadow">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mijozlar</h1>
            <p className="text-sm text-gray-500">
              Jami <b>{clients.length}</b> ta yozuv
            </p>
          </div>
        </div>

        <form method="GET" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Telefon yoki ism..."
            className="w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-[#185FA5] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-semibold">Mijoz</th>
                <th className="px-6 py-3 font-semibold">Korxona nomi</th>
                <th className="px-6 py-3 font-semibold">Telefon</th>
                <th className="px-6 py-3 font-semibold text-center">Yuklar</th>
                <th className="px-6 py-3 font-semibold text-center">Invoyslar</th>
                <th className="px-6 py-3 font-semibold">Qo&apos;shilgan</th>
                {isSuperAdmin && <th className="px-6 py-3 font-semibold text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-16 text-center text-slate-500">
                    {q ? 'Hech narsa topilmadi.' : "Mijozlar hali qo'shilmagan."}
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-3">
                      <Link
                        href={`/uz/admin/clients/${c.id}`}
                        className="flex items-center gap-3 font-semibold text-[#185FA5] hover:underline"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          {(c.name || c.phone || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <span>{c.name || '—'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {(c as any).companyName || '—'}
                    </td>
                    <td className="px-6 py-3 font-mono text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <Package className="h-3 w-3" /> {c._count.shipments}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <FileSignature className="h-3 w-3" /> {c._count.invoices}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {c.createdAt.toLocaleDateString('uz-UZ')}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-3 text-right">
                        <ClientDeleteButton clientId={c.id} clientName={c.name || c.phone} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
