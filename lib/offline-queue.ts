/**
 * Tiny offline queue for the driver app. When the truck loses signal in a
 * tunnel or rural area, GPS pings are buffered in localStorage instead of
 * being dropped. As soon as the browser reports `online` (or the next ping
 * succeeds), the queue is drained in-order.
 *
 * Why localStorage and not IndexedDB: the driver workload is tiny (one
 * lat/lng pair every 15s, at most ~50 entries during a long tunnel). The
 * sync semantics matter more than raw throughput, and localStorage is
 * dead simple and supported on every mobile browser including iOS Safari
 * (which doesn't ship Background Sync at all).
 */

const QUEUE_KEY = 'daspay:driver:offline_pings';
const MAX_ENTRIES = 100;

export interface QueuedPing {
  lat: number;
  lng: number;
  /** Unix ms when the ping was captured. */
  ts: number;
}

function read(): QueuedPing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(pings: QueuedPing[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Cap size — older pings are less useful than current ones.
    const trimmed = pings.length > MAX_ENTRIES ? pings.slice(-MAX_ENTRIES) : pings;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or disabled — nothing we can do; drop on the floor.
  }
}

export function enqueuePing(ping: QueuedPing): void {
  const queue = read();
  queue.push(ping);
  write(queue);
}

export function queueSize(): number {
  return read().length;
}

export function clearQueue(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(QUEUE_KEY);
}

/**
 * Drain the queue oldest-first using the supplied sender. If a send fails
 * we stop draining (network is back to flaky); the rest stays queued.
 */
export async function drainQueue(
  send: (ping: QueuedPing) => Promise<boolean>,
): Promise<{ drained: number; remaining: number }> {
  const queue = read();
  if (queue.length === 0) return { drained: 0, remaining: 0 };

  let drained = 0;
  for (const ping of queue) {
    const ok = await send(ping);
    if (!ok) break;
    drained += 1;
  }
  const remaining = queue.slice(drained);
  write(remaining);
  return { drained, remaining: remaining.length };
}
