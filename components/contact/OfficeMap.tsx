'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface OfficeMapProps {
  lat: number;
  lng: number;
  address: string;
  label: string;
}

const OfficeMapInner = dynamic(() => import('./OfficeMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#042C53]/5 to-[#185FA5]/10">
      <Loader2 className="h-8 w-8 animate-spin text-[#185FA5]" />
    </div>
  ),
});

export function OfficeMap(props: OfficeMapProps) {
  return <OfficeMapInner {...props} />;
}
