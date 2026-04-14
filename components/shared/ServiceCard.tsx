'use client';

import Link from 'next/link';
import { type LucideIcon, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

interface ServiceCardProps {
  serviceKey: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Reusable service card component
 */
export function ServiceCard({ serviceKey, icon: Icon, href }: ServiceCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
    <Link
      href={`/${locale}${href}`}
      className="group block h-full rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-[#185FA5]/30 hover:shadow-lg"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#042C53]/5 transition-colors group-hover:bg-[#042C53] group-hover:text-white">
        <Icon className="h-7 w-7 text-[#042C53] transition-colors group-hover:text-white" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-foreground">
        {t(`services.items.${serviceKey}.title`)}
      </h3>
      <p className="mt-2 text-muted-foreground">
        {t(`services.items.${serviceKey}.description`)}
      </p>
      <div className="mt-4 flex items-center text-sm font-medium text-[#185FA5] transition-colors group-hover:text-[#378ADD]">
        {t('common.learnMore')}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
