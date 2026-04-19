import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlogDetailContent } from '@/components/blog/BlogDetailContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbsFor, buildArticle } from '@/lib/seo/structured-data';
import { isValidLocale, type Locale } from '@/lib/i18n';

const blogMeta: Record<string, { publishedAt: string; description: Record<string, string> }> = {
  'shipping-from-china-to-uzbekistan': {
    publishedAt: '2024-09-15',
    description: {
      uz: "Xitoydan O'zbekistonga yuk tashish bo'yicha to'liq qo'llanma: marshrutlar, muddatlar, narxlar va hujjatlar.",
      ru: 'Полное руководство по перевозке грузов из Китая в Узбекистан: маршруты, сроки, цены и документы.',
      en: 'Complete guide to shipping from China to Uzbekistan: routes, timelines, pricing and documentation.',
    },
  },
  'new-customs-regulations-2024': {
    publishedAt: '2024-06-20',
    description: {
      uz: "2024-yilgi yangi bojxona qoidalari va uning yuk tashishga ta'siri.",
      ru: 'Новые таможенные правила 2024 года и их влияние на грузоперевозки.',
      en: 'New 2024 customs regulations and their impact on freight shipping.',
    },
  },
  'multimodal-transport-guide': {
    publishedAt: '2024-03-10',
    description: {
      uz: "Multimodal yuk tashish qachon va nima uchun kerak — amaliy qo'llanma.",
      ru: 'Когда и зачем нужны мультимодальные перевозки — практическое руководство.',
      en: 'When and why to use multimodal transport — a practical guide.',
    },
  },
};

// In production, fetch from database
const blogSlugs = ['shipping-from-china-to-uzbekistan', 'new-customs-regulations-2024', 'multimodal-transport-guide'];

const blogTitles: Record<string, Record<string, string>> = {
  'shipping-from-china-to-uzbekistan': {
    uz: "Xitoydan O'zbekistonga yuk tashish: to'liq qo'llanma",
    ru: 'Перевозка грузов из Китая в Узбекистан: полное руководство',
    en: 'Shipping from China to Uzbekistan: Complete Guide',
  },
  'new-customs-regulations-2024': {
    uz: '2024-yil uchun yangi bojxona qoidalari',
    ru: 'Новые таможенные правила на 2024 год',
    en: 'New Customs Regulations for 2024',
  },
  'multimodal-transport-guide': {
    uz: 'Multimodal tashish: qachon va nima uchun kerak?',
    ru: 'Мультимодальные перевозки: когда и зачем?',
    en: 'Multimodal Transport: When and Why?',
  },
};

interface BlogDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return blogSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const titles = blogTitles[slug];
  
  if (!titles) {
    return { title: 'Blog' };
  }

  return {
    title: titles[locale] || titles.en,
  };
}

/**
 * Blog detail page
 */
export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;

  if (!blogSlugs.includes(slug) || !isValidLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const titles = blogTitles[slug];
  const meta = blogMeta[slug];
  const title = titles[typedLocale] || titles.en;
  const description = meta.description[typedLocale] || meta.description.en;

  return (
    <>
      <JsonLd data={breadcrumbsFor(typedLocale, ['blog', slug], title)} />
      <JsonLd
        data={buildArticle({
          title,
          description,
          image: '/og-image.jpg',
          url: `/${typedLocale}/blog/${slug}`,
          publishedAt: meta.publishedAt,
        })}
      />
      <BlogDetailContent slug={slug} />
    </>
  );
}
