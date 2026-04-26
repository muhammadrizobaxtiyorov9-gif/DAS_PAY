import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { adminTokenSecret } from '@/lib/secrets';

async function checkSuperAdmin(req: NextRequest) {
  const adminToken = req.cookies.get('admin_token')?.value;
  if (!adminToken) return false;

  try {
    const { payload } = await jwtVerify(adminToken, adminTokenSecret());
    return payload.role === 'SUPERADMIN';
  } catch {
    return false;
  }
}

export async function PUT(
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

    const { username, password, name, role, permissions, branchId } = await req.json();

    // Check if updating another user's username to an existing one
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: 'Bu login band' }, { status: 400 });
    }

    const updateData: any = {
      username,
      name,
      role: role || 'ADMIN',
      permissions: permissions ? JSON.stringify(permissions) : '[]',
      branchId: typeof branchId === 'number' ? branchId : null,
    };

    if (password) {
      // Need bcrypt to hash if changing password
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      updateData.password = bcrypt.hashSync(password, salt);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, role: true }
    });

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: 'Saqlashda xatolik' }, { status: 500 });
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
