import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  ManhwaPageAuthoredEffect,
  ManhwaPageViewFailureReason,
  ManhwaPageViewTransactionResult,
} from '../../core/manhwaPageViewTypes';
import {
  applyEchoEffects,
} from '../progression/gameProgressionReducer';
import {
  reconcileGameProgressionState,
} from '../progression/gameProgressionState';

function isValidTimestamp(timestamp: string): boolean {
  return Boolean(timestamp.trim()) && Number.isFinite(Date.parse(timestamp));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function failedView(
  state: GameProgressionState,
  failureReason: ManhwaPageViewFailureReason,
): ManhwaPageViewTransactionResult {
  return {
    success: false,
    alreadyViewed: false,
    effectApplied: false,
    effectReceiptAdded: false,
    state,
    failureReason,
  };
}

function validEffectStrings(values: readonly string[]): boolean {
  return values.every((value) => Boolean(value.trim()));
}

function isValidAuthoredEffect(
  effect: ManhwaPageAuthoredEffect,
): boolean {
  return (
    Object.entries(effect.storyFlags).every(([flag, value]) => (
      Boolean(flag.trim()) && typeof value === 'boolean'
    ))
    && validEffectStrings(effect.beliefsAdded)
    && validEffectStrings(effect.questionsAdded)
    && validEffectStrings(effect.knowledgeNodeIdsAdded)
    && validEffectStrings(effect.dialogueTriggers)
  );
}

/**
 * Records a successfully loaded page and applies its authored effect in one
 * immutable transition. Callers commit the returned state with one store set.
 */
export function applyManhwaPageViewTransaction(
  state: GameProgressionState,
  pageId: string,
  effect: ManhwaPageAuthoredEffect,
  timestamp: string,
): ManhwaPageViewTransactionResult {
  const normalizedPageId = pageId.trim();
  if (!normalizedPageId) {
    return failedView(state, 'invalid-page-id');
  }
  if (!isValidTimestamp(timestamp)) {
    return failedView(state, 'invalid-timestamp');
  }
  if (!state.manhwa.unlockedPageIds.includes(normalizedPageId)) {
    return failedView(state, 'page-not-unlocked');
  }
  if (!isValidAuthoredEffect(effect)) {
    return failedView(state, 'invalid-page-effect');
  }
  if (state.manhwa.viewedPageIds.includes(normalizedPageId)) {
    return {
      success: true,
      alreadyViewed: true,
      effectApplied: false,
      effectReceiptAdded: false,
      state,
    };
  }

  const hasEffectReceipt =
    state.manhwa.claimedPageEffectIds.includes(normalizedPageId);
  const shouldApplyEffect = effect.hasAuthoredEffect && !hasEffectReceipt;
  const echoTransition = shouldApplyEffect
    ? applyEchoEffects(state, effect.echoEffect, Date.parse(timestamp))
    : { success: true, state };
  if (!echoTransition.success) {
    return failedView(state, 'invalid-page-effect');
  }

  const narrative = echoTransition.state.story.narrative;
  const nextState = reconcileGameProgressionState({
    ...echoTransition.state,
    manhwa: {
      ...echoTransition.state.manhwa,
      viewedPageIds: [
        ...echoTransition.state.manhwa.viewedPageIds,
        normalizedPageId,
      ],
      pageViewedAt: {
        ...echoTransition.state.manhwa.pageViewedAt,
        [normalizedPageId]:
          echoTransition.state.manhwa.pageViewedAt[normalizedPageId]
          ?? timestamp,
      },
      claimedPageEffectIds: shouldApplyEffect
        ? [
            ...echoTransition.state.manhwa.claimedPageEffectIds,
            normalizedPageId,
          ]
        : echoTransition.state.manhwa.claimedPageEffectIds,
    },
    story: shouldApplyEffect
      ? {
          narrative: {
            ...narrative,
            beliefs: unique([
              ...narrative.beliefs,
              ...effect.beliefsAdded,
            ]),
            questions: unique([
              ...narrative.questions,
              ...effect.questionsAdded,
            ]),
            knowledgeNodeIds: unique([
              ...narrative.knowledgeNodeIds,
              ...effect.knowledgeNodeIdsAdded,
            ]),
            activeFlags: {
              ...narrative.activeFlags,
              ...effect.storyFlags,
            },
          },
        }
      : echoTransition.state.story,
  });

  return {
    success: true,
    alreadyViewed: false,
    effectApplied: shouldApplyEffect,
    effectReceiptAdded: shouldApplyEffect,
    state: nextState,
  };
}
