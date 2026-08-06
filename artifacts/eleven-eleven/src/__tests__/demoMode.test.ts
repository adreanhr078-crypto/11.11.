import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHAPTER_01_PUZZLES } from '../content/puzzles/chapter01Campaign';
import {
  createDemoProgressReadModel,
  readDemoModeConfig,
} from '../app/demo/demoMode';

describe('demo mode', () => {
  it('is opt-in and accepts only web destinations', () => {
    assert.deepEqual(readDemoModeConfig({}), {
      enabled: false,
      fullGameUrl: null,
    });
    assert.deepEqual(readDemoModeConfig({
      VITE_DEMO_MODE: ' TRUE ',
      VITE_FULL_GAME_URL: 'https://example.com/full-game',
    }), {
      enabled: true,
      fullGameUrl: 'https://example.com/full-game',
    });
    assert.equal(readDemoModeConfig({
      VITE_DEMO_MODE: 'true',
      VITE_FULL_GAME_URL: 'javascript:alert(1)',
    }).fullGameUrl, null);
  });

  it('counts only unique puzzles from the published Chapter 1 campaign', () => {
    const firstId = CHAPTER_01_PUZZLES[0]?.id ?? '';
    const progress = createDemoProgressReadModel([
      firstId,
      firstId,
      'puzzle_from_deferred_content',
    ]);

    assert.equal(progress.completed, 1);
    assert.equal(progress.total, 20);
    assert.equal(progress.remaining, 19);
    assert.equal(progress.boundaryReached, false);
  });

  it('reaches the demo boundary without changing campaign state', () => {
    const completedIds = CHAPTER_01_PUZZLES.map((puzzle) => puzzle.id);
    const progress = createDemoProgressReadModel(completedIds);

    assert.deepEqual(progress, {
      completed: 20,
      total: 20,
      remaining: 0,
      percentage: 100,
      boundaryReached: true,
    });
    assert.deepEqual(completedIds,
      CHAPTER_01_PUZZLES.map((puzzle) => puzzle.id),
    );
  });
});
