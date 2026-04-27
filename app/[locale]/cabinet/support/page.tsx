import { getAuthenticatedClient } from '../lib/clientAuth';
import ClientSupportChat from './ClientSupportChat';
import { prisma } from '@/lib/prisma';
import { MessageCircleQuestion } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const client = await getAuthenticatedClient(locale, sp);

  const messages = await prisma.clientMessage.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'asc' },
    include: {
      admin: { select: { name: true, role: true } }
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#042C53] flex items-center gap-2">
          <MessageCircleQuestion className="w-6 h-6 text-[#185FA5]" /> Yordam (Support)
        </h1>
        <p className="text-sm text-gray-500">
          Savollaringiz bo'lsa bizga yozing. Sizning xabaringiz to'g'ridan-to'g'ri mutaxassislarimizga yetib boradi.
        </p>
      </div>
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <ClientSupportChat 
          clientId={client.id} 
          initialMessages={messages} 
          clientName={client.name || client.phone} 
        />
      </div>
    </div>
  );
}
