import { getWagons } from '@/app/actions/wagons';
import { WagonsClient } from './WagonsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vagonlar | DasPay Admin',
};

export default async function WagonsPage() {
  const res = await getWagons();
  const initialWagons = res.wagons || [];

  return <WagonsClient initialWagons={initialWagons} />;
}
