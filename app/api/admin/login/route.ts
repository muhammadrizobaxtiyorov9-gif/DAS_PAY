import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const secretKey = process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026';

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Akkaunt faol emas' }, { status: 403 });
      }

      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60 * 24 * 7; // 1 week

      const secret = new TextEncoder().encode(secretKey);

      // Sign JWT token using 'jose'
      const token = await new SignJWT({ userId: user.id, username: user.username, role: user.role })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(exp)
        .setIssuedAt(iat)
        .setNotBefore(iat)
        .sign(secret);

      const response = NextResponse.json({ success: true, role: user.role });
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 Week
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { error: 'Login yoki parol noto\'g\'ri' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}
