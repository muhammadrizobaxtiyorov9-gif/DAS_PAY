import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import { ChatClient } from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin-login`);

  return <ChatClient currentUserId={session.userId} />;
}
