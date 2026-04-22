import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * SLA Check Cron Endpoint
 * Runs every 2 hours to check for missed status updates.
 * If an assigned employee hasn't updated wagon/shipment status in 2+ hours,
 * a penalty (-3 points) is applied to their KPI.
 * 
 * Call: GET /api/cron/sla-check?secret=YOUR_CRON_SECRET
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const secret = req.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET || 'daspay_cron_2026';
  
  if (secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  let wagonViolations = 0;
  let shipmentViolations = 0;

  try {
    // ── 1. Check wagons with missed updates ──
    const staleWagons = await prisma.wagon.findMany({
      where: {
        status: { in: ['assigned', 'in_transit'] },
        assignedToId: { not: null },
        OR: [
          { lastLocationUpdate: { lt: twoHoursAgo } },
          { lastLocationUpdate: null },
        ],
      },
      select: { id: true, number: true, assignedToId: true },
    });

    for (const wagon of staleWagons) {
      if (!wagon.assignedToId) continue;

      // Check if we already penalized this user for this wagon in the last 2 hours
      const recentViolation = await prisma.slaViolation.findFirst({
        where: {
          userId: wagon.assignedToId,
          wagonId: wagon.id,
          type: 'WAGON_UPDATE_MISSED',
          createdAt: { gt: twoHoursAgo },
        },
      });

      if (!recentViolation) {
        await prisma.slaViolation.create({
          data: {
            userId: wagon.assignedToId,
            wagonId: wagon.id,
            type: 'WAGON_UPDATE_MISSED',
            penalty: -3,
          },
        });

        // Log penalty to KPI
        await prisma.userAction.create({
          data: {
            userId: wagon.assignedToId,
            actionType: 'SLA_VIOLATION',
            description: `Vagon ${wagon.number}: 2 soat ichida yangilanmadi`,
            points: -3,
          },
        });

        wagonViolations++;
      }
    }

    // ── 2. Check shipments with missed updates ──
    const staleShipments = await prisma.shipment.findMany({
      where: {
        status: { in: ['loaded', 'in_transit', 'customs_cleared', 'docs_ready'] },
        assignedToId: { not: null },
        OR: [
          { lastStatusUpdate: { lt: twoHoursAgo } },
          { lastStatusUpdate: null },
        ],
      },
      select: { id: true, trackingCode: true, assignedToId: true },
    });

    for (const shipment of staleShipments) {
      if (!shipment.assignedToId) continue;

      const recentViolation = await prisma.slaViolation.findFirst({
        where: {
          userId: shipment.assignedToId,
          shipmentId: shipment.id,
          type: 'SHIPMENT_UPDATE_MISSED',
          createdAt: { gt: twoHoursAgo },
        },
      });

      if (!recentViolation) {
        await prisma.slaViolation.create({
          data: {
            userId: shipment.assignedToId,
            shipmentId: shipment.id,
            type: 'SHIPMENT_UPDATE_MISSED',
            penalty: -3,
          },
        });

        await prisma.userAction.create({
          data: {
            userId: shipment.assignedToId,
            actionType: 'SLA_VIOLATION',
            description: `Yuk ${shipment.trackingCode}: 2 soat ichida yangilanmadi`,
            points: -3,
          },
        });

        shipmentViolations++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      wagonViolations,
      shipmentViolations,
      totalPenalties: wagonViolations + shipmentViolations,
    });
  } catch (error: any) {
    console.error('[SLA Check] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
