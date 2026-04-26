import 'server-only';
import { prisma } from './prisma';
import { haversine } from './map-utils';
import { createNotification } from './notifications';
import { publish } from './events';

const STOP_THRESHOLD_MIN = 120; // 2 hours stationary = stop
const GPS_SILENCE_MIN = 60; // 1 hour without any GPS log = lost
const OFF_ROUTE_KM = 50; // 50km from straight-line origin→dest = off route

interface CreateAlertInput {
  kind: 'gps_lost' | 'long_stop' | 'off_route' | 'late_eta';
  entityType: 'shipment' | 'truck' | 'wagon';
  entityId: number;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  severity?: 1 | 2 | 3;
  /** Throttle: if an open alert of the same kind exists for this entity in the last `dedupeMin`, skip */
  dedupeMin?: number;
}

async function createAlert(input: CreateAlertInput) {
  const dedupeMin = input.dedupeMin ?? 60;
  const since = new Date(Date.now() - dedupeMin * 60_000);

  const recent = await prisma.anomalyAlert.findFirst({
    where: {
      kind: input.kind,
      entityType: input.entityType,
      entityId: input.entityId,
      status: 'open',
      createdAt: { gte: since },
    },
  });
  if (recent) return null;

  const alert = await prisma.anomalyAlert.create({
    data: {
      kind: input.kind,
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      message: input.message,
      meta: (input.meta ?? {}) as never,
      severity: input.severity ?? 2,
    },
  });

  publish('notification', {
    id: alert.id,
    userId: null,
    type: 'sla',
    title: input.title,
    message: input.message,
    link: `/uz/admin/anomalies`,
  });

  createNotification({
    userId: null,
    type: 'sla',
    title: input.title,
    message: input.message,
    link: `/uz/admin/anomalies`,
    pushTag: `anomaly-${alert.id}`,
  }).catch((e) => console.error('[anomaly] notify', e));

  return alert;
}

export async function runAnomalyCheck(): Promise<{ created: number; checked: number }> {
  const now = Date.now();
  let created = 0;
  let checked = 0;

  // 1. Active shipments still moving
  const activeShipments = await prisma.shipment.findMany({
    where: { status: { in: ['in_transit', 'loaded', 'confirmed', 'arrived_at_loading'] } },
    select: {
      id: true,
      trackingCode: true,
      origin: true,
      destination: true,
      originLat: true,
      originLng: true,
      destinationLat: true,
      destinationLng: true,
      currentLat: true,
      currentLng: true,
      lastStatusUpdate: true,
      etaAt: true,
    },
  });

  for (const s of activeShipments) {
    checked += 1;

    // 1a. GPS loss — no current position OR no log in the last hour
    const lastLog = await prisma.truckLocationLog.findFirst({
      where: { shipmentId: s.id },
      orderBy: { createdAt: 'desc' },
    });
    const lastLogMs = lastLog?.createdAt.getTime() ?? 0;
    const ageMin = (now - lastLogMs) / 60_000;
    if (!lastLog || ageMin > GPS_SILENCE_MIN) {
      const alert = await createAlert({
        kind: 'gps_lost',
        entityType: 'shipment',
        entityId: s.id,
        title: `📡 GPS signal yo'q: ${s.trackingCode}`,
        message: lastLog
          ? `Oxirgi signal ${Math.round(ageMin)} daqiqa oldin`
          : 'Hech qanday joylashuv signal yuborilmadi',
        meta: { lastLogAt: lastLog?.createdAt, ageMin },
        severity: 3,
      });
      if (alert) created += 1;
    }

    // 1b. Long stop (>= 2 hours of zero-speed logs) — only relevant when the truck IS reporting
    if (lastLog) {
      const stopWindowStart = new Date(now - STOP_THRESHOLD_MIN * 60_000);
      const recentLogs = await prisma.truckLocationLog.findMany({
        where: { shipmentId: s.id, createdAt: { gte: stopWindowStart } },
        orderBy: { createdAt: 'asc' },
        select: { lat: true, lng: true, speed: true, createdAt: true },
      });
      const allStopped =
        recentLogs.length >= 3 &&
        recentLogs.every((l) => (l.speed ?? 0) < 5);
      if (allStopped) {
        const alert = await createAlert({
          kind: 'long_stop',
          entityType: 'shipment',
          entityId: s.id,
          title: `⏸ Uzoq to'xtash: ${s.trackingCode}`,
          message: `${STOP_THRESHOLD_MIN} daqiqadan ko'p vaqt joyidan qimirlamayapti`,
          meta: { samples: recentLogs.length },
          severity: 2,
        });
        if (alert) created += 1;
      }
    }

    // 1c. Off-route — too far from straight line origin→dest (poor man's geofence)
    if (s.currentLat != null && s.currentLng != null && s.originLat != null && s.destinationLat != null) {
      const toOrigin = haversine([s.currentLat, s.currentLng], [s.originLat, s.originLng!]);
      const toDest = haversine([s.currentLat, s.currentLng], [s.destinationLat, s.destinationLng!]);
      const total = haversine([s.originLat, s.originLng!], [s.destinationLat, s.destinationLng!]);
      // If sum of legs is much larger than direct line, we're far off
      const detour = toOrigin + toDest - total;
      if (detour > OFF_ROUTE_KM) {
        const alert = await createAlert({
          kind: 'off_route',
          entityType: 'shipment',
          entityId: s.id,
          title: `🛣 Yo'ldan chetga chiqish: ${s.trackingCode}`,
          message: `Hisoblangan chetga chiqish: ~${Math.round(detour)} km`,
          meta: { detourKm: Math.round(detour) },
          severity: 2,
        });
        if (alert) created += 1;
      }
    }

    // 1d. ETA overdue
    if (s.etaAt && s.etaAt.getTime() < now) {
      const lateMin = Math.round((now - s.etaAt.getTime()) / 60_000);
      if (lateMin >= 60) {
        const alert = await createAlert({
          kind: 'late_eta',
          entityType: 'shipment',
          entityId: s.id,
          title: `⏰ ETA kechikishi: ${s.trackingCode}`,
          message: `Belgilangan vaqtdan ${Math.round(lateMin / 60)} soat kechikish`,
          meta: { lateMin, etaAt: s.etaAt },
          severity: lateMin >= 360 ? 3 : 2,
          dedupeMin: 240,
        });
        if (alert) created += 1;
      }
    }
  }

  return { created, checked };
}
