import type { GameState } from '../../core/gameTypes';
import type {
  AchievementProgressEntry,
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import {
  DEFAULT_ECHO_PROGRESS,
  GAME_PROGRESSION_SCHEMA_VERSION,
} from '../../core/gameProgressionDefaults';
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementDefinition,
} from '../../core/achievementDefinitions';
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
  normalizeNarrativeState,
} from '../../domain/narrative/narrativeState';
import {
  clampProgressMetric,
  normalizeNonNegativeInteger,
  reconcileGameProgressionState,
} from '../../domain/progression/gameProgressionState';
import {
  normalizeCinematicState,
} from '../../domain/cinematics/cinematicState';
import {
  createAchievementViews,
} from '../../domain/achievements/achievementProgression';
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
} from '../../domain/puzzles/campaignEngine';
import {
  createManhwaUnlockReceiptKey,
  getManhwaUnlockReceiptPageId,
} from '../../core/manhwaArchiveTypes';
import {
  normalizeEchoEventProgressState,
} from '../../domain/echo/echoEventReducer';
import {
  projectCanonicalEchoCompatibility,
} from '../../domain/echo/echoCompatibilityProjection';

export const GAME_SAVE_VERSION = 14;

// Keep the established key so Zustand can migrate existing local saves.
export const GAME_STORAGE_NAME = '11-11-game-store-v5';

type PersistedState = Partial<GameState> & {
  progression?: GameState['progression'];
  progressionState?: GameProgressionState;
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

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeMetric(value: unknown, fallback: number): number {
  return hasFiniteNumber(value)
    ? clampProgressMetric(value)
    : clampProgressMetric(fallback);
}

function normalizeOptionalTimestamp(value: unknown): number | null {
  return hasFiniteNumber(value) ? value : null;
}

function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readObject(
  object: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  return isObject(object[key]) ? object[key] : {};
}

function receiptToPuzzleId(receipt: string): string {
  const separatorIndex = receipt.lastIndexOf(':');
  return separatorIndex > 0
    ? receipt.slice(0, separatorIndex)
    : receipt;
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
  const legacyEcho: Record<string, unknown> = isObject(persisted.echo)
    ? persisted.echo
    : {};
  const legacyPersonality = readObject(legacyEcho, 'personality');
  const canonical = isObject(persisted.progressionState)
    ? persisted.progressionState
    : {};
  const canonicalResources = readObject(canonical, 'resources');
  const canonicalShards = readObject(canonicalResources, 'memoryShards');
  const canonicalPuzzles = readObject(canonical, 'puzzles');
  const canonicalManhwa = readObject(canonical, 'manhwa');
  const canonicalAchievements = readObject(canonical, 'achievements');
  const canonicalEcho = readObject(canonical, 'echo');
  const canonicalEchoEvents = readObject(canonical, 'echoEvents');
  const canonicalStory = readObject(canonical, 'story');
  const legacyProgression = migrateLegacyProgression(
    CONTENT_MANIFEST.contentVersion,
    CHAPTER_DEFINITIONS,
    {
      currentChapter: persisted.currentChapter,
      puzzles: Array.isArray(persisted.puzzles) ? persisted.puzzles : [],
    },
  );
  const baseProgression = normalizeProgression(
    canonicalPuzzles.journey ?? persisted.progression,
    legacyProgression,
  );
  const claimedRewardReceipts = hasOwn(
    canonicalPuzzles,
    'claimedRewardReceipts',
  )
    ? normalizeStringArray(canonicalPuzzles.claimedRewardReceipts)
    : normalizeStringArray(persisted.claimedPuzzleRewards)
        .map((puzzleId) => `${puzzleId}:1`);
  const claimedPuzzleRewards = normalizeStringArray(
    claimedRewardReceipts.map(receiptToPuzzleId),
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
      claimedRewardReceipts.push(`${puzzleId}:1`);
    }
  }
  const progression = {
    ...baseProgression,
    completedPuzzleIds: [...completedPuzzleIds] as PuzzleId[],
  };
  const collectedMemoryFragments = normalizeCollectedFragmentIds(
    hasOwn(canonicalShards, 'discoveredShardIds')
      ? canonicalShards.discoveredShardIds
      : persisted.collectedMemoryFragments,
  );
  const legacyMemory: Record<string, unknown> = isObject(persisted.memory)
    ? persisted.memory
    : {};
  const spendableBalance = hasOwn(canonicalShards, 'spendableBalance')
    ? normalizeCurrency(canonicalShards.spendableBalance)
    : Math.max(
        collectedMemoryFragments.length,
        normalizeCurrency(legacyMemory.fragmentsCollected),
      );
  const totalSpent = hasOwn(canonicalShards, 'totalSpent')
    ? normalizeCurrency(canonicalShards.totalSpent)
    : 0;
  const knownPageIds = new Set(
    CHAPTER_01_MANHWA_PAGES.map((page) => page.id),
  );
  const unlockedManhwaPageIds = normalizeStringArray(
    hasOwn(canonicalManhwa, 'unlockedPageIds')
      ? canonicalManhwa.unlockedPageIds
      : persisted.unlockedManhwaPageIds,
  ).filter((pageId) => (
    !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
    || knownPageIds.has(pageId)
  ));
  const freePageId = CHAPTER_01_MANHWA_PAGES.find(
    (page) => page.pageNumber === 1,
  )?.id;
  if (freePageId && !unlockedManhwaPageIds.includes(freePageId)) {
    unlockedManhwaPageIds.push(freePageId);
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
    hasOwn(canonicalManhwa, 'viewedPageIds')
      ? canonicalManhwa.viewedPageIds
      : persisted.viewedManhwaPageIds,
  ).filter((pageId) => (
    !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
    || (
      knownPageIds.has(pageId)
      && unlockedManhwaPageIds.includes(pageId)
    )
  ));
  const memoryFragmentCollectedAt = Object.fromEntries(
    Object.entries(normalizeStringRecord(
      hasOwn(canonicalShards, 'discoveredAt')
        ? canonicalShards.discoveredAt
        : persisted.memoryFragmentCollectedAt,
    )).filter(([fragmentId]) => (
      !CAMPAIGN_SHARD_ID_PATTERN.test(fragmentId)
      || collectedMemoryFragments.includes(fragmentId)
    )),
  );
  const manhwaPageUnlockedAt = Object.fromEntries(
    Object.entries(normalizeStringRecord(
      hasOwn(canonicalManhwa, 'pageUnlockedAt')
        ? canonicalManhwa.pageUnlockedAt
        : persisted.manhwaPageUnlockedAt,
    )).filter(([pageId]) => (
      !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
      || unlockedManhwaPageIds.includes(pageId)
    )),
  );
  const manhwaPageViewedAt = Object.fromEntries(
    Object.entries(normalizeStringRecord(
      hasOwn(canonicalManhwa, 'pageViewedAt')
        ? canonicalManhwa.pageViewedAt
        : persisted.manhwaPageViewedAt,
    )).filter(([pageId]) => (
      !CHAPTER_01_PAGE_ID_PATTERN.test(pageId)
      || viewedManhwaPageIds.includes(pageId)
    )),
  );
  const availability = deriveCampaignAvailability({
    completedPuzzleIds: progression.completedPuzzleIds,
    collectedShardIds: collectedMemoryFragments,
    progressByPuzzleId: normalizePuzzleProgress(
      hasOwn(canonicalPuzzles, 'campaignProgressByPuzzleId')
        ? canonicalPuzzles.campaignProgressByPuzzleId
        : persisted.puzzleProgress,
    ),
  });
  const latestCompletedPuzzle = [...CHAPTER_01_PUZZLES]
    .reverse()
    .find((puzzle) => completedPuzzleIds.has(puzzle.id));
  const lastAvailablePuzzleId = availability.currentPuzzleId
    ?? latestCompletedPuzzle?.id
    ?? CHAPTER_01_PUZZLES[0]!.id;

  const legacyAchievements = Array.isArray(persisted.achievements)
    ? persisted.achievements
    : [];
  const rawAchievementById = readObject(canonicalAchievements, 'byId');
  const achievementIds = new Set([
    ...ACHIEVEMENT_DEFINITIONS.map((definition) => definition.id),
    ...Object.keys(rawAchievementById),
    ...legacyAchievements
      .filter(isObject)
      .map((achievement) => achievement.id)
      .filter((id): id is string => typeof id === 'string'),
  ]);
  const achievementProgressById: Record<
    string,
    AchievementProgressEntry
  > = {};
  for (const id of achievementIds) {
    const rawEntry = isObject(rawAchievementById[id])
      ? rawAchievementById[id]
      : {};
    const legacyAchievement = legacyAchievements.find(
      (achievement) => isObject(achievement) && achievement.id === id,
    );
    const legacyUnlocked = isObject(legacyAchievement)
      && legacyAchievement.unlocked === true;
    const persistedTarget = Math.max(
      1,
      normalizeNonNegativeInteger(
        hasFiniteNumber(rawEntry.target) ? rawEntry.target : 1,
      ),
    );
    const persistedCurrent = Math.min(
      persistedTarget,
      normalizeNonNegativeInteger(
        hasFiniteNumber(rawEntry.current) ? rawEntry.current : 0,
      ),
    );
    const canonicalUnlockedAt = normalizeOptionalTimestamp(
      rawEntry.unlockedAt,
    );
    const wasUnlocked = legacyUnlocked
      || canonicalUnlockedAt !== null
      || persistedCurrent >= persistedTarget;
    const target = getAchievementDefinition(id)?.target ?? persistedTarget;
    const current = wasUnlocked
      ? target
      : Math.min(target, persistedCurrent);
    achievementProgressById[id] = {
      current,
      target,
      unlockedAt: canonicalUnlockedAt
        ?? (
          isObject(legacyAchievement)
            ? normalizeOptionalTimestamp(legacyAchievement.unlockedAt)
            : null
        ),
    };
  }

  const legacyHumanity = hasFiniteNumber(legacyPersonality.humanity)
    ? legacyPersonality.humanity
    : legacyEcho.hope;
  const legacyAnger = hasFiniteNumber(legacyPersonality.anger)
    ? legacyPersonality.anger
    : legacyEcho.ragePoints;
  const canonicalMetric = (
    key: keyof GameProgressionState['echo'],
    legacyValue: unknown,
  ): number => (
    hasOwn(canonicalEcho, key)
      ? normalizeMetric(canonicalEcho[key], DEFAULT_ECHO_PROGRESS[key])
      : normalizeMetric(legacyValue, DEFAULT_ECHO_PROGRESS[key])
  );
  const echoProgress = {
    humanity: canonicalMetric('humanity', legacyHumanity),
    trust: canonicalMetric('trust', legacyPersonality.trust ?? legacyEcho.trust),
    fear: canonicalMetric('fear', legacyPersonality.fear ?? legacyEcho.fear),
    anger: canonicalMetric('anger', legacyAnger),
    memoryStability: canonicalMetric(
      'memoryStability',
      legacyEcho.memoryStability,
    ),
    memoriesRecovered: canonicalMetric(
      'memoriesRecovered',
      legacyPersonality.memoriesRecovered,
    ),
    corruption: canonicalMetric(
      'corruption',
      legacyPersonality.corruption ?? legacyEcho.corruption,
    ),
    hope: canonicalMetric('hope', legacyEcho.hope),
    ragePoints: canonicalMetric('ragePoints', legacyEcho.ragePoints),
    sadness: canonicalMetric('sadness', legacyPersonality.sadness),
    loneliness: canonicalMetric('loneliness', legacyEcho.loneliness),
    awareness: canonicalMetric('awareness', legacyEcho.awareness),
    isolation: canonicalMetric('isolation', legacyEcho.isolation),
    forgivenessPoints: canonicalMetric(
      'forgivenessPoints',
      legacyEcho.forgivenessPoints,
    ),
  };
  const coins = hasOwn(canonicalResources, 'coins')
    ? normalizeCurrency(canonicalResources.coins)
    : hasOwn(persisted, 'currency')
      ? normalizeCurrency(persisted.currency)
      : normalizeCurrency(legacyEcho.coins);
  const puzzleProgress = normalizePuzzleProgress(
    hasOwn(canonicalPuzzles, 'campaignProgressByPuzzleId')
      ? canonicalPuzzles.campaignProgressByPuzzleId
      : persisted.puzzleProgress,
  );
  const unlockedHintTiersByPuzzle = normalizeHintMap(
    hasOwn(canonicalPuzzles, 'unlockedHintTiersByPuzzle')
      ? canonicalPuzzles.unlockedHintTiersByPuzzle
      : persisted.unlockedHintTiersByPuzzle,
  );
  const claimedPageEffectIds = hasOwn(
    canonicalManhwa,
    'claimedPageEffectIds',
  )
    ? normalizeStringArray(canonicalManhwa.claimedPageEffectIds)
    : [...unlockedManhwaPageIds];
  const claimedPageUnlockReceipts = normalizeStringArray(
    hasOwn(canonicalManhwa, 'claimedPageUnlockReceipts')
      ? canonicalManhwa.claimedPageUnlockReceipts
      : [],
  ).filter((receipt) => {
    const pageId = getManhwaUnlockReceiptPageId(receipt);
    return pageId !== null && unlockedManhwaPageIds.includes(pageId);
  });
  for (const pageId of unlockedManhwaPageIds) {
    if (!claimedPageUnlockReceipts.some(
      (receipt) => getManhwaUnlockReceiptPageId(receipt) === pageId,
    )) {
      claimedPageUnlockReceipts.push(
        createManhwaUnlockReceiptKey(pageId),
      );
    }
  }
  const narrativeSource = hasOwn(canonicalStory, 'narrative')
    ? canonicalStory.narrative
    : persisted.narrative;
  const narrative = normalizeNarrativeState(
    isObject(narrativeSource)
      ? narrativeSource as Partial<GameState['narrative']>
      : undefined,
  );
  const progressionState = reconcileGameProgressionState({
    schemaVersion: GAME_PROGRESSION_SCHEMA_VERSION,
    resources: {
      coins,
      memoryShards: {
        spendableBalance,
        discoveredShardIds: collectedMemoryFragments,
        discoveredAt: memoryFragmentCollectedAt,
        totalSpent,
      },
    },
    puzzles: {
      journey: progression,
      campaignProgressByPuzzleId: puzzleProgress,
      claimedRewardReceipts,
      unlockedHintTiersByPuzzle,
    },
    manhwa: {
      unlockedPageIds: unlockedManhwaPageIds,
      viewedPageIds: viewedManhwaPageIds,
      pageUnlockedAt: manhwaPageUnlockedAt,
      pageViewedAt: manhwaPageViewedAt,
      claimedPageUnlockReceipts,
      claimedPageEffectIds,
    },
    achievements: {
      byId: achievementProgressById,
    },
    echo: echoProgress,
    echoEvents: normalizeEchoEventProgressState(canonicalEchoEvents),
    story: {
      narrative,
    },
  });

  return {
    ...persisted,
    progressionState,
    currency: progressionState.resources.coins,
    collectedMemoryFragments:
      progressionState.resources.memoryShards.discoveredShardIds,
    memoryFragmentCollectedAt:
      progressionState.resources.memoryShards.discoveredAt,
    puzzleProgress:
      progressionState.puzzles.campaignProgressByPuzzleId,
    claimedPuzzleRewards: normalizeStringArray(
      progressionState.puzzles.claimedRewardReceipts.map(receiptToPuzzleId),
    ),
    unlockedHintTiersByPuzzle:
      progressionState.puzzles.unlockedHintTiersByPuzzle,
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
    progression: progressionState.puzzles.journey,
    narrative: progressionState.story.narrative,
    echo: {
      ...(isObject(persisted.echo) ? persisted.echo : {}),
      personality: {
        humanity: progressionState.echo.humanity,
        trust: progressionState.echo.trust,
        fear: progressionState.echo.fear,
        anger: progressionState.echo.anger,
        sadness: progressionState.echo.sadness,
        corruption: progressionState.echo.corruption,
        memoriesRecovered: progressionState.echo.memoriesRecovered,
      },
      trust: progressionState.echo.trust,
      fear: progressionState.echo.fear,
      memoryStability: progressionState.echo.memoryStability,
      corruption: progressionState.echo.corruption,
      hope: progressionState.echo.hope,
      loneliness: progressionState.echo.loneliness,
      awareness: progressionState.echo.awareness,
      isolation: progressionState.echo.isolation,
      ragePoints: progressionState.echo.ragePoints,
      forgivenessPoints: progressionState.echo.forgivenessPoints,
    } as GameState['echo'],
    cinematic: normalizeCinematicState(persisted.cinematic),
  };
}

export function mergeGameState(
  persistedState: unknown,
  currentState: GameState,
): GameState {
  const persisted = migrateGameState(persistedState, 0);
  const progressionState = persisted.progressionState
    ?? currentState.progressionState;
  const progression = progressionState.puzzles.journey;
  const {
    actions: _persistedActions,
    puzzles: _persistedPuzzles,
    chapters: _persistedChapters,
    progressionState: _persistedProgressionState,
    echo: persistedEcho,
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
  const echoProgress = progressionState.echo;
  const compatibilityEcho = projectCanonicalEchoCompatibility(
    echoProgress,
    {
      ...currentState.echo,
      ...persistedEcho,
      personality: {
        ...currentState.echo.personality,
        ...persistedEcho?.personality,
      },
    },
  );

  return {
    ...currentState,
    ...safePersisted,
    progressionState,
    currency: progressionState.resources.coins,
    collectedMemoryFragments:
      progressionState.resources.memoryShards.discoveredShardIds,
    memoryFragmentCollectedAt:
      progressionState.resources.memoryShards.discoveredAt,
    puzzleProgress:
      progressionState.puzzles.campaignProgressByPuzzleId,
    claimedPuzzleRewards: normalizeStringArray(
      progressionState.puzzles.claimedRewardReceipts.map(receiptToPuzzleId),
    ),
    unlockedHintTiersByPuzzle:
      progressionState.puzzles.unlockedHintTiersByPuzzle,
    unlockedManhwaPageIds: progressionState.manhwa.unlockedPageIds,
    viewedManhwaPageIds: progressionState.manhwa.viewedPageIds,
    manhwaPageUnlockedAt: progressionState.manhwa.pageUnlockedAt,
    manhwaPageViewedAt: progressionState.manhwa.pageViewedAt,
    progression,
    narrative: progressionState.story.narrative,
    echo: {
      ...compatibilityEcho,
      coins: progressionState.resources.coins,
    },
    puzzles,
    chapters,
    solvedPuzzles: progression.completedPuzzleIds.length,
    currentChapter: progression.currentChapterId,
    achievements: createAchievementViews(
      progressionState.achievements,
    ),
    actions: currentState.actions,
  };
}

export function partializeGameState(state: GameState): PersistedState {
  const previous = state.progressionState;
  const discoveredShardIds = normalizeCollectedFragmentIds([
    ...previous.resources.memoryShards.discoveredShardIds,
    ...state.collectedMemoryFragments,
  ]);
  const previousShardIds = new Set(
    previous.resources.memoryShards.discoveredShardIds,
  );
  const newlyDiscoveredCount = discoveredShardIds.filter(
    (id) => !previousShardIds.has(id),
  ).length;
  const unlockedPageIds = normalizeStringArray([
    ...previous.manhwa.unlockedPageIds,
    ...state.unlockedManhwaPageIds,
  ]);
  const viewedPageIds = normalizeStringArray([
    ...previous.manhwa.viewedPageIds,
    ...state.viewedManhwaPageIds,
  ]).filter((pageId) => unlockedPageIds.includes(pageId));
  const claimedRewardReceipts = normalizeStringArray([
    ...previous.puzzles.claimedRewardReceipts,
    ...state.claimedPuzzleRewards.map((puzzleId) => `${puzzleId}:1`),
  ]);
  const achievementProgressById = {
    ...previous.achievements.byId,
  };
  for (const achievement of state.achievements) {
    const existing = achievementProgressById[achievement.id];
    const target = existing?.target ?? 1;
    achievementProgressById[achievement.id] = {
      current: achievement.unlocked
        ? target
        : existing?.current ?? 0,
      target,
      unlockedAt: achievement.unlockedAt ?? existing?.unlockedAt ?? null,
    };
  }
  const progressionState = reconcileGameProgressionState({
    ...previous,
    resources: {
      coins: state.currency,
      memoryShards: {
        spendableBalance: (
          previous.resources.memoryShards.spendableBalance
          + newlyDiscoveredCount
        ),
        discoveredShardIds,
        discoveredAt: {
          ...previous.resources.memoryShards.discoveredAt,
          ...state.memoryFragmentCollectedAt,
        },
        totalSpent: previous.resources.memoryShards.totalSpent,
      },
    },
    puzzles: {
      journey: state.progression,
      campaignProgressByPuzzleId: state.puzzleProgress,
      claimedRewardReceipts,
      unlockedHintTiersByPuzzle: state.unlockedHintTiersByPuzzle,
    },
    manhwa: {
      unlockedPageIds,
      viewedPageIds,
      pageUnlockedAt: {
        ...previous.manhwa.pageUnlockedAt,
        ...state.manhwaPageUnlockedAt,
      },
      pageViewedAt: {
        ...previous.manhwa.pageViewedAt,
        ...state.manhwaPageViewedAt,
      },
      claimedPageUnlockReceipts:
        previous.manhwa.claimedPageUnlockReceipts,
      claimedPageEffectIds: previous.manhwa.claimedPageEffectIds,
    },
    achievements: {
      byId: achievementProgressById,
    },
    // Canonical progression is the save authority. Legacy fields are a
    // one-way projection and must never overwrite canonical metrics.
    echo: previous.echo,
    story: {
      narrative: state.narrative,
    },
  });
  return {
    progressionState,
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
