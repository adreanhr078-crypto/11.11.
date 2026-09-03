import {
  FINAL_MANHWA_CHAPTERS,
  FINAL_MANHWA_PAGE_COUNT,
  getFinalManhwaChapterRewardSourceId,
} from '../../../src/content/manhwa/finalManhwa';
import {
  PLAYER_XP_SOURCE_TYPES,
  createXpRewardKey,
  type PlayerXpSourceType,
} from '../../../src/domain/player-progression/playerProgression';
import { PlayerApiError } from './_shared';

export interface VerifiedXpReward {
  sourceType: PlayerXpSourceType;
  sourceId: string;
  rewardKey: string;
  xpAmount: number;
  requiredRewardKeys: string[];
  memoryFragmentId?: string;
}

interface XpClaimBody {
  sourceType?: unknown;
  sourceId?: unknown;
  proof?: unknown;
  amount?: unknown;
  xp?: unknown;
  totalXp?: unknown;
  fragmentId?: unknown;
  secretId?: unknown;
}

function cleanSourceId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new PlayerApiError(400, 'invalid_request', 'sourceId is invalid.');
  }
  const sourceId = value.trim();
  if (!/^[a-z0-9_-]{1,100}$/i.test(sourceId)) {
    throw new PlayerApiError(400, 'invalid_request', 'sourceId is invalid.');
  }
  return sourceId;
}

function cleanSourceType(value: unknown): PlayerXpSourceType {
  if (
    typeof value !== 'string'
    || !PLAYER_XP_SOURCE_TYPES.includes(value as PlayerXpSourceType)
  ) {
    throw new PlayerApiError(400, 'invalid_request', 'sourceType is invalid.');
  }
  return value as PlayerXpSourceType;
}

function cleanManhwaProof(value: unknown): { finalPageNumber: number } {
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
  ) {
    throw new PlayerApiError(400, 'invalid_proof', 'Manhwa proof is invalid.');
  }
  const finalPageNumber = (value as Record<string, unknown>).finalPageNumber;
  if (
    typeof finalPageNumber !== 'number'
    || !Number.isInteger(finalPageNumber)
    || finalPageNumber < 1
    || finalPageNumber > FINAL_MANHWA_PAGE_COUNT
  ) {
    throw new PlayerApiError(400, 'invalid_proof', 'Manhwa proof is invalid.');
  }
  return { finalPageNumber };
}

function verifyManhwaChapterReward(
  sourceId: string,
  proof: unknown,
): VerifiedXpReward {
  const chapter = FINAL_MANHWA_CHAPTERS.find(({ chapterId }) => (
    chapterId === sourceId
  ));
  if (!chapter) {
    throw new PlayerApiError(
      404,
      'unknown_reward_source',
      'Manhwa chapter is unknown.',
    );
  }
  if (!chapter.published) {
    throw new PlayerApiError(
      409,
      'reward_source_unpublished',
      'This Manhwa chapter is not released in the current build.',
    );
  }
  const verifiedProof = cleanManhwaProof(proof);
  if (verifiedProof.finalPageNumber !== chapter.endPage) {
    throw new PlayerApiError(
      422,
      'reward_not_verified',
      'The chapter must be read through its final page.',
    );
  }
  return {
    sourceType: 'manhwa',
    sourceId: getFinalManhwaChapterRewardSourceId(chapter.chapterId)!,
    rewardKey: createXpRewardKey(
      'manhwa',
      getFinalManhwaChapterRewardSourceId(chapter.chapterId)!,
    ),
    xpAmount: chapter.xpReward,
    requiredRewardKeys: chapter.prerequisiteChapterId
      ? [createXpRewardKey(
        'manhwa',
        getFinalManhwaChapterRewardSourceId(chapter.prerequisiteChapterId)!,
      )]
      : [],
  };
}

export function verifyXpRewardClaim(body: unknown): VerifiedXpReward {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new PlayerApiError(400, 'invalid_request', 'XP claim is invalid.');
  }
  const input = body as XpClaimBody;
  if (
    input.amount !== undefined
    || input.xp !== undefined
    || input.totalXp !== undefined
    || input.fragmentId !== undefined
    || input.secretId !== undefined
  ) {
    throw new PlayerApiError(
      400,
      'client_xp_forbidden',
      'XP values are assigned only by the server.',
    );
  }

  const sourceType = cleanSourceType(input.sourceType);
  const sourceId = cleanSourceId(input.sourceId);
  if (sourceType === 'manhwa') {
    return verifyManhwaChapterReward(sourceId, input.proof);
  }

  throw new PlayerApiError(
    422,
    'reward_source_not_active',
    'This XP source is reserved for a future server validator.',
  );
}
