import {
  CANONICAL_ECHO_METRIC_KEYS,
  type CanonicalEchoEffect,
  type CanonicalEchoMetric,
} from '../../core/echoEventTypes';
import type {
  NarrativeEffectPlan,
} from '../../core/narrativeEventTypes';
import type {
  ContentEffect,
  DialogueDefinition,
  DialogueNode,
  MemoryDefinition,
  MemoryFragmentDefinition,
} from '../../domain/content/contracts';
import type {
  EligibleMemorySource,
} from '../../domain/narrative/memorySystem';
import {
  createNarrativeEffectFingerprint,
} from '../../domain/narrative/narrativeEffectPlan';

const CANONICAL_METRICS = new Set<string>(
  CANONICAL_ECHO_METRIC_KEYS,
);

type PlanInput = Omit<
  NarrativeEffectPlan,
  'fingerprint' | 'timestamp'
>;

function finalize(
  input: PlanInput,
  timestamp: string,
): NarrativeEffectPlan {
  return {
    ...input,
    fingerprint: createNarrativeEffectFingerprint(input),
    timestamp,
  };
}

function canonicalImpact(
  impact: Readonly<Record<string, number | undefined>>,
): CanonicalEchoEffect | null {
  const effect: Partial<Record<CanonicalEchoMetric, number>> = {};
  for (const [metric, amount] of Object.entries(impact)) {
    if (
      amount === undefined
      || !CANONICAL_METRICS.has(metric)
      || !Number.isFinite(amount)
    ) {
      return null;
    }
    effect[metric as CanonicalEchoMetric] = amount;
  }
  return effect;
}

export function createMemoryNarrativeEffectPlan(
  source: EligibleMemorySource,
  timestamp: string,
): NarrativeEffectPlan | null {
  const authored: MemoryDefinition | MemoryFragmentDefinition =
    source.kind === 'memory' ? source.definition : source.fragment;
  const echoEffect = canonicalImpact(authored.emotionalImpact);
  if (!echoEffect) return null;

  const input: PlanInput = {
    source: {
      kind: 'memory',
      memoryId: source.definition.id,
      ...(source.kind === 'fragment'
        ? { fragmentId: source.fragment.id }
        : {}),
    },
    eventVersion: 1,
    replayPolicy: 'once',
    echoEffect,
    storyFlags: {},
    knowledgeGrants: [],
    ...(source.kind === 'memory' && source.definition.nextStoryEventId
      ? {
          storyEvent: {
            eventId: source.definition.nextStoryEventId,
            eventVersion: 1,
          },
        }
      : {}),
  };
  return finalize(input, timestamp);
}

function dialogueEffects(
  effects: readonly ContentEffect[],
): {
  echoEffect: CanonicalEchoEffect;
  storyFlags: Record<string, boolean>;
} | null {
  const echoEffect: Partial<Record<CanonicalEchoMetric, number>> = {};
  const storyFlags: Record<string, boolean> = {};
  for (const effect of effects) {
    switch (effect.kind) {
      case 'adjustStat':
        if (
          !CANONICAL_METRICS.has(effect.stat)
          || !Number.isFinite(effect.amount)
        ) {
          return null;
        }
        echoEffect[effect.stat as CanonicalEchoMetric] =
          (echoEffect[effect.stat as CanonicalEchoMetric] ?? 0)
          + effect.amount;
        break;
      case 'setFlag':
        storyFlags[effect.flag] = effect.value;
        break;
      default:
        // Other content effects require their own canonical source contract.
        // Rejecting here keeps the whole Dialogue choice atomic.
        return null;
    }
  }
  return { echoEffect, storyFlags };
}

export function createDialogueNarrativeEffectPlan(
  definition: DialogueDefinition,
  node: DialogueNode,
  choiceId: string,
  transition: {
    nextNodeId: string | null;
    completed: boolean;
  },
  timestamp: string,
  isReplay = false,
): NarrativeEffectPlan | null {
  const choice = node.choices.find(({ id }) => id === choiceId);
  if (!choice) return null;
  const authored = isReplay
    ? { echoEffect: {}, storyFlags: {} }
    : dialogueEffects(choice.effects);
  if (!authored) return null;
  const input: PlanInput = {
    source: {
      kind: 'dialogue',
      dialogueId: definition.id,
      nodeId: node.id,
      choiceId,
    },
    eventVersion: 1,
    replayPolicy: isReplay ? 'repeatable' : 'once',
    echoEffect: authored.echoEffect,
    storyFlags: authored.storyFlags,
    knowledgeGrants: [],
    dialogueTransition: transition,
  };
  return finalize(input, timestamp);
}
