'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Truck, Warehouse, Globe, Plane, Train, FileCheck,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';
import { PageHeader } from '@/components/shared/PageHeader';

const serviceDetails: Record<string, {
  icon: typeof Truck;
  features: string[];
  routes?: string[];
}> = {
  road: {
    icon: Truck,
    features: [
      'FTL va LTL yuk tashish',
      'Temperaturali nazorat',
      'GPS monitoring',
      'Sug\'urta xizmati',
      'Door-to-door yetkazish',
    ],
    routes: ['Rossiya', 'Qozog\'iston', 'Qirg\'iziston', 'Tojikiston', 'Turkmaniston'],
  },
  warehouse: {
    icon: Warehouse,
    features: [
      'Zamonaviy omborlar',
      'Inventar boshqaruvi',
      'Qadoqlash xizmatlari',
      '24/7 xavfsizlik',
      'Temperaturali saqlash',
    ],
  },
  international: {
    icon: Globe,
    features: [
      'Import/Export xizmatlari',
      'Multimodal tashish',
      'Konsolidatsiya',
      'Hujjatlashtirish',
      'Sug\'urta',
    ],
    routes: ['Xitoy', 'Eron', 'Afg\'oniston', 'Pokiston', 'MDH'],
  },
  air: {
    icon: Plane,
    features: [
      'Express yetkazish',
      'Charter reyslar',
      'Xavfli yuklar',
      'Haroratga sezgir yuklar',
      'Aeroportdan-aeroportga',
    ],
  },
  rail: {
    icon: Train,
    features: [
      'Konteyner tashish',
      'Vagon yuki',
      'Xitoy-MDH yo\'nalishi',
      'Raqamli kuzatish',
      'Intermodal xizmatlar',
    ],
    routes: ['Xitoy', 'Eron', 'Pokiston', 'Rossiya', 'MDH'],
  },
  customs: {
    icon: FileCheck,
    features: [
      'Bojxona hujjatlari',
      'Tarif klassifikatsiyasi',
      'Soliq maslahat',
      'Sertifikatlash',
      'Litsenziyalash',
    ],
  },
};

interface ServiceDetailContentProps {
  slug: string;
}

/**
 * Service detail content component
 */
export function ServiceDetailContent({ slug }: ServiceDetailContentProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const service = serviceDetails[slug];
  
  if (!service) return null;

  const Icon = service.icon;

  return (
    <>
      <PageHeader
        titleKey={`services.items.${slug}.title`}
        subtitleKey={`services.items.${slug}.description`}
      />
      
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left column - Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#042C53]">
                <Icon className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="mt-6 text-2xl font-bold text-foreground">
                {locale === 'uz' ? 'Xususiyatlar' : locale === 'ru' ? 'Особенности' : 'Features'}
              </h2>
              
              <ul className="mt-6 space-y-4">
                {service.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#185FA5]" />
                    <span className="text-muted-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              {service.routes && (
                <>
                  <h3 className="mt-10 text-xl font-semibold text-foreground">
                    {locale === 'uz' ? "Yo'nalishlar" : locale === 'ru' ? 'Направления' : 'Routes'}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {service.routes.map((route) => (
                      <span
                        key={route}
                        className="rounded-full bg-[#042C53]/10 px-4 py-2 text-sm font-medium text-[#042C53]"
                      >
                        {route}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Right column - CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col justify-center"
            >
              <div className="rounded-2xl border bg-card p-8">
                <h3 className="text-xl font-semibold text-foreground">
                  {locale === 'uz' 
                    ? 'Bepul maslahat oling' 
                    : locale === 'ru' 
                    ? 'Получите бесплатную консультацию' 
                    : 'Get a Free Quote'}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {locale === 'uz'
                    ? "Mutaxassislarimiz sizga eng yaxshi yechimni taklif qilishadi"
                    : locale === 'ru'
                    ? 'Наши специалисты предложат вам лучшее решение'
                    : 'Our specialists will offer you the best solution'}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="bg-[#042C53] hover:bg-[#185FA5]"
                  >
                    <Link href={`/${locale}/contact`}>
                      {t('common.requestQuote')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                  >
                    <a href="tel:+998712000000">
                      {t('contact.info.phone')}
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
