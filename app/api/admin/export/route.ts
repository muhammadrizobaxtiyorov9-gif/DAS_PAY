import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { toCsv } from '@/lib/csv';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity') || '';
  const status = searchParams.get('status') || undefined;

  let filename = '';
  let csv = '';

  if (entity === 'shipments') {
    const shipments = await prisma.shipment.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: { client: { select: { name: true } } },
    });
    csv = toCsv(
      [
        'ID',
        'Tracking',
        'Status',
        'Sender',
        'Receiver',
        'Origin',
        'Destination',
        'Weight (ton)',
        'Client Phone',
        'Client Name',
        'Created',
        'Updated',
      ],
      shipments.map((s) => [
        s.id,
        s.trackingCode,
        s.status,
        s.senderName,
        s.receiverName,
        s.origin,
        s.destination,
        s.weight ?? '',
        s.clientPhone ?? '',
        s.client?.name ?? '',
        s.createdAt,
        s.updatedAt,
      ]),
    );
    filename = `shipments_${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (entity === 'leads') {
    const leads = await prisma.lead.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: { assignee: { select: { name: true, username: true } } },
    });
    csv = toCsv(
      ['ID', 'Name', 'Phone', 'Email', 'Service', 'Transport', 'From', 'To', 'Status', 'Assignee', 'Message', 'Created'],
      leads.map((l) => [
        l.id,
        l.name,
        l.phone,
        l.email ?? '',
        l.service ?? '',
        l.transportType ?? '',
        l.fromStation ?? '',
        l.toStation ?? '',
        l.status,
        l.assignee?.name || l.assignee?.username || '',
        l.message,
        l.createdAt,
      ]),
    );
    filename = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (entity === 'invoices') {
    const invoices = await prisma.invoice.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        client: { select: { name: true } },
        shipment: { select: { trackingCode: true } },
      },
    });
    csv = toCsv(
      [
        'ID',
        'Number',
        'Status',
        'Client Phone',
        'Client Name',
        'Shipment',
        'Subtotal',
        'Tax',
        'Total',
        'Paid',
        'Balance',
        'Currency',
        'Issue Date',
        'Due Date',
      ],
      invoices.map((i) => [
        i.id,
        i.number,
        i.status,
        i.clientPhone ?? '',
        i.client?.name ?? '',
        i.shipment?.trackingCode ?? '',
        i.subtotal,
        i.tax,
        i.total,
        i.paidAmount,
        i.total - i.paidAmount,
        i.currency,
        i.issueDate,
        i.dueDate,
      ]),
    );
    filename = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    return NextResponse.json({ error: 'invalid entity' }, { status: 400 });
  }

  await logAudit(session.userId, 'EXPORT_DATA', `Exported ${entity} (${status || 'all'})`);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
