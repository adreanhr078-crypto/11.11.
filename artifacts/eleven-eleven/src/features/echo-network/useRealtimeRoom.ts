import { useCallback, useEffect, useRef, useState } from 'react';
import {
  matchReceiptSchema,
  onlineModeSchema,
  realtimeEnvelopeSchema,
  type MatchReceipt,
  type NetworkLocale,
  type OnlineMode,
  type RealtimeEnvelope,
  type RoomCommand,
  type ChessVariant,
  type RealtimeTicketRequest,
} from '../../domain/echo-network/contracts';
import {
  EchoNetworkApiError,
  issueNetworkTicket,
} from '../../infrastructure/echo-network/echoNetworkApi';
import { normalizePartyRoomId } from '../../domain/echo-network/partyRoomSafety';

export type RealtimeRoomPhase =
  | 'idle'
  | 'queueing'
  | 'connecting'
  | 'awaiting-snapshot'
  | 'active'
  | 'reconnecting'
  /** The result is terminal, but the client must not treat it as profile progression. */
  | 'settling'
  | 'completed'
  | 'error';

/**
 * The browser may observe a terminal room before its durable result receipt
 * reaches it. These values deliberately describe transport/finalization only:
 * they never imply that XP, rating, or cosmetics have reached the profile.
 */
export type RealtimeResultSettlement =
  | 'none'
  | 'awaiting-receipt'
  | 'pending-server-finalization';

export interface RealtimeRoomState {
  phase: RealtimeRoomPhase;
  mode: OnlineMode | null;
  target: RealtimeTicketRequest['target'] | null;
  roomId: string | null;
  snapshot: Record<string, unknown> | null;
  receipt: MatchReceipt | null;
  settlement: RealtimeResultSettlement;
  error: string | null;
  queueStartedAt: number | null;
  events: RealtimeEnvelope[];
}

export interface RealtimeRoomController {
  state: RealtimeRoomState;
  joinQueue: (input: {
    mode: OnlineMode;
    caseId?: string;
    variant?: ChessVariant;
  }) => Promise<void>;
  joinDirect: (input: {
    target: 'party' | 'community';
    roomId: string;
    mode?: OnlineMode;
  }) => Promise<void>;
  sendCommand: (
    type: RoomCommand['type'],
    payload?: Record<string, unknown>,
  ) => boolean;
  /**
   * Re-issues a Pages-verified ticket for the same match after a bounded
   * transport recovery has stopped. It never trusts a persisted ticket or
   * client snapshot.
   */
  retryExistingMatch: () => Promise<void>;
  leave: () => void;
}

const INITIAL_STATE: RealtimeRoomState = {
  phase: 'idle',
  mode: null,
  target: null,
  roomId: null,
  snapshot: null,
  receipt: null,
  settlement: 'none',
  error: null,
  queueStartedAt: null,
  events: [],
};

const ACTIVE_MATCH_RESUME_KEY = 'eleven_echo_network_active_match_v1';

interface PersistedMatchSession {
  version: 1;
  target: 'match';
  mode: OnlineMode;
  roomId: string;
}

export interface UseRealtimeRoomOptions {
  /**
   * Restore only the minimal, non-authoritative match locator after reload.
   * The Pages ticket endpoint checks the signed-in player membership again;
   * no ticket, snapshot, reward, or authority state is persisted in the browser.
   */
  resumeMatch?: boolean;
  /** Localizes only client-side transport/recovery messaging. */
  locale?: NetworkLocale;
}

export function parsePersistedMatchSession(value: string | null): PersistedMatchSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const mode = onlineModeSchema.safeParse(parsed.mode);
    const roomId = typeof parsed.roomId === 'string' ? parsed.roomId : '';
    if (parsed.version !== 1 || parsed.target !== 'match' || !mode.success
      || !/^match_[A-Za-z0-9_-]{3,90}$/.test(roomId)) {
      return null;
    }
    return { version: 1, target: 'match', mode: mode.data, roomId };
  } catch {
    return null;
  }
}

/**
 * A ticket request is only allowed to open a socket while it still belongs to
 * the player's latest connection intent. This keeps a slow queue/party
 * response from reviving a session the player has already cancelled or
 * replaced. The epoch is transport-only; it never authorizes a room.
 */
export function isCurrentRealtimeConnectionIntent(
  expectedIntent: number,
  currentIntent: number,
  manuallyClosed: boolean,
): boolean {
  return expectedIntent === currentIntent && !manuallyClosed;
}

function readPersistedMatchSession(): PersistedMatchSession | null {
  if (typeof window === 'undefined') return null;
  try {
    return parsePersistedMatchSession(window.sessionStorage.getItem(ACTIVE_MATCH_RESUME_KEY));
  } catch {
    return null;
  }
}

function writePersistedMatchSession(session: PersistedMatchSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      window.sessionStorage.setItem(ACTIVE_MATCH_RESUME_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(ACTIVE_MATCH_RESUME_KEY);
    }
  } catch {
    // Session recovery is optional; an unavailable browser store must not block play.
  }
}

export function shouldPersistMatchSession(
  state: Pick<RealtimeRoomState, 'target' | 'mode' | 'roomId' | 'phase' | 'receipt' | 'settlement'>,
): boolean {
  return state.target === 'match'
    && state.mode !== null
    && state.roomId !== null
    && ['connecting', 'awaiting-snapshot', 'active', 'reconnecting', 'settling', 'completed', 'error'].includes(state.phase)
    // A terminal receipt is durable and can be replayed by the room itself;
    // retaining a browser locator after it would reopen a completed surface.
    && state.settlement !== 'pending-server-finalization'
    && !(state.phase === 'completed' && state.receipt !== null);
}

type RecoverableMatchLocator = Pick<RealtimeRoomState, 'target' | 'mode' | 'roomId' | 'phase' | 'receipt' | 'settlement'> & {
  target: 'match';
  mode: OnlineMode;
  roomId: string;
  phase: 'error' | 'settling';
  receipt: null;
};

export function isRecoverableMatchState(
  state: Pick<RealtimeRoomState, 'target' | 'mode' | 'roomId' | 'phase' | 'receipt' | 'settlement'>,
): state is RecoverableMatchLocator {
  const boundedTransportFailure = state.phase === 'error' && state.receipt === null;
  const terminalReceiptStillMissing = state.phase === 'settling'
    && state.settlement === 'awaiting-receipt'
    && state.receipt === null;
  return (boundedTransportFailure || terminalReceiptStillMissing)
    && state.target === 'match'
    && state.mode !== null
    && state.roomId !== null;
}

/**
 * A WebSocket opening only proves that transport succeeded. Authoritative
 * gameplay must wait for the server snapshot that binds the room version,
 * player role, and current state.
 */
export function roomHasUsableSnapshot(state: Pick<RealtimeRoomState, 'phase' | 'snapshot'>): boolean {
  return Boolean(state.snapshot)
    && (state.phase === 'active' || state.phase === 'settling' || state.phase === 'completed');
}

/** Keep leave intent explicit without ever resigning a Co-op match. */
export function leaveCommandForState(
  state: Pick<RealtimeRoomState, 'phase' | 'target' | 'mode'>,
): 'resign' | null {
  if (state.phase !== 'active') return null;
  if (state.target === 'party') return 'resign';
  return state.target === 'match' && state.mode !== 'coop_breach'
    ? 'resign'
    : null;
}

const REALTIME_COPY = {
  ar: {
    rankedLocked: 'أكمل تدريب الشطرنج وثلاث مباريات Casual أولًا.',
    notConfigured: 'خادم اللعب الحي غير مربوط بهذه النسخة بعد. التدريب المحلي متاح.',
    disconnected: 'انقطع اتصال Echo Network.',
    reconnectTimedOut: 'انتهت مهلة إعادة الاتصال بالغرفة.',
    incompleteMatch: 'وصل عقد مباراة غير مكتمل.',
    invalidReceipt: 'وصل إيصال مباراة غير صالح. لم تُعرض أي مكافأة.',
    rejected: 'رفض الخادم الأمر.',
    channelFailed: 'تعذر تثبيت قناة الغرفة.',
    snapshotTimedOut: 'تأخرت حالة الغرفة الموثقة. نحاول الاتصال من جديد…',
    matchmakingFailed: 'تعذر دخول المطابقة.',
    matchmakingClosed: 'أُغلقت قناة المطابقة.',
    invalidParty: 'رمز الفريق الخاص غير صالح.',
    requestFailed: 'تعذر إتمام طلب شبكة Echo. حاول مجددًا.',
    roomRecoveryUnavailable: 'لم تعد عضويتك في هذه الغرفة متاحة. يمكنك بدء جلسة جديدة.',
  },
  en: {
    rankedLocked: 'Complete Chess training and three Casual matches first.',
    notConfigured: 'Live play is not connected for this build yet. Local training remains available.',
    disconnected: 'Echo Network connection was interrupted.',
    reconnectTimedOut: 'The room reconnection window ended.',
    incompleteMatch: 'The match contract was incomplete.',
    invalidReceipt: 'An invalid match receipt arrived. No reward was displayed.',
    rejected: 'The server rejected that action.',
    channelFailed: 'The room channel could not be established.',
    snapshotTimedOut: 'The authoritative room state took too long. Reconnecting…',
    matchmakingFailed: 'Could not enter matchmaking.',
    matchmakingClosed: 'The matchmaking channel closed.',
    invalidParty: 'That private party code is invalid.',
    requestFailed: 'Echo Network could not complete that request. Try again.',
    roomRecoveryUnavailable: 'Your membership in this room is no longer available. You can start a new session.',
  },
} as const;

/**
 * Worker messages are deliberately not rendered verbatim. They are transport
 * diagnostics, not player copy, and several rooms emit English-only text.
 * Unknown codes still receive a safe localized fallback.
 */
const REALTIME_SERVER_ERROR_COPY: Record<string, { ar: string; en: string }> = {
  websocket_required: { ar: 'تعذر فتح قناة اللعب الحي. أعد المحاولة من داخل اللعبة.', en: 'The live-play channel could not open. Try again from inside the game.' },
  origin_not_allowed: { ar: 'لا يسمح هذا المصدر بفتح جلسة لعب حي.', en: 'This origin is not allowed to open a live session.' },
  wrong_ticket_purpose: { ar: 'هذه القناة لا تقبل نوع الاتصال المطلوب.', en: 'This channel does not accept that connection type.' },
  wrong_ticket_target: { ar: 'هذا الاتصال لا يطابق الوجهة المطلوبة.', en: 'This connection does not match the requested destination.' },
  wrong_room: { ar: 'هذا الاتصال لا ينتمي إلى هذه الغرفة.', en: 'This connection does not belong to this room.' },
  wrong_channel: { ar: 'هذا الاتصال لا ينتمي إلى هذه القناة.', en: 'This connection does not belong to this channel.' },
  room_membership_required: { ar: 'لم تعد عضويتك في هذه الغرفة متاحة.', en: 'Your membership in this room is no longer available.' },
  route_not_found: { ar: 'مسار اللعب الحي غير متاح.', en: 'That live-play route is unavailable.' },
  ticket_reused: { ar: 'انتهت صلاحية بطاقة الاتصال. نعيد إصدار بطاقة آمنة.', en: 'That connection ticket has expired. A safe replacement is being issued.' },
  ticket_required: { ar: 'تحتاج هذه الغرفة إلى بطاقة اتصال صالحة.', en: 'This room needs a valid connection ticket.' },
  invalid_ticket: { ar: 'بطاقة الاتصال غير صالحة أو انتهت.', en: 'The connection ticket is invalid or expired.' },
  realtime_unavailable: { ar: 'خدمة اللعب الحي غير متاحة مؤقتًا. حاول لاحقًا.', en: 'Live play is temporarily unavailable. Try again shortly.' },
  session_missing: { ar: 'انتهت جلسة الغرفة. أعد الاتصال.', en: 'The room session ended. Reconnect to continue.' },
  room_full: { ar: 'امتلأت هذه الغرفة قبل اكتمال اتصالك.', en: 'This room filled before your connection completed.' },
  room_contract_mismatch: { ar: 'عقد هذه الغرفة لا يطابق الجلسة المطلوبة.', en: 'This room contract does not match the requested session.' },
  room_unavailable: { ar: 'القضية الحية غير متاحة الآن.', en: 'The live case is unavailable right now.' },
  waiting_for_opponent: { ar: 'ننتظر اتصال الخصم قبل بدء الرقعة.', en: 'Waiting for the opponent before the board begins.' },
  match_finished: { ar: 'انتهت هذه المباراة بالفعل.', en: 'This match is already complete.' },
  case_not_active: { ar: 'هذه القضية ليست نشطة حاليًا.', en: 'This case is not active right now.' },
  version_conflict: { ar: 'تغيّرت الغرفة. وصلت أحدث حالة موثقة.', en: 'The room changed. The latest verified state has arrived.' },
  not_a_player: { ar: 'هذا القرار متاح للاعب داخل الغرفة فقط.', en: 'Only a seated player can make that decision.' },
  not_your_turn: { ar: 'انتظر دور الإشارة الأخرى.', en: 'Wait for the other signal’s turn.' },
  invalid_move: { ar: 'هذه النقلة غير صالحة.', en: 'That move is invalid.' },
  illegal_move: { ar: 'هذه النقلة غير قانونية في الحالة الحالية.', en: 'That move is not legal in the current position.' },
  invalid_answer: { ar: 'هذا الخيار غير متاح في هذه المرحلة.', en: 'That option is not available in this stage.' },
  stage_attempts_exhausted: { ar: 'تحتاج المرحلة إلى تلميح Echo أو إعادة بدء يصوّت عليها الفريق.', en: 'This stage needs an Echo hint or a team-voted restart.' },
  hints_exhausted: { ar: 'عرض Echo كل الاستبعادات الآمنة لهذه المرحلة.', en: 'Echo has shared every safe exclusion for this stage.' },
  invalid_preset: { ar: 'هذه العبارة الجاهزة غير متاحة.', en: 'That preset phrase is unavailable.' },
  preset_only: { ar: 'تقبل القناة عبارات Echo الجاهزة فقط.', en: 'This channel accepts Echo preset phrases only.' },
  message_too_large: { ar: 'أمر الغرفة كبير جدًا لإرساله بأمان.', en: 'That room command is too large to send safely.' },
  invalid_message: { ar: 'تعذر قراءة أمر الغرفة.', en: 'The room command could not be read.' },
  invalid_room: { ar: 'معرّف الغرفة غير صالح.', en: 'The room identifier is invalid.' },
  invalid_command: { ar: 'تعذر تنفيذ أمر القضية.', en: 'The case command could not be applied.' },
  unsupported_command: { ar: 'هذا الأمر غير متاح في هذه الغرفة.', en: 'That command is unavailable in this room.' },
  message_rate_limited: { ar: 'تمهل لحظة قبل إرسال عبارة أخرى.', en: 'Wait a moment before sending another phrase.' },
  party_launching: { ar: 'يجري تأمين جلسة الفريق الآن.', en: 'The party session is being secured.' },
  party_launched: { ar: 'الفريق داخل جلسة موثقة بالفعل.', en: 'This party is already inside a verified session.' },
  party_launch_missing: { ar: 'تعذر تأمين الجلسة الخاصة. أعد المحاولة.', en: 'The private session could not be secured. Try again.' },
  party_blocked: { ar: 'لا يمكن دخول هذا الفريق بسبب إعدادات الحظر.', en: 'You cannot join this party because of block settings.' },
  party_full: { ar: 'اكتمل عدد أعضاء هذا الفريق.', en: 'This party already has its full roster.' },
  party_leader_required: { ar: 'قائد الفريق فقط يستطيع إطلاق الجلسة.', en: 'Only the party leader can launch the session.' },
  party_size_invalid: { ar: 'يتطلب الإطلاق الخاص من لاعبين إلى أربعة.', en: 'A private launch needs two to four players.' },
  party_not_ready: { ar: 'يجب أن يكون كل أعضاء الفريق متصلين وجاهزين.', en: 'Every party member must be connected and ready.' },
  active_match_in_progress: { ar: 'لديك مباراة نشطة محفوظة. افتحها أو استعد اتصالها قبل بدء مباراة جديدة.', en: 'You already have a saved active match. Open or recover it before starting another one.' },
  chess_party_size: { ar: 'يتطلب الشطرنج الخاص لاعبين بالضبط.', en: 'Private chess needs exactly two players.' },
  invalid_coop_case: { ar: 'اختر قضية تعاونية مراجعة.', en: 'Choose a reviewed cooperative case.' },
  case_not_reviewed: { ar: 'هذه القضية غير جاهزة للعب الموثق.', en: 'This case is not ready for verified play.' },
  invalid_chess_variant: { ar: 'هذا تنويع الشطرنج غير متاح في هذه الجلسة.', en: 'That Chess variant is unavailable in this session.' },
  invalid_party_mode: { ar: 'هذا النشاط الخاص غير متاح.', en: 'This private activity is unavailable.' },
  invalid_ticket_request: { ar: 'طلب الاتصال غير صالح. أعد فتح الجلسة من الواجهة.', en: 'The connection request is invalid. Reopen the session from the game.' },
  ticket_request_too_large: { ar: 'طلب الاتصال كبير جدًا.', en: 'The connection request is too large.' },
  invalid_ticket_target: { ar: 'هذه المطابقة لا تقبل وجهة الاتصال المطلوبة.', en: 'Matchmaking does not accept that connection target.' },
  invalid_party: { ar: 'رمز الفريق الخاص غير صالح.', en: 'That private party code is invalid.' },
  invalid_channel: { ar: 'قناة المجتمع المطلوبة غير متاحة.', en: 'The requested community channel is unavailable.' },
  invalid_case: { ar: 'القضية التعاونية المختارة غير متاحة.', en: 'The selected cooperative case is unavailable.' },
  invalid_variant: { ar: 'هذا تنويع الشطرنج غير متاح لهذا النمط.', en: 'That Chess variant is unavailable for this mode.' },
  community_rules_required: { ar: 'اقبل قواعد المجتمع أولًا لفتح هذه القناة.', en: 'Accept the community rules first to open this channel.' },
  ranked_locked: { ar: 'أكمل تدريب الشطرنج وثلاث مباريات عادية أولًا.', en: 'Complete Chess training and three Casual matches first.' },
  realtime_not_configured: { ar: 'اللعب الحي غير مربوط بهذه النسخة بعد.', en: 'Live play is not connected for this build yet.' },
  invalid_response: { ar: 'وصل رد غير صالح من خدمة اللعب الحي. حاول مجددًا.', en: 'Live play returned an invalid response. Try again.' },
  network_request_failed: { ar: 'تعذر الوصول إلى خدمة اللعب الحي. حاول مجددًا.', en: 'Could not reach the live-play service. Try again.' },
};

export function realtimeErrorMessage(code: unknown, locale: NetworkLocale): string {
  if (typeof code === 'string') {
    const known = REALTIME_SERVER_ERROR_COPY[code];
    if (known) return known[locale];
  }
  return REALTIME_COPY[locale].rejected;
}

function isMembershipDenied(error: unknown): error is EchoNetworkApiError {
  return error instanceof EchoNetworkApiError && error.code === 'room_membership_required';
}

function friendlyError(error: unknown, locale: NetworkLocale): string {
  const copy = REALTIME_COPY[locale];
  if (error instanceof EchoNetworkApiError) {
    if (error.code === 'ranked_locked') return copy.rankedLocked;
    if (error.code === 'realtime_not_configured') return copy.notConfigured;
    if (error.code === 'room_membership_required') return copy.roomRecoveryUnavailable;
    return realtimeErrorMessage(error.code, locale);
  }
  return error instanceof Error ? copy.requestFailed : copy.disconnected;
}

function websocketUrl(base: string, path: string): string {
  const value = new URL(base);
  value.pathname = path;
  value.search = '';
  value.hash = '';
  return value.toString();
}

function snapshotVersion(snapshot: Record<string, unknown> | null): number {
  const state = snapshot?.state;
  return typeof state === 'object' && state !== null
    && typeof (state as { version?: unknown }).version === 'number'
    ? (state as { version: number }).version
    : 0;
}

function receiptFromPayload(payload: Record<string, unknown>): MatchReceipt | null {
  const parsed = matchReceiptSchema.safeParse(payload.receipt);
  return parsed.success ? parsed.data : null;
}

function snapshotIsCompleted(snapshot: Record<string, unknown>): boolean {
  return ['completed', 'white-won', 'black-won', 'draw'].includes(String(snapshot.status));
}

function matchPathFor(mode: OnlineMode, matchId: string): string {
  const safeMatchId = encodeURIComponent(matchId);
  return mode === 'coop_breach'
    ? `/v1/rooms/coop/${safeMatchId}`
    : `/v1/rooms/chess/${safeMatchId}`;
}

export function useRealtimeRoom({ resumeMatch = false, locale = 'ar' }: UseRealtimeRoomOptions = {}): RealtimeRoomController {
  const [state, setState] = useState<RealtimeRoomState>(INITIAL_STATE);
  const stateRef = useRef(state);
  const socketRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false);
  const connectionIntentRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastSocketBaseRef = useRef<string | null>(null);
  const resumeAttemptedRef = useRef(false);
  const resumePendingRef = useRef(false);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSnapshotTimer = useCallback(() => {
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = null;
  }, []);

  const isConnectionIntentCurrent = useCallback((intent: number) => (
    isCurrentRealtimeConnectionIntent(
      intent,
      connectionIntentRef.current,
      manualCloseRef.current,
    )
  ), []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const closeSocket = useCallback((manual = true) => {
    // Every explicit close also invalidates an in-flight ticket exchange.
    // A later intent receives a fresh epoch after this call.
    connectionIntentRef.current += 1;
    manualCloseRef.current = manual;
    clearSnapshotTimer();
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Player left.');
  }, [clearSnapshotTimer]);

  const openRoomSocketRef = useRef<(
    url: string,
    protocol: string,
    ticket: string,
    mode: OnlineMode,
    roomId: string,
    intent: number,
  ) => void>(() => undefined);

  const reconnect = useCallback(async () => {
    const current = stateRef.current;
    const intent = connectionIntentRef.current;
    if (manualCloseRef.current || !current.roomId || !current.mode || !current.target) return;
    if (reconnectAttemptsRef.current >= 5) {
      const failed: RealtimeRoomState = {
        ...current,
        phase: 'error',
        error: REALTIME_COPY[locale].reconnectTimedOut,
      };
      stateRef.current = failed;
      setState(failed);
      return;
    }
    reconnectAttemptsRef.current += 1;
    const reconnecting: RealtimeRoomState = { ...current, phase: 'reconnecting', error: null };
    stateRef.current = reconnecting;
    setState(reconnecting);
    try {
      const response = await issueNetworkTicket({
        purpose: 'connect',
        target: current.target,
        mode: current.mode,
        roomId: current.roomId,
      });
      if (!isConnectionIntentCurrent(intent)
        || stateRef.current.target !== current.target
        || stateRef.current.mode !== current.mode
        || stateRef.current.roomId !== current.roomId) return;
      openRoomSocketRef.current(
        response.webSocketUrl,
        response.protocol,
        response.ticket,
        current.mode,
        current.roomId,
        intent,
      );
    } catch (error) {
      if (!isConnectionIntentCurrent(intent)
        || stateRef.current.target !== current.target
        || stateRef.current.mode !== current.mode
        || stateRef.current.roomId !== current.roomId) return;
      if (isMembershipDenied(error) && current.target === 'match') {
        writePersistedMatchSession(null);
        const unavailable: RealtimeRoomState = {
          ...INITIAL_STATE,
          phase: 'error',
          error: REALTIME_COPY[locale].roomRecoveryUnavailable,
        };
        stateRef.current = unavailable;
        setState(unavailable);
        return;
      }
      reconnectTimerRef.current = setTimeout(() => {
        void reconnect();
      }, Math.min(5_000, 500 * 2 ** reconnectAttemptsRef.current));
      const failed: RealtimeRoomState = { ...stateRef.current, error: friendlyError(error, locale) };
      stateRef.current = failed;
      setState(failed);
    }
  }, [isConnectionIntentCurrent, locale]);

  const handleEnvelope = useCallback((envelope: RealtimeEnvelope) => {
    if (envelope.type === 'match-found') {
      const matchId = typeof envelope.payload.matchId === 'string'
        ? envelope.payload.matchId
        : null;
      const ticket = typeof envelope.payload.ticket === 'string'
        ? envelope.payload.ticket
        : null;
      const path = typeof envelope.payload.path === 'string'
        ? envelope.payload.path
        : null;
      const mode = onlineModeSchema.safeParse(envelope.payload.mode);
      const base = lastSocketBaseRef.current;
      if (!matchId || !ticket || !path || !mode.success || !base
        || ticket.length > 4_096 || path !== matchPathFor(mode.data, matchId)) {
        setState((previous) => ({ ...previous, phase: 'error', error: REALTIME_COPY[locale].incompleteMatch }));
        return;
      }
      const oldQueue = socketRef.current;
      socketRef.current = null;
      oldQueue?.close(1000, 'Match accepted.');
      const intent = connectionIntentRef.current;
      const handoffState: RealtimeRoomState = {
        ...stateRef.current,
        phase: 'connecting',
        roomId: matchId,
        mode: mode.data,
        target: 'match',
        snapshot: null,
        receipt: null,
        error: null,
        queueStartedAt: null,
      };
      // A match snapshot can arrive immediately after the new socket opens.
      // Keep validation aligned with the handoff before React commits a frame.
      stateRef.current = handoffState;
      setState(handoffState);
      openRoomSocketRef.current(
        websocketUrl(base, matchPathFor(mode.data, matchId)),
        'echo-network-v1',
        ticket,
        mode.data,
        matchId,
        intent,
      );
      return;
    }
    // Any parsed room response proves that the channel is alive; only a
    // genuinely silent connection should trip the awaiting-snapshot recovery.
    clearSnapshotTimer();
    const terminalSnapshotEnvelope = envelope.type === 'match-completed'
      || envelope.type === 'case-completed'
      || snapshotIsCompleted(envelope.payload);
    if ([
      'room-snapshot', 'presence-changed', 'move-applied', 'stage-completed',
      'case-completed', 'answer-rejected', 'hint-approved', 'case-restarted',
      'echo-takeover', 'party-changed', 'channel-joined', 'channel-presence',
    ].includes(envelope.type) && !terminalSnapshotEnvelope) {
      reconnectAttemptsRef.current = 0;
    }
    if (envelope.type === 'reward-pending') {
      const receipt = receiptFromPayload(envelope.payload);
      if (!receipt || (stateRef.current.roomId && receipt.matchId !== stateRef.current.roomId)) {
        setState((previous) => ({
          ...previous,
          error: REALTIME_COPY[locale].invalidReceipt,
        }));
        return;
      }
      const completed: RealtimeRoomState = {
        ...stateRef.current,
        // `reward-pending` means the authoritative room safely retained the
        // receipt and handed it to its outbox. It does *not* prove that D1 has
        // committed progression yet, so the player remains in a truthful
        // settlement state and we never present the raw XP as granted.
        phase: 'settling',
        receipt,
        settlement: 'pending-server-finalization',
        error: null,
      };
      // A durable room receipt is the only terminal state that clears the
      // reload locator. A completed snapshot without its receipt can still be
      // restored while the durable outbox retries.
      if (completed.target === 'match') writePersistedMatchSession(null);
      stateRef.current = completed;
      setState(completed);
      return;
    }
    if (envelope.type === 'error') {
      const failed: RealtimeRoomState = {
        ...stateRef.current,
        error: realtimeErrorMessage(envelope.payload.code, locale),
      };
      stateRef.current = failed;
      setState(failed);
      return;
    }
    if ([
      'room-snapshot', 'command-replayed', 'presence-changed', 'move-applied',
      'match-completed', 'stage-completed', 'case-completed', 'answer-rejected',
      'hint-approved', 'case-restarted', 'echo-takeover',
      'party-changed',
    ].includes(envelope.type)) {
      setState((previous) => {
        const events = envelope.type === 'answer-rejected'
          ? [...previous.events.slice(-19), envelope]
          : ['room-snapshot', 'stage-completed', 'case-completed', 'case-restarted'].includes(envelope.type)
            ? previous.events.filter((event) => event.type !== 'answer-rejected')
            : previous.events;
        const terminalSnapshot = terminalSnapshotEnvelope;
        const next: RealtimeRoomState = {
          ...previous,
          // A terminal snapshot is not a receipt. Keep a distinct state so a
          // close between these two messages is recoverable instead of looking
          // like a completed reward to the player.
          phase: terminalSnapshot ? 'settling' : 'active',
          settlement: terminalSnapshot
            ? previous.receipt
              ? 'pending-server-finalization'
              : 'awaiting-receipt'
            : 'none',
          snapshot: envelope.payload,
          error: null,
          events,
        };
        stateRef.current = next;
        return next;
      });
      return;
    }
    if (envelope.type === 'channel-joined' || envelope.type === 'channel-presence') {
      setState((previous) => ({
        ...previous,
        phase: 'active',
        snapshot: { ...(previous.snapshot ?? {}), ...envelope.payload },
        error: null,
      }));
      return;
    }
    if (envelope.type === 'preset-chat' || envelope.type === 'vote-updated') {
      setState((previous) => ({
        ...previous,
        events: [...previous.events.slice(-19), envelope],
      }));
    }
  }, [clearSnapshotTimer, locale]);

  const openRoomSocket = useCallback((
    url: string,
    protocol: string,
    ticket: string,
    mode: OnlineMode,
    roomId: string,
    intent: number,
  ) => {
    if (!isConnectionIntentCurrent(intent)) return;
    manualCloseRef.current = false;
    clearSnapshotTimer();
    lastSocketBaseRef.current = url;
    const socket = new WebSocket(url, [protocol, ticket]);
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
      const awaitingSnapshot: RealtimeRoomState = {
        ...stateRef.current,
        phase: 'awaiting-snapshot',
        mode,
        roomId,
        error: null,
      };
      stateRef.current = awaitingSnapshot;
      setState(awaitingSnapshot);
      snapshotTimerRef.current = setTimeout(() => {
        if (socketRef.current !== socket || stateRef.current.phase !== 'awaiting-snapshot') return;
        const timedOut: RealtimeRoomState = {
          ...stateRef.current,
          phase: 'error',
          error: REALTIME_COPY[locale].snapshotTimedOut,
        };
        stateRef.current = timedOut;
        setState(timedOut);
        socket.close(4000, 'Authoritative snapshot timed out.');
      }, 8_000);
    };
    socket.onmessage = (event) => {
      if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const envelope = realtimeEnvelopeSchema.safeParse(parsed);
      if (envelope.success) handleEnvelope(envelope.data);
    };
    socket.onerror = () => {
      if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
      const failed: RealtimeRoomState = {
        ...stateRef.current,
        error: REALTIME_COPY[locale].channelFailed,
      };
      stateRef.current = failed;
      setState(failed);
    };
    socket.onclose = () => {
      if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
      clearSnapshotTimer();
      socketRef.current = null;
      // Once the durable room receipt has arrived, its outbox owns further
      // reconciliation. Reopening the socket cannot grant anything and only
      // creates noisy duplicate delivery. Before it arrives, reconnect so a
      // terminal snapshot cannot strand the player without an explanation.
      if (!manualCloseRef.current
        && stateRef.current.phase !== 'completed'
        && stateRef.current.settlement !== 'pending-server-finalization') {
        reconnectTimerRef.current = setTimeout(() => void reconnect(), 400);
      }
    };
  }, [clearSnapshotTimer, handleEnvelope, isConnectionIntentCurrent, locale, reconnect]);
  openRoomSocketRef.current = openRoomSocket;

  useEffect(() => {
    if (!resumeMatch || resumeAttemptedRef.current) return undefined;
    resumeAttemptedRef.current = true;
    const persisted = readPersistedMatchSession();
    if (!persisted) return undefined;

    resumePendingRef.current = true;
    manualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    const intent = connectionIntentRef.current;
    const restoringState: RealtimeRoomState = {
      ...INITIAL_STATE,
      phase: 'connecting',
      mode: persisted.mode,
      target: 'match',
      roomId: persisted.roomId,
    };
    stateRef.current = restoringState;
    setState(restoringState);

    let cancelled = false;
    void (async () => {
      try {
        const response = await issueNetworkTicket({
          purpose: 'connect',
          target: 'match',
          mode: persisted.mode,
          roomId: persisted.roomId,
        });
        if (cancelled
          || !isConnectionIntentCurrent(intent)
          || stateRef.current.target !== 'match'
          || stateRef.current.mode !== persisted.mode
          || stateRef.current.roomId !== persisted.roomId) return;
        openRoomSocketRef.current(
          response.webSocketUrl,
          response.protocol,
          response.ticket,
          persisted.mode,
          persisted.roomId,
          intent,
        );
      } catch (error) {
        if (cancelled || !isConnectionIntentCurrent(intent)) return;
        const membershipDenied = isMembershipDenied(error);
        if (membershipDenied) writePersistedMatchSession(null);
        const failedState: RealtimeRoomState = membershipDenied
          ? {
            ...INITIAL_STATE,
            phase: 'error',
            error: REALTIME_COPY[locale].roomRecoveryUnavailable,
          }
          : {
            ...restoringState,
            phase: 'error',
            error: friendlyError(error, locale),
          };
        stateRef.current = failedState;
        setState(failedState);
      } finally {
        resumePendingRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [isConnectionIntentCurrent, resumeMatch]);

  useEffect(() => {
    if (!resumeMatch) return;
    // The restore effect reads first. Do not erase its locator during the
    // initial idle render before its async ticket exchange starts.
    if (resumePendingRef.current && state.phase === 'idle') return;
    const shouldPersist = shouldPersistMatchSession(state);
    writePersistedMatchSession(shouldPersist
      ? { version: 1, target: 'match', mode: state.mode!, roomId: state.roomId! }
      : null);
  }, [resumeMatch, state.mode, state.phase, state.receipt, state.roomId, state.settlement, state.target]);

  const joinQueue = useCallback(async (input: {
    mode: OnlineMode;
    caseId?: string;
    variant?: ChessVariant;
  }) => {
    closeSocket();
    const intent = connectionIntentRef.current;
    manualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    const queueing: RealtimeRoomState = {
      ...INITIAL_STATE,
      phase: 'queueing',
      mode: input.mode,
      target: 'match',
      queueStartedAt: Date.now(),
    };
    stateRef.current = queueing;
    setState(queueing);
    try {
      const response = await issueNetworkTicket({
        purpose: 'queue',
        mode: input.mode,
        ...(input.caseId ? { caseId: input.caseId } : {}),
        ...(input.variant ? { variant: input.variant } : {}),
      });
      if (!isConnectionIntentCurrent(intent)
        || stateRef.current.phase !== 'queueing'
        || stateRef.current.target !== 'match'
        || stateRef.current.mode !== input.mode) return;
      lastSocketBaseRef.current = response.webSocketUrl;
      const socket = new WebSocket(response.webSocketUrl, [response.protocol, response.ticket]);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(event.data));
        } catch {
          return;
        }
        const envelope = realtimeEnvelopeSchema.safeParse(parsed);
        if (envelope.success) handleEnvelope(envelope.data);
      };
      socket.onerror = () => {
        if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
        setState((previous) => ({ ...previous, phase: 'error', error: REALTIME_COPY[locale].matchmakingFailed }));
      };
      socket.onclose = (event) => {
        if (socketRef.current !== socket || !isConnectionIntentCurrent(intent)) return;
        socketRef.current = null;
        if (!manualCloseRef.current && event.code !== 1000) {
          setState((previous) => ({ ...previous, phase: 'error', error: REALTIME_COPY[locale].matchmakingClosed }));
        }
      };
    } catch (error) {
      if (!isConnectionIntentCurrent(intent)) return;
      setState((previous) => ({ ...previous, phase: 'error', error: friendlyError(error, locale) }));
    }
  }, [closeSocket, handleEnvelope, isConnectionIntentCurrent, locale]);

  const joinDirect = useCallback(async (input: {
    target: 'party' | 'community';
    roomId: string;
    mode?: OnlineMode;
  }) => {
    closeSocket();
    const intent = connectionIntentRef.current;
    manualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    const mode = input.mode ?? 'coop_breach';
    const roomId = input.target === 'party'
      ? normalizePartyRoomId(input.roomId)
      : input.roomId.trim();
    if (!roomId) {
      const invalidParty: RealtimeRoomState = {
        ...INITIAL_STATE,
        phase: 'error',
        mode,
        target: input.target,
        error: REALTIME_COPY[locale].invalidParty,
      };
      stateRef.current = invalidParty;
      setState(invalidParty);
      return;
    }
    const connecting: RealtimeRoomState = {
      ...INITIAL_STATE,
      phase: 'connecting',
      mode,
      target: input.target,
      roomId,
    };
    stateRef.current = connecting;
    setState(connecting);
    try {
      const response = await issueNetworkTicket({
        purpose: 'connect',
        target: input.target,
        mode,
        roomId,
      });
      if (!isConnectionIntentCurrent(intent)
        || stateRef.current.target !== input.target
        || stateRef.current.mode !== mode
        || stateRef.current.roomId !== roomId) return;
      openRoomSocketRef.current(
        response.webSocketUrl,
        response.protocol,
        response.ticket,
        mode,
        roomId,
        intent,
      );
    } catch (error) {
      if (!isConnectionIntentCurrent(intent)) return;
      setState((previous) => ({ ...previous, phase: 'error', error: friendlyError(error, locale) }));
    }
  }, [closeSocket, isConnectionIntentCurrent, locale]);

  const retryExistingMatch = useCallback(async (): Promise<void> => {
    const current = stateRef.current;
    if (!isRecoverableMatchState(current)) return;

    closeSocket();
    const intent = connectionIntentRef.current;
    manualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    const retrying: RealtimeRoomState = {
      ...current,
      phase: 'connecting',
      snapshot: null,
      error: null,
    };
    stateRef.current = retrying;
    setState(retrying);
    try {
      const response = await issueNetworkTicket({
        purpose: 'connect',
        target: 'match',
        mode: current.mode,
        roomId: current.roomId,
      });
      if (!isConnectionIntentCurrent(intent)
        || stateRef.current.target !== 'match'
        || stateRef.current.mode !== current.mode
        || stateRef.current.roomId !== current.roomId) return;
      openRoomSocketRef.current(
        response.webSocketUrl,
        response.protocol,
        response.ticket,
        current.mode,
        current.roomId,
        intent,
      );
    } catch (error) {
      if (!isConnectionIntentCurrent(intent)
        || stateRef.current.target !== 'match'
        || stateRef.current.mode !== current.mode
        || stateRef.current.roomId !== current.roomId) return;
      if (isMembershipDenied(error)) {
        writePersistedMatchSession(null);
        const unavailable: RealtimeRoomState = {
          ...INITIAL_STATE,
          phase: 'error',
          error: REALTIME_COPY[locale].roomRecoveryUnavailable,
        };
        stateRef.current = unavailable;
        setState(unavailable);
        return;
      }
      const failed: RealtimeRoomState = {
        ...retrying,
        phase: 'error',
        error: friendlyError(error, locale),
      };
      stateRef.current = failed;
      setState(failed);
    }
  }, [closeSocket, isConnectionIntentCurrent, locale]);

  const sendCommand = useCallback((
    type: RoomCommand['type'],
    payload: Record<string, unknown> = {},
  ): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    const command: RoomCommand = {
      version: 1,
      eventId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: snapshotVersion(stateRef.current.snapshot),
      type,
      sentAt: Date.now(),
      payload,
    };
    socket.send(JSON.stringify(command));
    return true;
  }, []);

  const leave = useCallback(() => {
    const leaveCommand = leaveCommandForState(stateRef.current);
    if (leaveCommand) sendCommand(leaveCommand);
    closeSocket();
    writePersistedMatchSession(null);
    stateRef.current = INITIAL_STATE;
    setState(INITIAL_STATE);
  }, [closeSocket, sendCommand]);

  useEffect(() => () => closeSocket(), [closeSocket]);

  return { state, joinQueue, joinDirect, sendCommand, retryExistingMatch, leave };
}
