import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import uz from '@/locales/uz.json';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';

export type Locale = 'uz' | 'ru' | 'en';

const defaultLocale: Locale = 'uz';

const resources: Record<Locale, any> = {
  uz,
  ru,
  en,
};

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, any> | string, fallback?: string) => string;
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

  const t = (key: string, params?: Record<string, any> | string, fallback = ''): string => {
    let actualParams: Record<string, any> = {};
    let actualFallback = fallback;

    if (typeof params === 'string') {
      actualFallback = params;
    } else if (typeof params === 'object' && params !== null) {
      actualParams = params;
    }

    const parts = key.split('.');
    let current: any = resources[locale];
    for (const p of parts) {
      if (!current) break;
      current = current[p];
    }

    let result = '';
    if (typeof current === 'string') {
      result = current;
    } else {
      // fallback to default locale
      const defaultParts = key.split('.');
      let curDefault: any = resources[defaultLocale];
      for (const p of defaultParts) {
        if (!curDefault) break;
        curDefault = curDefault[p];
      }
      if (typeof curDefault === 'string') {
        result = curDefault;
      } else {
        result = actualFallback || key;
      }
    }

    // Interpolation
    if (Object.keys(actualParams).length > 0) {
      Object.entries(actualParams).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return result;
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
