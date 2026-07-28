import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
} from '../../core/achievementDefinitions';
import type {
  AchievementProgressEntry,
  AchievementProgressState,
} from '../../core/gameProgressionTypes';
import type { Achievement } from '../../core/gameTypes';

export interface AchievementProgressSignals {
  completedPuzzleCount?: number;
  echoTrust?: number;
  echoLevel?: number;
  flowerStage?: string;
  wishCount?: number;
  dayCycle?: number;
  endings?: Readonly<Record<string, boolean>>;
  transformationStage?: string;
  memoryShards?: {
    collected: number;
    total: number;
  };
}

export interface AchievementView extends Achievement {
  current: number;
  target: number;
}

function normalizeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeTimestamp(timestamp: number | null): number | null {
  return timestamp !== null && Number.isFinite(timestamp)
    ? timestamp
    : null;
}

function isEntryUnlocked(entry: AchievementProgressEntry): boolean {
  return entry.unlockedAt !== null || entry.current >= entry.target;
}

function deriveCurrent(
  definition: AchievementDefinition,
  signals: AchievementProgressSignals,
): number | undefined {
  const solved = signals.completedPuzzleCount;
  if (
    solved !== undefined
    && [
      'first_puzzle',
      'ten_puzzles',
      'twenty_puzzles',
      'fifty_puzzles',
      'hundred_puzzles',
      'all_puzzles',
      'act1_complete',
      'act2_complete',
      'act3_complete',
      'act4_complete',
      'act5_complete',
      'act6_complete',
      'act7_complete',
    ].includes(definition.id)
  ) {
    return Math.min(definition.target, normalizeProgress(solved));
  }

  if (
    signals.echoTrust !== undefined
    && [
      'trust_25',
      'trust_50',
      'trust_75',
      'trust_100',
    ].includes(definition.id)
  ) {
    return Math.min(
      definition.target,
      normalizeProgress(signals.echoTrust),
    );
  }

  if (
    signals.echoLevel !== undefined
    && ['level_5', 'level_10', 'level_20', 'level_50'].includes(
      definition.id,
    )
  ) {
    return Math.min(
      definition.target,
      normalizeProgress(signals.echoLevel),
    );
  }

  if (
    signals.flowerStage !== undefined
    && definition.id.startsWith('flower_')
  ) {
    const expectedId = signals.flowerStage === 'completed'
      ? 'flower_complete'
      : `flower_${signals.flowerStage}`;
    return definition.id === expectedId ? 1 : 0;
  }

  if (definition.id === 'first_wish' && signals.wishCount !== undefined) {
    return signals.wishCount >= 1 ? 1 : 0;
  }

  if (definition.id === 'survive_night' && signals.dayCycle !== undefined) {
    return signals.dayCycle >= 2 ? 1 : 0;
  }

  if (
    definition.id.startsWith('ending_')
    && signals.endings !== undefined
  ) {
    return signals.endings[definition.id.slice('ending_'.length)] ? 1 : 0;
  }

  if (signals.transformationStage !== undefined) {
    if (definition.id === 'echo_fractured') {
      return ['fractured', 'vengeful'].includes(
        signals.transformationStage,
      )
        ? 1
        : 0;
    }
    if (definition.id === 'echo_redeemed') {
      return signals.transformationStage === 'redeemed' ? 1 : 0;
    }
    if (definition.id === 'echo_ascended') {
      return signals.transformationStage === 'ascended' ? 1 : 0;
    }
  }

  if (signals.memoryShards !== undefined) {
    const collected = normalizeProgress(signals.memoryShards.collected);
    const total = normalizeProgress(signals.memoryShards.total);
    if (definition.id === 'shard_collector') {
      return Math.min(definition.target, collected);
    }
    if (definition.id === 'shard_master') {
      return total > 0 && collected >= total
        ? definition.target
        : Math.min(definition.target, collected);
    }
  }

  return undefined;
}

/**
 * Monotonically reconciles persisted progress with derived game signals.
 *
 * Previously unlocked achievements remain complete even when an older save is
 * missing progress. A timestamp is assigned only for a new runtime unlock; save
 * migrations may pass `null` to avoid replaying historical unlock toasts.
 */
export function synchronizeAchievementProgress(
  state: AchievementProgressState,
  signals: AchievementProgressSignals,
  unlockedAt: number | null,
  definitions: readonly AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS,
): AchievementProgressState {
  const nextById = { ...state.byId };
  const normalizedUnlockedAt = normalizeTimestamp(unlockedAt);

  for (const definition of definitions) {
    const existing = state.byId[definition.id] ?? {
      current: 0,
      target: definition.target,
      unlockedAt: null,
    };
    const previouslyUnlocked = isEntryUnlocked(existing);
    const derived = deriveCurrent(definition, signals);
    const current = previouslyUnlocked
      ? definition.target
      : Math.min(
          definition.target,
          Math.max(
            normalizeProgress(existing.current),
            derived ?? 0,
          ),
        );
    const newlyUnlocked = !previouslyUnlocked
      && current >= definition.target;

    nextById[definition.id] = {
      current,
      target: definition.target,
      unlockedAt: existing.unlockedAt
        ?? (newlyUnlocked ? normalizedUnlockedAt : null),
    };
  }

  return { byId: nextById };
}

export function increaseAchievementProgress(
  state: AchievementProgressState,
  increments: Readonly<Record<string, number>>,
  unlockedAt: number | null,
): AchievementProgressState {
  const nextById = { ...state.byId };
  const normalizedUnlockedAt = normalizeTimestamp(unlockedAt);

  for (const [achievementId, increment] of Object.entries(increments)) {
    const existing = nextById[achievementId];
    if (!existing) continue;
    const previouslyUnlocked = isEntryUnlocked(existing);
    const current = previouslyUnlocked
      ? existing.target
      : Math.min(
          existing.target,
          existing.current + normalizeProgress(increment),
        );
    nextById[achievementId] = {
      ...existing,
      current,
      unlockedAt: existing.unlockedAt
        ?? (
          !previouslyUnlocked && current >= existing.target
            ? normalizedUnlockedAt
            : null
        ),
    };
  }

  return { byId: nextById };
}

export function createAchievementViews(
  state: AchievementProgressState,
  definitions: readonly AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS,
): AchievementView[] {
  return definitions.map((definition) => {
    const entry = state.byId[definition.id] ?? {
      current: 0,
      target: definition.target,
      unlockedAt: null,
    };
    return {
      id: definition.id,
      name: definition.name,
      desc: definition.desc,
      icon: definition.icon,
      current: entry.current,
      target: entry.target,
      unlocked: isEntryUnlocked(entry),
      unlockedAt: entry.unlockedAt,
    };
  });
}
