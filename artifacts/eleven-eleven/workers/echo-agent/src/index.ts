import { DurableObject } from 'cloudflare:workers';
import {
  echoAgentTicketAllowsOrigin,
  normalizeEchoAgentOrigin,
  verifyEchoAgentTicket,
} from '../../../src/domain/echo/echoAgentTicket';
import {
  ECHO_AGENT_PROTOCOL,
  cueEvent,
  parseEchoAgentCueRequest,
  type EchoAgentErrorEvent,
} from './protocol';

interface EchoAgentEnv {
  ECHO_AGENT_ENABLED: string;
  ECHO_AGENT_ALLOWED_ORIGINS: string;
  ECHO_AGENT_TICKET_SECRET: string;
  ECHO_AGENT_SESSIONS: DurableObjectNamespace<EchoAgentSession>;
}

interface SocketAttachment {
  subject: string;
  origin: string;
  lastSequence: number;
}

interface SessionRow {
  [key: string]: SqlStorageValue;
  last_sequence: number;
  last_cue_at: number;
}

class EchoAgentError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function errorResponse(error: unknown): Response {
  const known = error instanceof EchoAgentError
    ? error
    : new EchoAgentError(500, 'echo_agent_unavailable', 'Echo companion is unavailable.');
  return Response.json({ code: known.code, error: known.message }, {
    status: known.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function enabled(env: EchoAgentEnv): boolean {
  return env.ECHO_AGENT_ENABLED?.trim().toLowerCase() === 'true';
}

function configuredOrigins(env: EchoAgentEnv): Set<string> {
  return new Set((env.ECHO_AGENT_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => normalizeEchoAgentOrigin(value.trim()))
    .filter((value): value is string => Boolean(value)));
}

function requireAllowedOrigin(request: Request, env: EchoAgentEnv): string {
  const origin = normalizeEchoAgentOrigin(request.headers.get('Origin') ?? '');
  if (!origin || !configuredOrigins(env).has(origin)) {
    throw new EchoAgentError(403, 'origin_not_allowed', 'This origin cannot open an Echo session.');
  }
  return origin;
}

function protocolParts(request: Request): string[] {
  return (request.headers.get('Sec-WebSocket-Protocol') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

async function requireUpgradeSubject(request: Request, env: EchoAgentEnv): Promise<{
  subject: string;
  origin: string;
  ticket: string;
}> {
  if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    throw new EchoAgentError(426, 'websocket_required', 'A WebSocket upgrade is required.');
  }
  const origin = requireAllowedOrigin(request, env);
  const [protocol, token, extra] = protocolParts(request);
  if (protocol !== ECHO_AGENT_PROTOCOL || !token || extra) {
    throw new EchoAgentError(401, 'ticket_required', 'A valid Echo session ticket is required.');
  }
  const ticket = await verifyEchoAgentTicket(env.ECHO_AGENT_TICKET_SECRET, token);
  if (!ticket || !echoAgentTicketAllowsOrigin(ticket, origin)) {
    throw new EchoAgentError(401, 'invalid_ticket', 'The Echo session ticket is invalid or expired.');
  }
  return { subject: ticket.sub, origin, ticket: token };
}

function relayRequest(
  request: Request,
  subject: string,
  origin: string,
  ticket: string,
): Request {
  const headers = new Headers(request.headers);
  // The ticket is never persisted by the Durable Object. It was fully checked
  // by the public Worker, and only this bound Worker can reach the DO.
  headers.delete('Sec-WebSocket-Protocol');
  headers.set('X-Echo-Agent-Relay', 'echo-agent-router-v1');
  headers.set('X-Echo-Agent-Subject', subject);
  headers.set('X-Echo-Agent-Origin', origin);
  headers.set('X-Echo-Agent-Ticket', ticket);
  return new Request(request, { headers });
}

/**
 * One hibernating Durable Object per opaque player subject. It is deliberately
 * a presentation transport: no D1 binding, no reward/puzzle/chess authority,
 * no AI provider, no player free-text memory, and no mutation RPCs exist here.
 */
export class EchoAgentSession extends DurableObject<EchoAgentEnv> {
  constructor(ctx: DurableObjectState, env: EchoAgentEnv) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS cue_sessions (
          subject TEXT PRIMARY KEY,
          last_sequence INTEGER NOT NULL DEFAULT 0,
          last_cue_at INTEGER NOT NULL DEFAULT 0
        )
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return errorResponse(new EchoAgentError(426, 'websocket_required', 'A WebSocket upgrade is required.'));
    }
    const subject = request.headers.get('X-Echo-Agent-Subject') ?? '';
    const origin = normalizeEchoAgentOrigin(request.headers.get('X-Echo-Agent-Origin') ?? '');
    const ticketToken = request.headers.get('X-Echo-Agent-Ticket') ?? '';
    const ticket = ticketToken
      ? await verifyEchoAgentTicket(this.env.ECHO_AGENT_TICKET_SECRET, ticketToken)
      : null;
    if (
      request.headers.get('X-Echo-Agent-Relay') !== 'echo-agent-router-v1'
      || !/^[a-f0-9]{64}$/.test(subject)
      || !origin
      || !ticket
      || ticket.sub !== subject
      || !echoAgentTicketAllowsOrigin(ticket, origin)
    ) {
      return errorResponse(new EchoAgentError(403, 'session_required', 'An authenticated Echo session is required.'));
    }

    this.ctx.storage.sql.exec(
      'INSERT OR IGNORE INTO cue_sessions (subject) VALUES (?)',
      subject,
    );
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ subject, origin, lastSequence: 0 } satisfies SocketAttachment);
    // acceptWebSocket (rather than ws.accept) enables WebSocket Hibernation.
    this.ctx.acceptWebSocket(server, [`subject:${subject}`]);
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Sec-WebSocket-Protocol': ECHO_AGENT_PROTOCOL },
    });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = this.attachment(socket);
    const request = parseEchoAgentCueRequest(message);
    if (!attachment || !request) {
      this.send(socket, { version: 1, type: 'error', code: 'invalid_message' });
      return;
    }
    const row = this.sessionRow(attachment.subject);
    const cue = cueEvent(request.request, row.last_sequence + 1);
    const now = Date.now();
    if (now - row.last_cue_at < cue.cue.cooldownMs) {
      this.send(socket, {
        version: 1,
        type: 'error',
        code: 'cooldown',
        correlationId: request.request.correlationId,
      });
      return;
    }
    this.ctx.storage.sql.exec(
      'UPDATE cue_sessions SET last_sequence = ?, last_cue_at = ? WHERE subject = ?',
      cue.sequence,
      now,
      attachment.subject,
    );
    socket.serializeAttachment({ ...attachment, lastSequence: cue.sequence } satisfies SocketAttachment);
    this.send(socket, cue);
  }

  webSocketClose(socket: WebSocket): void {
    // Connection-only attachment data is automatically discarded by Cloudflare.
    socket.close(1000, 'Echo session closed.');
  }

  webSocketError(_socket: WebSocket): void {
    // Persistent state contains only a sequence and cooldown, so no recovery
    // action is required after a transient socket failure.
  }

  private attachment(socket: WebSocket): SocketAttachment | null {
    try {
      const value = socket.deserializeAttachment() as SocketAttachment | null;
      return value
        && /^[a-f0-9]{64}$/.test(value.subject)
        && Boolean(normalizeEchoAgentOrigin(value.origin))
        && Number.isInteger(value.lastSequence)
        ? value
        : null;
    } catch {
      return null;
    }
  }

  private sessionRow(subject: string): SessionRow {
    return this.ctx.storage.sql.exec<SessionRow>(
      'SELECT last_sequence, last_cue_at FROM cue_sessions WHERE subject = ?',
      subject,
    ).toArray()[0] ?? { last_sequence: 0, last_cue_at: 0 };
  }

  private send(socket: WebSocket, event: unknown): void {
    try {
      socket.send(JSON.stringify(event));
    } catch {
      // A disconnected presentation socket cannot affect game authority.
    }
  }
}

export default {
  async fetch(request: Request, env: EchoAgentEnv): Promise<Response> {
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return Response.json({
        service: 'eleven-eleven-echo-agent',
        status: enabled(env) ? 'ready' : 'disabled',
        protocol: 1,
        capability: 'deterministic-cues-only',
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
    try {
      if (!enabled(env)) {
        throw new EchoAgentError(503, 'echo_agent_disabled', 'Echo companion is unavailable.');
      }
      if (new URL(request.url).pathname !== '/v1/session') {
        throw new EchoAgentError(404, 'route_not_found', 'The Echo route does not exist.');
      }
      const { subject, origin, ticket } = await requireUpgradeSubject(request, env);
      return env.ECHO_AGENT_SESSIONS.getByName(subject).fetch(
        relayRequest(request, subject, origin, ticket),
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
} satisfies ExportedHandler<EchoAgentEnv>;
