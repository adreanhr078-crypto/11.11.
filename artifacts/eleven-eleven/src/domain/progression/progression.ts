import type {
  ChapterDefinition,
  ChapterId,
  PuzzleId,
} from '../content/contracts';

export type PuzzleOutcome = 'solved' | 'skipped';

export interface ProgressionState {
  contentVersion: string;
  currentChapterId: ChapterId;
  completedPuzzleIds: PuzzleId[];
  skippedPuzzleIds: PuzzleId[];
  unlockedChapterIds: ChapterId[];
  completedChapterIds: ChapterId[];
}

export interface ChapterProgress {
  id: ChapterId;
  unlocked: boolean;
  completed: boolean;
  resolvedPuzzles: number;
  totalPuzzles: number;
  progress: number;
}

export function createInitialProgression(
  contentVersion: string,
  chapters: readonly ChapterDefinition[],
): ProgressionState {
  const firstChapter = chapters[0];
  if (!firstChapter) {
    throw new Error('Progression requires at least one chapter definition');
  }

  return {
    contentVersion,
    currentChapterId: firstChapter.id,
    completedPuzzleIds: [],
    skippedPuzzleIds: [],
    unlockedChapterIds: [firstChapter.id],
    completedChapterIds: [],
  };
}

export function getPuzzleNumber(puzzleId: string): number | null {
  const match = /^puzzle_(\d+)(?:_|$)/.exec(puzzleId);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function getChapterForPuzzleNumber(
  puzzleNumber: number,
  chapters: readonly ChapterDefinition[],
): ChapterId | null {
  return chapters.find(({ puzzleRange }) => (
    puzzleNumber >= puzzleRange[0] && puzzleNumber <= puzzleRange[1]
  ))?.id ?? null;
}

export function getChapterForPuzzleId(
  puzzleId: string,
  chapters: readonly ChapterDefinition[],
): ChapterId | null {
  const puzzleNumber = getPuzzleNumber(puzzleId);
  return puzzleNumber === null
    ? null
    : getChapterForPuzzleNumber(puzzleNumber, chapters);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function recordPuzzleOutcome(
  state: ProgressionState,
  puzzleId: PuzzleId,
  chapterId: ChapterId,
  outcome: PuzzleOutcome,
  chapters: readonly ChapterDefinition[],
): ProgressionState {
  const completedPuzzleIds = outcome === 'solved'
    ? unique([...state.completedPuzzleIds, puzzleId])
    : state.completedPuzzleIds.filter((id) => id !== puzzleId);
  const skippedPuzzleIds = outcome === 'skipped'
    ? unique([...state.skippedPuzzleIds, puzzleId])
    : state.skippedPuzzleIds.filter((id) => id !== puzzleId);
  const resolvedIds = new Set([...completedPuzzleIds, ...skippedPuzzleIds]);
  const chapterDefinition = chapters.find((chapter) => chapter.id === chapterId);
  const requiredPuzzleCount = chapterDefinition
    ? chapterDefinition.puzzleRange[1] - chapterDefinition.puzzleRange[0] + 1
    : 0;
  const resolvedInChapter = [...resolvedIds].reduce(
    (count, id) => (
      getChapterForPuzzleId(id, chapters) === chapterId ? count + 1 : count
    ),
    0,
  );
  const chapterCompleted = (
    requiredPuzzleCount > 0
    && resolvedInChapter >= requiredPuzzleCount
  );

  const completedChapterIds = chapterCompleted
    ? unique([...state.completedChapterIds, chapterId])
    : state.completedChapterIds.filter((id) => id !== chapterId);
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const nextChapter = chapterCompleted ? chapters[chapterIndex + 1] : undefined;
  const unlockedChapterIds = nextChapter
    ? unique([...state.unlockedChapterIds, nextChapter.id])
    : state.unlockedChapterIds;

  return {
    ...state,
    currentChapterId: nextChapter?.id ?? state.currentChapterId,
    completedPuzzleIds,
    skippedPuzzleIds,
    unlockedChapterIds,
    completedChapterIds,
  };
}

export function deriveChapterProgress(
  state: ProgressionState,
  chapterId: ChapterId,
  totalPuzzles: number,
  chapters: readonly ChapterDefinition[],
): ChapterProgress {
  const resolvedIds = new Set([
    ...state.completedPuzzleIds,
    ...state.skippedPuzzleIds,
  ]);
  const resolvedPuzzles = [...resolvedIds].reduce(
    (count, puzzleId) => (
      getChapterForPuzzleId(puzzleId, chapters) === chapterId
        ? count + 1
        : count
    ),
    0,
  );
  const progress = totalPuzzles > 0
    ? Math.round((resolvedPuzzles / totalPuzzles) * 100)
    : 0;

  return {
    id: chapterId,
    unlocked: state.unlockedChapterIds.includes(chapterId),
    completed: state.completedChapterIds.includes(chapterId),
    resolvedPuzzles,
    totalPuzzles,
    progress,
  };
}

export function migrateLegacyProgression(
  contentVersion: string,
  chapters: readonly ChapterDefinition[],
  legacy: {
    currentChapter?: string;
    puzzles?: Array<{ id?: string; status?: string }>;
  },
): ProgressionState {
  const base = createInitialProgression(contentVersion, chapters);
  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const currentChapterId = (
    legacy.currentChapter
    && chapterIds.has(legacy.currentChapter as ChapterId)
  )
    ? legacy.currentChapter as ChapterId
    : base.currentChapterId;
  const completedPuzzleIds: PuzzleId[] = [];
  const skippedPuzzleIds: PuzzleId[] = [];

  for (const puzzle of legacy.puzzles ?? []) {
    if (!puzzle.id || !/^puzzle_\d+(?:_.+)?$/.test(puzzle.id)) continue;
    if (puzzle.status === 'solved') completedPuzzleIds.push(puzzle.id as PuzzleId);
    if (puzzle.status === 'skipped') skippedPuzzleIds.push(puzzle.id as PuzzleId);
  }

  const currentIndex = Math.max(
    0,
    chapters.findIndex((chapter) => chapter.id === currentChapterId),
  );

  return {
    ...base,
    currentChapterId,
    completedPuzzleIds: unique(completedPuzzleIds),
    skippedPuzzleIds: unique(skippedPuzzleIds),
    unlockedChapterIds: chapters.slice(0, currentIndex + 1).map((chapter) => chapter.id),
  };
}
