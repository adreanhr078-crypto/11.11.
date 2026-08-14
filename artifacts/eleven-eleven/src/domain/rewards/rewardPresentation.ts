import type { MatchReceipt } from '../echo-network/contracts';
import type { LiveCompletionReceipt } from '../live-challenges/liveChallengeContracts';
import type { StoryPuzzleRewardReceipt } from '../story-puzzles/storyPuzzleContracts';

export type RewardPresentationStatus =
  | 'awarded'
  | 'already-awarded'
  | 'progress-only';

export interface RewardPresentation {
  /** A display key only. It must never grant a reward client-side. */
  presentationKey: string;
  source: 'story-puzzle' | 'live-challenge' | 'network-match';
  status: RewardPresentationStatus;
  xpAmount: number;
  coinAmount: number;
  cosmeticIds: readonly string[];
  memoryShardId: string | null;
  avatarId: string | null;
}

export function presentStoryPuzzleReward(
  receipt: StoryPuzzleRewardReceipt,
): RewardPresentation {
  return {
    presentationKey: `story-puzzle:${receipt.puzzleId}`,
    source: 'story-puzzle',
    status: receipt.awarded ? 'awarded' : 'already-awarded',
    xpAmount: receipt.awarded ? receipt.xpGranted : 0,
    coinAmount: receipt.awarded
      ? receipt.coinsGranted + receipt.perfectBonusCoins
      : 0,
    cosmeticIds: [],
    memoryShardId: receipt.awarded ? receipt.shardId : null,
    avatarId: null,
  };
}

export function presentLiveChallengeReward(
  receipt: LiveCompletionReceipt,
): RewardPresentation {
  const completed = receipt.kind === 'daily'
    ? receipt.live.daily.status === 'completed'
    : receipt.live.weekly.status === 'completed';
  return {
    presentationKey: `live:${receipt.kind}:${receipt.challengeId}`,
    source: 'live-challenge',
    status: receipt.awarded
      ? 'awarded'
      : completed ? 'already-awarded' : 'progress-only',
    xpAmount: receipt.awarded ? receipt.xpGranted : 0,
    coinAmount: receipt.awarded ? receipt.coinsGranted : 0,
    cosmeticIds: receipt.awarded && receipt.reward?.rewardId
      ? [receipt.reward.rewardId]
      : [],
    memoryShardId: receipt.awarded && receipt.reward?.kind === 'memory-shard'
      ? receipt.reward.rewardId ?? null
      : null,
    avatarId: receipt.awarded ? receipt.reward?.avatarId ?? null : null,
  };
}

export function presentNetworkMatchReward(
  receipt: MatchReceipt,
  playerUid: string,
): RewardPresentation | null {
  const reward = receipt.rewards.find((candidate) => candidate.uid === playerUid);
  if (!reward) return null;
  return {
    presentationKey: `network-match:${receipt.receiptId}:${reward.rewardKey}`,
    source: 'network-match',
    status: 'awarded',
    xpAmount: reward.xpAmount,
    coinAmount: 0,
    cosmeticIds: reward.cosmeticIds,
    memoryShardId: null,
    avatarId: null,
  };
}
