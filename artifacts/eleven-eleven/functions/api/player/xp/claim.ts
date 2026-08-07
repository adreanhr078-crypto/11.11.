import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
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
    const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
    if (declaredLength > MAX_CLAIM_BYTES) {
      throw new PlayerApiError(413, 'claim_too_large', 'XP claim is too large.');
    }
    const { account } = await authenticatePlayer(request, env);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new PlayerApiError(400, 'invalid_request', 'XP claim is invalid.');
    }
    const encodedSize = new TextEncoder().encode(JSON.stringify(body)).byteLength;
    if (encodedSize > MAX_CLAIM_BYTES) {
      throw new PlayerApiError(413, 'claim_too_large', 'XP claim is too large.');
    }

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
