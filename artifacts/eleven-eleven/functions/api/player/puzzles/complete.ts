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
import {
  completeStoryPuzzle,
  parseStoryPuzzleDraft,
  parseStoryPuzzleId,
} from '../_storyPuzzles';

const MAX_BODY_BYTES = 16_000;

function parseBody(value: unknown): { puzzleId: string; draft: ReturnType<typeof parseStoryPuzzleDraft> } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_request', 'Puzzle completion is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== 'puzzleId' && key !== 'draft')) {
    throw new PlayerApiError(400, 'client_reward_forbidden', 'Rewards are assigned only by the server.');
  }
  return { puzzleId: parseStoryPuzzleId(input.puzzleId), draft: parseStoryPuzzleDraft(input.draft) };
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) {
      throw new PlayerApiError(413, 'puzzle_state_too_large', 'Puzzle state is too large.');
    }
    const { account } = await authenticatePlayer(request, env);
    const body = parseBody(await request.json());
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_BODY_BYTES) {
      throw new PlayerApiError(413, 'puzzle_state_too_large', 'Puzzle state is too large.');
    }
    const result = await completeStoryPuzzle(requirePlayerDatabase(env), account, body.puzzleId, body.draft);
    return jsonResponse({ reward: result }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
