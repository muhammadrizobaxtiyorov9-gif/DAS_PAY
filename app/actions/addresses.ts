'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import { clientJwtSecret } from '@/lib/secrets';

async function getAuthClientId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get('daspay_client_token')?.value;
  if (!token) throw new Error('Avtorizatsiya talab qilinadi');
  const { payload } = await jwtVerify(token, clientJwtSecret());
  const telegramId = payload.sub as string;
  if (!telegramId) throw new Error('Yaroqsiz token');
  const client = await prisma.client.findUnique({
    where: { telegramId },
    select: { id: true },
  });
  if (!client) throw new Error('Mijoz topilmadi');
  return client.id;
}

export interface AddressInput {
  role: 'sender' | 'receiver';
  label?: string;
  fullName: string;
  phone: string;
  country: string;
  city?: string;
  address?: string;
  notes?: string;
  isDefault?: boolean;
}

function normalize(input: AddressInput) {
  return {
    role: input.role,
    label: input.label?.trim() || null,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    country: input.country.trim(),
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    isDefault: !!input.isDefault,
  };
}

export async function createAddress(input: AddressInput) {
  const clientId = await getAuthClientId();
  const data = normalize(input);
  if (!data.fullName || !data.phone || !data.country) {
    throw new Error("To'liq ism, telefon va davlat kiritilishi shart");
  }

  if (data.isDefault) {
    await prisma.clientAddress.updateMany({
      where: { clientId, role: data.role },
      data: { isDefault: false },
    });
  }

  const created = await prisma.clientAddress.create({
    data: { ...data, clientId },
  });
  revalidatePath('/uz/cabinet/addresses');
  revalidatePath('/ru/cabinet/addresses');
  revalidatePath('/en/cabinet/addresses');
  return created;
}

export async function updateAddress(id: number, input: AddressInput) {
  const clientId = await getAuthClientId();
  const existing = await prisma.clientAddress.findUnique({ where: { id } });
  if (!existing || existing.clientId !== clientId) throw new Error('Manzil topilmadi');

  const data = normalize(input);
  if (data.isDefault) {
    await prisma.clientAddress.updateMany({
      where: { clientId, role: data.role, NOT: { id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.clientAddress.update({
    where: { id },
    data,
  });
  revalidatePath('/uz/cabinet/addresses');
  revalidatePath('/ru/cabinet/addresses');
  revalidatePath('/en/cabinet/addresses');
  return updated;
}

export async function deleteAddress(id: number) {
  const clientId = await getAuthClientId();
  const existing = await prisma.clientAddress.findUnique({ where: { id } });
  if (!existing || existing.clientId !== clientId) throw new Error('Manzil topilmadi');
  await prisma.clientAddress.delete({ where: { id } });
  revalidatePath('/uz/cabinet/addresses');
  revalidatePath('/ru/cabinet/addresses');
  revalidatePath('/en/cabinet/addresses');
}

export async function setDefaultAddress(id: number) {
  const clientId = await getAuthClientId();
  const existing = await prisma.clientAddress.findUnique({ where: { id } });
  if (!existing || existing.clientId !== clientId) throw new Error('Manzil topilmadi');

  await prisma.clientAddress.updateMany({
    where: { clientId, role: existing.role },
    data: { isDefault: false },
  });
  await prisma.clientAddress.update({ where: { id }, data: { isDefault: true } });
  revalidatePath('/uz/cabinet/addresses');
  revalidatePath('/ru/cabinet/addresses');
  revalidatePath('/en/cabinet/addresses');
}
