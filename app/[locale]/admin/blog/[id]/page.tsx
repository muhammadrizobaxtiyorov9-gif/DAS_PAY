import { prisma } from '@/lib/prisma';
import { Newspaper } from 'lucide-react';
import { BlogForm } from './BlogForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === 'new';

  let blog = null;
  if (!isNew) {
    blog = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) }
    });
    if (!blog) notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
          <Newspaper className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Yangi Maqola Yozish' : "Maqolani tahrirlash"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isNew ? "Blog sahifasi uchun yangi ma'lumotlar qo'shing." : "Yozilgan maqolani o'zgartirish."}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <BlogForm initialData={blog} />
      </div>
    </div>
  );
}
