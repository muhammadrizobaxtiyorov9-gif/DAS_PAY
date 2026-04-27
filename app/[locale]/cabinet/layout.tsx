import { getAuthenticatedClient } from './lib/clientAuth';
import CabinetLayoutClient from './CabinetLayoutClient';

export default async function CabinetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // This will redirect to login if not authenticated
  const client = await getAuthenticatedClient(locale);

  return (
    <CabinetLayoutClient clientId={client.id} clientName={client.name}>
      {children}
    </CabinetLayoutClient>
  );
}
