import type {
  ManhwaPageAuthoredEffect,
} from '../../core/manhwaPageViewTypes';
import {
  MANHWA_PAGE_EFFECT_VERSION,
} from '../../core/manhwaPageViewTypes';
import type {
  CanonicalEchoEffect,
  CanonicalEchoMetric,
} from '../../core/echoEventTypes';
import type {
  EchoMindDelta,
  ManhwaMemoryPageDefinition,
} from '../../domain/puzzles/campaignContracts';

function addEffect(
  effect: Partial<Record<CanonicalEchoMetric, number>>,
  key: CanonicalEchoMetric,
  amount: number | undefined,
): void {
  if (amount === undefined) return;
  effect[key] = (effect[key] ?? 0) + amount;
}

function toEchoEffect(delta: EchoMindDelta): CanonicalEchoEffect {
  const effect: Partial<Record<CanonicalEchoMetric, number>> = {};
  const emotions = delta.emotions;
  // Only same-semantic canonical channels cross the Manhwa boundary.
  // Legacy hope/rage/awareness-style signals remain content metadata and are
  // not remapped into a different psychological meaning.
  addEffect(effect, 'fear', emotions.fear);
  addEffect(effect, 'trust', emotions.trust);
  addEffect(effect, 'memoryStability', emotions.memoryStability);
  addEffect(effect, 'corruption', emotions.corruption);
  return effect;
}

/**
 * Maps authored Manhwa content into the canonical page-view transaction.
 * This adapter does not call or modify Echo Mind.
 */
export function createManhwaPageAuthoredEffect(
  page: ManhwaMemoryPageDefinition,
): ManhwaPageAuthoredEffect {
  const echoEffect = toEchoEffect(page.echoMindDelta);
  const hasAuthoredEffect = (
    Object.keys(echoEffect).length > 0
    || page.echoMindDelta.beliefsAdded.length > 0
    || page.echoMindDelta.questionsAdded.length > 0
    || page.echoMindDelta.knowledgeNodesAdded.length > 0
    || page.narrativeFlags.length > 0
    || page.dialogueTriggers.length > 0
  );

  return {
    effectVersion: MANHWA_PAGE_EFFECT_VERSION,
    echoEffect,
    storyFlags: Object.fromEntries(
      page.narrativeFlags.map((flag) => [flag, true]),
    ),
    beliefsAdded: [...page.echoMindDelta.beliefsAdded],
    questionsAdded: [...page.echoMindDelta.questionsAdded],
    knowledgeNodeIdsAdded: [
      ...page.echoMindDelta.knowledgeNodesAdded,
    ],
    dialogueTriggers: [...page.dialogueTriggers],
    ...(hasAuthoredEffect ? { dialogueLine: page.dialogue.ar } : {}),
    hasAuthoredEffect,
  };
}
