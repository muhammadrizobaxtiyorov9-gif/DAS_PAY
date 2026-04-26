/**
 * Centralized secret loader.
 *
 * In production: throws at first access if the env var is missing — fail fast
 * before signing tokens with a known fallback. In dev: warns once and uses
 * a deterministic fallback so localhost still works without setup.
 */

const isProd = process.env.NODE_ENV === 'production';
const warned = new Set<string>();

function read(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v && v.length >= 16) return v;
  if (isProd) {
    throw new Error(
      `[secrets] ${name} is not set in production. Refusing to start with a default secret.`,
    );
  }
  if (!warned.has(name)) {
    warned.add(name);
    // eslint-disable-next-line no-console
    console.warn(`[secrets] ${name} not set — using DEV fallback. DO NOT deploy this build.`);
  }
  return devFallback;
}

let _admin: Uint8Array | null = null;
let _client: Uint8Array | null = null;
let _cron: string | null = null;

/** HS256 secret for admin/employee JWTs (admin_token cookie). */
export function adminTokenSecret(): Uint8Array {
  if (_admin) return _admin;
  _admin = new TextEncoder().encode(read('ADMIN_TOKEN_SECRET', 'dev_admin_token_secret___do_not_ship__'));
  return _admin;
}

/** HS256 secret for client JWTs (daspay_client_token cookie). */
export function clientJwtSecret(): Uint8Array {
  if (_client) return _client;
  _client = new TextEncoder().encode(read('JWT_SECRET', 'dev_client_jwt_secret_______do_not_ship__'));
  return _client;
}

/** Shared secret for cron-protected routes (?secret= query param). */
export function cronSecret(): string {
  if (_cron) return _cron;
  _cron = read('CRON_SECRET', 'dev_cron_secret_________do_not_ship__');
  return _cron;
}

/** Hostname/scheme for absolute URL generation in emails, OG tags, deep links. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}
