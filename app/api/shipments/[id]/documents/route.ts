import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { ALLOWED_MIME, MAX_BYTES, saveUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

const VALID_KINDS = new Set(['photo', 'cmr', 'tir', 'ttn', 'invoice', 'other']);

async function ensureCanWrite(shipmentId: number) {
  const session = await getAdminSession();
  if (!session) return { error: 'unauthenticated' as const };

  if (session.role === 'DRIVER') {
    // Check via lockedByShipmentId first
    const lockedTruck = await prisma.truck.findFirst({
      where: { driverId: session.userId, lockedByShipmentId: shipmentId },
      select: { id: true },
    });
    if (lockedTruck) return { session, source: 'driver' as const };

    // Fallback: check if the driver's truck is associated with this shipment via relation
    const relatedTruck = await prisma.truck.findFirst({
      where: {
        driverId: session.userId,
        shipments: { some: { id: shipmentId } },
      },
      select: { id: true },
    });
    if (relatedTruck) return { session, source: 'driver' as const };

    return { error: 'forbidden' as const };
  }

  return { session, source: 'admin' as const };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const shipmentId = Number(id);
  if (!Number.isFinite(shipmentId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const docs = await prisma.shipmentDocument.findMany({
    where: { shipmentId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const shipmentId = Number(id);
  if (!Number.isFinite(shipmentId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const auth = await ensureCanWrite(shipmentId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'unauthenticated' ? 401 : 403 });
  }

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { id: true } });
  if (!shipment) return NextResponse.json({ error: 'shipment_not_found' }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = form.get('file');
  const kindRaw = (form.get('kind') as string | null) ?? 'photo';
  const kind = VALID_KINDS.has(kindRaw) ? kindRaw : 'other';
  const caption = (form.get('caption') as string | null) ?? null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_mime', accepted: Array.from(ALLOWED_MIME) }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large', maxBytes: MAX_BYTES }, { status: 413 });
  }

  const saved = await saveUploadedFile(file, `shipments/${shipmentId}`);

  const doc = await prisma.shipmentDocument.create({
    data: {
      shipmentId,
      kind,
      url: saved.url,
      mimeType: saved.mimeType,
      size: saved.size,
      originalName: saved.originalName,
      caption: caption || null,
      uploadedById: auth.session.userId,
      source: auth.source,
    },
  });

  return NextResponse.json({ document: doc });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const shipmentId = Number(id);
  if (!Number.isFinite(shipmentId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const docId = Number(req.nextUrl.searchParams.get('docId'));
  if (!Number.isFinite(docId)) {
    return NextResponse.json({ error: 'invalid_docId' }, { status: 400 });
  }

  const doc = await prisma.shipmentDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.shipmentId !== shipmentId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Drivers can only delete their own uploads on their own shipment
  if (session.role === 'DRIVER') {
    if (doc.uploadedById !== session.userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  await prisma.shipmentDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
