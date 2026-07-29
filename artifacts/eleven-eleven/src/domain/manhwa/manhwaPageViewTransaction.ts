import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  ManhwaPageAuthoredEffect,
  ManhwaPageViewFailureReason,
  ManhwaPageViewTransactionResult,
} from '../../core/manhwaPageViewTypes';
import {
  createManhwaPageEffectReceiptKey,
  isLegacyManhwaPageEffectReceipt,
} from '../../core/manhwaPageViewTypes';
import {
  CANONICAL_ECHO_METRIC_KEYS,
} from '../../core/echoEventTypes';
import {
  applyCanonicalEchoEffect,
  normalizeCanonicalEchoEffect,
} from '../echo/canonicalEchoMetrics';
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
  receiptKey: string,
  fingerprint: string = '',
  conflict: boolean = false,
): ManhwaPageViewTransactionResult {
  return {
    success: false,
    alreadyViewed: false,
    effectApplied: false,
    effectReceiptAdded: false,
    conflict,
    receiptKey,
    fingerprint,
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
  const echoEntries = Object.keys(effect.echoEffect).length;
  const hasAuthoredPayload = (
    echoEntries > 0
    || Object.keys(effect.storyFlags).length > 0
    || effect.beliefsAdded.length > 0
    || effect.questionsAdded.length > 0
    || effect.knowledgeNodeIdsAdded.length > 0
    || effect.dialogueTriggers.length > 0
    || Boolean(effect.dialogueLine?.trim())
  );
  return (
    Number.isSafeInteger(effect.effectVersion)
    && effect.effectVersion > 0
    && (
      echoEntries === 0
      || normalizeCanonicalEchoEffect(effect.echoEffect) !== null
    )
    && Object.entries(effect.storyFlags).every(([flag, value]) => (
      Boolean(flag.trim()) && typeof value === 'boolean'
    ))
    && validEffectStrings(effect.beliefsAdded)
    && validEffectStrings(effect.questionsAdded)
    && validEffectStrings(effect.knowledgeNodeIdsAdded)
    && validEffectStrings(effect.dialogueTriggers)
    && (
      effect.dialogueLine === undefined
      || Boolean(effect.dialogueLine.trim())
    )
    && effect.hasAuthoredEffect === hasAuthoredPayload
  );
}

function orderedBooleanRecord(
  value: Readonly<Record<string, boolean>>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => (
      left.localeCompare(right)
    )),
  );
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Fingerprints the complete source-owned Page Effect payload. The view
 * timestamp is excluded so a retry after reload stays idempotent.
 */
export function createManhwaPageEffectFingerprint(
  pageId: string,
  effect: ManhwaPageAuthoredEffect,
): string {
  const normalizedEffect = Object.keys(effect.echoEffect).length > 0
    ? normalizeCanonicalEchoEffect(effect.echoEffect)
    : {};
  if (!normalizedEffect) return '';
  const echoEffect = Object.fromEntries(
    CANONICAL_ECHO_METRIC_KEYS.flatMap((metric) => {
      const amount = normalizedEffect[metric];
      return amount === undefined ? [] : [[metric, amount]];
    }),
  );
  const payload = {
    pageId: pageId.trim(),
    effectVersion: effect.effectVersion,
    echoEffect,
    storyFlags: orderedBooleanRecord(effect.storyFlags),
    beliefsAdded: effect.beliefsAdded,
    questionsAdded: effect.questionsAdded,
    knowledgeNodeIdsAdded: effect.knowledgeNodeIdsAdded,
    dialogueTriggers: effect.dialogueTriggers,
    dialogueLine: effect.dialogueLine ?? null,
    hasAuthoredEffect: effect.hasAuthoredEffect,
  };
  return `manhwa-page-v1-${fnv1a(JSON.stringify(payload))}`;
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
  const receiptKey = createManhwaPageEffectReceiptKey(
    normalizedPageId,
    effect.effectVersion,
  );
  if (!normalizedPageId) {
    return failedView(state, 'invalid-page-id', receiptKey);
  }
  if (!isValidTimestamp(timestamp)) {
    return failedView(state, 'invalid-timestamp', receiptKey);
  }
  if (!state.manhwa.unlockedPageIds.includes(normalizedPageId)) {
    return failedView(state, 'page-not-unlocked', receiptKey);
  }
  if (!isValidAuthoredEffect(effect)) {
    return failedView(state, 'invalid-page-effect', receiptKey);
  }
  const fingerprint = createManhwaPageEffectFingerprint(
    normalizedPageId,
    effect,
  );
  const alreadyViewed =
    state.manhwa.viewedPageIds.includes(normalizedPageId);
  const hasEffectReceipt = state.manhwa.claimedPageEffectIds.some(
    (receipt) => (
      receipt === receiptKey
      || isLegacyManhwaPageEffectReceipt(
        receipt,
        normalizedPageId,
        effect.effectVersion,
      )
    ),
  );
  const storedFingerprint =
    state.manhwa.pageEffectFingerprintsByReceiptKey?.[receiptKey];
  if (
    effect.hasAuthoredEffect
    && hasEffectReceipt
    && storedFingerprint
    && storedFingerprint !== fingerprint
  ) {
    return failedView(
      state,
      'page-effect-conflict',
      receiptKey,
      fingerprint,
      true,
    );
  }
  const shouldApplyEffect = effect.hasAuthoredEffect && !hasEffectReceipt;
  if (alreadyViewed && !shouldApplyEffect) {
    return {
      success: true,
      alreadyViewed: true,
      effectApplied: false,
      effectReceiptAdded: false,
      conflict: false,
      receiptKey,
      fingerprint,
      state,
    };
  }

  const hasEchoEffect = Object.keys(effect.echoEffect).length > 0;
  const echoTransition = shouldApplyEffect && hasEchoEffect
    ? applyCanonicalEchoEffect(state.echo, effect.echoEffect)
    : { success: true, echo: state.echo };
  if (!echoTransition.success) {
    return failedView(
      state,
      'invalid-page-effect',
      receiptKey,
      fingerprint,
    );
  }

  const narrative = state.story.narrative;
  const nextState = reconcileGameProgressionState({
    ...state,
    echo: echoTransition.echo,
    manhwa: {
      ...state.manhwa,
      viewedPageIds: alreadyViewed
        ? state.manhwa.viewedPageIds
        : [...state.manhwa.viewedPageIds, normalizedPageId],
      pageViewedAt: {
        ...state.manhwa.pageViewedAt,
        [normalizedPageId]:
          state.manhwa.pageViewedAt[normalizedPageId]
          ?? timestamp,
      },
      claimedPageEffectIds: shouldApplyEffect
        ? [
            ...state.manhwa.claimedPageEffectIds,
            receiptKey,
          ]
        : state.manhwa.claimedPageEffectIds,
      pageEffectFingerprintsByReceiptKey: shouldApplyEffect
        ? {
            ...(state.manhwa.pageEffectFingerprintsByReceiptKey ?? {}),
            [receiptKey]: fingerprint,
          }
        : state.manhwa.pageEffectFingerprintsByReceiptKey,
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
      : state.story,
  });

  return {
    success: true,
    alreadyViewed,
    effectApplied: shouldApplyEffect,
    effectReceiptAdded: shouldApplyEffect,
    conflict: false,
    receiptKey,
    fingerprint,
    state: nextState,
  };
}
