import type { Metadata } from 'next';
import { BlogPageContent } from '@/components/blog/BlogPageContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor } from '@/lib/seo/structured-data';
import { isValidLocale, type Locale } from '@/lib/i18n';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Blog',
    ru: 'Блог',
    en: 'Blog',
  };

  const descriptions: Record<string, string> = {
    uz: "Logistika sohasidagi yangiliklarni kuzatib boring.",
    ru: 'Следите за новостями в сфере логистики.',
    en: 'Stay updated with the latest logistics news.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Blog listing page
 */
export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const typedLocale: Locale = isValidLocale(locale) ? (locale as Locale) : 'uz';

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['blog'])} />
      <BlogPageContent />
    </>
  );
}
