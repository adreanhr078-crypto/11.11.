import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from './_shared';
import { resolvePlayerRolloutPolicy } from './_rolloutPolicy';

/**
 * Returns only a validated, deployment-owned presentation policy. Every
 * feature action remains responsible for checking its own player entitlement
 * and authoritative server state.
 */
export async function onRequestGet({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    await authenticatePlayer(request, env);
    return jsonResponse({
      policy: resolvePlayerRolloutPolicy(env.PLAYER_ROLLOUT_POLICY),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

export async function onRequestOptions({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}
