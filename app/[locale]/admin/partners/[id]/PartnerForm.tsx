'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPartner, updatePartner, type PartnerInput } from '@/app/actions/admin';
import { Save, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PartnerFormProps {
  locale: string;
  partner?: {
    id: number;
    name: string;
    logoUrl: string | null;
    color: string | null;
    active: boolean;
    order: number;
  };
}

export function PartnerForm({ locale, partner }: PartnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for image handling
  const [logoUrl, setLogoUrl] = useState(partner?.logoUrl || '');
  const [uploading, setUploading] = useState(false);

  // Convert uploaded file to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Fayl hajmi 2MB dan oshmasligi kerak!");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const input: PartnerInput = {
      name: String(fd.get('name') || '').trim(),
      logoUrl: logoUrl.trim() || null,
      color: String(fd.get('color') || '').trim() || null,
      active: fd.get('active') === 'on',
      order: Number(fd.get('order')) || 0,
    };

    if (!input.name) {
      setError("Kompaniya nomi kiritilishi shart");
      setLoading(false);
      return;
    }

    let res;
    if (partner) {
      res = await updatePartner(partner.id, input);
    } else {
      res = await createPartner(input);
    }

    if (res.success) {
      router.push(`/${locale}/admin/partners`);
      router.refresh();
    } else {
      setError(res.error || 'Xatolik yuz berdi');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/partners`}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {partner ? 'Hamkorni tahrirlash' : 'Yangi hamkor qo\'shish'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#185FA5] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#042C53] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Saqlash
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-4">Asosiy ma'lumotlar</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Kompaniya nomi *</label>
              <input
                name="name"
                defaultValue={partner?.name}
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                placeholder="Masalan: Maersk"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Logo manzili (URL) yoki rasm yuklash</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 mb-3"
              />
              <div className="relative overflow-hidden w-full">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button type="button" className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 hover:border-gray-400 transition">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {uploading ? "Yuklanmoqda..." : "Kompyuterdan rasm yuklash"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Rang kodi (ixtiyoriy)</label>
              <div className="flex gap-3">
                <input
                  name="color"
                  type="color"
                  defaultValue={partner?.color || '#042C53'}
                  className="h-10 w-16 cursor-pointer rounded-xl border-0 p-1"
                />
                <input
                  type="text"
                  name="colorText"
                  defaultValue={partner?.color || '#042C53'}
                  onChange={(e) => {
                    const colorInput = e.target.previousElementSibling as HTMLInputElement;
                    if(colorInput && e.target.value.startsWith('#')) colorInput.value = e.target.value;
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="#00243D"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Agar logo bo'lmasa matn ushbu rangda chiqadi</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-4">Sozlamalar</h2>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="active"
              defaultChecked={partner?.active ?? true}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="block text-sm font-medium text-gray-900">Aktiv (Saytda ko'rinadi)</span>
              <span className="text-xs text-gray-500">O'chirilgan hamkorlar saytda chiqmaydi</span>
            </div>
          </label>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tartib raqami</label>
            <input
              name="order"
              type="number"
              defaultValue={partner?.order ?? 0}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">Kichik raqamlar oldinroq chiqadi (0, 1, 2...)</p>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Saytda ko'rinishi (Preview)</h3>
            <div className="flex h-16 min-w-[160px] items-center justify-center rounded-lg bg-white px-6 shadow-md border">
              {logoUrl ? (
                <img src={logoUrl} alt="Preview" className="max-h-12 max-w-full object-contain" />
              ) : (
                <span className="text-lg font-bold" style={{ color: partner?.color || '#042C53' }}>
                  {partner?.name || "Kompaniya"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
