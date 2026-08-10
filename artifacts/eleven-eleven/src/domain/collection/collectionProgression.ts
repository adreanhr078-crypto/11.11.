import {
  MEMORY_SHARD_SETS,
  PHASE5_ACHIEVEMENT_DEFINITIONS,
} from './collectionDefinitions';
import type {
  AchievementCondition,
  CollectionAchievementDefinition,
  CollectionAchievementView,
  SystemRecoveryView,
} from './collectionContracts';

export const SYSTEM_RECOVERY_WEIGHTS = Object.freeze({
  story: 30,
  puzzles: 20,
  memory: 20,
  secrets: 15,
  archive: 10,
  achievements: 5,
});

export interface CollectionProgressSignals {
  completedChapterIds: readonly string[];
  mainPuzzlesCompleted: number;
  allPuzzlesCompleted: number;
  mainPerfectSolves: number;
  allPerfectSolves: number;
  shardsCollected: number;
  completedChapterShardSets: number;
  reconstructionsCompleted: number;
  secretSignalsDiscovered: number;
  characterMomentsUnlocked: number;
  reachedCanonEventIds: ReadonlySet<string>;
  noHintSolves: number;
  canonicalSecretsFound: number;
  canonicalSecretsKnown: number;
  archiveDiscovered: number;
  archiveKnown: number;
  unlockedAchievementCount: number;
  achievementTotal: number;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function ratio(current: number, total: number): number {
  return total > 0 ? clampPercent((current / total) * 100) : 100;
}

export function createSystemRecovery(
  signals: CollectionProgressSignals,
): SystemRecoveryView {
  const story = ratio(signals.completedChapterIds.length, 4);
  const puzzles = ratio(signals.allPuzzlesCompleted, 20);
  const memory = clampPercent(
    ratio(signals.shardsCollected, 20) * 0.75
      + ratio(signals.reconstructionsCompleted, MEMORY_SHARD_SETS.length) * 0.25,
  );
  const secrets = signals.canonicalSecretsKnown === 0
    ? 100
    : ratio(signals.canonicalSecretsFound, signals.canonicalSecretsKnown);
  const archive = ratio(signals.archiveDiscovered, signals.archiveKnown);
  const achievements = ratio(
    signals.unlockedAchievementCount,
    signals.achievementTotal,
  );
  const percent = clampPercent(
    story * SYSTEM_RECOVERY_WEIGHTS.story / 100
      + puzzles * SYSTEM_RECOVERY_WEIGHTS.puzzles / 100
      + memory * SYSTEM_RECOVERY_WEIGHTS.memory / 100
      + secrets * SYSTEM_RECOVERY_WEIGHTS.secrets / 100
      + archive * SYSTEM_RECOVERY_WEIGHTS.archive / 100
      + achievements * SYSTEM_RECOVERY_WEIGHTS.achievements / 100,
  );
  return { percent, story, puzzles, memory, secrets, archive, achievements };
}

function conditionTarget(condition: AchievementCondition): number {
  switch (condition.kind) {
    case 'chapter-completed':
    case 'story-completed':
    case 'canon-event':
      return 1;
    default:
      return condition.target;
  }
}

export function currentForAchievement(
  definition: CollectionAchievementDefinition,
  signals: CollectionProgressSignals,
  recoveryPercent?: number,
): number {
  const condition = definition.condition;
  switch (condition.kind) {
    case 'chapter-completed':
      return signals.completedChapterIds.includes(condition.chapterId) ? 1 : 0;
    case 'story-completed':
      return signals.completedChapterIds.includes('chapter_4') ? 1 : 0;
    case 'puzzles-completed':
      return Math.min(condition.target, condition.classification === 'main'
        ? signals.mainPuzzlesCompleted
        : signals.allPuzzlesCompleted);
    case 'perfect-solves':
      return Math.min(condition.target, condition.classification === 'main'
        ? signals.mainPerfectSolves
        : signals.allPerfectSolves);
    case 'shards-collected':
      return Math.min(condition.target, signals.shardsCollected);
    case 'chapter-shard-set':
      return Math.min(condition.target, signals.completedChapterShardSets);
    case 'reconstructions-completed':
      return Math.min(condition.target, signals.reconstructionsCompleted);
    case 'secret-signals-discovered':
      return Math.min(condition.target, signals.secretSignalsDiscovered);
    case 'character-moment':
      return Math.min(condition.target, signals.characterMomentsUnlocked);
    case 'canon-event':
      return signals.reachedCanonEventIds.has(condition.eventId) ? 1 : 0;
    case 'no-hint-solves':
      return Math.min(condition.target, signals.noHintSolves);
    case 'system-recovery':
      return Math.min(condition.target, recoveryPercent ?? 0);
  }
}

export function createCollectionAchievementViews(
  definitions: readonly CollectionAchievementDefinition[],
  signals: CollectionProgressSignals,
  unlockedById: Readonly<Record<string, string | null>>,
  recoveryPercent?: number,
): CollectionAchievementView[] {
  return definitions.map((definition) => {
    const target = conditionTarget(definition.condition);
    const current = currentForAchievement(definition, signals, recoveryPercent);
    const unlockedAt = unlockedById[definition.id] ?? null;
    const unlocked = unlockedAt !== null || current >= target;
    return {
      ...definition,
      name: !unlocked && definition.hidden ? 'CLASSIFIED' : definition.name,
      description: !unlocked && definition.hidden
        ? 'DATA UNAVAILABLE'
        : definition.description,
      unlocked,
      unlockedAt,
      current: unlocked ? target : current,
      target,
    };
  });
}

export function createDefaultCollectionSignals(): CollectionProgressSignals {
  return {
    completedChapterIds: [],
    mainPuzzlesCompleted: 0,
    allPuzzlesCompleted: 0,
    mainPerfectSolves: 0,
    allPerfectSolves: 0,
    shardsCollected: 0,
    completedChapterShardSets: 0,
    reconstructionsCompleted: 0,
    secretSignalsDiscovered: 0,
    characterMomentsUnlocked: 0,
    reachedCanonEventIds: new Set(),
    noHintSolves: 0,
    canonicalSecretsFound: 0,
    canonicalSecretsKnown: 0,
    archiveDiscovered: 1,
    archiveKnown: 2,
    unlockedAchievementCount: 0,
    achievementTotal: PHASE5_ACHIEVEMENT_DEFINITIONS.length,
  };
}

