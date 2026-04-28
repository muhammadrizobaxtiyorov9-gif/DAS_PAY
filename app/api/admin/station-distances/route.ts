import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fromId = searchParams.get('fromId');
    const toId = searchParams.get('toId');

    if (fromId && toId) {
      // Get distance between specific stations
      const distance = await prisma.stationDistance.findUnique({
        where: {
          fromStationId_toStationId: {
            fromStationId: parseInt(fromId),
            toStationId: parseInt(toId),
          }
        }
      });
      // Try reverse direction if not found
      if (!distance) {
        const reverseDistance = await prisma.stationDistance.findUnique({
          where: {
            fromStationId_toStationId: {
              fromStationId: parseInt(toId),
              toStationId: parseInt(fromId),
            }
          }
        });
        if (reverseDistance) return NextResponse.json(reverseDistance);
      }
      return NextResponse.json(distance);
    }

    // List recent distances
    const distances = await prisma.stationDistance.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        fromStation: { select: { nameUz: true, nameRu: true, code: true } },
        toStation: { select: { nameUz: true, nameRu: true, code: true } },
      }
    });

    return NextResponse.json(distances);
  } catch (error: any) {
    console.error('StationDistance GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fromStationId, toStationId, distanceKm } = body;

    if (!fromStationId || !toStationId || typeof distanceKm !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const distance = await prisma.stationDistance.upsert({
      where: {
        fromStationId_toStationId: {
          fromStationId,
          toStationId,
        }
      },
      update: { distanceKm },
      create: {
        fromStationId,
        toStationId,
        distanceKm,
      }
    });

    return NextResponse.json(distance);
  } catch (error: any) {
    console.error('StationDistance POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
