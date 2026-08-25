/**
 * The safe boundary shared by the future Echo Agent transport and the live
 * React companion. These objects are guidance only: they cannot contain a
 * puzzle solution, reward mutation, unlock command, or chess decision.
 */
export const ECHO_AGENT_INTENTS = [
  'objective_nudge',
  'navigation_help',
  'puzzle_encouragement',
  'story_reflection',
  'conversation',
  'chess_personality',
  'world_companion_bark',
] as const;

export type EchoAgentIntent = typeof ECHO_AGENT_INTENTS[number];

export interface EchoAgentRequest {
  version: 1;
  intent: EchoAgentIntent;
  locale: 'ar' | 'en';
  surface: string;
  utterance?: string;
  correlationId: string;
}

export interface EchoAgentSessionTicket {
  version: 1;
  /** Opaque, HMAC-derived instance id; never the Firebase UID. */
  subject: string;
  origin: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

const MAX_SURFACE_LENGTH = 80;
const MAX_UTTERANCE_LENGTH = 2_000;
const MAX_CORRELATION_LENGTH = 120;

function clean(value: unknown, maximum: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maximum)
    : '';
}

export function normalizeEchoAgentRequest(input: unknown): EchoAgentRequest | null {
  if (!input || typeof input !== 'object') return null;
  const source = input as Record<string, unknown>;
  const intent = source.intent;
  const locale = source.locale;
  const surface = clean(source.surface, MAX_SURFACE_LENGTH);
  const correlationId = clean(source.correlationId, MAX_CORRELATION_LENGTH);
  const utterance = clean(source.utterance, MAX_UTTERANCE_LENGTH);

  if (
    source.version !== 1
    || !ECHO_AGENT_INTENTS.includes(intent as EchoAgentIntent)
    || (locale !== 'ar' && locale !== 'en')
    || !surface
    || !correlationId
  ) return null;

  return {
    version: 1,
    intent: intent as EchoAgentIntent,
    locale,
    surface,
    correlationId,
    ...(utterance ? { utterance } : {}),
  };
}

/** Player-facing agent transports are intentionally restricted to this set. */
export function isReadOnlyEchoIntent(intent: EchoAgentIntent): boolean {
  return ECHO_AGENT_INTENTS.includes(intent);
}
