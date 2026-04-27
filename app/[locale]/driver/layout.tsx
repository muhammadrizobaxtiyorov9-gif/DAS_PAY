import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt';

export default async function DriverLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session || session.role !== 'DRIVER') {
    redirect(`/${locale}/admin-login`);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto relative">
        {children}
      </main>
      <PwaInstallPrompt />
    </div>
  );
}
