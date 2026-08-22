import { DurableObject } from 'cloudflare:workers';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';
import type { RealtimeTicketPayload } from '../../../src/domain/echo-network/contracts';
import {
  ACTIVE_MATCH_LEASE_MS,
  assertMatchLeaseAdmission,
  reserveMatchLeasesAndMemberships,
} from './activeMatchLease';
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
  private pendingQueueUids = new Set<string>();

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
      const now = Date.now();
      await assertMatchLeaseAdmission(this.env.PLAYER_DB, {
        uid: ticket.uid,
        now: new Date(now).toISOString(),
      });
      const used = this.ctx.storage.sql.exec<{ jti: string }>(
        'SELECT jti FROM used_tickets WHERE jti = ?', ticket.jti,
      ).toArray()[0];
      if (used) throw new RealtimeError(409, 'ticket_reused', 'This queue ticket was already used.');

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
      // The client side of a test/browser WebSocket may not have accepted the
      // upgrade yet when matchAvailable runs. Keep this freshly admitted row
      // eligible until the socket is observable or the stale alarm sweeps it.
      this.pendingQueueUids.add(ticket.uid);
      sendEvent(server, `queue-${ticket.region}-${ticket.mode}`, 0, 'queue-joined', {
        mode: ticket.mode,
        joinedAt: now,
      });
      await this.matchAvailable(ticket.mode);
      await this.scheduleQueueSweep();
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
      this.pendingQueueUids.delete(attachment.uid);
      socket.close(1000, 'Queue cancelled.');
      await this.scheduleQueueSweep();
    } catch (error) {
      const known = error instanceof RealtimeError
        ? error
        : new RealtimeError(400, 'invalid_message', 'The queue command is invalid.');
      sendEvent(socket, 'queue', 0, 'error', { code: known.code, message: known.message });
    }
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    const attachment = socketAttachment(socket);
    if (attachment) {
      this.pendingQueueUids.delete(attachment.uid);
      this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', attachment.uid);
    }
    await this.scheduleQueueSweep();
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    const attachment = socketAttachment(socket);
    if (attachment) {
      this.pendingQueueUids.delete(attachment.uid);
      this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', attachment.uid);
    }
    await this.scheduleQueueSweep();
  }

  async alarm(): Promise<void> {
    this.pendingQueueUids.clear();
    this.pruneDisconnectedWaiters(Date.now() - QUEUE_STALE_MS);
    const modes = this.ctx.storage.sql.exec<{ mode: RealtimeTicketPayload['mode'] }>(
      'SELECT DISTINCT mode FROM waiting ORDER BY mode ASC',
    ).toArray().map((row) => row.mode);
    for (const mode of modes) await this.matchAvailable(mode, true);
    await this.scheduleQueueSweep(true);
  }

  private waiting(mode: RealtimeTicketPayload['mode']): WaitingRow[] {
    return this.ctx.storage.sql.exec<WaitingRow>(`
      SELECT uid, display_name, joined_at, mode, region, case_id, variant
      FROM waiting WHERE mode = ? ORDER BY joined_at ASC
    `, mode).toArray();
  }

  private activeQueueUids(): Set<string> {
    const activeUids = new Set(this.ctx.getWebSockets().flatMap((socket) => {
      const attachment = socketAttachment(socket);
      return attachment ? [attachment.uid] : [];
    }));
    for (const uid of this.pendingQueueUids) activeUids.add(uid);
    return activeUids;
  }

  private pruneInactiveWaiters(waiting: WaitingRow[]): WaitingRow[] {
    const activeUids = this.activeQueueUids();
    const inactive = waiting.filter((player) => !activeUids.has(player.uid));
    if (inactive.length > 0) {
      this.ctx.storage.transactionSync(() => {
        for (const player of inactive) {
          this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', player.uid);
        }
      });
    }
    return waiting.filter((player) => activeUids.has(player.uid));
  }

  private pruneDisconnectedWaiters(cutoff: number): void {
    const stale = this.ctx.storage.sql.exec<WaitingRow>(`
      SELECT uid, display_name, joined_at, mode, region, case_id, variant
      FROM waiting WHERE joined_at < ?
    `, cutoff).toArray();
    this.pruneInactiveWaiters(stale);
  }

  private async matchAvailable(
    mode: RealtimeTicketPayload['mode'],
    forceCoop = false,
  ): Promise<void> {
    const waiting = this.pruneInactiveWaiters(this.waiting(mode));
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

  private async scheduleQueueSweep(force = false): Promise<void> {
    const earliest = this.ctx.storage.sql.exec<{ joined_at: number | null }>(
      'SELECT MIN(joined_at) AS joined_at FROM waiting',
    ).toArray()[0]?.joined_at;
    if (typeof earliest !== 'number') return;
    const requested = Math.max(Date.now() + QUEUE_STALE_MS, earliest + QUEUE_STALE_MS);
    const existing = await this.ctx.storage.getAlarm();
    if (force || existing === null || existing > requested) {
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
    const expiresAt = new Date(nowMs + ACTIVE_MATCH_LEASE_MS).toISOString();
    try {
      await reserveMatchLeasesAndMemberships(this.env.PLAYER_DB, {
        roomId: matchId,
        mode: players[0]!.mode,
        players,
        createdAt,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof RealtimeError && error.code === 'active_match_in_progress') {
        await this.removeAlreadyAssignedWaiters(players);
        return;
      }
      throw error;
    }

    this.ctx.storage.transactionSync(() => {
      for (const player of players) {
        this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', player.uid);
      }
    });
    for (const player of players) this.pendingQueueUids.delete(player.uid);

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

  /**
   * A claim race can occur only between independent matchmaking shards. Keep
   * the free players queued and explicitly release the already-active account
   * from this shard so it cannot repeatedly poison every proposed match.
   */
  private async removeAlreadyAssignedWaiters(players: WaitingRow[]): Promise<void> {
    const now = new Date().toISOString();
    const placeholders = players.map(() => '?').join(', ');
    const rows = await this.env.PLAYER_DB.prepare(`
      SELECT user_id FROM network_active_match_leases
      WHERE user_id IN (${placeholders}) AND expires_at > ?
    `).bind(...players.map((player) => player.uid), now).all<{ user_id: string }>();
    const blocked = new Set(rows.results.map((row) => row.user_id));
    if (blocked.size === 0) {
      await this.ctx.storage.setAlarm(Date.now() + 1_000);
      return;
    }
    this.ctx.storage.transactionSync(() => {
      for (const uid of blocked) this.ctx.storage.sql.exec('DELETE FROM waiting WHERE uid = ?', uid);
    });
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socketAttachment(socket);
      if (!attachment || !blocked.has(attachment.uid)) continue;
      this.pendingQueueUids.delete(attachment.uid);
      sendEvent(socket, 'queue', 0, 'error', {
        code: 'active_match_in_progress',
        message: 'This player is already assigned to an active match.',
      });
      socket.close(4003, 'An active match already exists.');
    }
    await this.scheduleQueueSweep(true);
  }
}
