import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n';
import { TrackingSection } from '@/components/sections/TrackingSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { PageHeader } from '@/components/shared/PageHeader';

interface TrackingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TrackingPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Yukni kuzatish',
    ru: 'Отслеживание груза',
    en: 'Track Shipment',
  };

  const descriptions: Record<string, string> = {
    uz: 'Yukingizni kuzatish raqami orqali real vaqtda kuzating.',
    ru: 'Отслеживайте ваш груз в реальном времени по номеру отслеживания.',
    en: 'Track your shipment in real-time using your tracking number.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const messages = await getMessages(typedLocale);

  return (
    <>
      <PageHeader titleKey="tracking.title" subtitleKey="tracking.subtitle" />
      <div className="-mt-10">
        <TrackingSection />
      </div>
      <FaqSection locale={typedLocale} messages={messages} />
    </>
  );
}
