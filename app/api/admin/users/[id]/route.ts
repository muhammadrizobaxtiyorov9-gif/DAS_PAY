import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

async function checkSuperAdmin(req: NextRequest) {
  const adminToken = req.cookies.get('admin_token')?.value;
  if (!adminToken) return false;
  
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026');
    const { payload } = await jwtVerify(adminToken, secret);
    return payload.role === 'SUPERADMIN';
  } catch {
    return false;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await checkSuperAdmin(req);
  if (!isSuper) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });

  try {
    const { id } = await params;
    const userId = parseInt(id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 });
    }

    // Prevent deleting yourself or another SUPERADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Xodim topilmadi' }, { status: 404 });
    }
    if (user.role === 'SUPERADMIN') {
      return NextResponse.json({ error: 'SuperAdmin o\'chirib bo\'lmaydi' }, { status: 403 });
    }

    // Delete related records first (tasks, actions)
    await prisma.task.deleteMany({
      where: { OR: [{ assignedToId: userId }, { assignedById: userId }] }
    });
    await prisma.userAction.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'O\'chirishda xatolik' }, { status: 500 });
  }
}
