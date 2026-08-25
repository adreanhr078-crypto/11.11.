import {
  normalizeEchoAgentRequest,
  type EchoAgentRequest,
} from '../../../src/domain/echo/echoAgentContracts';

export const ECHO_AGENT_PROTOCOL = 'echo-agent-v1';
export const ECHO_AGENT_DETERMINISTIC_INTENTS = [
  'objective_nudge',
  'navigation_help',
  'puzzle_encouragement',
  'story_reflection',
  'chess_personality',
  'world_companion_bark',
] as const;

type DeterministicIntent = typeof ECHO_AGENT_DETERMINISTIC_INTENTS[number];

export interface EchoAgentCueRequest {
  version: 1;
  type: 'request-cue';
  request: EchoAgentRequest & { intent: DeterministicIntent };
}

export interface DeterministicEchoCue {
  cueId: string;
  source: 'deterministic';
  text: string;
  caption: string;
  expression: 'calm' | 'curious' | 'concerned' | 'focused' | 'celebrating';
  gesture: 'idle' | 'look' | 'point' | 'encourage' | 'celebrate';
  cooldownMs: number;
}

export interface EchoAgentCueEvent {
  version: 1;
  type: 'cue';
  correlationId: string;
  sequence: number;
  cue: DeterministicEchoCue;
}

export interface EchoAgentErrorEvent {
  version: 1;
  type: 'error';
  code: 'invalid_message' | 'cooldown';
  correlationId?: string;
}

const MAX_SOCKET_MESSAGE_BYTES = 4_096;

function isDeterministicIntent(value: unknown): value is DeterministicIntent {
  return ECHO_AGENT_DETERMINISTIC_INTENTS.includes(value as DeterministicIntent);
}

/**
 * The socket is intentionally not a game command channel. In particular it
 * rejects free conversation, utterances, server-event impersonation, reward
 * requests, puzzle payloads, and chess moves. Those stay behind their existing
 * authoritative gateways.
 */
export function parseEchoAgentCueRequest(
  message: string | ArrayBuffer,
): EchoAgentCueRequest | null {
  const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
  if (new TextEncoder().encode(raw).byteLength > MAX_SOCKET_MESSAGE_BYTES) return null;
  let source: unknown;
  try {
    source = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const envelope = source as Record<string, unknown>;
  if (envelope.version !== 1 || envelope.type !== 'request-cue') return null;
  if (!envelope.request || typeof envelope.request !== 'object' || Array.isArray(envelope.request)) {
    return null;
  }
  const rawRequest = envelope.request as Record<string, unknown>;
  // Free text belongs to the existing authenticated /api/echo/chat gateway,
  // never to this deterministic hibernating transport.
  if ('utterance' in rawRequest) return null;
  const request = normalizeEchoAgentRequest(rawRequest);
  if (!request || !isDeterministicIntent(request.intent)) return null;
  return {
    version: 1,
    type: 'request-cue',
    request: request as EchoAgentCueRequest['request'],
  };
}

const COPY = {
  ar: {
    objective_nudge: ['الهدف المحدد هو الإشارة التالية. ابدأ من هناك.', 'إيكو يشير إلى الهدف الحالي.'],
    navigation_help: ['المسار المفتوح هو المسار الذي تحتاجه الآن. اتبع الهدف المحدد.', 'إيكو يساعدك على العودة إلى المسار النشط.'],
    puzzle_encouragement: ['ارجع إلى الدليل، ثم اختبر العلاقة التي لاحظتها. لن أختار بدلاً منك.', 'إيكو يشجعك من دون كشف الحل.'],
    story_reflection: ['ما وثقناه حتى الآن يكفي للخطوة التالية. لا نحتاج إلى استعجال الذاكرة.', 'إيكو يراجع ما كُشف من القصة بهدوء.'],
    chess_personality: ['سأقرأ الرقعة معك بعد النقلة القانونية، لكن قرار اللعب يبقى لك.', 'إيكو يراقب الرقعة ولا يختار نقلة اللاعب.'],
    world_companion_bark: ['أنا هنا. عندما تكون مستعدًا، نتابع الإشارة التالية.', 'إيكو يبقى حاضرًا من دون مقاطعة.'],
  },
  en: {
    objective_nudge: ['The marked objective is the next signal. Start there.', 'Echo points to the current objective.'],
    navigation_help: ['The open path is the one you need now. Follow the marked objective.', 'Echo helps you return to the active path.'],
    puzzle_encouragement: ['Return to the evidence, then test the relationship you noticed. I will not choose for you.', 'Echo encourages without revealing a solution.'],
    story_reflection: ['What we documented is enough for the next step. We do not need to rush the memory.', 'Echo reflects quietly on the revealed story.'],
    chess_personality: ['I will read the board with you after a legal move, but the decision stays yours.', 'Echo observes the board and never selects the player move.'],
    world_companion_bark: ['I am here. When you are ready, we can follow the next signal.', 'Echo stays present without interrupting.'],
  },
} as const;

export function createDeterministicEchoCue(
  request: EchoAgentCueRequest['request'],
): DeterministicEchoCue {
  const [text, caption] = COPY[request.locale][request.intent];
  const puzzle = request.intent === 'puzzle_encouragement';
  const chess = request.intent === 'chess_personality';
  const objective = request.intent === 'objective_nudge' || request.intent === 'navigation_help';
  return {
    cueId: `echo-agent-${request.intent}`,
    source: 'deterministic',
    text,
    caption,
    expression: puzzle || chess ? 'focused' : objective ? 'curious' : 'calm',
    gesture: puzzle ? 'encourage' : objective ? 'point' : chess ? 'look' : 'idle',
    cooldownMs: 12_000,
  };
}

export function cueEvent(
  request: EchoAgentCueRequest['request'],
  sequence: number,
): EchoAgentCueEvent {
  return {
    version: 1,
    type: 'cue',
    correlationId: request.correlationId,
    sequence,
    cue: createDeterministicEchoCue(request),
  };
}
