import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';
import { LeadRow } from './LeadRow';

export const revalidate = 0;

export default async function LeadsAdminPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <Users className="h-6 w-6"/> Mijoz Arizalari Boshqaruvi
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Mijoz / Email</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Raqam</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Xizmat turi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Sana</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">O'chirish</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Hozircha hech qanday arizalar tushmagan.
                   </td>
                </tr>
              ) : leads.map(lead => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
