import { prisma } from '@/lib/prisma';
import { FileSignature } from 'lucide-react';

export const revalidate = 0;

export default async function ContractsAdminPage() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <FileSignature className="h-6 w-6"/> Tuzilgan Shartnomalar
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900"># Raqam</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Kompaniya (Mijoz)</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Sana</th>
                <th className="px-6 py-4 font-semibold text-gray-900">INN</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Fayl</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Tizimda shartnomalar yo'q.
                   </td>
                </tr>
              ) : contracts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono font-medium text-blue-600">№ {c.contractNumber}</td>
                  <td className="px-6 py-4 font-medium">{c.companyName}</td>
                  <td className="px-6 py-4 text-gray-500">{c.contractDate}</td>
                  <td className="px-6 py-4 font-mono">{c.companyInn}</td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-blue-500 hover:underline">Yuklab olish</button>
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
