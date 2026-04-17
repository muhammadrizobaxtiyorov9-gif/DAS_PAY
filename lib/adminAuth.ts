import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026');
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch (error) {
    return null;
  }
}
