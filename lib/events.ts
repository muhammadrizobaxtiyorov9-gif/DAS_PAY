import 'server-only';

/**
 * Lightweight in-process pub/sub for SSE.
 * Single-instance only (Node process). For multi-instance deploy, swap with Redis.
 */
export type EventName =
  | 'lead.created'
  | 'shipment.statusChanged'
  | 'shipment.delivered'
  | 'invoice.paid'
  | 'driver.location'
  | 'notification';

interface BusEvent<T = unknown> {
  name: EventName;
  data: T;
  ts: number;
}

type Listener = (event: BusEvent) => void;

const listenersGlobal: Set<Listener> = ((globalThis as unknown as { __DASPAY_LISTENERS__?: Set<Listener> }).__DASPAY_LISTENERS__ ??= new Set());

export function publish<T>(name: EventName, data: T): void {
  const event: BusEvent<T> = { name, data, ts: Date.now() };
  for (const fn of listenersGlobal) {
    try {
      fn(event);
    } catch (err) {
      console.error('[bus] listener error', err);
    }
  }
}

export function subscribe(fn: Listener): () => void {
  listenersGlobal.add(fn);
  return () => listenersGlobal.delete(fn);
}
