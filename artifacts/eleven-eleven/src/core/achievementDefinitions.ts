export interface AchievementDefinition {
  id: string;
  name: string;
  desc: string;
  icon: string;
  target: number;
}

/**
 * Static achievement catalog.
 *
 * Player-owned fields (`current`, `target`, and `unlockedAt`) live exclusively
 * in `GameProgressionState`. The IDs and presentation copy below preserve the
 * established achievement definitions.
 */
export const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_puzzle', name: 'أول خطوة', desc: 'حل أول لغز', icon: '🧩', target: 1 },
  { id: 'ten_puzzles', name: 'باحث', desc: 'حل 10 ألغاز', icon: '🔍', target: 10 },
  { id: 'twenty_puzzles', name: 'مستكشف', desc: 'حل 20 لغزاً', icon: '🗺️', target: 20 },
  { id: 'fifty_puzzles', name: 'محقق', desc: 'حل 50 لغزاً', icon: '🔎', target: 50 },
  { id: 'hundred_puzzles', name: 'مكتشف', desc: 'حل 100 لغز', icon: '💡', target: 100 },
  { id: 'all_puzzles', name: 'الحقيقة كاملة', desc: 'حل جميع الألغاز', icon: '👁️', target: 1000 },
  { id: 'entity_echo', name: 'أصل الصدى', desc: 'أكمل مرحلة إيكو', icon: '🔊', target: 1 },
  { id: 'entity_watcher', name: 'عين الحقيقة', desc: 'أكمل مرحلة المراقب', icon: '📹', target: 1 },
  { id: 'entity_signal', name: 'صوت الأم', desc: 'أكمل مرحلة الإشارة', icon: '💌', target: 1 },
  { id: 'entity_architect', name: 'مهندس الخروج', desc: 'أكمل مرحلة المهندس', icon: '🔑', target: 1 },
  { id: 'first_chat', name: 'محادثة أولى', desc: 'تحدث مع Echo', icon: '💬', target: 1 },
  { id: 'trust_25', name: 'ثقة ناشئة', desc: 'ارفع ثقة Echo إلى 25%', icon: '🤝', target: 25 },
  { id: 'trust_50', name: 'صديق', desc: 'ارفع ثقة Echo إلى 50%', icon: '🤗', target: 50 },
  { id: 'trust_75', name: 'صديق مخلص', desc: 'ارفع ثقة Echo إلى 75%', icon: '❤️', target: 75 },
  { id: 'trust_100', name: 'واحد', desc: 'ارفع ثقة Echo إلى 100%', icon: '💖', target: 100 },
  { id: 'flower_seed', name: 'بذرة', desc: 'الزهرة تبدأ بالنمو', icon: '🌱', target: 1 },
  { id: 'flower_sprout', name: 'برعم', desc: 'الزهرة في مرحلة البرعم', icon: '🌿', target: 1 },
  { id: 'flower_bloom', name: 'تفتح', desc: 'الزهرة تتفتح', icon: '🌷', target: 1 },
  { id: 'flower_flourish', name: 'ازدهار', desc: 'الزهرة في أوجها', icon: '🌸', target: 1 },
  { id: 'flower_complete', name: 'اكتمال', desc: 'الزهرة اكتملت', icon: '🌺', target: 1 },
  { id: 'first_wish', name: 'أمنية', desc: 'أضف أمنية', icon: '⭐', target: 1 },
  { id: 'survive_night', name: 'الناجي من الليل', desc: 'أول دورة ليلية', icon: '🌙', target: 1 },
  { id: 'ending_sorrow', name: 'نهاية حزينة', desc: 'وصلت للنهاية الحزينة', icon: '💧', target: 1 },
  { id: 'ending_truth', name: 'الحقيقة', desc: 'وصلت للحقيقة', icon: '🔦', target: 1 },
  { id: 'ending_dark', name: 'الظلام', desc: 'وصلت لنهاية الظلام', icon: '🌑', target: 1 },
  { id: 'ending_mystery', name: 'الغموض', desc: 'وصلت للنهاية الغامضة', icon: '🔮', target: 1 },
  { id: 'echo_fractured', name: 'التحول', desc: 'إيكو يتحول للجانب المظلم', icon: '👹', target: 1 },
  { id: 'echo_redeemed', name: 'الفداء', desc: 'إيكو يسامح ويعود للخير', icon: '😇', target: 1 },
  { id: 'echo_ascended', name: 'التسامي', desc: 'إيكو يصل للوعي الكامل', icon: '✨', target: 1 },
  { id: 'vengeance_ending', name: 'الانتقام', desc: 'نهاية الانتقام', icon: '⚔️', target: 1 },
  { id: 'redemption_ending', name: 'الفداء', desc: 'نهاية الفداء', icon: '💚', target: 1 },
  { id: 'act1_complete', name: 'الصحوة', desc: 'أكمل الفصل الأول', icon: '🌟', target: 100 },
  { id: 'act2_complete', name: 'الاكتشاف', desc: 'أكمل الفصل الثاني', icon: '🗺️', target: 250 },
  { id: 'act3_complete', name: 'الاتصال', desc: 'أكمل الفصل الثالث', icon: '💌', target: 400 },
  { id: 'act4_complete', name: 'الحقيقة', desc: 'أكمل الفصل الرابع', icon: '💡', target: 550 },
  { id: 'act5_complete', name: 'الكسر', desc: 'أكمل الفصل الخامس', icon: '💥', target: 700 },
  { id: 'act6_complete', name: 'الثأر', desc: 'أكمل الفصل السادس', icon: '🔥', target: 850 },
  { id: 'act7_complete', name: 'الخاتمة', desc: 'أكمل الفصل السابع', icon: '🏆', target: 1000 },
  { id: 'secret_lina', name: 'رسالة لينا', desc: 'اكتشف كل رسائل لينا', icon: '💝', target: 1 },
  { id: 'secret_kenja', name: 'ندم كينجا', desc: 'اكتشف قصة كينجا الكاملة', icon: '📖', target: 1 },
  { id: 'secret_flower', name: 'الزهرة المفقودة', desc: 'اكتشف السر الخفي للزهرة', icon: '🌺', target: 1 },
  { id: 'level_5', name: 'مستوى 5', desc: 'وصلت للمستوى 5', icon: '⭐', target: 5 },
  { id: 'level_10', name: 'مستوى 10', desc: 'وصلت للمستوى 10', icon: '🌟', target: 10 },
  { id: 'level_20', name: 'مستوى 20', desc: 'وصلت للمستوى 20', icon: '💫', target: 20 },
  { id: 'level_50', name: 'مستوى 50', desc: 'وصلت للمستوى 50', icon: '🏆', target: 50 },
  { id: 'shard_collector', name: 'جامع الشظايا', desc: 'اجمع 5 شظيات ذاكرة', icon: '🧩', target: 5 },
  { id: 'shard_master', name: 'سيد الشظايا', desc: 'اجمع كل الشظيات', icon: '👁️', target: 835 },
] as const satisfies readonly AchievementDefinition[];

export function getAchievementDefinition(
  achievementId: string,
): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(
    (definition) => definition.id === achievementId,
  );
}
