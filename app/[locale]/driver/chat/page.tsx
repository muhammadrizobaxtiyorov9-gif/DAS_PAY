import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import { ChatClient } from '@/app/[locale]/admin/chat/ChatClient';

export const dynamic = 'force-dynamic';

export default async function DriverChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session || session.role !== 'DRIVER') {
    redirect(`/${locale}/admin-login`);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/${locale}/driver`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-slate-800">Dispetcher bilan chat</h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {session.username}
          </p>
        </div>
      </header>

      <div className="px-2 py-2 sm:px-4">
        <ChatClient currentUserId={session.userId} />
      </div>
    </div>
  );
}
