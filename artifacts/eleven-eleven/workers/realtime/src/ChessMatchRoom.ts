import { DurableObject } from 'cloudflare:workers';
import { Chess, type Color, type Square } from 'chess.js';
import {
  applyContractChessMove,
  createContractChessState,
  effectiveClock,
  type ContractChessState,
} from '../../../src/domain/echo-network/chessRules';
import {
  matchReceiptSchema,
  type MatchReceipt,
  OnlineMode,
  RealtimeTicketPayload,
  RoomCommand,
} from '../../../src/domain/echo-network/contracts';
import {
  RealtimeError,
  createSocketPair,
  errorResponse,
  modeIsChess,
  parseRoomCommand,
  requireUpgradeTicket,
  roomIdFromPath,
  sendEvent,
  socketAttachment,
  upgradeResponse,
  type SocketAttachment,
} from './common';
import { participantReward, sealReceipt, type QueuedResult } from './receipt';

interface MetaRow {
  [key: string]: SqlStorageValue;
  room_id: string;
  mode: OnlineMode;
  variant: ContractChessState['variant'];
  state_json: string | null;
  started_at: number | null;
  finished_at: number | null;
  receipt_json: string | null;
  receipt_queued: number;
}

interface ParticipantRow {
  [key: string]: SqlStorageValue;
  uid: string;
  display_name: string;
  color: Color;
  joined_at: number;
  disconnected_at: number | null;
}

interface FinalizationOutboxRow {
  [key: string]: SqlStorageValue;
  result_status: MatchReceipt['status'];
  winner_uid: string | null;
  created_at: number;
  attempts: number;
}

const RECONNECT_GRACE_MS = 30_000;
const MIN_COMPETITIVE_DURATION_MS = 90_000;
const MIN_COMPETITIVE_PLIES = 8;

function parseState(value: string | null): ContractChessState | null {
  if (!value) return null;
  return JSON.parse(value) as ContractChessState;
}

function timeControl(mode: OnlineMode): 'blitz' | 'rapid' {
  return mode === 'chess_ranked_blitz' ? 'blitz' : 'rapid';
}

function variantForTicket(ticket: RealtimeTicketPayload): ContractChessState['variant'] {
  if (ticket.mode !== 'chess_anomaly') return 'standard';
  if (ticket.variant && ticket.variant !== 'standard') return ticket.variant;
  const variants: ContractChessState['variant'][] = ['three-signal', 'core-control', 'fog-memory'];
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1_000));
  return variants[week % variants.length]!;
}

function statusWinnerColor(state: ContractChessState): Color | null {
  if (state.status === 'white-won') return 'w';
  if (state.status === 'black-won') return 'b';
  return null;
}

function rewardXp(
  mode: OnlineMode,
  outcome: 'win' | 'loss' | 'draw',
  abandoned: boolean,
): number {
  if (abandoned && outcome === 'loss') return 0;
  if (mode === 'chess_ranked_blitz' || mode === 'chess_ranked_rapid') {
    return outcome === 'win' ? 80 : outcome === 'draw' ? 60 : 45;
  }
  return outcome === 'win' ? 45 : outcome === 'draw' ? 35 : 30;
}

function competitiveResultEligible(
  mode: OnlineMode,
  status: MatchReceipt['status'],
  durationMs: number,
  plies: number,
): boolean {
  if (mode !== 'chess_casual' && mode !== 'chess_ranked_blitz' && mode !== 'chess_ranked_rapid') return true;
  return status !== 'resigned'
    || (durationMs >= MIN_COMPETITIVE_DURATION_MS && plies >= MIN_COMPETITIVE_PLIES);
}

export class ChessMatchRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS meta (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          room_id TEXT NOT NULL,
          mode TEXT NOT NULL,
          variant TEXT NOT NULL,
          state_json TEXT,
          started_at INTEGER,
          finished_at INTEGER,
          receipt_json TEXT,
          receipt_queued INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS participants (
          uid TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          color TEXT NOT NULL CHECK (color IN ('w', 'b')),
          joined_at INTEGER NOT NULL,
          disconnected_at INTEGER
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
        CREATE TABLE IF NOT EXISTS moves (
          ply INTEGER PRIMARY KEY,
          uid TEXT NOT NULL,
          from_square TEXT NOT NULL,
          to_square TEXT NOT NULL,
          san TEXT NOT NULL,
          played_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS result_finalization_outbox (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          result_status TEXT NOT NULL,
          winner_uid TEXT,
          created_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const ticket = await requireUpgradeTicket(request, this.env, 'connect');
      const roomId = roomIdFromPath(request);
      if (ticket.target !== 'match' || ticket.roomId !== roomId || !modeIsChess(ticket.mode)) {
        throw new RealtimeError(403, 'wrong_room', 'This ticket does not belong to the chess room.');
      }
      if (this.ticketWasUsed(ticket.jti)) {
        throw new RealtimeError(409, 'ticket_reused', 'This room ticket was already used.');
      }
      const now = Date.now();
      let participant = this.participant(ticket.uid);
      const participants = this.participants();
      if (!participant && participants.length >= 2) {
        throw new RealtimeError(409, 'room_full', 'This chess room is full.');
      }

      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          'INSERT INTO used_tickets (jti, used_at) VALUES (?, ?)', ticket.jti, now,
        );
        const meta = this.meta();
        if (!meta) {
          this.ctx.storage.sql.exec(`
            INSERT INTO meta (
              singleton, room_id, mode, variant, state_json,
              started_at, finished_at, receipt_json, receipt_queued
            ) VALUES (1, ?, ?, ?, NULL, NULL, NULL, NULL, 0)
          `, roomId, ticket.mode, variantForTicket(ticket));
        } else if (meta.room_id !== roomId || meta.mode !== ticket.mode) {
          throw new RealtimeError(409, 'room_contract_mismatch', 'The room contract does not match this ticket.');
        }
        if (participant) {
          this.ctx.storage.sql.exec(`
            UPDATE participants SET display_name = ?, disconnected_at = NULL WHERE uid = ?
          `, ticket.displayName, ticket.uid);
        } else {
          const color: Color = participants.length === 0 ? 'w' : 'b';
          this.ctx.storage.sql.exec(`
            INSERT INTO participants (uid, display_name, color, joined_at, disconnected_at)
            VALUES (?, ?, ?, ?, NULL)
          `, ticket.uid, ticket.displayName, color, now);
          participant = {
            uid: ticket.uid,
            display_name: ticket.displayName,
            color,
            joined_at: now,
            disconnected_at: null,
          };
        }
        if (this.participants().length === 2 && !parseState(this.meta()?.state_json ?? null)) {
          const meta = this.meta()!;
          const initial = createContractChessState(meta.variant, timeControl(meta.mode), now);
          this.ctx.storage.sql.exec(`
            UPDATE meta SET state_json = ?, started_at = ? WHERE singleton = 1
          `, JSON.stringify(initial), now);
        }
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
      this.sendSnapshot(server, 'room-snapshot');
      this.sendStoredReceipt(server);
      this.broadcastPresence();
      await this.scheduleNextAlarm();
      return upgradeResponse(client);
    } catch (error) {
      return errorResponse(error);
    }
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const attachment = socketAttachment(socket);
      if (!attachment) throw new RealtimeError(401, 'session_missing', 'The room session is missing.');
      const command = parseRoomCommand(message);
      if (command.type === 'ping') {
        const state = parseState(this.meta()?.state_json ?? null);
        sendEvent(socket, this.meta()?.room_id ?? 'chess-room', state?.version ?? 0, 'pong', {
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
      const state = parseState(this.meta()?.state_json ?? null);
      if (!state) throw new RealtimeError(409, 'waiting_for_opponent', 'The match is waiting for an opponent.');
      if (state.status !== 'active' && command.type !== 'resume' && command.type !== 'preset-chat') {
        throw new RealtimeError(409, 'match_finished', 'The chess match is already complete.');
      }
      if (command.expectedVersion !== state.version) {
        throw new RealtimeError(409, 'version_conflict', 'The room changed; apply the latest snapshot.');
      }
      if (command.type === 'move') {
        await this.applyMove(attachment.uid, command, state);
      } else if (command.type === 'resign') {
        await this.resign(attachment.uid, command, state);
      } else if (command.type === 'resume') {
        this.sendSnapshot(socket, 'room-snapshot');
        this.sendStoredReceipt(socket);
      } else if (command.type === 'preset-chat') {
        this.broadcastPreset(attachment.uid, command);
      } else {
        throw new RealtimeError(400, 'unsupported_command', 'This chess command is not supported.');
      }
    } catch (error) {
      const known = error instanceof RealtimeError
        ? error
        : new RealtimeError(400, 'invalid_move', 'The chess command could not be applied.');
      const state = parseState(this.meta()?.state_json ?? null);
      sendEvent(socket, this.meta()?.room_id ?? 'chess-room', state?.version ?? 0, 'error', {
        code: known.code,
        message: known.message,
      });
    }
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    await this.markDisconnected(socket);
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.markDisconnected(socket);
  }

  async alarm(): Promise<void> {
    const meta = this.meta();
    const state = parseState(meta?.state_json ?? null);
    if (!meta || !state) return;
    if (state.status === 'active') {
      const now = Date.now();
      const disconnected = this.participants().filter((row) => (
        row.disconnected_at !== null && now - row.disconnected_at >= RECONNECT_GRACE_MS
      ));
      if (disconnected.length > 0) {
        const remaining = this.participants().filter((row) => (
          !disconnected.some((entry) => entry.uid === row.uid)
        ));
        const winner = remaining.length === 1 ? remaining[0]! : null;
        const next: ContractChessState = {
          ...state,
          version: state.version + 1,
          status: winner ? (winner.color === 'w' ? 'white-won' : 'black-won') : 'draw',
          reason: 'abandoned',
          clock: { ...state.clock, ...effectiveClock(state, now), turnStartedAt: now },
        };
        this.persistTerminalState(next, 'abandoned', winner?.uid ?? null, now);
        this.broadcastSnapshots('match-completed');
        await this.finalize('abandoned', winner?.uid ?? null);
        return;
      }
      const clock = effectiveClock(state, now);
      const chess = new Chess(state.fen);
      const expired = chess.turn() === 'w' ? clock.whiteMs <= 0 : clock.blackMs <= 0;
      if (expired) {
        const winnerColor: Color = chess.turn() === 'w' ? 'b' : 'w';
        const winner = this.participants().find((row) => row.color === winnerColor) ?? null;
        const next: ContractChessState = {
          ...state,
          version: state.version + 1,
          status: winnerColor === 'w' ? 'white-won' : 'black-won',
          reason: 'timeout',
          clock: { ...state.clock, ...clock, turnStartedAt: now },
        };
        this.persistTerminalState(next, 'timeout', winner?.uid ?? null, now);
        this.broadcastSnapshots('match-completed');
        await this.finalize('timeout', winner?.uid ?? null);
        return;
      }
    }
    if (!meta.receipt_json && this.finalizationIntent()) {
      await this.finalize('completed', null);
    } else if (meta.receipt_json && meta.receipt_queued === 0) {
      await this.queueStoredReceipt();
    }
    await this.scheduleNextAlarm();
  }

  private meta(): MetaRow | null {
    return this.ctx.storage.sql.exec<MetaRow>('SELECT * FROM meta WHERE singleton = 1')
      .toArray()[0] ?? null;
  }

  private participants(): ParticipantRow[] {
    return this.ctx.storage.sql.exec<ParticipantRow>(`
      SELECT uid, display_name, color, joined_at, disconnected_at
      FROM participants ORDER BY joined_at ASC, uid ASC
    `).toArray();
  }

  private participant(uid: string): ParticipantRow | null {
    return this.ctx.storage.sql.exec<ParticipantRow>(`
      SELECT uid, display_name, color, joined_at, disconnected_at
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
    const state = parseState(meta?.state_json ?? null);
    const participant = this.participant(uid);
    const players = this.participants().map((row) => ({
      uid: row.uid,
      displayName: row.display_name,
      color: row.color,
      connected: row.disconnected_at === null,
    }));
    if (!meta || !state || !participant) {
      return { status: 'waiting', players, color: participant?.color ?? null };
    }
    const chess = new Chess(state.fen);
    const legalMoves = chess.turn() === participant.color && state.status === 'active'
      ? chess.moves({ verbose: true }).map((move) => ({
        from: move.from,
        to: move.to,
        promotion: move.promotion ?? null,
      }))
      : [];
    const fogPieces = state.variant === 'fog-memory'
      ? chess.board().flat().flatMap((piece) => {
        if (!piece) return [];
        const visible = piece.color === participant.color
          || chess.isAttacked(piece.square, participant.color);
        return visible ? [{ square: piece.square, type: piece.type, color: piece.color }] : [];
      })
      : null;
    return {
      status: state.status,
      mode: meta.mode,
      variant: meta.variant,
      color: participant.color,
      players,
      state: state.variant === 'fog-memory'
        ? { ...state, fen: null }
        : state,
      fogPieces,
      legalMoves,
      clock: effectiveClock(state),
      activeColor: chess.turn(),
      serverTime: Date.now(),
    };
  }

  private sendSnapshot(socket: WebSocket, eventType: string): void {
    const attachment = socketAttachment(socket);
    if (!attachment) return;
    const meta = this.meta();
    const state = parseState(meta?.state_json ?? null);
    sendEvent(socket, meta?.room_id ?? 'chess-room', state?.version ?? 0, eventType,
      this.snapshotFor(attachment.uid));
  }

  private sendStoredReceipt(socket: WebSocket): void {
    const meta = this.meta();
    if (!meta?.receipt_json) return;
    try {
      const receipt = matchReceiptSchema.safeParse(JSON.parse(meta.receipt_json) as unknown);
      if (!receipt.success) return;
      const state = parseState(meta.state_json);
      sendEvent(socket, meta.room_id, state?.version ?? 0, 'reward-pending', { receipt: receipt.data });
    } catch {
      // A malformed local replay state must never crash a reconnecting room.
    }
  }

  private broadcastSnapshots(eventType: string): void {
    for (const socket of this.ctx.getWebSockets()) this.sendSnapshot(socket, eventType);
  }

  private broadcastPresence(): void {
    this.broadcastSnapshots('presence-changed');
  }

  private async applyMove(
    uid: string,
    command: RoomCommand,
    state: ContractChessState,
  ): Promise<void> {
    const player = this.participant(uid);
    if (!player) throw new RealtimeError(403, 'not_a_player', 'Only a seated player can move.');
    const chess = new Chess(state.fen);
    if (chess.turn() !== player.color) {
      throw new RealtimeError(409, 'not_your_turn', 'Wait for the other signal.');
    }
    const from = typeof command.payload.from === 'string' ? command.payload.from : '';
    const to = typeof command.payload.to === 'string' ? command.payload.to : '';
    const promotion = typeof command.payload.promotion === 'string'
      ? command.payload.promotion
      : undefined;
    if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)
      || (promotion && !['q', 'r', 'b', 'n'].includes(promotion))) {
      throw new RealtimeError(400, 'invalid_move', 'The requested chess move is invalid.');
    }
    let next: ContractChessState;
    try {
      next = applyContractChessMove(state, {
        from: from as Square,
        to: to as Square,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
        now: Date.now(),
      });
    } catch {
      throw new RealtimeError(409, 'illegal_move', 'That chess move is not legal.');
    }
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'UPDATE meta SET state_json = ? WHERE singleton = 1', JSON.stringify(next),
      );
      this.ctx.storage.sql.exec(`
        INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
        VALUES (?, ?, ?, ?)
      `, command.idempotencyKey, uid, command.type, now);
      this.ctx.storage.sql.exec(`
        INSERT INTO moves (ply, uid, from_square, to_square, san, played_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, next.version, uid, from, to, next.lastMove?.san ?? '', now);
      if (next.status !== 'active') {
        const winnerColor = statusWinnerColor(next);
        const winner = this.participants().find((row) => row.color === winnerColor) ?? null;
        this.persistFinalizationIntent('completed', winner?.uid ?? null, now);
      }
    });
    this.broadcastSnapshots(next.status === 'active' ? 'move-applied' : 'match-completed');
    if (next.status !== 'active') {
      const winnerColor = statusWinnerColor(next);
      const winner = this.participants().find((row) => row.color === winnerColor) ?? null;
      await this.finalize('completed', winner?.uid ?? null);
    } else {
      await this.scheduleNextAlarm();
    }
  }

  private async resign(
    uid: string,
    command: RoomCommand,
    state: ContractChessState,
  ): Promise<void> {
    const player = this.participant(uid);
    if (!player) throw new RealtimeError(403, 'not_a_player', 'Only a seated player can resign.');
    const winner = this.participants().find((row) => row.uid !== uid) ?? null;
    const now = Date.now();
    const next: ContractChessState = {
      ...state,
      version: state.version + 1,
      status: winner ? (winner.color === 'w' ? 'white-won' : 'black-won') : 'draw',
      reason: 'resigned',
      clock: { ...state.clock, ...effectiveClock(state, now), turnStartedAt: now },
    };
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'UPDATE meta SET state_json = ?, finished_at = ? WHERE singleton = 1',
        JSON.stringify(next), now,
      );
      this.ctx.storage.sql.exec(`
        INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
        VALUES (?, ?, ?, ?)
      `, command.idempotencyKey, uid, command.type, now);
      this.persistFinalizationIntent('resigned', winner?.uid ?? null, now);
    });
    this.broadcastSnapshots('match-completed');
    await this.finalize('resigned', winner?.uid ?? null);
  }

  private broadcastPreset(uid: string, command: RoomCommand): void {
    const presetId = typeof command.payload.presetId === 'string'
      ? command.payload.presetId
      : '';
    if (!['ready', 'good-move', 'well-played', 'one-moment', 'reconnect', 'thanks'].includes(presetId)) {
      throw new RealtimeError(400, 'invalid_preset', 'That preset message is unavailable.');
    }
    const meta = this.meta();
    const state = parseState(meta?.state_json ?? null);
    this.ctx.storage.sql.exec(`
      INSERT INTO commands (idempotency_key, uid, command_type, accepted_at)
      VALUES (?, ?, ?, ?)
    `, command.idempotencyKey, uid, command.type, Date.now());
    for (const socket of this.ctx.getWebSockets()) {
      sendEvent(socket, meta?.room_id ?? 'chess-room', state?.version ?? 0, 'preset-chat', {
        uid,
        presetId,
      });
    }
  }

  private persistTerminalState(
    state: ContractChessState,
    status: MatchReceipt['status'],
    winnerUid: string | null,
    now: number,
  ): void {
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(`
        UPDATE meta SET state_json = ?, finished_at = ? WHERE singleton = 1
      `, JSON.stringify(state), now);
      this.persistFinalizationIntent(status, winnerUid, now);
    });
  }

  private persistFinalizationIntent(
    status: MatchReceipt['status'],
    winnerUid: string | null,
    now: number,
  ): void {
    this.ctx.storage.sql.exec(`
      INSERT OR IGNORE INTO result_finalization_outbox (
        singleton, result_status, winner_uid, created_at, attempts
      ) VALUES (1, ?, ?, ?, 0)
    `, status, winnerUid, now);
  }

  private finalizationIntent(): FinalizationOutboxRow | null {
    return this.ctx.storage.sql.exec<FinalizationOutboxRow>(
      'SELECT * FROM result_finalization_outbox WHERE singleton = 1',
    ).toArray()[0] ?? null;
  }

  private async finalize(
    matchStatus: MatchReceipt['status'],
    winnerUid: string | null,
  ): Promise<void> {
    const meta = this.meta();
    if (!meta || meta.receipt_json) {
      if (meta?.receipt_json && meta.receipt_queued === 0) await this.queueStoredReceipt();
      return;
    }
    const now = Date.now();
    const players = this.participants();
    const state = parseState(meta.state_json);
    // Terminal state and this intent are atomically durable.  A restart after
    // a crash resumes this work from the outbox rather than losing a result.
    const intent = this.finalizationIntent();
    if (!intent) this.persistFinalizationIntent(matchStatus, winnerUid, now);
    const durableIntent = intent ?? this.finalizationIntent()!;
    const draw = !durableIntent.winner_uid;
    const participants: MatchReceipt['participants'] = players.map((player) => ({
      uid: player.uid,
      outcome: draw ? 'draw' : player.uid === durableIntent.winner_uid ? 'win' : 'loss',
      participationMs: Math.max(0, now - (meta.started_at ?? player.joined_at)),
    }));
    const durationMs = Math.max(0, now - (meta.started_at ?? now));
    const plies = this.ctx.storage.sql.exec<{ total: number }>(
      'SELECT COUNT(*) AS total FROM moves',
    ).toArray()[0]?.total ?? 0;
    const eligible = competitiveResultEligible(meta.mode, durableIntent.result_status, durationMs, plies);
    const rewards = participants.map((participant) => participantReward(
      meta.room_id,
      participant.uid,
      rewardXp(
        meta.mode,
        participant.outcome as 'win' | 'loss' | 'draw',
        state?.reason === 'abandoned' || !eligible,
      ),
      meta.mode === 'chess_anomaly' ? ['chess-board-echo-signal'] : [],
    ));
    const receipt = await sealReceipt(this.env.REALTIME_TICKET_SECRET, {
      version: 1,
      receiptId: crypto.randomUUID(),
      matchId: meta.room_id,
      mode: meta.mode,
      context: { caseId: null, variant: meta.variant },
      status: durableIntent.result_status,
      participants,
      winnerUid: durableIntent.winner_uid,
      durationMs,
      rewards,
      completedAt: new Date(now).toISOString(),
    });
    this.ctx.storage.sql.exec(`
      UPDATE meta SET receipt_json = ?, finished_at = COALESCE(finished_at, ?)
      WHERE singleton = 1 AND receipt_json IS NULL
    `, JSON.stringify(receipt), now);
    this.ctx.storage.sql.exec(
      'UPDATE result_finalization_outbox SET attempts = attempts + 1 WHERE singleton = 1',
    );
    await this.storeReplay(receipt);
    await this.queueStoredReceipt();
  }

  private async storeReplay(receipt: MatchReceipt): Promise<void> {
    const moves = this.ctx.storage.sql.exec<{
      ply: number;
      uid: string;
      from_square: string;
      to_square: string;
      san: string;
      played_at: number;
    }>('SELECT * FROM moves ORDER BY ply ASC').toArray();
    try {
      await this.env.REPLAYS.put(`chess/${receipt.matchId}.json`, JSON.stringify({
        version: 1,
        receiptId: receipt.receiptId,
        matchId: receipt.matchId,
        moves,
      }), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
        customMetadata: { integrityHash: receipt.integrityHash },
      });
    } catch {
      // The authoritative receipt remains queued. Replay availability is
      // best-effort and never changes the result or rewards.
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
      await this.env.RESULT_QUEUE.send(payload, {
        contentType: 'json',
      });
      this.ctx.storage.sql.exec(
        'UPDATE meta SET receipt_queued = 1 WHERE singleton = 1',
      );
      for (const socket of this.ctx.getWebSockets()) {
        sendEvent(socket, meta.room_id, parseState(meta.state_json)?.version ?? 0, 'reward-pending', {
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
    if (remaining.length === 0) {
      this.ctx.storage.sql.exec(
        'UPDATE participants SET disconnected_at = ? WHERE uid = ?',
        Date.now(), attachment.uid,
      );
      this.broadcastPresence();
      await this.scheduleNextAlarm();
    }
  }

  private async scheduleNextAlarm(): Promise<void> {
    const meta = this.meta();
    const state = parseState(meta?.state_json ?? null);
    const candidates: number[] = [];
    if (state?.status === 'active') {
      const chess = new Chess(state.fen);
      const clock = effectiveClock(state);
      candidates.push(Date.now() + (chess.turn() === 'w' ? clock.whiteMs : clock.blackMs));
      for (const participant of this.participants()) {
        if (participant.disconnected_at !== null) {
          candidates.push(participant.disconnected_at + RECONNECT_GRACE_MS);
        }
      }
    }
    if ((meta?.receipt_json && meta.receipt_queued === 0)
      || (!meta?.receipt_json && this.finalizationIntent())) candidates.push(Date.now() + 5_000);
    if (candidates.length > 0) {
      await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, Math.min(...candidates)));
    }
  }
}
