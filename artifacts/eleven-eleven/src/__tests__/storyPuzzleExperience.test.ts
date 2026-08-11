import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  STORY_PUZZLE_BY_ID,
  STORY_PUZZLE_COUNTS,
  STORY_PUZZLE_MEMORY_SHARD_IDS,
  STORY_PUZZLES,
} from '../content/puzzles/storyPuzzleCatalog';
import {
  isServerStoryPuzzleSubmissionCorrect,
  STORY_PUZZLE_HINT_COSTS,
} from '../../functions/api/player/_storyPuzzleDefinitions';
import { parseStoryPuzzleDraft } from '../../functions/api/player/_storyPuzzles';
import { PlayerApiError } from '../../functions/api/player/_shared';
import { migrateGameState } from '../infrastructure/persistence/gamePersistence';

function draft(input: Partial<ReturnType<typeof parseStoryPuzzleDraft>>) {
  return parseStoryPuzzleDraft({
    stageIndex: 0,
    tokens: [],
    assignments: {},
    imageOrder: [],
    rotations: {},
    ...input,
  });
}

describe('Phase 3 Story Puzzle catalog', () => {
  it('has exactly 20 official experiences with the approved main/secret split', () => {
    assert.deepEqual(STORY_PUZZLE_COUNTS, { total: 20, main: 14, secret: 6 });
    assert.equal(STORY_PUZZLES.filter((puzzle) => puzzle.chapterId === 'chapter_1').length, 3);
    assert.equal(STORY_PUZZLES.filter((puzzle) => puzzle.chapterId === 'chapter_2').length, 5);
    assert.equal(STORY_PUZZLES.filter((puzzle) => puzzle.chapterId === 'chapter_3').length, 7);
    assert.equal(STORY_PUZZLES.filter((puzzle) => puzzle.chapterId === 'chapter_4').length, 5);
  });

  it('keeps rewards and Canon-safe reader triggers centralized', () => {
    assert.equal(new Set(STORY_PUZZLE_MEMORY_SHARD_IDS).size, 20);
    assert.ok(STORY_PUZZLES.every((puzzle) => puzzle.hints.length === 3));
    assert.ok(STORY_PUZZLES.every((puzzle) => puzzle.source.globalPageNumber >= 3 && puzzle.source.globalPageNumber <= 69));
    assert.ok(STORY_PUZZLES.every((puzzle) => puzzle.source.globalPageNumber !== 70 && puzzle.source.globalPageNumber !== 71));
    assert.deepEqual(STORY_PUZZLE_HINT_COSTS, [0, 12, 24]);
  });

  it('does not repeat a primary mechanic anywhere in the 20-puzzle campaign', () => {
    assert.equal(
      new Set(STORY_PUZZLES.map((puzzle) => puzzle.mechanic)).size,
      STORY_PUZZLES.length,
    );
  });

  it('uses canonical images for distinct reconstruction and layer-alignment mechanics', () => {
    for (const id of ['story_puzzle_03_torn_memory', 'story_puzzle_16_memory_reconstruction']) {
      const puzzle = STORY_PUZZLE_BY_ID[id];
      assert.ok(puzzle?.image);
      assert.match(puzzle!.image!.src, /^\/manhwa\/final\/page-\d{3}\.webp$/);
    }
    assert.equal(STORY_PUZZLE_BY_ID.story_puzzle_03_torn_memory?.mechanic, 'image-reconstruction');
    assert.equal(STORY_PUZZLE_BY_ID.story_puzzle_16_memory_reconstruction?.mechanic, 'layer-alignment');
  });

  it('verifies the solution only inside the server definition', () => {
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_01_signal_calibration',
      draft({ tokens: ['58', 'channel-11'] }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_16_memory_reconstruction',
      draft({ rotations: { layer1: 1, layer2: 0, layer3: 3, layer4: 2 } }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_18_emergency_reroute',
      draft({ assignments: { power: '40', data: '30', cooling: '30' } }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_01_signal_calibration',
      draft({ tokens: ['59', 'channel-11'] }),
    ), false);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_03_torn_memory',
      draft({
        imageOrder: Array.from({ length: 9 }, (_, index) => `piece-${index}`),
        rotations: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`piece-${index}`, 0])),
      }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_14_system_matrix',
      draft({ rotations: { tile1: 1, tile2: 2, tile3: 0, tile4: 3 } }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_15_system_breach',
      draft({
        assignments: {
          __stages: JSON.stringify([
            { stageIndex: 0, tokens: ['74', 'channel-11'], assignments: {}, imageOrder: [], rotations: {} },
            { stageIndex: 1, tokens: ['memory'], assignments: {}, imageOrder: [], rotations: {} },
            { stageIndex: 2, tokens: [], assignments: { access: 'echo' }, imageOrder: [], rotations: {} },
          ]),
        },
      }),
    ), true);
  });

  it('rejects a client-supplied reward value at the draft boundary', () => {
    assert.throws(
      () => parseStoryPuzzleDraft({
        stageIndex: 0, tokens: [], assignments: {}, imageOrder: [], rotations: {}, xp: 999_999,
      }),
      (error) => error instanceof PlayerApiError && error.code === 'invalid_puzzle_state',
    );
  });

  it('has append-only ledgers and a separate mutable draft table', () => {
    const migration = readFileSync(new URL('../../migrations/0005_story_puzzle_experience.sql', import.meta.url), 'utf8');
    const atomicHintMigration = readFileSync(new URL('../../migrations/0006_story_puzzle_hint_atomic_spend.sql', import.meta.url), 'utf8');
    for (const table of [
      'player_story_puzzle_completion_events',
      'player_story_puzzle_discovery_events',
      'player_story_puzzle_hint_events',
      'player_coin_events',
    ]) {
      assert.match(migration, new RegExp(`BEFORE UPDATE ON ${table}`));
      assert.match(migration, new RegExp(`BEFORE DELETE ON ${table}`));
    }
    assert.match(migration, /CREATE TABLE IF NOT EXISTS player_story_puzzle_progress/);
    assert.doesNotMatch(migration, /BEFORE UPDATE ON player_story_puzzle_progress/);
    assert.match(atomicHintMigration, /BEFORE INSERT ON player_story_puzzle_hint_events/);
    assert.match(atomicHintMigration, /AFTER INSERT ON player_story_puzzle_hint_events/);
    assert.match(atomicHintMigration, /COALESCE\(SUM\(amount\), 0\)/);
    assert.match(atomicHintMigration, /'story_puzzle_hint'/);
  });

  it('surfaces server-discoverable secret signals even after their host is complete', () => {
    const screen = readFileSync(
      new URL('../features/screens/PuzzleScreen.tsx', import.meta.url),
      'utf8',
    );
    assert.match(screen, /discoverableSecretIds\.map/);
    assert.match(screen, /story-puzzle-index__discovery/);
    assert.match(screen, /actions\.discover\(secretId\)/);
  });

  it('never migrates retired local campaign progress into Story Puzzle progress', () => {
    const migrated = migrateGameState({
      progression: {
        contentVersion: 'legacy',
        currentChapterId: 'chapter_1',
        completedPuzzleIds: ['puzzle_001_broken_pulse'],
        skippedPuzzleIds: ['puzzle_002_do_not_look_back'],
        unlockedChapterIds: ['chapter_1'],
        completedChapterIds: [],
      },
      puzzleProgress: {
        puzzle_001_broken_pulse: [{ stageIndex: 0, values: ['legacy'], matches: {} }],
      },
      claimedPuzzleRewards: ['puzzle_001_broken_pulse'],
      unlockedHintTiersByPuzzle: {
        puzzle_001_broken_pulse: ['observation'],
      },
      collectedMemoryFragments: ['page02_shard_01'],
    }, 0);

    assert.deepEqual(migrated.progression?.completedPuzzleIds, []);
    assert.deepEqual(migrated.progression?.skippedPuzzleIds, []);
    assert.deepEqual(migrated.puzzleProgress, {});
    assert.deepEqual(migrated.claimedPuzzleRewards, []);
    assert.deepEqual(migrated.unlockedHintTiersByPuzzle, {});
    assert.deepEqual(migrated.collectedMemoryFragments, []);
    assert.equal(
      migrated.lastAvailablePuzzleId,
      'story_puzzle_01_signal_calibration',
    );
  });
});
