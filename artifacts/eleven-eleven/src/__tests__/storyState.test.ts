import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createStoryStateActions } from '../application/story/createStoryStateActions';
import { createEchoPresentationReadModel } from '../application/ui/echoPresentationReadModel';
import type { GameState } from '../core/gameTypes';
import type {
  AuthoritativeStoryEventReceipt,
  AuthoritativeStoryState,
} from '../domain/story/storyState';
import { createStoryStateReadModel } from '../domain/story/storyState';
import { mergeGameState, partializeGameState } from '../infrastructure/persistence/gamePersistence';
import {
  FINAL_MANHWA_CANON_EVENTS,
  RETIRED_FINAL_MANHWA_CANON_EVENT_IDS,
} from '../content/story/finalManhwaCanonEvents';
import { buildInitialState } from '../stores/gameStoreHelpers';
import type { GameStateGetter, GameStateSetter } from '../application/game/statePorts';

const reachedAt = '2026-09-03T11:11:00.000Z';

function retiredReceipt(): AuthoritativeStoryEventReceipt {
  return {
    eventId: RETIRED_FINAL_MANHWA_CANON_EVENT_IDS[0],
    eventVersion: 1,
    sourceType: 'manhwa',
    sourceId: 'chapter_4',
    sourcePageId: 'manhwa_ch04_page_02',
    sourcePageNumber: 56,
    reachedAt,
  };
}

function snapshot(
  events: readonly AuthoritativeStoryEventReceipt[] = [],
): AuthoritativeStoryState {
  return {
    canonEventReceipts: [...events],
    completedChapterIds: ['chapter_1'],
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
    const story = createStoryStateReadModel(buildInitialState().progressionState);

    assert.deepEqual(story.reachedCanonEvents, []);
    assert.equal(story.echoState.stageId, 'awakening_fragile');
    assert.deepEqual(story.discoveredMemoryFragments, []);
  });

  it('does not bind corrected Manhwa art to a Canon transformation without an Owner-approved matrix', () => {
    assert.deepEqual(FINAL_MANHWA_CANON_EVENTS, []);

    const harness = createHarness();
    assert.equal(
      harness.actions.syncAuthoritativeStoryState(snapshot([retiredReceipt()])),
      true,
    );

    const state = harness.getState();
    const story = createStoryStateReadModel(state.progressionState);
    assert.deepEqual(story.reachedCanonEvents, []);
    assert.equal(story.echoState.stageId, 'awakening_fragile');
    assert.equal(createEchoPresentationReadModel(state).form, 'normal');
  });

  it('rejects malformed or unknown server receipts without inventing XP, fragments, or character revelations', () => {
    const harness = createHarness();
    const forged = {
      ...retiredReceipt(),
      eventId: 'unapproved_future_reveal',
      sourcePageNumber: 999,
    } as AuthoritativeStoryEventReceipt;

    assert.equal(harness.actions.syncAuthoritativeStoryState(snapshot([forged])), true);
    const state = harness.getState();
    const story = createStoryStateReadModel(state.progressionState);
    assert.deepEqual(story.reachedCanonEvents, []);
    assert.equal(story.echoState.stageId, 'awakening_fragile');
    assert.deepEqual(story.unlockedCharacterFiles, []);
    assert.deepEqual(state.progressionState.resources.memoryShards.discoveredShardIds, []);
    assert.equal(state.progressionState.resources.coins, 0);
  });

  it('persists the server story snapshot across a reload without adding legacy rewards or transformations', () => {
    const harness = createHarness();
    assert.equal(harness.actions.syncAuthoritativeStoryState(snapshot()), true);

    const reloaded = mergeGameState(
      partializeGameState(harness.getState()),
      buildInitialState(),
    );
    const story = createStoryStateReadModel(reloaded.progressionState);

    assert.equal(story.echoState.stageId, 'awakening_fragile');
    assert.deepEqual(story.reachedCanonEvents, []);
    assert.deepEqual(story.completedChapters, ['chapter_1']);
    assert.equal(reloaded.progressionState.resources.coins, 0);
    assert.deepEqual(reloaded.progressionState.resources.memoryShards.discoveredShardIds, []);
  });
});
