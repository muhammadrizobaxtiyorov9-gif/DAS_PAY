'use server';

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';

export async function getTrucks() {
  try {
    const session = await getAdminSession();
    if (!session) return { trucks: [], error: 'unauthorized' };

    const trucks = await prisma.truck.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        driver: { select: { id: true, name: true, username: true } },
        currentStation: { select: { id: true, nameUz: true, code: true } },
        shipments: {
          where: { status: { notIn: ['delivered', 'unloaded'] } },
          select: { id: true, trackingCode: true, status: true },
        },
      },
    });
    return { trucks };
  } catch (err: any) {
    return { trucks: [], error: err.message };
  }
}

export async function createTruck(data: {
  plateNumber: string;
  model: string;
  capacity: number;
  status: string;
  driverId?: number;
  currentLat?: number;
  currentLng?: number;
  currentStationId?: number;
}) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'unauthorized' };

    const existing = await prisma.truck.findUnique({ where: { plateNumber: data.plateNumber } });
    if (existing) return { success: false, error: 'Bu raqamli mashina allaqachon mavjud' };

    await prisma.truck.create({
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        capacity: data.capacity,
        status: data.status,
        driverId: data.driverId,
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        currentStationId: data.currentStationId,
        lastLocationUpdate: data.currentLat ? new Date() : undefined,
      },
    });

    revalidatePath('/[locale]/admin/trucks', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTruck(
  id: number,
  data: {
    plateNumber?: string;
    model?: string;
    capacity?: number;
    status?: string;
    driverId?: number;
    currentLat?: number;
    currentLng?: number;
    currentStationId?: number;
  }
) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'unauthorized' };

    const current = await prisma.truck.findUnique({ where: { id } });
    if (!current) return { success: false, error: 'not_found' };

    // Prevent changing status directly if it is locked to a shipment
    if (current.lockedByShipmentId && data.status && data.status !== current.status) {
       // Allow 'maintenance' or 'needs_repair' even if locked? No, better warn.
       if (!['needs_repair', 'maintenance'].includes(data.status)) {
         return { success: false, error: 'Yukka ulangan mashina holatini to\'g\'ridan to\'g\'ri o\'zgartirib bo\'lmaydi.' };
       }
    }

    if (data.plateNumber && data.plateNumber !== current.plateNumber) {
      const existing = await prisma.truck.findUnique({ where: { plateNumber: data.plateNumber } });
      if (existing) return { success: false, error: 'Bu raqamli mashina allaqachon mavjud' };
    }

    await prisma.truck.update({
      where: { id },
      data: {
        plateNumber: data.plateNumber,
        model: data.model,
        capacity: data.capacity,
        status: data.status,
        driverId: data.driverId || null,
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        currentStationId: data.currentStationId || null,
        lastLocationUpdate: data.currentLat ? new Date() : current.lastLocationUpdate,
      },
    });

    if (data.status && data.status !== current.status) {
      await prisma.truckStatusLog.create({
        data: {
          truckId: id,
          fromStatus: current.status,
          toStatus: data.status,
          changedById: session.userId,
        }
      });
    }

    revalidatePath('/[locale]/admin/trucks', 'page');
    revalidatePath('/[locale]/admin/global-map', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTruck(id: number) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'unauthorized' };

    const current = await prisma.truck.findUnique({ where: { id } });
    if (!current) return { success: false, error: 'not_found' };

    if (current.lockedByShipmentId) {
      return { success: false, error: 'Mashina yukka biriktirilgan, oldin yukdan o\'chiring.' };
    }

    await prisma.truck.delete({ where: { id } });

    revalidatePath('/[locale]/admin/trucks', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
