import { z } from 'zod';
import { matchReceiptSchema } from '../../../../src/domain/echo-network/contracts';
import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  type PlayerApiContext,
} from '../_shared';
import { requirePlayerDatabase } from '../_database';

const matchIdSchema = z.string().trim().regex(/^match_[A-Za-z0-9_-]{3,90}$/);
const replayEnvelopeSchema = z.object({
  version: z.literal(1),
  receiptId: z.string().uuid(),
  matchId: matchIdSchema,
}).passthrough();
const MAX_REPLAY_BYTES = 512 * 1024;

interface ReplayOwnerRow {
  mode: 'chess_ranked_blitz' | 'chess_ranked_rapid' | 'chess_casual' | 'chess_anomaly' | 'coop_breach';
  receipt_json: string;
}

function replayKey(mode: ReplayOwnerRow['mode'], matchId: string): string {
  return `${mode === 'coop_breach' ? 'coop' : 'chess'}/${matchId}.json`;
}

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const matchId = matchIdSchema.safeParse(new URL(request.url).searchParams.get('matchId'));
    if (!matchId.success) {
      throw new PlayerApiError(400, 'invalid_match_id', 'The replay identifier is invalid.');
    }
    const database = requirePlayerDatabase(env);
    const ownedMatch = await database.prepare(`
      SELECT r.mode, r.receipt_json
      FROM network_match_receipts r
      JOIN network_match_participants p ON p.match_id = r.match_id
      WHERE r.match_id = ? AND p.user_id = ?
      LIMIT 1
    `).bind(matchId.data, account.uid).first<ReplayOwnerRow>();
    if (!ownedMatch) {
      throw new PlayerApiError(404, 'replay_not_found', 'This replay is unavailable.');
    }
    let receiptValue: unknown;
    try {
      receiptValue = JSON.parse(ownedMatch.receipt_json) as unknown;
    } catch {
      throw new PlayerApiError(502, 'replay_receipt_invalid', 'The stored match receipt is invalid.');
    }
    const receipt = matchReceiptSchema.safeParse(receiptValue);
    if (!receipt.success || receipt.data.matchId !== matchId.data || receipt.data.mode !== ownedMatch.mode) {
      throw new PlayerApiError(502, 'replay_receipt_invalid', 'The stored match receipt is invalid.');
    }
    if (!env.REPLAYS) {
      throw new PlayerApiError(503, 'replays_not_configured', 'Match replays are not configured.');
    }
    const replayObject = await env.REPLAYS.get(replayKey(ownedMatch.mode, matchId.data));
    if (!replayObject) {
      throw new PlayerApiError(404, 'replay_not_ready', 'This replay is still being prepared.');
    }
    if (!Number.isFinite(replayObject.size) || replayObject.size > MAX_REPLAY_BYTES) {
      throw new PlayerApiError(502, 'replay_invalid', 'The stored replay is invalid.');
    }
    let replayValue: unknown;
    try {
      replayValue = JSON.parse(await replayObject.text()) as unknown;
    } catch {
      throw new PlayerApiError(502, 'replay_invalid', 'The stored replay is invalid.');
    }
    const replay = replayEnvelopeSchema.safeParse(replayValue);
    if (!replay.success || replay.data.matchId !== receipt.data.matchId
      || replay.data.receiptId !== receipt.data.receiptId) {
      throw new PlayerApiError(502, 'replay_invalid', 'The stored replay is invalid.');
    }
    return jsonResponse({ receipt: receipt.data, replay: replay.data }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
