import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Bot } from 'grammy';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Telefon raqam kiritilmadi' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const client = await prisma.client.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-9) } }
    });

    if (!client || !client.telegramId) {
      return NextResponse.json({ 
         success: false, 
         error: "Ushbu raqam orqali Telegram botimizdan ro'yxatdan o'tmagansiz. Iltimos botga kirib ro'yxatdan o'ting: @DasPayLogistic_bot" 
      }, { status: 404 });
    }

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // If prisma type generation failed to include OTP fields, we must try using raw query or update safely.
    // Try Prisma standard update first.
    try {
      await prisma.client.update({
        where: { id: client.id },
        data: { otpCode: otp, otpExpiry: expiry } as any
      });
    } catch(e) {
      // Fallback if Prisma type engine failed generating schema
      await prisma.$executeRaw`UPDATE "Client" SET "otpCode" = ${otp}, "otpExpiry" = ${expiry} WHERE "id" = ${client.id}`;
    }

    // Send via Grammy Bot
    if (TELEGRAM_BOT_TOKEN) {
      const bot = new Bot(TELEGRAM_BOT_TOKEN);
      await bot.api.sendMessage(
        client.telegramId, 
        `🔑 <b>DasPay Kabinet</b>\n\nSizning tasdiqlash kodingiz: <code>${otp}</code>\n\n<i>Kod 5 daqiqa davomida amal qiladi. Hech kimga bermang!</i>`,
        { parse_mode: 'HTML' }
      );
    } else {
       console.warn("TELEGRAM_BOT_TOKEN not found.");
    }

    return NextResponse.json({ success: true, message: 'Tasdiqlash kodi Telegramga yuborildi' });
  } catch (error) {
    console.error('[OTP SEND ERROR]', error);
    return NextResponse.json({ success: false, error: 'Tizim xatoligi yuz berdi' }, { status: 500 });
  }
}
