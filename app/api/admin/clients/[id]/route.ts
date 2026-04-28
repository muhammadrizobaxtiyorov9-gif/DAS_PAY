import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { adminTokenSecret } from '@/lib/secrets';

async function getAdminRole(req: NextRequest): Promise<string | null> {
  const adminToken = req.cookies.get('admin_token')?.value;
  if (!adminToken) return null;

  try {
    const { payload } = await jwtVerify(adminToken, adminTokenSecret());
    return (payload.role as string) || null;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getAdminRole(req);
  if (role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Faqat SuperAdmin tahrirlashi mumkin' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const clientId = parseInt(id);
    if (!clientId || isNaN(clientId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, notifyEmail } = body;

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(notifyEmail !== undefined ? { notifyEmail: notifyEmail || null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Bu telefon raqam boshqa mijozda mavjud' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Tahrirlashda xatolik' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getAdminRole(req);
  if (role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Faqat SuperAdmin o\'chirishi mumkin' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const clientId = parseInt(id);
    if (!clientId || isNaN(clientId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    // Delete related addresses
    await prisma.clientAddress.deleteMany({ where: { clientId } });

    // Delete related support messages (ClientMessage)
    await prisma.clientMessage.deleteMany({ where: { clientId } });

    // Unlink shipments & invoices (don't delete them)
    await prisma.shipment.updateMany({
      where: { clientPhone: client.phone },
      data: { clientPhone: null },
    });
    await prisma.invoice.updateMany({
      where: { clientPhone: client.phone },
      data: { clientPhone: null },
    });

    await prisma.client.delete({ where: { id: clientId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 });
  }
}
