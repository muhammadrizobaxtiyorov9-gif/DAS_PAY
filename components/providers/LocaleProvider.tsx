'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';

type Messages = Record<string, unknown>;

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  locale: Locale;
  messages: Messages;
}

/**
 * Provider for internationalization context
 */
export function LocaleProvider({ children, locale, messages }: LocaleProviderProps) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: unknown = messages;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue)),
          value
        );
      }

      return value;
    },
    [messages]
  );

  return (
    <LocaleContext.Provider value={{ locale, messages, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to access locale context
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

/**
 * Hook to access translation function
 */
export function useTranslations() {
  const { t } = useLocale();
  return t;
}
