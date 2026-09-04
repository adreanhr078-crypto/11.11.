import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import {
  completeOpeningRecovery,
  parseOpeningRecoveryBody,
} from '../_opening';
import { readAuthoritativeStoryState } from '../_storyState';

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const body = parseOpeningRecoveryBody(await readJsonBody<unknown>(request, {
      maxBytes: 4_096,
      tooLargeCode: 'opening_recovery_too_large',
      tooLargeMessage: 'Opening recovery is too large.',
      invalidMessage: 'Opening recovery is invalid.',
    }));
    const database = requirePlayerDatabase(env);
    const receipt = await completeOpeningRecovery(database, account, body.imageOrder);
    const storyState = await readAuthoritativeStoryState(database, account);
    return jsonResponse({ receipt, storyState }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
