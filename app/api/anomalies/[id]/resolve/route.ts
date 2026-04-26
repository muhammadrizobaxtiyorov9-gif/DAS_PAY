import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await ctx.params;
  const alertId = Number(id);
  if (!Number.isFinite(alertId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  await prisma.anomalyAlert.update({
    where: { id: alertId },
    data: { status: 'resolved', resolvedAt: new Date(), resolvedById: session.userId },
  });

  return NextResponse.json({ ok: true });
}
