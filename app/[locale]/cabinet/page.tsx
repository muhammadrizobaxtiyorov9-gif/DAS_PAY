import { getAuthenticatedClient } from './lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { Package, ListChecks, Truck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CabinetPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetPage({ params, searchParams }: CabinetPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const activeLeadsCount = await prisma.lead.count({
    where: { phone: client.phone, status: { not: 'completed' } }
  });

   const activeShipments = client.shipments.filter(s => s.status !== 'delivered');
   const deliveredShipmentsCount = client.shipments.length - activeShipments.length;

   const needsPassword = !(client as any).password;
   const needsCompany = !(client as any).companyName || !(client as any).companyInn;

   return (
      <div className="space-y-6">
        {(needsPassword || needsCompany) && (
           <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-[0.05]">
                 <Package className="w-32 h-32" />
              </div>
              <div className="flex-1 relative z-10">
                 <h3 className="text-orange-800 font-bold text-sm">Eslatma! Profilingiz to'liq emas.</h3>
                 <p className="text-orange-700 text-xs mt-1">
                    {needsPassword && needsCompany 
                       ? "Xavfsizlik parolini o'rnatmagansiz va korxona ma'lumotlarini kiritmagansiz. Yuk qabul qilish va xavfsizlik uchun ularni to'ldirish zarur."
                       : needsPassword 
                          ? "Keyingi safar tizimga oson va xavfsiz kirish uchun shaxsiy parol o'rnating."
                          : "Yuk kiritish uchun korxona ma'lumotlari (Nomi va INN) to'liq emas."}
                 </p>
              </div>
              <Link href={`/${locale}/cabinet/settings`} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap relative z-10 shadow-sm">
                 Sozlamalarga o'tish
              </Link>
           </div>
        )}
       
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Package className="w-48 h-48" />
           </div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#042C53] to-[#185FA5] text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-500/20">
                {client.name ? client.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#042C53] tracking-tight">Xush kelibsiz, {client.name || 'Hurmatli mijoz'}</h1>
                <p className="text-[#185FA5] mt-1 font-mono text-sm md:text-base px-2 py-0.5 bg-blue-50 rounded-md inline-block border border-blue-100 shadow-sm">
                  {client.phone}
                </p>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Truck className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-gray-500">Faol yuklar</p>
                    <p className="text-2xl font-black text-[#042C53]">{activeShipments.length} ta</p>
                 </div>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#185FA5] flex items-center justify-center">
                    <ListChecks className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-gray-500">Jarayondagi arizalar</p>
                    <p className="text-2xl font-black text-[#042C53]">{activeLeadsCount} ta</p>
                 </div>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <Package className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-gray-500">Yetkazilgan yuklar</p>
                    <p className="text-2xl font-black text-[#042C53]">{deliveredShipmentsCount} ta</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Links / Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                 <h2 className="text-lg font-bold text-[#042C53] mb-2 flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#185FA5]" /> Yuklarni kuzatish
                 </h2>
                 <p className="text-gray-500 text-sm">Sizga yuborilgan barcha faol va yetkazilgan yuklarni batafsil kartasi hamda holatini to'liq tracking qiling.</p>
              </div>
              <Link href={`/${locale}/cabinet/shipments`} className="mt-6 flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border transition-colors group">
                 <span className="font-semibold text-gray-700">Yuklarimga o'tish</span>
                 <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#042C53] transition-colors" />
              </Link>
           </div>
           
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                 <h2 className="text-lg font-bold text-[#042C53] mb-2 flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-[#185FA5]" /> Xizmatlarga ariza berish
                 </h2>
                 <p className="text-gray-500 text-sm">Yangi yuk yoki konsolidatsiya masalalarida ariza o'rnating. Bizning menejerlar darhol siz bilan bog'lanishadi.</p>
              </div>
              <div className="mt-6 flex gap-3">
                 <Link href={`/${locale}/cabinet/leads`} className="flex-1 text-center bg-[#042C53] hover:bg-[#185FA5] text-white p-3 rounded-xl font-bold transition-colors">
                    Yangi ariza yaratish
                 </Link>
                 <Link href={`/${locale}/cabinet/leads`} className="bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border flex items-center justify-center transition-colors">
                    <ArrowRight className="h-5 w-5 text-gray-500" />
                 </Link>
              </div>
           </div>
        </div>

     </div>
  );
}
