import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  PlayerApiError,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import { reconstructMemory } from '../_collection';

function parseChapterId(value: unknown): string {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_request', 'Memory reconstruction is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 1 || typeof input.chapterId !== 'string') {
    throw new PlayerApiError(400, 'invalid_request', 'Memory reconstruction is invalid.');
  }
  return input.chapterId.trim();
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account, idToken } = await authenticatePlayer(request, env);
    const result = await reconstructMemory(
      requirePlayerDatabase(env),
      account,
      idToken,
      parseChapterId(await request.json()),
      env,
    );
    return jsonResponse({ collection: result.snapshot, reconstruction: { alreadyReconstructed: result.alreadyReconstructed } }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

