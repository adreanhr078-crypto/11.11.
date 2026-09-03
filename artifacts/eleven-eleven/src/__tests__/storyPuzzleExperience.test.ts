import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
  FINAL_MANHWA_RELEASED_PAGE_COUNT,
} from '../content/manhwa/finalManhwa';
import {
  STORY_PUZZLE_BY_ID,
  STORY_PUZZLE_COUNTS,
  STORY_PUZZLE_ECHO_IMPACTS,
  STORY_PUZZLE_MEMORY_SHARD_IDS,
  STORY_PUZZLES,
} from '../content/puzzles/storyPuzzleCatalog';
import {
  isServerStoryPuzzleSubmissionCorrect,
  SERVER_STORY_PUZZLE_BY_ID,
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

type TestSolution = {
  tokens?: readonly string[];
  assignments?: Readonly<Record<string, string>>;
  imageOrder?: readonly string[];
  rotations?: Readonly<Record<string, number>>;
  stages?: readonly TestSolution[];
};

function draftFromServerSolution(
  solution: TestSolution,
  stageIndex = 0,
): ReturnType<typeof parseStoryPuzzleDraft> {
  if (solution.stages) {
    return draft({
      stageIndex,
      assignments: {
        __stages: JSON.stringify(solution.stages.map((stage, index) => (
          draftFromServerSolution(stage, index)
        ))),
      },
    });
  }
  return draft({
    stageIndex,
    tokens: [...(solution.tokens ?? [])],
    assignments: { ...(solution.assignments ?? {}) },
    imageOrder: [...(solution.imageOrder ?? [])],
    rotations: { ...(solution.rotations ?? {}) },
  });
}

describe('corrected opening Story Puzzle catalog', () => {
  it('publishes exactly two main puzzles from Chapter 1', () => {
    assert.deepEqual(STORY_PUZZLE_COUNTS, { total: 2, main: 2, secret: 0 });
    assert.deepEqual(
      STORY_PUZZLES.map((puzzle) => [puzzle.id, puzzle.chapterId, puzzle.order]),
      [
        ['story_puzzle_01_echo_network_signal_sync', 'chapter_1', 1],
        ['story_puzzle_02_echo_network_archive_route', 'chapter_1', 2],
      ],
    );
  });

  it('anchors every opening puzzle to a released page in the immutable new edition', () => {
    assert.equal(new Set(STORY_PUZZLE_MEMORY_SHARD_IDS).size, 2);
    assert.ok(STORY_PUZZLES.every((puzzle) => puzzle.hints.length === 3));
    assert.ok(STORY_PUZZLES.every((puzzle) => (
      puzzle.source.globalPageNumber > 0
      && puzzle.source.globalPageNumber <= FINAL_MANHWA_RELEASED_PAGE_COUNT
      && puzzle.source.pageId === FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[
        puzzle.source.globalPageNumber
      ]?.id
      && FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[puzzle.source.globalPageNumber]?.published
    )));
    assert.deepEqual(
      STORY_PUZZLES.map((puzzle) => puzzle.source.globalPageNumber),
      [7, 9],
    );
    assert.ok(STORY_PUZZLES.every((puzzle) => (
      puzzle.source.pageId.startsWith('echo_network_final_2026_09_v1_page_')
    )));
    assert.deepEqual(STORY_PUZZLE_HINT_COSTS, [4, 8, 14]);
  });

  it('keeps the two approved opening mechanics distinct and self-briefed', () => {
    assert.equal(new Set(STORY_PUZZLES.map((puzzle) => puzzle.mechanic)).size, 2);
    assert.ok(STORY_PUZZLES.every((puzzle) => puzzle.brief && puzzle.reference));
    assert.ok(STORY_PUZZLES.every((puzzle) => (
      !puzzle.stages || puzzle.stages.every((stage) => stage.clue)
    )));
  });

  it('keeps authoritative server solutions and Echo impacts in one-to-one alignment', () => {
    for (const puzzle of STORY_PUZZLES) {
      const definition = SERVER_STORY_PUZZLE_BY_ID[puzzle.id];
      assert.ok(definition, `missing server definition: ${puzzle.id}`);
      assert.equal(
        isServerStoryPuzzleSubmissionCorrect(
          puzzle.id,
          draftFromServerSolution(definition.solution),
        ),
        true,
        `official solution is not accepted: ${puzzle.id}`,
      );
      assert.ok(STORY_PUZZLE_ECHO_IMPACTS[puzzle.id], `missing Echo impact: ${puzzle.id}`);
    }
    assert.deepEqual(
      Object.keys(STORY_PUZZLE_ECHO_IMPACTS).sort(),
      STORY_PUZZLES.map((puzzle) => puzzle.id).sort(),
    );
    assert.deepEqual(
      Object.keys(SERVER_STORY_PUZZLE_BY_ID).sort(),
      STORY_PUZZLES.map((puzzle) => puzzle.id).sort(),
    );
  });

  it('does not bind an unreconciled transformation or retired puzzle to the active slice', () => {
    assert.deepEqual(
      STORY_PUZZLES.filter((puzzle) => puzzle.cinematicStageId),
      [],
    );
    assert.equal(STORY_PUZZLE_BY_ID.story_puzzle_03_torn_memory, undefined);
    assert.equal(STORY_PUZZLE_BY_ID.story_puzzle_20_core_sequence, undefined);
    assert.equal(SERVER_STORY_PUZZLE_BY_ID.story_puzzle_01_signal_calibration, undefined);
  });

  it('verifies both opening solutions only in the server definition', () => {
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_01_echo_network_signal_sync',
      draft({ tokens: ['58', 'channel-11'] }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_02_echo_network_archive_route',
      draft({ tokens: ['signal', 'access', 'memory', 'echo'] }),
    ), true);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_01_echo_network_signal_sync',
      draft({ tokens: ['59', 'channel-11'] }),
    ), false);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_02_echo_network_archive_route',
      draft({ tokens: ['signal', 'memory', 'access', 'echo'] }),
    ), false);
    assert.equal(isServerStoryPuzzleSubmissionCorrect(
      'story_puzzle_01_signal_calibration',
      draft({ tokens: ['58', 'channel-11'] }),
    ), false);
  });

  it('rejects a client-supplied reward value at the draft boundary', () => {
    assert.throws(
      () => parseStoryPuzzleDraft({
        stageIndex: 0, tokens: [], assignments: {}, imageOrder: [], rotations: {}, xp: 999_999,
      }),
      (error) => error instanceof PlayerApiError && error.code === 'invalid_puzzle_state',
    );
  });

  it('keeps append-only receipt ledgers and a separate mutable draft table', () => {
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

  it('does not migrate retired local campaign progress into the corrected opening campaign', () => {
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
      'story_puzzle_01_echo_network_signal_sync',
    );
  });
});
