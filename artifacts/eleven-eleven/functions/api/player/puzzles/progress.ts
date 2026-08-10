import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  PlayerApiError,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import {
  parseStoryPuzzleDraft,
  parseStoryPuzzleId,
  saveStoryPuzzleDraft,
} from '../_storyPuzzles';

const MAX_BODY_BYTES = 16_000;

function parseBody(value: unknown): { puzzleId: string; draft: ReturnType<typeof parseStoryPuzzleDraft> } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PlayerApiError(400, 'invalid_request', 'Puzzle progress is invalid.');
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== 'puzzleId' && key !== 'draft')) {
    throw new PlayerApiError(400, 'client_reward_forbidden', 'Only puzzle progress can be submitted.');
  }
  return { puzzleId: parseStoryPuzzleId(input.puzzleId), draft: parseStoryPuzzleDraft(input.draft) };
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const body = parseBody(await readJsonBody<unknown>(request, {
      maxBytes: MAX_BODY_BYTES,
      tooLargeCode: 'puzzle_state_too_large',
      tooLargeMessage: 'Puzzle state is too large.',
      invalidMessage: 'Puzzle progress is invalid.',
    }));
    return jsonResponse({
      puzzleState: await saveStoryPuzzleDraft(requirePlayerDatabase(env), account, body.puzzleId, body.draft),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
