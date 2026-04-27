import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { sendPushToClient } from '@/lib/push';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { clientId, body } = await req.json();
    if (!clientId || !body || typeof body !== 'string') {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: 'client_not_found' }, { status: 404 });

    const message = await prisma.clientMessage.create({
      data: {
        clientId,
        adminId: session.userId,
        body,
        isFromClient: false,
      },
      include: {
        admin: { select: { name: true, username: true } }
      }
    });

    // Send Push Notification to Client
    await sendPushToClient(clientId, {
      title: `Yangi xabar — ${session.username}`,
      body: body.length > 80 ? `${body.substring(0, 77)}...` : body,
      url: `/uz/cabinet/support`,
      tag: `support-reply-${message.id}`,
    });

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error('[Admin Client Support Msg] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
