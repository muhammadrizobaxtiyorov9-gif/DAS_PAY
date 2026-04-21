import { getAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { PartnerForm } from './PartnerForm';

export default async function AdminPartnerEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getAdminSession();
  
  if (!session) redirect(`/${locale}/admin-login`);
  if (session.role !== 'SUPERADMIN') notFound();

  let partner = null;
  if (id !== 'new') {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) notFound();
    
    partner = await prisma.partner.findUnique({
      where: { id: parsedId }
    });
    
    if (!partner) notFound();
  }

  return (
    <div className="max-w-4xl">
      <PartnerForm locale={locale} partner={partner || undefined} />
    </div>
  );
}
