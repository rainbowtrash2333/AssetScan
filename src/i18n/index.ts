import { ref } from 'vue';
import { defaultLocale, messages, type Locale } from './messages';

type Params = Record<string, string | number>;

const STORAGE_KEY = 'assetScan.locale';
const availableLocales: Locale[] = ['en', 'zh'];

const resolveInitialLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') {
    return stored;
  }
  return defaultLocale;
};

const currentLocale = ref<Locale>(resolveInitialLocale());

const saveLocale = (locale: Locale) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore storage errors
    }
  }
};

const applyParams = (value: string, params?: Params) => {
  if (!params) {
    return value;
  }
  return value.replace(/\{(\w+)\}/g, (_, token: string) => {
    const replacement = params[token];
    return replacement !== undefined ? String(replacement) : `{${token}}`;
  });
};

const resolveMessage = (locale: Locale, key: string): unknown => {
  const segments = key.split('.');
  let node: unknown = messages[locale];
  for (const segment of segments) {
    if (typeof node !== 'object' || node === null) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
};

const translate = (key: string, params?: Params) => {
  const primary = resolveMessage(currentLocale.value, key);
  const fallback = currentLocale.value === defaultLocale ? undefined : resolveMessage(defaultLocale, key);
  const message = typeof primary === 'string' ? primary : typeof fallback === 'string' ? fallback : null;
  if (!message) {
    return key;
  }
  return applyParams(message, params);
};

const setLocale = (locale: Locale) => {
  if (availableLocales.includes(locale)) {
    currentLocale.value = locale;
    saveLocale(locale);
  }
};

export const useI18n = () => {
  return {
    locale: currentLocale,
    availableLocales,
    setLocale,
    t: translate
  };
};

export type { Locale } from './messages';
