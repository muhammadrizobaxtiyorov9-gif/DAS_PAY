import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getAdminSession();
  const { locale } = await params;

  if (!session) {
    redirect(`/${locale}/admin-login`);
  }

  const branch = session.branchId
    ? await prisma.branch.findUnique({
        where: { id: session.branchId },
        select: { code: true, name: true },
      })
    : null;

  return (
    <AdminLayoutClient
      userRole={session.role}
      userPermissions={(session as any).permissions || []}
      branchLabel={branch ? `${branch.code} · ${branch.name}` : null}
    >
      {children}
    </AdminLayoutClient>
  );
}
