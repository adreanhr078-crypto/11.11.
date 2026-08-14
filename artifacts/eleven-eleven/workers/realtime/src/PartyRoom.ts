import { DurableObject } from 'cloudflare:workers';
import {
  CHESS_VARIANTS,
  type RealtimeTicketPayload,
  type RoomCommand,
} from '../../../src/domain/echo-network/contracts';
import { COOP_CASE_BY_ID, COOP_CASES } from '../../../src/domain/echo-network/coopCaseCatalog';
import { signRealtimeTicket } from '../../../src/domain/echo-network/realtimeTicket';
import {
  earliestPartyCleanupAlarm,
  normalizePartyRoomId,
  PARTY_RECONNECT_GRACE_MS,
} from '../../../src/domain/echo-network/partyRoomSafety';
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

interface ActiveLaunchRow {
  [key: string]: SqlStorageValue;
  match_id: string;
  mode: RealtimeTicketPayload['mode'];
  case_id: string | null;
  variant: NonNullable<RealtimeTicketPayload['variant']> | null;
  region: string;
  party_size: number;
  started_at: number;
  expires_at: number;
}

type PrivatePartyMode = Extract<
  RealtimeTicketPayload['mode'],
  'chess_casual' | 'chess_anomaly' | 'coop_breach'
>;

interface PartyLaunch {
  mode: PrivatePartyMode;
  caseId: string | null;
  variant: NonNullable<RealtimeTicketPayload['variant']> | null;
}

const PARTY_MATCH_MEMBERSHIP_MS = 2 * 60 * 60_000;

export class PartyRoom extends DurableObject<Env> {
  private joinTail: Promise<void> = Promise.resolve();
  private launchInFlight = false;

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
        CREATE TABLE IF NOT EXISTS active_launch (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          match_id TEXT NOT NULL,
          mode TEXT NOT NULL,
          case_id TEXT,
          variant TEXT,
          region TEXT NOT NULL,
          party_size INTEGER NOT NULL CHECK (party_size BETWEEN 2 AND 4),
          started_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
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
      const canonicalPartyRoomId = normalizePartyRoomId(roomId);
      if (ticket.target !== 'party' || !canonicalPartyRoomId || ticket.roomId !== canonicalPartyRoomId) {
        throw new RealtimeError(403, 'wrong_room', 'This ticket does not belong to the party.');
      }
      return this.admitMember(ticket, canonicalPartyRoomId);
    } catch (error) {
      return errorResponse(error);
    }
  }

  private async admitMember(ticket: Awaited<ReturnType<typeof requireUpgradeTicket>>, roomId: string): Promise<Response> {
    return this.exclusiveJoin(async () => {
      try {
        const used = this.ctx.storage.sql.exec<{ jti: string }>(
          'SELECT jti FROM used_tickets WHERE jti = ?', ticket.jti,
        ).toArray()[0];
        if (used) throw new RealtimeError(409, 'ticket_reused', 'This party ticket was already used.');
        this.clearExpiredLaunch();
        const existing = this.member(ticket.uid);
        const activeLaunch = this.currentLaunch();
        if (this.launchInFlight) {
          throw new RealtimeError(409, 'party_launching', 'The party is already securing its match.');
        }
        if (activeLaunch && !existing) {
          throw new RealtimeError(409, 'party_launched', 'This party is already inside an active match.');
        }
        if (!existing && await this.hasBlockedPartyMember(ticket.uid)) {
          throw new RealtimeError(403, 'party_blocked', 'A blocked player is already in this party.');
        }
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
          region: ticket.region,
        };
        server.serializeAttachment(attachment);
        this.ctx.acceptWebSocket(server, [`uid:${ticket.uid}`]);
        if (activeLaunch) {
          await this.sendMatchFound(server, ticket.uid, ticket.displayName, activeLaunch);
          server.close(1000, 'Match resumed.');
        } else {
          this.broadcast(roomId, 'party-changed');
        }
        return upgradeResponse(client);
      } catch (error) {
        return errorResponse(error);
      }
    });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const attachment = socketAttachment(socket);
      if (!attachment) throw new RealtimeError(401, 'session_missing', 'The party session is missing.');
      const command = parseRoomCommand(message);
      const roomId = this.ctx.id.name ?? 'party-room';
      const version = this.version();
      if (command.type === 'ping') {
        sendEvent(socket, roomId, version, 'pong', { clientSentAt: command.sentAt });
      } else if (this.launchInFlight) {
        throw new RealtimeError(409, 'party_launching', 'The party is already securing its match.');
      } else if (this.currentLaunch()) {
        throw new RealtimeError(409, 'party_launched', 'This party is already inside an active match.');
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
      } else if (command.type === 'party-launch') {
        await this.launchParty(attachment, command, roomId);
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
    const now = Date.now();
    if (this.clearExpiredLaunch(now)) {
      this.broadcast(this.ctx.id.name ?? 'party-room', 'party-changed');
    }
    const activeLaunch = this.currentLaunch(now);
    if (activeLaunch) {
      await this.ctx.storage.setAlarm(Math.max(now + 100, activeLaunch.expires_at));
      return;
    }
    const cutoff = now - 45_000;
    const expired = this.ctx.storage.sql.exec<{ uid: string }>(`
      SELECT uid FROM members WHERE disconnected_at IS NOT NULL AND disconnected_at <= ?
    `, cutoff).toArray();
    if (expired.length > 0) {
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          'DELETE FROM members WHERE disconnected_at IS NOT NULL AND disconnected_at <= ?', cutoff,
        );
        this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
      });
      this.broadcast(this.ctx.id.name ?? 'party-room', 'party-changed');
    }
    await this.scheduleDisconnectCleanup(true);
  }

  private async launchParty(
    attachment: SocketAttachment,
    command: RoomCommand,
    roomId: string,
  ): Promise<void> {
    const members = this.members();
    if (members[0]?.uid !== attachment.uid) {
      throw new RealtimeError(403, 'party_leader_required', 'Only the party leader can launch a private match.');
    }
    if (members.length < 2 || members.length > 4) {
      throw new RealtimeError(409, 'party_size_invalid', 'A private launch requires two to four players.');
    }
    const connectedUids = this.connectedMemberUids();
    if (members.some((member) => (
      member.ready !== 1
      || member.disconnected_at !== null
      || !connectedUids.has(member.uid)
    ))) {
      throw new RealtimeError(409, 'party_not_ready', 'Every party member must be connected and ready.');
    }
    const launch = this.parseLaunch(command.payload, members.length);
    if (this.currentLaunch()) {
      throw new RealtimeError(409, 'party_launched', 'This party is already inside an active match.');
    }

    this.launchInFlight = true;
    let matchId: string | null = null;
    let membershipsRecorded = false;
    let launchCommitted = false;
    try {
      const nowMs = Date.now();
      const now = Math.floor(nowMs / 1_000);
      matchId = `match_${crypto.randomUUID()}`;
      const expiresAtMs = nowMs + PARTY_MATCH_MEMBERSHIP_MS;
      const createdAt = new Date(nowMs).toISOString();
      const expiresAt = new Date(expiresAtMs).toISOString();
      const region = attachment.region ?? 'me';

      await this.env.PLAYER_DB.batch(members.map((member) => this.env.PLAYER_DB.prepare(`
        INSERT INTO network_room_memberships (
          room_id, user_id, mode, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(matchId, member.uid, launch.mode, createdAt, expiresAt)));
      membershipsRecorded = true;

      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(`
          INSERT INTO active_launch (
            singleton, match_id, mode, case_id, variant, region, party_size, started_at, expires_at
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
        `, matchId, launch.mode, launch.caseId, launch.variant, region, members.length, nowMs, expiresAtMs);
        this.recordCommand(command.idempotencyKey, attachment.uid, command.type);
        this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
      });
      launchCommitted = true;

      const activeLaunch = this.currentLaunch(nowMs);
      if (!activeLaunch) {
        throw new RealtimeError(500, 'party_launch_missing', 'The private match could not be secured.');
      }
      for (const socket of this.ctx.getWebSockets()) {
        const player = socketAttachment(socket);
        if (!player || !members.some((member) => member.uid === player.uid)) continue;
        await this.sendMatchFound(socket, player.uid, player.displayName, activeLaunch, now);
        socket.close(1000, 'Private match found.');
      }
      await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, expiresAtMs));
      void roomId;
    } catch (error) {
      if (matchId && membershipsRecorded && !launchCommitted) {
        await this.env.PLAYER_DB.batch(members.map((member) => this.env.PLAYER_DB.prepare(`
          DELETE FROM network_room_memberships
          WHERE room_id = ? AND user_id = ?
        `).bind(matchId, member.uid))).catch(() => undefined);
      }
      throw error;
    } finally {
      this.launchInFlight = false;
    }
  }

  private parseLaunch(payload: Record<string, unknown>, partySize: number): PartyLaunch {
    const requestedMode = typeof payload.mode === 'string' ? payload.mode : '';
    if (requestedMode === 'coop_breach') {
      const caseId = typeof payload.caseId === 'string' ? payload.caseId : COOP_CASES[0]?.id;
      if (!caseId || !COOP_CASE_BY_ID[caseId]) {
        throw new RealtimeError(400, 'invalid_coop_case', 'Choose a reviewed cooperative case.');
      }
      return { mode: 'coop_breach', caseId, variant: null };
    }
    if (partySize !== 2) {
      throw new RealtimeError(409, 'chess_party_size', 'Private chess needs exactly two players.');
    }
    if (requestedMode === 'chess_casual') {
      const requestedVariant = typeof payload.variant === 'string' ? payload.variant : 'standard';
      if (requestedVariant !== 'standard') {
        throw new RealtimeError(400, 'invalid_chess_variant', 'Casual chess uses the standard board.');
      }
      return { mode: 'chess_casual', caseId: null, variant: 'standard' };
    }
    if (requestedMode === 'chess_anomaly') {
      const variant = typeof payload.variant === 'string' ? payload.variant : '';
      if (!CHESS_VARIANTS.includes(variant as NonNullable<RealtimeTicketPayload['variant']>) || variant === 'standard') {
        throw new RealtimeError(400, 'invalid_chess_variant', 'Choose an available unranked anomaly.');
      }
      return {
        mode: 'chess_anomaly',
        caseId: null,
        variant: variant as NonNullable<RealtimeTicketPayload['variant']>,
      };
    }
    throw new RealtimeError(400, 'invalid_party_mode', 'This private activity is unavailable.');
  }

  private async sendMatchFound(
    socket: WebSocket,
    uid: string,
    displayName: string,
    launch: ActiveLaunchRow,
    issuedAtSeconds = Math.floor(Date.now() / 1_000),
  ): Promise<void> {
    const ticket: RealtimeTicketPayload = {
      v: 1,
      iss: 'eleven-eleven-realtime',
      aud: 'eleven-eleven-realtime',
      purpose: 'connect',
      target: 'match',
      uid,
      displayName,
      mode: launch.mode,
      roomId: launch.match_id,
      partySize: launch.party_size,
      ...(launch.case_id ? { caseId: launch.case_id } : {}),
      ...(launch.variant ? { variant: launch.variant } : {}),
      region: launch.region,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + 60,
      jti: crypto.randomUUID(),
    };
    const token = await signRealtimeTicket(this.env.REALTIME_TICKET_SECRET, ticket);
    sendEvent(socket, launch.match_id, this.version(), 'match-found', {
      matchId: launch.match_id,
      mode: launch.mode,
      partySize: launch.party_size,
      ticket: token,
      path: launch.mode === 'coop_breach'
        ? `/v1/rooms/coop/${launch.match_id}`
        : `/v1/rooms/chess/${launch.match_id}`,
    });
  }

  private connectedMemberUids(): Set<string> {
    return new Set(this.ctx.getWebSockets().flatMap((socket) => {
      const attachment = socketAttachment(socket);
      return attachment ? [attachment.uid] : [];
    }));
  }

  private launchRow(): ActiveLaunchRow | null {
    return this.ctx.storage.sql.exec<ActiveLaunchRow>(`
      SELECT match_id, mode, case_id, variant, region, party_size, started_at, expires_at
      FROM active_launch WHERE singleton = 1
    `).toArray()[0] ?? null;
  }

  private currentLaunch(now = Date.now()): ActiveLaunchRow | null {
    const launch = this.launchRow();
    return launch && launch.expires_at > now ? launch : null;
  }

  private clearExpiredLaunch(now = Date.now()): boolean {
    const launch = this.launchRow();
    if (!launch || launch.expires_at > now) return false;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec('DELETE FROM active_launch WHERE singleton = 1');
      this.ctx.storage.sql.exec('UPDATE members SET ready = 0');
      this.ctx.storage.sql.exec('UPDATE meta SET version = version + 1 WHERE singleton = 1');
    });
    return true;
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

  private async exclusiveJoin<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.joinTail;
    let release!: () => void;
    this.joinTail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  private async hasBlockedPartyMember(uid: string): Promise<boolean> {
    const otherUids = this.members()
      .map((member) => member.uid)
      .filter((memberUid) => memberUid !== uid);
    if (otherUids.length === 0) return false;
    const placeholders = otherUids.map(() => '?').join(', ');
    const blocked = await this.env.PLAYER_DB.prepare(`
      SELECT 1 AS blocked
      FROM social_blocks
      WHERE (blocker_uid = ? AND blocked_uid IN (${placeholders}))
         OR (blocked_uid = ? AND blocker_uid IN (${placeholders}))
      LIMIT 1
    `).bind(uid, ...otherUids, uid, ...otherUids).first<{ blocked: number }>();
    return Boolean(blocked?.blocked);
  }

  private async scheduleDisconnectCleanup(force = false): Promise<void> {
    const nextDisconnect = this.ctx.storage.sql.exec<{ disconnected_at: number | null }>(`
      SELECT MIN(disconnected_at) AS disconnected_at
      FROM members WHERE disconnected_at IS NOT NULL
    `).toArray()[0]?.disconnected_at;
    if (typeof nextDisconnect !== 'number') return;
    const requested = nextDisconnect + PARTY_RECONNECT_GRACE_MS;
    if (force) {
      await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, requested));
      return;
    }
    const existing = await this.ctx.storage.getAlarm();
    const nextAlarm = earliestPartyCleanupAlarm(existing, requested);
    if (existing !== nextAlarm) await this.ctx.storage.setAlarm(nextAlarm);
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
    const launch = this.currentLaunch();
    return {
      state: { version: this.version() },
      members: this.members().map((member) => ({
        uid: member.uid,
        displayName: member.display_name,
        ready: member.ready === 1,
        connected: member.disconnected_at === null,
      })),
      launch: launch ? {
        matchId: launch.match_id,
        mode: launch.mode,
        caseId: launch.case_id,
        variant: launch.variant,
        partySize: launch.party_size,
        startedAt: launch.started_at,
      } : null,
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
    if (this.launchInFlight || this.currentLaunch()) return;
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
    await this.scheduleDisconnectCleanup();
  }
}
