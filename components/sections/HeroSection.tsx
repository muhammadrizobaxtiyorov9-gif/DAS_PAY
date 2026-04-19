import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { getTranslator, type Locale, type Messages } from '@/lib/i18n-translator';
import { Reveal } from '@/components/shared/motion-primitives';
import { HeroParallax, HeroScrollIndicator } from './HeroParallax';

interface HeroStat {
  key: string;
  value: number;
  suffix: string;
  decimals?: number;
  minWidth: string;
}

const stats: HeroStat[] = [
  { key: 'deliveries', value: 10000, suffix: '+', minWidth: '7ch' },
  { key: 'countries', value: 10, suffix: '+', minWidth: '3ch' },
  { key: 'onTime', value: 98.7, suffix: '%', decimals: 1, minWidth: '5ch' },
  { key: 'experience', value: 10, suffix: '', minWidth: '2ch' },
];

interface HeroSectionProps {
  locale: Locale;
  messages: Messages;
}

export function HeroSection({ locale, messages }: HeroSectionProps) {
  const t = getTranslator(messages);

  const background = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#042C53] via-[#0A3D6E] to-[#185FA5]" />
      <div className="absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-[#185FA5]/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full bg-[#378ADD]/20 blur-3xl" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
    </>
  );

  return (
    <HeroParallax background={background}>
      <div className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
            <Package className="h-4 w-4" />
            {t('common.tagline')}
          </Reveal>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/80 sm:text-xl">
            {t('hero.subtitle')}
          </p>

          <Reveal
            delay={0.3}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="w-full bg-white text-[#042C53] hover:bg-white/90 sm:w-auto"
            >
              <Link href={`/${locale}/contact`} prefetch>
                {t('hero.cta1')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
            >
              <Link href={`/${locale}/tracking`} prefetch>
                {t('hero.cta2')}
              </Link>
            </Button>
          </Reveal>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.key} className="text-center">
              <div className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  minWidth={stat.minWidth}
                />
              </div>
              <p className="mt-2 text-sm text-white/70 sm:text-base">
                {t(`hero.stats.${stat.key}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <HeroScrollIndicator />
    </HeroParallax>
  );
}
