import { cache } from 'react';

export const locales = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'uz';

export const localeNames: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  uz: '🇺🇿',
  ru: '🇷🇺',
  en: '🇬🇧',
};

export const getMessages = cache(async (locale: Locale) => {
  const targetLocale = isValidLocale(locale) ? locale : defaultLocale;
  try {
    const messages = await import(`@/messages/${targetLocale}.json`);
    return messages.default;
  } catch {
    const messages = await import(`@/messages/${defaultLocale}.json`);
    return messages.default;
  }
});

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split('/', 2)[1];
  return segment && isValidLocale(segment) ? segment : defaultLocale;
}
