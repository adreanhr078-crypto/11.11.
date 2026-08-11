import { useCallback, useEffect, useRef, useState } from 'react';
import {
  realtimeEnvelopeSchema,
  type MatchReceipt,
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

export type RealtimeRoomPhase =
  | 'idle'
  | 'queueing'
  | 'connecting'
  | 'active'
  | 'reconnecting'
  | 'completed'
  | 'error';

export interface RealtimeRoomState {
  phase: RealtimeRoomPhase;
  mode: OnlineMode | null;
  target: RealtimeTicketRequest['target'] | null;
  roomId: string | null;
  snapshot: Record<string, unknown> | null;
  receipt: MatchReceipt | null;
  error: string | null;
  queueStartedAt: number | null;
  events: RealtimeEnvelope[];
}

const INITIAL_STATE: RealtimeRoomState = {
  phase: 'idle',
  mode: null,
  target: null,
  roomId: null,
  snapshot: null,
  receipt: null,
  error: null,
  queueStartedAt: null,
  events: [],
};

function friendlyError(error: unknown): string {
  if (error instanceof EchoNetworkApiError) {
    if (error.code === 'ranked_locked') {
      return 'أكمل تدريب الشطرنج وثلاث مباريات Casual أولًا.';
    }
    if (error.code === 'realtime_not_configured') {
      return 'خادم اللعب الحي غير مربوط بهذه النسخة بعد. التدريب المحلي متاح.';
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'انقطع اتصال Echo Network.';
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

export function useRealtimeRoom() {
  const [state, setState] = useState<RealtimeRoomState>(INITIAL_STATE);
  const stateRef = useRef(state);
  const socketRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastSocketBaseRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const closeSocket = useCallback((manual = true) => {
    manualCloseRef.current = manual;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Player left.');
  }, []);

  const openRoomSocketRef = useRef<(
    url: string,
    protocol: string,
    ticket: string,
    mode: OnlineMode,
    roomId: string,
  ) => void>(() => undefined);

  const reconnect = useCallback(async () => {
    const current = stateRef.current;
    if (manualCloseRef.current || !current.roomId || !current.mode || !current.target) return;
    if (reconnectAttemptsRef.current >= 5) {
      setState((previous) => ({
        ...previous,
        phase: 'error',
        error: 'انتهت مهلة إعادة الاتصال بالغرفة.',
      }));
      return;
    }
    reconnectAttemptsRef.current += 1;
    setState((previous) => ({ ...previous, phase: 'reconnecting', error: null }));
    try {
      const response = await issueNetworkTicket({
        purpose: 'connect',
        target: current.target,
        mode: current.mode,
        roomId: current.roomId,
      });
      openRoomSocketRef.current(
        response.webSocketUrl,
        response.protocol,
        response.ticket,
        current.mode,
        current.roomId,
      );
    } catch (error) {
      reconnectTimerRef.current = setTimeout(() => {
        void reconnect();
      }, Math.min(5_000, 500 * 2 ** reconnectAttemptsRef.current));
      setState((previous) => ({ ...previous, error: friendlyError(error) }));
    }
  }, []);

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
      const mode = typeof envelope.payload.mode === 'string'
        ? envelope.payload.mode as OnlineMode
        : stateRef.current.mode;
      const base = lastSocketBaseRef.current;
      if (!matchId || !ticket || !path || !mode || !base) {
        setState((previous) => ({ ...previous, phase: 'error', error: 'وصل عقد مباراة غير مكتمل.' }));
        return;
      }
      const oldQueue = socketRef.current;
      socketRef.current = null;
      oldQueue?.close(1000, 'Match accepted.');
      setState((previous) => ({
        ...previous,
        phase: 'connecting',
        roomId: matchId,
        mode,
      }));
      openRoomSocketRef.current(
        websocketUrl(base, path),
        'echo-network-v1',
        ticket,
        mode,
        matchId,
      );
      return;
    }
    if (envelope.type === 'reward-pending') {
      const receipt = envelope.payload.receipt as MatchReceipt | undefined;
      setState((previous) => ({
        ...previous,
        phase: 'completed',
        receipt: receipt ?? previous.receipt,
      }));
      return;
    }
    if (envelope.type === 'error') {
      setState((previous) => ({
        ...previous,
        error: typeof envelope.payload.message === 'string'
          ? envelope.payload.message
          : 'رفض الخادم الأمر.',
      }));
      return;
    }
    if ([
      'room-snapshot', 'command-replayed', 'presence-changed', 'move-applied',
      'match-completed', 'stage-completed', 'case-completed', 'answer-rejected',
      'hint-approved', 'case-restarted', 'echo-takeover',
      'party-changed',
    ].includes(envelope.type)) {
      setState((previous) => ({
        ...previous,
        phase: envelope.type === 'match-completed' || envelope.type === 'case-completed'
          ? 'completed'
          : 'active',
        snapshot: envelope.payload,
        error: null,
      }));
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
  }, []);

  const openRoomSocket = useCallback((
    url: string,
    protocol: string,
    ticket: string,
    mode: OnlineMode,
    roomId: string,
  ) => {
    manualCloseRef.current = false;
    lastSocketBaseRef.current = url;
    const socket = new WebSocket(url, [protocol, ticket]);
    socketRef.current = socket;
    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setState((previous) => ({ ...previous, phase: 'active', mode, roomId, error: null }));
    };
    socket.onmessage = (event) => {
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
      setState((previous) => ({ ...previous, error: 'تعذر تثبيت قناة الغرفة.' }));
    };
    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      if (!manualCloseRef.current && stateRef.current.phase !== 'completed') {
        reconnectTimerRef.current = setTimeout(() => void reconnect(), 400);
      }
    };
  }, [handleEnvelope, reconnect]);
  openRoomSocketRef.current = openRoomSocket;

  const joinQueue = useCallback(async (input: {
    mode: OnlineMode;
    caseId?: string;
    variant?: ChessVariant;
  }) => {
    closeSocket();
    manualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    setState({
      ...INITIAL_STATE,
      phase: 'queueing',
      mode: input.mode,
      target: 'match',
      queueStartedAt: Date.now(),
    });
    try {
      const response = await issueNetworkTicket({
        purpose: 'queue',
        mode: input.mode,
        ...(input.caseId ? { caseId: input.caseId } : {}),
        ...(input.variant ? { variant: input.variant } : {}),
      });
      lastSocketBaseRef.current = response.webSocketUrl;
      const socket = new WebSocket(response.webSocketUrl, [response.protocol, response.ticket]);
      socketRef.current = socket;
      socket.onmessage = (event) => {
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
        setState((previous) => ({ ...previous, phase: 'error', error: 'تعذر دخول المطابقة.' }));
      };
      socket.onclose = (event) => {
        if (socketRef.current !== socket) return;
        socketRef.current = null;
        if (!manualCloseRef.current && event.code !== 1000) {
          setState((previous) => ({ ...previous, phase: 'error', error: 'أُغلقت قناة المطابقة.' }));
        }
      };
    } catch (error) {
      setState((previous) => ({ ...previous, phase: 'error', error: friendlyError(error) }));
    }
  }, [closeSocket, handleEnvelope]);

  const joinDirect = useCallback(async (input: {
    target: 'party' | 'community';
    roomId: string;
    mode?: OnlineMode;
  }) => {
    closeSocket();
    manualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    const mode = input.mode ?? 'coop_breach';
    setState({
      ...INITIAL_STATE,
      phase: 'connecting',
      mode,
      target: input.target,
      roomId: input.roomId,
    });
    try {
      const response = await issueNetworkTicket({
        purpose: 'connect',
        target: input.target,
        mode,
        roomId: input.roomId,
      });
      openRoomSocketRef.current(
        response.webSocketUrl,
        response.protocol,
        response.ticket,
        mode,
        input.roomId,
      );
    } catch (error) {
      setState((previous) => ({ ...previous, phase: 'error', error: friendlyError(error) }));
    }
  }, [closeSocket]);

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
    if (stateRef.current.phase === 'active' && stateRef.current.target !== 'community') {
      sendCommand('resign');
    }
    closeSocket();
    setState(INITIAL_STATE);
  }, [closeSocket, sendCommand]);

  useEffect(() => () => closeSocket(), [closeSocket]);

  return { state, joinQueue, joinDirect, sendCommand, leave };
}
