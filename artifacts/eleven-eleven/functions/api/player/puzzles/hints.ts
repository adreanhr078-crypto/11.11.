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
import { parseStoryPuzzleId, unlockStoryPuzzleHint } from '../_storyPuzzles';

function parseBody(value: unknown): { puzzleId: string; hintIndex: number } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_request', 'Hint request is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== 'puzzleId' && key !== 'hintIndex')) {
    throw new PlayerApiError(400, 'client_reward_forbidden', 'Hint prices are assigned only by the server.');
  }
  if (typeof input.hintIndex !== 'number') {
    throw new PlayerApiError(400, 'invalid_hint', 'Hint request is invalid.');
  }
  return { puzzleId: parseStoryPuzzleId(input.puzzleId), hintIndex: input.hintIndex };
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const body = parseBody(await request.json());
    const result = await unlockStoryPuzzleHint(requirePlayerDatabase(env), account, body.puzzleId, body.hintIndex);
    return jsonResponse(result, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
