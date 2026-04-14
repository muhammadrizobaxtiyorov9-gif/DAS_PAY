'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Headphones } from 'lucide-react';
import { useTranslations } from '@/components/providers/LocaleProvider';

const usps = [
  { key: 'reliable', icon: Shield },
  { key: 'fast', icon: Zap },
  { key: 'support', icon: Headphones },
];

/**
 * About section with company story and USP blocks
 */
export function AboutSection() {
  const t = useTranslations();

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('about.title')}
            </h2>
            <p className="mt-2 text-lg text-[#185FA5]">
              {t('about.subtitle')}
            </p>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {t('about.story')}
            </p>

            {/* USP Cards */}
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {usps.map((usp, index) => (
                <motion.div
                  key={usp.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-xl border bg-card p-4 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#042C53]/5">
                    <usp.icon className="h-6 w-6 text-[#185FA5]" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">
                    {t(`about.usps.${usp.key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`about.usps.${usp.key}.description`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image placeholder / Visual element */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#042C53] to-[#185FA5]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-8">
                  <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                    <div className="text-4xl font-bold text-white">10+</div>
                    <div className="mt-1 text-sm text-white/70">
                      {t('stats.experience.label')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                    <div className="text-4xl font-bold text-white">10+</div>
                    <div className="mt-1 text-sm text-white/70">
                      {t('stats.countries.label')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                    <div className="text-4xl font-bold text-white">10K+</div>
                    <div className="mt-1 text-sm text-white/70">
                      {t('stats.deliveries.label')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                    <div className="text-4xl font-bold text-white">24/7</div>
                    <div className="mt-1 text-sm text-white/70">
                      {t('about.usps.support.title')}
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#378ADD]/30 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-[#185FA5]/30 blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
