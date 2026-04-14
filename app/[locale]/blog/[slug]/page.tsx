import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlogDetailContent } from '@/components/blog/BlogDetailContent';

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
  const { slug } = await params;
  
  if (!blogSlugs.includes(slug)) {
    notFound();
  }

  return <BlogDetailContent slug={slug} />;
}
