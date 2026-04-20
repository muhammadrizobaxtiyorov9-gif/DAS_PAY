import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stations?q=searchTerm&limit=20
 * Public API for station autocomplete — used by calculator and lead forms.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20') || 20, 50);

    if (q.length < 1) {
      return NextResponse.json({ stations: [] });
    }

    const stations = await prisma.station.findMany({
      where: {
        active: true,
        OR: [
          { nameUz: { contains: q, mode: 'insensitive' } },
          { nameRu: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        code: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
        country: true,
        lat: true,
        lng: true,
      },
      orderBy: { nameUz: 'asc' },
      take: limit,
    });

    return NextResponse.json({ stations });
  } catch (error) {
    console.error('[Stations API] Error:', error);
    return NextResponse.json({ stations: [], error: 'Internal error' }, { status: 500 });
  }
}
