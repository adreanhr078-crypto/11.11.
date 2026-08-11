import { DurableObject } from 'cloudflare:workers';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';
import type { RealtimeTicketPayload } from '../../../src/domain/echo-network/contracts';
import {
  RealtimeError,
  createSocketPair,
  errorResponse,
  parseRoomCommand,
  requireUpgradeTicket,
  sendEvent,
  socketAttachment,
  upgradeResponse,
  type SocketAttachment,
} from './common';

interface WaitingRow {
  [key: string]: SqlStorageValue;
  uid: string;
  display_name: string;
  joined_at: number;
  mode: RealtimeTicketPayload['mode'];
  region: string;
  case_id: string | null;
  variant: NonNullable<RealtimeTicketPayload['variant']> | null;
}

const COOP_FILL_DELAY_MS = 5_000;
const QUEUE_STALE_MS = 90_000;

export class MatchmakerRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS waiting (
          uid TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          ticket_jti TEXT NOT NULL UNIQUE,
          mode TEXT NOT NULL,
          region TEXT NOT NULL,
          case_id TEXT,
          variant TEXT,
          joined_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS used_tickets (
          jti TEXT PRIMARY KEY,
          used_at INTEGER NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const ticket = await requireUpgradeTicket(request, this.env, 'queue');
      if (ticket.target !== 'matchmaking') {
        throw new RealtimeError(403, 'wrong_ticket_target', 'This ticket cannot enter matchmaking.');
      }
      const used = this.ctx.storage.sql.exec<{ jti: string }>(
        'SELECT jti FROM used_tickets WHERE jti = ?', ticket.jti,
      ).toArray()[0];
      if (used) throw new RealtimeError(409, 'ticket_reused', 'This queue ticket was already used.');

      const now = Date.now();
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          'INSERT INTO used_tickets (jti, used_at) VALUES (?, ?)', ticket.jti, now,
        );
        this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', ticket.uid);
        this.ctx.storage.sql.exec(`
          INSERT INTO waiting (
            uid, display_name, ticket_jti, mode, region, case_id, variant, joined_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ticket.uid, ticket.displayName, ticket.jti, ticket.mode, ticket.region,
        ticket.caseId ?? null, ticket.variant ?? null, now);
      });

      for (const active of this.ctx.getWebSockets()) {
        const attachment = socketAttachment(active);
        if (attachment?.uid === ticket.uid) active.close(4001, 'Replaced by a newer queue session.');
      }
      const { client, server } = createSocketPair();
      const attachment: SocketAttachment = {
        uid: ticket.uid,
        displayName: ticket.displayName,
        jti: ticket.jti,
        joinedAt: now,
      };
      server.serializeAttachment(attachment);
      this.ctx.acceptWebSocket(server, [`uid:${ticket.uid}`]);
      sendEvent(server, `queue-${ticket.region}-${ticket.mode}`, 0, 'queue-joined', {
        mode: ticket.mode,
        joinedAt: now,
      });
      await this.matchAvailable(ticket.mode);
      return upgradeResponse(client);
    } catch (error) {
      return errorResponse(error);
    }
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const command = parseRoomCommand(message);
      const attachment = socketAttachment(socket);
      if (!attachment) throw new RealtimeError(401, 'session_missing', 'Queue session is missing.');
      if (command.type === 'ping') {
        sendEvent(socket, 'queue', 0, 'pong', { clientSentAt: command.sentAt });
        return;
      }
      if (command.type !== 'resign') {
        throw new RealtimeError(400, 'unsupported_command', 'This queue command is not supported.');
      }
      this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', attachment.uid);
      socket.close(1000, 'Queue cancelled.');
    } catch (error) {
      const known = error instanceof RealtimeError
        ? error
        : new RealtimeError(400, 'invalid_message', 'The queue command is invalid.');
      sendEvent(socket, 'queue', 0, 'error', { code: known.code, message: known.message });
    }
  }

  webSocketClose(socket: WebSocket): void {
    const attachment = socketAttachment(socket);
    if (attachment) this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', attachment.uid);
  }

  webSocketError(socket: WebSocket): void {
    const attachment = socketAttachment(socket);
    if (attachment) this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', attachment.uid);
  }

  async alarm(): Promise<void> {
    this.ctx.storage.sql.exec(
      'DELETE FROM waiting WHERE joined_at < ?', Date.now() - QUEUE_STALE_MS,
    );
    const mode = this.ctx.storage.sql.exec<{ mode: RealtimeTicketPayload['mode'] }>(
      'SELECT mode FROM waiting ORDER BY joined_at ASC LIMIT 1',
    ).toArray()[0]?.mode;
    if (mode) await this.matchAvailable(mode, true);
  }

  private waiting(mode: RealtimeTicketPayload['mode']): WaitingRow[] {
    return this.ctx.storage.sql.exec<WaitingRow>(`
      SELECT uid, display_name, joined_at, mode, region, case_id, variant
      FROM waiting WHERE mode = ? ORDER BY joined_at ASC
    `, mode).toArray();
  }

  private async matchAvailable(
    mode: RealtimeTicketPayload['mode'],
    forceCoop = false,
  ): Promise<void> {
    const waiting = this.waiting(mode);
    if (mode === 'coop_breach') {
      if (waiting.length >= 4) {
        await this.formMatch(waiting.slice(0, 4));
        if (this.waiting(mode).length >= 2) {
          await this.ensureCoopFillAlarm();
        }
      } else if (forceCoop && waiting.length >= 2) {
        await this.formMatch(waiting.slice(0, Math.min(4, waiting.length)));
      } else if (waiting.length >= 2) {
        await this.ensureCoopFillAlarm();
      }
      return;
    }
    if (waiting.length >= 2) {
      await this.formMatch(waiting.slice(0, 2));
      if (this.waiting(mode).length >= 2) await this.matchAvailable(mode);
    }
  }

  private async ensureCoopFillAlarm(): Promise<void> {
    const requested = Date.now() + COOP_FILL_DELAY_MS;
    const existing = await this.ctx.storage.getAlarm();
    if (existing === null || existing > requested) {
      await this.ctx.storage.setAlarm(requested);
    }
  }

  private async formMatch(players: WaitingRow[]): Promise<void> {
    if (players.length < 2) return;
    const matchId = `match_${crypto.randomUUID()}`;
    const nowMs = Date.now();
    const now = Math.floor(nowMs / 1_000);
    const partySize = players.length;
    const sockets = new Map<string, WebSocket>();
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socketAttachment(socket);
      if (attachment) sockets.set(attachment.uid, socket);
    }
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + 2 * 60 * 60_000).toISOString();
    await this.env.PLAYER_DB.batch(players.map((player) => this.env.PLAYER_DB.prepare(`
      INSERT INTO network_room_memberships (
        room_id, user_id, mode, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(matchId, player.uid, player.mode, createdAt, expiresAt)));

    this.ctx.storage.transactionSync(() => {
      for (const player of players) {
        this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', player.uid);
      }
    });

    for (const player of players) {
      const payload: RealtimeTicketPayload = {
        v: 1,
        iss: 'eleven-eleven-realtime',
        aud: 'eleven-eleven-realtime',
        purpose: 'connect',
        target: 'match',
        uid: player.uid,
        displayName: player.display_name,
        mode: player.mode,
        roomId: matchId,
        partySize,
        ...(player.case_id ? { caseId: player.case_id } : {}),
        ...(player.variant ? { variant: player.variant } : {}),
        region: player.region,
        iat: now,
        exp: now + 60,
        jti: crypto.randomUUID(),
      };
      const token = await signRealtimeTicket(this.env.REALTIME_TICKET_SECRET, payload);
      const socket = sockets.get(player.uid);
      if (!socket) continue;
      sendEvent(socket, matchId, 1, 'match-found', {
        matchId,
        mode: player.mode,
        partySize,
        ticket: token,
        path: player.mode === 'coop_breach'
          ? `/v1/rooms/coop/${matchId}`
          : `/v1/rooms/chess/${matchId}`,
      });
      socket.close(1000, 'Match found.');
    }
  }
}
