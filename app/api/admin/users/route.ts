import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

async function checkSuperAdmin(req: NextRequest) {
  const adminToken = req.cookies.get('admin_token')?.value;
  if (!adminToken) return false;
  
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026');
    const { payload } = await jwtVerify(adminToken, secret);
    return payload.role === 'SUPERADMIN';
  } catch (e) {
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
        status: true,
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
    const { username, password, name, role } = await req.json();
    
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
      },
      select: { id: true, username: true, role: true }
    });

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: 'Saqlashda xatolik' }, { status: 500 });
  }
}
