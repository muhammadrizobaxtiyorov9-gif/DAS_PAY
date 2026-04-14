'use client';

import { motion } from 'framer-motion';
import { Package, Globe, Clock, Award } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { useTranslations } from '@/components/providers/LocaleProvider';

const stats = [
  { key: 'deliveries', icon: Package, value: 10000, suffix: '+' },
  { key: 'countries', icon: Globe, value: 10, suffix: '+' },
  { key: 'onTime', icon: Clock, value: 98.7, suffix: '%', decimals: 1 },
  { key: 'experience', icon: Award, value: 10, suffix: '' },
];

/**
 * Statistics section with animated counters and icons
 */
export function StatsSection() {
  const t = useTranslations();

  return (
    <section className="bg-[#042C53] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <stat.icon className="h-8 w-8 text-[#378ADD]" />
              </div>
              <div className="mt-4 text-4xl font-bold text-white lg:text-5xl">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </div>
              <p className="mt-2 text-white/70">
                {t(`stats.${stat.key}.label`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
