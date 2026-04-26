import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { clientJwtSecret } from '@/lib/secrets';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(ip, { key: 'otp:verify', limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: 'Juda ko\'p urinish. Keyinroq qayta urining.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    const otp = typeof body?.otp === 'string' ? body.otp : '';
    if (!phone || !otp || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return NextResponse.json({ success: false, error: "Raqam yoki kod kiritilmadi" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const client = await prisma.client.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-9) } }
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Mijoz topilmadi" }, { status: 404 });
    }

    // Since we used executeRaw for fallback, we should also read it raw if Prisma type caching is broken locally
    let actualOtp = client.otpCode;
    let actualExpiry = client.otpExpiry;
    
    try {
      const rawClients: any[] = await prisma.$queryRaw`SELECT "otpCode", "otpExpiry" FROM "Client" WHERE "id" = ${client.id}`;
      if (rawClients && rawClients.length > 0) {
         if (rawClients[0].otpCode) actualOtp = rawClients[0].otpCode;
         if (rawClients[0].otpExpiry) actualExpiry = rawClients[0].otpExpiry;
      }
    } catch(e) {}

    if (!actualOtp || actualOtp !== otp) {
      return NextResponse.json({ success: false, error: "Kod noto'g'ri kiritildi" }, { status: 400 });
    }

    if (!actualExpiry || new Date(actualExpiry) < new Date()) {
      return NextResponse.json({ success: false, error: "Kodning amal qilish muddati tugagan" }, { status: 400 });
    }

    // Reset OTP to prevent reuse
    try {
       await prisma.$executeRaw`UPDATE "Client" SET "otpCode" = NULL, "otpExpiry" = NULL WHERE "id" = ${client.id}`;
    } catch(e) {}

    // Generate JWT
    const token = await new SignJWT({ sub: client.telegramId ?? undefined, phone: client.phone, role: 'client' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(clientJwtSecret());

    // Set HTTP Only Cookie
    const response = NextResponse.json({ success: true, redirectUrl: '/uz/cabinet' });
    response.cookies.set({
      name: 'daspay_client_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[OTP VERIFY ERROR]', error);
    return NextResponse.json({ success: false, error: 'Tizim xatoligi yuz berdi' }, { status: 500 });
  }
}
