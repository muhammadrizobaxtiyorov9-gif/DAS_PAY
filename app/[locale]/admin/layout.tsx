'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PackageSearch,
  Newspaper,
  Users,
  FileSignature,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  ClipboardList,
  CalendarDays,
  ScrollText,
  Banknote,
  BarChart3,
  UserCircle,
  Star,
  Train,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'Umumiy ko\'rish' },
  { name: 'Analitika', href: '/admin/analytics', icon: BarChart3, description: 'KPI va tendensiyalar' },
  { name: 'Topshiriqlar', href: '/admin/tasks', icon: ClipboardList, description: 'Hodimlar vazifalari' },
  { name: 'Kalendar', href: '/admin/calendar', icon: CalendarDays, description: 'Kunlik rejalar' },
  { name: 'Xodimlar (KPI)', href: '/admin/kpi', icon: Users, description: 'KPI reytingi' },
  { name: 'Mijozlar', href: '/admin/clients', icon: UserCircle, description: "Mijoz 360° profili" },
  { name: 'Yuklar', href: '/admin/shipments', icon: PackageSearch, description: 'Tracking boshqaruvi' },
  { name: 'Tariflar', href: '/admin/tariffs', icon: Banknote, description: 'Narx katalogi' },
  { name: 'Stansiyalar', href: '/admin/stations', icon: Train, description: "Temir yo'l stansiyalari" },
  { name: 'Invoyslar', href: '/admin/invoices', icon: FileSignature, description: 'Hisob-fakturalar' },
  { name: 'Maqolalar', href: '/admin/blog', icon: Newspaper, description: 'Blog & yangiliklar' },
  { name: 'Arizalar', href: '/admin/leads', icon: Users, description: 'Mijoz so\'rovlari' },
  { name: 'NPS fikrlar', href: '/admin/feedback', icon: Star, description: "Yetkazib berilgandan keyin baholash" },
  { name: 'Shartnomalar', href: '/admin/contracts', icon: FileSignature, description: 'Kontrakt arxivi' },
  { name: 'Adminlar', href: '/admin/users', icon: Shield, description: 'Xodimlar boshqaruvi' },
  { name: 'Audit Log', href: '/admin/audit', icon: ScrollText, description: 'Tizim harakatlari tarixi' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'uz';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getHref = (href: string) => `/${locale}${href}`;

  const isActive = (href: string) => {
    const target = getHref(href);
    if (href === '/admin') return pathname === target;
    return pathname.startsWith(target);
  };

  const handleLogout = () => {
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = `/${locale}/admin-login`;
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-gray-200/80 bg-white transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-[72px] items-center justify-between border-b border-gray-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#042C53] to-[#185FA5] shadow-md shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-gray-900">DasPay</span>
              <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-blue-600">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Boshqaruv
          </p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={getHref(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-[#185FA5] shadow-sm shadow-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#185FA5]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-[#185FA5]/10 text-[#185FA5]'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className={`text-[11px] ${active ? 'text-blue-400' : 'text-gray-400'}`}>
                      {item.description}
                    </span>
                  </div>
                  {active && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-300" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-red-100 group-hover:text-red-600">
              <LogOut className="h-[18px] w-[18px]" />
            </div>
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-gray-200/80 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href={getHref('/admin')} className="text-gray-400 transition-colors hover:text-gray-600">
                Admin
              </Link>
              {currentPage && currentPage.href !== '/admin' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  <span className="font-medium text-gray-700">{currentPage.name}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#042C53] to-[#185FA5] text-xs font-bold text-white shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
