'use server';

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { haversine } from '@/lib/map-utils';
import { sendPushToClient } from '@/lib/push';
import { createNotification } from '@/lib/notifications';
import { publish } from '@/lib/events';

export async function getDriverDashboardData() {
  const session = await getAdminSession();
  if (!session || session.role !== 'DRIVER') return { error: 'unauthorized' };

  // Find the truck assigned to this driver
  const truck = await prisma.truck.findFirst({
    where: { driverId: session.userId },
    include: {
      shipments: {
        where: { status: { notIn: ['delivered', 'unloaded', 'cancelled'] } },
        include: {
          client: { select: { name: true, phone: true } },
        }
      }
    }
  });

  return { truck };
}

export async function updateDriverLocation(lat: number, lng: number) {
  const session = await getAdminSession();
  if (!session || session.role !== 'DRIVER') return { error: 'unauthorized' };

  const truck = await prisma.truck.findFirst({
    where: { driverId: session.userId }
  });

  if (!truck) return { error: 'Mashina biriktirilmagan' };

  let speed = 0;
  let isStop = true;

  if (truck.currentLat && truck.currentLng && truck.lastLocationUpdate) {
    const distanceKm = haversine([truck.currentLat, truck.currentLng], [lat, lng]);
    const hours = (new Date().getTime() - truck.lastLocationUpdate.getTime()) / (1000 * 60 * 60);
    if (hours > 0) {
      speed = distanceKm / hours;
      // Filter out GPS jitter. If speed is very high, it might be an anomaly but let's log it.
      // If speed > 3 km/h, consider it moving.
      isStop = speed < 3;
    }
  }

  await prisma.truckLocationLog.create({
    data: {
      truckId: truck.id,
      shipmentId: truck.lockedByShipmentId,
      lat,
      lng,
      speed: isStop ? 0 : speed,
      isStop
    }
  });

  await prisma.truck.update({
    where: { id: truck.id },
    data: {
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date()
    }
  });

  // If locked to a shipment, update the shipment location too for realtime tracking
  if (truck.lockedByShipmentId) {
    await prisma.shipment.update({
      where: { id: truck.lockedByShipmentId },
      data: {
        currentLat: lat,
        currentLng: lng
      }
    });
  }

  return { success: true };
}

export async function updateShipmentStatusByDriver(shipmentId: number, status: string) {
  const session = await getAdminSession();
  if (!session || session.role !== 'DRIVER') return { error: 'unauthorized' };

  // Verify the driver actually owns this shipment via their truck
  const truck = await prisma.truck.findFirst({
    where: { driverId: session.userId, lockedByShipmentId: shipmentId }
  });

  if (!truck) return { error: 'Bu yuk sizga biriktirilmagan' };

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) return { error: 'Yuk topilmadi' };

  const events = Array.isArray(shipment.events) ? shipment.events : [];
  const newEvents = [
    ...events,
    {
      status,
      date: new Date().toISOString(),
      location: 'Haydovchi mobil ilovasi orqali',
      note: 'Haydovchi tomonidan status yangilandi'
    }
  ];

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      status,
      events: newEvents,
      lastStatusUpdate: new Date(),
    }
  });

  // If delivered, we need to unlock the truck
  if (status === 'delivered' || status === 'unloaded') {
    await prisma.truck.update({
      where: { id: truck.id },
      data: {
        lockedByShipmentId: null,
        lockedAt: null,
        lockedByUserId: null,
        status: 'available'
      }
    });
    
    // Also unlock any wagons if multimodal
    await prisma.wagon.updateMany({
      where: { lockedByShipmentId: shipmentId },
      data: {
        lockedByShipmentId: null,
        lockedAt: null,
        lockedByUserId: null,
        status: 'available'
      }
    });
  }

  revalidatePath('/[locale]/driver', 'page');
  revalidatePath('/[locale]/admin/global-map', 'page');
  revalidatePath('/[locale]/admin/shipments', 'page');

  // Real-time SSE
  publish(status === 'delivered' ? 'shipment.delivered' : 'shipment.statusChanged', {
    id: shipmentId,
    trackingCode: shipment.trackingCode,
    status,
  });

  // Notification + Push: admins (broadcast) + client (Web Push only)
  const title = `Yuk ${shipment.trackingCode} — yangi holat`;
  const body = `Holat: ${status}`;
  createNotification({
    userId: null,
    type: 'shipment',
    title,
    message: body,
    link: `/uz/admin/shipments/${shipmentId}`,
    pushTag: `shipment-${shipmentId}`,
  }).catch((e) => console.error('[notify] driver-status', e));

  if (shipment.clientPhone) {
    const client = await prisma.client.findUnique({ where: { phone: shipment.clientPhone } });
    if (client) {
      sendPushToClient(client.id, {
        title,
        body,
        url: `/uz/cabinet`,
        tag: `shipment-${shipmentId}`,
      }).catch((e) => console.error('[push] driver-status client', e));
    }
  }

  return { success: true };
}
