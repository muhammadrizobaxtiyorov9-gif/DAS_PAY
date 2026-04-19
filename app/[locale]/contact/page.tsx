import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/contact/ContactPageContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor } from '@/lib/seo/structured-data';
import { isValidLocale, type Locale } from '@/lib/i18n';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: "Bog'lanish",
    ru: 'Контакты',
    en: 'Contact Us',
  };

  const descriptions: Record<string, string> = {
    uz: "DasPay bilan bog'laning. Telefon: +998 95 558 00 07, Email: info@das-pay.com",
    ru: 'Свяжитесь с DasPay. Телефон: +998 95 558 00 07, Email: info@das-pay.com',
    en: 'Contact DasPay. Phone: +998 95 558 00 07, Email: info@das-pay.com',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Contact page with form and info
 */
export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const typedLocale: Locale = isValidLocale(locale) ? (locale as Locale) : 'uz';

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['contact'])} />
      <ContactPageContent />
    </>
  );
}
