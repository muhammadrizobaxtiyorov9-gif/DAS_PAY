import { prisma } from '@/lib/prisma';
import { Newspaper, Plus } from 'lucide-react';

export const revalidate = 0;

export default async function BlogAdminPage() {
  const blogs = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <Newspaper className="h-6 w-6"/> Maqolalar (Blog) Boshqaruvi
        </h1>
        <button className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]">
          <Plus className="h-4 w-4" /> Yangi Maqola Yozish
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Sarlavha (O'zbek)</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Url qismi (Slug)</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blogs.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Hozircha hech qanday maqola yozilmagan.
                   </td>
                </tr>
              ) : blogs.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium max-w-sm truncate">{b.titleUz}</td>
                  <td className="px-6 py-4 text-gray-500">/{b.slug}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {b.published ? 'Nashr qilingan' : 'Qoralama'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-blue-500 hover:underline">Tahrirlash</button>
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
