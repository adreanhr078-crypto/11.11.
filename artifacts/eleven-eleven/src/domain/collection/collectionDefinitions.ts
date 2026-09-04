import type {
  AchievementRewardDefinition,
  CollectionAchievementDefinition,
  CollectionChapterId,
  CosmeticType,
} from './collectionContracts';
import { STORY_PUZZLES } from '../../content/puzzles/storyPuzzleCatalog';

/** The active release exposes only the shards bound to published Story Puzzles. */
export const MEMORY_SHARD_TOTAL = STORY_PUZZLES.length;

export const MEMORY_SHARD_SETS: readonly {
  chapterId: CollectionChapterId;
  order: number;
  shardIds: readonly string[];
}[] = Object.freeze(([
  ['chapter_1', 1, 3],
  ['chapter_2', 2, 5],
  ['chapter_3', 3, 7],
  ['chapter_4', 4, 5],
] as const).map(([chapterId, order]) => ({
  chapterId,
  order,
  shardIds: Object.freeze(
    STORY_PUZZLES
      .filter((puzzle) => puzzle.chapterId === chapterId)
      .map((puzzle) => `story_puzzle_shard_${String(puzzle.order).padStart(2, '0')}`),
  ),
})));

export const SECRET_SIGNAL_PUZZLE_IDS = Object.freeze(
  STORY_PUZZLES
    .filter((puzzle) => puzzle.classification === 'secret')
    .map((puzzle) => puzzle.id),
);

export const COSMETIC_CATALOG: readonly {
  id: string;
  type: CosmeticType;
  label: string;
}[] = Object.freeze([
  { id: 'title_signal_found', type: 'title', label: 'SIGNAL FOUND' },
  { id: 'title_memory_seeker', type: 'title', label: 'MEMORY SEEKER' },
  { id: 'title_system_reclaimer', type: 'title', label: 'SYSTEM RECLAIMER' },
  { id: 'frame_recovered_cyan', type: 'frame', label: 'RECOVERED // CYAN' },
  { id: 'frame_black_signal', type: 'frame', label: 'BLACK SIGNAL' },
  { id: 'badge_shard_protocol', type: 'badge', label: 'SHARD PROTOCOL' },
  { id: 'badge_system_recovery', type: 'badge', label: 'SYSTEM RECOVERY' },
  { id: 'system_border_recovery', type: 'system-border', label: 'RECOVERY BORDER' },
]);

const noEconomyReward = (cosmetics: readonly string[] = []): AchievementRewardDefinition => ({
  // Cosmetic ownership is the release reward. XP/Coins remain server-owned
  // and intentionally zero until balance is approved by the owner.
  xp: 0,
  coins: 0,
  cosmetics,
});

export const PHASE5_ACHIEVEMENT_DEFINITIONS: readonly CollectionAchievementDefinition[] = Object.freeze([
  { id: 'story_chapter_01_complete', name: 'FIRST SIGNAL', description: 'Complete Chapter 1.', category: 'story', hidden: false, presentationTier: 'rare', icon: 'signal', condition: { kind: 'chapter-completed', chapterId: 'chapter_1' }, reward: noEconomyReward(['title_signal_found']) },
  { id: 'story_chapter_02_complete', name: 'SECOND CHANNEL', description: 'Complete Chapter 2.', category: 'story', hidden: false, presentationTier: 'rare', icon: 'chapter', condition: { kind: 'chapter-completed', chapterId: 'chapter_2' }, reward: noEconomyReward() },
  { id: 'story_chapter_03_complete', name: 'DEEPER RECORD', description: 'Complete Chapter 3.', category: 'story', hidden: false, presentationTier: 'rare', icon: 'record', condition: { kind: 'chapter-completed', chapterId: 'chapter_3' }, reward: noEconomyReward() },
  { id: 'story_chapter_04_complete', name: 'FINAL CURRENT', description: 'Complete Chapter 4.', category: 'story', hidden: false, presentationTier: 'rare', icon: 'current', condition: { kind: 'chapter-completed', chapterId: 'chapter_4' }, reward: noEconomyReward() },
  { id: 'story_protocol_complete', name: 'STORY PROTOCOL COMPLETE', description: 'Complete the current story protocol.', category: 'story', hidden: false, presentationTier: 'system', icon: 'protocol', condition: { kind: 'story-completed' }, reward: noEconomyReward(['badge_shard_protocol']) },
  { id: 'puzzle_first_verified', name: 'FIRST VERIFICATION', description: 'Solve one verified Story Puzzle.', category: 'puzzle', hidden: false, presentationTier: 'standard', icon: 'puzzle', condition: { kind: 'puzzles-completed', classification: 'all', target: 1 }, reward: noEconomyReward() },
  { id: 'puzzle_main_protocol', name: 'MAIN PROTOCOL', description: 'Solve all 14 Main Puzzles.', category: 'puzzle', hidden: false, presentationTier: 'rare', icon: 'matrix', condition: { kind: 'puzzles-completed', classification: 'main', target: 14 }, reward: noEconomyReward() },
  { id: 'puzzle_perfect_first', name: 'CLEAN SIGNAL', description: 'Complete one Puzzle without using a hint.', category: 'puzzle', hidden: false, presentationTier: 'standard', icon: 'clean', condition: { kind: 'perfect-solves', classification: 'all', target: 1 }, reward: noEconomyReward() },
  { id: 'puzzle_perfect_five', name: 'CONTROLLED HAND', description: 'Complete five Puzzles without using hints.', category: 'mastery', hidden: false, presentationTier: 'rare', icon: 'control', condition: { kind: 'perfect-solves', classification: 'all', target: 5 }, reward: noEconomyReward() },
  { id: 'puzzle_perfect_main', name: 'UNBROKEN PROTOCOL', description: 'Perfect-solve all 14 Main Puzzles.', category: 'mastery', hidden: false, presentationTier: 'system', icon: 'unbroken', condition: { kind: 'perfect-solves', classification: 'main', target: 14 }, reward: noEconomyReward(['frame_recovered_cyan']) },
  { id: 'memory_first_shard', name: 'FIRST RECOVERY', description: 'Recover one verified Memory Shard.', category: 'memory', hidden: false, presentationTier: 'standard', icon: 'shard', condition: { kind: 'shards-collected', target: 1 }, reward: noEconomyReward() },
  { id: 'memory_ten_shards', name: 'HALF-LIFE SIGNAL', description: 'Recover 10 Memory Shards.', category: 'memory', hidden: false, presentationTier: 'rare', icon: 'shards', condition: { kind: 'shards-collected', target: 10 }, reward: noEconomyReward() },
  { id: 'memory_all_shards', name: 'ALL STORY SHARDS RECOVERED', description: 'Recover all 20 Memory Shards.', category: 'memory', hidden: false, presentationTier: 'system', icon: 'recovery', condition: { kind: 'shards-collected', target: 20 }, reward: noEconomyReward(['title_memory_seeker']) },
  { id: 'memory_chapter_set', name: 'CHAPTER MEMORY SIGNAL', description: 'Complete one Chapter Memory Shard Set.', category: 'memory', hidden: false, presentationTier: 'rare', icon: 'set', condition: { kind: 'chapter-shard-set', target: 1 }, reward: noEconomyReward() },
  { id: 'memory_reconstruction', name: 'RECONSTRUCTION WINDOW', description: 'Complete one optional Memory Reconstruction.', category: 'memory', hidden: false, presentationTier: 'rare', icon: 'reconstruct', condition: { kind: 'reconstructions-completed', target: 1 }, reward: noEconomyReward() },
  { id: 'exploration_first_secret_signal', name: 'UNKNOWN SIGNAL', description: 'Discover your first verified Secret Signal.', category: 'exploration', hidden: false, presentationTier: 'rare', icon: 'anomaly', condition: { kind: 'secret-signals-discovered', target: 1 }, reward: noEconomyReward() },
  { id: 'exploration_three_secret_signals', name: 'PATTERN IN THE NOISE', description: 'Discover three verified Secret Signals.', category: 'exploration', hidden: false, presentationTier: 'rare', icon: 'noise', condition: { kind: 'secret-signals-discovered', target: 3 }, reward: noEconomyReward() },
  { id: 'exploration_all_secret_signals', name: 'SIXTH SIGNAL', description: 'Discover all six Secret Signals.', category: 'exploration', hidden: false, presentationTier: 'system', icon: 'sixth', condition: { kind: 'secret-signals-discovered', target: 6 }, reward: noEconomyReward(['frame_black_signal']) },
  { id: 'character_first_moment', name: 'ATTACHED RECORD', description: 'Unlock an approved Character Moment.', category: 'character', hidden: false, presentationTier: 'standard', icon: 'character', condition: { kind: 'character-moment', target: 1 }, reward: noEconomyReward() },
  { id: 'character_lina_protocol', name: 'LINA PROTOCOL', description: 'Reach the verified partial Lina file.', category: 'character', hidden: true, presentationTier: 'rare', icon: 'classified', condition: { kind: 'canon-event', eventId: 'manhwa_chapter_04_lina_protocol' }, reward: noEconomyReward() },
  { id: 'classified_black_coronation', name: 'BLACK CORONATION', description: 'Reach the verified Canon signal.', category: 'secret', hidden: true, presentationTier: 'system', icon: 'classified', condition: { kind: 'canon-event', eventId: 'manhwa_chapter_04_black_coronation' }, reward: noEconomyReward() },
  { id: 'classified_black_echo_protocol', name: 'BLACK ECHO PROTOCOL', description: 'Reach the verified Canon signal.', category: 'secret', hidden: true, presentationTier: 'system', icon: 'classified', condition: { kind: 'canon-event', eventId: 'manhwa_chapter_04_black_echo_protocol' }, reward: noEconomyReward() },
  { id: 'mastery_no_hint_five', name: 'NOISELESS HAND', description: 'Complete ten verified Puzzles without hints.', category: 'mastery', hidden: false, presentationTier: 'rare', icon: 'mastery', condition: { kind: 'no-hint-solves', target: 10 }, reward: noEconomyReward() },
  { id: 'system_recovery_75', name: 'RECOVERY THRESHOLD', description: 'Reach 75% SYSTEM RECOVERY.', category: 'mastery', hidden: false, presentationTier: 'rare', icon: 'threshold', condition: { kind: 'system-recovery', target: 75 }, reward: noEconomyReward() },
  { id: 'system_recovery_100', name: 'SYSTEM RECOVERY COMPLETE', description: 'Recover 100% of the current verified collection.', category: 'mastery', hidden: false, presentationTier: 'system', icon: 'complete', condition: { kind: 'system-recovery', target: 100 }, reward: noEconomyReward(['title_system_reclaimer', 'badge_system_recovery', 'system_border_recovery']) },
]);

export const PHASE5_ACHIEVEMENT_BY_ID = Object.freeze(
  Object.fromEntries(PHASE5_ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.id, definition]))
);

export function cosmeticById(id: string) {
  return COSMETIC_CATALOG.find((cosmetic) => cosmetic.id === id);
}
