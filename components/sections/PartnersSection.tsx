'use client';

import { motion } from 'framer-motion';
import { useTranslations } from '@/components/providers/LocaleProvider';

// Partner logos placeholder - in production, replace with actual logos
const partners = [
  { name: 'DHL', color: '#D40511' },
  { name: 'FedEx', color: '#4D148C' },
  { name: 'Maersk', color: '#00243D' },
  { name: 'DB Schenker', color: '#FF0000' },
  { name: 'Kuehne+Nagel', color: '#003C69' },
  { name: 'COSCO', color: '#003366' },
  { name: 'Evergreen', color: '#008751' },
  { name: 'CMA CGM', color: '#00457C' },
];

/**
 * Partners logo strip with marquee animation
 */
export function PartnersSection() {
  const t = useTranslations();

  return (
    <section className="bg-secondary py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t('partners.title')}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t('partners.subtitle')}
          </p>
        </motion.div>

        {/* Marquee */}
        <div className="relative mt-10 overflow-hidden">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-secondary to-transparent" />
          <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-secondary to-transparent" />

          {/* Scrolling container */}
          <div className="flex animate-marquee items-center gap-12">
            {/* First set */}
            {partners.map((partner, index) => (
              <div
                key={`first-${index}`}
                className="flex h-16 min-w-[160px] items-center justify-center rounded-lg bg-card px-6 shadow-sm"
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: partner.color }}
                >
                  {partner.name}
                </span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {partners.map((partner, index) => (
              <div
                key={`second-${index}`}
                className="flex h-16 min-w-[160px] items-center justify-center rounded-lg bg-card px-6 shadow-sm"
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: partner.color }}
                >
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
