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
import { discoverStoryPuzzle, parseStoryPuzzleId } from '../_storyPuzzles';

function parseBody(value: unknown): string {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_request', 'Secret signal is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 1 || !('puzzleId' in input)) {
    throw new PlayerApiError(400, 'invalid_request', 'Secret signal is invalid.');
  }
  return parseStoryPuzzleId(input.puzzleId);
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const puzzleId = parseBody(await request.json());
    return jsonResponse({
      puzzleState: await discoverStoryPuzzle(requirePlayerDatabase(env), account, puzzleId),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
