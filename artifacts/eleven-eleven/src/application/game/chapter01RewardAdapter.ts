import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
} from '../../content/puzzles/chapter01Campaign';
import type { GameProgressionState } from '../../core/gameProgressionTypes';
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
  restoredPageId?: string;
  integratedShardIds: string[];
  pageEffectReceiptId?: string;
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
 * Page 01 is already free in canonical state, so its authored page effect is
 * never folded into Puzzle 001. A paid page effect is included only when this
 * exact reward will unlock that page for the first time.
 */
export function createChapter01RewardPlan(
  definition: CampaignPuzzleDefinition,
  progressionState: GameProgressionState,
): Chapter01RewardPlan {
  const page = CHAPTER_01_MANHWA_PAGE_BY_ID[definition.targetPageId];
  const discoveredShardIds = unique([
    ...progressionState.resources.memoryShards.discoveredShardIds,
    definition.rewards.shardId,
  ]);
  const prerequisiteAvailable = Boolean(
    page
    && (
      !page.prerequisitePageId
      || progressionState.manhwa.unlockedPageIds.includes(
        page.prerequisitePageId,
      )
    )
  );
  const willUnlockPage = Boolean(
    page
    && prerequisiteAvailable
    && !progressionState.manhwa.unlockedPageIds.includes(page.id)
    && page.requiredShardIds.every(
      (shardId) => discoveredShardIds.includes(shardId),
    )
  );
  const narrativeDeltas = [
    definition.echoMindDelta,
    ...(willUnlockPage && page ? [page.echoMindDelta] : []),
  ];
  const storyFlags = unique([
    ...definition.narrativeFlags,
    ...(willUnlockPage && page ? page.narrativeFlags : []),
  ]);

  return {
    reward: {
      rewardVersion: CHAPTER_01_REWARD_VERSION,
      coins: definition.rewards.coins,
      memoryShards: [{
        id: definition.rewards.shardId,
      }],
      echoEffect: toEchoEffect(narrativeDeltas),
      storyFlags: Object.fromEntries(
        storyFlags.map((flag) => [flag, true]),
      ),
      pageUnlocks: page && prerequisiteAvailable
        ? [{
            pageId: page.id,
            requiredShardIds: page.requiredShardIds,
          }]
        : [],
    },
    narrativeDeltas,
    dialogueLines: [
      definition.dialogue.ar,
      ...(willUnlockPage && page ? [page.dialogue.ar] : []),
    ],
    dialogueTriggers: unique([
      ...definition.dialogueTriggers,
      ...(willUnlockPage && page ? page.dialogueTriggers : []),
    ]),
    ...(willUnlockPage && page
      ? {
          restoredPageId: page.id,
          pageEffectReceiptId: page.id,
        }
      : {}),
    integratedShardIds: willUnlockPage && page
      ? [...page.requiredShardIds]
      : [],
  };
}
