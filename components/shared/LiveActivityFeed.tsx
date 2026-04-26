'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useDashboardStream } from '@/hooks/useDashboardStream';

const LABELS: Record<string, string> = {
  'lead.created': 'Yangi ariza',
  'shipment.statusChanged': 'Yuk holati',
  'shipment.delivered': 'Yuk yetkazildi',
  'invoice.paid': 'Hisob to\'landi',
  'driver.location': 'Driver pozitsiya',
  'notification': 'Bildirishnoma',
};

interface Props {
  /** When provided, the component is silent (no toasts) — only the badge */
  silent?: boolean;
}

export function LiveActivityFeed({ silent = false }: Props) {
  const { connected, events } = useDashboardStream(['lead', 'shipment', 'invoice', 'notification']);
  const seenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (silent || events.length === 0) return;
    const top = events[0];
    if (seenRef.current.has(top.ts)) return;
    seenRef.current.add(top.ts);

    const label = LABELS[top.name] || top.name;
    const desc = (() => {
      const d = top.data;
      if (top.name === 'lead.created') return `${d.name ?? '—'} · ${d.phone ?? ''}`;
      if (top.name === 'shipment.statusChanged' || top.name === 'shipment.delivered') {
        return `${d.trackingCode ?? ''} → ${d.status ?? ''}`;
      }
      if (top.name === 'invoice.paid') return `Hisob #${d.number ?? d.id ?? ''}`;
      if (top.name === 'notification') return String(d.title ?? '');
      return '';
    })();

    if (top.name === 'shipment.delivered') {
      toast.success(`${label}: ${desc}`);
    } else if (top.name === 'lead.created') {
      toast(`${label}`, { description: desc });
    } else {
      toast.message(label, { description: desc });
    }
  }, [events, silent]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium">
      {connected ? (
        <>
          <Wifi className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-700">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-slate-400" />
          <span className="text-slate-500">Offline</span>
        </>
      )}
      <Activity className="h-3 w-3 text-slate-400" />
      <span className="text-slate-500">{events.length}</span>
    </div>
  );
}
