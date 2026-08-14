import {
  DEFAULT_LOCALE,
  resolveLocale,
  translate as translateFromCatalog,
  type TranslationKey,
} from '../app/i18n/runtime';
import { useUiPreferencesStore } from '../app/shell/shellStore';

/** @deprecated Prefer useUiPreferencesStore().setLocale in React surfaces. */
export function toggleLanguage(): void {
  const current = useUiPreferencesStore.getState().locale;
  useUiPreferencesStore.getState().setLocale(current === 'ar' ? 'en' : 'ar');
}

/** @deprecated Prefer the locale-explicit app i18n runtime. */
export function translate(key: string): string {
  const locale = typeof document === 'undefined'
    ? DEFAULT_LOCALE
    : resolveLocale(document.documentElement.lang);
  return key === 'app.title'
    ? translateFromCatalog(locale, key as TranslationKey)
    : key;
}
