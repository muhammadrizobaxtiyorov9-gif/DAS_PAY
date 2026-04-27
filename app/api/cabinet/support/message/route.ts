import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { clientJwtSecret } from '@/lib/secrets';
import { createNotification } from '@/lib/notifications';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('daspay_client_token')?.value;
    if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, clientJwtSecret());
    const telegramId = payload.sub as string;
    
    const client = await prisma.client.findUnique({
      where: { telegramId },
      select: { id: true }
    });

    if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 400 });

    // Try-catch block specifically for prisma.clientMessage in case Prisma Client is not yet generated
    try {
      if (!prisma.clientMessage) {
        throw new Error("Prisma clientMessage model is not generated yet.");
      }
      
      const messages = await prisma.clientMessage.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'asc' },
        include: {
          admin: { select: { name: true, role: true } }
        }
      });
      return NextResponse.json({ messages });
    } catch (dbError) {
      console.warn("Could not fetch client messages, Prisma might not be synced.", dbError);
      return NextResponse.json({ messages: [] });
    }
  } catch (err: any) {
    console.error('[Client Support Msg GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Moved to top

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('daspay_client_token')?.value;
    if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, clientJwtSecret());
    const telegramId = payload.sub as string;
    
    const client = await prisma.client.findUnique({
      where: { telegramId },
      include: {
        shipments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });

    if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 400 });

    const { body } = await req.json();
    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    if (!prisma.clientMessage) {
      return NextResponse.json({ error: "Xatolik: Baza yuklanmadi. Serverni qayta ishga tushiring." }, { status: 500 });
    }

    // Save message to DB
    const message = await prisma.clientMessage.create({
      data: {
        clientId: client.id,
        body,
        isFromClient: true,
      }
    });

    // Determine target admin
    const recentShipment = client.shipments[0];
    let targetAdminId: number | null = null;
    let adminName = 'Barcha xodimlar';
    let adminUsername = '';

    if (recentShipment) {
      targetAdminId = recentShipment.createdById || recentShipment.assignedToId || null;
      if (targetAdminId) {
        const admin = await prisma.user.findUnique({ where: { id: targetAdminId } });
        if (admin) {
          adminName = admin.name || admin.username;
          adminUsername = admin.username;
        } else {
          targetAdminId = null;
        }
      }
    }

    const clientTitle = client.name || client.phone;

    // Send in-app notification
    await createNotification({
      userId: targetAdminId, // If null, broadcasts to all admins
      type: 'system',
      title: `Yangi mijoz xabari — ${clientTitle}`,
      message: body.length > 100 ? `${body.substring(0, 97)}...` : body,
      link: `/uz/admin/clients/${client.id}?tab=chat`,
    });

    // Send Telegram message to admin group
    const tgMsg = `💬 <b>Mijozdan yangi xabar (Yordam)</b>\n\n👤 Mijoz: <b>${clientTitle}</b>\n📞 Tel: ${client.phone}\n${targetAdminId ? `👨‍💼 Mas'ul xodim: @${adminUsername} (${adminName})` : '👨‍💼 Barcha xodimlar diqqatiga!'}\n\n📝 Xabar:\n<i>${body}</i>\n\n<a href="${process.env.NEXT_PUBLIC_SITE_URL}/uz/admin/clients/${client.id}?tab=chat">Kabinetda javob berish</a>`;
    await sendTelegramMessage(tgMsg);

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error('[Client Support Msg] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

