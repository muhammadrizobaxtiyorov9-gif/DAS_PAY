import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const KPI_POINTS = {
  CREATE_SHIPMENT: 5,
  UPDATE_SHIPMENT: 2,
  CREATE_CONTRACT: 10,
  UPDATE_CONTRACT: 3,
  PROCESS_LEAD: 4,
};

export async function getAdminIdFromToken(): Promise<number | null> {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) return null;
  
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as number;
  } catch (error) {
    return null;
  }
}

export async function logUserAction(actionType: string, description: string, points: number) {
  try {
    const userId = await getAdminIdFromToken();
    if (!userId) return; // not logged in or invalid token
    
    await prisma.userAction.create({
      data: {
        userId,
        actionType,
        description,
        points,
      }
    });
  } catch (err) {
    console.error('KPI Log Error:', err);
  }
}
