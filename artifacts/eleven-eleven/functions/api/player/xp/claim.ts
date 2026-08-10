import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import { claimXpReward } from '../_progressionRepository';
import { verifyXpRewardClaim } from '../_xpRewards';

const MAX_CLAIM_BYTES = 48_000;

export async function onRequestOptions({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const body = await readJsonBody<unknown>(request, {
      maxBytes: MAX_CLAIM_BYTES,
      tooLargeCode: 'claim_too_large',
      tooLargeMessage: 'XP claim is too large.',
      invalidMessage: 'XP claim is invalid.',
    });

    const reward = verifyXpRewardClaim(body);
    const database = requirePlayerDatabase(env);
    const result = await claimXpReward(database, account, reward);
    return jsonResponse({
      reward: {
        sourceType: reward.sourceType,
        sourceId: reward.sourceId,
        rewardKey: reward.rewardKey,
        awarded: result.awarded,
        xpGranted: result.xpGranted,
      },
      progression: result.progression,
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
