import { getDriverDashboardData } from '@/app/actions/driver';
import { getAdminSession } from '@/lib/adminAuth';
import DriverDashboardClient from './DriverDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  const data = await getDriverDashboardData();
  
  if (data.error) {
    return (
      <div className="p-6 text-center text-red-500 font-medium">
        Xatolik: {data.error}
      </div>
    );
  }

  return (
    <DriverDashboardClient
      truck={data.truck}
      username={session?.username || 'Driver'}
      locale={locale}
    />
  );
}
