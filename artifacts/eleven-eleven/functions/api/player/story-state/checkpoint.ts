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
  claimManhwaStoryCheckpoint,
  parseManhwaReaderCheckpoint,
} from '../_storyState';

const MAX_CHECKPOINT_BYTES = 4_096;

export async function onRequestOptions({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const body = await readJsonBody<unknown>(request, {
      maxBytes: MAX_CHECKPOINT_BYTES,
      tooLargeCode: 'checkpoint_too_large',
      tooLargeMessage: 'Story checkpoint is too large.',
      invalidMessage: 'Story checkpoint is invalid.',
    });
    const result = await claimManhwaStoryCheckpoint(
      requirePlayerDatabase(env),
      account,
      parseManhwaReaderCheckpoint(body),
    );
    return jsonResponse(result, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
