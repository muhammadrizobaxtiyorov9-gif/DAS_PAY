import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n';
import { jwtVerify } from 'jose';

const LOCALE_SET = new Set<string>(locales);
const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026'
);

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
 * Generate a cryptographically-strong nonce for CSP.
 * Uses Web Crypto (Edge-runtime safe).
//  */
// function generateNonce(): string {
//   const bytes = new Uint8Array(16);
//   crypto.getRandomValues(bytes);
//   let bin = '';
//   for (const b of bytes) bin += String.fromCharCode(b);
//   return btoa(bin);
// }

// /**
//  * Build a permissive-but-hardened CSP. We allow `'unsafe-inline'` on
//  * script-src because Next.js hydration emits inline bootstrap scripts that
//  * can't currently be nonce-only without breaking the framework. The nonce is
//  * still advertised so nonce-aware scripts we add later can tighten this.
//  * We pair it with `frame-ancestors 'none'` and `object-src 'none'` to close
//  * the most commonly-exploited surfaces (clickjacking, plugin injection).
//  */
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split('/', 2)[1] ?? '';
  const pathnameHasLocale = LOCALE_SET.has(firstSegment);

  // --- Locale redirect -----------------------------------------------------
  if (pathname === '/' || (!pathnameHasLocale && !pathname.startsWith('/api'))) {
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
      const { payload } = await jwtVerify(adminToken, ADMIN_SECRET);
      const role = payload.role;
      if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'DIRECTOR' && role !== 'admin' && role !== 'ACCOUNTANT') {
        throw new Error('Invalid Role');
      }
    } catch {
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // --- Per-request CSP (prod only) -----------------------------------------
  // Turbopack dev uses dynamic chunk loading + eval patterns that clash with
  // any CSP, even Report-Only ones that mutate the request header object.
  // We only attach CSP in production where chunks are stable hashes.
  if (!IS_PROD) {
    return NextResponse.next();
  }

  const secFetchDest = request.headers.get('sec-fetch-dest');
  const isHtmlDocument =
    !pathname.startsWith('/api') &&
    (secFetchDest === 'document' || secFetchDest === null);

  if (!isHtmlDocument) {
    return NextResponse.next();
  }

  // const nonce = generateNonce();
  const response = NextResponse.next();
  // response.headers.set('Content-Security-Policy', buildCsp(nonce));
  // response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  // Skip middleware for static assets, images, well-known files, and the
  // webhook route (must accept inbound Telegram updates without redirect).
  matcher: [
    '/((?!api/telegram/webhook|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|logo_|grid\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|ttf|map)).*)',
  ],
};
