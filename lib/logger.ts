/**
 * Lightweight structured logger. Emits one JSON line per log so that
 * downstream collectors (Loki, Datadog, CloudWatch) can parse it cleanly
 * without regex pain. No runtime dependency — wraps console under the hood.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info('shipment.created', { id: 42, branchId: 1 });
 *   log.error('push.failed', { userId, err });
 *
 * Convention: `event` is a dotted action name, second arg is structured ctx.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function envLevel(): Level {
  const raw = (process.env.LOG_LEVEL || '').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const MIN_LEVEL = LEVEL_RANK[envLevel()];
const SERVICE = process.env.SERVICE_NAME || 'daspay';

function safeContext(ctx: unknown): Record<string, unknown> {
  if (!ctx || typeof ctx !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx as Record<string, unknown>)) {
    if (v instanceof Error) {
      out[k] = { name: v.name, message: v.message, stack: v.stack };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level: Level, event: string, ctx?: unknown) {
  if (LEVEL_RANK[level] < MIN_LEVEL) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: SERVICE,
    event,
    ...safeContext(ctx),
  });
  // Route by severity so platform log collectors split streams correctly.
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, ctx?: unknown) => emit('debug', event, ctx),
  info: (event: string, ctx?: unknown) => emit('info', event, ctx),
  warn: (event: string, ctx?: unknown) => emit('warn', event, ctx),
  error: (event: string, ctx?: unknown) => emit('error', event, ctx),
};

/** Returns a logger bound to a request id / scope so every line carries it. */
export function withScope(scope: Record<string, unknown>) {
  return {
    debug: (event: string, ctx?: unknown) => emit('debug', event, { ...scope, ...(ctx as object) }),
    info: (event: string, ctx?: unknown) => emit('info', event, { ...scope, ...(ctx as object) }),
    warn: (event: string, ctx?: unknown) => emit('warn', event, { ...scope, ...(ctx as object) }),
    error: (event: string, ctx?: unknown) => emit('error', event, { ...scope, ...(ctx as object) }),
  };
}
