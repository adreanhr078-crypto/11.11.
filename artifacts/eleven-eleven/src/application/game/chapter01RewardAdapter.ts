import type {
  PuzzleReward,
} from '../../core/puzzleRewardTypes';
import type {
  CanonicalEchoEffect,
  CanonicalEchoMetric,
} from '../../core/echoEventTypes';
import type {
  CampaignPuzzleDefinition,
  EchoMindDelta,
} from '../../domain/puzzles/campaignContracts';

export const CHAPTER_01_REWARD_VERSION = 1;

export interface Chapter01RewardPlan {
  reward: PuzzleReward;
  narrativeDeltas: EchoMindDelta[];
  dialogueLines: string[];
  dialogueTriggers: string[];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function addEffect(
  effect: Partial<Record<CanonicalEchoMetric, number>>,
  key: CanonicalEchoMetric,
  amount: number | undefined,
): void {
  if (amount === undefined) return;
  effect[key] = (effect[key] ?? 0) + amount;
}

function toEchoEffect(
  deltas: readonly EchoMindDelta[],
): CanonicalEchoEffect | undefined {
  const effect: Partial<Record<CanonicalEchoMetric, number>> = {};
  for (const delta of deltas) {
    const emotions = delta.emotions;
    // Only same-semantic canonical channels cross the Puzzle boundary.
    // Legacy hope/rage/awareness-style signals are not remapped into a
    // different psychological meaning.
    addEffect(effect, 'fear', emotions.fear);
    addEffect(effect, 'trust', emotions.trust);
    addEffect(effect, 'memoryStability', emotions.memoryStability);
    addEffect(effect, 'corruption', emotions.corruption);
  }
  return Object.keys(effect).length > 0 ? effect : undefined;
}

/**
 * Adapts existing Chapter 01 content to the generic reward contract.
 * Manhwa page access and page effects are intentionally absent. Phase 2 pays
 * for pages inside the archive and applies authored page effects on first
 * eligible view, while puzzle rewards retain their authored values.
 */
export function createChapter01RewardPlan(
  definition: CampaignPuzzleDefinition,
): Chapter01RewardPlan {
  const narrativeDeltas = [definition.echoMindDelta];

  return {
    reward: {
      rewardVersion: CHAPTER_01_REWARD_VERSION,
      coins: definition.rewards.coins,
      memoryShards: [{
        id: definition.rewards.shardId,
      }],
      echoEffect: toEchoEffect(narrativeDeltas),
      storyFlags: Object.fromEntries(
        unique(definition.narrativeFlags).map((flag) => [flag, true]),
      ),
    },
    narrativeDeltas,
    dialogueLines: [definition.dialogue.ar],
    dialogueTriggers: unique(definition.dialogueTriggers),
  };
}
