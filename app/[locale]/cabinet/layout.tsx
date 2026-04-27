import { getAuthenticatedClient } from './lib/clientAuth';
import CabinetLayoutClient from './CabinetLayoutClient';

export default async function CabinetLayout({
  children,
  params,
  searchParams,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  // This will redirect to login if not authenticated
  const client = await getAuthenticatedClient(locale, sp);

  return (
    <CabinetLayoutClient clientId={client.id} clientName={client.name}>
      {children}
    </CabinetLayoutClient>
  );
}
