import { getTranslator, type Locale, type Messages } from '@/lib/i18n-translator';
import { Reveal } from '@/components/shared/motion-primitives';

const partners = [
  { name: 'DHL', color: '#D40511' },
  { name: 'FedEx', color: '#4D148C' },
  { name: 'Maersk', color: '#00243D' },
  { name: 'DB Schenker', color: '#FF0000' },
  { name: 'Kuehne+Nagel', color: '#003C69' },
  { name: 'COSCO', color: '#003366' },
  { name: 'Evergreen', color: '#008751' },
  { name: 'CMA CGM', color: '#00457C' },
] as const;

interface PartnersSectionProps {
  locale: Locale;
  messages: Messages;
}

export function PartnersSection({ messages }: PartnersSectionProps) {
  const t = getTranslator(messages);

  return (
    <section className="bg-secondary py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t('partners.title')}
          </h2>
          <p className="mt-2 text-muted-foreground">{t('partners.subtitle')}</p>
        </Reveal>

        <div className="relative mt-10 overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-secondary to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-secondary to-transparent" />

          <div className="flex animate-marquee items-center gap-12">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="flex h-16 min-w-[160px] items-center justify-center rounded-lg bg-card px-6 shadow-sm"
              >
                <span className="text-lg font-bold" style={{ color: partner.color }}>
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
