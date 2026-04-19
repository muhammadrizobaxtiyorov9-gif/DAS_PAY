import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, type Locale, getMessages, isValidLocale } from '@/lib/i18n';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { PublicShell } from '@/components/layout/PublicShell';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://das-pay.com';

const LOCALE_META: Record<Locale, { title: string; description: string; ogLocale: string }> = {
  uz: {
    title: "DasPay — Xalqaro Logistika va Yuk Tashish Xizmatlari",
    description:
      "O'zbekistondan MDH, Xitoy, Turkiya va Yevropa davlatlariga ishonchli, tezkor va xavfsiz yuk tashish xizmatlari.",
    ogLocale: 'uz_UZ',
  },
  ru: {
    title: 'DasPay — Международная логистика и грузоперевозки',
    description:
      'Надёжные и быстрые международные грузоперевозки из Узбекистана в СНГ, Китай, Турцию и Европу.',
    ogLocale: 'ru_RU',
  },
  en: {
    title: 'DasPay — International Logistics & Freight Services',
    description:
      'Reliable, fast and secure international freight services from Uzbekistan to CIS, China, Turkey and Europe.',
    ogLocale: 'en_US',
  },
};

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const meta = LOCALE_META[locale as Locale];

  const languages = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`])) as Record<
    string,
    string
  >;
  languages['x-default'] = `${SITE_URL}/uz`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      locale: meta.ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => LOCALE_META[l].ogLocale),
      url: `${SITE_URL}/${locale}`,
      siteName: 'DasPay',
      title: meta.title,
      description: meta.description,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: meta.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale as Locale);

  return (
    <LocaleProvider locale={locale as Locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <PublicShell>{children}</PublicShell>
      </div>
    </LocaleProvider>
  );
}
