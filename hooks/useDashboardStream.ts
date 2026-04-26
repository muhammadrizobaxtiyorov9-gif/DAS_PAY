'use client';

import { useEffect, useRef, useState } from 'react';

export type DashEventName =
  | 'lead.created'
  | 'shipment.statusChanged'
  | 'shipment.delivered'
  | 'invoice.paid'
  | 'driver.location'
  | 'notification';

export interface DashEvent {
  name: DashEventName;
  data: Record<string, unknown>;
  ts: number;
}

export function useDashboardStream(topics?: string[]) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<DashEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = topics && topics.length ? `/api/stream?topics=${topics.join(',')}` : '/api/stream';
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('open', () => setConnected(true));
    es.addEventListener('error', () => setConnected(false));

    const NAMES: DashEventName[] = [
      'lead.created',
      'shipment.statusChanged',
      'shipment.delivered',
      'invoice.paid',
      'driver.location',
      'notification',
    ];

    const handlers: Array<[DashEventName, (e: MessageEvent) => void]> = [];
    for (const name of NAMES) {
      const fn = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setEvents((prev) => [{ name, data, ts: data.ts || Date.now() }, ...prev].slice(0, 200));
        } catch {
          /* malformed message */
        }
      };
      es.addEventListener(name, fn as EventListener);
      handlers.push([name, fn]);
    }

    return () => {
      for (const [n, fn] of handlers) es.removeEventListener(n, fn as EventListener);
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics?.join(',')]);

  return { connected, events };
}
