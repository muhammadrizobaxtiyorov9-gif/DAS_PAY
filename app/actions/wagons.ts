'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026'
);

async function checkAdminAuth() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) throw new Error('Unauthorized');
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    if (!['ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(payload.role as string)) {
      throw new Error('Forbidden');
    }
    return payload;
  } catch {
    throw new Error('Unauthorized');
  }
}

export async function createWagon(data: { number: string; type: string; capacity: number; status: string }) {
  try {
    await checkAdminAuth();
    const existing = await prisma.wagon.findUnique({ where: { number: data.number } });
    if (existing) return { success: false, error: 'Bunday raqamli vagon allaqachon mavjud.' };

    await prisma.wagon.create({
      data: {
        number: data.number,
        type: data.type,
        capacity: data.capacity,
        status: data.status,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

export async function updateWagon(id: number, data: { number: string; type: string; capacity: number; status: string }) {
  try {
    await checkAdminAuth();
    const existing = await prisma.wagon.findUnique({ where: { number: data.number } });
    if (existing && existing.id !== id) return { success: false, error: 'Bunday raqamli vagon allaqachon mavjud.' };

    await prisma.wagon.update({
      where: { id },
      data: {
        number: data.number,
        type: data.type,
        capacity: data.capacity,
        status: data.status,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

export async function deleteWagon(id: number) {
  try {
    await checkAdminAuth();
    await prisma.wagon.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

export async function getWagons(search?: string) {
  try {
    await checkAdminAuth();
    const wagons = await prisma.wagon.findMany({
      where: search ? { number: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, wagons };
  } catch (error: any) {
    return { success: false, error: error.message, wagons: [] };
  }
}
