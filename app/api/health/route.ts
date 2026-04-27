import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, isRedisEnabled } from '@/lib/redis';
import { log } from '@/lib/logger';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Two response shapes depending on caller authority:
 *
 * - **Anonymous** (load balancers, uptime monitors): minimal payload —
 *   only `{ ok, status, timestamp }`. The HTTP status (200/503) carries
 *   the real signal; we deliberately do not leak which subsystems are
 *   wired up so the public can't fingerprint our stack.
 *
 * - **Trusted** (admin session cookie OR `?token=<HEALTH_TOKEN>`): full
 *   detailed payload with per-subsystem latency and status. Use this from
 *   internal monitoring or while debugging.
 */

interface CheckResult {
  ok: boolean;
  status: 'up' | 'down' | 'disabled';
  latencyMs?: number;
  error?: string;
}

async function checkDb(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, status: 'up', latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, status: 'down', error: (err as Error).message };
  }
}

async function checkRedis(): Promise<CheckResult> {
  if (!isRedisEnabled()) return { ok: true, status: 'disabled' };
  const t0 = Date.now();
  try {
    const r = redis();
    if (!r) return { ok: true, status: 'disabled' };
    const pong = await r.ping();
    if (pong !== 'PONG') throw new Error(`unexpected ping response: ${pong}`);
    return { ok: true, status: 'up', latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, status: 'down', error: (err as Error).message };
  }
}

function checkVapid(): CheckResult {
  const has = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  return { ok: true, status: has ? 'up' : 'disabled' };
}

function checkTelegram(): CheckResult {
  return { ok: true, status: process.env.TELEGRAM_BOT_TOKEN ? 'up' : 'disabled' };
}

async function isTrustedCaller(req: NextRequest): Promise<boolean> {
  const token = req.nextUrl.searchParams.get('token');
  const expected = process.env.HEALTH_TOKEN;
  if (expected && token && token === expected) return true;
  const session = await getAdminSession();
  return !!session;
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const [db, cache] = await Promise.all([checkDb(), checkRedis()]);
  const vapid = checkVapid();
  const telegram = checkTelegram();

  const required = [db, cache];
  const ok = required.every((c) => c.ok);
  const trusted = await isTrustedCaller(req);

  const headers = { 'Cache-Control': 'no-store, max-age=0' };
  const status = ok ? 200 : 503;

  if (!trusted) {
    // Public response: status code carries the signal, body is intentionally
    // minimal so attackers can't enumerate which subsystems are configured.
    return NextResponse.json(
      { ok, status: ok ? 'up' : 'down', timestamp: new Date().toISOString() },
      { status, headers },
    );
  }

  const body = {
    ok,
    service: process.env.SERVICE_NAME || 'daspay',
    version: process.env.APP_VERSION || 'dev',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - t0,
    checks: { db, redis: cache, vapid, telegram },
  };

  if (!ok) {
    log.error('health.degraded', body);
  }

  return NextResponse.json(body, { status, headers });
}
