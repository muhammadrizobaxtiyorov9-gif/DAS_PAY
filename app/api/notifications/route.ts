import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/notifications?unread=1&type=lead&limit=30 */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get('limit')) || 30, 100);
  const unread = sp.get('unread') === '1';
  const type = sp.get('type');

  const where: {
    OR: Array<Record<string, unknown>>;
    isRead?: boolean;
    type?: string;
  } = {
    OR: [{ userId: session.userId }, { userId: null }],
  };
  if (unread) where.isRead = false;
  if (type) where.type = type;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({
      where: {
        OR: [{ userId: session.userId }, { userId: null }],
        isRead: false,
      },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

/** POST /api/notifications  body: { ids?: number[], all?: true }  → mark read */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: { ids?: number[]; all?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  if (body.all) {
    await prisma.notification.updateMany({
      where: {
        OR: [{ userId: session.userId }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  const ids = (body.ids || []).filter((n) => Number.isFinite(n));
  if (ids.length === 0) {
    return NextResponse.json({ error: 'no_ids' }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      OR: [{ userId: session.userId }, { userId: null }],
    },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
