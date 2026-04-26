'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/adminAuth';
import { logAudit } from '@/lib/audit';
import { notifyClientOfShipmentEvent } from '@/lib/shipment-notifications';
import { requestFeedbackFromClient } from '@/lib/feedback';
import { computeEta as computeShipmentEta } from '@/lib/eta';

function totalSegmentDistanceKm(segments: unknown[]): number {
  let total = 0;
  for (const s of segments as Array<{ distanceKm?: number; distance?: number }>) {
    if (typeof s.distanceKm === 'number' && Number.isFinite(s.distanceKm)) {
      total += s.distanceKm;
    } else if (typeof s.distance === 'number' && Number.isFinite(s.distance)) {
      total += s.distance > 10000 ? s.distance / 1000 : s.distance;
    }
  }
  return total;
}

// --- LEADS ---

export async function updateLeadStatus(id: number, status: string, assignedToId?: number) {
  try {
    await prisma.lead.update({
      where: { id },
      data: { status, assignedToId }
    });
    revalidatePath('/[locale]/admin/leads', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLead(id: number) {
  try {
    await prisma.lead.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/leads', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function convertLeadToShipment(leadId: number) {
  const session = await getAdminSession();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Ariza topilmadi');

  const year = new Date().getFullYear();
  let trackingCode = '';
  for (let i = 0; i < 8; i++) {
    const candidate = `DAS-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
    const exists = await prisma.shipment.findUnique({ where: { trackingCode: candidate }, select: { id: true } });
    if (!exists) {
      trackingCode = candidate;
      break;
    }
  }
  if (!trackingCode) throw new Error("Tracking kod yaratib bo'lmadi");

  const clientPhone = lead.phone.replace(/\D/g, '') || null;

  const client = clientPhone
    ? await prisma.client.upsert({
        where: { phone: clientPhone },
        update: { name: lead.name || undefined },
        create: { phone: clientPhone, name: lead.name || null },
      })
    : null;

  const initialEvent = {
    status: { uz: 'Ariza asosida yaratildi', ru: 'Создан из заявки', en: 'Created from lead' },
    location: lead.fromStation || '',
    date: new Date().toISOString(),
    note: `Lead #${lead.id} — ${lead.service || lead.transportType || 'request'}`,
    addedBy: session?.username || 'admin',
    addedAt: new Date().toISOString(),
  };

  const shipment = await prisma.shipment.create({
    data: {
      trackingCode,
      senderName: lead.name,
      receiverName: lead.name,
      origin: lead.fromStation || '',
      destination: lead.toStation || '',
      status: 'pending',
      description: lead.message || null,
      clientPhone: client?.phone || null,
      createdById: session?.userId,
      branchId: session?.branchId ?? null,
      events: [initialEvent],
    },
  });

  await prisma.lead.update({ where: { id: lead.id }, data: { status: 'won' } });
  await logAudit(
    session?.userId,
    'CREATE_SHIPMENT',
    `Lead #${lead.id} converted to shipment ${trackingCode}`,
  );

  revalidatePath('/[locale]/admin/leads', 'page');
  revalidatePath('/[locale]/admin/shipments', 'page');
  return { shipmentId: shipment.id, trackingCode };
}

// --- CONTRACTS ---

export async function deleteContract(id: number) {
  try {
    await prisma.contract.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/contracts', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- SHIPMENTS ---

export async function createShipment(data: {
  trackingCode: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  weight?: number;
  description?: string;
  clientPhone?: string;
  routeSegments?: any[];
  transportMode?: string;
  cost?: number;
  revenue?: number;
  currency?: string;
  wagonIds?: number[];
  truckIds?: number[];
  cargoType?: string;
  assignedToId?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) {
  try {
    const session = await getAdminSession();

    if (data.clientPhone) {
      const existingClient = await prisma.client.findUnique({
        where: { phone: data.clientPhone }
      });
      if (!existingClient) {
        return { success: false, error: 'Bunday mijoz mavjud emas' };
      }
    }

    // Server-side wagon validation
    if (data.wagonIds && data.wagonIds.length > 0) {
      const selectedWagons = await prisma.wagon.findMany({
        where: { id: { in: data.wagonIds } },
        include: { shipments: { where: { status: { notIn: ['delivered', 'unloaded'] } }, select: { id: true } } }
      });

      const busyWagons = selectedWagons.filter(w => w.shipments.length > 0);
      if (busyWagons.length > 0) return { success: false, error: `Vagon(lar) band.` };

      const unavailable = selectedWagons.filter(w => w.status !== 'available');
      if (unavailable.length > 0) return { success: false, error: `Vagon(lar) tayyor emas.` };
    }

    // Server-side truck validation
    if (data.truckIds && data.truckIds.length > 0) {
      const selectedTrucks = await prisma.truck.findMany({
        where: { id: { in: data.truckIds } },
        include: { shipments: { where: { status: { notIn: ['delivered', 'unloaded'] } }, select: { id: true } } }
      });

      const busyTrucks = selectedTrucks.filter(t => t.shipments.length > 0);
      if (busyTrucks.length > 0) return { success: false, error: `Avtomobil(lar) band.` };

      const unavailable = selectedTrucks.filter(t => t.status !== 'available');
      if (unavailable.length > 0) return { success: false, error: `Avtomobil(lar) tayyor emas.` };
    }


    const distanceKm = data.routeSegments ? totalSegmentDistanceKm(data.routeSegments) : 0;
    const etaAt = distanceKm > 0
      ? computeShipmentEta({ startAt: new Date(), distanceKm, mode: data.transportMode })
      : null;

    const dataWithUser = {
       ...data,
       distanceKm: distanceKm > 0 ? distanceKm : null,
       etaAt,
       createdById: session?.userId || null,
       assignedToId: data.assignedToId || session?.userId || null,
       branchId: session?.branchId ?? null,
       lastStatusUpdate: new Date(),
       wagons: data.wagonIds && data.wagonIds.length > 0 ? {
         connect: data.wagonIds.map(id => ({ id }))
       } : undefined,
       trucks: data.truckIds && data.truckIds.length > 0 ? {
         connect: data.truckIds.map(id => ({ id }))
       } : undefined
    };
    delete dataWithUser.wagonIds;
    delete dataWithUser.truckIds;

    const created = await prisma.shipment.create({
      data: dataWithUser as any,
    });

    // Sync wagon statuses to shipment status
    let mappedWagonStatus = 'assigned';
    if (['in_transit'].includes(data.status)) mappedWagonStatus = 'in_transit';
    else if (['arrived_at_station'].includes(data.status)) mappedWagonStatus = 'at_station';
    else if (['unloaded', 'delivered'].includes(data.status)) mappedWagonStatus = 'available';

    // Lock wagons to this shipment
    if (data.wagonIds && data.wagonIds.length > 0) {
      if (mappedWagonStatus === 'available') {
        await prisma.wagon.updateMany({
          where: { id: { in: data.wagonIds } },
          data: { status: 'available', lockedByShipmentId: null, lockedAt: null, lockedByUserId: null },
        });
      } else {
        await prisma.wagon.updateMany({
          where: { id: { in: data.wagonIds } },
          data: { status: mappedWagonStatus, lockedByShipmentId: created.id, lockedAt: new Date(), lockedByUserId: session?.userId || null },
        });
      }
    }

    // Lock trucks to this shipment
    if (data.truckIds && data.truckIds.length > 0) {
      if (mappedWagonStatus === 'available') {
        await prisma.truck.updateMany({
          where: { id: { in: data.truckIds } },
          data: { status: 'available', lockedByShipmentId: null, lockedAt: null, lockedByUserId: null },
        });
      } else {
        await prisma.truck.updateMany({
          where: { id: { in: data.truckIds } },
          data: { status: mappedWagonStatus, lockedByShipmentId: created.id, lockedAt: new Date(), lockedByUserId: session?.userId || null },
        });
      }
    }

    await logAudit(session?.userId, 'CREATE_SHIPMENT', `Created shipment ${created.trackingCode}`);
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateShipment(id: number, data: {
  trackingCode: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  weight?: number;
  description?: string;
  clientPhone?: string;
  routeSegments?: any[];
  transportMode?: string;
  cost?: number;
  revenue?: number;
  currency?: string;
  wagonIds?: number[];
  truckIds?: number[];
  cargoType?: string;
  assignedToId?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) {
  try {
    const session = await getAdminSession();
    
    if (data.clientPhone) {
      const existingClient = await prisma.client.findUnique({
        where: { phone: data.clientPhone }
      });
      if (!existingClient) {
        return { success: false, error: 'Bunday mijoz mavjud emas' };
      }
    }

    const existing = await prisma.shipment.findUnique({
      where: { id },
      include: { wagons: { select: { id: true } }, trucks: { select: { id: true } } }
    });
    if (!existing) return { success: false, error: 'Yuk topilmadi' };

    // Role-based wagon lock: after pending, only SuperAdmin can change wagons
    const existingWagonIds = (existing as any).wagons?.map((w: any) => w.id) || [];
    const newWagonIds = data.wagonIds || [];
    const wagonsChanged = JSON.stringify(existingWagonIds.sort()) !== JSON.stringify([...newWagonIds].sort());

    const existingTruckIds = (existing as any).trucks?.map((t: any) => t.id) || [];
    const newTruckIds = data.truckIds || [];
    const trucksChanged = JSON.stringify(existingTruckIds.sort()) !== JSON.stringify([...newTruckIds].sort());

    if ((wagonsChanged || trucksChanged) && existing.status !== 'pending' && session?.role !== 'SUPERADMIN') {
      return {
        success: false,
        error: 'Yuk "Ariza qabul qilindi" holatidan keyingi bosqichlarda faqat SuperAdmin transport vositalarini o\'zgartira oladi.',
      };
    }

    // Server-side wagon validation for update
    if (data.wagonIds && data.wagonIds.length > 0) {
      const selectedWagons = await prisma.wagon.findMany({
        where: { id: { in: data.wagonIds } },
        include: { shipments: { where: { id: { not: id }, status: { notIn: ['delivered', 'unloaded'] } }, select: { id: true } } }
      });

      // 1. Busy check
      const busyWagons = selectedWagons.filter(w => w.shipments.length > 0);
      if (busyWagons.length > 0) {
        const nums = busyWagons.map(w => w.number).join(', ');
        return { success: false, error: `Vagon(lar) band: ${nums}. Yuk yetkazilmaguncha boshqa yukka biriktirib bo'lmaydi.` };
      }

      // 2. Cargo ↔ wagon compatibility
      if (data.cargoType) {
        const { isWagonCompatible } = await import('@/lib/cargo-wagon-compatibility');
        const incompatible = selectedWagons.filter(w => !isWagonCompatible(w.type, data.cargoType!));
        if (incompatible.length > 0) {
          const nums = incompatible.map(w => `${w.number} (${w.type})`).join(', ');
          return { success: false, error: `Vagon(lar) yuk turiga mos emas: ${nums}.` };
        }
      }

      // 3. Weight check
      if (data.weight && data.weight > 0) {
        const totalCapacity = selectedWagons.reduce((sum, w) => sum + w.capacity, 0);
        if (data.weight > totalCapacity) {
          return { success: false, error: `Yuk og'irligi (${data.weight}t) vagonlar sig'imidan (${totalCapacity}t) oshib ketdi.` };
        }
      }
    }
    // Server-side truck validation for update
    if (data.truckIds && data.truckIds.length > 0) {
      const selectedTrucks = await prisma.truck.findMany({
        where: { id: { in: data.truckIds } },
        include: { shipments: { where: { id: { not: id }, status: { notIn: ['delivered', 'unloaded'] } }, select: { id: true } } }
      });

      const busyTrucks = selectedTrucks.filter(t => t.shipments.length > 0);
      if (busyTrucks.length > 0) {
        return { success: false, error: `Avtomobil(lar) band.` };
      }

      const unavailable = selectedTrucks.filter(t => t.status !== 'available' && !existingTruckIds.includes(t.id));
      if (unavailable.length > 0) {
        return { success: false, error: `Avtomobil(lar) tayyor emas.` };
      }
    }

    const distanceKm = data.routeSegments ? totalSegmentDistanceKm(data.routeSegments) : 0;

    const recomputeEta =
      distanceKm > 0 &&
      (data.transportMode !== (existing as unknown as { transportMode?: string | null })?.transportMode ||
        distanceKm !== (existing as unknown as { distanceKm?: number | null })?.distanceKm);

    const etaAt = recomputeEta
      ? computeShipmentEta({ startAt: existing?.createdAt ?? new Date(), distanceKm, mode: data.transportMode })
      : undefined;

    const updatePayload = {
      ...data,
      ...(distanceKm > 0 ? { distanceKm } : {}),
      ...(etaAt ? { etaAt } : {}),
      lastStatusUpdate: new Date(),
      wagons: data.wagonIds ? {
        set: data.wagonIds.map(wid => ({ id: wid }))
      } : undefined,
      trucks: data.truckIds ? {
        set: data.truckIds.map(tid => ({ id: tid }))
      } : undefined
    };
    delete updatePayload.wagonIds;
    delete updatePayload.truckIds;

    const updated = await prisma.shipment.update({
      where: { id },
      data: updatePayload as any,
    });

    // Sync wagon statuses to shipment status
    let mappedWagonStatus = 'assigned';
    if (['in_transit'].includes(data.status)) mappedWagonStatus = 'in_transit';
    else if (['arrived_at_station'].includes(data.status)) mappedWagonStatus = 'at_station';
    else if (['unloaded', 'delivered'].includes(data.status)) mappedWagonStatus = 'available';

    // Manage wagon locks on change
    if (wagonsChanged) {
      // Unlock removed wagons
      const removedIds = existingWagonIds.filter((wid: number) => !newWagonIds.includes(wid));
      if (removedIds.length > 0) {
        await prisma.wagon.updateMany({
          where: { id: { in: removedIds } },
          data: { status: 'available', lockedByShipmentId: null, lockedAt: null, lockedByUserId: null },
        });
      }
      // Lock newly added wagons
      const addedIds = newWagonIds.filter(wid => !existingWagonIds.includes(wid));
      if (addedIds.length > 0) {
        await prisma.wagon.updateMany({
          where: { id: { in: addedIds } },
          data: { status: mappedWagonStatus, lockedByShipmentId: id, lockedAt: new Date(), lockedByUserId: session?.userId || null },
        });
      }
    }

    // Sync status for ALL current wagons belonging to this shipment
    if (data.wagonIds && data.wagonIds.length > 0) {
      if (mappedWagonStatus === 'available') {
         // Shipment is delivered/unloaded -> free all wagons
         await prisma.wagon.updateMany({
            where: { lockedByShipmentId: id },
            data: { status: 'available', lockedByShipmentId: null, lockedAt: null, lockedByUserId: null },
         });
      } else {
         // Update status of all locked wagons
         await prisma.wagon.updateMany({
            where: { lockedByShipmentId: id },
            data: { status: mappedWagonStatus },
         });
      }
    }
    // Manage truck locks on change
    if (trucksChanged) {
      // Unlock removed trucks
      const removedIds = existingTruckIds.filter((tid: number) => !newTruckIds.includes(tid));
      if (removedIds.length > 0) {
        await prisma.truck.updateMany({
          where: { id: { in: removedIds } },
          data: { status: 'available', lockedByShipmentId: null, lockedAt: null, lockedByUserId: null },
        });
      }
      // Lock newly added trucks
      const addedIds = newTruckIds.filter((tid: number) => !existingTruckIds.includes(tid));
      if (addedIds.length > 0) {
        await prisma.truck.updateMany({
          where: { id: { in: addedIds } },
          data: { status: mappedWagonStatus, lockedByShipmentId: id, lockedAt: new Date(), lockedByUserId: session?.userId || null },
        });
      }
    }

    // Sync status for ALL current trucks belonging to this shipment
    if (data.truckIds && data.truckIds.length > 0) {
      if (mappedWagonStatus === 'available') {
         await prisma.truck.updateMany({
            where: { lockedByShipmentId: id },
            data: { status: 'available', lockedByShipmentId: null, lockedAt: null, lockedByUserId: null },
         });
      } else {
         await prisma.truck.updateMany({
            where: { lockedByShipmentId: id },
            data: { status: mappedWagonStatus },
         });
      }
    }

    await logAudit(session?.userId, 'UPDATE_SHIPMENT', `Updated shipment ${updated.trackingCode}`);
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkShipmentAction(input: {
  ids: number[];
  action: 'setStatus' | 'delete';
  status?: string;
}) {
  try {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'unauthorized' };
    const ids = input.ids.filter((n) => Number.isFinite(n));
    if (ids.length === 0) return { success: false, error: 'no_ids' };

    if (input.action === 'setStatus') {
      if (!input.status) return { success: false, error: 'missing_status' };
      const result = await prisma.shipment.updateMany({
        where: { id: { in: ids } },
        data: { status: input.status },
      });
      await logAudit(
        session.userId,
        'UPDATE_SHIPMENT',
        `Bulk set status=${input.status} on ${result.count} shipments`,
      );
      revalidatePath('/[locale]/admin/shipments', 'page');
      return { success: true, count: result.count };
    }

    if (input.action === 'delete') {
      const result = await prisma.shipment.deleteMany({ where: { id: { in: ids } } });
      await logAudit(
        session.userId,
        'DELETE_SHIPMENT',
        `Bulk deleted ${result.count} shipments`,
      );
      revalidatePath('/[locale]/admin/shipments', 'page');
      return { success: true, count: result.count };
    }

    return { success: false, error: 'unknown_action' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateShipmentFinancials(id: number, data: {
  revenue: number;
  cost: number;
  currency: string;
  transportMode?: string;
}) {
  try {
    const session = await getAdminSession();
    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Yuk topilmadi' };

    const prevMode = (existing as unknown as { transportMode?: string | null }).transportMode;
    const distanceKm = (existing as unknown as { distanceKm?: number | null }).distanceKm || 0;
    const recomputeEta = distanceKm > 0 && data.transportMode && data.transportMode !== prevMode;
    const etaAt = recomputeEta
      ? computeShipmentEta({ startAt: existing.createdAt, distanceKm, mode: data.transportMode })
      : undefined;

    await prisma.shipment.update({
      where: { id },
      data: {
        revenue: data.revenue,
        cost: data.cost,
        currency: data.currency,
        ...(data.transportMode ? { transportMode: data.transportMode } : {}),
        ...(etaAt ? { etaAt } : {}),
      } as never,
    });

    await logAudit(
      session?.userId,
      'UPDATE_SHIPMENT',
      `Financials for ${existing.trackingCode}: revenue=${data.revenue} cost=${data.cost} ${data.currency}`,
    );
    revalidatePath('/[locale]/admin/shipments', 'page');
    revalidatePath(`/[locale]/admin/shipments/${id}`, 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteShipment(id: number) {
  try {
    const session = await getAdminSession();
    const shipment = await prisma.shipment.findUnique({ where: { id }, select: { trackingCode: true } });
    await prisma.shipment.delete({
      where: { id }
    });
    await logAudit(session?.userId, 'DELETE_SHIPMENT', `Deleted shipment ${shipment?.trackingCode || id}`);
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface ShipmentEventInput {
  statusUz: string;
  statusRu: string;
  statusEn: string;
  location: string;
  date?: string;
  lat?: number | null;
  lng?: number | null;
  note?: string;
  updateTopLevelStatus?: string | null;
  notifyClient?: boolean;
}

export async function addShipmentEvent(shipmentId: number, input: ShipmentEventInput) {
  try {
    const session = await getAdminSession();
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return { success: false, error: 'Yuk topilmadi' };

    const existingEvents = Array.isArray(shipment.events)
      ? (shipment.events as unknown[])
      : typeof shipment.events === 'string'
      ? (() => {
          try { return JSON.parse(shipment.events as unknown as string); } catch { return []; }
        })()
      : [];

    const newEvent = {
      status: {
        uz: input.statusUz,
        ru: input.statusRu,
        en: input.statusEn,
      },
      location: input.location,
      date: input.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
      note: input.note || undefined,
      lat: typeof input.lat === 'number' ? input.lat : undefined,
      lng: typeof input.lng === 'number' ? input.lng : undefined,
      addedBy: session?.username || undefined,
      addedAt: new Date().toISOString(),
    };

    const updateData: Record<string, unknown> = {
      events: [...existingEvents, newEvent],
    };

    if (typeof input.lat === 'number' && typeof input.lng === 'number') {
      updateData.currentLat = input.lat;
      updateData.currentLng = input.lng;
    }

    if (input.updateTopLevelStatus) {
      updateData.status = input.updateTopLevelStatus;
    }

    await prisma.shipment.update({ where: { id: shipmentId }, data: updateData });

    await logAudit(
      session?.userId,
      'ADD_SHIPMENT_EVENT',
      `Shipment ${shipment.trackingCode}: ${input.statusUz} @ ${input.location}`,
    );

    let notified = false;
    let notifyReason: string | undefined;
    if (input.notifyClient !== false) {
      const result = await notifyClientOfShipmentEvent({
        trackingCode: shipment.trackingCode,
        currentStatus: (updateData.status as string) || shipment.status,
        clientPhone: shipment.clientPhone,
        event: {
          statusUz: input.statusUz,
          statusRu: input.statusRu,
          statusEn: input.statusEn,
          location: input.location,
          date: newEvent.date,
          note: input.note,
        },
      });
      notified = result.notified;
      notifyReason = result.reason;
    }

    if (
      input.updateTopLevelStatus === 'delivered' &&
      shipment.status !== 'delivered' &&
      input.notifyClient !== false
    ) {
      await requestFeedbackFromClient({
        shipmentId,
        trackingCode: shipment.trackingCode,
        clientPhone: shipment.clientPhone,
      });
    }

    revalidatePath('/[locale]/admin/shipments', 'page');
    revalidatePath(`/[locale]/admin/shipments/${shipmentId}`, 'page');
    revalidatePath('/[locale]/tracking/[code]', 'page');
    revalidatePath('/[locale]/cabinet/shipments', 'page');

    return { success: true, notified, notifyReason };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteShipmentEvent(shipmentId: number, index: number) {
  try {
    const session = await getAdminSession();
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return { success: false, error: 'Yuk topilmadi' };

    const events = Array.isArray(shipment.events)
      ? [...(shipment.events as unknown[])]
      : typeof shipment.events === 'string'
      ? (() => {
          try { return JSON.parse(shipment.events as unknown as string); } catch { return []; }
        })()
      : [];

    if (index < 0 || index >= events.length) {
      return { success: false, error: 'Event topilmadi' };
    }

    events.splice(index, 1);
    await prisma.shipment.update({ where: { id: shipmentId }, data: { events } });

    await logAudit(
      session?.userId,
      'UPDATE_SHIPMENT',
      `Shipment ${shipment.trackingCode}: event removed (#${index})`,
    );

    revalidatePath('/[locale]/admin/shipments', 'page');
    revalidatePath(`/[locale]/admin/shipments/${shipmentId}`, 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- BLOG POSTS ---

export async function createBlogPost(data: any) {
  try {
    await prisma.blogPost.create({
      data
    });
    revalidatePath('/[locale]/admin/blog', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateBlogPost(id: number, data: any) {
  try {
    await prisma.blogPost.update({
      where: { id },
      data
    });
    revalidatePath('/[locale]/admin/blog', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBlogPost(id: number) {
  try {
    await prisma.blogPost.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/blog', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- TASKS ---

export async function createTask(data: {
  title: string;
  description?: string;
  leadId?: number;
  assignedById: number;
  assignedToId: number;
  deadline: Date;
  status?: string;
  priority?: string;
}) {
  try {
    const task = await prisma.task.create({ data });
    revalidatePath('/[locale]/admin/tasks', 'page');
    revalidatePath('/[locale]/admin/calendar', 'page');
    return { success: true, task };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTaskStatus(id: number, status: string) {
  try {
    await prisma.task.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/[locale]/admin/tasks', 'page');
    revalidatePath('/[locale]/admin/calendar', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTask(id: number) {
  try {
    await prisma.task.delete({ where: { id } });
    revalidatePath('/[locale]/admin/tasks', 'page');
    revalidatePath('/[locale]/admin/calendar', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- TARIFFS ---

export interface TariffInput {
  name: string;
  originCountry: string;
  originCity?: string | null;
  destCountry: string;
  destCity?: string | null;
  mode: string;
  pricePerKg: number;
  baseFee: number;
  minWeight: number;
  currency: string;
  transitDays?: number | null;
  notes?: string | null;
  active: boolean;
}

function normalizeTariffData(input: TariffInput) {
  return {
    name: input.name.trim(),
    originCountry: input.originCountry.trim(),
    originCity: input.originCity?.trim() || null,
    destCountry: input.destCountry.trim(),
    destCity: input.destCity?.trim() || null,
    mode: input.mode || 'train',
    pricePerKg: Number(input.pricePerKg) || 0,
    baseFee: Number(input.baseFee) || 0,
    minWeight: Number(input.minWeight) || 0,
    currency: (input.currency || 'USD').toUpperCase(),
    transitDays:
      input.transitDays === null || input.transitDays === undefined || Number.isNaN(Number(input.transitDays))
        ? null
        : Math.max(0, Math.round(Number(input.transitDays))),
    notes: input.notes?.trim() || null,
    active: !!input.active,
  };
}

export async function createTariff(input: TariffInput) {
  try {
    const session = await getAdminSession();
    const data = normalizeTariffData(input);
    const created = await prisma.tariff.create({ data });
    await logAudit(session?.userId, 'CREATE_TARIFF', `Tarif qo'shildi: ${created.name}`);
    revalidatePath('/[locale]/admin/tariffs', 'page');
    return { success: true, id: created.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTariff(id: number, input: TariffInput) {
  try {
    const session = await getAdminSession();
    const data = normalizeTariffData(input);
    const updated = await prisma.tariff.update({ where: { id }, data });
    await logAudit(session?.userId, 'UPDATE_TARIFF', `Tarif yangilandi: ${updated.name}`);
    revalidatePath('/[locale]/admin/tariffs', 'page');
    revalidatePath(`/[locale]/admin/tariffs/${id}`, 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTariff(id: number) {
  try {
    const session = await getAdminSession();
    const existing = await prisma.tariff.findUnique({ where: { id }, select: { name: true } });
    await prisma.tariff.delete({ where: { id } });
    await logAudit(session?.userId, 'DELETE_TARIFF', `Tarif o'chirildi: ${existing?.name || id}`);
    revalidatePath('/[locale]/admin/tariffs', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleTariffActive(id: number, active: boolean) {
  try {
    const session = await getAdminSession();
    const updated = await prisma.tariff.update({ where: { id }, data: { active } });
    await logAudit(
      session?.userId,
      'UPDATE_TARIFF',
      `${active ? 'Yoqildi' : "O'chirildi"}: ${updated.name}`,
    );
    revalidatePath('/[locale]/admin/tariffs', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- INVOICES ---

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceInput {
  shipmentId?: number | null;
  clientPhone?: string | null;
  contractId?: number | null;
  dueDate: string; // ISO
  items: InvoiceItemInput[];
  taxRate: number;
  currency: string;
  notes?: string | null;
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function summarizeInvoice(items: InvoiceItemInput[], taxRate: number) {
  const subtotal = roundMoney(items.reduce((s, it) => s + (Number(it.total) || 0), 0));
  const tax = roundMoney(subtotal * (Number(taxRate) || 0) / 100);
  const total = roundMoney(subtotal + tax);
  return { subtotal, tax, total };
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `INV-${year}-` } },
  });
  const seq = count + 1;
  return `INV-${year}-${seq.toString().padStart(5, '0')}`;
}

export async function createInvoice(input: InvoiceInput) {
  try {
    const session = await getAdminSession();
    const { subtotal, tax, total } = summarizeInvoice(input.items, input.taxRate);
    const number = await nextInvoiceNumber();
    const created = await prisma.invoice.create({
      data: {
        number,
        dueDate: new Date(input.dueDate),
        shipmentId: input.shipmentId || null,
        clientPhone: input.clientPhone || null,
        contractId: input.contractId || null,
        items: input.items as unknown as object,
        subtotal,
        taxRate: Number(input.taxRate) || 0,
        tax,
        total,
        currency: (input.currency || 'USD').toUpperCase(),
        notes: input.notes || null,
        createdById: session?.userId || null,
      },
    });
    await logAudit(session?.userId, 'CREATE_INVOICE', `Invoys ${created.number} yaratildi`);
    revalidatePath('/[locale]/admin/invoices', 'page');
    return { success: true, id: created.id, number: created.number };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createInvoiceFromShipment(shipmentId: number) {
  try {
    const session = await getAdminSession();
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return { success: false, error: 'Yuk topilmadi' };

    const weight = shipment.weight || 1;
    const items: InvoiceItemInput[] = [
      {
        description: `Yetkazib berish xizmati (${shipment.origin} → ${shipment.destination}, ${weight} tonna)`,
        quantity: 1,
        unitPrice: roundMoney(weight * 2.5),
        total: roundMoney(weight * 2.5),
      },
    ];

    const { subtotal, tax, total } = summarizeInvoice(items, 0);
    const number = await nextInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const created = await prisma.invoice.create({
      data: {
        number,
        dueDate,
        shipmentId,
        clientPhone: shipment.clientPhone || null,
        items: items as unknown as object,
        subtotal,
        tax,
        total,
        currency: 'USD',
        createdById: session?.userId || null,
      },
    });
    await logAudit(
      session?.userId,
      'CREATE_INVOICE',
      `Invoys ${created.number} yukdan avtomatik yaratildi (#${shipment.trackingCode})`,
    );
    revalidatePath('/[locale]/admin/invoices', 'page');
    revalidatePath(`/[locale]/admin/shipments/${shipmentId}`, 'page');
    return { success: true, id: created.id, number: created.number };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateInvoice(id: number, input: InvoiceInput) {
  try {
    const session = await getAdminSession();
    const { subtotal, tax, total } = summarizeInvoice(input.items, input.taxRate);
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        dueDate: new Date(input.dueDate),
        shipmentId: input.shipmentId || null,
        clientPhone: input.clientPhone || null,
        contractId: input.contractId || null,
        items: input.items as unknown as object,
        subtotal,
        taxRate: Number(input.taxRate) || 0,
        tax,
        total,
        currency: (input.currency || 'USD').toUpperCase(),
        notes: input.notes || null,
      },
    });
    await logAudit(session?.userId, 'UPDATE_INVOICE', `Invoys ${updated.number} yangilandi`);
    revalidatePath('/[locale]/admin/invoices', 'page');
    revalidatePath(`/[locale]/admin/invoices/${id}`, 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateInvoiceStatus(
  id: number,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  paidAmount?: number,
) {
  try {
    const session = await getAdminSession();
    const now = new Date();
    const data: Record<string, unknown> = { status };
    if (status === 'sent') data.sentAt = now;
    if (status === 'paid') {
      data.paidAt = now;
      if (typeof paidAmount === 'number') data.paidAmount = paidAmount;
    }
    const updated = await prisma.invoice.update({ where: { id }, data });
    const actionType = status === 'sent'
      ? 'SEND_INVOICE'
      : status === 'paid'
        ? 'PAY_INVOICE'
        : 'UPDATE_INVOICE';
    await logAudit(session?.userId, actionType as any, `Invoys ${updated.number}: ${status}`);
    revalidatePath('/[locale]/admin/invoices', 'page');
    revalidatePath(`/[locale]/admin/invoices/${id}`, 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteInvoice(id: number) {
  try {
    const session = await getAdminSession();
    const existing = await prisma.invoice.findUnique({ where: { id }, select: { number: true } });
    await prisma.invoice.delete({ where: { id } });
    await logAudit(session?.userId, 'DELETE_INVOICE', `Invoys ${existing?.number || id} o'chirildi`);
    revalidatePath('/[locale]/admin/invoices', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendInvoiceReminder(id: number) {
  try {
    const session = await getAdminSession();
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { telegramId: true, name: true, phone: true } },
      },
    });
    if (!invoice) return { success: false, error: 'Invoys topilmadi' };
    if (!invoice.client?.telegramId) {
      return { success: false, error: 'Mijozda Telegram akkaunti ulangan emas' };
    }

    const { sendTelegramToChat } = await import('@/lib/telegram');
    const { formatMoney } = await import('@/lib/money');
    const dueStr = invoice.dueDate.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
    const amount = formatMoney(invoice.total - invoice.paidAmount, invoice.currency);

    const text =
      `<b>💳 To'lov eslatmasi</b>\n\n` +
      `Hisob-faktura: <b>${invoice.number}</b>\n` +
      `Summa: <b>${amount}</b>\n` +
      `To'lov muddati: <b>${dueStr}</b>\n\n` +
      `Iltimos, belgilangan muddat ichida to'lovni amalga oshiring.`;

    const sent = await sendTelegramToChat(invoice.client.telegramId, text);
    if (!sent) return { success: false, error: 'Telegram xabar yuborilmadi' };

    await logAudit(
      session?.userId,
      'SEND_INVOICE',
      `Eslatma yuborildi: ${invoice.number} (${invoice.client.phone})`,
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- STATIONS ---

export interface StationInput {
  code: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  country: string;
  lat?: number | null;
  lng?: number | null;
  active: boolean;
}

function normalizeStationData(input: StationInput) {
  return {
    code: input.code.trim(),
    nameUz: input.nameUz.trim(),
    nameRu: input.nameRu.trim(),
    nameEn: input.nameEn.trim(),
    country: input.country.trim() || "O'zbekiston",
    lat: typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : null,
    lng: typeof input.lng === 'number' && Number.isFinite(input.lng) ? input.lng : null,
    active: !!input.active,
  };
}

export async function createStation(input: StationInput) {
  try {
    const session = await getAdminSession();
    const data = normalizeStationData(input);
    const created = await prisma.station.create({ data });
    await logAudit(session?.userId, 'CREATE_STATION' as any, `Stansiya qo'shildi: ${created.nameUz} (${created.code})`);
    revalidatePath('/[locale]/admin/stations', 'page');
    return { success: true, id: created.id };
  } catch (err: any) {
    if (err.code === 'P2002') {
      return { success: false, error: 'Bu kod allaqachon mavjud' };
    }
    return { success: false, error: err.message };
  }
}

export async function updateStation(id: number, input: StationInput) {
  try {
    const session = await getAdminSession();
    const data = normalizeStationData(input);
    const updated = await prisma.station.update({ where: { id }, data });
    await logAudit(session?.userId, 'UPDATE_STATION' as any, `Stansiya yangilandi: ${updated.nameUz} (${updated.code})`);
    revalidatePath('/[locale]/admin/stations', 'page');
    revalidatePath(`/[locale]/admin/stations/${id}`, 'page');
    return { success: true };
  } catch (err: any) {
    if (err.code === 'P2002') {
      return { success: false, error: 'Bu kod allaqachon mavjud' };
    }
    return { success: false, error: err.message };
  }
}

export async function deleteStation(id: number) {
  try {
    const session = await getAdminSession();
    const existing = await prisma.station.findUnique({ where: { id }, select: { nameUz: true, code: true } });
    await prisma.station.delete({ where: { id } });
    await logAudit(session?.userId, 'DELETE_STATION' as any, `Stansiya o'chirildi: ${existing?.nameUz || id} (${existing?.code})`);
    revalidatePath('/[locale]/admin/stations', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleStationActive(id: number, active: boolean) {
  try {
    const session = await getAdminSession();
    const updated = await prisma.station.update({ where: { id }, data: { active } });
    await logAudit(
      session?.userId,
      'UPDATE_STATION' as any,
      `${active ? 'Yoqildi' : "O'chirildi"}: ${updated.nameUz} (${updated.code})`,
    );
    revalidatePath('/[locale]/admin/stations', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- PARTNERS ---

export interface PartnerInput {
  name: string;
  logoUrl?: string | null;
  color?: string | null;
  active: boolean;
  order: number;
}

export async function createPartner(input: PartnerInput) {
  try {
    const session = await getAdminSession();
    if (session?.role !== 'SUPERADMIN') return { success: false, error: 'unauthorized' };

    const created = await prisma.partner.create({ data: {
      name: input.name.trim(),
      logoUrl: input.logoUrl?.trim() || null,
      color: input.color?.trim() || null,
      active: !!input.active,
      order: Number(input.order) || 0,
    } });
    
    await logAudit(session?.userId, 'CREATE_PARTNER', `Hamkor qo'shildi: ${created.name}`);
    revalidatePath('/[locale]/admin/partners', 'page');
    revalidatePath('/', 'layout');
    return { success: true, id: created.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePartner(id: number, input: PartnerInput) {
  try {
    const session = await getAdminSession();
    if (session?.role !== 'SUPERADMIN') return { success: false, error: 'unauthorized' };

    const updated = await prisma.partner.update({
      where: { id },
      data: {
        name: input.name.trim(),
        logoUrl: input.logoUrl?.trim() || null,
        color: input.color?.trim() || null,
        active: !!input.active,
        order: Number(input.order) || 0,
      }
    });

    await logAudit(session?.userId, 'UPDATE_PARTNER', `Hamkor yangilandi: ${updated.name}`);
    revalidatePath('/[locale]/admin/partners', 'page');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePartner(id: number) {
  try {
    const session = await getAdminSession();
    if (session?.role !== 'SUPERADMIN') return { success: false, error: 'unauthorized' };

    const existing = await prisma.partner.findUnique({ where: { id }, select: { name: true } });
    await prisma.partner.delete({ where: { id } });
    await logAudit(session?.userId, 'DELETE_PARTNER', `Hamkor o'chirildi: ${existing?.name || id}`);
    revalidatePath('/[locale]/admin/partners', 'page');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function togglePartnerActive(id: number, active: boolean) {
  try {
    const session = await getAdminSession();
    if (session?.role !== 'SUPERADMIN') return { success: false, error: 'unauthorized' };

    const updated = await prisma.partner.update({ where: { id }, data: { active } });
    await logAudit(
      session?.userId,
      'UPDATE_PARTNER',
      `${active ? 'Yoqildi' : "O'chirildi"}: ${updated.name}`,
    );
    revalidatePath('/[locale]/admin/partners', 'page');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
