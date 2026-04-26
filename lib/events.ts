import 'server-only';
import { redis, pubsub } from './redis';
import { log } from './logger';

/**
 * Cross-instance pub/sub for SSE. Backed by Redis when REDIS_URL is set so
 * every Node worker sees every event. Falls back to an in-process Set when
 * Redis is unavailable (single-instance dev).
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

const CHANNEL = 'daspay:events';

interface State {
  listeners: Set<Listener>;
  subscribed: boolean;
}

const g = globalThis as unknown as { __DASPAY_BUS__?: State };
const state: State = (g.__DASPAY_BUS__ ??= { listeners: new Set(), subscribed: false });

function ensureRedisSubscribed(): void {
  if (state.subscribed) return;
  const sub = pubsub();
  if (!sub) return;
  state.subscribed = true;
  sub.subscribe(CHANNEL).catch((err) => {
    state.subscribed = false;
    log.error('events.subscribe_failed', { err });
  });
  sub.on('message', (channel, payload) => {
    if (channel !== CHANNEL) return;
    let evt: BusEvent;
    try {
      evt = JSON.parse(payload) as BusEvent;
    } catch (err) {
      log.warn('events.parse_failed', { err });
      return;
    }
    for (const fn of state.listeners) {
      try {
        fn(evt);
      } catch (err) {
        log.error('events.listener_error', { err });
      }
    }
  });
}

export function publish<T>(name: EventName, data: T): void {
  const event: BusEvent<T> = { name, data, ts: Date.now() };
  const r = redis();
  if (r) {
    r.publish(CHANNEL, JSON.stringify(event)).catch((err) => {
      log.error('events.publish_failed', { name, err });
    });
    return;
  }
  // Fallback: deliver synchronously to local listeners.
  for (const fn of state.listeners) {
    try {
      fn(event);
    } catch (err) {
      log.error('events.listener_error', { err });
    }
  }
}

export function subscribe(fn: Listener): () => void {
  ensureRedisSubscribed();
  state.listeners.add(fn);
  return () => {
    state.listeners.delete(fn);
  };
}
