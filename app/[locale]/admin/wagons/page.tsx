import { getWagons } from '@/app/actions/wagons';
import { prisma } from '@/lib/prisma';
import { WagonsClient } from './WagonsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vagonlar | DasPay Admin',
};

export default async function WagonsPage() {
  const res = await getWagons();
  const initialWagons = res.wagons || [];

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, username: true }
  });

  const stations = await prisma.station.findMany({
    select: { id: true, nameUz: true, code: true },
    orderBy: { nameUz: 'asc' }
  });

  return <WagonsClient initialWagons={initialWagons} users={users} stations={stations} />;
}
