'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { getTranslator, type Messages, type TranslateFn } from '@/lib/i18n-translator';

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  locale: Locale;
  messages: Messages;
}

export function LocaleProvider({ children, locale, messages }: LocaleProviderProps) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, messages, t: getTranslator(messages) }),
    [locale, messages]
  );

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

export function useTranslations() {
  return useLocale().t;
}
