import { prisma } from '@/lib/prisma';
import { getAuthenticatedClient } from '../../lib/clientAuth';
import { Package, Truck, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ShipmentMapWrapper from './ShipmentMapWrapper';

interface CabinetShipmentDetailsPageProps {
  params: Promise<{ locale: string, id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CabinetShipmentDetailsPage({ params, searchParams }: CabinetShipmentDetailsPageProps) {
  const { locale, id } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const shipmentId = parseInt(id);

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId }
  });

  if (!shipment || shipment.clientPhone !== client.phone) {
    return (
      <div className="text-center p-16">
        <h2 className="text-2xl font-bold text-gray-800">Yuk topilmadi</h2>
        <Link href={`/${locale}/cabinet/shipments`} className="text-blue-600 mt-4 inline-block">← Ortga qaytish</Link>
      </div>
    );
  }

  const events = typeof shipment.events === 'string' ? JSON.parse(shipment.events) : (shipment.events || []);

  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_transit: 'bg-blue-100 text-blue-700',
    customs: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700'
  };

  const statusLabels: any = {
    pending: 'Kutilmoqda',
    in_transit: 'Yo\'lda',
    customs: 'Bojxonada',
    delivered: 'Yetkazildi'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/cabinet/shipments`} className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h2 className="text-2xl font-bold text-[#042C53] flex items-center gap-2">
           Tracking: <span className="font-mono text-[#185FA5]">{shipment.trackingCode}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Details & Events */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                 <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Holat</span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[shipment.status]}`}>
                    {statusLabels[shipment.status] || shipment.status}
                 </span>
              </div>
              
              <div className="space-y-3">
                 <div>
                    <span className="text-xs text-gray-400 font-bold uppercase">Jo'natuvchi</span>
                    <p className="font-bold text-gray-800">{shipment.senderName}</p>
                 </div>
                 <div>
                    <span className="text-xs text-gray-400 font-bold uppercase">Qabul Qiluvchi</span>
                    <p className="font-bold text-gray-800">{shipment.receiverName}</p>
                 </div>
                 
                 <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Vazni</span>
                       <p className="text-sm font-semibold">{shipment.weight ? `${shipment.weight} kg` : 'Noma\'lum'}</p>
                    </div>
                    <div>
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Sana</span>
                       <p className="text-sm font-semibold">{shipment.createdAt.toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <h3 className="font-bold text-[#042C53] mb-4 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-[#185FA5]" /> Tracking Tarixi
              </h3>
              
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent pl-4">
                 {events.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center relative z-10 w-full">Hech qanday tarix mavjud emas</p>
                 ) : events.map((event: any, index: number) => (
                    <div key={index} className="relative flex items-start justify-between gap-4 py-2">
                       <div className="absolute left-[-23px] top-3 h-3 w-3 rounded-full bg-[#185FA5] ring-4 ring-blue-50" />
                       <div className="flex-1 bg-gray-50 border rounded-xl p-3 shadow-sm">
                          <p className="text-xs text-[#185FA5] font-bold mb-1">{event.date}</p>
                          <p className="text-sm font-semibold text-gray-800">{event.location}</p>
                          <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Side: Map */}
        <div className="xl:col-span-2 bg-white rounded-3xl border shadow-sm p-2 flex flex-col h-[600px]">
           <div className="flex items-center gap-2 px-4 py-3 mb-2 border-b">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="font-bold text-[#042C53]">Jonli Xarita (Live Routing)</span>
              
              {(!shipment.originLat || !shipment.destinationLat) && (
                 <span className="ml-auto text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium border border-orange-100">
                    Kordinatalar kiritilmagan
                 </span>
              )}
           </div>
           <div className="flex-1 relative">
              <ShipmentMapWrapper shipment={shipment} />
           </div>
        </div>
      </div>
    </div>
  );
}
