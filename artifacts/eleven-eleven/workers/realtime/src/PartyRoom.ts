import { DurableObject } from 'cloudflare:workers';
import {
  RealtimeError,
  createSocketPair,
  errorResponse,
  parseRoomCommand,
  requireUpgradeTicket,
  roomIdFromPath,
  sendEvent,
  socketAttachment,
  upgradeResponse,
  type SocketAttachment,
} from './common';

interface PartyMemberRow {
  [key: string]: SqlStorageValue;
  uid: string;
  display_name: string;
  joined_at: number;
  ready: number;
  disconnected_at: number | null;
}

export class PartyRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS members (
          uid TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          joined_at INTEGER NOT NULL,
          ready INTEGER NOT NULL DEFAULT 0 CHECK (ready IN (0, 1)),
          disconnected_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS used_tickets (
          jti TEXT PRIMARY KEY,
          used_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS meta (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          version INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS commands (
          idempotency_key TEXT PRIMARY KEY,
          uid TEXT NOT NULL,
          command_type TEXT NOT NULL,
          accepted_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rate_events (
          event_id INTEGER PRIMARY KEY AUTOINCREMENT,
          uid TEXT NOT NULL,
          sent_at INTEGER NOT NULL
        );
        INSERT OR IGNORE INTO meta (singleton, version) VALUES (1, 0);
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const ticket = await requireUpgradeTicket(request, this.env, 'connect');
      const roomId = roomIdFromPath(request);
      if (ticket.target !== 'party' || ticket.roomId !== roomId) {
        throw new RealtimeError(403, 'wrong_room', 'This ticket does not belong to the party.');
      }
      const used = this.ctx.storage.sql.exec<{ jti: string }>(
        'SELECT jti FROM used_tickets WHERE jti = ?', ticket.jti,
      ).toArray()[0];
      if (used) throw new RealtimeError(409, 'ticket_reused', 'This party ticket was already used.');
      const existing = this.member(ticket.uid);
      if (!existing && this.members().length >= 4) {
        throw new RealtimeError(409, 'party_full', 'This party already has four players.');
      }
      const now = Date.now();
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          'INSERT INTO used_tickets (jti, used_at) VALUES (?, ?)', ticket.jti, now,
        );
        this.ctx.storage.sql.exec(`
          INSERT INTO members (uid, display_name, joined_at, ready, disconnected_at)
          VALUES (?, ?, ?, 0, NULL)
          ON CONFLICT(uid) DO UPDATE SET
            display_name = excluded.display_name,
            disconnected_at = NULL
        `, ticket.uid, ticket.displayName, now);
        this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
      });
      const { client, server } = createSocketPair();
      const attachment: SocketAttachment = {
        uid: ticket.uid,
        displayName: ticket.displayName,
        jti: ticket.jti,
        joinedAt: now,
      };
      server.serializeAttachment(attachment);
      this.ctx.acceptWebSocket(server, [`uid:${ticket.uid}`]);
      this.broadcast(roomId, 'party-changed');
      return upgradeResponse(client);
    } catch (error) {
      return errorResponse(error);
    }
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    try {
      const attachment = socketAttachment(socket);
      if (!attachment) throw new RealtimeError(401, 'session_missing', 'The party session is missing.');
      const command = parseRoomCommand(message);
      const roomId = this.ctx.id.name ?? 'party-room';
      const version = this.version();
      if (command.type === 'ping') {
        sendEvent(socket, roomId, version, 'pong', { clientSentAt: command.sentAt });
      } else if (this.commandWasAccepted(command.idempotencyKey)) {
        this.sendSnapshot(socket, roomId, 'command-replayed');
      } else if (command.expectedVersion !== version) {
        throw new RealtimeError(409, 'version_conflict', 'The party changed; apply the latest snapshot.');
      } else if (command.type === 'ready') {
        this.ctx.storage.transactionSync(() => {
          this.ctx.storage.sql.exec(`
            UPDATE members SET ready = CASE ready WHEN 1 THEN 0 ELSE 1 END WHERE uid = ?
          `, attachment.uid);
          this.recordCommand(command.idempotencyKey, attachment.uid, command.type);
          this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
        });
        this.broadcast(roomId, 'party-changed');
      } else if (command.type === 'resign') {
        this.ctx.storage.transactionSync(() => {
          this.ctx.storage.sql.exec('DELETE FROM members WHERE uid = ?', attachment.uid);
          this.recordCommand(command.idempotencyKey, attachment.uid, command.type);
          this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
        });
        socket.close(1000, 'Left party.');
        this.broadcast(roomId, 'party-changed');
      } else if (command.type === 'preset-chat') {
        const presetId = typeof command.payload.presetId === 'string'
          ? command.payload.presetId
          : '';
        if (!['ready', 'choose-chess', 'choose-coop', 'one-moment', 'thanks'].includes(presetId)) {
          throw new RealtimeError(400, 'invalid_preset', 'That party message is unavailable.');
        }
        const now = Date.now();
        this.ctx.storage.sql.exec('DELETE FROM rate_events WHERE sent_at < ?', now - 10_000);
        const recent = this.ctx.storage.sql.exec<{ total: number }>(`
          SELECT COUNT(*) AS total FROM rate_events WHERE uid = ?
        `, attachment.uid).toArray()[0]?.total ?? 0;
        if (recent >= 4) throw new RealtimeError(429, 'message_rate_limited', 'Slow down for a moment.');
        this.ctx.storage.transactionSync(() => {
          this.ctx.storage.sql.exec(
            'INSERT INTO rate_events (uid, sent_at) VALUES (?, ?)', attachment.uid, now,
          );
          this.recordCommand(command.idempotencyKey, attachment.uid, command.type);
        });
        for (const peer of this.ctx.getWebSockets()) {
          sendEvent(peer, roomId, version, 'preset-chat', {
            uid: attachment.uid,
            displayName: attachment.displayName,
            presetId,
          });
        }
      } else {
        throw new RealtimeError(400, 'unsupported_command', 'This party command is not supported.');
      }
    } catch (error) {
      const known = error instanceof RealtimeError
        ? error
        : new RealtimeError(400, 'invalid_message', 'The party command is invalid.');
      sendEvent(socket, 'party-room', this.version(), 'error', { code: known.code, message: known.message });
    }
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    await this.disconnect(socket);
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.disconnect(socket);
  }

  async alarm(): Promise<void> {
    const cutoff = Date.now() - 45_000;
    const expired = this.ctx.storage.sql.exec<{ uid: string }>(`
      SELECT uid FROM members WHERE disconnected_at IS NOT NULL AND disconnected_at <= ?
    `, cutoff).toArray();
    if (expired.length === 0) return;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'DELETE FROM members WHERE disconnected_at IS NOT NULL AND disconnected_at <= ?', cutoff,
      );
      this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
    });
    this.broadcast(this.ctx.id.name ?? 'party-room', 'party-changed');
  }

  private members(): PartyMemberRow[] {
    return this.ctx.storage.sql.exec<PartyMemberRow>(`
      SELECT uid, display_name, joined_at, ready, disconnected_at
      FROM members ORDER BY joined_at ASC
    `).toArray();
  }

  private member(uid: string): PartyMemberRow | null {
    return this.ctx.storage.sql.exec<PartyMemberRow>(`
      SELECT uid, display_name, joined_at, ready, disconnected_at
      FROM members WHERE uid = ?
    `, uid).toArray()[0] ?? null;
  }

  private version(): number {
    return this.ctx.storage.sql.exec<{ version: number }>(
      'SELECT version FROM meta WHERE singleton = 1',
    ).toArray()[0]?.version ?? 0;
  }

  private commandWasAccepted(key: string): boolean {
    return Boolean(this.ctx.storage.sql.exec<{ idempotency_key: string }>(
      'SELECT idempotency_key FROM commands WHERE idempotency_key = ?', key,
    ).toArray()[0]);
  }

  private recordCommand(key: string, uid: string, type: string): void {
    this.ctx.storage.sql.exec(`
      INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
      VALUES (?, ?, ?, ?)
    `, key, uid, type, Date.now());
  }

  private snapshot(): Record<string, unknown> {
    return {
      state: { version: this.version() },
      members: this.members().map((member) => ({
        uid: member.uid,
        displayName: member.display_name,
        ready: member.ready === 1,
        connected: member.disconnected_at === null,
      })),
    };
  }

  private sendSnapshot(socket: WebSocket, roomId: string, type: string): void {
    sendEvent(socket, roomId, this.version(), type, this.snapshot());
  }

  private broadcast(roomId: string, type: string): void {
    const payload = this.snapshot();
    const version = this.version();
    for (const socket of this.ctx.getWebSockets()) sendEvent(socket, roomId, version, type, payload);
  }

  private async disconnect(socket: WebSocket): Promise<void> {
    const attachment = socketAttachment(socket);
    if (!attachment) return;
    if (this.ctx.getWebSockets(`uid:${attachment.uid}`).some((peer) => peer !== socket)) return;
    if (!this.member(attachment.uid)) return;
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'UPDATE members SET disconnected_at = ?, ready = 0 WHERE uid = ?',
        now, attachment.uid,
      );
      this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
    });
    this.broadcast(this.ctx.id.name ?? 'party-room', 'party-changed');
    await this.ctx.storage.setAlarm(now + 45_000);
  }
}
