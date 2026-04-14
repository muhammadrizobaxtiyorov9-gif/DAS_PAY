import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';

export const revalidate = 0;

export default async function LeadsAdminPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <Users className="h-6 w-6"/> Mijoz Arizalari (Leads)
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Mijoz Ismi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Aloqa</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Xizmat Turi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Sana</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Hozircha ariza tushmagan.
                   </td>
                </tr>
              ) : leads.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{l.name}</td>
                  <td className="px-6 py-4">{l.phone}<br/><span className="text-xs text-gray-400">{l.email || 'Email yo\'q'}</span></td>
                  <td className="px-6 py-4">{l.service || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{l.createdAt.toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.status === 'new' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {l.status === 'new' ? 'Yangi' : 'O\'qildi'}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
