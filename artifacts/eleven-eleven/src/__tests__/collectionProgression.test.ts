import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MEMORY_SHARD_SETS,
  PHASE5_ACHIEVEMENT_DEFINITIONS,
  SECRET_SIGNAL_PUZZLE_IDS,
} from '../domain/collection/collectionDefinitions';
import {
  createCollectionAchievementViews,
  createDefaultCollectionSignals,
  createSystemRecovery,
} from '../domain/collection/collectionProgression';
import { STORY_PUZZLES, STORY_PUZZLE_COUNTS } from '../content/puzzles/storyPuzzleCatalog';

describe('Phase 5 memory collection definitions', () => {
  it('keeps the verified 14 main / 6 secret split and 20 unique shards', () => {
    assert.deepEqual(STORY_PUZZLE_COUNTS, { total: 20, main: 14, secret: 6 });
    assert.deepEqual(MEMORY_SHARD_SETS.map((set) => set.shardIds.length), [3, 5, 7, 5]);
    const shardIds = MEMORY_SHARD_SETS.flatMap((set) => set.shardIds);
    assert.equal(new Set(shardIds).size, 20);
    assert.equal(SECRET_SIGNAL_PUZZLE_IDS.length, 6);
    assert.equal(STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'secret').length, 6);
  });
});

describe('Phase 5 collection progression', () => {
  it('opens reconstruction only after a complete chapter shard set', () => {
    const set = MEMORY_SHARD_SETS[0]!;
    const signals = createDefaultCollectionSignals();
    signals.shardsCollected = set.shardIds.length;
    signals.completedChapterShardSets = 1;
    assert.equal(signals.completedChapterShardSets, 1);
    assert.equal(set.shardIds.length, 3);
  });

  it('keeps Secrets Found separate from shard progress', () => {
    const signals = createDefaultCollectionSignals();
    signals.shardsCollected = 20;
    signals.canonicalSecretsFound = 0;
    signals.canonicalSecretsKnown = 0;
    assert.equal(createSystemRecovery(signals).secrets, 100);
    assert.equal(signals.canonicalSecretsFound, 0);
  });

  it('does not include XP, coins, level, or rank in recovery', () => {
    const signals = createDefaultCollectionSignals();
    signals.shardsCollected = 10;
    const before = createSystemRecovery(signals);
    const after = createSystemRecovery({ ...signals });
    assert.deepEqual(after, before);
  });

  it('masks hidden achievement names and descriptions before unlock', () => {
    const signals = createDefaultCollectionSignals();
    const hidden = PHASE5_ACHIEVEMENT_DEFINITIONS.find((definition) => definition.hidden)!;
    const locked = createCollectionAchievementViews(
      [hidden],
      signals,
      {},
      0,
    )[0]!;
    assert.equal(locked.unlocked, false);
    assert.equal(locked.name, 'CLASSIFIED');
    assert.equal(locked.description, 'DATA UNAVAILABLE');
  });

  it('supports a complete known collection without requiring owner content', () => {
    const signals = createDefaultCollectionSignals();
    signals.completedChapterIds = ['chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'];
    signals.mainPuzzlesCompleted = 14;
    signals.allPuzzlesCompleted = 20;
    signals.mainPerfectSolves = 14;
    signals.allPerfectSolves = 20;
    signals.shardsCollected = 20;
    signals.completedChapterShardSets = 4;
    signals.reconstructionsCompleted = 4;
    signals.secretSignalsDiscovered = 6;
    signals.characterMomentsUnlocked = 1;
    signals.reachedCanonEventIds = new Set([
      'manhwa_chapter_04_lina_protocol',
      'manhwa_chapter_04_black_coronation',
      'manhwa_chapter_04_black_echo_protocol',
    ]);
    signals.noHintSolves = 20;
    signals.archiveDiscovered = 2;
    signals.archiveKnown = 2;
    signals.unlockedAchievementCount = PHASE5_ACHIEVEMENT_DEFINITIONS.length;
    assert.equal(createSystemRecovery(signals).percent, 100);
  });
});

