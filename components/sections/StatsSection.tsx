import { Package, Globe, Clock, Award, type LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { getTranslator, type Locale, type Messages } from '@/lib/i18n-translator';
import { Reveal } from '@/components/shared/motion-primitives';

interface StatItem {
  key: string;
  icon: LucideIcon;
  value: number;
  suffix: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { key: 'deliveries', icon: Package, value: 10000, suffix: '+' },
  { key: 'countries', icon: Globe, value: 10, suffix: '+' },
  { key: 'onTime', icon: Clock, value: 98.7, suffix: '%', decimals: 1 },
  { key: 'experience', icon: Award, value: 10, suffix: '' },
];

interface StatsSectionProps {
  locale: Locale;
  messages: Messages;
}

export function StatsSection({ messages }: StatsSectionProps) {
  const t = getTranslator(messages);

  return (
    <section className="bg-[#042C53] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.key} delay={index * 0.1} className="text-center">
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
              <p className="mt-2 text-white/70">{t(`stats.${stat.key}.label`)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
