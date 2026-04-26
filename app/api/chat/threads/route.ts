import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/chat/threads — return distinct counterparts the user has chatted with + unread counts */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // For DRIVER: show available admins to chat with; for admins: show all drivers and admins
  // We materialize by finding distinct partner ids from chat history, then add candidate list
  const myId = session.userId;

  const myMessages = await prisma.chatMessage.findMany({
    where: { OR: [{ fromUserId: myId }, { toUserId: myId }] },
    select: { fromUserId: true, toUserId: true, isRead: true, createdAt: true, body: true },
    orderBy: { createdAt: 'desc' },
  });

  const partnerStats = new Map<
    number,
    { lastBody: string; lastAt: Date; unread: number }
  >();
  for (const m of myMessages) {
    const partnerId = m.fromUserId === myId ? m.toUserId : m.fromUserId;
    const cur =
      partnerStats.get(partnerId) ?? { lastBody: '', lastAt: new Date(0), unread: 0 };
    if (m.createdAt > cur.lastAt) {
      cur.lastAt = m.createdAt;
      cur.lastBody = m.body;
    }
    if (m.toUserId === myId && !m.isRead) cur.unread += 1;
    partnerStats.set(partnerId, cur);
  }

  // Candidate list: drivers if I'm admin/dispatcher, all admins if I'm driver
  const candidates =
    session.role === 'DRIVER'
      ? await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPERADMIN', 'DIRECTOR'] }, status: 'ACTIVE' },
          select: { id: true, name: true, username: true, role: true },
        })
      : await prisma.user.findMany({
          where: { role: { in: ['DRIVER', 'ADMIN', 'SUPERADMIN'] }, status: 'ACTIVE', id: { not: myId } },
          select: { id: true, name: true, username: true, role: true },
        });

  const items = candidates.map((u) => {
    const stat = partnerStats.get(u.id);
    return {
      userId: u.id,
      name: u.name || u.username,
      role: u.role,
      lastMessage: stat?.lastBody ?? null,
      lastAt: stat?.lastAt?.toISOString() ?? null,
      unread: stat?.unread ?? 0,
    };
  });

  // Sort: unread first, then by recency
  items.sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread;
    if (a.lastAt && b.lastAt) return b.lastAt.localeCompare(a.lastAt);
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return a.name.localeCompare(b.name);
  });

  const totalUnread = items.reduce((acc, x) => acc + x.unread, 0);
  return NextResponse.json({ threads: items, totalUnread });
}
