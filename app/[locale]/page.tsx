import { HeroSection } from '@/components/sections/HeroSection';
import { TrackingSection } from '@/components/sections/TrackingSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { CtaSection } from '@/components/sections/CtaSection';

/**
 * Homepage with all sections
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrackingSection />
      <ServicesSection />
      <StatsSection />
      <AboutSection />
      <PartnersSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
