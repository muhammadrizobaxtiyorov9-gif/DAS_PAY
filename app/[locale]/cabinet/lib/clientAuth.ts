import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-daspay-client-2026');

export async function getAuthenticatedClient(locale: string = 'uz', searchParams?: { [key: string]: string | string[] | undefined }) {
  // Try telegram WebApp auth (query param)
  const tgId = searchParams?.tgId && typeof searchParams.tgId === 'string' ? searchParams.tgId : null;
  if (tgId) {
    const client = await prisma.client.findUnique({
      where: { telegramId: tgId },
      include: { shipments: { orderBy: { updatedAt: 'desc' } } }
    });
    if (client) return client;
  }

  // Try Cookie auth
  const cookieStore = await cookies();
  const token = cookieStore.get('daspay_client_token')?.value;
  if (!token) {
    redirect(`/${locale}/login`);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const telegramId = payload.sub as string;
    if (!telegramId) redirect(`/${locale}/login`);
    
    const client = await prisma.client.findUnique({
      where: { telegramId },
      include: { shipments: { orderBy: { updatedAt: 'desc' } } }
    });
    
    if (!client) redirect(`/${locale}/login`);
    return client;
  } catch {
    redirect(`/${locale}/login`);
  }
}
