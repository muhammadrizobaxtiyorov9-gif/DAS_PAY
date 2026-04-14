'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

/**
 * Call-to-action banner section
 */
export function CtaSection() {
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
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#042C53] via-[#0A3D6E] to-[#185FA5] px-6 py-16 text-center sm:px-12 lg:px-20"
        >
          {/* Decorative elements */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#378ADD]/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[#185FA5]/30 blur-3xl" />
          
          {/* Icon */}
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Truck className="h-8 w-8 text-white" />
          </div>

          {/* Content */}
          <h2 className="relative mt-6 text-balance text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t('cta.title')}
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-pretty text-lg text-white/80">
            {t('cta.subtitle')}
          </p>

          {/* CTA Button */}
          <div className="relative mt-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-[#042C53] hover:bg-white/90"
            >
              <Link href={`/${locale}/contact`}>
                {t('cta.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
