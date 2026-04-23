import { getTrucks } from '@/app/actions/trucks';
import { prisma } from '@/lib/prisma';
import { TrucksClient } from './TrucksClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Avtomobillar | DasPay Admin',
};

export default async function TrucksPage() {
  const res = await getTrucks();
  const initialTrucks = res.trucks || [];

  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER', status: 'ACTIVE' },
    select: { id: true, name: true, username: true }
  });

  const stations = await prisma.station.findMany({
    select: { id: true, nameUz: true, code: true },
    orderBy: { nameUz: 'asc' }
  });

  return <TrucksClient initialTrucks={initialTrucks} drivers={drivers} stations={stations} />;
}
