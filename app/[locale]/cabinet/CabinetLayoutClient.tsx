'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ListChecks,
  Settings,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  FileText,
  BookUser,
} from 'lucide-react';
import { LogoutButton } from './components/LogoutButton';
import { PushButton } from '@/components/shared/PushButton';
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt';
import CabinetFloatingChat from './components/CabinetFloatingChat';

const navigation = [
  { name: 'Dashboard', href: '/cabinet', icon: LayoutDashboard },
  { name: 'Mening Yuklarim', href: '/cabinet/shipments', icon: Package },
  { name: 'Invoyslarim', href: '/cabinet/invoices', icon: FileText },
  { name: 'Manzillar kitobi', href: '/cabinet/addresses', icon: BookUser },
  { name: 'Arizalarim', href: '/cabinet/leads', icon: ListChecks },
  { name: 'Sozlamalar', href: '/cabinet/settings', icon: Settings },
];

export default function CabinetLayoutClient({
  children,
  clientId,
  clientName,
}: {
  children: React.ReactNode;
  clientId: number;
  clientName: string | null;
}) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'uz';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getHref = (href: string) => `/${locale}${href}`;

  const isActive = (href: string) => {
    const target = getHref(href);
    if (href === '/cabinet') return pathname === target;
    return pathname.startsWith(target);
  };

  const currentPage = navigation.find(n => isActive(n.href));

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#042C53]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#185FA5]/10 bg-white transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-[72px] items-center justify-between border-b border-gray-100 px-6">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042C53] flex-shrink-0">
               <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-[#042C53] tracking-tight">DAS</span>
              <span className="text-xl font-light text-[#185FA5] tracking-tight">PAY</span>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider -mt-1">Shaxsiy Kabinet</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-[#185FA5]/60">
            Asosiy Menyu
          </p>
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={getHref(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-[#185FA5] text-white shadow-md shadow-[#185FA5]/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#042C53]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-[#185FA5]/10 group-hover:text-[#185FA5]'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer info / Logout */}
        <div className="border-t border-gray-100 px-4 py-4">
          <LogoutButton locale={locale} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50/50">
        {/* Top Header Bar */}
        <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#042C53] lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-400">Kabinet</span>
              {currentPage && currentPage.href !== '/cabinet' && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                  <span className="text-[#042C53]">{currentPage.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PushButton clientId={clientId} compact />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#042C53] to-[#185FA5] text-xs font-bold text-white shadow-sm">
              {clientName ? clientName.charAt(0).toUpperCase() : 'M'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="min-h-full p-4 sm:p-6 lg:p-8 pb-24"
          >
            {children}
          </motion.div>
          <PwaInstallPrompt />
        </main>
      </div>

      {/* Floating Chat Widget */}
      <CabinetFloatingChat clientId={clientId} clientName={clientName} />
    </div>
  );
}
