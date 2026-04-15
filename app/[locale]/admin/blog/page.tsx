import { prisma } from '@/lib/prisma';
import { Newspaper, Plus } from 'lucide-react';
import Link from 'next/link';
import { BlogRow } from './BlogRow';

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
        <Link 
          href="/uz/admin/blog/new"
          className="flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A3D6E]"
        >
          <Plus className="h-4 w-4" /> Yangi Maqola Yozish
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Sarlavha (O'zbek)</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Url qismi (Slug)</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holat</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">O'chirish / Tahrir</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blogs.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Hozircha hech qanday maqola yozilmagan.
                   </td>
                </tr>
              ) : blogs.map(b => (
                <BlogRow key={b.id} blog={b} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
