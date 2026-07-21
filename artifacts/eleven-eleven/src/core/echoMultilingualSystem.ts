const translations: Record<string, Record<string, string>> = {
  ar: {
    'app.title': '11.11 — رحلة الذاكرة',
  },
  en: {
    'app.title': '11.11 — Memory Journey',
  },
};

export function toggleLanguage(): void {
  const html = document.documentElement;
  const current = html.lang;
  const next = current === 'ar' ? 'en' : 'ar';
  html.lang = next;
  html.dir = next === 'ar' ? 'rtl' : 'ltr';
}

export function translate(key: string): string {
  const lang = document.documentElement.lang || 'ar';
  return translations[lang]?.[key] || key;
}
