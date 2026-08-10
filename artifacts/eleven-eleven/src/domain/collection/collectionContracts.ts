export type CollectionChapterId = 'chapter_1' | 'chapter_2' | 'chapter_3' | 'chapter_4';

export type AchievementCategory =
  | 'story'
  | 'puzzle'
  | 'memory'
  | 'exploration'
  | 'mastery'
  | 'character'
  | 'secret';

export type AchievementPresentationTier = 'standard' | 'rare' | 'system';
export type CosmeticType = 'title' | 'frame' | 'badge' | 'avatar-effect' | 'system-border';

export interface AchievementRewardDefinition {
  xp: number;
  coins: number;
  cosmetics: readonly string[];
}

export type AchievementCondition =
  | { kind: 'chapter-completed'; chapterId: CollectionChapterId }
  | { kind: 'story-completed' }
  | { kind: 'puzzles-completed'; classification: 'main' | 'all'; target: number }
  | { kind: 'perfect-solves'; classification: 'main' | 'all'; target: number }
  | { kind: 'shards-collected'; target: number }
  | { kind: 'chapter-shard-set'; target: number }
  | { kind: 'reconstructions-completed'; target: number }
  | { kind: 'secret-signals-discovered'; target: number }
  | { kind: 'character-moment'; target: number }
  | { kind: 'canon-event'; eventId: string }
  | { kind: 'no-hint-solves'; target: number }
  | { kind: 'system-recovery'; target: number };

export interface CollectionAchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  hidden: boolean;
  presentationTier: AchievementPresentationTier;
  icon: string;
  condition: AchievementCondition;
  reward: AchievementRewardDefinition;
}

export interface CollectionAchievementView extends CollectionAchievementDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
  current: number;
  target: number;
}

export interface MemoryShardSetView {
  chapterId: CollectionChapterId;
  order: number;
  collected: number;
  total: number;
  complete: boolean;
  reconstructionAvailable: boolean;
  reconstructed: boolean;
  contentStatus: 'available' | 'needs-owner-content';
}

export interface SecretSignalView {
  id: string;
  discovered: boolean;
  completed: boolean;
  label: 'UNKNOWN SIGNAL' | 'VERIFIED SIGNAL';
}

export interface SystemRecoveryView {
  percent: number;
  story: number;
  puzzles: number;
  memory: number;
  secrets: number;
  archive: number;
  achievements: number;
}

export interface EquippedCosmeticsView {
  titleId: string | null;
  frameId: string | null;
  badgeId: string | null;
  avatarEffectId: string | null;
  systemBorderId: string | null;
}

export interface CollectionCosmeticView {
  id: string;
  type: CosmeticType;
  label: string;
  owned: boolean;
  equipped: boolean;
}

export interface CollectionSnapshot {
  shardIds: string[];
  shardCount: number;
  totalShards: number;
  memorySets: MemoryShardSetView[];
  reconstructionsCompleted: number;
  secretSignals: SecretSignalView[];
  secretsFound: number;
  canonicalSecretsKnown: number;
  archive: {
    discovered: number;
    known: number;
    characterMomentCount: number;
  };
  achievements: CollectionAchievementView[];
  cosmetics: CollectionCosmeticView[];
  equipped: EquippedCosmeticsView;
  showcasedAchievementIds: string[];
  systemRecovery: SystemRecoveryView;
  newlyUnlockedAchievementIds: string[];
  syncedAt: string;
}

