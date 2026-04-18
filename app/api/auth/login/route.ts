import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { Bot } from 'grammy';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-daspay-client-2026');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(ip, { key: 'client:login', limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: "Juda ko'p urinish. Keyinroq qayta urining." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!phone || !password || phone.length > 32 || password.length > 256) {
      return NextResponse.json({ success: false, error: "Raqam va parol kiritilmadi" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const client = await prisma.client.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-9) } }
    });

    if (!client || !client.telegramId) {
      return NextResponse.json({ 
        success: false, 
        error: "Ushbu raqam ro'yxatdan o'tmagan. Telegram botdan ro'yxatdan o'ting." 
      }, { status: 404 });
    }

    // Check if user has set a password
    const pwField = (client as any).password;
    if (!pwField) {
      // First time → send OTP and tell frontend
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000);
      
      await prisma.$executeRaw`UPDATE "Client" SET "otpCode" = ${otp}, "otpExpiry" = ${expiry} WHERE "id" = ${client.id}`;

      if (TELEGRAM_BOT_TOKEN) {
        const bot = new Bot(TELEGRAM_BOT_TOKEN);
        await bot.api.sendMessage(
          client.telegramId,
          `🔑 <b>DasPay Kabinet</b>\n\nBirinchi marta kiryapsiz. Tasdiqlash kodingiz: <code>${otp}</code>\n\n<i>Kod 5 daqiqa amal qiladi.</i>`,
          { parse_mode: 'HTML' }
        );
      }

      return NextResponse.json({ 
        success: false, 
        needsPassword: true, 
        error: "Parol hali o'rnatilmagan" 
      }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, pwField);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Parol noto'g'ri" }, { status: 401 });
    }

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
    console.error('[LOGIN ERROR]', error);
    return NextResponse.json({ success: false, error: 'Tizim xatoligi' }, { status: 500 });
  }
}
