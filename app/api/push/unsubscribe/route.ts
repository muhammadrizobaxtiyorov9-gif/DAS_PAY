import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = UnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } });
  return NextResponse.json({ ok: true });
}
