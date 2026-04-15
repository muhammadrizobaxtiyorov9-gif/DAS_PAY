import { prisma } from '@/lib/prisma';
import { FileSignature } from 'lucide-react';
import { ContractRow } from './ContractRow';

export const revalidate = 0;

export default async function ContractsAdminPage() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <FileSignature className="h-6 w-6"/> Shartnomalar Arxivi
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Shartnoma №</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Kompaniya nomi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">INN</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Sana</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">O'chirish / Yuklash</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Hozircha hech qanday shartnomalar tuzilmagan.
                   </td>
                </tr>
              ) : contracts.map(contract => (
                <ContractRow key={contract.id} contract={contract} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
