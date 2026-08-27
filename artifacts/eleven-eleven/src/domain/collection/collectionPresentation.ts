import type { CollectionAchievementView } from './collectionContracts';

type SupportedLocale = 'ar' | 'en';

interface LocalizedAchievementCopy {
  name: Record<SupportedLocale, string>;
  description: Record<SupportedLocale, string>;
}

export interface LocalizedAchievementPresentation {
  name: string;
  description: string;
}

/**
 * Presentation text stays separate from authoritative achievement definitions.
 * The server still owns IDs, unlock state, reward cosmetics, and progression;
 * this map only prevents Arabic player surfaces from showing English-only
 * achievement names after a verified receipt arrives.
 */
export const COLLECTION_ACHIEVEMENT_PRESENTATION: Readonly<Record<string, LocalizedAchievementCopy>> = Object.freeze({
  story_chapter_01_complete: { name: { ar: 'الإشارة الأولى', en: 'FIRST SIGNAL' }, description: { ar: 'أكمل الفصل الأول.', en: 'Complete Chapter 1.' } },
  story_chapter_02_complete: { name: { ar: 'القناة الثانية', en: 'SECOND CHANNEL' }, description: { ar: 'أكمل الفصل الثاني.', en: 'Complete Chapter 2.' } },
  story_chapter_03_complete: { name: { ar: 'السجل الأعمق', en: 'DEEPER RECORD' }, description: { ar: 'أكمل الفصل الثالث.', en: 'Complete Chapter 3.' } },
  story_chapter_04_complete: { name: { ar: 'التيار الأخير', en: 'FINAL CURRENT' }, description: { ar: 'أكمل الفصل الرابع.', en: 'Complete Chapter 4.' } },
  story_protocol_complete: { name: { ar: 'اكتمال بروتوكول القصة', en: 'STORY PROTOCOL COMPLETE' }, description: { ar: 'أكمل بروتوكول القصة الحالي.', en: 'Complete the current story protocol.' } },
  puzzle_first_verified: { name: { ar: 'أول تحقق', en: 'FIRST VERIFICATION' }, description: { ar: 'حل لغز قصة موثقًا واحدًا.', en: 'Solve one verified Story Puzzle.' } },
  puzzle_main_protocol: { name: { ar: 'البروتوكول الرئيسي', en: 'MAIN PROTOCOL' }, description: { ar: 'حل الألغاز الرئيسية الأربعة عشر.', en: 'Solve all 14 Main Puzzles.' } },
  puzzle_perfect_first: { name: { ar: 'إشارة نقية', en: 'CLEAN SIGNAL' }, description: { ar: 'أكمل لغزًا واحدًا دون استعمال تلميح.', en: 'Complete one Puzzle without using a hint.' } },
  puzzle_perfect_five: { name: { ar: 'يد متحكمة', en: 'CONTROLLED HAND' }, description: { ar: 'أكمل خمسة ألغاز دون استعمال تلميحات.', en: 'Complete five Puzzles without using hints.' } },
  puzzle_perfect_main: { name: { ar: 'بروتوكول غير مكسور', en: 'UNBROKEN PROTOCOL' }, description: { ar: 'أكمل الألغاز الرئيسية الأربعة عشر دون تلميحات.', en: 'Perfect-solve all 14 Main Puzzles.' } },
  memory_first_shard: { name: { ar: 'أول استعادة', en: 'FIRST RECOVERY' }, description: { ar: 'استعد شظية ذاكرة موثقة واحدة.', en: 'Recover one verified Memory Shard.' } },
  memory_ten_shards: { name: { ar: 'إشارة نصف العمر', en: 'HALF-LIFE SIGNAL' }, description: { ar: 'استعد عشر شظايا ذاكرة.', en: 'Recover 10 Memory Shards.' } },
  memory_all_shards: { name: { ar: 'استعادة كل شظايا القصة', en: 'ALL STORY SHARDS RECOVERED' }, description: { ar: 'استعد شظايا القصة العشرين كلها.', en: 'Recover all 20 Memory Shards.' } },
  memory_chapter_set: { name: { ar: 'إشارة ذاكرة الفصل', en: 'CHAPTER MEMORY SIGNAL' }, description: { ar: 'أكمل مجموعة شظايا ذاكرة فصل واحد.', en: 'Complete one Chapter Memory Shard Set.' } },
  memory_reconstruction: { name: { ar: 'نافذة إعادة البناء', en: 'RECONSTRUCTION WINDOW' }, description: { ar: 'أكمل إعادة بناء ذاكرة اختيارية واحدة.', en: 'Complete one optional Memory Reconstruction.' } },
  exploration_first_secret_signal: { name: { ar: 'إشارة مجهولة', en: 'UNKNOWN SIGNAL' }, description: { ar: 'اكتشف أول إشارة سرية موثقة.', en: 'Discover your first verified Secret Signal.' } },
  exploration_three_secret_signals: { name: { ar: 'نمط داخل التشويش', en: 'PATTERN IN THE NOISE' }, description: { ar: 'اكتشف ثلاث إشارات سرية موثقة.', en: 'Discover three verified Secret Signals.' } },
  exploration_all_secret_signals: { name: { ar: 'الإشارة السادسة', en: 'SIXTH SIGNAL' }, description: { ar: 'اكتشف الإشارات السرية الست كلها.', en: 'Discover all six Secret Signals.' } },
  character_first_moment: { name: { ar: 'سجل مرتبط', en: 'ATTACHED RECORD' }, description: { ar: 'افتح لحظة شخصية معتمدة.', en: 'Unlock an approved Character Moment.' } },
  character_lina_protocol: { name: { ar: 'بروتوكول لينا', en: 'LINA PROTOCOL' }, description: { ar: 'وصل إلى ملف لينا الجزئي الموثق.', en: 'Reach the verified partial Lina file.' } },
  classified_black_coronation: { name: { ar: 'التتويج الأسود', en: 'BLACK CORONATION' }, description: { ar: 'وصل إلى الإشارة الموثقة في القانون السردي.', en: 'Reach the verified Canon signal.' } },
  classified_black_echo_protocol: { name: { ar: 'بروتوكول Echo الأسود', en: 'BLACK ECHO PROTOCOL' }, description: { ar: 'وصل إلى الإشارة الموثقة في القانون السردي.', en: 'Reach the verified Canon signal.' } },
  mastery_no_hint_five: { name: { ar: 'يد بلا ضوضاء', en: 'NOISELESS HAND' }, description: { ar: 'أكمل عشرة ألغاز موثقة دون تلميحات.', en: 'Complete ten verified Puzzles without hints.' } },
  system_recovery_75: { name: { ar: 'عتبة الاستعادة', en: 'RECOVERY THRESHOLD' }, description: { ar: 'صل إلى 75% من استعادة النظام.', en: 'Reach 75% SYSTEM RECOVERY.' } },
  system_recovery_100: { name: { ar: 'اكتمال استعادة النظام', en: 'SYSTEM RECOVERY COMPLETE' }, description: { ar: 'استعد 100% من المجموعة الموثقة الحالية.', en: 'Recover 100% of the current verified collection.' } },
});

export function localizeCollectionAchievement(
  achievement: Pick<CollectionAchievementView, 'id' | 'name' | 'description'>,
  locale: SupportedLocale,
): LocalizedAchievementPresentation {
  const copy = COLLECTION_ACHIEVEMENT_PRESENTATION[achievement.id];
  return copy
    ? { name: copy.name[locale], description: copy.description[locale] }
    : { name: achievement.name, description: achievement.description };
}
