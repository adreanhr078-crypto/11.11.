import test from 'node:test';
import assert from 'node:assert/strict';
import { createSingleFlight } from '../features/player-sync/singleFlight';

test('single-flight reuses one bootstrap for duplicate triggers', async () => {
  const flight = createSingleFlight<string, string>();
  let calls = 0;
  let resolveFirst!: (value: string) => void;
  const task = () => {
    calls += 1;
    return new Promise<string>((resolve) => { resolveFirst = resolve; });
  };

  const first = flight.run('uid-a', task);
  const second = flight.run('uid-a', task);
  assert.equal(first, second);
  assert.equal(calls, 1);
  resolveFirst('ready');
  assert.equal(await first, 'ready');
});

test('single-flight invalidates stale work when the UID changes', () => {
  const flight = createSingleFlight<string, string>();
  const first = flight.run('uid-a', async () => 'old');
  void first;
  assert.equal(flight.isCurrent('uid-a', 1), true);
  flight.invalidate();
  assert.equal(flight.isCurrent('uid-a', 1), false);
});
