'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { createNotification } from '@/lib/notifications';

export async function ensureReceiveToken(shipmentId: number): Promise<{ token: string }> {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { receiveToken: true } });
  if (shipment?.receiveToken) return { token: shipment.receiveToken };
  const token = randomBytes(16).toString('hex');
  await prisma.shipment.update({ where: { id: shipmentId }, data: { receiveToken: token } });
  return { token };
}

export async function confirmReceive(
  trackingCode: string,
  token: string,
  signature: string,
  geo?: { lat: number; lng: number },
): Promise<{ ok: true } | { error: string }> {
  if (!signature || signature.trim().length < 2) {
    return { error: 'invalid_signature' };
  }

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode },
    select: {
      id: true,
      receiveToken: true,
      receivedAt: true,
      status: true,
      trackingCode: true,
      assignedToId: true,
    },
  });

  if (!shipment) return { error: 'not_found' };
  if (!shipment.receiveToken || shipment.receiveToken !== token) {
    return { error: 'invalid_token' };
  }
  if (shipment.receivedAt) {
    return { error: 'already_confirmed' };
  }

  const events: Array<Record<string, unknown>> = [];
  const existing = await prisma.shipment.findUnique({ where: { id: shipment.id }, select: { events: true } });
  if (Array.isArray(existing?.events)) {
    for (const e of existing!.events as unknown[]) events.push(e as Record<string, unknown>);
  }
  events.push({
    status: 'delivered',
    date: new Date().toISOString(),
    location: geo ? `Mijoz tasdiqi (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})` : 'Mijoz QR tasdiqi',
    note: `Imzo: ${signature.trim()}`,
  });

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: 'delivered',
      receivedAt: new Date(),
      receivedSignature: signature.trim(),
      receivedLat: geo?.lat ?? null,
      receivedLng: geo?.lng ?? null,
      events: events as never,
      lastStatusUpdate: new Date(),
      // Burn the token so it can't be replayed
      receiveToken: null,
    },
  });

  // Unlock truck/wagons
  await prisma.truck.updateMany({
    where: { lockedByShipmentId: shipment.id },
    data: { lockedByShipmentId: null, lockedAt: null, lockedByUserId: null, status: 'available' },
  });
  await prisma.wagon.updateMany({
    where: { lockedByShipmentId: shipment.id },
    data: { lockedByShipmentId: null, lockedAt: null, lockedByUserId: null, status: 'available' },
  });

  createNotification({
    userId: shipment.assignedToId ?? null,
    type: 'shipment',
    title: `Yuk yetkazildi: ${shipment.trackingCode}`,
    message: `Mijoz QR orqali tasdiqladi · imzo: ${signature.trim()}`,
    link: `/uz/admin/shipments/${shipment.id}`,
    pushTag: `delivered-${shipment.id}`,
  }).catch((e) => console.error('[receive] notify', e));

  revalidatePath('/[locale]/admin/shipments', 'page');

  return { ok: true };
}
