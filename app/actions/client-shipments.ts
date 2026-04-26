'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
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
    select: { id: true, phone: true, name: true },
  });
  if (!client) throw new Error('Mijoz topilmadi');
  return client;
}

async function generateTrackingCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DAS-${year}-`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    const code = `${prefix}${rand}`;
    const exists = await prisma.shipment.findUnique({ where: { trackingCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Tracking kod yaratib bo'lmadi, qayta urinib ko'ring");
}

export interface ClientShipmentRequest {
  senderName: string;
  senderPhone?: string;
  receiverName: string;
  receiverPhone?: string;
  origin: string;
  destination: string;
  weight?: number;
  description?: string;
}

export async function requestShipment(input: ClientShipmentRequest) {
  const client = await getAuthClient();

  const senderName = input.senderName.trim();
  const receiverName = input.receiverName.trim();
  const origin = input.origin.trim();
  const destination = input.destination.trim();

  if (!senderName || !receiverName || !origin || !destination) {
    throw new Error("Jo'natuvchi, qabul qiluvchi, jo'natish va yetkazish manzillari talab qilinadi");
  }

  const trackingCode = await generateTrackingCode();

  const notes: string[] = [];
  if (input.senderPhone) notes.push(`Jo'natuvchi tel: +${input.senderPhone}`);
  if (input.receiverPhone) notes.push(`Qabul qiluvchi tel: +${input.receiverPhone}`);
  const description = [input.description?.trim(), ...notes].filter(Boolean).join(' · ') || null;

  const initialEvent = {
    status: {
      uz: "Mijoz tomonidan so'rov yuborildi",
      ru: 'Запрос отправлен клиентом',
      en: 'Request submitted by client',
    },
    location: origin,
    date: new Date().toISOString(),
    note: `Mijoz: ${client.name || `+${client.phone}`}`,
    addedBy: 'client',
    addedAt: new Date().toISOString(),
  };

  const created = await prisma.shipment.create({
    data: {
      trackingCode,
      senderName,
      receiverName,
      origin,
      destination,
      status: 'pending',
      weight: input.weight ?? null,
      description,
      clientPhone: client.phone,
      events: [initialEvent],
    },
  });

  revalidatePath('/uz/cabinet/shipments');
  revalidatePath('/ru/cabinet/shipments');
  revalidatePath('/en/cabinet/shipments');
  revalidatePath('/[locale]/admin/shipments', 'page');

  return { id: created.id, trackingCode: created.trackingCode };
}
