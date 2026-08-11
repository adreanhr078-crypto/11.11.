import { z } from 'zod';
import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';
import { ensureNetworkPlayer, readNetworkEligibility } from '../_network';

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
    const now = new Date().toISOString();
    await ensureNetworkPlayer(database, account, now);
    const column = parsed.data.training === 'chess'
      ? 'chess_training_completed_at'
      : 'coop_training_completed_at';
    await database.prepare(`
      UPDATE network_player_milestones
      SET ${column} = COALESCE(${column}, ?), updated_at = ?
      WHERE user_id = ?
    `).bind(now, now, account.uid).run();
    return jsonResponse({
      eligibility: await readNetworkEligibility(database, account.uid),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
