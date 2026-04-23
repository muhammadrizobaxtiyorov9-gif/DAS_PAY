import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import { Truck, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function DriverLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session || session.role !== 'DRIVER') {
    redirect(`/${locale}/admin-login`);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">DasPay Driver</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase">{session.username}</p>
            </div>
          </div>
          
          <Link 
            href={`/api/admin/logout`}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto relative">
        {children}
      </main>
    </div>
  );
}
