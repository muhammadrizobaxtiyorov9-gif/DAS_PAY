import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { adminTokenSecret } from './secrets';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, adminTokenSecret());
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      role: payload.role as string,
      permissions: (payload.permissions as string[]) || [],
      branchId: (payload.branchId as number | null) ?? null,
    };
  } catch (error) {
    return null;
  }
}
