import type {
  ManhwaPageAuthoredEffect,
} from '../../core/manhwaPageViewTypes';
import type { EchoEffect } from '../../core/puzzleRewardTypes';
import type {
  EchoMindDelta,
  ManhwaMemoryPageDefinition,
} from '../../domain/puzzles/campaignContracts';

function addEffect(
  effect: EchoEffect,
  key: keyof EchoEffect,
  amount: number | undefined,
): void {
  if (amount === undefined) return;
  effect[key] = (effect[key] ?? 0) + amount;
}

function toEchoEffect(delta: EchoMindDelta): EchoEffect {
  const effect: EchoEffect = {};
  const emotions = delta.emotions;
  addEffect(effect, 'fear', emotions.fear);
  addEffect(effect, 'trust', emotions.trust);
  addEffect(effect, 'hope', emotions.hope);
  addEffect(effect, 'loneliness', emotions.loneliness);
  addEffect(effect, 'awareness', emotions.awareness);
  addEffect(effect, 'memoryStability', emotions.memoryStability);
  addEffect(effect, 'ragePoints', emotions.rage);
  addEffect(effect, 'forgivenessPoints', emotions.forgiveness);
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
