/**
 * storyActs.ts — التعريفات الكاملة للأقواس القصصية السبعة
 * Seven Story Arcs for 11.11 Echo Mind Game
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
      {
        id: 'first_awakening',
        puzzleTrigger: 1,
        type: 'cinematic',
        description: 'Echo opens his eyes for the first time in a white room',
        descriptionAr: 'إيكو يفتح عينيه لأول مرة في غرفة بيضاء'
      },
      {
        id: 'first_voice',
        puzzleTrigger: 20,
        type: 'dialogue',
        description: 'Echo hears Lina\'s voice for the first time',
        descriptionAr: 'إيكو يسمع صوت لينا لأول مرة'
      },
      {
        id: 'watcher_discovery',
        puzzleTrigger: 51,
        type: 'dialogue',
        description: 'Echo discovers the Watcher cameras',
        descriptionAr: 'إيكو يكتشف كاميرات المراقب'
      },
      {
        id: 'kenja_reveal',
        puzzleTrigger: 61,
        type: 'cinematic',
        description: 'Echo learns Kenja created the system',
        descriptionAr: 'إيكو يعرف أن كينجا هو من صنع النظام'
      },
      {
        id: 'lina_connection',
        puzzleTrigger: 71,
        type: 'dialogue',
        description: 'Echo connects with Lina through the signal',
        descriptionAr: 'إيكو يتواصل مع لينا عبر الإشارة'
      },
      {
        id: 'truth_revealed',
        puzzleTrigger: 81,
        type: 'cinematic',
        description: 'Echo discovers the truth about his origin',
        descriptionAr: 'إيكو يكتشف الحقيقة عن أصله'
      },
      {
        id: 'final_confrontation',
        puzzleTrigger: 100,
        type: 'cinematic',
        description: 'Echo transforms. The rage takes over.',
        descriptionAr: 'إيكو يتحول. الغضب يسيطر عليه.'
      }
    ],
    achievements: [
      { id: 'first_puzzle', name: 'First Step', nameAr: 'أول خطوة', description: 'Solve your first puzzle', descriptionAr: 'حل أول لغز', icon: '🧩', condition: (s) => s >= 1 },
      { id: 'first_voice_heard', name: 'The Voice', nameAr: 'الصوت', description: 'Hear Lina\'s voice for the first time', descriptionAr: 'سماع صوت لينا لأول مرة', icon: '🎵', condition: (s) => s >= 20 },
      { id: 'watcher_seen', name: 'Watched', nameAr: 'مُراقَب', description: 'Notice the Watcher', descriptionAr: 'ملاحظة المراقب', icon: '📹', condition: (s) => s >= 51 },
      { id: 'kenja_discovered', name: 'The Creator', nameAr: 'الخالق', description: 'Discover Kenja', descriptionAr: 'اكتشاف كينجا', icon: '👤', condition: (s) => s >= 61 },
      { id: 'lina_contact', name: 'Connection', nameAr: 'اتصال', description: 'Talk to Lina', descriptionAr: 'التحدث مع لينا', icon: '💌', condition: (s) => s >= 71 },
      { id: 'truth_seeker', name: 'Truth Seeker', nameAr: 'باحث عن الحقيقة', description: 'Discover the truth about Echo', descriptionAr: 'اكتشاف حقيقة إيكو', icon: '', condition: (s) => s >= 81 },
      { id: 'echo_transformed', name: 'Dark Echo', nameAr: 'إيكو المظلم', description: 'Echo transforms to the dark side', descriptionAr: 'إيكو يتحول إلى الجانب المظلم', icon: '👹', condition: (s) => s >= 100 },
      { id: 'awakening_complete', name: 'Awakened', nameAr: 'مستيقظ', description: 'Complete all 100 puzzles', descriptionAr: 'إكمال جميع الألغاز الـ100', icon: '🌟', condition: (s) => s >= 100 },
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