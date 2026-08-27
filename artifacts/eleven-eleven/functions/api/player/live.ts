import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase } from './_database';
import {
  readLiveSnapshot,
  requireLiveChallengeProgression,
} from './_liveChallenges';
import { requireAnyPlayerRolloutFeature } from './_rolloutPolicy';

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    requireAnyPlayerRolloutFeature(env.PLAYER_ROLLOUT_POLICY, [
      'dailyEnabled',
      'weeklyEnabled',
    ]);
    const database = requirePlayerDatabase(env);
    // The snapshot endpoint is also a deep-link boundary: a new player must
    // not materialize Daily/Weekly state just by requesting this route.
    await requireLiveChallengeProgression(database, account, 'daily');
    const live = await readLiveSnapshot(database, account);
    return jsonResponse({ live }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
