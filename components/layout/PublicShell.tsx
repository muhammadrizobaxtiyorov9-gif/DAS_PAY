'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * Conditionally wraps children with Header and Footer
 * Skips for admin and admin-login routes
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.includes('/admin');
  const isCabinetRoute = pathname.includes('/cabinet');
  const isDriverRoute = pathname.includes('/driver');

  if (isAdminRoute || isCabinetRoute || isDriverRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
