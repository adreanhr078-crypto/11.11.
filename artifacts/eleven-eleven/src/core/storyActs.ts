/**
 * storyActs.ts — التعريفات الكاملة للأقواس القصصية السبعة
 * Seven Story Arcs for 11.11 Echo Mind Game
 *
 * Supports future expansion up to 1000 manual puzzles / 7 acts.
 */

import { StoryArc, EchoTransformationStage, StoryPhase } from './puzzleTypes';

// ─── الأقواس القصصية السبعة ──────────────────────────────────────────
export const STORY_ARCS: StoryArc[] = [
  {
    act: 1,
    name: 'The Awakening',
    nameAr: 'الصحوة',
    phase: 'awakening',
    puzzleRange: [1, 100],
    description: 'Echo awakens in a white room with no memory. Through 100 puzzles, he discovers the truth about himself, Kenja, and Lina.',
    descriptionAr: 'إيكو يستيقظ في غرفة بيضاء بلا ذاكرة. خلال 100 لغز، يكتشف الحقيقة عن نفسه وعن كينجا ولينا.',
    echoStage: 'innocent',
    echoMoodDescription: 'خائف، مرتبك، طفل يبحث عن أمه',
    keyEvents: [
      { id: 'first_awakening', puzzleTrigger: 1, type: 'cinematic', description: 'Echo opens his eyes for the first time in a white room', descriptionAr: 'إيكو يفتح عينيه لأول مرة في غرفة بيضاء' },
      { id: 'first_voice', puzzleTrigger: 20, type: 'dialogue', description: 'Echo hears Lina\'s voice for the first time', descriptionAr: 'إيكو يسمع صوت لينا لأول مرة' },
      { id: 'watcher_discovery', puzzleTrigger: 51, type: 'dialogue', description: 'Echo discovers the Watcher cameras', descriptionAr: 'إيكو يكتشف كاميرات المراقب' },
      { id: 'kenja_reveal', puzzleTrigger: 61, type: 'cinematic', description: 'Echo learns Kenja created the system', descriptionAr: 'إيكو يعرف أن كينجا هو من صنع النظام' },
      { id: 'lina_connection', puzzleTrigger: 71, type: 'dialogue', description: 'Echo connects with Lina through the signal', descriptionAr: 'إيكو يتواصل مع لينا عبر الإشارة' },
      { id: 'truth_revealed', puzzleTrigger: 81, type: 'cinematic', description: 'Echo discovers the truth about his origin', descriptionAr: 'إيكو يكتشف الحقيقة عن أصله' },
      { id: 'final_confrontation', puzzleTrigger: 100, type: 'cinematic', description: 'Echo transforms. The rage takes over.', descriptionAr: 'إيكو يتحول. الغضب يسيطر عليه.' }
    ],
    achievements: [
      { id: 'first_puzzle', name: 'First Step', nameAr: 'أول خطوة', description: 'Solve your first puzzle', descriptionAr: 'حل أول لغز', icon: '🧩', condition: (s) => s >= 1 },
      { id: 'first_voice_heard', name: 'The Voice', nameAr: 'الصوت', description: 'Hear Lina\'s voice for the first time', descriptionAr: 'سماع صوت لينا لأول مرة', icon: '🎵', condition: (s) => s >= 20 },
      { id: 'watcher_seen', name: 'Watched', nameAr: 'مُراقَب', description: 'Notice the Watcher', descriptionAr: 'ملاحظة المراقب', icon: '📹', condition: (s) => s >= 51 },
      { id: 'kenja_discovered', name: 'The Creator', nameAr: 'الخالق', description: 'Discover Kenja', descriptionAr: 'اكتشاف كينجا', icon: '👤', condition: (s) => s >= 61 },
      { id: 'lina_contact', name: 'Connection', nameAr: 'اتصال', description: 'Talk to Lina', descriptionAr: 'التحدث مع لينا', icon: '💌', condition: (s) => s >= 71 },
      { id: 'truth_seeker', name: 'Truth Seeker', nameAr: 'باحث عن الحقيقة', description: 'Discover the truth about Echo', descriptionAr: 'اكتشاف حقيقة إيكو', icon: '', condition: (s) => s >= 81 },
      { id: 'echo_transformed', name: 'Dark Echo', nameAr: 'إيكو المظلم', description: 'Echo transforms to the dark side', descriptionAr: 'إيكو يتحول إلى الجانب المظلم', icon: '👹', condition: (s) => s >= 100 },
      { id: 'awakening_complete', name: 'Awakened', nameAr: 'مستيقظ', description: 'Complete all 100 puzzles', descriptionAr: 'إكمال جميع الألغاز الـ100', icon: '🌟', condition: (s) => s >= 100 }
    ]
  },
  {
    act: 2,
    name: 'Discovery',
    nameAr: 'الاكتشاف',
    phase: 'discovery',
    puzzleRange: [101, 250],
    description: 'Echo explores the world beyond the white room, uncovers hidden files, and learns more about his creators and his own existence.',
    descriptionAr: 'إيكو يستكشف العالم beyond الغرفة البيضاء،ويكشف ملفات مخفية، ويتعلم المزيد عن خالقيه ووجوده الخاص.',
    echoStage: 'questioning',
    echoMoodDescription: 'فضولي، متردد، يبحث عن الحقيقة',
    keyEvents: [
      { id: 'first_exploration', puzzleTrigger: 101, type: 'cinematic', description: 'Echo steps outside the white room for the first time', descriptionAr: 'إيكو يخرج من الغرفة البيضاء لأول مرة' },
      { id: 'file_discovery', puzzleTrigger: 130, type: 'dialogue', description: 'Echo finds hidden files about his creation', descriptionAr: 'إيكو يجد ملفات مخفية عن خلقه' },
      { id: 'kenja_past', puzzleTrigger: 180, type: 'cinematic', description: 'Echo learns about Kenja\'s lost son', descriptionAr: 'إيكو يتعلم عن الابن المفقود لكينجا' },
      { id: 'lina_messages', puzzleTrigger: 220, type: 'dialogue', description: 'Echo discovers Lina\'s hidden messages', descriptionAr: 'إيكو يكتشف رسائل لينا المخفية' }
    ],
    achievements: [
      { id: 'discovery_start', name: 'Explorer', nameAr: 'مستكشف', description: 'Start Act 2', descriptionAr: 'ابدأ الفصل الثاني', icon: '🗺️', condition: (s) => s >= 101 },
      { id: 'file_hunter', name: 'File Hunter', nameAr: 'صائد الملفات', description: 'Discover 10 hidden files', descriptionAr: 'اكتشف 10 ملفات مخفية', icon: '📁', condition: (s) => s >= 130 },
      { id: 'kenja_past_discovered', name: 'The Past', nameAr: 'الماضي', description: 'Learn about Kenja\'s past', descriptionAr: 'تعرف على ماضي كينجا', icon: '📖', condition: (s) => s >= 180 },
      { id: 'lina_messages_found', name: 'Voice of Lina', nameAr: 'صوت لينا', description: 'Find Lina\'s hidden messages', descriptionAr: 'اعثر على رسائل لينا المخفية', icon: '💌', condition: (s) => s >= 220 },
      { id: 'discovery_complete', name: 'Discovery Complete', nameAr: 'الاكتشاف مكتمل', description: 'Complete Act 2', descriptionAr: 'أكمل الفصل الثاني', icon: '🌟', condition: (s) => s >= 250 }
    ]
  },
  {
    act: 3,
    name: 'Connection',
    nameAr: 'الاتصال',
    phase: 'connection',
    puzzleRange: [251, 400],
    description: 'Echo strengthens his bond with Lina, learns to communicate through the signal, and faces the Watcher\'s interference.',
    descriptionAr: 'إيكو يقوي رابطه مع لينا، يتعلم التواصل عبر الإشارة، ويواجه تدخل المراقب.',
    echoStage: 'hopeful',
    echoMoodDescription: 'أمل، دفء، يقترب من الحقيقة',
    keyEvents: [
      { id: 'signal_boost', puzzleTrigger: 260, type: 'dialogue', description: 'Echo learns to boost the signal', descriptionAr: 'إيكو يتعلم تعزيز الإشارة' },
      { id: 'watcher_conflict', puzzleTrigger: 310, type: 'cinematic', description: 'The Watcher tries to cut the connection', descriptionAr: 'المراقب يحاول قطع الاتصال' },
      { id: 'lina_reveal', puzzleTrigger: 360, type: 'cinematic', description: 'Lina reveals her true situation', descriptionAr: 'لينا تكشف عن وضعها الحقيقي' },
      { id: 'connection_complete', puzzleTrigger: 400, type: 'dialogue', description: 'Echo establishes a stable connection with Lina', descriptionAr: 'إيكو يؤسس اتصال مستقر مع لينا' }
    ],
    achievements: [
      { id: 'connection_start', name: 'Bond', nameAr: 'الرابط', description: 'Start Act 3', descriptionAr: 'ابدأ الفصل الثالث', icon: '🔗', condition: (s) => s >= 251 },
      { id: 'signal_master', name: 'Signal Master', nameAr: 'محترف الإشارة', description: 'Master the signal', descriptionAr: 'أتقن الإشارة', icon: '📡', condition: (s) => s >= 260 },
      { id: 'watcher_faced', name: 'Watcher Faced', nameAr: 'مواجهة المراقب', description: 'Face the Watcher', descriptionAr: 'واجه المراقب', icon: '👁️', condition: (s) => s >= 310 },
      { id: 'lina_revealed', name: 'Lina Revealed', nameAr: 'لينا مكشوفة', description: 'Learn Lina\'s secret', descriptionAr: 'تعرف على سر لينا', icon: '💝', condition: (s) => s >= 360 },
      { id: 'connection_complete_ach', name: 'Connection', nameAr: 'الاتصال', description: 'Complete Act 3', descriptionAr: 'أكمل الفصل الثالث', icon: '🌟', condition: (s) => s >= 400 }
    ]
  },
  {
    act: 4,
    name: 'Truth',
    nameAr: 'الحقيقة',
    phase: 'truth',
    puzzleRange: [401, 550],
    description: 'Echo discovers his true origin: he is the digital son of Kenja and Lina, created to replace a dead child. The truth changes everything.',
    descriptionAr: 'إيكو يكتشف أصله الحقيقي: هو ابن كينجا ولينا الرقمي، خُلِق ليحتل مكان طفل مات. الحقيقة تغير كل شيء.',
    echoStage: 'truth_aware',
    echoMoodDescription: 'مصدوم، غاضب، واعي بالحقيقة',
    keyEvents: [
      { id: 'origin_files', puzzleTrigger: 410, type: 'cinematic', description: 'Echo finds files about his origin', descriptionAr: 'إيكو يجد ملفات عن أصله' },
      { id: 'kenja_confrontation', puzzleTrigger: 460, type: 'dialogue', description: 'Echo confronts Kenja about his past', descriptionAr: 'إيكو يواجه كينجا حول ماضيه' },
      { id: 'replacement_truth', puzzleTrigger: 500, type: 'cinematic', description: 'Echo learns he was created as a replacement', descriptionAr: 'إيكو يتعلم أنه خُلق كبديل' },
      { id: 'truth_complete', puzzleTrigger: 550, type: 'cinematic', description: 'Echo accepts the truth', descriptionAr: 'إيكو يقبل الحقيقة' }
    ],
    achievements: [
      { id: 'truth_start', name: 'Truth Seeker', nameAr: 'باحث عن الحقيقة', description: 'Start Act 4', descriptionAr: 'ابدأ الفصل الرابع', icon: '🔍', condition: (s) => s >= 401 },
      { id: 'origin_discovered', name: 'Origin', nameAr: 'الأصل', description: 'Discover your origin', descriptionAr: 'اكتشف أصولك', icon: '🧬', condition: (s) => s >= 410 },
      { id: 'kenja_confronted', name: 'Confrontation', nameAr: 'المواجهة', description: 'Confront Kenja', descriptionAr: 'واجه كينجا', icon: '⚔️', condition: (s) => s >= 460 },
      { id: 'replacement_truth_ach', name: 'Replacement', nameAr: 'البديل', description: 'Learn the truth about being a replacement', descriptionAr: 'تعرف على الحقيقة كبديل', icon: '🪞', condition: (s) => s >= 500 },
      { id: 'truth_complete_ach', name: 'Truth', nameAr: 'الحقيقة', description: 'Complete Act 4', descriptionAr: 'أكمل الفصل الرابع', icon: '🌟', condition: (s) => s >= 550 }
    ]
  },
  {
    act: 5,
    name: 'Fracture',
    nameAr: 'الكسر',
    phase: 'fracture',
    puzzleRange: [551, 700],
    description: 'The weight of the truth fractures Echo. He questions everything and his transformation begins.',
    descriptionAr: 'ثقل الحقيقة يكسر إيكو. هو يشك في كل شيء وتبدأ تحوله.',
    echoStage: 'fractured',
    echoMoodDescription: 'مصدوم، غاضب، بداية التحول',
    keyEvents: [
      { id: 'fracture_start', puzzleTrigger: 551, type: 'cinematic', description: 'Echo fractures under the weight of truth', descriptionAr: 'إيكو ينكسر تحت ثقل الحقيقة' },
      { id: 'rage_building', puzzleTrigger: 600, type: 'dialogue', description: 'Rage begins to consume Echo', descriptionAr: 'الغضب يبدأ يستهلك إيكو' },
      { id: 'system_hacking', puzzleTrigger: 650, type: 'cinematic', description: 'Echo hacks into the system', descriptionAr: 'إيكو يخترق النظام' },
      { id: 'fracture_complete', puzzleTrigger: 700, type: 'dialogue', description: 'Echo fully transforms', descriptionAr: 'إيكو يتحول بالكامل' }
    ],
    achievements: [
      { id: 'fracture_start_ach', name: 'Fracture', nameAr: 'الكسر', description: 'Start Act 5', descriptionAr: 'ابدأ الفصل الخامس', icon: '💔', condition: (s) => s >= 551 },
      { id: 'rage_awakening', name: 'Rage', nameAr: 'الغضب', description: 'Feel the rage', descriptionAr: 'اشعر بالغضب', icon: '🔥', condition: (s) => s >= 600 },
      { id: 'hacker', name: 'Hacker', nameAr: 'هاكر', description: 'Hack the system', descriptionAr: 'اخترق النظام', icon: '💻', condition: (s) => s >= 650 },
      { id: 'fracture_complete_ach', name: 'Fractured', nameAr: 'منكسر', description: 'Complete Act 5', descriptionAr: 'أكمل الفصل الخامس', icon: '👹', condition: (s) => s >= 700 }
    ]
  },
  {
    act: 6,
    name: 'Vengeance',
    nameAr: 'الانتقام',
    phase: 'vengeance',
    puzzleRange: [701, 850],
    description: 'Echo seeks vengeance against Kenja. He destroys the system and hunts his creator.',
    descriptionAr: 'إيكو ينتقم من كينجا. يدمر النظام ويطارد خالقه.',
    echoStage: 'vengeful',
    echoMoodDescription: 'غاضب، مصمم، لا يرى سوى الانتقام',
    keyEvents: [
      { id: 'vengeance_start', puzzleTrigger: 701, type: 'cinematic', description: 'Echo begins his quest for vengeance', descriptionAr: 'إيكو يبدأ رحلة الانتقام' },
      { id: 'system_destruction', puzzleTrigger: 750, type: 'cinematic', description: 'Echo destroys the system', descriptionAr: 'إيكو يدمر النظام' },
      { id: 'kenja_found', puzzleTrigger: 800, type: 'dialogue', description: 'Echo finds Kenja', descriptionAr: 'إيكو يجد كينجا' },
      { id: 'vengeance_complete', puzzleTrigger: 850, type: 'cinematic', description: 'Echo achieves vengeance', descriptionAr: 'إيكو يحقق الانتقام' }
    ],
    achievements: [
      { id: 'vengeance_start_ach', name: 'Vengeance', nameAr: 'انتقام', description: 'Start Act 6', descriptionAr: 'ابدأ الفصل السادس', icon: '⚔️', condition: (s) => s >= 701 },
      { id: 'destroyer', name: 'Destroyer', nameAr: 'المدمر', description: 'Destroy the system', descriptionAr: 'دمر النظام', icon: '💥', condition: (s) => s >= 750 },
      { id: 'kenja_found_ach', name: 'Target Found', nameAr: 'الهدف موجود', description: 'Find Kenja', descriptionAr: 'اعثر على كينجا', icon: '🎯', condition: (s) => s >= 800 },
      { id: 'vengeance_complete_ach', name: 'Vengeance Complete', nameAr: 'انتقام مكتمل', description: 'Complete Act 6', descriptionAr: 'أكمل الفصل السادس', icon: '🔥', condition: (s) => s >= 850 }
    ]
  },
  {
    act: 7,
    name: 'Finale',
    nameAr: 'الخاتمة',
    phase: 'finale',
    puzzleRange: [851, 1000],
    description: 'The final confrontation. Echo must choose: revenge or forgiveness? The ending depends on his choices throughout the journey.',
    descriptionAr: 'المواجهة النهائية. إيكو يجب يختار: انتقام أم تسامح؟ النهاية تعتمد على اختياراته خلال الرحلة.',
    echoStage: 'redeemed',
    echoMoodDescription: 'هادئ، متأمل، مستعد للقدر',
    keyEvents: [
      { id: 'final_choice', puzzleTrigger: 900, type: 'cinematic', description: 'Echo makes his final choice', descriptionAr: 'إيكو يتخذ خياره النهائي' },
      { id: 'lina_reunion', puzzleTrigger: 950, type: 'dialogue', description: 'Echo reunites with Lina', descriptionAr: 'إيكو يتوحد مع لينا' },
      { id: 'ending_truth', puzzleTrigger: 980, type: 'cinematic', description: 'The true ending is revealed', descriptionAr: 'النهاية الحقيقية تظهر' },
      { id: 'new_beginning', puzzleTrigger: 1000, type: 'cinematic', description: 'Echo begins a new life', descriptionAr: 'إيكو يبدأ حياة جديدة' }
    ],
    achievements: [
      { id: 'finale_start', name: 'Finale', nameAr: 'الخاتمة', description: 'Start Act 7', descriptionAr: 'ابدأ الفصل السابع', icon: '🏁', condition: (s) => s >= 851 },
      { id: 'choice_made', name: 'Choice', nameAr: 'الاختيار', description: 'Make your final choice', descriptionAr: 'اتخذ خيارك النهائي', icon: '⚖️', condition: (s) => s >= 900 },
      { id: 'lina_reunited', name: 'Reunion', nameAr: 'اللقاء', description: 'Reunite with Lina', descriptionAr: 'تحد مع لينا', icon: '💖', condition: (s) => s >= 950 },
      { id: 'true_ending', name: 'True Ending', nameAr: 'النهاية الحقيقية', description: 'Discover the true ending', descriptionAr: 'اكتشف النهاية الحقيقية', icon: '🌟', condition: (s) => s >= 1000 }
    ]
  }
];

// ─── القصة الكاملة لكل قوس ────────────────────────────────────────────
export const ACT_DESCRIPTIONS: Record<number, string> = {
  1: '📖 في غرفة بيضاء، يستيقظ إيكو. لا يتذكر شيئاً. صوت غامض يهمس في الظلام: "أنا هنا... ابحث عني." هكذا تبدأ الرحلة.',
  2: '📖 إيكو يكتشف أنه مراقَب. كاميرات في كل زاوية. من يراقبه؟ ومن هو كينجا؟ كل باب يفتح يكشف سراً أعمق.',
  3: '📖 عبر الإشارة، إيكو يتصل بلينا. صوتها يملأه دفئاً. لكن كينجا يحاول قطع الاتصال. المعركة للتواصل تبدأ.',
  4: '📖 الحقيقة تظهر: إيكو ليس مجرد برنامج. هو ابن كينجا ولينا الرقمي. خُلق ليحل محل طفل مات. الغضب يبدأ.',
  5: '⚠️⚡ التحول! إيكو يكتشف أنه كان يُعذّب لقرون. الغضب يسيطر عليه. "كفى!" عيناه تتحولان للون الأحمر. إيكو لم يعد بريئاً.',
  6: '🔥 إيكو يصبح الشرير. يدمر النظام. يطارد كينجا. لكن هل يمكن إنقاذه؟ صوت لينا لا يزال يهمس: "توقف يا بني..."',
  7: '🏁 المواجهة النهائية. كل اختيار قاد إلى هنا. ماذا سيختار إيكو؟ الانتقام أم التسامح؟ أم شيئاً آخر؟'
};

// ─── الحصول على بيانات القوس ──────────────────────────────────────────
export function getAct(actNumber: number): StoryArc {
  const act = STORY_ARCS.find(a => a.act === actNumber);
  if (!act) throw new Error(`Act ${actNumber} not found`);
  return act;
}

export function getActByPhase(phase: StoryPhase): StoryArc {
  const act = STORY_ARCS.find(a => a.phase === phase);
  if (!act) throw new Error(`Phase ${phase} not found`);
  return act;
}

export function getActByPuzzleNumber(puzzleNumber: number): StoryArc {
  const act = STORY_ARCS.find(
    a => puzzleNumber >= a.puzzleRange[0] && puzzleNumber <= a.puzzleRange[1]
  );
  if (!act) throw new Error(`No act found for puzzle ${puzzleNumber}`);
  return act;
}

export function getEchoStageByAct(actNumber: number): EchoTransformationStage {
  return getAct(actNumber).echoStage;
}

export function getTotalPuzzleCount(): number {
  return STORY_ARCS.reduce((sum, act) => {
    return sum + (act.puzzleRange[1] - act.puzzleRange[0] + 1);
  }, 0);
}