import type { Metadata } from 'next';
import { TermsPageContent } from '@/components/shared/LegalPageContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor } from '@/lib/seo/structured-data';
import { isValidLocale, type Locale } from '@/lib/i18n';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Foydalanish shartlari',
    ru: 'Условия использования',
    en: 'Terms of Use',
  };

  const descriptions: Record<string, string> = {
    uz: 'DasPay xizmatlaridan foydalanish shartlari va qoidalari',
    ru: 'Условия и правила использования услуг DasPay',
    en: 'Terms and conditions for using DasPay services',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Terms of Use page
 */
export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const typedLocale: Locale = isValidLocale(locale) ? (locale as Locale) : 'uz';

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['terms'])} />
      <TermsPageContent />
    </>
  );
}
