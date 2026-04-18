import type { Metadata } from 'next';
import { TermsPageContent } from '@/components/shared/LegalPageContent';

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
export default function TermsPage() {
  return <TermsPageContent />;
}
