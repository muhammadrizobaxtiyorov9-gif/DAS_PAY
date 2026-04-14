import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/contact/ContactPageContent';

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
    uz: "DasPay bilan bog'laning. Telefon: +998 71 200 00 00, Email: info@daspay.uz",
    ru: 'Свяжитесь с DasPay. Телефон: +998 71 200 00 00, Email: info@daspay.uz',
    en: 'Contact DasPay. Phone: +998 71 200 00 00, Email: info@daspay.uz',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

/**
 * Contact page with form and info
 */
export default function ContactPage() {
  return <ContactPageContent />;
}
