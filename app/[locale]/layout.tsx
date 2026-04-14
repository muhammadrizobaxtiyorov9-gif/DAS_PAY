import { notFound } from 'next/navigation';
import { locales, type Locale, getMessages, isValidLocale } from '@/lib/i18n';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { PublicShell } from '@/components/layout/PublicShell';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
