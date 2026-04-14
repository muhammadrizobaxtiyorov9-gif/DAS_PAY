import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const shipments = await prisma.shipment.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(shipments);
  } catch (err) {
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const shipment = await prisma.shipment.create({
      data: {
        trackingCode: data.trackingCode.toUpperCase(),
        senderName: data.senderName,
        receiverName: data.receiverName,
        origin: data.origin,
        destination: data.destination,
        status: data.status || 'pending',
        events: data.events ? JSON.parse(data.events) : [],
      }
    });
    return NextResponse.json(shipment);
  } catch (err) {
    return NextResponse.json({ error: 'Saqlashda xatolik' }, { status: 500 });
  }
}
