import { getTranslator, type Locale, type Messages } from '@/lib/i18n-translator';
import { Reveal } from '@/components/shared/motion-primitives';
import { prisma } from '@/lib/prisma';

interface PartnersSectionProps {
  locale: Locale;
  messages: Messages;
}

export async function PartnersSection({ messages }: PartnersSectionProps) {
  const t = getTranslator(messages);

  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });

  if (partners.length === 0) return null;

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

          <div className="flex animate-marquee items-center gap-12 hover:[animation-play-state:paused]">
            {[...partners, ...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex h-16 min-w-[160px] items-center justify-center rounded-lg bg-card px-6 shadow-sm border border-gray-100/50"
              >
                {partner.logoUrl ? (
                  <img 
                    src={partner.logoUrl} 
                    alt={partner.name} 
                    className="max-h-12 max-w-[120px] object-contain" 
                  />
                ) : (
                  <span className="text-lg font-bold" style={{ color: partner.color || '#042C53' }}>
                    {partner.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
