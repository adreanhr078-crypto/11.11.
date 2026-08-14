import type {
  RealtimeEnvelope,
  RealtimeTicketPayload,
  RoomCommand,
} from '../../../src/domain/echo-network/contracts';
import {
  roomCommandSchema,
} from '../../../src/domain/echo-network/contracts';
import { verifyRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';

export const ECHO_NETWORK_PROTOCOL = 'echo-network-v1';
const MAX_SOCKET_MESSAGE_BYTES = 12_000;

export interface SocketAttachment {
  uid: string;
  displayName: string;
  jti: string;
  joinedAt: number;
  region?: string;
  roles?: string[];
}

export class RealtimeError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function allowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  const allowed = env.REALTIME_ALLOWED_ORIGINS
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

function protocolParts(request: Request): string[] {
  return (request.headers.get('Sec-WebSocket-Protocol') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function requireUpgradeTicket(
  request: Request,
  env: Env,
  purpose?: 'queue' | 'connect',
): Promise<RealtimeTicketPayload> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    throw new RealtimeError(426, 'websocket_required', 'A WebSocket upgrade is required.');
  }
  if (!allowedOrigin(request, env)) {
    throw new RealtimeError(403, 'origin_not_allowed', 'This origin cannot open an online session.');
  }
  const [protocol, token, extra] = protocolParts(request);
  if (protocol !== ECHO_NETWORK_PROTOCOL || !token || extra) {
    throw new RealtimeError(401, 'ticket_required', 'A valid room ticket is required.');
  }
  const ticket = await verifyRealtimeTicket(env.REALTIME_TICKET_SECRET, token);
  if (!ticket || (purpose && ticket.purpose !== purpose)) {
    throw new RealtimeError(401, 'invalid_ticket', 'The room ticket is invalid or expired.');
  }
  return ticket;
}

export function errorResponse(error: unknown): Response {
  const known = error instanceof RealtimeError
    ? error
    : new RealtimeError(500, 'realtime_unavailable', 'The realtime service is unavailable.');
  return Response.json({ code: known.code, error: known.message }, {
    status: known.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function createSocketPair(): { client: WebSocket; server: WebSocket } {
  const pair = new WebSocketPair();
  return { client: pair[0], server: pair[1] };
}

export function upgradeResponse(client: WebSocket): Response {
  return new Response(null, {
    status: 101,
    webSocket: client,
    headers: { 'Sec-WebSocket-Protocol': ECHO_NETWORK_PROTOCOL },
  });
}

export function parseRoomCommand(message: string | ArrayBuffer): RoomCommand {
  const raw = typeof message === 'string'
    ? message
    : new TextDecoder().decode(message);
  if (new TextEncoder().encode(raw).byteLength > MAX_SOCKET_MESSAGE_BYTES) {
    throw new RealtimeError(413, 'message_too_large', 'The room command is too large.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RealtimeError(400, 'invalid_message', 'The room command is invalid.');
  }
  const result = roomCommandSchema.safeParse(parsed);
  if (!result.success) {
    throw new RealtimeError(400, 'invalid_message', 'The room command is invalid.');
  }
  return result.data;
}

export function envelope(
  roomId: string,
  sequence: number,
  type: string,
  payload: Record<string, unknown>,
): RealtimeEnvelope {
  return {
    version: 1,
    eventId: crypto.randomUUID(),
    roomId,
    sequence,
    type,
    sentAt: Date.now(),
    payload,
  };
}

export function sendEvent(
  socket: WebSocket,
  roomId: string,
  sequence: number,
  type: string,
  payload: Record<string, unknown>,
): void {
  try {
    socket.send(JSON.stringify(envelope(roomId, sequence, type, payload)));
  } catch {
    // The close/error handlers persist disconnect state. One failed send must
    // not abort authoritative room mutation for the other participants.
  }
}

export function socketAttachment(socket: WebSocket): SocketAttachment | null {
  try {
    const value = socket.deserializeAttachment() as SocketAttachment | null;
    return value && typeof value.uid === 'string' ? value : null;
  } catch {
    return null;
  }
}

export function roomIdFromPath(request: Request): string {
  const pieces = new URL(request.url).pathname.split('/').filter(Boolean);
  const value = decodeURIComponent(pieces.at(-1) ?? '');
  if (!/^[A-Za-z0-9_-]{3,96}$/.test(value)) {
    throw new RealtimeError(400, 'invalid_room', 'The room identifier is invalid.');
  }
  return value;
}

export function modeIsChess(mode: string): boolean {
  return mode.startsWith('chess_');
}

export function modeLocationHint(region: string): DurableObjectLocationHint {
  const supported: DurableObjectLocationHint[] = [
    'me', 'afr', 'eeur', 'weur', 'enam', 'wnam', 'sam', 'apac', 'oc',
  ];
  return supported.includes(region as DurableObjectLocationHint)
    ? region as DurableObjectLocationHint
    : 'me';
}
