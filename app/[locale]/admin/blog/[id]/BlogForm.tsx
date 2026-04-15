'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createBlogPost, updateBlogPost } from '@/app/actions/admin';

export function BlogForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeLang, setActiveLang] = useState<'uz' | 'ru' | 'en'>('uz');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    // Automatically generate slug from titleUz if empty
    let slug = formData.get('slug') as string;
    if (!slug) {
       const titleUz = formData.get('titleUz') as string;
       slug = titleUz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const data = {
      slug,
      titleUz: formData.get('titleUz') as string,
      titleRu: formData.get('titleRu') as string,
      titleEn: formData.get('titleEn') as string,
      contentUz: formData.get('contentUz') as string,
      contentRu: formData.get('contentRu') as string,
      contentEn: formData.get('contentEn') as string,
      excerptUz: formData.get('excerptUz') as string,
      excerptRu: formData.get('excerptRu') as string,
      excerptEn: formData.get('excerptEn') as string,
      image: (formData.get('image') as string) || null,
      published: formData.get('published') === 'true',
      publishedAt: formData.get('published') === 'true' ? new Date() : null
    };

    let result;
    if (initialData) {
      result = await updateBlogPost(initialData.id, data);
    } else {
      result = await createBlogPost(data);
    }

    if (result.success) {
      router.push('/uz/admin/blog');
    } else {
      setError(result.error || 'Serverda xatolik yuz berdi');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Havola qismi (Slug - ingliz harflarida)</label>
           <input 
             name="slug"
             defaultValue={initialData?.slug}
             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20"
             placeholder="masalan: xalqaro-logistika-kuni"
           />
           <p className="text-xs text-gray-400 mt-1">Bo'sh qoldirsangiz, o'zbekcha sarlavhadan yasaladi.</p>
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Rasm URL manzili (ixtiyoriy)</label>
           <input 
             name="image"
             defaultValue={initialData?.image}
             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20"
             placeholder="https://example.com/image.jpg"
           />
        </div>
      </div>

      <div className="border-b border-gray-200">
         <nav className="flex space-x-4">
            <button type="button" onClick={() => setActiveLang('uz')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeLang === 'uz' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>O'zbek tili</button>
            <button type="button" onClick={() => setActiveLang('ru')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeLang === 'ru' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Rus tili</button>
            <button type="button" onClick={() => setActiveLang('en')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeLang === 'en' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Ingliz tili</button>
         </nav>
      </div>

      <div className={activeLang !== 'uz' ? 'hidden' : 'space-y-4'}>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha (UZ)</label>
            <input required={activeLang==='uz'} name="titleUz" defaultValue={initialData?.titleUz} className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 outline-none border-gray-200" />
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qisqacha ta'rifi (UZ)</label>
            <textarea name="excerptUz" defaultValue={initialData?.excerptUz} rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2"></textarea>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asosiy matn (UZ)</label>
            <textarea required={activeLang==='uz'} name="contentUz" defaultValue={initialData?.contentUz} rows={8} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2"></textarea>
         </div>
      </div>

      <div className={activeLang !== 'ru' ? 'hidden' : 'space-y-4'}>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha (RU)</label>
            <input required={activeLang==='ru'} name="titleRu" defaultValue={initialData?.titleRu} className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 outline-none border-gray-200" />
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qisqacha ta'rifi (RU)</label>
            <textarea name="excerptRu" defaultValue={initialData?.excerptRu} rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2"></textarea>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asosiy matn (RU)</label>
            <textarea required={activeLang==='ru'} name="contentRu" defaultValue={initialData?.contentRu} rows={8} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2"></textarea>
         </div>
      </div>

      <div className={activeLang !== 'en' ? 'hidden' : 'space-y-4'}>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha (EN)</label>
            <input required={activeLang==='en'} name="titleEn" defaultValue={initialData?.titleEn} className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 outline-none border-gray-200" />
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qisqacha ta'rifi (EN)</label>
            <textarea name="excerptEn" defaultValue={initialData?.excerptEn} rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2"></textarea>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asosiy matn (EN)</label>
            <textarea required={activeLang==='en'} name="contentEn" defaultValue={initialData?.contentEn} rows={8} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2"></textarea>
         </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
         <input type="radio" id="st_draft" name="published" value="false" defaultChecked={!initialData?.published} />
         <label htmlFor="st_draft" className="text-gray-700 font-medium">Qoralama qilib saqlash (saytda ko'rinmaydi)</label>
         
         <input type="radio" id="st_pub" name="published" value="true" defaultChecked={initialData?.published} className="ml-5" />
         <label htmlFor="st_pub" className="text-purple-700 font-bold">Darhol nashr qilish (Saytga chiqadi)</label>
      </div>

      <div className="pt-6 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Saqlash' : 'Nashr Qilish'}
        </button>
      </div>
    </form>
  );
}
