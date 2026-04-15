import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: "Telefon raqam kiritilmadi" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const client = await prisma.client.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-9) } }
    });

    if (!client || !client.telegramId) {
      return NextResponse.json({ 
        success: false, 
        registered: false,
        error: "Ushbu raqam ro'yxatdan o'tmagan. Iltimos, Telegram bot orqali ro'yxatdan o'ting." 
      }, { status: 404 });
    }

    const hasPassword = !!(client as any).password;

    return NextResponse.json({ 
      success: true, 
      registered: true,
      hasPassword
    });

  } catch (error) {
    console.error('[CHECK PHONE ERROR]', error);
    return NextResponse.json({ success: false, error: 'Tizim xatoligi yuz berdi' }, { status: 500 });
  }
}
