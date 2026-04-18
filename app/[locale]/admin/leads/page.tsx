import { prisma } from '@/lib/prisma';
import { Users, LayoutGrid, Table2, Download } from 'lucide-react';
import Link from 'next/link';
import { LeadRow } from './LeadRow';
import { LeadsKanban } from './LeadsKanban';

export const revalidate = 0;

export default async function LeadsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; assigned?: string }>;
}) {
  const sp = await searchParams;
  const view = sp.view === 'table' ? 'table' : 'kanban';

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    include: { assignee: { select: { id: true, name: true, username: true } } },
  });

  const staff = await prisma.user.findMany({
    select: { id: true, name: true, username: true },
  });

  const byStatus: Record<string, typeof leads> = {
    new: [],
    contacted: [],
    quoted: [],
    won: [],
    lost: [],
  };
  for (const l of leads) {
    const key = byStatus[l.status] ? l.status : 'new';
    byStatus[key].push(l);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Users className="h-6 w-6" /> Mijoz Arizalari Boshqaruvi
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {leads.length}
          </span>
        </h1>
        <div className="flex items-center gap-2">
        <a
          href="/api/admin/export?entity=leads"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          download
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </a>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <Link
            href="/uz/admin/leads"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'kanban' ? 'bg-[#185FA5] text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </Link>
          <Link
            href="/uz/admin/leads?view=table"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'table' ? 'bg-[#185FA5] text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" /> Jadval
          </Link>
        </div>
        </div>
      </div>

      {view === 'kanban' ? (
        <LeadsKanban columns={byStatus} staff={staff} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-900">Mijoz / Email</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Raqam</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Xizmat turi</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Mas'ul</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Sana</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900">O'chirish</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Hozircha hech qanday arizalar tushmagan.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => <LeadRow key={lead.id} lead={lead} staff={staff} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
