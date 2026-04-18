import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { PageHeader } from '@/components/shared/PageHeader';

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

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const messages = await getMessages(typedLocale);

  return (
    <>
      <PageHeader titleKey="services.title" subtitleKey="services.subtitle" />
      <ServicesSection locale={typedLocale} messages={messages} />
      <CtaSection locale={typedLocale} messages={messages} />
    </>
  );
}
