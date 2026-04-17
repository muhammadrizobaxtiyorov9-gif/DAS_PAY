'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const DynamicMap = dynamic(() => import('./ShipmentMap'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center rounded-2xl">
      <MapPin className="text-gray-400 w-8 h-8" />
    </div>
  )
});

export default function ShipmentMapWrapper({ shipment }: { shipment: any }) {
  return <DynamicMap shipment={shipment} />;
}
