'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { MapPin } from 'lucide-react';

const LazyMap = lazy(() => import('./ShipmentMap'));

function MapLoader() {
  return (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center rounded-2xl">
      <MapPin className="text-gray-400 w-8 h-8" />
    </div>
  );
}

export default function ShipmentMapWrapper({ shipment }: { shipment: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <MapLoader />;
  return (
    <Suspense fallback={<MapLoader />}>
      <LazyMap shipment={shipment} />
    </Suspense>
  );
}
