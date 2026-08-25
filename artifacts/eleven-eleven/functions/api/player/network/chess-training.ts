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
import { ensureNetworkPlayer } from '../_network';
import { requirePlayerRolloutFeature } from '../_rolloutPolicy';
import {
  startOrResumeChessTraining,
  submitChessTrainingMove,
  type ChessTrainingMoveInput,
} from './_chessTraining';

const MAX_TRAINING_REQUEST_BYTES = 2_048;

const submitSchema = z.object({
  version: z.literal(1),
  sessionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  expectedVersion: z.number().int().min(0).max(64),
  from: z.string().regex(/^[a-h][1-8]$/),
  to: z.string().regex(/^[a-h][1-8]$/),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
}).strict();

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

/** Returns the player's one active board or creates a fresh 15-minute board. */
export async function onRequestGet({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    requirePlayerRolloutFeature(env.PLAYER_ROLLOUT_POLICY, 'networkEnabled');
    const database = requirePlayerDatabase(env);
    await ensureNetworkPlayer(database, account);
    const snapshot = await startOrResumeChessTraining(database, account.uid);
    return jsonResponse({ ...snapshot }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

/**
 * Applies one legal tutorial move against the FEN/version issued by GET.
 * No client-supplied FEN, result, reward, or rating value exists in this
 * contract. Completion can stamp only chess_training_completed_at.
 */
export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account } = await authenticatePlayer(request, env);
    const parsed = submitSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: MAX_TRAINING_REQUEST_BYTES,
      tooLargeCode: 'training_request_too_large',
      tooLargeMessage: 'Chess training request is too large.',
      invalidMessage: 'Chess training request is invalid.',
    }));
    if (!parsed.success) {
      throw new PlayerApiError(400, 'invalid_training_request', 'Chess training request is invalid.');
    }
    requirePlayerRolloutFeature(env.PLAYER_ROLLOUT_POLICY, 'networkEnabled');
    const database = requirePlayerDatabase(env);
    await ensureNetworkPlayer(database, account);
    const move: ChessTrainingMoveInput = {
      sessionId: parsed.data.sessionId,
      idempotencyKey: parsed.data.idempotencyKey,
      expectedVersion: parsed.data.expectedVersion,
      from: parsed.data.from as ChessTrainingMoveInput['from'],
      to: parsed.data.to as ChessTrainingMoveInput['to'],
      ...(parsed.data.promotion ? { promotion: parsed.data.promotion } : {}),
    };
    const snapshot = await submitChessTrainingMove(database, account.uid, move);
    return jsonResponse({ ...snapshot }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
