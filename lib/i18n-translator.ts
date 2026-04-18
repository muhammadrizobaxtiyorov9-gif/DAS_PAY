import type { Locale } from './i18n';
export type { Locale };

export type Messages = Record<string, unknown>;
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function translate(
  messages: Messages,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: unknown = messages;

  for (let i = 0; i < keys.length; i++) {
    if (value && typeof value === 'object' && keys[i] in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[keys[i]];
    } else {
      return key;
    }
  }

  if (typeof value !== 'string') return key;

  if (!params) return value;

  let result = value;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
  }
  return result;
}

export function getTranslator(messages: Messages): TranslateFn {
  return (key, params) => translate(messages, key, params);
}
