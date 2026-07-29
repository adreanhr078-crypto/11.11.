import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createGameProgressionActions,
} from '../application/game/createGameProgressionActions';
import {
  CANONICAL_ECHO_METRIC_KEYS,
} from '../core/echoEventTypes';
import type {
  CanonicalEchoEffect,
  StandaloneEchoEvent,
} from '../core/echoEventTypes';
import {
  applyCanonicalEchoEffect,
} from '../domain/echo/canonicalEchoMetrics';
import {
  createStandaloneEchoEventFingerprint,
} from '../domain/echo/echoEventReducer';
import {
  mergeGameState,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import {
  buildInitialState,
} from '../stores/gameStoreHelpers';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';

const FIRST_TIMESTAMP = '2026-07-29T11:11:00.000Z';
const RETRY_TIMESTAMP = '2026-07-29T11:12:00.000Z';

function createEvent(
  echoEffect: CanonicalEchoEffect,
  overrides: Partial<StandaloneEchoEvent> = {},
): StandaloneEchoEvent {
  const input = {
    eventId: overrides.eventId ?? 'echo.standalone.audit',
    eventVersion: overrides.eventVersion ?? 1,
    echoEffect,
  };
  return {
    ...input,
    fingerprint: overrides.fingerprint
      ?? createStandaloneEchoEventFingerprint(input),
    timestamp: overrides.timestamp ?? FIRST_TIMESTAMP,
  };
}

function createHarness(initialState = buildInitialState()) {
  let state = initialState;
  let setCalls = 0;
  const set: GameStateSetter = (update) => {
    setCalls += 1;
    const partial = typeof update === 'function'
      ? update(state)
      : update;
    state = {
      ...state,
      ...partial,
    };
  };
  const get: GameStateGetter = () => state;
  const actions = createGameProgressionActions(set, get);

  return {
    actions,
    getState: () => state,
    getSetCalls: () => setCalls,
  };
}

describe('canonical Echo metric domain', () => {
  it('defines only the seven independent canonical metrics', () => {
    assert.deepEqual(CANONICAL_ECHO_METRIC_KEYS, [
      'humanity',
      'trust',
      'fear',
      'anger',
      'memoryStability',
      'memoriesRecovered',
      'corruption',
    ]);
  });

  it('validates, clamps, and applies canonical effects without mutation', () => {
    const initial = buildInitialState().progressionState.echo;
    const before = structuredClone(initial);
    const result = applyCanonicalEchoEffect(initial, {
      humanity: 1000,
      fear: -1000,
      anger: 4.6,
      memoryStability: 20,
      memoriesRecovered: 3,
    });

    assert.equal(result.success, true);
    assert.deepEqual(initial, before);
    assert.equal(result.echo.humanity, 100);
    assert.equal(result.echo.fear, 0);
    assert.equal(result.echo.anger, 5);
    assert.equal(result.echo.memoryStability, 25);
    assert.equal(result.echo.memoriesRecovered, 3);
    assert.equal(result.echo.hope, 20);
    assert.equal(result.echo.ragePoints, 0);
  });

  it('rejects empty, non-finite, and compatibility-field effects', () => {
    const initial = buildInitialState().progressionState.echo;
    const invalidEffects = [
      {},
      { trust: Number.NaN },
      { hope: 5 },
      { ragePoints: 5 },
    ] as CanonicalEchoEffect[];

    for (const effect of invalidEffects) {
      const result = applyCanonicalEchoEffect(initial, effect);
      assert.equal(result.success, false);
      assert.equal(result.echo, initial);
    }
  });
});

describe('standalone Echo event transaction', () => {
  it('applies once atomically and projects without semantic merging', () => {
    const harness = createHarness();
    const result = harness.actions.applyStandaloneEchoEvent(createEvent({
      humanity: 10,
      anger: 7,
      memoryStability: 20,
      memoriesRecovered: 4,
      fear: 100,
    }));

    assert.equal(result.success, true);
    assert.equal(result.applied, true);
    assert.equal(result.alreadyApplied, false);
    assert.equal(harness.getSetCalls(), 1);

    const state = harness.getState();
    assert.equal(state.progressionState.echo.humanity, 45);
    assert.equal(state.echo.personality.humanity, 45);
    assert.equal(state.progressionState.echo.hope, 20);
    assert.equal(state.echo.hope, 20);

    assert.equal(state.progressionState.echo.anger, 7);
    assert.equal(state.echo.personality.anger, 7);
    assert.equal(state.progressionState.echo.ragePoints, 0);
    assert.equal(state.echo.ragePoints, 0);

    assert.equal(state.progressionState.echo.memoryStability, 25);
    assert.equal(state.echo.memoryStability, 25);
    assert.equal(state.progressionState.echo.memoriesRecovered, 4);
    assert.equal(state.echo.personality.memoriesRecovered, 4);
    assert.equal(state.progressionState.echo.fear, 100);
    assert.deepEqual(
      Object.keys(
        state.progressionState.echoEvents.standaloneReceiptsByKey,
      ),
      ['echo.standalone.audit:1'],
    );
  });

  it('accepts an identical retry without changing the first timestamp', () => {
    const harness = createHarness();
    const firstEvent = createEvent({ trust: 4 });
    const first = harness.actions.applyStandaloneEchoEvent(firstEvent);
    const afterFirst = structuredClone(
      harness.getState().progressionState,
    );
    const retry = harness.actions.applyStandaloneEchoEvent({
      ...firstEvent,
      timestamp: RETRY_TIMESTAMP,
    });

    assert.equal(first.applied, true);
    assert.equal(retry.success, true);
    assert.equal(retry.applied, false);
    assert.equal(retry.alreadyApplied, true);
    assert.deepEqual(
      harness.getState().progressionState,
      afterFirst,
    );
    assert.equal(
      harness.getState().progressionState.echoEvents
        .standaloneReceiptsByKey['echo.standalone.audit:1']
        ?.timestamp,
      FIRST_TIMESTAMP,
    );
  });

  it('detects a payload conflict for the same event key', () => {
    const harness = createHarness();
    const firstEvent = createEvent({ humanity: 2 });
    harness.actions.applyStandaloneEchoEvent(firstEvent);
    const beforeConflict = structuredClone(
      harness.getState().progressionState,
    );
    const conflicting = createEvent(
      { humanity: 9 },
      {
        eventId: firstEvent.eventId,
        eventVersion: firstEvent.eventVersion,
      },
    );
    const result = harness.actions.applyStandaloneEchoEvent(conflicting);

    assert.equal(result.success, false);
    assert.equal(result.conflict, true);
    assert.equal(result.failureReason, 'event-conflict');
    assert.deepEqual(
      harness.getState().progressionState,
      beforeConflict,
    );
  });

  it('rejects malformed events without changing canonical state', () => {
    const invalidEvents = [
      createEvent({ trust: 2 }, { eventId: 'INVALID EVENT' }),
      createEvent({ trust: 2 }, { eventVersion: 0 }),
      createEvent({ trust: 2 }, { fingerprint: 'wrong' }),
      createEvent({ trust: 2 }, { timestamp: 'not-a-date' }),
      createEvent(
        { trust: Number.POSITIVE_INFINITY },
        { fingerprint: 'echo-v1-00000000' },
      ),
    ];

    for (const event of invalidEvents) {
      const harness = createHarness();
      const before = structuredClone(
        harness.getState().progressionState,
      );
      const result = harness.actions.applyStandaloneEchoEvent(event);
      assert.equal(result.success, false);
      assert.deepEqual(harness.getState().progressionState, before);
    }
  });

  it('preserves receipts and idempotency through save reload', () => {
    const firstHarness = createHarness();
    const event = createEvent({
      humanity: 3,
      memoryStability: 8,
    });
    firstHarness.actions.applyStandaloneEchoEvent(event);

    const reloaded = mergeGameState(
      partializeGameState(firstHarness.getState()),
      buildInitialState(),
    );
    const secondHarness = createHarness(reloaded);
    const beforeRetry = structuredClone(
      secondHarness.getState().progressionState,
    );
    const retry = secondHarness.actions.applyStandaloneEchoEvent(event);

    assert.equal(retry.success, true);
    assert.equal(retry.alreadyApplied, true);
    assert.equal(retry.applied, false);
    assert.deepEqual(
      secondHarness.getState().progressionState,
      beforeRetry,
    );
  });
});

describe('Echo event migration and compatibility authority', () => {
  it('does not fabricate Echo receipts from source-owned receipts', () => {
    const migrated = migrateGameState({
      claimedPuzzleRewards: ['puzzle_001_broken_pulse'],
      progressionState: {
        puzzles: {
          claimedRewardReceipts: ['puzzle_001_broken_pulse:1'],
        },
        manhwa: {
          claimedPageEffectIds: ['manhwa_ch01_page_01'],
        },
      },
    }, 13);

    assert.deepEqual(
      migrated.progressionState?.echoEvents
        .standaloneReceiptsByKey,
      {},
    );
  });

  it('drops malformed standalone receipts during migration', () => {
    const migrated = migrateGameState({
      progressionState: {
        echoEvents: {
          standaloneReceiptsByKey: {
            'echo.invalid:1': {
              eventId: 'echo.invalid',
              eventVersion: 1,
              fingerprint: 'echo-v1-deadbeef',
              timestamp: FIRST_TIMESTAMP,
              echoEffect: { trust: 2 },
            },
          },
        },
      },
    }, 13);

    assert.deepEqual(
      migrated.progressionState?.echoEvents
        .standaloneReceiptsByKey,
      {},
    );
  });

  it('never lets compatibility fields overwrite canonical save metrics', () => {
    const initial = buildInitialState();
    const compatibilityOnlyMutation = {
      ...initial,
      echo: {
        ...initial.echo,
        hope: 99,
        ragePoints: 88,
        memoryStability: 77,
        personality: {
          ...initial.echo.personality,
          humanity: 66,
          anger: 55,
          memoriesRecovered: 44,
        },
      },
    };
    const persisted = partializeGameState(compatibilityOnlyMutation);

    assert.equal(persisted.progressionState?.echo.humanity, 35);
    assert.equal(persisted.progressionState?.echo.hope, 20);
    assert.equal(persisted.progressionState?.echo.anger, 0);
    assert.equal(persisted.progressionState?.echo.ragePoints, 0);
    assert.equal(
      persisted.progressionState?.echo.memoryStability,
      5,
    );
    assert.equal(
      persisted.progressionState?.echo.memoriesRecovered,
      0,
    );
  });
});
