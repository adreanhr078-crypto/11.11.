import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clampPercentage,
  cx,
  formatPercentage,
  getNextEnabledIndex,
} from '../ui/design-system/utils';

describe('Cinematic design system foundation', () => {
  it('clamps game metrics before rendering them', () => {
    assert.equal(clampPercentage(-4), 0);
    assert.equal(clampPercentage(42.4), 42.4);
    assert.equal(clampPercentage(140), 100);
    assert.equal(clampPercentage(Number.NaN), 0);
    assert.equal(formatPercentage(66.7), '67%');
  });

  it('builds isolated class names without false values', () => {
    assert.equal(
      cx('gds-button', false, undefined, 'gds-button--full'),
      'gds-button gds-button--full',
    );
  });

  it('moves tab focus around disabled items', () => {
    const disabled = [false, true, false, false];
    assert.equal(getNextEnabledIndex(disabled, 0, 1), 2);
    assert.equal(getNextEnabledIndex(disabled, 0, -1), 3);
    assert.equal(getNextEnabledIndex([true, true], 0, 1), 0);
    assert.equal(getNextEnabledIndex([], 0, 1), -1);
  });
});
