import { z } from 'zod';
import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  optionsResponse,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import { ensureNetworkPlayer } from '../_network';

const trainingSchema = z.object({
  training: z.enum(['chess', 'coop']),
  version: z.literal(1),
});

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const parsed = trainingSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: 2_048,
      tooLargeCode: 'training_receipt_too_large',
      tooLargeMessage: 'Training receipt is too large.',
      invalidMessage: 'Training receipt is invalid.',
    }));
    if (!parsed.success) {
      throw new PlayerApiError(400, 'invalid_training_receipt', 'Training receipt is invalid.');
    }
    const database = requirePlayerDatabase(env);
    await ensureNetworkPlayer(database, account);
    // A locally asserted training button must never unlock Ranked.  A future
    // server-led training room will write this milestone from its own receipt.
    throw new PlayerApiError(
      409,
      'training_verification_required',
      'Complete the verified training room when it is available.',
    );
  } catch (error) {
    return errorResponse(error, headers);
  }
}
