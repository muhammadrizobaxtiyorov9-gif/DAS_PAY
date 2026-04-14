'use client';

import { motion } from 'framer-motion';
import { useTranslations } from '@/components/providers/LocaleProvider';

interface PageHeaderProps {
  titleKey: string;
  subtitleKey?: string;
}

/**
 * Reusable page header with animated background
 */
export function PageHeader({ titleKey, subtitleKey }: PageHeaderProps) {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-[#042C53] pt-32 pb-20">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#042C53] via-[#0A3D6E] to-[#185FA5]" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] -translate-y-1/4 translate-x-1/4 rounded-full bg-[#185FA5]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/4 translate-y-1/4 rounded-full bg-[#378ADD]/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-balance text-4xl font-bold text-white sm:text-5xl">
            {t(titleKey)}
          </h1>
          {subtitleKey && (
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-white/80">
              {t(subtitleKey)}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
