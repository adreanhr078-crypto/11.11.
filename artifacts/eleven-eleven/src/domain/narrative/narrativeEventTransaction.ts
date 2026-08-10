import type {
  EchoEvolutionStageDefinition,
  ProvenStoryEvent,
  RuntimeStoryEventDefinition,
} from '../../core/echoEvolutionTypes';
import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  NarrativeEffectPlan,
  NarrativeEventFailureReason,
  NarrativeEventProgressState,
  NarrativeEventTransactionResult,
  NarrativeSourceIdentity,
} from '../../core/narrativeEventTypes';
import {
  applyCanonicalEchoEffect,
  normalizeCanonicalEchoEffect,
} from '../echo/canonicalEchoMetrics';
import {
  evaluateEchoEvolution,
} from '../echo/echoEvolutionEngine';
import {
  reconcileGameProgressionState,
} from '../progression/gameProgressionState';
import type {
  RuntimeKnowledgeNodeDefinition,
} from './knowledgeRegistry';
import {
  createNarrativeEffectFingerprint,
  createNarrativeSourceReceiptKey,
  isValidNarrativeId,
  NARRATIVE_EVENT_FINGERPRINT_PATTERN,
} from './narrativeEffectPlan';

const STORY_EVENT_FINGERPRINT_PATTERN = /^[0-9a-f]{8}$/;

export interface NarrativeEventTransactionContext {
  knowledgeNodes: readonly RuntimeKnowledgeNodeDefinition[];
  storyEvents: readonly RuntimeStoryEventDefinition[];
  evolutionStages: readonly EchoEvolutionStageDefinition[];
}

function isValidTimestamp(value: string): boolean {
  return Boolean(value.trim()) && Number.isFinite(Date.parse(value));
}

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function failed(
  state: GameProgressionState,
  receiptKey: string,
  fingerprint: string,
  failureReason: NarrativeEventFailureReason,
  conflict = false,
): NarrativeEventTransactionResult {
  return {
    success: false,
    applied: false,
    alreadyApplied: false,
    conflict,
    receiptKey,
    fingerprint,
    state,
    failureReason,
  };
}

function validSource(source: NarrativeSourceIdentity): boolean {
  switch (source.kind) {
    case 'memory':
      return (
        /^memory_[a-z0-9_-]+$/.test(source.memoryId.trim())
        && (
          source.fragmentId === undefined
          || /^fragment_[a-z0-9_-]+$/.test(source.fragmentId.trim())
        )
      );
    case 'dialogue':
      return (
        /^dialogue_[a-z0-9_-]+$/.test(source.dialogueId.trim())
        && isValidNarrativeId(source.nodeId)
        && isValidNarrativeId(source.choiceId)
      );
    case 'cinematic':
      return (
        /^episode_[a-z0-9_-]+$/.test(source.episodeId.trim())
        && isValidNarrativeId(source.narrativeEventId)
      );
    case 'story':
      return isValidNarrativeId(source.eventId);
  }
}

function validDialogueTransition(plan: NarrativeEffectPlan): boolean {
  if (plan.source.kind !== 'dialogue') {
    return plan.dialogueTransition === undefined;
  }
  const transition = plan.dialogueTransition;
  if (!transition) return false;
  return transition.completed
    ? transition.nextNodeId === null
    : transition.nextNodeId !== null
      && isValidNarrativeId(transition.nextNodeId);
}

function validFlags(
  storyFlags: Readonly<Record<string, boolean>>,
): boolean {
  return Object.entries(storyFlags).every(([flag, value]) => (
    isValidNarrativeId(flag) && typeof value === 'boolean'
  ));
}

function validKnowledgeRegistry(
  definitions: readonly RuntimeKnowledgeNodeDefinition[],
): boolean {
  const keys = new Set<string>();
  return definitions.every((definition) => {
    const key = `${definition.audience}:${definition.nodeId}`;
    if (
      !isValidNarrativeId(definition.nodeId)
      || keys.has(key)
      || typeof definition.published !== 'boolean'
      || typeof definition.playerVisible !== 'boolean'
    ) {
      return false;
    }
    keys.add(key);
    return true;
  });
}

function validKnowledgeGrants(
  plan: NarrativeEffectPlan,
  definitions: readonly RuntimeKnowledgeNodeDefinition[],
): boolean {
  if (!validKnowledgeRegistry(definitions)) return false;
  const grantKeys = new Set<string>();
  return plan.knowledgeGrants.every((grant) => {
    const nodeId = grant.nodeId.trim();
    const key = `${grant.audience}:${nodeId}`;
    if (
      !isValidNarrativeId(nodeId)
      || grantKeys.has(key)
    ) {
      return false;
    }
    grantKeys.add(key);
    const definition = definitions.find((item) => (
      item.nodeId === nodeId && item.audience === grant.audience
    ));
    return Boolean(
      definition?.published
      && (
        grant.audience === 'echo'
        || definition.playerVisible
      ),
    );
  });
}

function findPublishedStoryEvent(
  plan: NarrativeEffectPlan,
  storyEvents: readonly RuntimeStoryEventDefinition[],
): RuntimeStoryEventDefinition | null | undefined {
  if (!plan.storyEvent) return undefined;
  if (
    !isValidNarrativeId(plan.storyEvent.eventId)
    || !Number.isSafeInteger(plan.storyEvent.eventVersion)
    || plan.storyEvent.eventVersion < 1
    || plan.replayPolicy !== 'once'
    || (
      plan.source.kind === 'story'
      && plan.source.eventId.trim() !== plan.storyEvent.eventId.trim()
    )
  ) {
    return null;
  }
  const definition = storyEvents.find(({ eventId }) => (
    eventId === plan.storyEvent?.eventId.trim()
  ));
  if (!definition) return null;
  return definition;
}

function validatePlan(
  plan: NarrativeEffectPlan,
  context: NarrativeEventTransactionContext,
): NarrativeEventFailureReason | null {
  if (!validSource(plan.source)) return 'invalid-source';
  if (
    !Number.isSafeInteger(plan.eventVersion)
    || plan.eventVersion < 1
  ) {
    return 'invalid-event-version';
  }
  if (
    plan.replayPolicy !== 'once'
    && plan.replayPolicy !== 'repeatable'
  ) {
    return 'invalid-replay-policy';
  }
  if (
    plan.replayPolicy === 'repeatable'
    && (
      plan.source.kind === 'memory'
      || plan.source.kind === 'story'
      || plan.knowledgeGrants.length > 0
      || plan.storyEvent !== undefined
    )
  ) {
    return 'invalid-replay-policy';
  }
  if (!isValidTimestamp(plan.timestamp)) return 'invalid-timestamp';
  if (
    Object.keys(plan.echoEffect).length > 0
    && !normalizeCanonicalEchoEffect(plan.echoEffect)
  ) {
    return 'invalid-echo-effect';
  }
  if (!validFlags(plan.storyFlags)) return 'invalid-story-flag';
  if (!validKnowledgeGrants(plan, context.knowledgeNodes)) {
    return 'invalid-knowledge-node';
  }
  if (!validDialogueTransition(plan)) {
    return 'invalid-dialogue-transition';
  }
  if (plan.source.kind === 'story' && !plan.storyEvent) {
    return 'invalid-story-event';
  }

  const storyEvent = findPublishedStoryEvent(plan, context.storyEvents);
  if (plan.storyEvent && storyEvent === null) {
    const registered = context.storyEvents.find(({ eventId }) => (
      eventId === plan.storyEvent?.eventId.trim()
    ));
    return registered ? 'invalid-story-event' : 'story-event-not-found';
  }
  if (
    storyEvent
    && (
      !storyEvent.published
      || storyEvent.eventVersion !== plan.storyEvent?.eventVersion
    )
  ) {
    return storyEvent.published
      ? 'invalid-story-event'
      : 'story-event-unpublished';
  }

  const expectedFingerprint = createNarrativeEffectFingerprint({
    source: plan.source,
    eventVersion: plan.eventVersion,
    replayPolicy: plan.replayPolicy,
    echoEffect: plan.echoEffect,
    storyFlags: plan.storyFlags,
    knowledgeGrants: plan.knowledgeGrants,
    dialogueTransition: plan.dialogueTransition,
    storyEvent: plan.storyEvent,
  });
  if (
    !NARRATIVE_EVENT_FINGERPRINT_PATTERN.test(plan.fingerprint.trim())
    || plan.fingerprint.trim() !== expectedFingerprint
  ) {
    return 'invalid-fingerprint';
  }
  return null;
}

function applyNarrativeState(
  state: GameProgressionState,
  plan: NarrativeEffectPlan,
) {
  const narrative = state.story.narrative;
  const playerKnowledge = plan.knowledgeGrants
    .filter(({ audience }) => audience === 'player')
    .map(({ nodeId }) => nodeId.trim());
  const echoKnowledge = plan.knowledgeGrants
    .filter(({ audience }) => audience === 'echo')
    .map(({ nodeId }) => nodeId.trim());
  const memoryIds = plan.source.kind === 'memory'
    ? [plan.source.memoryId]
    : [];
  const fragmentIds = plan.source.kind === 'memory'
    && plan.source.fragmentId
    ? [plan.source.fragmentId]
    : [];

  let nextNarrative = {
    ...narrative,
    unlockedMemoryIds: unique([
      ...narrative.unlockedMemoryIds,
      ...memoryIds,
    ]),
    unlockedMemoryFragmentIds: unique([
      ...narrative.unlockedMemoryFragmentIds,
      ...fragmentIds,
    ]),
    knowledgeNodeIds: unique([
      ...narrative.knowledgeNodeIds,
      ...playerKnowledge,
    ]),
    echoKnowledgeNodeIds: unique([
      ...narrative.echoKnowledgeNodeIds,
      ...echoKnowledge,
    ]),
    activeFlags: {
      ...narrative.activeFlags,
      ...plan.storyFlags,
    },
  };

  if (plan.source.kind === 'dialogue') {
    const decisionId =
      `${plan.source.dialogueId.trim()}:${plan.source.nodeId.trim()}`;
    const completedDialogueIds = plan.dialogueTransition?.completed
      ? unique([
          ...nextNarrative.dialogue.completedDialogueIds,
          plan.source.dialogueId,
        ])
      : nextNarrative.dialogue.completedDialogueIds;
    nextNarrative = {
      ...nextNarrative,
      latestDecisions: {
        ...nextNarrative.latestDecisions,
        [decisionId]: plan.source.choiceId.trim(),
      },
      decisionHistory: [
        ...nextNarrative.decisionHistory,
        {
          id: decisionId,
          choiceId: plan.source.choiceId.trim(),
          source: 'dialogue',
          createdAt: Date.parse(plan.timestamp),
          metadata: {
            dialogueId: plan.source.dialogueId.trim(),
            nodeId: plan.source.nodeId.trim(),
          },
        },
      ],
      dialogue: {
        activeDialogueId: plan.dialogueTransition?.completed
          ? null
          : plan.source.dialogueId,
        currentNodeId: plan.dialogueTransition?.nextNodeId ?? null,
        completedDialogueIds,
      },
    };
  }

  return nextNarrative;
}

/**
 * Applies a Memory, Dialogue, Story, or Cinematic narrative source atomically.
 * The source receipt is the sole idempotency owner; no Echo receipt is added.
 */
export function applyNarrativeEventTransaction(
  state: GameProgressionState,
  plan: NarrativeEffectPlan,
  context: NarrativeEventTransactionContext,
): NarrativeEventTransactionResult {
  const receiptKey = createNarrativeSourceReceiptKey(
    plan.source,
    plan.eventVersion,
  );
  const fingerprint = plan.fingerprint.trim();
  const validationFailure = validatePlan(plan, context);
  if (validationFailure) {
    return failed(
      state,
      receiptKey,
      fingerprint,
      validationFailure,
    );
  }

  const receipts = state.narrativeEvents;
  const legacyFragmentReceiptKey = plan.source.kind === 'memory'
    && plan.source.fragmentId
    && plan.eventVersion === 1
    ? `memory-fragment:${plan.source.fragmentId}:1`
    : null;
  const hasReceipt = plan.replayPolicy === 'once'
    && (
      receipts.claimedSourceReceiptKeys.includes(receiptKey)
      || (
        legacyFragmentReceiptKey !== null
        && receipts.claimedSourceReceiptKeys.includes(
          legacyFragmentReceiptKey,
        )
      )
    );
  const storedFingerprint =
    receipts.sourceFingerprintsByReceiptKey[receiptKey];
  if (hasReceipt) {
    if (storedFingerprint && storedFingerprint !== fingerprint) {
      return failed(
        state,
        receiptKey,
        fingerprint,
        'narrative-event-conflict',
        true,
      );
    }
    return {
      success: true,
      applied: false,
      alreadyApplied: true,
      conflict: false,
      receiptKey,
      fingerprint,
      state,
    };
  }

  const echoTransition = Object.keys(plan.echoEffect).length > 0
    ? applyCanonicalEchoEffect(state.echo, plan.echoEffect)
    : { success: true, echo: state.echo };
  if (!echoTransition.success) {
    return failed(
      state,
      receiptKey,
      fingerprint,
      'invalid-echo-effect',
    );
  }

  const proof: ProvenStoryEvent | null = plan.storyEvent
    ? {
        eventId: plan.storyEvent.eventId.trim(),
        eventVersion: plan.storyEvent.eventVersion,
        fingerprint: fingerprint.slice('narrative-v1-'.length),
        timestamp: plan.timestamp.trim(),
      }
    : null;
  const evolution = proof
    ? evaluateEchoEvolution(
        state.evolution,
        context.evolutionStages,
        context.storyEvents,
        [
          ...Object.values(
            receipts.provenStoryEventsByReceiptKey,
          ),
          proof,
        ],
      )
    : null;
  if (evolution && !evolution.success) {
    return failed(
      state,
      receiptKey,
      fingerprint,
      'evolution-evaluation-failed',
    );
  }

  const shouldClaim = plan.replayPolicy === 'once';
  const nextState = reconcileGameProgressionState({
    ...state,
    echo: echoTransition.echo,
    narrativeEvents: shouldClaim
      ? {
          claimedSourceReceiptKeys: [
            ...receipts.claimedSourceReceiptKeys,
            receiptKey,
          ],
          sourceFingerprintsByReceiptKey: {
            ...receipts.sourceFingerprintsByReceiptKey,
            [receiptKey]: fingerprint,
          },
          sourceAppliedAtByReceiptKey: {
            ...receipts.sourceAppliedAtByReceiptKey,
            [receiptKey]: plan.timestamp.trim(),
          },
          provenStoryEventsByReceiptKey: proof
            ? {
                ...receipts.provenStoryEventsByReceiptKey,
                [receiptKey]: proof,
              }
            : receipts.provenStoryEventsByReceiptKey,
        }
      : receipts,
    evolution: evolution?.transitionAvailable
      ? evolution.plan!.nextProgress
      : state.evolution,
    story: {
      ...state.story,
      narrative: applyNarrativeState(state, plan),
    },
  });

  return {
    success: true,
    applied: true,
    alreadyApplied: false,
    conflict: false,
    receiptKey,
    fingerprint,
    state: nextState,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizedStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? unique(value.filter((item): item is string => (
        typeof item === 'string' && Boolean(item.trim())
      )).map((item) => item.trim()))
    : [];
}

/**
 * Keeps unknown future receipt IDs as opaque save data. They are never
 * executed or exposed through a runtime content registry by normalization.
 */
export function normalizeNarrativeEventProgressState(
  value: unknown,
): NarrativeEventProgressState {
  const source = isRecord(value) ? value : {};
  const claimedSourceReceiptKeys = normalizedStrings(
    source.claimedSourceReceiptKeys,
  );
  const fingerprints = isRecord(source.sourceFingerprintsByReceiptKey)
    ? source.sourceFingerprintsByReceiptKey
    : {};
  const timestamps = isRecord(source.sourceAppliedAtByReceiptKey)
    ? source.sourceAppliedAtByReceiptKey
    : {};
  const proofs = isRecord(source.provenStoryEventsByReceiptKey)
    ? source.provenStoryEventsByReceiptKey
    : {};

  const sourceFingerprintsByReceiptKey: Record<string, string> = {};
  for (const [key, fingerprint] of Object.entries(fingerprints)) {
    if (
      claimedSourceReceiptKeys.includes(key)
      && typeof fingerprint === 'string'
      && NARRATIVE_EVENT_FINGERPRINT_PATTERN.test(fingerprint)
    ) {
      sourceFingerprintsByReceiptKey[key] = fingerprint;
    }
  }
  const sourceAppliedAtByReceiptKey: Record<string, string> = {};
  for (const [key, timestamp] of Object.entries(timestamps)) {
    if (
      claimedSourceReceiptKeys.includes(key)
      && typeof timestamp === 'string'
      && isValidTimestamp(timestamp)
    ) {
      sourceAppliedAtByReceiptKey[key] = timestamp;
    }
  }
  const provenStoryEventsByReceiptKey: Record<string, ProvenStoryEvent> = {};
  for (const [key, rawProof] of Object.entries(proofs)) {
    if (!claimedSourceReceiptKeys.includes(key) || !isRecord(rawProof)) {
      continue;
    }
    const eventId = typeof rawProof.eventId === 'string'
      ? rawProof.eventId.trim()
      : '';
    const eventVersion = rawProof.eventVersion;
    const fingerprint = typeof rawProof.fingerprint === 'string'
      ? rawProof.fingerprint.trim()
      : '';
    const timestamp = typeof rawProof.timestamp === 'string'
      ? rawProof.timestamp.trim()
      : '';
    if (
      isValidNarrativeId(eventId)
      && Number.isSafeInteger(eventVersion)
      && (eventVersion as number) > 0
      && STORY_EVENT_FINGERPRINT_PATTERN.test(fingerprint)
      && isValidTimestamp(timestamp)
      && sourceFingerprintsByReceiptKey[key]
        === `narrative-v1-${fingerprint}`
    ) {
      provenStoryEventsByReceiptKey[key] = {
        eventId,
        eventVersion: eventVersion as number,
        fingerprint,
        timestamp,
      };
    }
  }

  return {
    claimedSourceReceiptKeys,
    sourceFingerprintsByReceiptKey,
    sourceAppliedAtByReceiptKey,
    provenStoryEventsByReceiptKey,
  };
}
