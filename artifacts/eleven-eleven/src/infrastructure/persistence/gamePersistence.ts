import type { GameState } from '../../core/gameTypes';
import type {
  ChapterId,
  PuzzleId,
} from '../../domain/content/contracts';
import type {
  CampaignPuzzleProgress,
  HintTierId,
} from '../../domain/puzzles/campaignContracts';
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
  normalizeCinematicState,
} from '../../domain/cinematics/cinematicState';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../content/contentRegistry';
import {
  CHAPTER_01_MEMORY_SHARDS,
  CHAPTER_01_MANHWA_PAGES,
  CHAPTER_01_PUZZLE_BY_ID,
  CHAPTER_01_PUZZLES,
} from '../../content/puzzles/chapter01Campaign';
import {
  deriveCampaignAvailability,
  getCampaignPageStatus,
} from '../../domain/puzzles/campaignEngine';

export const GAME_SAVE_VERSION = 11;

// Keep the established key so Zustand can migrate existing local saves.
export const GAME_STORAGE_NAME = '11-11-game-store-v5';

type PersistedState = Partial<GameState> & {
  progression?: GameState['progression'];
};

const CAMPAIGN_SHARD_ID_PATTERN = /^page\d{2}_shard_\d{2}$/;
const CHAPTER_01_PAGE_ID_PATTERN = /^manhwa_ch01_page_\d{2}$/;
const REGISTERED_CAMPAIGN_SHARD_IDS = new Set(
  CHAPTER_01_MEMORY_SHARDS.map((shard) => shard.id),
);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeCurrency(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function normalizeMemoryFragments(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean),
  )];
}

function normalizeStringArray(value: unknown): string[] {
  return normalizeMemoryFragments(value);
}

function normalizeOrderedStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCollectedFragmentIds(value: unknown): string[] {
  return normalizeMemoryFragments(value).filter((fragmentId) => (
    !CAMPAIGN_SHARD_ID_PATTERN.test(fragmentId)
    || REGISTERED_CAMPAIGN_SHARD_IDS.has(fragmentId)
  ));
}

function normalizeStringRecord(
  value: unknown,
): Record<string, string> {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => (
        Boolean(entry[0].trim())
        && typeof entry[1] === 'string'
        && Boolean(entry[1].trim())
      ))
      .map(([key, recordValue]) => [key.trim(), recordValue.trim()]),
  );
}

function normalizeHintMap(
  value: unknown,
): Record<string, HintTierId[]> {
  if (!isObject(value)) return {};
  const allowed = new Set<HintTierId>([
    'observation',
    'connection',
    'assistance',
  ]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, tiers]) => Array.isArray(tiers))
      .map(([puzzleId, tiers]) => [
        puzzleId,
        [...new Set(
          (tiers as unknown[])
            .filter((tier): tier is HintTierId => (
              typeof tier === 'string'
              && allowed.has(tier as HintTierId)
            )),
        )],
      ]),
  );
}

function normalizePuzzleProgress(
  value: unknown,
): Record<string, CampaignPuzzleProgress[]> {
  if (!isObject(value)) return {};
  const normalized: Record<string, CampaignPuzzleProgress[]> = {};
  for (const [puzzleId, stages] of Object.entries(value)) {
    if (!Array.isArray(stages)) continue;
    normalized[puzzleId] = stages
      .filter(isObject)
      .map((stage) => ({
        stageIndex: (
          typeof stage.stageIndex === 'number'
          && Number.isInteger(stage.stageIndex)
          && stage.stageIndex >= 0
        ) ? stage.stageIndex : 0,
        // Ordered/ring puzzle values may legitimately repeat.
        values: normalizeOrderedStringArray(stage.values),
        matches: isObject(stage.matches)
          ? Object.fromEntries(
              Object.entries(stage.matches).filter(
                (entry): entry is [string, string] => (
                  typeof entry[1] === 'string'
                ),
              ),
            )
          : {},
      }));
  }
  return normalized;
}

function normalizeProgression(
  value: unknown,
  fallback: GameState['progression'],
): GameState['progression'] {
  if (!isObject(value)) return fallback;
  const chapterIds = new Set(
    CHAPTER_DEFINITIONS.map((chapter) => chapter.id),
  );
  const currentChapterId = (
    typeof value.currentChapterId === 'string'
    && chapterIds.has(value.currentChapterId as ChapterId)
  ) ? value.currentChapterId as ChapterId : fallback.currentChapterId;
  const unlockedChapterIds = normalizeStringArray(
    value.unlockedChapterIds,
  ).filter((chapterId): chapterId is ChapterId => (
    chapterIds.has(chapterId as ChapterId)
  ));
  if (!unlockedChapterIds.includes(currentChapterId)) {
    unlockedChapterIds.push(currentChapterId);
  }

  return {
    contentVersion: typeof value.contentVersion === 'string'
      ? value.contentVersion
      : fallback.contentVersion,
    currentChapterId,
    completedPuzzleIds: normalizeStringArray(
      value.completedPuzzleIds,
    ).filter((puzzleId): puzzleId is PuzzleId => (
      /^puzzle_\d+(?:_.+)?$/.test(puzzleId)
    )),
    skippedPuzzleIds: normalizeStringArray(
      value.skippedPuzzleIds,
    ).filter((puzzleId): puzzleId is PuzzleId => (
      /^puzzle_\d+(?:_.+)?$/.test(puzzleId)
    )),
    unlockedChapterIds,
    completedChapterIds: normalizeStringArray(
      value.completedChapterIds,
    ).filter((chapterId): chapterId is ChapterId => (
      chapterIds.has(chapterId as ChapterId)
    )),
  };
}

export function migrateGameState(
  persistedState: unknown,
  _version: number,
): PersistedState {
  if (!isObject(persistedState)) return {};
  const persisted = persistedState as PersistedState;
  const legacyEcho = isObject(persisted.echo) ? persisted.echo : {};
  const legacyProgression = migrateLegacyProgression(
    CONTENT_MANIFEST.contentVersion,
    CHAPTER_DEFINITIONS,
    {
      currentChapter: persisted.currentChapter,
      puzzles: Array.isArray(persisted.puzzles) ? persisted.puzzles : [],
    },
  );
  const baseProgression = normalizeProgression(
    persisted.progression,
    legacyProgression,
  );
  const claimedPuzzleRewards = normalizeStringArray(
    persisted.claimedPuzzleRewards,
  );
  const completedPuzzleIds = new Set<string>(
    baseProgression.completedPuzzleIds,
  );
  for (const puzzleId of claimedPuzzleRewards) {
    if (CHAPTER_01_PUZZLE_BY_ID[puzzleId]) completedPuzzleIds.add(puzzleId);
  }
  for (const puzzleId of completedPuzzleIds) {
    if (
      CHAPTER_01_PUZZLE_BY_ID[puzzleId]
      && !claimedPuzzleRewards.includes(puzzleId)
    ) {
      claimedPuzzleRewards.push(puzzleId);
    }
  }
  const progression = {
    ...baseProgression,
    completedPuzzleIds: [...completedPuzzleIds] as PuzzleId[],
  };
  const collectedMemoryFragments = normalizeCollectedFragmentIds(
    persisted.collectedMemoryFragments,
  );
  for (const puzzle of CHAPTER_01_PUZZLES) {
    if (
      completedPuzzleIds.has(puzzle.id)
      && !collectedMemoryFragments.includes(puzzle.rewards.shardId)
    ) {
      collectedMemoryFragments.push(puzzle.rewards.shardId);
    }
  }
  const knownPageIds = new Set(
    CHAPTER_01_MANHWA_PAGES.map((page) => page.id),
  );
  const pageStatuses = new Map(CHAPTER_01_MANHWA_PAGES.map((page) => [
    page.id,
    getCampaignPageStatus(
      page,
      collectedMemoryFragments,
      CHAPTER_01_MANHWA_PAGES,
    ),
  ]));
  const unlockedManhwaPageIds = normalizeStringArray(
    persisted.unlockedManhwaPageIds,
  ).filter((pageId) => (
    !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
    || (
      knownPageIds.has(pageId)
      && (
        pageStatuses.get(pageId) === 'restored'
        || pageStatuses.get(pageId) === 'questioned'
      )
    )
  ));
  for (const [pageId, status] of pageStatuses) {
    if (
      (status === 'restored' || status === 'questioned')
      && !unlockedManhwaPageIds.includes(pageId)
    ) {
      unlockedManhwaPageIds.push(pageId);
    }
  }
  const integratedMemoryFragmentIds = normalizeCollectedFragmentIds(
    persisted.integratedMemoryFragmentIds,
  );
  for (const page of CHAPTER_01_MANHWA_PAGES) {
    if (!unlockedManhwaPageIds.includes(page.id)) continue;
    for (const shardId of page.requiredShardIds) {
      if (!integratedMemoryFragmentIds.includes(shardId)) {
        integratedMemoryFragmentIds.push(shardId);
      }
    }
  }
  const viewedManhwaPageIds = normalizeStringArray(
    persisted.viewedManhwaPageIds,
  ).filter((pageId) => (
    !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
    || (
      knownPageIds.has(pageId)
      && unlockedManhwaPageIds.includes(pageId)
    )
  ));
  const memoryFragmentCollectedAt = Object.fromEntries(
    Object.entries(normalizeStringRecord(
      persisted.memoryFragmentCollectedAt,
    )).filter(([fragmentId]) => (
      !CAMPAIGN_SHARD_ID_PATTERN.test(fragmentId)
      || collectedMemoryFragments.includes(fragmentId)
    )),
  );
  const manhwaPageUnlockedAt = Object.fromEntries(
    Object.entries(normalizeStringRecord(
      persisted.manhwaPageUnlockedAt,
    )).filter(([pageId]) => (
      !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
      || unlockedManhwaPageIds.includes(pageId)
    )),
  );
  const manhwaPageViewedAt = Object.fromEntries(
    Object.entries(normalizeStringRecord(
      persisted.manhwaPageViewedAt,
    )).filter(([pageId]) => (
      !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
      || viewedManhwaPageIds.includes(pageId)
    )),
  );
  const availability = deriveCampaignAvailability({
    completedPuzzleIds: progression.completedPuzzleIds,
    collectedShardIds: collectedMemoryFragments,
    progressByPuzzleId: normalizePuzzleProgress(persisted.puzzleProgress),
  });
  const latestCompletedPuzzle = [...CHAPTER_01_PUZZLES]
    .reverse()
    .find((puzzle) => completedPuzzleIds.has(puzzle.id));
  const lastAvailablePuzzleId = availability.currentPuzzleId
    ?? latestCompletedPuzzle?.id
    ?? CHAPTER_01_PUZZLES[0]!.id;

  return {
    ...persisted,
    currency: normalizeCurrency(persisted.currency),
    collectedMemoryFragments,
    memoryFragmentCollectedAt,
    puzzleProgress: normalizePuzzleProgress(persisted.puzzleProgress),
    claimedPuzzleRewards,
    unlockedHintTiersByPuzzle: normalizeHintMap(
      persisted.unlockedHintTiersByPuzzle,
    ),
    integratedMemoryFragmentIds,
    unlockedManhwaPageIds,
    viewedManhwaPageIds,
    manhwaPageUnlockedAt,
    manhwaPageViewedAt,
    consumedDialogueTriggerIds: normalizeStringArray(
      persisted.consumedDialogueTriggerIds,
    ),
    lastAvailablePuzzleId,
    lastPuzzleReward: null,
    progression,
    ...(persisted.echo
      ? { echo: {
          ...persisted.echo,
          personality: persisted.echo.personality
            ?? migrateEchoPersonality(legacyEcho),
        } }
      : {}),
    narrative: normalizeNarrativeState(persisted.narrative),
    cinematic: normalizeCinematicState(persisted.cinematic),
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
    currency: state.currency,
    collectedMemoryFragments: state.collectedMemoryFragments,
    memoryFragmentCollectedAt: state.memoryFragmentCollectedAt,
    puzzleProgress: state.puzzleProgress,
    claimedPuzzleRewards: state.claimedPuzzleRewards,
    unlockedHintTiersByPuzzle: state.unlockedHintTiersByPuzzle,
    integratedMemoryFragmentIds: state.integratedMemoryFragmentIds,
    unlockedManhwaPageIds: state.unlockedManhwaPageIds,
    viewedManhwaPageIds: state.viewedManhwaPageIds,
    manhwaPageUnlockedAt: state.manhwaPageUnlockedAt,
    manhwaPageViewedAt: state.manhwaPageViewedAt,
    consumedDialogueTriggerIds: state.consumedDialogueTriggerIds,
    lastAvailablePuzzleId: state.lastAvailablePuzzleId,
    echo: state.echo,
    progression: state.progression,
    narrative: state.narrative,
    cinematic: state.cinematic,
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
