'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Filter, Trophy } from 'lucide-react';

const TABS = [
  { href: '/admin/analytics', label: 'Umumiy', icon: BarChart3 },
  { href: '/admin/analytics/advanced', label: 'Voronka & Heatmap', icon: Filter },
  { href: '/admin/kpi', label: 'Xodimlar reytingi', icon: Trophy },
];

/**
 * Shared tab strip rendered at the top of every analytics screen so the user
 * can move between Operational, Advanced (funnel/heatmap) and Employee KPI
 * without going back to the sidebar.
 */
export function AnalyticsTabs() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'uz';

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map((tab) => {
        const href = `/${locale}${tab.href}`;
        const active =
          tab.href === '/admin/analytics'
            ? pathname === href
            : pathname.startsWith(href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-[#185FA5] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
