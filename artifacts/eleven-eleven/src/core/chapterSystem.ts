/**
 * chapterSystem.ts — نظام الفصول الجديد
 * يحل محل نظام الكيانات القديم
 *
 * البنية:
 * - كل Chapter يحتوي على مجموعات بيانات مستقلة
 * - عدد الألغاز في كل Chapter مرن ويُقرأ من البيانات
 * - الفصل التالي يفتح فقط بعد استيفاء شروط الفصل الحالي
 *
 * الأنواع المدعومة:
 * - Main Story Puzzles
 * - Side Puzzles
 * - Hidden Puzzles
 * - Secret Puzzles
 * - Rare Puzzles
 * - Time-based Puzzles
 * - Memory Puzzles
 * - Cipher Puzzles
 * - Logic Puzzles
 * - Investigation Puzzles
 * - Audio Puzzles
 * - Visual Puzzles
 * - Pattern Puzzles
 * - Psychological Puzzles
 * - Choice-based Puzzles
 * - Multi-step Puzzles
 */

export type ChapterId = 'chapter_1' | 'chapter_2' | 'chapter_3' | 'chapter_4' | 'chapter_5';

export type PuzzleCategory =
  | 'main_story'
  | 'side'
  | 'hidden'
  | 'secret'
  | 'rare'
  | 'time_based'
  | 'memory'
  | 'cipher'
  | 'logic'
  | 'investigation'
  | 'audio'
  | 'visual'
  | 'pattern'
  | 'psychological'
  | 'choice_based'
  | 'multi_step';

export interface ChapterDataset {
  id: ChapterId;
  title: string;
  description: string;
  glyph: string;
  color: string;
  order: number;
  puzzles: any[]; // PuzzleNode[] — فارغة حالياً
  memoryFragments: any[]; // MemoryShard[] — فارغة حالياً
  storyEvents: any[]; // StoryEvent[] — فارغة حالياً
  echoDialogues: any[]; // EchoDialogue[] — فارغة حالياً
  unlockConditions: any[]; // UnlockCondition[] — فارغة حالياً
  rewards: any[]; // ChapterReward[] — فارغة حالياً
  difficultyProgression: number[]; // فارغة حالياً
}

export interface ChapterState {
  id: ChapterId;
  title: string;
  description: string;
  glyph: string;
  color: string;
  unlocked: boolean;
  completed: boolean;
  puzzlesSolved: number;
  totalPuzzles: number;
  progress: number;
}

export interface UnlockCondition {
  type: 'puzzles_solved' | 'chapter_complete' | 'achievement' | 'memory_fragments' | 'time_played' | 'specific_puzzle';
  targetId?: string;
  requiredValue: number;
  currentValue?: number;
}

export interface ChapterReward {
  type: 'coins' | 'crystals' | 'shard' | 'achievement' | 'dialogue' | 'ability';
  amount?: number;
  id?: string;
  description?: string;
}

// ─── CHAPTER ORDER ───────────────────────────────────────────────────
export const CHAPTER_ORDER: ChapterId[] = ['chapter_1', 'chapter_2', 'chapter_3', 'chapter_4', 'chapter_5'];

// ─── CHAPTER DATASETS (فارغة حالياً، ستُملأ لاحقاً) ──────────────────
export const CHAPTER_DATASETS: Record<ChapterId, ChapterDataset> = {
  chapter_1: {
    id: 'chapter_1',
    title: 'الصحوة',
    description: 'البداية. Echo يستيقظ في عالم غريب.',
    glyph: '◈',
    color: '#c8785a',
    order: 1,
    puzzles: [],
    memoryFragments: [],
    storyEvents: [],
    echoDialogues: [],
    unlockConditions: [],
    rewards: [],
    difficultyProgression: [],
  },
  chapter_2: {
    id: 'chapter_2',
    title: 'الاكتشاف',
    description: 'اكتشاف الحقيقة تدريجياً.',
    glyph: '◉',
    color: '#FF9800',
    order: 2,
    puzzles: [],
    memoryFragments: [],
    storyEvents: [],
    echoDialogues: [],
    unlockConditions: [],
    rewards: [],
    difficultyProgression: [],
  },
  chapter_3: {
    id: 'chapter_3',
    title: 'الاتصال',
    description: 'التواصل مع الماضي.',
    glyph: '≋',
    color: '#5A8AAA',
    order: 3,
    puzzles: [],
    memoryFragments: [],
    storyEvents: [],
    echoDialogues: [],
    unlockConditions: [],
    rewards: [],
    difficultyProgression: [],
  },
  chapter_4: {
    id: 'chapter_4',
    title: 'الحقيقة',
    description: 'الحقيقة المخفية.',
    glyph: '▲',
    color: '#AA8B40',
    order: 4,
    puzzles: [],
    memoryFragments: [],
    storyEvents: [],
    echoDialogues: [],
    unlockConditions: [],
    rewards: [],
    difficultyProgression: [],
  },
  chapter_5: {
    id: 'chapter_5',
    title: 'الخاتمة',
    description: 'النهاية.',
    glyph: '◉',
    color: '#888',
    order: 5,
    puzzles: [],
    memoryFragments: [],
    storyEvents: [],
    echoDialogues: [],
    unlockConditions: [],
    rewards: [],
    difficultyProgression: [],
  },
};

// ─── CHAPTER HELPERS ─────────────────────────────────────────────────
export function isChapterUnlocked(chapterId: ChapterId, solvedPuzzles: number, completedChapters: ChapterId[]): boolean {
  const chapterIndex = CHAPTER_ORDER.indexOf(chapterId);
  if (chapterIndex === 0) return true;
  const prevChapter = CHAPTER_ORDER[chapterIndex - 1];
  return completedChapters.includes(prevChapter);
}

export function getNextChapter(currentChapter: ChapterId): ChapterId | null {
  const currentIndex = CHAPTER_ORDER.indexOf(currentChapter);
  if (currentIndex < CHAPTER_ORDER.length - 1) {
    return CHAPTER_ORDER[currentIndex + 1];
  }
  return null;
}

export function getChapterById(chapterId: ChapterId): ChapterDataset {
  return CHAPTER_DATASETS[chapterId];
}

export function getAllChapters(): ChapterDataset[] {
  return CHAPTER_ORDER.map(id => CHAPTER_DATASETS[id]);
}
