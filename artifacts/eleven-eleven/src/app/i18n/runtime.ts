import type { NetworkLocale } from '../../domain/echo-network/contracts';

export const DEFAULT_LOCALE: NetworkLocale = 'ar';

export type LocaleDirection = 'rtl' | 'ltr';

const APP_COPY = {
  ar: {
    'app.title': '11.11 — رحلة الذاكرة',
    'screen.main-menu': 'القائمة الرئيسية',
    'screen.psychological-state': 'الحالة النفسية',
    'screen.play': 'غرفة البداية',
    'screen.dashboard': 'نظام Echo',
    'screen.cinematic': 'المشهد السينمائي',
    'screen.memories': 'المانهوا',
    'screen.awakening-ward': 'جناح الاستيقاظ',
    'screen.puzzles': 'مركز الألغاز',
    'screen.echo-mind': 'عقل Echo',
    'screen.dialogue': 'الحوار والقرارات',
    'screen.characters': 'ملفات الشخصيات',
    'screen.echo-network': 'شبكة Echo',
    'screen.leaderboard': 'الترتيب العالمي',
    'screen.profile': 'ملف اللاعب',
    'screen.progress': 'مجموعة الاستعادة',
    'screen.live-challenges': 'إشارات 11:11',
    'screen.settings': 'الإعدادات',
    'offline.archive-only': 'الأرشيف المحلي فقط',
    'offline.server-progress-required': 'يتطلب التقدم والجوائز الموثّقة اتصالًا بالخادم.',
  },
  en: {
    'app.title': '11.11 — Memory Journey',
    'screen.main-menu': 'Main Menu',
    'screen.psychological-state': 'Psychological State',
    'screen.play': 'Opening Room',
    'screen.dashboard': 'Echo System',
    'screen.cinematic': 'Cinematic Scene',
    'screen.memories': 'Manhwa Archive',
    'screen.awakening-ward': 'Awakening Ward',
    'screen.puzzles': 'Puzzle Hub',
    'screen.echo-mind': 'Echo Mind',
    'screen.dialogue': 'Dialogue & Decisions',
    'screen.characters': 'Character Files',
    'screen.echo-network': 'Echo Network',
    'screen.leaderboard': 'Global Ranking',
    'screen.profile': 'Player Profile',
    'screen.progress': 'Recovery Collection',
    'screen.live-challenges': '11:11 Signals',
    'screen.settings': 'Settings',
    'offline.archive-only': 'Local archive only',
    'offline.server-progress-required': 'Verified progress and rewards require a server connection.',
  },
} as const;

export type TranslationKey = keyof typeof APP_COPY.ar;

export function resolveLocale(value: unknown): NetworkLocale {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}

export function localeDirection(locale: NetworkLocale): LocaleDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function intlLocale(locale: NetworkLocale): string {
  return locale === 'ar' ? 'ar-JO' : 'en-US';
}

export function translate(
  locale: NetworkLocale,
  key: TranslationKey,
): string {
  return APP_COPY[locale][key] ?? APP_COPY[DEFAULT_LOCALE][key];
}

export function translateScreenTitle(
  locale: NetworkLocale,
  screenId: string,
): string {
  const key = `screen.${screenId}` as TranslationKey;
  return key in APP_COPY[locale]
    ? translate(locale, key)
    : translate(locale, 'app.title');
}

export function documentTitle(
  locale: NetworkLocale,
  screenId: string | null | undefined,
): string {
  const title = translate(locale, 'app.title');
  if (!screenId || screenId === 'main-menu') return title;
  const screenTitle = translateScreenTitle(locale, screenId);
  return screenTitle === title ? title : `${screenTitle} | ${title}`;
}

export function formatLocaleNumber(
  locale: NetworkLocale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}
