import type {
  AchievementProgressState,
  EchoProgressState,
  GameProgressionState,
} from './gameProgressionTypes';
import type { ProgressionState } from '../domain/progression/progression';
import type { NarrativeState } from '../domain/narrative/narrativeState';
import {
  ACHIEVEMENT_DEFINITIONS,
} from './achievementDefinitions';
import {
  createManhwaUnlockReceiptKey,
} from './manhwaArchiveTypes';
import type { EchoEventProgressState } from './echoEventTypes';
import {
  INITIAL_ECHO_EVOLUTION_STAGE_ID,
  type EchoEvolutionProgressState,
} from './echoEvolutionTypes';
import type {
  NarrativeEventProgressState,
} from './narrativeEventTypes';

export const GAME_PROGRESSION_SCHEMA_VERSION = 7;

export const DEFAULT_ECHO_PROGRESS: Readonly<EchoProgressState> = {
  humanity: 35,
  trust: 15,
  fear: 70,
  anger: 0,
  memoryStability: 5,
  memoriesRecovered: 0,
  corruption: 2,
  hope: 20,
  ragePoints: 0,
  sadness: 65,
  loneliness: 80,
  awareness: 3,
  isolation: 0,
  forgivenessPoints: 0,
};

export function createInitialAchievementProgressState(): AchievementProgressState {
  return {
    byId: Object.fromEntries(ACHIEVEMENT_DEFINITIONS.map((definition) => [
      definition.id,
      {
        current: 0,
        target: definition.target,
        unlockedAt: null,
      },
    ])),
  };
}

export function createInitialEchoEventProgressState(): EchoEventProgressState {
  return {
    standaloneReceiptsByKey: {},
  };
}

export function createInitialNarrativeEventProgressState():
NarrativeEventProgressState {
  return {
    claimedSourceReceiptKeys: [],
    sourceFingerprintsByReceiptKey: {},
    sourceAppliedAtByReceiptKey: {},
    provenStoryEventsByReceiptKey: {},
  };
}

export function createInitialEchoEvolutionProgressState():
EchoEvolutionProgressState {
  return {
    currentStageId: INITIAL_ECHO_EVOLUTION_STAGE_ID,
    reachedStageIds: [INITIAL_ECHO_EVOLUTION_STAGE_ID],
    stageReachedAt: {},
  };
}

export interface CreateInitialGameProgressionInput {
  journey: ProgressionState;
  narrative: NarrativeState;
  echo?: Partial<EchoProgressState>;
  initiallyUnlockedManhwaPageIds?: readonly string[];
}

export function createInitialGameProgressionState(
  input: CreateInitialGameProgressionInput,
): GameProgressionState {
  return {
    schemaVersion: GAME_PROGRESSION_SCHEMA_VERSION,
    resources: {
      coins: 0,
      memoryShards: {
        spendableBalance: 0,
        discoveredShardIds: [],
        discoveredAt: {},
        totalSpent: 0,
      },
    },
    puzzles: {
      journey: input.journey,
      campaignProgressByPuzzleId: {},
      claimedRewardReceipts: [],
      rewardFingerprintsByReceiptKey: {},
      unlockedHintTiersByPuzzle: {},
    },
    manhwa: {
      unlockedPageIds: [
        ...new Set(input.initiallyUnlockedManhwaPageIds ?? []),
      ],
      viewedPageIds: [],
      pageUnlockedAt: {},
      pageViewedAt: {},
      claimedPageUnlockReceipts: [
        ...new Set(input.initiallyUnlockedManhwaPageIds ?? []),
      ].map((pageId) => createManhwaUnlockReceiptKey(pageId)),
      claimedPageEffectIds: [],
      pageEffectFingerprintsByReceiptKey: {},
    },
    achievements: createInitialAchievementProgressState(),
    echo: {
      ...DEFAULT_ECHO_PROGRESS,
      ...input.echo,
    },
    echoEvents: createInitialEchoEventProgressState(),
    narrativeEvents: createInitialNarrativeEventProgressState(),
    evolution: createInitialEchoEvolutionProgressState(),
    story: {
      narrative: input.narrative,
    },
  };
}
