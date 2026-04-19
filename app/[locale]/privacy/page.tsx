import type { Metadata } from 'next';
import { PrivacyPageContent } from '@/components/shared/LegalPageContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor } from '@/lib/seo/structured-data';
import { isValidLocale, type Locale } from '@/lib/i18n';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Maxfiylik siyosati',
    ru: 'Политика конфиденциальности',
    en: 'Privacy Policy',
  };

  const descriptions: Record<string, string> = {
    uz: 'DasPay maxfiylik siyosati — shaxsiy ma\'lumotlaringiz himoyasi',
    ru: 'Политика конфиденциальности DasPay — защита ваших персональных данных',
    en: 'DasPay Privacy Policy — protection of your personal data',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Privacy Policy page
 */
export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const typedLocale: Locale = isValidLocale(locale) ? (locale as Locale) : 'uz';

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['privacy'])} />
      <PrivacyPageContent />
    </>
  );
}
