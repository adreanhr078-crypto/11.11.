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
import { equipCosmetic } from '../_collection';

function parseCosmeticId(value: unknown): string {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_request', 'Cosmetic selection is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 1 || typeof input.cosmeticId !== 'string') {
    throw new PlayerApiError(400, 'invalid_request', 'Cosmetic selection is invalid.');
  }
  return input.cosmeticId.trim();
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account, idToken } = await authenticatePlayer(request, env);
    const collection = await equipCosmetic(
      requirePlayerDatabase(env),
      account,
      idToken,
      env,
      parseCosmeticId(await request.json()),
    );
    return jsonResponse({ collection }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

