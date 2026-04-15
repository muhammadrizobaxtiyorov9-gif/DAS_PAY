import { NextRequest, NextResponse } from 'next/server';
import { trackingFormSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = trackingFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid tracking code format' },
        { status: 400 }
      );
    }

    const { trackingCode } = result.data;
    const locale = (body.locale as string) || 'uz';
    const formattedCode = trackingCode.replace(/[\s-]/g, '').toUpperCase();

    // Look up tracking data from Prisma
    const trackingData = await prisma.shipment.findUnique({
      where: { trackingCode: formattedCode }
    });

    // Write a tracking event for analytics (fire and forget)
    // Avoid await to prevent blocking the response
    prisma.trackingQuery.create({
      data: {
        trackingCode: formattedCode,
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        found: !!trackingData,
      }
    }).catch(e => console.error('Failed to log tracking query:', e));

    if (!trackingData) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Since events are stored as JSON in Prisma, we ensure they are parsed
    const eventsArray = Array.isArray(trackingData.events) 
       ? trackingData.events 
       : typeof trackingData.events === 'string' 
           ? JSON.parse(trackingData.events) 
           : [];
           
    // We assume the admin enters localized statuses like { "uz": "...", "ru": "...", "en": "..." }
    const localizedData = {
      ...trackingData,
      lastUpdate: trackingData.updatedAt.toISOString().slice(0, 16).replace('T', ' '),
      events: eventsArray.map((event: any) => ({
        ...event,
        status: event.status?.[locale] || event.status?.uz || event.status, // Fallbacks
      })),
    };

    return NextResponse.json(localizedData);
  } catch (error) {
    console.error('[Tracking API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
