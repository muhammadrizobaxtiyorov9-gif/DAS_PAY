import { getMessages, isValidLocale, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import { HeroSection } from '@/components/sections/HeroSection';
import { TrackingSection } from '@/components/sections/TrackingSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { CtaSection } from '@/components/sections/CtaSection';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const messages = await getMessages(typedLocale);

  return (
    <>
      <HeroSection locale={typedLocale} messages={messages} />
      <TrackingSection />
      <ServicesSection locale={typedLocale} messages={messages} />
      <StatsSection locale={typedLocale} messages={messages} />
      <AboutSection locale={typedLocale} messages={messages} />
      <PartnersSection locale={typedLocale} messages={messages} />
      <TestimonialsSection locale={typedLocale} messages={messages} />
      <FaqSection locale={typedLocale} messages={messages} />
      <CtaSection locale={typedLocale} messages={messages} />
    </>
  );
}
