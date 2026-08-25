import {
  ECHO_AGENT_TICKET_TTL_SECONDS,
  issueEchoAgentTicket,
  normalizeEchoAgentOrigin,
} from '../../../src/domain/echo/echoAgentTicket';
import {
  PlayerApiError,
  authenticatePlayer,
  errorResponse,
  jsonResponse,
  type PlayerApiEnv,
} from '../player/_shared';

export interface EchoAgentSessionEnv extends PlayerApiEnv {
  /** Explicit remote kill switch. Any value other than true fails closed. */
  ECHO_AGENT_ENABLED?: string;
  /** Kept only in Pages/Worker secrets, never sent to the browser. */
  ECHO_AGENT_TICKET_SECRET?: string;
  /** Configured wss:// endpoint for the isolated Echo Agent Worker. */
  ECHO_AGENT_URL?: string;
  /** Comma-separated browser origins that may request a companion session. */
  ECHO_AGENT_ALLOWED_ORIGINS?: string;
}

interface EchoAgentSessionContext {
  request: Request;
  env: EchoAgentSessionEnv;
}

const ECHO_AGENT_PROTOCOL = 'echo-agent-v1';

function isPrivateDevelopmentHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1') {
    return true;
  }
  const octets = normalized.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

function configuredOrigins(env: EchoAgentSessionEnv): Set<string> {
  return new Set((env.ECHO_AGENT_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => normalizeEchoAgentOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin)));
}

function requireAllowedOrigin(request: Request, env: EchoAgentSessionEnv): string {
  const origin = normalizeEchoAgentOrigin(request.headers.get('Origin') ?? '');
  const sameOrigin = new URL(request.url).origin;
  if (!origin || (origin !== sameOrigin && !configuredOrigins(env).has(origin))) {
    throw new PlayerApiError(403, 'origin_not_allowed', 'This origin cannot open an Echo session.');
  }
  return origin;
}

function echoAgentCorsHeaders(request: Request, env: EchoAgentSessionEnv): HeadersInit {
  const origin = normalizeEchoAgentOrigin(request.headers.get('Origin') ?? '');
  const sameOrigin = origin === new URL(request.url).origin;
  const allowed = origin && (sameOrigin || configuredOrigins(env).has(origin));
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

function requireTicketSecret(env: EchoAgentSessionEnv): string {
  const secret = env.ECHO_AGENT_TICKET_SECRET?.trim() ?? '';
  if (secret.length < 32) {
    throw new PlayerApiError(503, 'echo_agent_unavailable', 'Echo companion is not available.');
  }
  return secret;
}

function requireAgentEnabled(env: EchoAgentSessionEnv): void {
  if (env.ECHO_AGENT_ENABLED?.trim().toLowerCase() !== 'true') {
    throw new PlayerApiError(503, 'echo_agent_unavailable', 'Echo companion is not available.');
  }
}

/**
 * Resolves the server-owned Worker endpoint. HTTP/WS is available only for
 * explicitly local development so production cannot accidentally downgrade.
 */
export function echoAgentBaseUrl(
  env: EchoAgentSessionEnv,
  request?: Request,
): URL {
  const raw = env.ECHO_AGENT_URL?.trim();
  if (!raw) {
    throw new PlayerApiError(503, 'echo_agent_unavailable', 'Echo companion is not available.');
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PlayerApiError(503, 'echo_agent_unavailable', 'Echo companion is not available.');
  }
  const local = isPrivateDevelopmentHost(url.hostname);
  if (url.protocol !== 'wss:' && !(local && url.protocol === 'ws:')) {
    throw new PlayerApiError(503, 'echo_agent_unavailable', 'Echo companion is not available.');
  }
  const requestOrigin = normalizeEchoAgentOrigin(request?.headers.get('Origin') ?? '');
  if (local && url.protocol === 'ws:' && requestOrigin) {
    const origin = new URL(requestOrigin);
    if (origin.protocol === 'http:' && isPrivateDevelopmentHost(origin.hostname)) {
      url.hostname = origin.hostname;
    }
  }
  url.pathname = '/v1/session';
  url.search = '';
  url.hash = '';
  return url;
}

export async function onRequestOptions({ request, env }: EchoAgentSessionContext): Promise<Response> {
  return new Response(null, { status: 204, headers: echoAgentCorsHeaders(request, env) });
}

export async function onRequestPost({ request, env }: EchoAgentSessionContext): Promise<Response> {
  const headers = echoAgentCorsHeaders(request, env);
  try {
    requireAgentEnabled(env);
    const origin = requireAllowedOrigin(request, env);
    const secret = requireTicketSecret(env);
    const webSocketUrl = echoAgentBaseUrl(env, request);
    const { account } = await authenticatePlayer(request, env);
    const issuedAt = Math.floor(Date.now() / 1_000);
    const ticket = await issueEchoAgentTicket(secret, {
      uid: account.uid,
      origin,
      issuedAt,
      ttlSeconds: ECHO_AGENT_TICKET_TTL_SECONDS,
    });

    return jsonResponse({
      ticket,
      webSocketUrl: webSocketUrl.toString(),
      protocol: ECHO_AGENT_PROTOCOL,
      expiresAt: new Date((issuedAt + ECHO_AGENT_TICKET_TTL_SECONDS) * 1_000).toISOString(),
      transport: 'deterministic-cues',
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
