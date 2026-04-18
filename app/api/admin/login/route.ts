import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026'
);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(ip, { key: 'admin:login', limit: 8, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Juda ko\'p urinish. Keyinroq qayta urining.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password || username.length > 64 || password.length > 256) {
      return NextResponse.json({ error: 'Login yoki parol noto\'g\'ri' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    // Constant-time fallback: if no user, still pay the bcrypt cost to
    // avoid exposing which usernames exist via timing side-channel.
    const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8S1TrBxkzLhFDzjmVh9DZ9N0cMWNSm';
    const passwordOk = await bcrypt
      .compare(password, user?.password ?? DUMMY_HASH)
      .catch(() => false);

    if (!user || !passwordOk) {
      return NextResponse.json(
        { error: 'Login yoki parol noto\'g\'ri' },
        { status: 401, headers: rateLimitHeaders(rl) }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Akkaunt faol emas' }, { status: 403 });
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24 * 7;

    const token = await new SignJWT({ userId: user.id, username: user.username, role: user.role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(exp)
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(ADMIN_SECRET);

    const response = NextResponse.json(
      { success: true, role: user.role },
      { headers: rateLimitHeaders(rl) }
    );
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[Admin Login] Error', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
