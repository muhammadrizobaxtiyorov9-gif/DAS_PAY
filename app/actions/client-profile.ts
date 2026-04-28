'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { revalidatePath } from 'next/cache';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'daspay_super_secret_jwt_key_2024');

async function getClientFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('daspay_client_token');
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token.value, secret);
    return await prisma.client.findUnique({
      where: { id: payload.clientId as number }
    });
  } catch {
    return null;
  }
}

export async function updateClientProfile(data: {
  name: string;
  companyName: string;
  companyInn: string;
  language: string;
}) {
  try {
    const client = await getClientFromToken();
    if (!client) return { success: false, error: 'Auth error' };

    await prisma.client.update({
      where: { id: client.id },
      data: {
        name: data.name,
        companyName: data.companyName,
        companyInn: data.companyInn,
        language: data.language,
      }
    });

    // Optionally set NEXT_LOCALE cookie if you want to strictly enforce it
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', data.language, { maxAge: 60 * 60 * 24 * 365, path: '/' });

    revalidatePath('/[locale]/cabinet', 'layout');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
