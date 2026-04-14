import type { Metadata } from 'next';
import { AboutSection } from '@/components/sections/AboutSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { PageHeader } from '@/components/shared/PageHeader';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    uz: 'Biz haqimizda',
    ru: 'О нас',
    en: 'About Us',
  };

  const descriptions: Record<string, string> = {
    uz: "DasPay — O'zbekistonning yetakchi xalqaro logistika kompaniyasi. 2012-yildan buyon dunyo bo'ylab ishonchli yuk tashish xizmatlari.",
    ru: 'DasPay — ведущая международная логистическая компания Узбекистана с 2012 года.',
    en: "DasPay — Uzbekistan's leading international logistics company since 2012.",
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * About page
 */
export default function AboutPage() {
  return (
    <>
      <PageHeader
        titleKey="about.title"
        subtitleKey="about.subtitle"
      />
      <AboutSection />
      <StatsSection />
      <PartnersSection />
      <CtaSection />
    </>
  );
}
