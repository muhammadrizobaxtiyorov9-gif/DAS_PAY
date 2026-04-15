'use client';

import { useState } from 'react';
import { Trash2, Edit2, Loader2, Link as LinkIcon } from 'lucide-react';
import { deleteBlogPost } from '@/app/actions/admin';
import Link from 'next/link';

export function BlogRow({ blog }: { blog: any }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Haqiqatan ham ushbu maqolani o`chirmokchimisiz?')) return;
    setIsDeleting(true);
    await deleteBlogPost(blog.id);
  }

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4 font-medium max-w-sm truncate text-gray-900">{blog.titleUz}</td>
      <td className="px-6 py-4 text-gray-500 font-mono text-xs flex items-center gap-1">
        <LinkIcon className="w-3 h-3" /> /{blog.slug}
      </td>
      <td className="px-6 py-4">
         <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${blog.published ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {blog.published ? 'Nashr qilingan' : 'Qoralama'}
         </span>
      </td>
      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
        <Link 
          href={`/uz/admin/blog/${blog.id}`}
          className="text-purple-500 hover:bg-purple-50 p-2 rounded-lg transition-colors flex items-center gap-1"
          title="Tahrirlash"
        >
          <Edit2 className="w-4 h-4" />
        </Link>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
          title="O'chirish"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}
