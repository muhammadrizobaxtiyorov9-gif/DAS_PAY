import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ServiceDetailContent } from '@/components/services/ServiceDetailContent';
import { CtaSection } from '@/components/sections/CtaSection';

const validSlugs = ['road', 'warehouse', 'international', 'air', 'rail', 'customs'];

interface ServicePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

/**
 * Locale-aware metadata for each service detail page
 */
export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  const titles: Record<string, Record<string, string>> = {
    road: { uz: 'Avtomobil tashish', ru: 'Автоперевозки', en: 'Road Transport' },
    warehouse: { uz: 'Ombor xizmati', ru: 'Складские услуги', en: 'Warehouse Services' },
    international: { uz: 'Xalqaro yuk tashish', ru: 'Международные перевозки', en: 'International Freight' },
    air: { uz: 'Avia transport', ru: 'Авиаперевозки', en: 'Air Transport' },
    rail: { uz: "Temir yo'l tashish", ru: 'Ж/Д перевозки', en: 'Rail Transport' },
    customs: { uz: 'Bojxona rasmiylashtiruvi', ru: 'Таможенное оформление', en: 'Customs Clearance' },
  };

  const slugTitles = titles[slug];
  if (!slugTitles) {
    return { title: 'Service' };
  }

  return {
    title: slugTitles[locale] || slugTitles.en,
  };
}

/**
 * Individual service detail page
 */
export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  
  if (!validSlugs.includes(slug)) {
    notFound();
  }

  return (
    <>
      <ServiceDetailContent slug={slug} />
      <CtaSection />
    </>
  );
}
