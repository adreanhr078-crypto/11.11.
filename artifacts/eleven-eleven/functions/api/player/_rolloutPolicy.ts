import { PlayerApiError } from './_shared';

/**
 * A presentation policy, not progression authority.  It may hide or expose a
 * surface, but it must never grant a receipt, reward, rating, unlock, or
 * access to an authoritative action by itself.
 *
 * PLAYER_ROLLOUT_POLICY example (stored in deployment configuration only):
 * {
 *   "version": 1,
 *   "expiresAt": "2027-01-01T00:00:00.000Z",
 *   "dailyEnabled": true,
 *   "weeklyEnabled": false,
 *   "networkEnabled": false,
 *   "communityEnabled": false,
 *   "forgeSubmissionEnabled": false,
 *   "echoAgentEnabled": false,
 *   "part2WorldEnabled": false
 * }
 */
export interface PlayerRolloutPolicy {
  version: number;
  expiresAt: string | null;
  dailyEnabled: boolean;
  weeklyEnabled: boolean;
  networkEnabled: boolean;
  communityEnabled: boolean;
  forgeSubmissionEnabled: boolean;
  echoAgentEnabled: boolean;
  part2WorldEnabled: boolean;
}

export type PlayerRolloutFlag = Exclude<keyof PlayerRolloutPolicy, 'version' | 'expiresAt'>;

const ROLLOUT_FLAGS: readonly PlayerRolloutFlag[] = [
  'dailyEnabled',
  'weeklyEnabled',
  'networkEnabled',
  'communityEnabled',
  'forgeSubmissionEnabled',
  'echoAgentEnabled',
  'part2WorldEnabled',
];

const MAX_POLICY_CHARACTERS = 8_192;
const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function disabledPolicy(
  version = 0,
  expiresAt: string | null = null,
): PlayerRolloutPolicy {
  return {
    version,
    expiresAt,
    dailyEnabled: false,
    weeklyEnabled: false,
    networkEnabled: false,
    communityEnabled: false,
    forgeSubmissionEnabled: false,
    echoAgentEnabled: false,
    part2WorldEnabled: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseVersion(value: unknown): number | null {
  if (typeof value !== 'number'
    || !Number.isSafeInteger(value)
    || value < 1
    || value > 1_000_000) {
    return null;
  }
  return value;
}

function parseExpiry(value: unknown): { expiresAt: string | null; timestamp: number | null } | null {
  if (value === undefined) return { expiresAt: null, timestamp: null };
  if (typeof value !== 'string' || !ISO_UTC_TIMESTAMP.test(value)) return null;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/);
  if (!parts) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const normalized = new Date(timestamp);
  const expectedMilliseconds = Number((parts[7] ?? '').padEnd(3, '0') || '0');
  if (normalized.getUTCFullYear() !== Number(parts[1])
    || normalized.getUTCMonth() + 1 !== Number(parts[2])
    || normalized.getUTCDate() !== Number(parts[3])
    || normalized.getUTCHours() !== Number(parts[4])
    || normalized.getUTCMinutes() !== Number(parts[5])
    || normalized.getUTCSeconds() !== Number(parts[6])
    || normalized.getUTCMilliseconds() !== expectedMilliseconds) {
    return null;
  }
  return { expiresAt: normalized.toISOString(), timestamp };
}

/**
 * Parses a policy from a deployment binding. The parser has no request input
 * and treats every configuration error as a complete, safe denial.
 */
export function resolvePlayerRolloutPolicy(
  rawPolicy: string | undefined,
  now: Date = new Date(),
): PlayerRolloutPolicy {
  const nowTimestamp = now.getTime();
  if (!Number.isFinite(nowTimestamp)) return disabledPolicy();
  const source = rawPolicy?.trim() ?? '';
  if (!source || source.length > MAX_POLICY_CHARACTERS) return disabledPolicy();

  let candidate: unknown;
  try {
    candidate = JSON.parse(source) as unknown;
  } catch {
    return disabledPolicy();
  }
  if (!isRecord(candidate)) return disabledPolicy();

  const version = parseVersion(candidate.version);
  const expiry = parseExpiry(candidate.expiresAt);
  if (version === null || expiry === null) return disabledPolicy();
  if (expiry.timestamp !== null && expiry.timestamp <= nowTimestamp) {
    return disabledPolicy(version, expiry.expiresAt);
  }

  const policy = disabledPolicy(version, expiry.expiresAt);
  for (const flag of ROLLOUT_FLAGS) {
    policy[flag] = candidate[flag] === true;
  }
  return policy;
}

/**
 * Authoritative action guard for staged systems.  The client receives the
 * same policy for presentation, but it can never use that presentation state
 * to bypass the server boundary.  Missing, malformed, and expired policy all
 * resolve to a closed feature.
 */
export function requirePlayerRolloutFeature(
  rawPolicy: string | undefined,
  feature: PlayerRolloutFlag,
  now?: Date,
): PlayerRolloutPolicy {
  const policy = resolvePlayerRolloutPolicy(rawPolicy, now);
  if (!policy[feature]) {
    throw new PlayerApiError(
      403,
      'rollout_disabled',
      'This experience is not available yet.',
    );
  }
  return policy;
}

/**
 * The live snapshot has one established response contract shared by Daily
 * and Weekly.  It may be read only while at least one live mode is enabled;
 * state-changing actions always use the more precise single-feature guard.
 */
export function requireAnyPlayerRolloutFeature(
  rawPolicy: string | undefined,
  features: readonly PlayerRolloutFlag[],
  now?: Date,
): PlayerRolloutPolicy {
  const policy = resolvePlayerRolloutPolicy(rawPolicy, now);
  if (!features.some((feature) => policy[feature])) {
    throw new PlayerApiError(
      403,
      'rollout_disabled',
      'This experience is not available yet.',
    );
  }
  return policy;
}
