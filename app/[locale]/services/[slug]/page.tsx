import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ServiceDetailContent } from '@/components/services/ServiceDetailContent';
import { CtaSection } from '@/components/sections/CtaSection';
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor, buildService } from '@/lib/seo/structured-data';

const validSlugs = ['road', 'warehouse', 'international', 'air', 'rail', 'customs'];

const SERVICE_DETAIL: Record<string, Record<Locale, { name: string; description: string; serviceType: string }>> = {
  road: {
    uz: { name: 'Avtomobil tashish', description: "MDH va Yevropa bo'ylab avtomobil yuk tashish xizmati.", serviceType: 'Road Freight' },
    ru: { name: 'Автоперевозки', description: 'Автомобильные грузоперевозки по СНГ и Европе.', serviceType: 'Road Freight' },
    en: { name: 'Road Transport', description: 'Road freight across CIS and Europe.', serviceType: 'Road Freight' },
  },
  warehouse: {
    uz: { name: 'Ombor xizmati', description: 'Yuklarni saqlash, qadoqlash va konsolidatsiya qilish.', serviceType: 'Warehousing' },
    ru: { name: 'Складские услуги', description: 'Хранение, упаковка и консолидация грузов.', serviceType: 'Warehousing' },
    en: { name: 'Warehouse Services', description: 'Cargo storage, packaging and consolidation.', serviceType: 'Warehousing' },
  },
  international: {
    uz: { name: 'Xalqaro yuk tashish', description: 'Xitoy, Turkiya, Yevropa va MDH yo\'nalishlari.', serviceType: 'International Freight' },
    ru: { name: 'Международные перевозки', description: 'Направления: Китай, Турция, Европа и СНГ.', serviceType: 'International Freight' },
    en: { name: 'International Freight', description: 'Routes to China, Turkey, Europe and CIS.', serviceType: 'International Freight' },
  },
  air: {
    uz: { name: 'Avia transport', description: 'Tezkor havo yuk tashish xalqaro yo\'nalishlarda.', serviceType: 'Air Freight' },
    ru: { name: 'Авиаперевозки', description: 'Быстрая авиадоставка по международным направлениям.', serviceType: 'Air Freight' },
    en: { name: 'Air Transport', description: 'Fast air cargo across international routes.', serviceType: 'Air Freight' },
  },
  rail: {
    uz: { name: "Temir yo'l tashish", description: 'Xitoy va Yevropaga temir yo\'l orqali yuk tashish.', serviceType: 'Rail Freight' },
    ru: { name: 'Ж/Д перевозки', description: 'Железнодорожные перевозки в Китай и Европу.', serviceType: 'Rail Freight' },
    en: { name: 'Rail Transport', description: 'Rail freight to China and Europe.', serviceType: 'Rail Freight' },
  },
  customs: {
    uz: { name: 'Bojxona rasmiylashtiruvi', description: 'To\'liq bojxona brokerlik xizmatlari.', serviceType: 'Customs Brokerage' },
    ru: { name: 'Таможенное оформление', description: 'Полный комплекс таможенных брокерских услуг.', serviceType: 'Customs Brokerage' },
    en: { name: 'Customs Clearance', description: 'Full-service customs brokerage.', serviceType: 'Customs Brokerage' },
  },
};

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
  const { locale, slug } = await params;

  if (!validSlugs.includes(slug) || !isValidLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const messages = await getMessages(typedLocale);
  const detail = SERVICE_DETAIL[slug]?.[typedLocale];

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['services', slug], detail?.name)} />
      {detail && (
        <JsonLd
          data={buildService({
            name: detail.name,
            description: detail.description,
            serviceType: detail.serviceType,
            url: `/${typedLocale}/services/${slug}`,
          })}
        />
      )}
      <ServiceDetailContent slug={slug} />
      <CtaSection locale={typedLocale} messages={messages} />
    </>
  );
}
