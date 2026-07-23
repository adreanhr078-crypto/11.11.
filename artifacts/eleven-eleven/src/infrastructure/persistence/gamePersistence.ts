import type { GameState } from '../../core/gameTypes';
import type { PuzzleId } from '../../domain/content/contracts';
import {
  deriveChapterProgress,
  migrateLegacyProgression,
} from '../../domain/progression/progression';
import {
  migrateEchoPersonality,
} from '../../domain/echo/echoPersonality';
import {
  normalizeNarrativeState,
} from '../../domain/narrative/narrativeState';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../content/contentRegistry';

export const GAME_SAVE_VERSION = 7;

// Keep the established key so Zustand can migrate existing local saves.
export const GAME_STORAGE_NAME = '11-11-game-store-v5';

type PersistedState = Partial<GameState> & {
  progression?: GameState['progression'];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function migrateGameState(
  persistedState: unknown,
  _version: number,
): PersistedState {
  if (!isObject(persistedState)) return {};
  const persisted = persistedState as PersistedState;
  const legacyEcho = isObject(persisted.echo) ? persisted.echo : {};

  return {
    ...persisted,
    progression: persisted.progression ?? migrateLegacyProgression(
      CONTENT_MANIFEST.contentVersion,
      CHAPTER_DEFINITIONS,
      {
        currentChapter: persisted.currentChapter,
        puzzles: Array.isArray(persisted.puzzles) ? persisted.puzzles : [],
      },
    ),
    echo: persisted.echo
      ? {
          ...persisted.echo,
          personality: persisted.echo.personality
            ?? migrateEchoPersonality(legacyEcho),
        }
      : undefined,
    narrative: normalizeNarrativeState(persisted.narrative),
  };
}

export function mergeGameState(
  persistedState: unknown,
  currentState: GameState,
): GameState {
  const persisted = migrateGameState(persistedState, 0);
  const progression = persisted.progression ?? currentState.progression;
  const {
    actions: _persistedActions,
    puzzles: _persistedPuzzles,
    chapters: _persistedChapters,
    ...safePersisted
  } = persisted;
  const solved = new Set<PuzzleId>(progression.completedPuzzleIds);
  const skipped = new Set<PuzzleId>(progression.skippedPuzzleIds);
  const puzzles = currentState.puzzles.map((puzzle) => {
    const puzzleId = puzzle.id as PuzzleId;
    if (solved.has(puzzleId)) return { ...puzzle, status: 'solved' as const };
    if (skipped.has(puzzleId)) return { ...puzzle, status: 'skipped' as const };
    return puzzle;
  });
  const chapters = Object.fromEntries(CHAPTER_DEFINITIONS.map((definition) => {
    const totalPuzzles = (
      definition.puzzleRange[1] - definition.puzzleRange[0] + 1
    );
    const progress = deriveChapterProgress(
      progression,
      definition.id,
      totalPuzzles,
      CHAPTER_DEFINITIONS,
    );
    return [
      definition.id,
      {
        id: definition.id,
        title: definition.title.ar,
        description: definition.description.ar,
        glyph: definition.glyph,
        color: definition.color,
        unlocked: progress.unlocked,
        completed: progress.completed,
        puzzlesSolved: progress.resolvedPuzzles,
        totalPuzzles,
        progress: progress.progress,
      },
    ];
  })) as GameState['chapters'];

  return {
    ...currentState,
    ...safePersisted,
    progression,
    puzzles,
    chapters,
    solvedPuzzles: progression.completedPuzzleIds.length,
    currentChapter: progression.currentChapterId,
    actions: currentState.actions,
  };
}

export function partializeGameState(state: GameState): PersistedState {
  return {
    echo: state.echo,
    progression: state.progression,
    narrative: state.narrative,
    flower: state.flower,
    memory: state.memory,
    player: state.player,
    achievements: state.achievements,
    endings: state.endings,
    wishes: state.wishes,
    narrativeTriggers: state.narrativeTriggers,
    world: state.world,
    time: state.time,
    dailyMissions: state.dailyMissions,
    lastMissionRefresh: state.lastMissionRefresh,
    finalChoice: state.finalChoice,
    unlockedEndings: state.unlockedEndings,
    seenEndings: state.seenEndings,
    achievedEnding: state.achievedEnding,
    lastEndingViewed: state.lastEndingViewed,
  };
}
