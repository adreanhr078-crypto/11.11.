import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PlayerProgressionApiError } from '../infrastructure/player-progression/playerProgressionApi';
import { friendlyError } from '../features/story-puzzles/storyPuzzleStore';

describe('Story puzzle client error presentation', () => {
  it('explains a raced post-completion hint purchase without suggesting a retry or a solution', () => {
    const error = new PlayerProgressionApiError(
      409,
      'puzzle_completed',
      'Hints cannot be purchased after completion.',
    );

    assert.equal(
      friendlyError(error, 'en'),
      'This puzzle is already complete; hints cannot be purchased after its receipt is issued.',
    );
    assert.equal(
      friendlyError(error, 'ar'),
      'اكتمل هذا اللغز بالفعل؛ لا يمكن شراء تلميح بعد إصدار الإيصال.',
    );
  });
});
