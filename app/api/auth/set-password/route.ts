import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-daspay-client-2026');

export async function POST(request: NextRequest) {
  try {
    const { phone, password, currentPassword } = await request.json();
    if (!phone || !password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const client = await prisma.client.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-9) } }
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Mijoz topilmadi" }, { status: 404 });
    }

    // If user already has a password, verify the current one
    const existingPw = (client as any).password;
    if (existingPw && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, existingPw);
      if (!valid) {
        return NextResponse.json({ success: false, error: "Hozirgi parol noto'g'ri" }, { status: 401 });
      }
    }

    // Hash and save the password
    const hashed = await bcrypt.hash(password, 12);
    await prisma.$executeRaw`UPDATE "Client" SET "password" = ${hashed} WHERE "id" = ${client.id}`;

    // Issue JWT
    const token = await new SignJWT({ sub: client.telegramId ?? undefined, phone: client.phone, role: 'client' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, redirectUrl: '/uz/cabinet' });
    response.cookies.set({
      name: 'daspay_client_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('[SET PASSWORD ERROR]', error);
    return NextResponse.json({ success: false, error: 'Tizim xatoligi' }, { status: 500 });
  }
}
