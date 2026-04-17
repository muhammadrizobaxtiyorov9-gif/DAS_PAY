import { getAuthenticatedClient } from '../lib/clientAuth';
import { Package, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';

interface CabinetShipmentsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetShipmentsPage({ params, searchParams }: CabinetShipmentsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-[#042C53] flex items-center gap-2">
          <Truck className="text-[#185FA5]" /> Mening Yuklarim
        </h2>
        <span className="bg-[#185FA5] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          {client.shipments.length} yuk
        </span>
      </div>

      {client.shipments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <Truck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-600">Hozircha faol yuklaringiz yo'q</p>
          <p className="text-sm text-gray-400 mt-2">Yangi yuklar tizimga kiritilganda shu yerda xabardor bo'lasiz.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {client.shipments.map(shipment => (
            <Link href={`/${locale}/cabinet/shipments/${shipment.id}`} key={shipment.id}>
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.05] transition-all">
                  <Package className="w-32 h-32" />
                </div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tracking Kod</p>
                     <span className="font-mono font-black text-lg text-[#042C53] bg-gray-50 px-3 py-1 rounded-lg border group-hover:bg-blue-50 group-hover:text-[#185FA5] transition-colors">
                       {shipment.trackingCode}
                     </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider ${
                    shipment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    shipment.status === 'in_transit' ? 'bg-blue-100 text-[#185FA5] animate-pulse' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {shipment.status}
                  </span>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex bg-gray-50 rounded-2xl p-4 border border-gray-100 gap-4 relative isolate overflow-hidden">
                     <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-dashed border-l-2 border-dashed border-gray-300 -z-10" />
                     <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-3">
                           <div className="h-4 w-4 rounded-full bg-white border-4 border-gray-300 flex-shrink-0" />
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Qayerdan</p>
                              <p className="text-sm font-semibold text-gray-800 line-clamp-1">{shipment.origin}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="h-4 w-4 rounded-full bg-white border-4 border-[#185FA5] flex-shrink-0" />
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Qayerga</p>
                              <p className="text-sm font-semibold text-[#042C53] line-clamp-1">{shipment.destination}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1">
                     <Truck className="w-3.5 h-3.5" /> Vazni: {shipment.weight}
                  </div>
                  <span>Yangilangan: {shipment.updatedAt.toISOString().slice(0, 10)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
