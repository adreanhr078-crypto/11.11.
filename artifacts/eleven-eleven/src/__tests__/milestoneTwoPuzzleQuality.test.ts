import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Milestone 2 puzzle playability contract', () => {
  it('keeps multi-stage challenges sequential instead of allowing a future-stage jump', () => {
    const puzzle = source('src/features/screens/PuzzleScreen.tsx');
    assert.ok(puzzle.includes('if (!currentStage || !actionReadiness.ready) return;'));
    assert.ok(puzzle.includes('disabled={index > stageIndex || busy}'));
  });

  it('turns every authoritative rejected completion into a safe, mechanic-aware retry moment', () => {
    const puzzle = source('src/features/screens/PuzzleScreen.tsx');
    const store = source('src/features/story-puzzles/storyPuzzleStore.ts');
    const rejectionChecks = store.match(/error\.code === 'puzzle_not_verified'/g) ?? [];
    assert.ok(rejectionChecks.length >= 2);
    const completeHandler = store.slice(store.indexOf('async complete('), store.indexOf('async discover('));
    assert.ok(completeHandler.includes("error.code === 'puzzle_not_verified'"));
    assert.ok(completeHandler.includes("kind: 'puzzle-attempt-rejected'"));
    assert.ok(puzzle.includes('function retryGuidance(mechanic: StoryPuzzleMechanic, locale:'));
    assert.ok(puzzle.includes("latestActivity?.kind === 'puzzle-attempt-rejected'"));
    assert.ok(puzzle.includes('role="alert"'));
    assert.ok(puzzle.includes('aria-live="polite"'));
  });

  it('does not silently fill in a signal choice or expose a direct anomaly marker', () => {
    const puzzle = source('src/features/screens/PuzzleScreen.tsx');
    assert.equal(puzzle.includes("channel || 'channel-07'"), false);
    assert.equal(puzzle.includes("frequency || '42'"), false);
    assert.equal(puzzle.includes("cell === 'd3'"), false);
  });
});
