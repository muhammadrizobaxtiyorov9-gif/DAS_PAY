import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'daspay2026';
    const secretKey = process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026';

    if (password === expectedPassword) {
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60 * 24 * 7; // 1 week

      const secret = new TextEncoder().encode(secretKey);

      // Sign JWT token using 'jose'
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(exp)
        .setIssuedAt(iat)
        .setNotBefore(iat)
        .sign(secret);

      const response = NextResponse.json({ success: true });
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
      { error: 'Parol noto\'g\'ri' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Format xatosi' },
      { status: 400 }
    );
  }
}
