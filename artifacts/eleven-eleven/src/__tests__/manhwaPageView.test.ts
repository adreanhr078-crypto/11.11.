import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGameProgressionActions } from '../application/game/createGameProgressionActions';
import { createManhwaPageViewActions } from '../application/game/createManhwaPageViewActions';
import {
  createManhwaPageAuthoredEffect,
} from '../application/game/manhwaPageEffectAdapter';
import {
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
  FINAL_MANHWA_PAGES,
} from '../content/manhwa/finalManhwa';
import {
  CANONICAL_ECHO_METRIC_KEYS,
} from '../core/echoEventTypes';
import type { GameState } from '../core/gameTypes';
import {
  createManhwaPageEffectReceiptKey,
  MANHWA_PAGE_EFFECT_VERSION,
  type ManhwaPageAuthoredEffect,
} from '../core/manhwaPageViewTypes';
import {
  applyManhwaPageViewTransaction,
} from '../domain/manhwa/manhwaPageViewTransaction';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';
import { buildInitialState } from '../stores/gameStoreHelpers';

function page(number: number) {
  const result = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[number];
  assert.ok(result, `Expected V3 Manhwa page ${number}.`);
  return result;
}

function createHarness(initial: GameState = buildInitialState()) {
  let state = initial;
  const get: GameStateGetter = () => state;
  const set: GameStateSetter = (partial) => {
    const update = typeof partial === 'function'
      ? partial(state)
      : partial;
    state = { ...state, ...update };
  };
  createGameProgressionActions(set, get);
  return {
    pageView: createManhwaPageViewActions(set, get),
    getState: get,
  };
}

function withUnlockedPages(...pageIds: string[]): GameState {
  const state = buildInitialState();
  state.progressionState = structuredClone(state.progressionState);
  state.progressionState.manhwa.unlockedPageIds = [
    ...new Set([
      ...state.progressionState.manhwa.unlockedPageIds,
      ...pageIds,
    ]),
  ];
  return state;
}

describe('corrected V3 Manhwa page-view boundary', () => {
  it('keeps every supplied page effect-free until an Owner-approved page matrix exists', () => {
    const canonicalKeys = new Set<string>(CANONICAL_ECHO_METRIC_KEYS);

    for (const current of FINAL_MANHWA_PAGES) {
      const effect = createManhwaPageAuthoredEffect(current);
      assert.equal(effect.effectVersion, MANHWA_PAGE_EFFECT_VERSION);
      assert.equal(effect.hasAuthoredEffect, false);
      assert.deepEqual(effect.echoEffect, {});
      assert.ok(
        Object.keys(effect.echoEffect).every((key) => canonicalKeys.has(key)),
      );
    }
  });

  it('rejects retired IDs and unreleased V3 pages before changing local state', () => {
    const harness = createHarness();
    const before = structuredClone(harness.getState().progressionState);

    const retired = harness.pageView.viewManhwaPage(
      'manhwa_ch01_page_02',
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(retired.success, false);
    assert.equal(retired.failureReason, 'invalid-page-id');

    const unreleased = harness.pageView.viewManhwaPage(
      page(10).id,
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(unreleased.success, false);
    assert.equal(unreleased.failureReason, 'unreleased-page');
    assert.deepEqual(harness.getState().progressionState, before);
  });

  it('records the released cover once without inventing rewards, flags, or Echo effects', () => {
    const cover = page(1);
    const harness = createHarness(withUnlockedPages(cover.id));
    const initialFear = harness.getState().progressionState.echo.fear;

    const first = harness.pageView.viewManhwaPage(
      cover.id,
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(first.success, true);
    assert.equal(first.effectApplied, false);
    assert.deepEqual(
      harness.getState().progressionState.manhwa.viewedPageIds,
      [cover.id],
    );
    assert.equal(
      harness.getState().progressionState.manhwa.pageViewedAt[cover.id],
      '2026-09-03T11:11:00.000Z',
    );
    assert.deepEqual(harness.getState().progressionState.manhwa.claimedPageEffectIds, []);
    assert.equal(harness.getState().progressionState.echo.fear, initialFear);
    assert.equal(harness.getState().currency, 0);
    assert.deepEqual(harness.getState().progressionState.puzzles.claimedRewardReceipts, []);

    const replay = harness.pageView.viewManhwaPage(
      cover.id,
      '2026-09-03T12:11:00.000Z',
    );
    assert.equal(replay.success, true);
    assert.equal(replay.alreadyViewed, true);
    assert.equal(replay.effectApplied, false);
    assert.equal(
      harness.getState().progressionState.manhwa.pageViewedAt[cover.id],
      '2026-09-03T11:11:00.000Z',
    );
  });

  it('requires the reader window for released chapter pages and saves a valid continuation point', () => {
    const signalPage = page(7);
    const archivePage = page(8);
    const lockedHarness = createHarness(withUnlockedPages(signalPage.id));
    const locked = lockedHarness.pageView.viewManhwaPage(
      archivePage.id,
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(locked.success, false);
    assert.equal(locked.failureReason, 'page-not-unlocked');

    const harness = createHarness(withUnlockedPages(archivePage.id));
    const viewed = harness.pageView.viewManhwaPage(
      archivePage.id,
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(viewed.success, true);
    assert.equal(viewed.effectApplied, false);

    assert.equal(
      harness.pageView.recordManhwaReadingProgress(
        archivePage.id,
        archivePage.globalPageNumber,
        archivePage.chapterId,
        '2026-09-03T11:11:20.000Z',
      ),
      true,
    );
    assert.equal(
      harness.getState().progressionState.manhwa.lastReadPageId,
      archivePage.id,
    );
    assert.equal(
      harness.pageView.recordManhwaReadingProgress(
        page(10).id,
        10,
        'chapter_2',
        '2026-09-03T11:12:00.000Z',
      ),
      false,
    );
  });

  it('keeps the generic page transaction atomic for a future authored V3 effect', () => {
    const signalPage = page(7);
    const firstEffect: ManhwaPageAuthoredEffect = {
      ...createManhwaPageAuthoredEffect(signalPage),
      echoEffect: { fear: 2 },
      hasAuthoredEffect: true,
    };
    const first = applyManhwaPageViewTransaction(
      withUnlockedPages(signalPage.id).progressionState,
      signalPage.id,
      firstEffect,
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(first.success, true);
    assert.equal(first.effectApplied, true);
    assert.ok(first.state.manhwa.claimedPageEffectIds.includes(
      createManhwaPageEffectReceiptKey(signalPage.id),
    ));

    const conflictState = structuredClone(first.state);
    conflictState.manhwa.viewedPageIds = [];
    conflictState.manhwa.pageViewedAt = {};
    const beforeConflict = structuredClone(conflictState);
    const conflict = applyManhwaPageViewTransaction(
      conflictState,
      signalPage.id,
      {
        ...firstEffect,
        echoEffect: { fear: 3 },
      },
      '2026-09-03T11:12:00.000Z',
    );

    assert.equal(conflict.success, false);
    assert.equal(conflict.conflict, true);
    assert.equal(conflict.failureReason, 'page-effect-conflict');
    assert.deepEqual(conflict.state, beforeConflict);
  });

  it('permits a later effect version to be appended once to an already read V3 page', () => {
    const signalPage = page(7);
    const initial = applyManhwaPageViewTransaction(
      withUnlockedPages(signalPage.id).progressionState,
      signalPage.id,
      createManhwaPageAuthoredEffect(signalPage),
      '2026-09-03T11:11:00.000Z',
    );
    assert.equal(initial.success, true);
    assert.equal(initial.effectReceiptAdded, false);

    const upgraded = applyManhwaPageViewTransaction(
      initial.state,
      signalPage.id,
      {
        ...createManhwaPageAuthoredEffect(signalPage),
        effectVersion: 2,
        echoEffect: { trust: 1 },
        hasAuthoredEffect: true,
      },
      '2026-09-03T11:12:00.000Z',
    );
    assert.equal(upgraded.success, true);
    assert.equal(upgraded.alreadyViewed, true);
    assert.equal(upgraded.effectApplied, true);
    assert.ok(upgraded.state.manhwa.claimedPageEffectIds.includes(
      createManhwaPageEffectReceiptKey(signalPage.id, 2),
    ));
  });
});
