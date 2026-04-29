'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

function MapLoader() {
  return (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center rounded-2xl">
      <MapPin className="text-gray-400 w-8 h-8" />
    </div>
  );
}

const DynamicMap = dynamic(() => import('./ShipmentMap'), {
  ssr: false,
  loading: () => <MapLoader />
});

export default function ShipmentMapWrapper({ shipment }: { shipment: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <MapLoader />;
  return <DynamicMap shipment={shipment} />;
}
