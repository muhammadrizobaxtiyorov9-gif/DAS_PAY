import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logUserAction, KPI_POINTS } from '@/lib/kpi';

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
    const formattedCode = data.trackingCode.replace(/[\s-]/g, '').toUpperCase();
    const shipment = await prisma.shipment.create({
      data: {
        trackingCode: formattedCode,
        senderName: data.senderName,
        receiverName: data.receiverName,
        origin: data.origin,
        destination: data.destination,
        status: data.status || 'pending',
        events: data.events ? JSON.parse(data.events) : [],
      }
    });

    await logUserAction('CREATE_SHIPMENT', `Yuk qo'shildi: ${formattedCode}`, KPI_POINTS.CREATE_SHIPMENT);

    await logUserAction('CREATE_SHIPMENT', `Yuk qo'shildi: ${formattedCode}`, KPI_POINTS.CREATE_SHIPMENT);

    return NextResponse.json(shipment);
  } catch (err) {
    return NextResponse.json({ error: 'Saqlashda xatolik' }, { status: 500 });
  }
}
