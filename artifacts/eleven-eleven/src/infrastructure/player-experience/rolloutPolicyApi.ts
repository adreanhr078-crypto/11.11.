import type { RolloutPolicy } from '../../application/player-journey/playerExperienceEntitlements';
import { getCurrentAuthSession } from '../../features/auth/authService';
import { playerApiRoot } from '../player-api/apiRoot';
import { fetchPlayerRequest } from '../player-api/playerRequest';

export class PlayerRolloutPolicyApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'rollout_unavailable' | 'invalid_rollout_response',
    message: string,
  ) {
    super(message);
    this.name = 'PlayerRolloutPolicyApiError';
  }
}

function runtimeApiRoot(): string {
  const runtimeEnv = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
  return playerApiRoot(runtimeEnv?.VITE_PLAYER_API_URL?.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function isExactUtcTimestamp(value: string): boolean {
  if (!ISO_UTC_TIMESTAMP.test(value)) return false;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/);
  if (!parts) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const normalized = new Date(timestamp);
  const expectedMilliseconds = Number((parts[7] ?? '').padEnd(3, '0') || '0');
  return normalized.getUTCFullYear() === Number(parts[1])
    && normalized.getUTCMonth() + 1 === Number(parts[2])
    && normalized.getUTCDate() === Number(parts[3])
    && normalized.getUTCHours() === Number(parts[4])
    && normalized.getUTCMinutes() === Number(parts[5])
    && normalized.getUTCSeconds() === Number(parts[6])
    && normalized.getUTCMilliseconds() === expectedMilliseconds;
}

function parseRolloutPolicy(value: unknown): RolloutPolicy | null {
  if (!isRecord(value)) return null;
  const version = value.version;
  const expiresAt = value.expiresAt;
  if (
    typeof version !== 'number'
    || !Number.isSafeInteger(version)
    || version < 1
    || version > 1_000_000
    || (expiresAt !== null && typeof expiresAt !== 'string')
    || (typeof expiresAt === 'string' && !isExactUtcTimestamp(expiresAt))
  ) return null;
  const flags = [
    'dailyEnabled',
    'weeklyEnabled',
    'networkEnabled',
    'communityEnabled',
    'forgeSubmissionEnabled',
    'echoAgentEnabled',
    'part2WorldEnabled',
  ] as const;
  if (flags.some((flag) => typeof value[flag] !== 'boolean')) return null;
  return {
    version,
    expiresAt,
    dailyEnabled: value.dailyEnabled as boolean,
    weeklyEnabled: value.weeklyEnabled as boolean,
    networkEnabled: value.networkEnabled as boolean,
    communityEnabled: value.communityEnabled as boolean,
    forgeSubmissionEnabled: value.forgeSubmissionEnabled as boolean,
    echoAgentEnabled: value.echoAgentEnabled as boolean,
    part2WorldEnabled: value.part2WorldEnabled as boolean,
  };
}

/**
 * Reads a deployment-owned display policy after Firebase authentication.
 * A failed, stale, malformed, or missing policy is deliberately represented
 * as an error so the caller can keep optional player-facing systems closed.
 */
export async function fetchPlayerRolloutPolicy(
  expectedUid?: string,
): Promise<RolloutPolicy> {
  const session = await getCurrentAuthSession(expectedUid);
  const response = await fetchPlayerRequest(`${runtimeApiRoot()}/rollout`, {
    headers: { Authorization: `Bearer ${session.token}` },
  }, 6_000);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new PlayerRolloutPolicyApiError(
      response.status,
      'rollout_unavailable',
      'Player rollout policy is unavailable.',
    );
  }
  const policy = isRecord(payload) ? parseRolloutPolicy(payload.policy) : null;
  if (!policy) {
    throw new PlayerRolloutPolicyApiError(
      502,
      'invalid_rollout_response',
      'Player rollout policy is invalid.',
    );
  }
  return policy;
}

export { parseRolloutPolicy };
