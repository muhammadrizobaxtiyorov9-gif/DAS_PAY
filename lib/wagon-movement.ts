import { prisma } from '@/lib/prisma';

export async function processWagonMovement(
  wagonId: number,
  fromStationId: number | null,
  toStationId: number | null,
  startDate: Date,
  lockedByShipmentId: number | null
) {
  if (!fromStationId || !toStationId || fromStationId === toStationId) {
    return;
  }

  try {
    const distanceRecord = await prisma.stationDistance.findFirst({
      where: {
        OR: [
          { fromStationId, toStationId },
          { fromStationId: toStationId, toStationId: fromStationId }
        ]
      }
    });

    const distanceKm = distanceRecord?.distanceKm || 0;
    const endDate = new Date();
    
    // Calculate days between dates (minimum 0.1 to avoid infinity)
    let diffDays = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0.1) diffDays = 0.1; 
    
    const averageDailyKm = distanceKm > 0 ? distanceKm / diffDays : 0;
    const isLoaded = !!lockedByShipmentId;

    await prisma.wagonMovement.create({
      data: {
        wagonId,
        fromStationId,
        toStationId,
        shipmentId: lockedByShipmentId,
        isLoaded,
        distanceKm,
        startDate,
        endDate,
        averageDailyKm,
      }
    });

    console.log(`[WagonMovement] Created for wagon ${wagonId}: ${distanceKm}km, loaded: ${isLoaded}, ${averageDailyKm.toFixed(1)} km/day`);
  } catch (error) {
    console.error('[WagonMovement] Error creating movement:', error);
  }
}
