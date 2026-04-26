import 'server-only';
import { Redis } from 'ioredis';

/**
 * Singleton ioredis client. Two connections are exposed:
 *   - `redis()`   — general command client (GET/SET/INCR/EXPIRE/...)
 *   - `pubsub()`  — dedicated subscriber connection (Redis pub/sub requires
 *                   a separate connection because subscriber mode blocks
 *                   normal commands).
 *
 * If REDIS_URL is not set we return null and callers fall back to the
 * in-process implementation. This keeps single-node dev frictionless while
 * letting production scale horizontally just by setting REDIS_URL.
 */

type Globals = {
  __DASPAY_REDIS__?: Redis | null;
  __DASPAY_REDIS_SUB__?: Redis | null;
};
const g = globalThis as unknown as Globals;

function build(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const client = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    reconnectOnError: (err) => /READONLY/i.test(err.message),
  });
  client.on('error', (err) => {
    console.error('[redis] error', err.message);
  });
  return client;
}

export function redis(): Redis | null {
  if (g.__DASPAY_REDIS__ !== undefined) return g.__DASPAY_REDIS__;
  g.__DASPAY_REDIS__ = build();
  return g.__DASPAY_REDIS__;
}

export function pubsub(): Redis | null {
  if (g.__DASPAY_REDIS_SUB__ !== undefined) return g.__DASPAY_REDIS_SUB__;
  g.__DASPAY_REDIS_SUB__ = build();
  return g.__DASPAY_REDIS_SUB__;
}

export function isRedisEnabled(): boolean {
  return !!process.env.REDIS_URL;
}
