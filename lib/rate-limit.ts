import type { NextRequest } from 'next/server';
import { redis } from './redis';
import { log } from './logger';

/**
 * Sliding-window rate limiter. Backed by Redis (atomic INCR + EXPIRE) when
 * REDIS_URL is set so multiple Node workers share one counter; falls back to
 * an in-memory Map for single-instance dev.
 *
 * The function is async — every caller awaits the result. The shape of
 * RateLimitResult is unchanged so existing header/response code keeps working.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const BUCKETS = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

function evictIfNeeded() {
  if (BUCKETS.size <= MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, bucket] of BUCKETS) {
    if (bucket.resetAt <= now) BUCKETS.delete(key);
  }
  if (BUCKETS.size > MAX_BUCKETS) {
    const excess = Math.ceil(MAX_BUCKETS * 0.1);
    let i = 0;
    for (const key of BUCKETS.keys()) {
      if (i++ >= excess) break;
      BUCKETS.delete(key);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterSec: number;
}

export interface RateLimitOptions {
  /** Unique bucket name (e.g. "auth:login", "contact"). */
  key: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window duration in ms. */
  windowMs: number;
}

function inProcess(identifier: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${opts.key}:${identifier}`;
  const existing = BUCKETS.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    BUCKETS.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
    evictIfNeeded();
    return {
      ok: true,
      remaining: opts.limit - 1,
      limit: opts.limit,
      resetAt: now + opts.windowMs,
      retryAfterSec: 0,
    };
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      limit: opts.limit,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    limit: opts.limit,
    resetAt: existing.resetAt,
    retryAfterSec: 0,
  };
}

async function viaRedis(identifier: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const r = redis();
  if (!r) return inProcess(identifier, opts);

  const bucketKey = `rl:${opts.key}:${identifier}`;
  const ttlSec = Math.max(1, Math.ceil(opts.windowMs / 1000));

  try {
    // INCR returns the new count; on first hit it's 1 and we set the TTL.
    // PTTL gives us the precise remaining ms for the resetAt header.
    const pipe = r.multi();
    pipe.incr(bucketKey);
    pipe.pttl(bucketKey);
    const res = (await pipe.exec()) ?? [];
    const count = Number((res[0] as [Error | null, number])?.[1] ?? 0);
    let pttl = Number((res[1] as [Error | null, number])?.[1] ?? -1);

    if (count === 1 || pttl < 0) {
      await r.pexpire(bucketKey, opts.windowMs);
      pttl = opts.windowMs;
    }

    const now = Date.now();
    const resetAt = now + pttl;

    if (count > opts.limit) {
      return {
        ok: false,
        remaining: 0,
        limit: opts.limit,
        resetAt,
        retryAfterSec: Math.max(1, Math.ceil(pttl / 1000)),
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, opts.limit - count),
      limit: opts.limit,
      resetAt,
      retryAfterSec: 0,
    };
  } catch (err) {
    log.warn('ratelimit.redis_failed_fallback', { err });
    return inProcess(identifier, opts);
  }
}

/** Consume 1 token. Async because the Redis backend round-trips. */
export async function rateLimit(
  identifier: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  return viaRedis(identifier, opts);
}

/**
 * Resolve the client IP from common forwarded-for headers with a safe fallback.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = (req as NextRequest).headers ?? (req as Request).headers;
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('true-client-ip') ||
    'unknown'
  );
}

/** Shape a rate-limit result into standard response headers. */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    ...(result.retryAfterSec > 0 ? { 'Retry-After': String(result.retryAfterSec) } : {}),
  };
}
