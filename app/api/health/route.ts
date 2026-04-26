import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, isRedisEnabled } from '@/lib/redis';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Liveness + readiness probe for load balancers and uptime monitors.
 * Returns 200 only when every required dependency is reachable. Optional
 * subsystems (Redis, VAPID, Telegram, OpenAI) are reported as `enabled:false`
 * but never fail the check, so missing-but-not-required setups don't page.
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

export async function GET() {
  const t0 = Date.now();
  const [db, cache] = await Promise.all([checkDb(), checkRedis()]);
  const vapid = checkVapid();
  const telegram = checkTelegram();

  const required = [db, cache];
  const ok = required.every((c) => c.ok);

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

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
