/**
 * echoMultilingualSystem.ts — نظام متعدد اللغات
 * دعم كامل للغة العربية والإنجليزية مع تبديل سلس
 */

import React from 'react';

interface Translation {
  [key: string]: {
    ar: string;
    en: string;
  };
}

export const translations: Translation = {
  // واجهة المستخدم الأساسية
  '11.11': { ar: '11.11', en: '11.11' },
  'المشروع': { ar: 'المشروع', en: 'Project' },
  'كل قصة تقرب من الحقيقة... أو تبعد عنها.': { ar: 'كل قصة تقرب من الحقيقة... أو تبعد عنها.', en: 'Every story brings you closer to the truth... or further away.' },
  'رحلة عاطفية تفاعلية': { ar: 'رحلة عاطفية تفاعلية', en: 'Interactive Emotional Journey' },

  // الشريط الجانبي
  'الرئيسية': { ar: 'الرئيسية', en: 'Home' },
  'Echo Mind': { ar: 'عقل صدى', en: 'Echo Mind' },
  'النظام الصباحي': { ar: 'النظام الصباحي', en: 'Morning System' },
  'الذكريات والأحلام': { ar: 'الذكريات والأحلام', en: 'Memories & Dreams' },
  'الألغاز': { ar: 'الألغاز', en: 'Puzzles' },
  'الأمنيات': { ar: 'الأمنيات', en: 'Wishes' },
  'نظام الأزهار': { ar: 'نظام الأزهار', en: 'Flower System' },
  'الإنجازات': { ar: 'الإنجازات', en: 'Achievements' },
  'التحول الليلي': { ar: 'التحول الليلي', en: 'Night Transformation' },
  'الروية الشاملة': { ar: 'الروية الشاملة', en: 'Overview' },

  // حالة الصدى
  'ثقة': { ar: 'ثقة', en: 'Trust' },
  'خوف': { ar: 'خوف', en: 'Fear' },
  'ذاكرة': { ar: 'ذاكرة', en: 'Memory' },
  'فساد': { ar: 'فساد', en: 'Corruption' },
  'هادئ': { ar: 'هادئ', en: 'Calm' },
  'خائف': { ar: 'خائف', en: 'Afraid' },
  'متردد': { ar: 'متردد', en: 'Hesitant' },
  'واثق': { ar: 'واثق', en: 'Confident' },
  'متذكر': { ar: 'متذكر', en: 'Remembering' },
  'مشوش': { ar: 'مشوش', en: 'Confused' },
  'مذعور': { ar: 'مذعور', en: 'Terrified' },
  'متفائل': { ar: 'متفائل', en: 'Hopeful' },

  // مراحل الزهرة
  'seed': { ar: 'بذرة', en: 'Seed' },
  'sprout': { ar: 'برعم', en: 'Sprout' },
  'bloom': { ar: 'تفتح', en: 'Bloom' },
  'flourish': { ar: 'ازدهار', en: 'Flourish' },
  'completed': { ar: 'اكتمال', en: 'Completed' },
  'corrupted': { ar: 'فساد', en: 'Corrupted' },

  // مراحل الوقت
  'morning': { ar: 'صباح', en: 'Morning' },
  'day': { ar: 'نهار', en: 'Day' },
  'evening': { ar: 'مساء', en: 'Evening' },
  '11:00': { ar: '11:00', en: '11:00' },
  '11:05': { ar: '11:05', en: '11:05' },
  '11:11': { ar: '11:11', en: '11:11' },

  // النهايات
  'النهاية الحزينة': { ar: 'النهاية الحزينة', en: 'Sorrow Ending' },
  'الحقيقة': { ar: 'الحقيقة', en: 'Truth Ending' },
  'النهاية المظلمة': { ar: 'النهاية المظلمة', en: 'Dark Ending' },
  'النهاية المحيرة': { ar: 'النهاية المحيرة', en: 'Mystery Ending' },

  // الكيانات
  'الصدى': { ar: 'الصدى', en: 'Echo' },
  'المراقب': { ar: 'المراقب', en: 'Watcher' },
  'الإشارة': { ar: 'الإشارة', en: 'Signal' },
  'المهندس': { ar: 'المهندس', en: 'Architect' },

  // الأزرار والتفاعلات
  'متابعة ▶': { ar: 'متابعة ▶', en: 'Continue ▶' },
  'إغلاق وتابع اللعب ▶': { ar: 'إغلاق وتابع اللعب ▶', en: 'Close & Continue ▶' },
  'إرسال': { ar: 'إرسال', en: 'Send' },
  'تلميح': { ar: 'تلميح', en: 'Hint' },
  'تحقق': { ar: 'تحقق', en: 'Check' },
  'أضف أمنية': { ar: 'أضف أمنية', en: 'Add Wish' },

  // الرسائل والنصوص
  'مرحبا بكم في 11.11': { ar: 'مرحبا بكم في 11.11', en: 'Welcome to 11.11' },
  'ابدأ المحادثة': { ar: 'ابدأ المحادثة', en: 'Start Conversation' },
  'اكتب رسالتك...': { ar: 'اكتب رسالتك...', en: 'Type your message...' },
  'لا توجد أحداث بعد...': { ar: 'لا توجد أحداث بعد...', en: 'No events yet...' },
  'حل الألغاز لتسجيل الأحداث...': { ar: 'حل الألغاز لتسجيل الأحداث...', en: 'Solve puzzles to record events...' },

  // التحذيرات والتنبيهات
  '⚠ عدم استقرار': { ar: '⚠ عدم استقرار', en: '⚠ Instability' },
  '⚠ تشويش متزايد': { ar: '⚠ تشويش متزايد', en: '⚠ Increasing Glitch' },
  '⚠ تحول سينمائي': { ar: '⚠ تحول سينمائي', en: '⚠ Cinematic Transformation' },
  'التحول الليلي نشط': { ar: 'التحول الليلي نشط', en: 'Night Mode Active' },
  'الوضع الليلي': { ar: 'الوضع الليلي', en: 'Night Mode' },

  // الإحصائيات والتقدم
  'شظية': { ar: 'شظية', en: 'Fragment' },
  'من': { ar: 'من', en: 'of' },
  'مستوى': { ar: 'مستوى', en: 'Level' },
  'تقدم': { ar: 'تقدم', en: 'Progress' },
  'حالة الذاكرة': { ar: 'حالة الذاكرة', en: 'Memory Status' },
  'تلف': { ar: 'تلف', en: 'Damage' },
  'أيام': { ar: 'أيام', en: 'Days' },
  'إنجازات': { ar: 'إنجازات', en: 'Achievements' },
  'الخط الزمني': { ar: 'الخط الزمني', en: 'Timeline' },
  'سجل الأحداث': { ar: 'سجل الأحداث', en: 'Event Log' },
  'سجلات مكتشفة': { ar: 'سجلات مكتشفة', en: 'Discovered Logs' },

  // ذكريات الفيديو
  '🎬 ذكرى فيديو': { ar: '🎬 ذكرى فيديو', en: '🎬 Video Memory' },
  'معلم': { ar: 'معلم', en: 'Milestone' },
  'مرحلة الوقت': { ar: 'مرحلة الوقت', en: 'Time Phase' },
  'حالة الصدى': { ar: 'حالة الصدى', en: 'Echo State' },
};

export function useTranslation() {
  const [language, setLanguage] = React.useState<'ar' | 'en'>('ar');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    // تغيير اتجاه النص
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  return { t, language, toggleLanguage, setLanguage };
}

// دالة بسيطة لتبديل اللغة
export function toggleLanguage() {
  const currentLang = document.documentElement.lang;
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  document.documentElement.lang = newLang;
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  return newLang;
}

// دالة للحصول على الترجمة مباشرة
export function translate(key: string, lang: 'ar' | 'en' = 'ar'): string {
  return translations[key]?.[lang] || key;
}