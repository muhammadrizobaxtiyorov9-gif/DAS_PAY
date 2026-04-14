'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, Warehouse, Globe, Plane, Train, FileCheck, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

const services = [
  { key: 'road', icon: Truck, href: '/services/road' },
  { key: 'warehouse', icon: Warehouse, href: '/services/warehouse' },
  { key: 'international', icon: Globe, href: '/services/international' },
  { key: 'air', icon: Plane, href: '/services/air' },
  { key: 'rail', icon: Train, href: '/services/rail' },
  { key: 'customs', icon: FileCheck, href: '/services/customs' },
];

/**
 * Services grid section with animated cards
 */
export function ServicesSection() {
  const { locale } = useLocale();
  const t = useTranslations();

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('services.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('services.subtitle')}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={`/${locale}${service.href}`}
                className="group block h-full rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-[#185FA5]/30 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#042C53]/5 transition-colors group-hover:bg-[#042C53] group-hover:text-white">
                  <service.icon className="h-7 w-7 text-[#042C53] transition-colors group-hover:text-white" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  {t(`services.items.${service.key}.title`)}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {t(`services.items.${service.key}.description`)}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-[#185FA5] transition-colors group-hover:text-[#378ADD]">
                  {t('common.learnMore')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
