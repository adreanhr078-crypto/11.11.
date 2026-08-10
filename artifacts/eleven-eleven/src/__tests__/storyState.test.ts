import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createStoryStateActions,
} from '../application/story/createStoryStateActions';
import {
  createEchoPresentationReadModel,
} from '../application/ui/echoPresentationReadModel';
import type { GameState } from '../core/gameTypes';
import type {
  AuthoritativeStoryEventReceipt,
  AuthoritativeStoryState,
} from '../domain/story/storyState';
import {
  createStoryStateReadModel,
} from '../domain/story/storyState';
import {
  mergeGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';

const reachedAt = '2026-08-09T11:11:00.000Z';

function receipt(
  eventId: AuthoritativeStoryEventReceipt['eventId'],
): AuthoritativeStoryEventReceipt {
  const source = {
    manhwa_chapter_04_black_coronation: {
      pageId: 'manhwa_ch04_page_02',
      pageNumber: 56,
    },
    manhwa_chapter_04_lina_protocol: {
      pageId: 'manhwa_ch04_page_04',
      pageNumber: 58,
    },
    manhwa_chapter_04_black_echo_protocol: {
      pageId: 'manhwa_ch04_page_08',
      pageNumber: 62,
    },
  } as const;
  return {
    eventId,
    eventVersion: 1,
    sourceType: 'manhwa',
    sourceId: 'chapter_4',
    sourcePageId: source[eventId].pageId,
    sourcePageNumber: source[eventId].pageNumber,
    reachedAt,
  };
}

function snapshot(
  events: readonly AuthoritativeStoryEventReceipt[],
): AuthoritativeStoryState {
  return {
    canonEventReceipts: [...events],
    completedChapterIds: ['chapter_3'],
    discoveredMemoryFragmentIds: [],
    syncedAt: reachedAt,
  };
}

function createHarness(initial = buildInitialState()) {
  let state: GameState = initial;
  const get: GameStateGetter = () => state;
  const set: GameStateSetter = (partial) => {
    const update = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...update };
  };
  return {
    actions: createStoryStateActions(set, get),
    getState: get,
  };
}

describe('authoritative Story State projection', () => {
  it('starts a new player at the safe initial Echo state', () => {
    const state = buildInitialState();
    const story = createStoryStateReadModel(state.progressionState);

    assert.deepEqual(story.reachedCanonEvents, []);
    assert.equal(story.echoState.stageId, 'awakening_fragile');
    assert.deepEqual(story.discoveredMemoryFragments, []);
  });

  it('projects only valid server receipts and is idempotent on a reread', () => {
    const harness = createHarness();
    const coronation = snapshot([receipt('manhwa_chapter_04_black_coronation')]);

    assert.equal(harness.actions.syncAuthoritativeStoryState(coronation), true);
    const once = structuredClone(harness.getState());
    assert.equal(
      createStoryStateReadModel(once.progressionState).echoState.stageId,
      'black_coronation',
    );
    assert.equal(createEchoPresentationReadModel(once).form, 'black-coronation');

    assert.equal(harness.actions.syncAuthoritativeStoryState(coronation), true);
    const twice = harness.getState();
    assert.deepEqual(
      twice.progressionState.narrativeEvents.claimedSourceReceiptKeys,
      once.progressionState.narrativeEvents.claimedSourceReceiptKeys,
    );
    assert.deepEqual(
      twice.progressionState.story.authoritative.canonEventReceipts,
      once.progressionState.story.authoritative.canonEventReceipts,
    );
  });

  it('reaches Black Echo Protocol only after its approved receipt', () => {
    const harness = createHarness();
    const prior = receipt('manhwa_chapter_04_black_coronation');
    const lina = receipt('manhwa_chapter_04_lina_protocol');

    harness.actions.syncAuthoritativeStoryState(snapshot([prior, lina]));
    assert.equal(
      createStoryStateReadModel(harness.getState().progressionState)
        .echoState.stageId,
      'second_contract_marked',
    );

    harness.actions.syncAuthoritativeStoryState(snapshot([
      prior,
      lina,
      receipt('manhwa_chapter_04_black_echo_protocol'),
    ]));
    const story = createStoryStateReadModel(harness.getState().progressionState);
    assert.equal(story.echoState.stageId, 'black_echo_protocol');
    assert.deepEqual(story.majorTransformationFlags, [
      'manhwa_chapter_04_black_coronation',
      'manhwa_chapter_04_lina_protocol',
      'manhwa_chapter_04_black_echo_protocol',
    ]);
  });

  it('rejects malformed local receipts and does not invent XP or fragments', () => {
    const harness = createHarness();
    const forged = snapshot([{
      ...receipt('manhwa_chapter_04_black_echo_protocol'),
      sourcePageNumber: 999,
    }]);

    assert.equal(harness.actions.syncAuthoritativeStoryState(forged), true);
    const state = harness.getState();
    const story = createStoryStateReadModel(state.progressionState);
    assert.deepEqual(story.reachedCanonEvents, []);
    assert.equal(story.echoState.stageId, 'awakening_fragile');
    assert.deepEqual(state.progressionState.resources.memoryShards.discoveredShardIds, []);
    assert.equal(state.progressionState.resources.coins, 0);
  });

  it('persists server Story State across a client reload without adding rewards', () => {
    const initial = buildInitialState();
    const harness = createHarness(initial);
    harness.actions.syncAuthoritativeStoryState(snapshot([
      receipt('manhwa_chapter_04_black_coronation'),
    ]));

    const reloaded = mergeGameState(
      partializeGameState(harness.getState()),
      buildInitialState(),
    );

    assert.equal(
      createStoryStateReadModel(reloaded.progressionState).echoState.stageId,
      'black_coronation',
    );
    assert.equal(reloaded.progressionState.resources.coins, 0);
    assert.deepEqual(
      reloaded.progressionState.resources.memoryShards.discoveredShardIds,
      [],
    );
  });
});
