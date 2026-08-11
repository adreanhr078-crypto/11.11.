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

const COMMUNITY_PRESETS = [
  'hello', 'looking-for-coop', 'looking-for-chess', 'great-puzzle', 'well-played', 'thanks',
] as const;

export class CommunityChannelRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS used_tickets (
          jti TEXT PRIMARY KEY,
          used_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rate_events (
          event_id INTEGER PRIMARY KEY AUTOINCREMENT,
          uid TEXT NOT NULL,
          sent_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS commands (
          idempotency_key TEXT PRIMARY KEY,
          uid TEXT NOT NULL,
          command_type TEXT NOT NULL,
          accepted_at INTEGER NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const ticket = await requireUpgradeTicket(request, this.env, 'connect');
      const roomId = roomIdFromPath(request);
      if (ticket.target !== 'community' || ticket.roomId !== roomId || !roomId.startsWith('channel-')) {
        throw new RealtimeError(403, 'wrong_channel', 'This ticket does not belong to the channel.');
      }
      if (this.ctx.storage.sql.exec<{ jti: string }>(
        'SELECT jti FROM used_tickets WHERE jti = ?', ticket.jti,
      ).toArray()[0]) {
        throw new RealtimeError(409, 'ticket_reused', 'This channel ticket was already used.');
      }
      this.ctx.storage.sql.exec(
        'INSERT INTO used_tickets (jti, used_at) VALUES (?, ?)', ticket.jti, Date.now(),
      );
      const { client, server } = createSocketPair();
      const attachment: SocketAttachment = {
        uid: ticket.uid,
        displayName: ticket.displayName,
        jti: ticket.jti,
        joinedAt: Date.now(),
      };
      server.serializeAttachment(attachment);
      this.ctx.acceptWebSocket(server, [`uid:${ticket.uid}`]);
      sendEvent(server, roomId, 0, 'channel-joined', {
        presetOnly: true,
        onlineCount: this.ctx.getWebSockets().length,
      });
      this.broadcastPresence(roomId);
      return upgradeResponse(client);
    } catch (error) {
      return errorResponse(error);
    }
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    try {
      const attachment = socketAttachment(socket);
      if (!attachment) throw new RealtimeError(401, 'session_missing', 'The channel session is missing.');
      const command = parseRoomCommand(message);
      const roomId = this.ctx.id.name ?? 'channel-room';
      if (command.type === 'ping') {
        sendEvent(socket, roomId, 0, 'pong', { clientSentAt: command.sentAt });
        return;
      }
      if (this.ctx.storage.sql.exec<{ idempotency_key: string }>(
        'SELECT idempotency_key FROM commands WHERE idempotency_key = ?', command.idempotencyKey,
      ).toArray()[0]) {
        sendEvent(socket, roomId, 0, 'channel-presence', {
          presetOnly: true,
          onlineCount: this.ctx.getWebSockets().length,
          replayed: true,
        });
        return;
      }
      if (command.expectedVersion !== 0) {
        throw new RealtimeError(409, 'version_conflict', 'The channel command version is invalid.');
      }
      if (command.type !== 'preset-chat') {
        throw new RealtimeError(400, 'preset_only', 'Public channels currently accept preset messages only.');
      }
      const presetId = typeof command.payload.presetId === 'string'
        ? command.payload.presetId
        : '';
      if (!COMMUNITY_PRESETS.includes(presetId as typeof COMMUNITY_PRESETS[number])) {
        throw new RealtimeError(400, 'invalid_preset', 'That channel message is unavailable.');
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
        this.ctx.storage.sql.exec(`
          INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
          VALUES (?, ?, ?, ?)
        `, command.idempotencyKey, attachment.uid, command.type, now);
      });
      for (const peer of this.ctx.getWebSockets()) {
        sendEvent(peer, roomId, 0, 'preset-chat', {
          uid: attachment.uid,
          displayName: attachment.displayName,
          presetId,
        });
      }
    } catch (error) {
      const known = error instanceof RealtimeError
        ? error
        : new RealtimeError(400, 'invalid_message', 'The channel command is invalid.');
      sendEvent(socket, 'channel-room', 0, 'error', { code: known.code, message: known.message });
    }
  }

  webSocketClose(): void {
    this.broadcastPresence(this.ctx.id.name ?? 'channel-room');
  }

  webSocketError(): void {
    this.broadcastPresence(this.ctx.id.name ?? 'channel-room');
  }

  private broadcastPresence(roomId: string): void {
    const onlineCount = this.ctx.getWebSockets().length;
    for (const peer of this.ctx.getWebSockets()) {
      sendEvent(peer, roomId, 0, 'channel-presence', { onlineCount });
    }
  }
}
