import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { PageHeader } from '@/components/shared/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor, buildService } from '@/lib/seo/structured-data';

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Xizmatlar',
    ru: 'Услуги',
    en: 'Services',
  };

  const descriptions: Record<string, string> = {
    uz: "Avtomobil tashish, ombor, xalqaro yuk, aviatransport, temir yo'l va bojxona xizmatlari.",
    ru: 'Автоперевозки, складские услуги, международные перевозки, авиа, ж/д и таможенные услуги.',
    en: 'Road transport, warehouse, international freight, air transport, rail and customs services.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

const SERVICE_OFFERS: Record<Locale, { name: string; description: string }[]> = {
  uz: [
    { name: 'Avtomobil tashish', description: "MDH bo'ylab avtomobil yuk tashish" },
    { name: 'Aviatashish', description: 'Tezkor xalqaro havo yuk tashish' },
    { name: "Temir yo'l tashish", description: 'Xitoy va Yevropaga temir yo\'l yuk tashish' },
    { name: 'Ombor xizmati', description: 'Yuklarni saqlash va qadoqlash' },
    { name: 'Bojxona rasmiylashtiruvi', description: 'To\'liq bojxona xizmatlari' },
    { name: 'Xalqaro yuk tashish', description: '9+ davlatga ishonchli yetkazib berish' },
  ],
  ru: [
    { name: 'Автоперевозки', description: 'Автомобильные перевозки по СНГ' },
    { name: 'Авиаперевозки', description: 'Быстрая международная авиадоставка' },
    { name: 'Ж/Д перевозки', description: 'Железнодорожные перевозки в Китай и Европу' },
    { name: 'Складские услуги', description: 'Хранение и упаковка грузов' },
    { name: 'Таможенное оформление', description: 'Полный комплекс таможенных услуг' },
    { name: 'Международные перевозки', description: 'Надёжная доставка в 9+ стран' },
  ],
  en: [
    { name: 'Road Transport', description: 'Road freight across CIS countries' },
    { name: 'Air Freight', description: 'Fast international air cargo' },
    { name: 'Rail Transport', description: 'Rail freight to China and Europe' },
    { name: 'Warehouse Services', description: 'Cargo storage and packaging' },
    { name: 'Customs Clearance', description: 'Full-service customs brokerage' },
    { name: 'International Freight', description: 'Reliable delivery to 9+ countries' },
  ],
};

const SERVICES_PAGE_META: Record<Locale, { name: string; description: string }> = {
  uz: {
    name: 'Logistika xizmatlari',
    description: "DasPay xalqaro logistika va yuk tashish xizmatlari — avtomobil, havo, temir yo'l, ombor va bojxona.",
  },
  ru: {
    name: 'Логистические услуги',
    description: 'Международная логистика и грузоперевозки DasPay — авто, авиа, ж/д, склад и таможня.',
  },
  en: {
    name: 'Logistics Services',
    description: 'DasPay international logistics and freight services — road, air, rail, warehouse and customs.',
  },
};

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const messages = await getMessages(typedLocale);
  const meta = SERVICES_PAGE_META[typedLocale];

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['services'])} />
      <JsonLd
        data={buildService({
          name: meta.name,
          description: meta.description,
          serviceType: 'Freight Forwarding',
          url: `/${typedLocale}/services`,
          offers: SERVICE_OFFERS[typedLocale],
        })}
      />
      <PageHeader titleKey="services.title" subtitleKey="services.subtitle" />
      <ServicesSection locale={typedLocale} messages={messages} />
      <CtaSection locale={typedLocale} messages={messages} />
    </>
  );
}
