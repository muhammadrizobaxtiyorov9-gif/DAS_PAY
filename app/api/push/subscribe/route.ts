import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const SubscribeSchema = z.object({
  endpoint: z.string().url().min(10),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
  clientId: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const { endpoint, keys, clientId } = parsed.data;

  const session = await getAdminSession();
  const userId = session?.userId ?? null;

  if (!userId && !clientId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const userAgent = req.headers.get('user-agent') ?? null;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      clientId: userId ? null : clientId ?? null,
      userAgent,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      clientId: userId ? null : clientId ?? null,
      userAgent,
      failures: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
