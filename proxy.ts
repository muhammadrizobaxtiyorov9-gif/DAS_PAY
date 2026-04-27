import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n';
import { jwtVerify } from 'jose';
import { adminTokenSecret } from '@/lib/secrets';

const LOCALE_SET = new Set<string>(locales);

const IS_PROD = process.env.NODE_ENV === 'production';

function parsePreferredLocale(acceptLanguage: string): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, priority] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        priority: parseFloat(priority || '1'),
      };
    })
    .sort((a, b) => b.priority - a.priority);

  for (const { code } of preferred) {
    if (LOCALE_SET.has(code)) return code as Locale;
  }

  return defaultLocale;
}

/**
 * Cryptographically-strong nonce for CSP. Web Crypto is Edge-runtime safe.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Build CSP. We keep `'unsafe-inline'` on script-src because Next.js
 * hydration emits inline bootstrap chunks; the nonce is still advertised so
 * we can tighten incrementally. `frame-ancestors 'none'` and
 * `object-src 'none'` close clickjacking and plugin-injection surfaces.
 *
 * CSP is shipped as Report-Only first so violations land in logs without
 * breaking real traffic. Switch to enforce mode (`Content-Security-Policy`)
 * once the report tail is clean.
 */
function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `connect-src 'self' https: wss:${IS_PROD ? '' : ' ws: http:'}`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https:`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `media-src 'self' blob: data:`,
    IS_PROD ? `upgrade-insecure-requests` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

function applySecurityHeaders(response: NextResponse, nonce: string): void {
  // Static headers (X-Frame-Options, Permissions-Policy, HSTS, COOP, COEP) are
  // declared once in next.config.ts:headers() so every route — including ones
  // that bypass middleware — gets them. Here we only add what must vary
  // per-request: a fresh CSP nonce and the CSP itself.
  response.headers.set('x-nonce', nonce);
  if (IS_PROD) {
    // Report-Only first; promote to `Content-Security-Policy` when audited.
    response.headers.set('Content-Security-Policy-Report-Only', buildCsp(nonce));
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split('/', 2)[1] ?? '';
  const pathnameHasLocale = LOCALE_SET.has(firstSegment);

  // --- Public short-link routes (locale-agnostic) --------------------------
  // /t/<code> is the share-friendly tracking URL: it owns its own page +
  // OG image and resolves locale internally, so we let it through without
  // redirecting.
  const isPublicShortLink = pathname.startsWith('/t/') || pathname === '/t';

  // --- Locale redirect -----------------------------------------------------
  if (
    pathname === '/' ||
    (!pathnameHasLocale && !pathname.startsWith('/api') && !isPublicShortLink)
  ) {
    const locale = parsePreferredLocale(request.headers.get('accept-language') || '');
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // --- Admin JWT guard -----------------------------------------------------
  const isAdminRoute =
    pathnameHasLocale &&
    pathname.includes('/admin') &&
    !pathname.includes('/admin-login');

  if (isAdminRoute) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${firstSegment}/admin-login`;

    if (!adminToken) {
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(adminToken, adminTokenSecret());
      const role = payload.role;
      if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'DIRECTOR' && role !== 'admin' && role !== 'ACCOUNTANT' && role !== 'DRIVER') {
        throw new Error('Invalid Role');
      }
    } catch {
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // --- Security headers (HTML documents only) ------------------------------
  const secFetchDest = request.headers.get('sec-fetch-dest');
  const isHtmlDocument =
    !pathname.startsWith('/api') &&
    (secFetchDest === 'document' || secFetchDest === null);

  const response = NextResponse.next();
  if (isHtmlDocument) {
    applySecurityHeaders(response, generateNonce());
  }
  return response;
}

export const config = {
  // Skip middleware for static assets, images, well-known files, and the
  // webhook route (must accept inbound Telegram updates without redirect).
  matcher: [
    '/((?!api/telegram/webhook|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|logo_|grid\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|ttf|map)).*)',
  ],
};
