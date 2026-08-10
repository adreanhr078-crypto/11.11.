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
    const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
    if (declaredLength > MAX_CHECKPOINT_BYTES) {
      throw new PlayerApiError(413, 'checkpoint_too_large', 'Story checkpoint is too large.');
    }
    const { account } = await authenticatePlayer(request, env);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new PlayerApiError(400, 'invalid_request', 'Story checkpoint is invalid.');
    }
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_CHECKPOINT_BYTES) {
      throw new PlayerApiError(413, 'checkpoint_too_large', 'Story checkpoint is too large.');
    }
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
