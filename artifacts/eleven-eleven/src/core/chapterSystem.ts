/**
 * Compatibility facade for the legacy UI.
 *
 * Canonical chapter metadata is loaded and validated by contentRegistry.
 * New domain code should use domain/progression directly.
 */

import type {
  ChapterDefinition,
  ChapterId,
} from '../domain/content/contracts';
import {
  CHAPTER_DEFINITIONS,
} from '../infrastructure/content/contentRegistry';
import {
  getChapterForPuzzleNumber as findChapterForPuzzleNumber,
} from '../domain/progression/progression';

export type { ChapterId } from '../domain/content/contracts';

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
  puzzleRange: readonly [number, number];
  puzzles: unknown[];
  memoryFragments: unknown[];
  storyEvents: unknown[];
  echoDialogues: unknown[];
  unlockConditions: UnlockCondition[];
  rewards: ChapterReward[];
  difficultyProgression: number[];
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
  type:
    | 'puzzles_solved'
    | 'chapter_complete'
    | 'achievement'
    | 'memory_fragments'
    | 'time_played'
    | 'specific_puzzle';
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

function toDataset(definition: ChapterDefinition): ChapterDataset {
  return {
    id: definition.id,
    title: definition.title.ar,
    description: definition.description.ar,
    glyph: definition.glyph,
    color: definition.color,
    order: definition.order,
    puzzleRange: definition.puzzleRange,
    puzzles: [],
    memoryFragments: [],
    storyEvents: [],
    echoDialogues: [],
    unlockConditions: definition.order === 1
      ? []
      : [{
          type: 'chapter_complete',
          targetId: `chapter_${definition.order - 1}`,
          requiredValue: 1,
        }],
    rewards: [],
    difficultyProgression: [],
  };
}

export const CHAPTER_ORDER: ChapterId[] = CHAPTER_DEFINITIONS.map(
  (chapter) => chapter.id,
);

export const CHAPTER_DATASETS = Object.fromEntries(
  CHAPTER_DEFINITIONS.map((definition) => [
    definition.id,
    toDataset(definition),
  ]),
) as Record<ChapterId, ChapterDataset>;

export function isChapterUnlocked(
  chapterId: ChapterId,
  _solvedPuzzles: number,
  completedChapters: ChapterId[],
): boolean {
  const chapterIndex = CHAPTER_ORDER.indexOf(chapterId);
  if (chapterIndex === 0) return true;
  if (chapterIndex < 0) return false;
  return completedChapters.includes(CHAPTER_ORDER[chapterIndex - 1]);
}

export function getNextChapter(currentChapter: ChapterId): ChapterId | null {
  const currentIndex = CHAPTER_ORDER.indexOf(currentChapter);
  return currentIndex >= 0 && currentIndex < CHAPTER_ORDER.length - 1
    ? CHAPTER_ORDER[currentIndex + 1]
    : null;
}

export function getChapterById(chapterId: ChapterId): ChapterDataset {
  const chapter = CHAPTER_DATASETS[chapterId];
  if (!chapter) {
    throw new Error(`Unknown chapter: ${chapterId}`);
  }
  return chapter;
}

export function getAllChapters(): ChapterDataset[] {
  return CHAPTER_ORDER.map(getChapterById);
}

export function getChapterForPuzzleNumber(
  puzzleNumber: number,
): ChapterId | null {
  return findChapterForPuzzleNumber(puzzleNumber, CHAPTER_DEFINITIONS);
}
