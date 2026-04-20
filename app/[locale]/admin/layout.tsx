import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';

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

  return (
    <AdminLayoutClient userRole={session.role}>
      {children}
    </AdminLayoutClient>
  );
}
