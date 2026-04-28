'use server';

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { branchWhere } from '@/lib/branch';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { canTransitionWagon } from '@/lib/wagon-status';
import { processWagonMovement } from '@/lib/wagon-movement';

// ─── Create Wagon ───
export async function createWagon(data: {
  number: string;
  type: string;
  capacity: number;
  status: string;
  currentLat?: number;
  currentLng?: number;
  currentStationId?: number;
}) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q' };

    const existing = await prisma.wagon.findUnique({ where: { number: data.number } });
    if (existing) return { success: false, error: 'Bunday raqamli vagon allaqachon mavjud.' };

    const wagon = await prisma.wagon.create({
      data: {
        number: data.number.trim(),
        type: data.type,
        capacity: data.capacity,
        status: data.status || 'available',
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        currentStationId: data.currentStationId,
        lastLocationUpdate: data.currentLat ? new Date() : undefined,
        branchId: session.branchId ?? null,
      },
    });

    // Log initial status
    await prisma.wagonStatusLog.create({
      data: {
        wagonId: wagon.id,
        fromStatus: '-',
        toStatus: data.status || 'available',
        lat: data.currentLat,
        lng: data.currentLng,
        note: 'Vagon yaratildi',
        changedById: session.userId,
      },
    });

    await logAudit(session.userId, 'ASSIGN_WAGON', `Vagon ${data.number} yaratildi`);
    revalidatePath('/[locale]/admin/wagons', 'page');
    return { success: true, id: wagon.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

// ─── Update Wagon ───
export async function updateWagon(
  id: number,
  data: {
    number: string;
    type: string;
    capacity: number;
    status: string;
    currentLat?: number;
    currentLng?: number;
    currentStationId?: number;
  }
) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q' };

    const existing = await prisma.wagon.findUnique({ where: { number: data.number } });
    if (existing && existing.id !== id) return { success: false, error: 'Bunday raqamli vagon allaqachon mavjud.' };

    const current = await prisma.wagon.findUnique({ where: { id } });
    if (!current) return { success: false, error: 'Vagon topilmadi' };

    if (data.currentStationId && current.currentStationId && current.currentStationId !== data.currentStationId) {
      await processWagonMovement(id, current.currentStationId, data.currentStationId, current.lastLocationUpdate || current.updatedAt, current.lockedByShipmentId);
    }

    await prisma.wagon.update({
      where: { id },
      data: {
        number: data.number.trim(),
        type: data.type,
        capacity: data.capacity,
        status: data.status,
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        currentStationId: data.currentStationId || null,
        lastLocationUpdate: data.currentLat ? new Date() : current.lastLocationUpdate,
      },
    });

    // Log status change if changed
    if (current.status !== data.status) {
      await prisma.wagonStatusLog.create({
        data: {
          wagonId: id,
          fromStatus: current.status,
          toStatus: data.status,
          lat: data.currentLat,
          lng: data.currentLng,
          note: `Status o'zgartirildi`,
          changedById: session.userId,
        },
      });
      await logAudit(session.userId, 'UPDATE_WAGON_STATUS', `Vagon ${data.number}: ${current.status} → ${data.status}`);
    }

    revalidatePath('/[locale]/admin/wagons', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

// ─── Delete Wagon ───
export async function deleteWagon(id: number) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q' };

    const wagon = await prisma.wagon.findUnique({
      where: { id },
      include: { shipments: { where: { status: { notIn: ['delivered', 'unloaded'] } } } },
    });

    if (!wagon) return { success: false, error: 'Vagon topilmadi' };

    if (wagon.shipments.length > 0) {
      return {
        success: false,
        error: `Vagon aktiv yukka biriktirilgan (${wagon.shipments.length} ta). Avval yukni yetkazing yoki vagonni bo'shating.`,
      };
    }

    await prisma.wagon.delete({ where: { id } });
    revalidatePath('/[locale]/admin/wagons', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

// ─── Update Wagon Status (with transition validation) ───
export async function updateWagonStatus(
  wagonId: number,
  newStatus: string,
  note?: string,
  lat?: number,
  lng?: number
) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q' };

    const wagon = await prisma.wagon.findUnique({ where: { id: wagonId } });
    if (!wagon) return { success: false, error: 'Vagon topilmadi' };

    // Validate transition
    if (!canTransitionWagon(wagon.status, newStatus)) {
      return {
        success: false,
        error: `"${wagon.status}" dan "${newStatus}" ga o'tish mumkin emas.`,
      };
    }

    await prisma.wagon.update({
      where: { id: wagonId },
      data: {
        status: newStatus,
        currentLat: lat ?? wagon.currentLat,
        currentLng: lng ?? wagon.currentLng,
        lastLocationUpdate: new Date(),
        // If returning to available, clear lock
        ...(newStatus === 'available' ? {
          lockedByShipmentId: null,
          lockedAt: null,
          lockedByUserId: null,
        } : {}),
      },
    });

    await prisma.wagonStatusLog.create({
      data: {
        wagonId,
        fromStatus: wagon.status,
        toStatus: newStatus,
        lat,
        lng,
        note: note || undefined,
        changedById: session.userId,
      },
    });

    await logAudit(session.userId, 'UPDATE_WAGON_STATUS', `Vagon ${wagon.number}: ${wagon.status} → ${newStatus}`);
    revalidatePath('/[locale]/admin/wagons', 'page');
    revalidatePath('/[locale]/admin/global-map', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

// ─── Update Wagon Location ───
export async function updateWagonLocation(wagonId: number, lat: number, lng: number, stationId?: number) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q' };

    const wagon = await prisma.wagon.findUnique({ where: { id: wagonId } });
    if (!wagon) return { success: false, error: 'Vagon topilmadi' };

    if (stationId && wagon.currentStationId && wagon.currentStationId !== stationId) {
      await processWagonMovement(wagonId, wagon.currentStationId, stationId, wagon.lastLocationUpdate || wagon.updatedAt, wagon.lockedByShipmentId);
    }

    await prisma.wagon.update({
      where: { id: wagonId },
      data: {
        currentLat: lat,
        currentLng: lng,
        currentStationId: stationId || null,
        lastLocationUpdate: new Date(),
      },
    });

    await logAudit(session.userId, 'UPDATE_WAGON_LOCATION', `Vagon ${wagon.number} joylashuvi yangilandi`);
    revalidatePath('/[locale]/admin/global-map', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

// ─── Reassign Wagon (SuperAdmin only) ───
export async function reassignWagon(
  wagonId: number,
  newShipmentId: number | null,
  reason: string
) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q' };

    // Only SUPERADMIN can reassign locked wagons
    if (session.role !== 'SUPERADMIN') {
      return {
        success: false,
        error: 'Faqat SuperAdmin vagonni qayta biriktira oladi.',
      };
    }

    const wagon = await prisma.wagon.findUnique({ where: { id: wagonId } });
    if (!wagon) return { success: false, error: 'Vagon topilmadi' };

    // Remove from current shipment
    if (wagon.lockedByShipmentId) {
      await prisma.shipment.update({
        where: { id: wagon.lockedByShipmentId },
        data: {
          wagons: { disconnect: { id: wagonId } },
        },
      });
    }

    // Assign to new shipment or free the wagon
    if (newShipmentId) {
      await prisma.shipment.update({
        where: { id: newShipmentId },
        data: {
          wagons: { connect: { id: wagonId } },
        },
      });

      await prisma.wagon.update({
        where: { id: wagonId },
        data: {
          status: 'assigned',
          lockedByShipmentId: newShipmentId,
          lockedAt: new Date(),
          lockedByUserId: session.userId,
        },
      });
    } else {
      await prisma.wagon.update({
        where: { id: wagonId },
        data: {
          status: 'available',
          lockedByShipmentId: null,
          lockedAt: null,
          lockedByUserId: null,
        },
      });
    }

    await prisma.wagonStatusLog.create({
      data: {
        wagonId,
        fromStatus: wagon.status,
        toStatus: newShipmentId ? 'assigned' : 'available',
        note: `SuperAdmin qayta biriktirdi: ${reason}`,
        changedById: session.userId,
      },
    });

    await logAudit(session.userId, 'REASSIGN_WAGON', `Vagon ${wagon.number} qayta biriktirildi: ${reason}`);
    revalidatePath('/[locale]/admin/wagons', 'page');
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi.' };
  }
}

// ─── Get Wagon History ───
export async function getWagonHistory(wagonId: number) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q', logs: [] };

    const logs = await prisma.wagonStatusLog.findMany({
      where: { wagonId },
      include: { changedBy: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { success: true, logs };
  } catch (error: any) {
    return { success: false, error: error.message, logs: [] };
  }
}

// ─── Get Wagons with full data ───
export async function getWagons(search?: string) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q', wagons: [] };

    const wagons = await prisma.wagon.findMany({
      where: {
        ...branchWhere(session),
        ...(search ? { number: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: {
        shipments: {
          where: { status: { notIn: ['delivered', 'unloaded'] } },
          select: { id: true, trackingCode: true, status: true, origin: true, destination: true },
        },
        assignedTo: { select: { id: true, name: true, username: true } },
        currentStation: { select: { id: true, nameUz: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, wagons };
  } catch (error: any) {
    return { success: false, error: error.message, wagons: [] };
  }
}

// ─── Get Wagon Movements (KPI) ───
export async function getWagonMovements(wagonId: number) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Ruxsat yo\'q', movements: [] };

    const movements = await prisma.wagonMovement.findMany({
      where: { wagonId },
      include: {
        fromStation: { select: { nameUz: true, code: true } },
        toStation: { select: { nameUz: true, code: true } },
        shipment: { select: { trackingCode: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, movements };
  } catch (error: any) {
    return { success: false, error: error.message, movements: [] };
  }
}

