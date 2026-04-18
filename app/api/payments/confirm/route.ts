import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramToChat } from '@/lib/telegram';
import { logAudit } from '@/lib/audit';

/**
 * Unified payment confirmation endpoint.
 *
 * Called by Click / Payme webhooks (or a back-office ops tool) to mark a payment paid.
 * Real production integration should verify gateway signatures before trusting the body.
 *
 * Expected body: { paymentId, provider, externalId?, amount?, signature? }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { paymentId?: number; provider?: string; externalId?: string; amount?: number; signature?: string }
    | null;

  if (!body?.paymentId || !body.provider) {
    return NextResponse.json({ error: 'paymentId and provider required' }, { status: 400 });
  }

  const sharedSecret = process.env.PAYMENTS_WEBHOOK_SECRET;
  if (sharedSecret && body.signature !== sharedSecret) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: body.paymentId },
    include: { invoice: true },
  });
  if (!payment) return NextResponse.json({ error: 'payment not found' }, { status: 404 });
  if (payment.status === 'paid') {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        externalId: body.externalId || payment.externalId,
        rawPayload: body as object,
      },
    });

    const invoiceBalance = payment.invoice.total - payment.invoice.paidAmount;
    const paidInCurrency = body.amount ?? invoiceBalance;
    const newPaid = payment.invoice.paidAmount + paidInCurrency;
    const fullyPaid = newPaid >= payment.invoice.total - 0.01;

    await tx.invoice.update({
      where: { id: payment.invoice.id },
      data: {
        paidAmount: newPaid,
        status: fullyPaid ? 'paid' : payment.invoice.status,
        paidAt: fullyPaid ? new Date() : payment.invoice.paidAt,
      },
    });
  });

  await logAudit(
    null,
    'PAY_INVOICE',
    `${body.provider}: invoice ${payment.invoice.number} payment #${payment.id} confirmed`,
  );

  if (payment.invoice.clientPhone) {
    const client = await prisma.client.findUnique({ where: { phone: payment.invoice.clientPhone } });
    if (client?.telegramId) {
      await sendTelegramToChat(
        client.telegramId,
        `✅ <b>To'lov qabul qilindi</b>\n\nInvoys: <code>${payment.invoice.number}</code>\nProvayder: ${body.provider}`,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
