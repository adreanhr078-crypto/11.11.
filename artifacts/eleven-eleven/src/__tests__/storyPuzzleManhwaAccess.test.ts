import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  FINAL_MANHWA_PAGE_COUNT,
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
  it('starts with only the reading window needed to reach the first clue', () => {
    const access = deriveStoryPuzzleManhwaAccess([]);
    assert.equal(access.maxAccessibleGlobalPage, 4);
    assert.equal(access.accessiblePageIds.length, 4);
    assert.equal(access.nextGatePuzzleId, 'story_puzzle_01_signal_calibration');
    assert.equal(access.allMainPuzzlesCompleted, false);
  });

  it('reveals each next clue window from main completions only', () => {
    const completed: string[] = [];
    for (let index = 0; index < MAIN_PUZZLES.length; index += 1) {
      const current = MAIN_PUZZLES[index]!;
      completed.push(current.id);
      const access = deriveStoryPuzzleManhwaAccess(completed);
      const next = MAIN_PUZZLES[index + 1];
      assert.equal(
        access.maxAccessibleGlobalPage,
        next?.source.globalPageNumber ?? FINAL_MANHWA_PAGE_COUNT,
      );
    }
  });

  it('never lets an optional secret puzzle bypass a main story gate', () => {
    const baseline = deriveStoryPuzzleManhwaAccess([]);
    const withSecret = deriveStoryPuzzleManhwaAccess([
      'story_puzzle_03_torn_memory',
      'story_puzzle_05_color_protocol',
    ]);
    assert.deepEqual(withSecret, baseline);
  });

  it('places every secret clue inside the reading window opened by its main prerequisite', () => {
    for (const secret of STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'secret')) {
      const hostOrder = STORY_PUZZLES.find((puzzle) => (
        puzzle.id === secret.anomalyHostPuzzleId
      ))?.order ?? 0;
      const completedMainPrerequisites = MAIN_PUZZLES
        .filter((puzzle) => puzzle.order <= hostOrder)
        .map((puzzle) => puzzle.id);
      const access = deriveStoryPuzzleManhwaAccess(completedMainPrerequisites);
      assert.ok(
        secret.source.globalPageNumber <= access.maxAccessibleGlobalPage,
        `${secret.id} clue is outside its reachable reading window`,
      );
    }
  });

  it('unlocks the complete 71-page publication after all 14 main puzzles', () => {
    const access = deriveStoryPuzzleManhwaAccess(
      MAIN_PUZZLES.map((puzzle) => puzzle.id),
    );
    assert.equal(access.maxAccessibleGlobalPage, 71);
    assert.equal(access.accessiblePageIds.length, 71);
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
