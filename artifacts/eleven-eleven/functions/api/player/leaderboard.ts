import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase } from './_database';
import { readLeaderboard } from './_progressionRepository';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function leaderboardLimit(request: Request): number {
  const raw = new URL(request.url).searchParams.get('limit');
  if (raw === null) return DEFAULT_LIMIT;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new PlayerApiError(400, 'invalid_request', 'limit is invalid.');
  }
  return value;
}

export async function onRequestOptions({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const database = requirePlayerDatabase(env);
    const leaderboard = await readLeaderboard(
      database,
      account,
      leaderboardLimit(request),
    );
    return jsonResponse({
      leaderboard,
      rankingMetric: 'total_xp',
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
