import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n';
import { jwtVerify } from 'jose';

/**
 * Middleware for locale detection and redirection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if path already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // --- Admin Security Logic ---
  const isAdminRoute = pathname.includes('/admin') && !pathname.includes('/admin-login');
  if (isAdminRoute) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const loginUrl = request.nextUrl.clone();
    const targetLocale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale;
    loginUrl.pathname = `/${targetLocale}/admin-login`;

    if (!adminToken) {
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026');
      const { payload } = await jwtVerify(adminToken, secret);
      if (payload.role !== 'admin') throw new Error('Invalid Role');
    } catch (err) {
      // Invalid/Expired Token
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token');
      return response;
    }
  }
  // -----------------------------

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Detect preferred locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  let detectedLocale: Locale = defaultLocale;

  // Parse Accept-Language header
  const preferredLanguages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, priority] = lang.trim().split(';q=');
      return { code: code.split('-')[0], priority: parseFloat(priority || '1') };
    })
    .sort((a, b) => b.priority - a.priority);

  // Find matching locale
  for (const { code } of preferredLanguages) {
    if (locales.includes(code as Locale)) {
      detectedLocale = code as Locale;
      break;
    }
  }

  // Redirect to localized path
  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except API, static, and files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
