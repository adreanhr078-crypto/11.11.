import { DurableObject } from 'cloudflare:workers';
import type {
  CoopRole,
  MatchReceipt,
  RoomCommand,
} from '../../../src/domain/echo-network/contracts';
import { matchReceiptSchema } from '../../../src/domain/echo-network/contracts';
import {
  COOP_CASES,
  COOP_CASE_BY_ID,
  type CoopCasePublicDefinition,
} from '../../../src/domain/echo-network/coopCaseCatalog';
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
import {
  assignCoopRoles,
  coopAnswer,
  coopHint,
  coopRoleClue,
  isReviewedCoopCase,
} from './coopServerCatalog';
import { participantReward, sealReceipt, type QueuedResult } from './receipt';

interface CoopState {
  version: number;
  status: 'waiting' | 'active' | 'completed';
  stageIndex: number;
  failedAttempts: number;
  hintsUsed: number;
  stageHintsUsed: number;
  completedStages: string[];
}

interface MetaRow {
  [key: string]: SqlStorageValue;
  room_id: string;
  case_id: string;
  expected_size: number;
  state_json: string;
  started_at: number | null;
  finished_at: number | null;
  receipt_json: string | null;
  receipt_queued: number;
}

interface ParticipantRow {
  [key: string]: SqlStorageValue;
  uid: string;
  display_name: string;
  seat_index: number;
  roles_json: string;
  joined_at: number;
  disconnected_at: number | null;
  echo_takeover: number;
}

const ECHO_TAKEOVER_MS = 45_000;

function parseState(raw: string): CoopState {
  const parsed = JSON.parse(raw) as CoopState;
  return {
    ...parsed,
    stageHintsUsed: Number.isInteger(parsed.stageHintsUsed) ? parsed.stageHintsUsed : 0,
  };
}

function deterministicCase(roomId: string): CoopCasePublicDefinition {
  let hash = 0;
  for (const character of roomId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return COOP_CASES[hash % COOP_CASES.length]!;
}

function parseRoles(raw: string): CoopRole[] {
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed)
    ? parsed.filter((role): role is CoopRole => (
      role === 'memory' || role === 'cipher' || role === 'route' || role === 'anchor'
    ))
    : [];
}

export class CoopSessionRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS meta (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          room_id TEXT NOT NULL,
          case_id TEXT NOT NULL,
          expected_size INTEGER NOT NULL CHECK (expected_size BETWEEN 2 AND 4),
          state_json TEXT NOT NULL,
          started_at INTEGER,
          finished_at INTEGER,
          receipt_json TEXT,
          receipt_queued INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS participants (
          uid TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          seat_index INTEGER NOT NULL UNIQUE,
          roles_json TEXT NOT NULL,
          joined_at INTEGER NOT NULL,
          disconnected_at INTEGER,
          echo_takeover INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS used_tickets (
          jti TEXT PRIMARY KEY,
          used_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS commands (
          idempotency_key TEXT PRIMARY KEY,
          uid TEXT NOT NULL,
          command_type TEXT NOT NULL,
          accepted_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS votes (
          vote_kind TEXT NOT NULL,
          stage_index INTEGER NOT NULL,
          uid TEXT NOT NULL,
          voted_at INTEGER NOT NULL,
          PRIMARY KEY (vote_kind, stage_index, uid)
        );
        CREATE TABLE IF NOT EXISTS stage_events (
          event_index INTEGER PRIMARY KEY AUTOINCREMENT,
          stage_index INTEGER NOT NULL,
          uid TEXT NOT NULL,
          answer_id TEXT NOT NULL,
          correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
          submitted_at INTEGER NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const ticket = await requireUpgradeTicket(request, this.env, 'connect');
      const roomId = roomIdFromPath(request);
      if (ticket.target !== 'match' || ticket.roomId !== roomId || ticket.mode !== 'coop_breach') {
        throw new RealtimeError(403, 'wrong_room', 'This ticket does not belong to the breach room.');
      }
      if (this.ticketWasUsed(ticket.jti)) {
        throw new RealtimeError(409, 'ticket_reused', 'This room ticket was already used.');
      }
      const now = Date.now();
      const existing = this.participant(ticket.uid);
      const currentPlayers = this.participants();
      const currentMeta = this.meta();
      const expectedSize = currentMeta?.expected_size ?? ticket.partySize ?? 2;
      if (!existing && currentPlayers.length >= expectedSize) {
        throw new RealtimeError(409, 'room_full', 'This breach team is full.');
      }
      const selected = ticket.caseId && isReviewedCoopCase(ticket.caseId)
        ? COOP_CASE_BY_ID[ticket.caseId]!
        : deterministicCase(roomId);

      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          'INSERT INTO used_tickets (jti, used_at) VALUES (?, ?)', ticket.jti, now,
        );
        if (!this.meta()) {
          const initial: CoopState = {
            version: 0,
            status: 'waiting',
            stageIndex: 0,
            failedAttempts: 0,
            hintsUsed: 0,
            stageHintsUsed: 0,
            completedStages: [],
          };
          this.ctx.storage.sql.exec(`
            INSERT INTO meta (
              singleton, room_id, case_id, expected_size, state_json,
              started_at, finished_at, receipt_json, receipt_queued
            ) VALUES (1, ?, ?, ?, ?, NULL, NULL, NULL, 0)
          `, roomId, selected.id, expectedSize, JSON.stringify(initial));
        } else if (this.meta()?.room_id !== roomId) {
          throw new RealtimeError(409, 'room_contract_mismatch', 'The breach contract does not match.');
        }
        if (existing) {
          this.ctx.storage.sql.exec(`
            UPDATE participants
            SET display_name = ?, disconnected_at = NULL, echo_takeover = 0
            WHERE uid = ?
          `, ticket.displayName, ticket.uid);
        } else {
          const seatIndex = this.participants().length;
          this.ctx.storage.sql.exec(`
            INSERT INTO participants (
              uid, display_name, seat_index, roles_json, joined_at,
              disconnected_at, echo_takeover
            ) VALUES (?, ?, ?, '[]', ?, NULL, 0)
          `, ticket.uid, ticket.displayName, seatIndex, now);
        }
        const meta = this.meta()!;
        const state = parseState(meta.state_json);
        const players = this.participants();
        if (players.length === meta.expected_size && state.status === 'waiting') {
          for (const player of players) {
            this.ctx.storage.sql.exec(`
              UPDATE participants SET roles_json = ? WHERE uid = ?
            `, JSON.stringify(assignCoopRoles(player.seat_index, meta.expected_size)), player.uid);
          }
          const active: CoopState = { ...state, status: 'active', version: state.version + 1 };
          this.ctx.storage.sql.exec(`
            UPDATE meta SET state_json = ?, started_at = ? WHERE singleton = 1
          `, JSON.stringify(active), now);
        }
      });

      const { client, server } = createSocketPair();
      const roles = parseRoles(this.participant(ticket.uid)?.roles_json ?? '[]');
      const attachment: SocketAttachment = {
        uid: ticket.uid,
        displayName: ticket.displayName,
        jti: ticket.jti,
        joinedAt: now,
        roles,
      };
      server.serializeAttachment(attachment);
      this.ctx.acceptWebSocket(server, [`uid:${ticket.uid}`]);
      this.sendSnapshot(server, 'room-snapshot');
      this.sendStoredReceipt(server);
      this.broadcastSnapshots('presence-changed');
      await this.scheduleTakeoverAlarm();
      return upgradeResponse(client);
    } catch (error) {
      return errorResponse(error);
    }
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const attachment = socketAttachment(socket);
      if (!attachment) throw new RealtimeError(401, 'session_missing', 'The breach session is missing.');
      const command = parseRoomCommand(message);
      const meta = this.meta();
      if (!meta) throw new RealtimeError(409, 'room_unavailable', 'The breach room is unavailable.');
      const state = parseState(meta.state_json);
      if (command.type === 'ping') {
        sendEvent(socket, meta.room_id, state.version, 'pong', {
          clientSentAt: command.sentAt,
          serverTime: Date.now(),
        });
        return;
      }
      if (this.commandWasAccepted(command.idempotencyKey)) {
        this.sendSnapshot(socket, 'command-replayed');
        this.sendStoredReceipt(socket);
        return;
      }
      if (command.expectedVersion !== state.version) {
        throw new RealtimeError(409, 'version_conflict', 'The case changed; apply the latest snapshot.');
      }
      if (state.status !== 'active' && command.type !== 'resume' && command.type !== 'preset-chat') {
        throw new RealtimeError(409, 'case_not_active', 'The cooperative case is not active.');
      }
      if (command.type === 'coop-submit') {
        await this.submitAnswer(attachment.uid, command, meta, state);
      } else if (command.type === 'hint-vote' || command.type === 'restart-vote') {
        await this.castVote(attachment.uid, command, meta, state);
      } else if (command.type === 'preset-chat') {
        this.broadcastPreset(attachment.uid, command, meta, state);
      } else if (command.type === 'resume') {
        this.sendSnapshot(socket, 'room-snapshot');
        this.sendStoredReceipt(socket);
      } else {
        throw new RealtimeError(400, 'unsupported_command', 'This breach command is not supported.');
      }
    } catch (error) {
      const known = error instanceof RealtimeError
        ? error
        : new RealtimeError(400, 'invalid_command', 'The breach command could not be applied.');
      const meta = this.meta();
      sendEvent(socket, meta?.room_id ?? 'coop-room', meta ? parseState(meta.state_json).version : 0,
        'error', { code: known.code, message: known.message });
    }
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    await this.markDisconnected(socket);
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.markDisconnected(socket);
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    let changed = false;
    this.ctx.storage.transactionSync(() => {
      for (const player of this.participants()) {
        if (player.disconnected_at !== null
          && now - player.disconnected_at >= ECHO_TAKEOVER_MS
          && player.echo_takeover === 0) {
          this.ctx.storage.sql.exec(
            'UPDATE participants SET echo_takeover = 1 WHERE uid = ?', player.uid,
          );
          changed = true;
        }
      }
    });
    if (changed) this.broadcastSnapshots('echo-takeover');
    const meta = this.meta();
    if (meta?.receipt_json && meta.receipt_queued === 0) await this.queueStoredReceipt();
    await this.scheduleTakeoverAlarm();
  }

  private meta(): MetaRow | null {
    return this.ctx.storage.sql.exec<MetaRow>('SELECT * FROM meta WHERE singleton = 1')
      .toArray()[0] ?? null;
  }

  private participants(): ParticipantRow[] {
    return this.ctx.storage.sql.exec<ParticipantRow>(`
      SELECT uid, display_name, seat_index, roles_json, joined_at,
        disconnected_at, echo_takeover
      FROM participants ORDER BY seat_index ASC
    `).toArray();
  }

  private participant(uid: string): ParticipantRow | null {
    return this.ctx.storage.sql.exec<ParticipantRow>(`
      SELECT uid, display_name, seat_index, roles_json, joined_at,
        disconnected_at, echo_takeover
      FROM participants WHERE uid = ?
    `, uid).toArray()[0] ?? null;
  }

  private ticketWasUsed(jti: string): boolean {
    return Boolean(this.ctx.storage.sql.exec<{ jti: string }>(
      'SELECT jti FROM used_tickets WHERE jti = ?', jti,
    ).toArray()[0]);
  }

  private commandWasAccepted(key: string): boolean {
    return Boolean(this.ctx.storage.sql.exec<{ idempotency_key: string }>(
      'SELECT idempotency_key FROM commands WHERE idempotency_key = ?', key,
    ).toArray()[0]);
  }

  private snapshotFor(uid: string): Record<string, unknown> {
    const meta = this.meta();
    const player = this.participant(uid);
    if (!meta || !player) return { status: 'waiting' };
    const state = parseState(meta.state_json);
    const definition = COOP_CASE_BY_ID[meta.case_id];
    const roles = parseRoles(player.roles_json);
    const clues = roles.flatMap((role) => {
      const clue = coopRoleClue(meta.case_id, state.stageIndex, role);
      return clue ? [{ role, clue }] : [];
    });
    const echoClues = this.participants().flatMap((participant) => {
      if (participant.echo_takeover !== 1) return [];
      return parseRoles(participant.roles_json).flatMap((role) => {
        const clue = coopRoleClue(meta.case_id, state.stageIndex, role);
        return clue ? [{ role, clue, ownerName: participant.display_name }] : [];
      });
    });
    const hints = Array.from(
      { length: Math.min(3, state.stageHintsUsed) },
      (_, index) => coopHint(meta.case_id, state.stageIndex, index + 1),
    ).filter((hint): hint is NonNullable<typeof hint> => Boolean(hint));
    return {
      status: state.status,
      state,
      case: definition,
      roles,
      clues,
      echoClues,
      hints,
      players: this.participants().map((participant) => ({
        uid: participant.uid,
        displayName: participant.display_name,
        roles: parseRoles(participant.roles_json),
        connected: participant.disconnected_at === null,
        echoAssisting: participant.echo_takeover === 1,
      })),
      serverTime: Date.now(),
    };
  }

  private sendSnapshot(socket: WebSocket, eventType: string): void {
    const attachment = socketAttachment(socket);
    const meta = this.meta();
    if (!attachment || !meta) return;
    sendEvent(socket, meta.room_id, parseState(meta.state_json).version, eventType,
      this.snapshotFor(attachment.uid));
  }

  private sendStoredReceipt(socket: WebSocket): void {
    const meta = this.meta();
    if (!meta?.receipt_json) return;
    try {
      const receipt = matchReceiptSchema.safeParse(JSON.parse(meta.receipt_json) as unknown);
      if (!receipt.success) return;
      sendEvent(socket, meta.room_id, parseState(meta.state_json).version, 'reward-pending', {
        receipt: receipt.data,
      });
    } catch {
      // A malformed local replay state must never crash a reconnecting room.
    }
  }

  private broadcastSnapshots(eventType: string): void {
    for (const socket of this.ctx.getWebSockets()) this.sendSnapshot(socket, eventType);
  }

  private async submitAnswer(
    uid: string,
    command: RoomCommand,
    meta: MetaRow,
    state: CoopState,
  ): Promise<void> {
    const answerId = typeof command.payload.answerId === 'string'
      ? command.payload.answerId
      : '';
    const definition = COOP_CASE_BY_ID[meta.case_id];
    if (!definition?.stages[state.stageIndex]?.optionIds.includes(answerId)) {
      throw new RealtimeError(400, 'invalid_answer', 'That answer is not available for this stage.');
    }
    const expected = coopAnswer(meta.case_id, state.stageIndex);
    if (!expected) throw new RealtimeError(500, 'case_not_reviewed', 'This case has no reviewed solution.');
    const correct = answerId === expected;
    const now = Date.now();
    const nextStage = correct ? state.stageIndex + 1 : state.stageIndex;
    const completed = correct && nextStage >= definition.stages.length;
    const next: CoopState = {
      ...state,
      version: state.version + 1,
      status: completed ? 'completed' : 'active',
      stageIndex: completed ? state.stageIndex : nextStage,
      failedAttempts: state.failedAttempts + (correct ? 0 : 1),
      stageHintsUsed: correct ? 0 : state.stageHintsUsed,
      completedStages: correct
        ? [...state.completedStages, definition.stages[state.stageIndex]!.id]
        : state.completedStages,
    };
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'UPDATE meta SET state_json = ?, finished_at = ? WHERE singleton = 1',
        JSON.stringify(next), completed ? now : null,
      );
      this.ctx.storage.sql.exec(`
        INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
        VALUES (?, ?, ?, ?)
      `, command.idempotencyKey, uid, command.type, now);
      this.ctx.storage.sql.exec(`
        INSERT INTO stage_events (stage_index, uid, answer_id, correct, submitted_at)
        VALUES (?, ?, ?, ?, ?)
      `, state.stageIndex, uid, answerId, correct ? 1 : 0, now);
      if (correct) this.ctx.storage.sql.exec('DELETE FROM votes WHERE stage_index = ?', state.stageIndex);
    });
    this.broadcastSnapshots(correct
      ? completed ? 'case-completed' : 'stage-completed'
      : 'answer-rejected');
    if (completed) await this.finalize();
  }

  private async castVote(
    uid: string,
    command: RoomCommand,
    meta: MetaRow,
    state: CoopState,
  ): Promise<void> {
    const kind = command.type === 'hint-vote' ? 'hint' : 'restart';
    if (kind === 'hint' && state.stageHintsUsed >= 3) {
      throw new RealtimeError(409, 'hints_exhausted', 'Echo has already revealed every safe exclusion for this stage.');
    }
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(`
        INSERT OR IGNORE INTO votes (vote_kind, stage_index, uid, voted_at)
        VALUES (?, ?, ?, ?)
      `, kind, state.stageIndex, uid, now);
      this.ctx.storage.sql.exec(`
        INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
        VALUES (?, ?, ?, ?)
      `, command.idempotencyKey, uid, command.type, now);
    });
    const count = this.ctx.storage.sql.exec<{ total: number }>(`
      SELECT COUNT(*) AS total FROM votes WHERE vote_kind = ? AND stage_index = ?
    `, kind, state.stageIndex).toArray()[0]?.total ?? 0;
    const connectedCount = this.participants()
      .filter((participant) => participant.disconnected_at === null).length;
    const needed = Math.floor(Math.max(1, connectedCount) / 2) + 1;
    if (count < needed) {
      for (const socket of this.ctx.getWebSockets()) {
        sendEvent(socket, meta.room_id, state.version, 'vote-updated', {
          kind,
          votes: count,
          needed,
        });
      }
      return;
    }
    const next: CoopState = kind === 'hint'
      ? {
        ...state,
        version: state.version + 1,
        hintsUsed: state.hintsUsed + 1,
        stageHintsUsed: state.stageHintsUsed + 1,
      }
      : {
        ...state,
        version: state.version + 1,
        stageIndex: 0,
        failedAttempts: 0,
        stageHintsUsed: 0,
        completedStages: [],
      };
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'UPDATE meta SET state_json = ? WHERE singleton = 1', JSON.stringify(next),
      );
      this.ctx.storage.sql.exec('DELETE FROM votes');
    });
    this.broadcastSnapshots(kind === 'hint' ? 'hint-approved' : 'case-restarted');
  }

  private broadcastPreset(
    uid: string,
    command: RoomCommand,
    meta: MetaRow,
    state: CoopState,
  ): void {
    const presetId = typeof command.payload.presetId === 'string'
      ? command.payload.presetId
      : '';
    if (!['ready', 'check-memory', 'check-cipher', 'check-route', 'check-anchor', 'thanks'].includes(presetId)) {
      throw new RealtimeError(400, 'invalid_preset', 'That preset message is unavailable.');
    }
    this.ctx.storage.sql.exec(`
      INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
      VALUES (?, ?, ?, ?)
    `, command.idempotencyKey, uid, command.type, Date.now());
    for (const socket of this.ctx.getWebSockets()) {
      sendEvent(socket, meta.room_id, state.version, 'preset-chat', { uid, presetId });
    }
  }

  private async finalize(): Promise<void> {
    const meta = this.meta();
    if (!meta || meta.receipt_json) {
      if (meta?.receipt_json && meta.receipt_queued === 0) await this.queueStoredReceipt();
      return;
    }
    const now = Date.now();
    const players = this.participants();
    const definition = COOP_CASE_BY_ID[meta.case_id];
    const cosmetic = definition ? `breach-frame-${definition.chapterId}` : 'breach-frame-signal';
    const participants: MatchReceipt['participants'] = players.map((player) => ({
      uid: player.uid,
      outcome: 'completed',
      participationMs: Math.max(0, now - (meta.started_at ?? player.joined_at)),
    }));
    const receipt = await sealReceipt(this.env.REALTIME_TICKET_SECRET, {
      version: 1,
      receiptId: crypto.randomUUID(),
      matchId: meta.room_id,
      mode: 'coop_breach',
      context: { caseId: meta.case_id, variant: null },
      status: 'completed',
      participants,
      winnerUid: null,
      durationMs: Math.max(0, now - (meta.started_at ?? now)),
      rewards: participants.map((participant) => participantReward(
        meta.room_id,
        participant.uid,
        90,
        [cosmetic],
      )),
      completedAt: new Date(now).toISOString(),
    });
    this.ctx.storage.sql.exec(`
      UPDATE meta SET receipt_json = ?, finished_at = COALESCE(finished_at, ?)
      WHERE singleton = 1 AND receipt_json IS NULL
    `, JSON.stringify(receipt), now);
    await this.storeReplay(receipt);
    await this.queueStoredReceipt();
  }

  private async storeReplay(receipt: MatchReceipt): Promise<void> {
    const events = this.ctx.storage.sql.exec<{
      event_index: number;
      stage_index: number;
      uid: string;
      answer_id: string;
      correct: number;
      submitted_at: number;
    }>('SELECT * FROM stage_events ORDER BY event_index ASC').toArray();
    try {
      await this.env.REPLAYS.put(`coop/${receipt.matchId}.json`, JSON.stringify({
        version: 1,
        receiptId: receipt.receiptId,
        matchId: receipt.matchId,
        caseId: this.meta()?.case_id,
        events,
      }), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
        customMetadata: { integrityHash: receipt.integrityHash },
      });
    } catch {
      // Replay failure cannot alter the authoritative completion receipt.
    }
  }

  private async queueStoredReceipt(): Promise<void> {
    const meta = this.meta();
    if (!meta?.receipt_json || meta.receipt_queued !== 0) return;
    const receipt = JSON.parse(meta.receipt_json) as MatchReceipt;
    const payload: QueuedResult = {
      receipt,
      profiles: this.participants().map((player) => ({
        uid: player.uid,
        displayName: player.display_name,
      })),
    };
    try {
      await this.env.RESULT_QUEUE.send(payload, { contentType: 'json' });
      this.ctx.storage.sql.exec('UPDATE meta SET receipt_queued = 1 WHERE singleton = 1');
      for (const socket of this.ctx.getWebSockets()) {
        sendEvent(socket, meta.room_id, parseState(meta.state_json).version, 'reward-pending', {
          receipt,
        });
      }
    } catch {
      await this.ctx.storage.setAlarm(Date.now() + 5_000);
    }
  }

  private async markDisconnected(socket: WebSocket): Promise<void> {
    const attachment = socketAttachment(socket);
    if (!attachment) return;
    const remaining = this.ctx.getWebSockets(`uid:${attachment.uid}`)
      .filter((candidate) => candidate !== socket);
    if (remaining.length > 0) return;
    this.ctx.storage.sql.exec(`
      UPDATE participants SET disconnected_at = ?, echo_takeover = 0 WHERE uid = ?
    `, Date.now(), attachment.uid);
    this.broadcastSnapshots('presence-changed');
    await this.scheduleTakeoverAlarm();
  }

  private async scheduleTakeoverAlarm(): Promise<void> {
    const candidates = this.participants().flatMap((player) => (
      player.disconnected_at !== null && player.echo_takeover === 0
        ? [player.disconnected_at + ECHO_TAKEOVER_MS]
        : []
    ));
    const meta = this.meta();
    if (meta?.receipt_json && meta.receipt_queued === 0) candidates.push(Date.now() + 5_000);
    if (candidates.length > 0) {
      await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, Math.min(...candidates)));
    }
  }
}
