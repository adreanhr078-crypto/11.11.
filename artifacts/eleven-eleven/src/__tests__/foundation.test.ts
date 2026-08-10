import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CONTENT_COUNTS,
  CONTENT_MANIFEST,
  CHAPTER_DEFINITIONS,
  validateContentRegistry,
} from '../infrastructure/content/contentRegistry';
import {
  createInitialProgression,
  getChapterForPuzzleNumber,
  recordPuzzleOutcome,
} from '../domain/progression/progression';
import {
  applyEchoPersonalityEffects,
  createInitialEchoPersonality,
} from '../domain/echo/echoPersonality';
import {
  getAllPuzzles,
  getPuzzleByNumber,
  isAnswerCorrect,
} from '../core/puzzles/puzzleLoader';
import { migrateGameState } from '../infrastructure/persistence/gamePersistence';
import { useGameStore } from '../stores/gameStore';
import { inMemoryContentRepository } from '../infrastructure/content/inMemoryContentRepository';

describe('Phase 1 foundation', () => {
  it('validates the content manifest and scalable capacity', () => {
    assert.doesNotThrow(validateContentRegistry);
    assert.equal(CONTENT_COUNTS.chapters, 7);
    assert.equal(CONTENT_COUNTS.puzzles, 20);
    assert.equal(CONTENT_COUNTS.memories, 71);
    assert.ok(CONTENT_MANIFEST.capacity.puzzles >= 2000);
    assert.ok(CONTENT_MANIFEST.capacity.memories >= 2000);
  });

  it('uses one contiguous chapter progression map', () => {
    assert.equal(getChapterForPuzzleNumber(1, CHAPTER_DEFINITIONS), 'chapter_1');
    assert.equal(getChapterForPuzzleNumber(100, CHAPTER_DEFINITIONS), 'chapter_1');
    assert.equal(getChapterForPuzzleNumber(101, CHAPTER_DEFINITIONS), 'chapter_2');
    assert.equal(getChapterForPuzzleNumber(1000, CHAPTER_DEFINITIONS), 'chapter_7');
    assert.equal(getChapterForPuzzleNumber(1001, CHAPTER_DEFINITIONS), null);
  });

  it('does not complete a chapter until its configured range is resolved', () => {
    let progression = createInitialProgression(
      CONTENT_MANIFEST.contentVersion,
      CHAPTER_DEFINITIONS,
    );
    progression = recordPuzzleOutcome(
      progression,
      'puzzle_001',
      'chapter_1',
      'solved',
      CHAPTER_DEFINITIONS,
    );
    assert.equal(progression.completedPuzzleIds.length, 1);
    assert.deepEqual(progression.unlockedChapterIds, ['chapter_1']);
    assert.deepEqual(progression.completedChapterIds, []);
  });

  it('unlocks the next chapter only after the configured chapter range', () => {
    let progression = createInitialProgression(
      CONTENT_MANIFEST.contentVersion,
      CHAPTER_DEFINITIONS,
    );
    for (let index = 1; index <= 100; index += 1) {
      progression = recordPuzzleOutcome(
        progression,
        `puzzle_${String(index).padStart(3, '0')}`,
        'chapter_1',
        'solved',
        CHAPTER_DEFINITIONS,
      );
    }
    assert.ok(progression.completedChapterIds.includes('chapter_1'));
    assert.ok(progression.unlockedChapterIds.includes('chapter_2'));
    assert.equal(progression.currentChapterId, 'chapter_2');
  });

  it('boots safely with an empty authored puzzle registry', () => {
    assert.deepEqual(getAllPuzzles(), []);
    assert.equal(getPuzzleByNumber(1), undefined);
  });

  it('creates the active game state without browser-only bootstrap work', () => {
    const state = useGameStore.getState();
    assert.equal(Object.keys(state.chapters).length, 7);
    assert.equal(state.currentChapter, 'chapter_1');
    assert.equal(state.totalPuzzles, 20);
    assert.equal(state.puzzles.length, 0);
    assert.equal(state.memory.totalFragments, 20);
    assert.equal(state.currency, 0);
    assert.deepEqual(state.collectedMemoryFragments, []);
    assert.deepEqual(state.claimedPuzzleRewards, []);
    assert.deepEqual(state.unlockedManhwaPageIds, []);
    assert.deepEqual(state.viewedManhwaPageIds, []);
    assert.equal(state.progressionState.manhwa.unlockedPageIds.length, 71);
    assert.equal(state.progressionState.manhwa.unlockedPageIds[0], 'manhwa_ch00_page_01');
    assert.equal(state.progressionState.manhwa.unlockedPageIds.at(-1), 'manhwa_ch00_page_04');
    assert.equal(state.progressionState.echo.memoryStability, 5);
    assert.equal(state.progressionState.echo.memoriesRecovered, 0);
    assert.equal(state.progressionState.echo.humanity, 35);
    assert.equal(state.progressionState.echo.hope, 20);
    assert.equal(
      state.lastAvailablePuzzleId,
      'story_puzzle_01_signal_calibration',
    );
    assert.equal(state.echo.personality.trust, state.echo.trust);
    assert.equal(typeof state.actions.solve, 'function');
  });

  it('manages currency and unique memory fragments through store actions', () => {
    const actions = useGameStore.getState().actions;
    actions.setCurrency(10);
    actions.addCurrency(5.9);
    assert.equal(useGameStore.getState().currency, 15);
    assert.equal(actions.spendCurrency(4), true);
    assert.equal(actions.spendCurrency(99), false);
    assert.equal(useGameStore.getState().currency, 11);
    actions.setCurrency(-20);
    assert.equal(useGameStore.getState().currency, 0);

    actions.resetMemoryFragments();
    assert.equal(actions.collectMemoryFragment('fragment_test'), true);
    assert.equal(actions.collectMemoryFragment('fragment_test'), false);
    assert.equal(actions.hasMemoryFragment('fragment_test'), true);
    assert.deepEqual(
      useGameStore.getState().collectedMemoryFragments,
      ['fragment_test'],
    );

    actions.setCurrency(0);
    actions.resetMemoryFragments();
  });

  it('exposes paged content access for large future registries', async () => {
    const page = await inMemoryContentRepository.getPuzzles(
      'chapter_1',
      { limit: 50 },
    );
    assert.deepEqual(page.items, []);
    assert.equal(page.total, 0);
    assert.equal(page.nextCursor, null);
  });

  it('keeps answer matching independent from stored puzzle state', () => {
    const puzzle = { answers: ['11:11', 'eleven eleven'] };
    assert.equal(isAnswerCorrect(puzzle, '11:11'), true);
    assert.equal(isAnswerCorrect(puzzle, 'wrong'), false);
  });

  it('clamps canonical Echo personality effects', () => {
    const echo = createInitialEchoPersonality();
    const next = applyEchoPersonalityEffects(echo, {
      trust: 200,
      fear: -200,
      anger: 25,
    });
    assert.equal(next.trust, 100);
    assert.equal(next.fear, 0);
    assert.equal(next.anger, 25);
  });

  it('migrates legacy puzzle status into versioned progression', () => {
    const migrated = migrateGameState({
      currentChapter: 'chapter_2',
      puzzles: [
        { id: 'puzzle_001', status: 'solved' },
        { id: 'puzzle_002', status: 'skipped' },
      ],
      echo: {
        trust: 45,
        fear: 20,
        memoryStability: 30,
        corruption: 5,
        hope: 50,
        ragePoints: 10,
      },
    }, 0);
    assert.deepEqual(migrated.progression?.completedPuzzleIds, ['puzzle_001']);
    assert.deepEqual(migrated.progression?.skippedPuzzleIds, ['puzzle_002']);
    assert.equal(migrated.echo?.personality.trust, 45);
    assert.equal(migrated.currency, 0);
    assert.deepEqual(migrated.collectedMemoryFragments, []);
  });

  it('normalizes player resources when loading a save', () => {
    const migrated = migrateGameState({
      currency: 12.8,
      collectedMemoryFragments: [
        'fragment_a',
        'fragment_a',
        '',
        42,
        ' fragment_b ',
      ],
    }, 8);

    assert.equal(migrated.currency, 12);
    assert.deepEqual(
      migrated.collectedMemoryFragments,
      ['fragment_a', 'fragment_b'],
    );
  });
});
