/**
 * Pure narrative compatibility facade.
 *
 * Progression owns chapter advancement. This facade only derives narrative
 * presentation state and never imports Zustand, React, DOM, or persistence.
 */

import type { ChapterId } from '../domain/content/contracts';
import type { ProgressionState } from '../domain/progression/progression';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../infrastructure/content/contentRegistry';
import { createInitialProgression } from '../domain/progression/progression';

export type StoryAct =
  | 'awakening'
  | 'discovery'
  | 'connection'
  | 'truth'
  | 'fracture'
  | 'vengeance'
  | 'finale';
export type StoryEntity =
  | 'kenja_core'
  | 'lina_memory'
  | 'echo_main'
  | 'watcher_antagonist';
export type StoryEnding =
  | 'freedom'
  | 'kenja_control'
  | 'lina_memory'
  | 'true_secret';

interface NarrativeEntityState {
  unlocked: boolean;
  puzzlesSolved: number;
  emotionalState: number;
  storyFragments: string[];
}

interface NarrativeEndingState {
  unlocked: boolean;
  progress: number;
  requirementsMet: string[];
}

export interface NarrativeState {
  currentAct: StoryAct;
  currentChapterId: ChapterId;
  actProgress: number;
  entities: Record<StoryEntity, NarrativeEntityState>;
  endings: Record<StoryEnding, NarrativeEndingState>;
  criticalStoryPoints: string[];
  timeBasedEvents: Array<{
    time: string;
    event: string;
    triggered: boolean;
  }>;
}

const phases: StoryAct[] = [
  'awakening',
  'discovery',
  'connection',
  'truth',
  'fracture',
  'vengeance',
  'finale',
];

export const COMPLETE_STORY = Object.fromEntries(
  CHAPTER_DEFINITIONS.map((chapter) => [
    chapter.id,
    {
      title: chapter.title,
      description: chapter.description,
      phase: phases[chapter.order - 1] ?? 'finale',
      puzzleRange: chapter.puzzleRange,
      uiTheme: { accent: chapter.color },
    },
  ]),
);

function emptyEntityState(): Record<StoryEntity, NarrativeEntityState> {
  const create = (): NarrativeEntityState => ({
    unlocked: false,
    puzzlesSolved: 0,
    emotionalState: 0,
    storyFragments: [],
  });
  return {
    kenja_core: create(),
    lina_memory: create(),
    echo_main: { ...create(), unlocked: true },
    watcher_antagonist: create(),
  };
}

function emptyEndingState(): Record<StoryEnding, NarrativeEndingState> {
  const create = (): NarrativeEndingState => ({
    unlocked: false,
    progress: 0,
    requirementsMet: [],
  });
  return {
    freedom: create(),
    kenja_control: create(),
    lina_memory: create(),
    true_secret: create(),
  };
}

function deriveState(progression: ProgressionState): NarrativeState {
  const chapterIndex = Math.max(
    0,
    CHAPTER_DEFINITIONS.findIndex(
      ({ id }) => id === progression.currentChapterId,
    ),
  );
  const chapter = CHAPTER_DEFINITIONS[chapterIndex] ?? CHAPTER_DEFINITIONS[0];
  const [start, end] = chapter.puzzleRange;
  const completedInChapter = progression.completedPuzzleIds.reduce(
    (count, puzzleId) => {
      const number = Number(puzzleId.replace('puzzle_', ''));
      return number >= start && number <= end ? count + 1 : count;
    },
    0,
  );
  const chapterTotal = end - start + 1;

  return {
    currentAct: phases[chapterIndex] ?? 'finale',
    currentChapterId: chapter.id,
    actProgress: chapterTotal > 0
      ? Math.round((completedInChapter / chapterTotal) * 100)
      : 0,
    entities: emptyEntityState(),
    endings: emptyEndingState(),
    criticalStoryPoints: [],
    timeBasedEvents: [],
  };
}

export class NarrativeEngine {
  private progression = createInitialProgression(
    CONTENT_MANIFEST.contentVersion,
    CHAPTER_DEFINITIONS,
  );

  private listeners = new Set<(state: NarrativeState) => void>();

  initialize(): void {
    this.notify();
  }

  syncProgression(progression: ProgressionState): void {
    this.progression = progression;
    this.notify();
  }

  advanceStory(_puzzleId: string): void {
    // Puzzle commands advance canonical progression. Kept for API compatibility.
    this.notify();
  }

  getCurrentAct(): StoryAct {
    return deriveState(this.progression).currentAct;
  }

  getState(): NarrativeState {
    return deriveState(this.progression);
  }

  getEntityData(_entity: StoryEntity): null {
    return null;
  }

  getCurrentTheme(): { accent: string } {
    const chapter = CHAPTER_DEFINITIONS.find(
      ({ id }) => id === this.progression.currentChapterId,
    ) ?? CHAPTER_DEFINITIONS[0];
    return { accent: chapter.color };
  }

  checkEndingConditions(): StoryEnding[] {
    return [];
  }

  getEndingRequirements(_ending: StoryEnding): [] {
    return [];
  }

  getStoryDialogue(): string {
    return '';
  }

  getAllEndings(): StoryEnding[] {
    return ['freedom', 'kenja_control', 'lina_memory', 'true_secret'];
  }

  getNarrativeGuide(): string {
    const chapter = CHAPTER_DEFINITIONS.find(
      ({ id }) => id === this.progression.currentChapterId,
    ) ?? CHAPTER_DEFINITIONS[0];
    return `${chapter.order}. ${chapter.title.ar}`;
  }

  subscribe(listener: (state: NarrativeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    this.notify();
  }

  stop(): void {
    // Event-driven engine; no background loop to stop.
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}

let narrativeEngine: NarrativeEngine | null = null;

export function getNarrativeEngine(): NarrativeEngine {
  narrativeEngine ??= new NarrativeEngine();
  return narrativeEngine;
}
