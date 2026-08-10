import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase } from './_database';
import { readLiveSnapshot } from './_liveChallenges';

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const live = await readLiveSnapshot(requirePlayerDatabase(env), account);
    return jsonResponse({ live }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
