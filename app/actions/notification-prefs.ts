'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-for-daspay-client-2026',
);

async function getAuthClientId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get('daspay_client_token')?.value;
  if (!token) throw new Error('Avtorizatsiya talab qilinadi');
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const telegramId = payload.sub as string;
  if (!telegramId) throw new Error('Yaroqsiz token');
  const client = await prisma.client.findUnique({
    where: { telegramId },
    select: { id: true },
  });
  if (!client) throw new Error('Mijoz topilmadi');
  return client.id;
}

export interface NotificationPrefs {
  notifyStatusChange: boolean;
  notifyEta: boolean;
  notifyInvoices: boolean;
  notifyPromo: boolean;
  notifyEmail?: string | null;
}

export async function updateNotificationPrefs(prefs: NotificationPrefs) {
  const clientId = await getAuthClientId();

  const email = prefs.notifyEmail?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email formati noto'g'ri");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      notifyStatusChange: prefs.notifyStatusChange,
      notifyEta: prefs.notifyEta,
      notifyInvoices: prefs.notifyInvoices,
      notifyPromo: prefs.notifyPromo,
      notifyEmail: email || null,
    },
  });

  revalidatePath('/uz/cabinet/settings');
  revalidatePath('/ru/cabinet/settings');
  revalidatePath('/en/cabinet/settings');
  return { success: true };
}
