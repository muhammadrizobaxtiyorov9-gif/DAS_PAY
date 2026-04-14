import type { Metadata } from 'next';
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
    uz: "Yukingizni kuzatish raqami orqali real vaqtda kuzating.",
    ru: 'Отслеживайте ваш груз в реальном времени по номеру отслеживания.',
    en: 'Track your shipment in real-time using your tracking number.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Tracking page
 */
export default function TrackingPage() {
  return (
    <>
      <PageHeader
        titleKey="tracking.title"
        subtitleKey="tracking.subtitle"
      />
      <div className="-mt-10">
        <TrackingSection />
      </div>
      <FaqSection />
    </>
  );
}
