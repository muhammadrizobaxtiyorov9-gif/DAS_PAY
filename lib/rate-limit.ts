import type { NextRequest } from 'next/server';

/**
 * In-memory sliding-window rate limiter. Not distributed — if you run >1
 * instance, swap to Redis/Upstash via the same interface. Enough for the
 * single-node deployment we target today.
 *
 * Why this exists: without a shared helper, every route grew its own Map and
 * drift-prone defaults. One definition, one eviction policy, one place to
 * swap in a distributed backend.
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
  // Hard-cap: if still too many, drop the oldest 10%.
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

/**
 * Consume 1 token for the (key, identifier) pair. Returns the outcome and
 * rate-limit headers the caller should include in the response.
 */
export function rateLimit(identifier: string, opts: RateLimitOptions): RateLimitResult {
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

/**
 * Shape a rate-limit result into standard response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    ...(result.retryAfterSec > 0 ? { 'Retry-After': String(result.retryAfterSec) } : {}),
  };
}
