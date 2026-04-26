'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
    <span
      title={connected ? `Live (${events.length} ta hodisa)` : 'Ulanish uzilgan'}
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'
        }`}
      />
      {connected ? 'Live' : 'Offline'}
    </span>
  );
}
