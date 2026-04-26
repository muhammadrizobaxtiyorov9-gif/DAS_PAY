import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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

export async function GET(req: NextRequest) {
  const isSuper = await checkSuperAdmin(req);
  if (!isSuper) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        permissions: true,
        status: true,
        branchId: true,
        branch: { select: { id: true, code: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: 'Xatolik' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isSuper = await checkSuperAdmin(req);
  if (!isSuper) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });

  try {
    const { username, password, name, role, permissions, branchId } = await req.json();

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Bu login band' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'ADMIN',
        permissions: permissions ? JSON.stringify(permissions) : '[]',
        branchId: typeof branchId === 'number' ? branchId : null,
      },
      select: { id: true, username: true, role: true }
    });

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: 'Saqlashda xatolik' }, { status: 500 });
  }
}
