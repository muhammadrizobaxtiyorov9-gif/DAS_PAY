import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { sendPushToUser } from '@/lib/push';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SendSchema = z.object({
  toUserId: z.number().int().positive(),
  body: z.string().min(1).max(2000),
  shipmentId: z.number().int().positive().optional(),
});

/** GET /api/chat/messages?withUserId=42&limit=50 — load conversation; also marks incoming as read */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const withUserId = Number(req.nextUrl.searchParams.get('withUserId'));
  if (!Number.isFinite(withUserId)) {
    return NextResponse.json({ error: 'invalid_partner' }, { status: 400 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 50, 200);
  const myId = session.userId;

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { fromUserId: myId, toUserId: withUserId },
        { fromUserId: withUserId, toUserId: myId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  // Auto-mark all incoming from partner as read
  await prisma.chatMessage.updateMany({
    where: { fromUserId: withUserId, toUserId: myId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ messages });
}

/** POST /api/chat/messages — send a new message */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const { toUserId, body: text, shipmentId } = parsed.data;
  if (toUserId === session.userId) {
    return NextResponse.json({ error: 'cannot_message_self' }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, name: true, username: true } });
  if (!recipient) return NextResponse.json({ error: 'recipient_not_found' }, { status: 404 });

  const sender = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, username: true } });

  const message = await prisma.chatMessage.create({
    data: {
      fromUserId: session.userId,
      toUserId,
      body: text,
      shipmentId: shipmentId ?? null,
    },
  });

  // Push the recipient (best-effort)
  const senderName = sender?.name || sender?.username || 'Xodim';
  sendPushToUser(toUserId, {
    title: `Yangi xabar — ${senderName}`,
    body: text.length > 80 ? `${text.slice(0, 77)}…` : text,
    url: `/uz/admin/chat?with=${session.userId}`,
    tag: `chat-${session.userId}-${toUserId}`,
  }).catch((e) => console.error('[chat] push', e));

  // In-app notification (no extra push since we just sent one)
  createNotification({
    userId: toUserId,
    type: 'system',
    title: `Yangi xabar — ${senderName}`,
    message: text.length > 120 ? `${text.slice(0, 117)}…` : text,
    link: `/uz/admin/chat?with=${session.userId}`,
    push: false,
  }).catch((e) => console.error('[chat] notify', e));

  return NextResponse.json({ message });
}
