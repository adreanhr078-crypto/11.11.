import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_PLAYER_SYNC_MACHINE_STATE,
  isTerminalPlayerSyncPhase,
  transitionPlayerSyncMachine,
} from '../features/player-sync/playerSyncMachine';
import type { PlayerSyncFailure } from '../features/player-sync/playerSyncStore';

const failure: PlayerSyncFailure = {
  stage: 'PROFILE_REQUEST',
  endpoint: '/profile',
  status: 504,
  code: 'request_timeout',
  message: 'timed out',
  elapsedMs: 15_001,
};

test('player sync machine always settles successful and degraded attempts', () => {
  const ready = transitionPlayerSyncMachine(
    transitionPlayerSyncMachine(
      INITIAL_PLAYER_SYNC_MACHINE_STATE,
      { type: 'auth_wait' },
    ),
    { type: 'complete' },
  );
  const degraded = transitionPlayerSyncMachine(
    INITIAL_PLAYER_SYNC_MACHINE_STATE,
    { type: 'complete', optionalFailures: [failure] },
  );

  assert.equal(ready.phase, 'ready');
  assert.equal(ready.stage, 'PLAYER_READY');
  assert.equal(degraded.phase, 'degraded');
  assert.equal(degraded.stage, 'PLAYER_DEGRADED');
  assert.equal(isTerminalPlayerSyncPhase(ready.phase), true);
  assert.equal(isTerminalPlayerSyncPhase(degraded.phase), true);
});

test('player sync machine turns every required failure into a terminal error', () => {
  const error = transitionPlayerSyncMachine(
    transitionPlayerSyncMachine(
      INITIAL_PLAYER_SYNC_MACHINE_STATE,
      { type: 'syncing', stage: 'PROFILE_REQUEST' },
    ),
    { type: 'failure', failure },
  );

  assert.equal(error.phase, 'error');
  assert.equal(error.stage, 'PLAYER_ERROR');
  assert.equal(error.error?.endpoint, '/profile');
  assert.equal(isTerminalPlayerSyncPhase(error.phase), true);
});

test('player sync reset clears prior terminal and failure state', () => {
  const reset = transitionPlayerSyncMachine(
    {
      phase: 'error',
      stage: 'PLAYER_ERROR',
      error: failure,
      optionalFailures: [failure],
    },
    { type: 'reset' },
  );

  assert.deepEqual(reset, INITIAL_PLAYER_SYNC_MACHINE_STATE);
});
