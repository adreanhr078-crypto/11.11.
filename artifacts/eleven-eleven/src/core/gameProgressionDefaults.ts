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

export const GAME_PROGRESSION_SCHEMA_VERSION = 1;

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
      unlockedHintTiersByPuzzle: {},
    },
    manhwa: {
      unlockedPageIds: [
        ...new Set(input.initiallyUnlockedManhwaPageIds ?? []),
      ],
      viewedPageIds: [],
      pageUnlockedAt: {},
      pageViewedAt: {},
      claimedPageEffectIds: [],
    },
    achievements: createInitialAchievementProgressState(),
    echo: {
      ...DEFAULT_ECHO_PROGRESS,
      ...input.echo,
    },
    story: {
      narrative: input.narrative,
    },
  };
}
