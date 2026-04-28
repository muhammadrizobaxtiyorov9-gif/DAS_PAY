'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { updateClientProfile } from '@/app/actions/client-profile';
import { Loader2, Save } from 'lucide-react';

interface Props {
  initialData: {
    name: string | null;
    companyName: string | null;
    companyInn: string | null;
    language: string;
    phone: string;
    telegramId: string | null;
  };
}

export function ClientProfileForm({ initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    companyName: initialData.companyName || '',
    companyInn: initialData.companyInn || '',
    language: initialData.language || 'uz',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    const res = await updateClientProfile(formData);
    if (res.success) {
      setSuccess(true);
      // If language changed, redirect to new locale URL
      if (formData.language !== initialData.language) {
         // pathname is like /uz/cabinet/settings. We replace /uz/ with /new_lang/
         const newPath = pathname.replace(/^\/[^\/]+/, `/${formData.language}`);
         router.push(newPath);
      } else {
         router.refresh();
      }
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Xatolik yuz berdi");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <h3 className="font-bold text-xl text-[#042C53] mb-6 border-b pb-4">Korxona va Shaxsiy Profil</h3>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">Ma'lumotlar saqlandi!</div>}

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div>
              <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">To'liq ismingiz</label>
              <input 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="F.I.SH."
              />
           </div>
           <div>
              <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Telefon raqam (Login)</label>
              <input 
                disabled
                value={initialData.phone}
                className="w-full px-4 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-[#185FA5] font-mono font-bold cursor-not-allowed opacity-70"
              />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div>
              <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Korxona nomi</label>
              <input 
                required
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="OOO Namuna"
              />
           </div>
           <div>
              <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">STIR (INN)</label>
              <input 
                required
                value={formData.companyInn}
                onChange={(e) => setFormData({...formData, companyInn: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="123456789"
                maxLength={9}
              />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div>
              <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Tizim tili</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({...formData, language: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                 <option value="uz">O'zbek tili</option>
                 <option value="ru">Русский</option>
                 <option value="en">English</option>
              </select>
           </div>
           <div>
              <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Telegram ID</label>
              <input 
                disabled
                value={initialData.telegramId || 'Ulanmagan'}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-mono cursor-not-allowed opacity-70"
              />
           </div>
        </div>

        <div className="pt-4 flex justify-end">
           <button 
             type="submit" 
             disabled={loading}
             className="inline-flex items-center gap-2 bg-[#185FA5] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#042C53] transition-colors"
           >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Saqlash
           </button>
        </div>
      </div>
    </form>
  );
}
