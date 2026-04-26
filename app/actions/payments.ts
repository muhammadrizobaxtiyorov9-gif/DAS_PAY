'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import { buildCheckoutUrl, type PaymentProvider } from '@/lib/payments/providers';
import { CONTACTS } from '@/lib/contacts';
import { clientJwtSecret } from '@/lib/secrets';

async function getAuthClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('daspay_client_token')?.value;
  if (!token) throw new Error('Avtorizatsiya talab qilinadi');
  const { payload } = await jwtVerify(token, clientJwtSecret());
  const telegramId = payload.sub as string;
  if (!telegramId) throw new Error('Yaroqsiz token');
  const client = await prisma.client.findUnique({
    where: { telegramId },
    select: { id: true, phone: true },
  });
  if (!client) throw new Error('Mijoz topilmadi');
  return client;
}

export async function initiateInvoicePayment(invoiceId: number, provider: PaymentProvider) {
  const client = await getAuthClient();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      number: true,
      total: true,
      paidAmount: true,
      currency: true,
      status: true,
      clientPhone: true,
    },
  });
  if (!invoice) throw new Error('Invoys topilmadi');
  if (invoice.clientPhone !== client.phone) throw new Error('Invoysga ruxsat yo\'q');
  if (invoice.status === 'paid') throw new Error("Bu invoys allaqachon to'langan");

  const balance = invoice.total - invoice.paidAmount;
  if (balance <= 0) throw new Error("To'lanishi kerak summa yo'q");

  const amountUZS = convertToUZS(balance, invoice.currency);

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      provider,
      amount: amountUZS,
      currency: 'UZS',
      status: 'pending',
    },
  });

  const returnUrl = `${CONTACTS.web.url}/uz/cabinet/invoices/${invoice.id}`;
  const checkoutUrl = buildCheckoutUrl(provider, {
    paymentId: payment.id,
    invoiceNumber: invoice.number,
    amountUZS,
    returnUrl,
  });

  revalidatePath('/uz/cabinet/invoices/' + invoice.id);
  return { paymentId: payment.id, checkoutUrl };
}

function convertToUZS(amount: number, currency: string): number {
  if (currency === 'UZS') return amount;
  const rates: Record<string, number> = {
    USD: parseFloat(process.env.FX_USD_UZS || '12600'),
    RUB: parseFloat(process.env.FX_RUB_UZS || '140'),
    EUR: parseFloat(process.env.FX_EUR_UZS || '13800'),
  };
  const rate = rates[currency] || 1;
  return Math.round(amount * rate);
}
