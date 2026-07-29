import type {
  EchoEffect,
  PuzzleReward,
} from '../../core/puzzleRewardTypes';
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
  effect: EchoEffect,
  key: keyof EchoEffect,
  amount: number | undefined,
): void {
  if (amount === undefined) return;
  effect[key] = (effect[key] ?? 0) + amount;
}

function toEchoEffect(deltas: readonly EchoMindDelta[]): EchoEffect {
  const effect: EchoEffect = {};
  for (const delta of deltas) {
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
  }
  return effect;
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
