import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  FINAL_MANHWA_PAGE_COUNT,
  FINAL_MANHWA_PAGES,
  FINAL_MANHWA_RELEASED_PAGE_COUNT,
} from '../content/manhwa/finalManhwa';
import {
  STORY_PUZZLES,
} from '../content/puzzles/storyPuzzleCatalog';
import {
  deriveStoryPuzzleManhwaAccess,
} from '../domain/manhwa/storyPuzzleManhwaAccess';

const MAIN_PUZZLES = STORY_PUZZLES
  .filter((puzzle) => puzzle.classification === 'main')
  .sort((left, right) => left.order - right.order);

describe('Story Puzzle Manhwa access', () => {
  it('starts with only the approved reading window needed to reach the first clue', () => {
    const access = deriveStoryPuzzleManhwaAccess([]);
    assert.equal(access.maxAccessibleGlobalPage, 7);
    assert.equal(access.accessiblePageIds.length, 7);
    assert.equal(
      access.nextGatePuzzleId,
      'story_puzzle_01_echo_network_signal_sync',
    );
    assert.equal(access.allMainPuzzlesCompleted, false);
    assert.ok(access.accessiblePageIds.every((pageId) => (
      pageId.startsWith('echo_network_final_2026_09_v1_page_')
    )));
  });

  it('reveals the second clue but never crosses the published opening boundary', () => {
    const completed: string[] = [];
    for (let index = 0; index < MAIN_PUZZLES.length; index += 1) {
      const current = MAIN_PUZZLES[index]!;
      completed.push(current.id);
      const access = deriveStoryPuzzleManhwaAccess(completed);
      const next = MAIN_PUZZLES[index + 1];
      assert.equal(
        access.maxAccessibleGlobalPage,
        Math.min(
          next?.source.globalPageNumber ?? FINAL_MANHWA_PAGE_COUNT,
          FINAL_MANHWA_RELEASED_PAGE_COUNT,
        ),
      );
    }
  });

  it('never lets a V2 puzzle ID bypass a current publication gate', () => {
    const baseline = deriveStoryPuzzleManhwaAccess([]);
    const withLegacyPuzzleIds = deriveStoryPuzzleManhwaAccess([
      'story_puzzle_01_signal_calibration',
      'story_puzzle_03_torn_memory',
      'story_puzzle_20_core_sequence',
    ]);
    assert.deepEqual(withLegacyPuzzleIds, baseline);
  });

  it('publishes exactly pages 1–9 while retaining the 70-page immutable source', () => {
    assert.equal(FINAL_MANHWA_PAGE_COUNT, 70);
    assert.equal(FINAL_MANHWA_PAGES.length, FINAL_MANHWA_PAGE_COUNT);
    assert.equal(FINAL_MANHWA_RELEASED_PAGE_COUNT, 9);
    assert.deepEqual(
      FINAL_MANHWA_PAGES.filter((page) => page.published)
        .map((page) => page.globalPageNumber),
      Array.from({ length: FINAL_MANHWA_RELEASED_PAGE_COUNT }, (_, index) => index + 1),
    );
    assert.equal(FINAL_MANHWA_PAGES[9]?.published, false);
    assert.equal(FINAL_MANHWA_PAGES.at(-1)?.published, false);
  });

  it('keeps pages 10–70 sealed after both approved opening puzzles', () => {
    const access = deriveStoryPuzzleManhwaAccess(
      MAIN_PUZZLES.map((puzzle) => puzzle.id),
    );
    assert.equal(access.totalMainPuzzleCount, 2);
    assert.equal(access.completedMainPuzzleCount, 2);
    assert.equal(access.maxAccessibleGlobalPage, FINAL_MANHWA_RELEASED_PAGE_COUNT);
    assert.equal(access.accessiblePageIds.length, FINAL_MANHWA_RELEASED_PAGE_COUNT);
    assert.equal(access.accessiblePageIds.includes(
      FINAL_MANHWA_PAGES[9]!.id,
    ), false);
    assert.equal(access.accessiblePageIds.includes(
      FINAL_MANHWA_PAGES.at(-1)!.id,
    ), false);
    assert.equal(access.nextGatePuzzleId, null);
    assert.equal(access.allMainPuzzlesCompleted, true);
  });

  it('passes only accessible pages to the fullscreen reader', () => {
    const source = readFileSync(
      new URL('../features/screens/MemoryScreen.tsx', import.meta.url),
      'utf8',
    );
    assert.match(source, /pages=\{readerPages\}/);
    assert.doesNotMatch(source, /pages=\{FINAL_MANHWA_PAGES\}/);
    assert.match(source, /data-locked=\{!readerPageIds\.has\(page\.id\)\}/);
    assert.match(source, /data-story-gated=\{!accessiblePageIds\.has\(page\.id\)\}/);
    assert.match(source, /firstUnreadPage/);
  });
});
