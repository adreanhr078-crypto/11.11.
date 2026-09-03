import {
  FINAL_MANHWA_CANON_EVENTS,
  RETIRED_FINAL_MANHWA_CANON_EVENT_IDS,
  RETIRED_FINAL_MANHWA_KNOWLEDGE_NODE_IDS,
  RETIRED_FINAL_MANHWA_STORY_FLAGS,
  getFinalManhwaCanonEvent,
} from '../../content/story/finalManhwaCanonEvents';
import {
  createInitialEchoEvolutionProgressState,
} from '../../core/gameProgressionDefaults';
import type {
  GameActions,
} from '../../core/gameTypes';
import type {
  NarrativeEffectPlan,
} from '../../core/narrativeEventTypes';
import {
  createNarrativeEffectFingerprint,
  createNarrativeSourceReceiptKey,
} from '../../domain/narrative/narrativeEffectPlan';
import {
  applyNarrativeEventTransaction,
} from '../../domain/narrative/narrativeEventTransaction';
import {
  RUNTIME_NARRATIVE_KNOWLEDGE_NODES,
} from '../../domain/narrative/knowledgeRegistry';
import {
  RUNTIME_ECHO_EVOLUTION_STAGES,
  RUNTIME_ECHO_STORY_EVENTS,
} from '../../domain/echo/echoEvolutionDefinitions';
import {
  normalizeAuthoritativeStoryState,
  type AuthoritativeStoryEventReceipt,
  type AuthoritativeStoryState,
} from '../../domain/story/storyState';
import {
  projectGameProgressionCompatibility,
} from '../game/createGameProgressionActions';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../game/statePorts';

type StoryStateActions = Pick<
  GameActions,
  | 'syncAuthoritativeStoryState'
  | 'markEchoTransformationIntroSeen'
>;

const NARRATIVE_TRANSACTION_CONTEXT = {
  knowledgeNodes: RUNTIME_NARRATIVE_KNOWLEDGE_NODES,
  storyEvents: RUNTIME_ECHO_STORY_EVENTS,
  evolutionStages: RUNTIME_ECHO_EVOLUTION_STAGES,
};

function createPlan(
  receipt: AuthoritativeStoryEventReceipt,
): NarrativeEffectPlan | null {
  const definition = getFinalManhwaCanonEvent(receipt.eventId);
  if (!definition || receipt.eventVersion !== definition.eventVersion) {
    return null;
  }
  const input = {
    source: { kind: 'story' as const, eventId: definition.eventId },
    eventVersion: definition.eventVersion,
    replayPolicy: 'once' as const,
    echoEffect: {},
    storyFlags: { [definition.storyFlag]: true },
    knowledgeGrants: definition.knowledgeGrants,
    storyEvent: {
      eventId: definition.eventId,
      eventVersion: definition.eventVersion,
    },
  };
  return {
    ...input,
    fingerprint: createNarrativeEffectFingerprint(input),
    timestamp: receipt.reachedAt,
  };
}

function withoutKnownStoryProjection(
  state: ReturnType<GameStateGetter>['progressionState'],
  authoritative: AuthoritativeStoryState,
): ReturnType<GameStateGetter>['progressionState'] {
  const knownReceiptKeys = new Set([
    ...FINAL_MANHWA_CANON_EVENTS.map((definition) => (
      createNarrativeSourceReceiptKey({
        kind: 'story',
        eventId: definition.eventId,
      }, definition.eventVersion)
    )),
    ...RETIRED_FINAL_MANHWA_CANON_EVENT_IDS.map((eventId) => (
      createNarrativeSourceReceiptKey({ kind: 'story', eventId }, 1)
    )),
  ]);
  const knownFlags = new Set<string>([
    ...FINAL_MANHWA_CANON_EVENTS.map((definition) => definition.storyFlag),
    ...RETIRED_FINAL_MANHWA_STORY_FLAGS,
  ]);
  const knownKnowledge = new Set<string>([
    ...FINAL_MANHWA_CANON_EVENTS.flatMap((definition) => (
      definition.knowledgeGrants.map((grant) => grant.nodeId)
    )),
    ...RETIRED_FINAL_MANHWA_KNOWLEDGE_NODE_IDS,
  ]);
  const keepReceipt = (key: string) => !knownReceiptKeys.has(key);
  const retainedReceiptKeys = state.narrativeEvents.claimedSourceReceiptKeys
    .filter(keepReceipt);

  return {
    ...state,
    manhwa: {
      ...state.manhwa,
      completedChapterIds: [...authoritative.completedChapterIds],
    },
    narrativeEvents: {
      claimedSourceReceiptKeys: retainedReceiptKeys,
      sourceFingerprintsByReceiptKey: Object.fromEntries(
        Object.entries(state.narrativeEvents.sourceFingerprintsByReceiptKey)
          .filter(([key]) => keepReceipt(key)),
      ),
      sourceAppliedAtByReceiptKey: Object.fromEntries(
        Object.entries(state.narrativeEvents.sourceAppliedAtByReceiptKey)
          .filter(([key]) => keepReceipt(key)),
      ),
      provenStoryEventsByReceiptKey: Object.fromEntries(
        Object.entries(state.narrativeEvents.provenStoryEventsByReceiptKey)
          .filter(([key]) => keepReceipt(key)),
      ),
    },
    evolution: {
      ...createInitialEchoEvolutionProgressState(),
      transformationIntroSeen: [
        ...(state.evolution.transformationIntroSeen ?? []),
      ],
    },
    story: {
      ...state.story,
      authoritative,
      narrative: {
        ...state.story.narrative,
        activeFlags: Object.fromEntries(
          Object.entries(state.story.narrative.activeFlags)
            .filter(([flag]) => !knownFlags.has(flag)),
        ),
        knowledgeNodeIds: state.story.narrative.knowledgeNodeIds
          .filter((nodeId) => !knownKnowledge.has(nodeId)),
        echoKnowledgeNodeIds: state.story.narrative.echoKnowledgeNodeIds
          .filter((nodeId) => !knownKnowledge.has(nodeId)),
      },
    },
  };
}

/**
 * Applies a server snapshot as the sole Canon authority. Any local projection
 * of published Manhwa events is rebuilt from server receipts, so replaying a
 * page or editing local storage cannot create a durable transformation.
 */
export function createStoryStateActions(
  set: GameStateSetter,
  get: GameStateGetter,
): StoryStateActions {
  return {
    syncAuthoritativeStoryState(snapshot) {
      const authoritative = normalizeAuthoritativeStoryState(snapshot);
      let next = withoutKnownStoryProjection(
        get().progressionState,
        authoritative,
      );
      for (const receipt of authoritative.canonEventReceipts) {
        const plan = createPlan(receipt);
        if (!plan) return false;
        const result = applyNarrativeEventTransaction(
          next,
          plan,
          NARRATIVE_TRANSACTION_CONTEXT,
        );
        if (!result.success) return false;
        next = result.state;
      }

      set((state) => projectGameProgressionCompatibility(state, next));
      return true;
    },

    markEchoTransformationIntroSeen(stageId) {
      const normalized = stageId.trim();
      if (!normalized) return false;
      const current = get().progressionState.evolution;
      if (!current.reachedStageIds.includes(normalized)) return false;
      if (current.transformationIntroSeen?.includes(normalized)) return true;
      set((state) => ({
        progressionState: {
          ...state.progressionState,
          evolution: {
            ...state.progressionState.evolution,
            transformationIntroSeen: [
              ...(state.progressionState.evolution.transformationIntroSeen ?? []),
              normalized,
            ],
          },
        },
      }));
      return true;
    },
  };
}
