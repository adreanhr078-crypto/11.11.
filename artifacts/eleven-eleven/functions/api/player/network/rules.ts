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

const acceptanceSchema = z.object({
  rulesVersion: z.literal(1),
  confirmsAge16Plus: z.literal(true),
});

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const parsed = acceptanceSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: 2_048,
      tooLargeCode: 'rules_request_too_large',
      tooLargeMessage: 'Rules acceptance is too large.',
      invalidMessage: 'Rules acceptance is invalid.',
    }));
    if (!parsed.success) {
      throw new PlayerApiError(400, 'invalid_rules_acceptance', 'Rules acceptance is invalid.');
    }
    const db = requirePlayerDatabase(env);
    const now = new Date().toISOString();
    await ensureNetworkPlayer(db, account, now);
    await db.prepare(`
      UPDATE network_player_milestones
      SET community_rules_version = 1,
        age_gate_confirmed_at = COALESCE(age_gate_confirmed_at, ?),
        updated_at = ?
      WHERE user_id = ?
    `).bind(now, now, account.uid).run();
    return jsonResponse({
      eligibility: await readNetworkEligibility(db, account.uid),
      storedBirthDate: false,
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
