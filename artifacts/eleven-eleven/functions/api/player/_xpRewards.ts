import {
  CHAPTER_01_PUZZLE_BY_ID,
  CHAPTER_01_PUZZLES,
} from '../../../src/content/puzzles/chapter01Campaign';
import type {
  CampaignPuzzleDifficulty,
  CampaignPuzzleProgress,
} from '../../../src/domain/puzzles/campaignContracts';
import {
  isCampaignPuzzleSubmissionCorrect,
} from '../../../src/domain/puzzles/campaignEngine';
import {
  PLAYER_XP_SOURCE_TYPES,
  createXpRewardKey,
  type PlayerXpSourceType,
} from '../../../src/domain/player-progression/playerProgression';
import { PlayerApiError } from './_shared';

const PUZZLE_XP_BY_DIFFICULTY: Record<CampaignPuzzleDifficulty, number> = {
  tutorial: 75,
  easy: 100,
  medium: 150,
  hard: 225,
  page_finale: 300,
};

export interface VerifiedXpReward {
  sourceType: PlayerXpSourceType;
  sourceId: string;
  rewardKey: string;
  xpAmount: number;
  requiredRewardKeys: string[];
}

interface XpClaimBody {
  sourceType?: unknown;
  sourceId?: unknown;
  proof?: unknown;
  amount?: unknown;
  xp?: unknown;
  totalXp?: unknown;
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

function cleanPuzzleProof(value: unknown): CampaignPuzzleProgress[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) {
    throw new PlayerApiError(400, 'invalid_proof', 'Puzzle proof is invalid.');
  }

  return value.map((entry) => {
    if (
      typeof entry !== 'object'
      || entry === null
      || Array.isArray(entry)
    ) {
      throw new PlayerApiError(400, 'invalid_proof', 'Puzzle proof is invalid.');
    }
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.stageIndex !== 'number'
      || !Number.isInteger(candidate.stageIndex)
      || candidate.stageIndex < 0
      || candidate.stageIndex > 20
      || !Array.isArray(candidate.values)
      || candidate.values.length > 30
      || candidate.values.some((item) => (
        typeof item !== 'string' || item.length > 120
      ))
      || typeof candidate.matches !== 'object'
      || candidate.matches === null
      || Array.isArray(candidate.matches)
    ) {
      throw new PlayerApiError(400, 'invalid_proof', 'Puzzle proof is invalid.');
    }

    const matchEntries = Object.entries(
      candidate.matches as Record<string, unknown>,
    );
    if (
      matchEntries.length > 30
      || matchEntries.some(([key, item]) => (
        key.length > 120
        || typeof item !== 'string'
        || item.length > 120
      ))
    ) {
      throw new PlayerApiError(400, 'invalid_proof', 'Puzzle proof is invalid.');
    }

    return {
      stageIndex: candidate.stageIndex,
      values: [...candidate.values] as string[],
      matches: Object.fromEntries(matchEntries) as Record<string, string>,
    };
  });
}

function verifyPuzzleReward(
  sourceId: string,
  proof: unknown,
): VerifiedXpReward {
  const definition = CHAPTER_01_PUZZLE_BY_ID[sourceId];
  if (!definition) {
    throw new PlayerApiError(404, 'unknown_reward_source', 'Puzzle is unknown.');
  }
  const submission = cleanPuzzleProof(proof);
  if (!isCampaignPuzzleSubmissionCorrect(definition, submission)) {
    throw new PlayerApiError(
      422,
      'reward_not_verified',
      'Puzzle completion could not be verified.',
    );
  }

  const requiredRewardKeys = definition.prerequisites.map((prerequisite) => {
    const requiredPuzzle = CHAPTER_01_PUZZLES.find(
      (puzzle) => String(puzzle.order) === prerequisite,
    );
    if (!requiredPuzzle) {
      throw new PlayerApiError(
        503,
        'reward_catalog_invalid',
        'Puzzle reward prerequisites are invalid.',
      );
    }
    return createXpRewardKey('puzzle', requiredPuzzle.id);
  });

  return {
    sourceType: 'puzzle',
    sourceId: definition.id,
    rewardKey: createXpRewardKey('puzzle', definition.id),
    xpAmount: PUZZLE_XP_BY_DIFFICULTY[definition.difficulty],
    requiredRewardKeys,
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
  ) {
    throw new PlayerApiError(
      400,
      'client_xp_forbidden',
      'XP values are assigned only by the server.',
    );
  }

  const sourceType = cleanSourceType(input.sourceType);
  const sourceId = cleanSourceId(input.sourceId);
  if (sourceType === 'puzzle') {
    return verifyPuzzleReward(sourceId, input.proof);
  }

  throw new PlayerApiError(
    422,
    'reward_source_not_active',
    'This XP source is reserved for a future server validator.',
  );
}
