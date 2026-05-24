// Single source of truth for the active UI language, stored in localStorage
// under the same `language` key the i18n provider uses. Lives outside React so
// non-component code (axios interceptor, fetch wrapper) can read it for the
// `Accept-Language` header on every request.

export type AppLanguage = 'uz' | 'ru' | 'en';

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE: AppLanguage = 'uz';

export function getLanguage(): AppLanguage {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'uz' || v === 'ru' || v === 'en') return v;
  } catch {
    // localStorage unavailable (SSR / privacy mode) — fall through to default
  }
  return DEFAULT_LANGUAGE;
}

export function setLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore write failures
  }
}
