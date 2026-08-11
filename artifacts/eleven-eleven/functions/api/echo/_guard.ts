import type {
  EchoProviderEnv,
} from './providers';
import type {
  PlayerDatabase,
} from '../player/_database';
import {
  requirePlayerDatabase,
} from '../player/_database';
import {
  ensurePlayerProgressionRow,
} from '../player/_progressionRepository';
import {
  authenticatePlayer,
  PlayerApiError,
  type FirebaseAccount,
  type PlayerApiEnv,
} from '../player/_shared';

export interface EchoGatewayEnv extends EchoProviderEnv, PlayerApiEnv {
  ECHO_ALLOWED_ORIGINS?: string;
}

export type EchoCapability = 'chat' | 'transcribe';

export interface AuthorizedEchoRequest {
  account: FirebaseAccount;
  database: PlayerDatabase;
}

const ECHO_EVENT_RETENTION_MS = 24 * 60 * 60 * 1_000;

function isEchoRateLimit(error: unknown): boolean {
  return error instanceof Error
    && /echo (?:minute|daily) rate limit exceeded/i.test(error.message);
}

/**
 * Echo provider calls are available only to verified player sessions. The D1
 * insert is guarded by migration triggers so concurrent requests cannot race
 * past the same per-player quota.
 */
export async function authenticateEchoRequest(
  request: Request,
  env: EchoGatewayEnv,
): Promise<AuthorizedEchoRequest> {
  const { account } = await authenticatePlayer(request, env);
  const database = requirePlayerDatabase(env);
  await ensurePlayerProgressionRow(database, account);
  return { account, database };
}

export async function consumeEchoQuota(
  authorized: AuthorizedEchoRequest,
  capability: EchoCapability,
): Promise<void> {
  const { account, database } = authorized;
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  try {
    await database.batch([
      database.prepare(`
        DELETE FROM echo_request_events
        WHERE user_id = ? AND requested_at_ms < ?
      `).bind(account.uid, nowMs - ECHO_EVENT_RETENTION_MS),
      database.prepare(`
        INSERT INTO echo_request_events (
          request_id,
          user_id,
          capability,
          requested_at_ms,
          requested_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        account.uid,
        capability,
        nowMs,
        now,
      ),
    ]);
  } catch (error) {
    if (isEchoRateLimit(error)) {
      throw new PlayerApiError(
        429,
        'echo_rate_limited',
        'Echo needs a moment before the next signal.',
      );
    }
    throw error;
  }
}

export async function authorizeEchoRequest(
  request: Request,
  env: EchoGatewayEnv,
  capability: EchoCapability,
): Promise<AuthorizedEchoRequest> {
  const authorized = await authenticateEchoRequest(request, env);
  await consumeEchoQuota(authorized, capability);
  return authorized;
}
