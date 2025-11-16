import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import uz from '@/locales/uz.json';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';

export type Locale = 'uz' | 'ru' | 'en';

const defaultLocale: Locale = 'uz';

const resources: Record<Locale, Record<string, string>> = {
  uz,
  ru,
  en,
};

interface I18nContextValue {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Locale) || defaultLocale;
  });

  useEffect(() => {
    localStorage.setItem('language', locale);
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string, fallback = ''): string => {
    const parts = key.split('.');
    let current: any = resources[locale];
    for (const p of parts) {
      if (!current) break;
      current = current[p];
    }
    if (typeof current === 'string') return current;
    // fallback to default locale
    const defaultParts = key.split('.');
    let curDefault: any = resources[defaultLocale];
    for (const p of defaultParts) {
      if (!curDefault) break;
      curDefault = curDefault[p];
    }
    if (typeof curDefault === 'string') return curDefault;
    return fallback || key;
  };

  const value = useMemo(() => ({ locale, t, setLocale }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
};

// Convenience default export (not used) to keep previous import "./i18n" working if present
export default {};
