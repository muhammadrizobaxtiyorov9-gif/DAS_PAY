import { getDriverDashboardData } from '@/app/actions/driver';
import DriverDashboardClient from './DriverDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage() {
  const data = await getDriverDashboardData();
  
  if (data.error) {
    return (
      <div className="p-6 text-center text-red-500 font-medium">
        Xatolik: {data.error}
      </div>
    );
  }

  return <DriverDashboardClient truck={data.truck} />;
}
