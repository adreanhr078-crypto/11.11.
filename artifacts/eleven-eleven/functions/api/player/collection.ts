import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase } from './_database';
import { readCollectionSnapshot } from './_collection';

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account, idToken } = await authenticatePlayer(request, env);
    const collection = await readCollectionSnapshot(requirePlayerDatabase(env), account, idToken, env);
    return jsonResponse({ collection }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

