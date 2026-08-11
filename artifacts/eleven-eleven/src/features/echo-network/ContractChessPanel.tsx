import { useEffect, useMemo, useState } from 'react';
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import {
  applyContractChessMove,
  createContractChessState,
  effectiveClock,
  legalDestinations,
  type ContractChessState,
} from '../../domain/echo-network/chessRules';
import type { OnlineMode } from '../../domain/echo-network/contracts';
import type { NetworkEligibilitySnapshot } from '../../infrastructure/echo-network/echoNetworkApi';
import { GameButton, GameProgress, GlassPanel, HudPanel } from '../../ui/design-system';
import { useRealtimeRoom } from './useRealtimeRoom';

const PIECES: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

const PIECE_NAMES: Record<PieceSymbol, { ar: string; en: string }> = {
  k: { ar: 'ملك', en: 'king' },
  q: { ar: 'وزير', en: 'queen' },
  r: { ar: 'قلعة', en: 'rook' },
  b: { ar: 'فيل', en: 'bishop' },
  n: { ar: 'حصان', en: 'knight' },
  p: { ar: 'بيدق', en: 'pawn' },
};

interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: Color;
}

function formatClock(milliseconds: number): string {
  const safe = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function useClockNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function advanceSampledClock(
  clock: { whiteMs?: number; blackMs?: number } | undefined,
  activeColor: Color | null,
  active: boolean,
  sampledAt: number,
  now: number,
) {
  const elapsed = active ? Math.max(0, now - sampledAt) : 0;
  return {
    whiteMs: Math.max(0, (clock?.whiteMs ?? 0) - (activeColor === 'w' ? elapsed : 0)),
    blackMs: Math.max(0, (clock?.blackMs ?? 0) - (activeColor === 'b' ? elapsed : 0)),
  };
}

function piecesFromFen(fen: string | null): BoardPiece[] {
  if (!fen) return [];
  try {
    return new Chess(fen).board().flat().flatMap((piece) => piece ? [{
      square: piece.square,
      type: piece.type,
      color: piece.color,
    }] : []);
  } catch {
    return [];
  }
}

function ContractChessBoard({
  pieces,
  playerColor,
  legalMoves,
  onMove,
  disabled,
}: {
  pieces: readonly BoardPiece[];
  playerColor: Color;
  legalMoves: readonly { from: Square; to: Square }[];
  onMove: (from: Square, to: Square) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<Square | null>(null);
  const pieceMap = useMemo(
    () => new Map(pieces.map((piece) => [piece.square, piece])),
    [pieces],
  );
  const files = playerColor === 'w'
    ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = playerColor === 'w'
    ? ['8', '7', '6', '5', '4', '3', '2', '1']
    : ['1', '2', '3', '4', '5', '6', '7', '8'];
  const destinations = selected
    ? new Set(legalMoves.filter((move) => move.from === selected).map((move) => move.to))
    : new Set<Square>();

  const activate = (square: Square) => {
    if (disabled) return;
    if (selected && destinations.has(square)) {
      onMove(selected, square);
      setSelected(null);
      return;
    }
    const piece = pieceMap.get(square);
    const canMove = piece?.color === playerColor
      && legalMoves.some((move) => move.from === square);
    setSelected(canMove ? square : null);
  };

  return (
    <div className="contract-chess-board" role="grid" aria-label="لوحة شطرنج العقد الأسود والأحمر">
      {ranks.flatMap((rank, rankIndex) => files.map((file, fileIndex) => {
        const square = `${file}${rank}` as Square;
        const piece = pieceMap.get(square);
        const destination = destinations.has(square);
        const dark = (rankIndex + fileIndex) % 2 === 1;
        return (
          <button
            type="button"
            role="gridcell"
            key={square}
            className="contract-chess-square"
            data-dark={dark || undefined}
            data-selected={selected === square || undefined}
            data-destination={destination || undefined}
            data-capture={destination && Boolean(piece) || undefined}
            onClick={() => activate(square)}
            disabled={disabled}
            aria-label={`${square}${piece ? `، ${piece.color === 'w' ? 'أحمر' : 'أسود'} ${PIECE_NAMES[piece.type].ar}` : '، فارغ'}`}
          >
            {piece && (
              <span data-piece-color={piece.color} aria-hidden="true">
                {PIECES[piece.color][piece.type]}
              </span>
            )}
            <i aria-hidden="true" />
            {(fileIndex === 0 || rankIndex === ranks.length - 1) && (
              <small aria-hidden="true">{fileIndex === 0 ? rank : file}</small>
            )}
          </button>
        );
      }))}
    </div>
  );
}

function chooseEchoMove(state: ContractChessState) {
  const chess = new Chess(state.fen);
  const moves = chess.moves({ verbose: true });
  return moves.sort((first, second) => {
    const score = (move: typeof first) => (
      (move.captured ? 30 : 0)
      + (move.san.includes('+') ? 15 : 0)
      + (['d4', 'e4', 'd5', 'e5'].includes(move.to) ? 4 : 0)
      + (move.promotion ? 40 : 0)
    );
    return score(second) - score(first) || first.san.localeCompare(second.san);
  })[0];
}

function LocalChessTraining({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: () => Promise<void>;
}) {
  const [state, setState] = useState(() => createContractChessState('standard', 'rapid'));
  const [playerMoves, setPlayerMoves] = useState(0);
  const [saving, setSaving] = useState(false);
  const chess = useMemo(() => new Chess(state.fen), [state.fen]);
  const playerTurn = chess.turn() === 'w' && state.status === 'active';
  const legalMoves = useMemo(() => (
    playerTurn
      ? chess.moves({ verbose: true }).map((move) => ({ from: move.from, to: move.to }))
      : []
  ), [chess, playerTurn]);

  useEffect(() => {
    if (state.status !== 'active' || new Chess(state.fen).turn() !== 'b') return undefined;
    const timer = setTimeout(() => {
      const move = chooseEchoMove(state);
      if (!move) return;
      setState((current) => applyContractChessMove(current, {
        from: move.from,
        to: move.to,
        promotion: move.promotion === 'r' || move.promotion === 'b' || move.promotion === 'n'
          ? move.promotion
          : 'q',
      }));
    }, 520);
    return () => clearTimeout(timer);
  }, [state]);

  const move = (from: Square, to: Square) => {
    if (!playerTurn) return;
    setState((current) => applyContractChessMove(current, { from, to }));
    setPlayerMoves((value) => value + 1);
  };

  const now = useClockNow(state.status === 'active');
  const clocks = effectiveClock(state, now);
  const trainingReady = playerMoves >= 3;
  return (
    <div className="echo-network-chess-layout">
      <div>
        <div className="contract-chess-clocks" aria-live="off">
          <span data-side="black"><small>Echo · BLACK</small><strong>{formatClock(clocks.blackMs)}</strong></span>
          <span data-side="red"><small>YOU · RED</small><strong>{formatClock(clocks.whiteMs)}</strong></span>
        </div>
        <ContractChessBoard
          pieces={piecesFromFen(state.fen)}
          playerColor="w"
          legalMoves={legalMoves}
          onMove={move}
          disabled={!playerTurn}
        />
      </div>
      <HudPanel tone="danger" eyebrow="SOLO TRAINING · NO SERVER REWARD" title="بروتوكول العقد الأول">
        <p>حرّك القطع الحمراء. سيجيب Echo بالأسود. أكمل ثلاث نقلات قانونية لفهم التحديد، الوجهة، والساعة.</p>
        <GameProgress value={Math.min(100, (playerMoves / 3) * 100)} tone="danger" />
        <ol className="echo-network-checklist">
          <li data-complete={playerMoves >= 1}>اختر قطعة ثم مربعًا مضاءً.</li>
          <li data-complete={playerMoves >= 2}>راقب رد Echo وتبدّل الدور.</li>
          <li data-complete={playerMoves >= 3}>احمِ الملك واقرأ الساعة.</li>
        </ol>
        {state.status !== 'active' && (
          <p className="echo-network-callout">انتهت الجولة: {state.reason}. يمكنك إعادة التدريب دون خسارة.</p>
        )}
        <div className="echo-network-actions">
          <GameButton
            variant="ghost"
            onClick={() => {
              setState(createContractChessState('standard', 'rapid'));
              setPlayerMoves(0);
            }}
          >
            إعادة اللوحة
          </GameButton>
          <GameButton
            variant="danger"
            disabled={!trainingReady || completed || saving}
            onClick={() => {
              setSaving(true);
              void onComplete().finally(() => setSaving(false));
            }}
          >
            {completed ? 'التدريب موثّق' : saving ? 'جارٍ التوثيق…' : 'توثيق التدريب'}
          </GameButton>
        </div>
      </HudPanel>
    </div>
  );
}

function onlineState(snapshot: Record<string, unknown> | null) {
  if (!snapshot) return null;
  const state = snapshot.state && typeof snapshot.state === 'object'
    ? snapshot.state as Record<string, unknown>
    : null;
  const color: Color = snapshot.color === 'b' ? 'b' : 'w';
  const legal = Array.isArray(snapshot.legalMoves)
    ? snapshot.legalMoves.flatMap((value) => {
      if (typeof value !== 'object' || value === null) return [];
      const from = (value as { from?: unknown }).from;
      const to = (value as { to?: unknown }).to;
      return typeof from === 'string' && typeof to === 'string'
        ? [{ from: from as Square, to: to as Square }]
        : [];
    })
    : [];
  const fogPieces = Array.isArray(snapshot.fogPieces)
    ? snapshot.fogPieces as BoardPiece[]
    : [];
  const fen = typeof state?.fen === 'string' ? state.fen : null;
  return {
    state,
    color,
    legal,
    pieces: fen ? piecesFromFen(fen) : fogPieces,
    clock: snapshot.clock as { whiteMs?: number; blackMs?: number } | undefined,
    activeColor: snapshot.activeColor === 'b' ? 'b' as const : snapshot.activeColor === 'w' ? 'w' as const : null,
    status: typeof snapshot.status === 'string' ? snapshot.status : 'waiting',
    players: Array.isArray(snapshot.players) ? snapshot.players : [],
    variant: typeof snapshot.variant === 'string' ? snapshot.variant : 'standard',
  };
}

export function ContractChessPanel({
  eligibility,
  onTrainingComplete,
  onReceipt,
}: {
  eligibility: NetworkEligibilitySnapshot;
  onTrainingComplete: () => Promise<void>;
  onReceipt: () => void;
}) {
  const room = useRealtimeRoom();
  const [view, setView] = useState<'training' | 'online'>('training');
  const snapshot = useMemo(() => onlineState(room.state.snapshot), [room.state.snapshot]);
  const clockSampledAt = useMemo(() => Date.now(), [room.state.snapshot]);
  const clockNow = useClockNow(room.state.phase === 'active');
  const liveClock = advanceSampledClock(
    snapshot?.clock,
    snapshot?.activeColor ?? null,
    room.state.phase === 'active' && snapshot?.status === 'active',
    clockSampledAt,
    clockNow,
  );
  useEffect(() => {
    if (!room.state.receipt) return;
    const timer = setTimeout(onReceipt, 1_200);
    return () => clearTimeout(timer);
  }, [onReceipt, room.state.receipt]);

  const queue = (mode: OnlineMode) => {
    setView('online');
    void room.joinQueue({ mode });
  };

  return (
    <section className="echo-network-mode" aria-labelledby="contract-chess-title">
      <header className="echo-network-mode__heading">
        <span><small>BLACK / RED CONTRACT</small><h2 id="contract-chess-title">شطرنج العقد الأسود والأحمر</h2></span>
        <div className="echo-network-segmented">
          <GameButton size="sm" variant={view === 'training' ? 'danger' : 'ghost'} onClick={() => setView('training')}>تدريب Echo</GameButton>
          <GameButton size="sm" variant={view === 'online' ? 'rare' : 'ghost'} onClick={() => setView('online')}>اللعب الحي</GameButton>
        </div>
      </header>

      {view === 'training' ? (
        <LocalChessTraining completed={eligibility.chessTrainingCompleted} onComplete={onTrainingComplete} />
      ) : room.state.phase === 'active' || room.state.phase === 'completed' ? (
        <div className="echo-network-chess-layout">
          <div>
            <div className="contract-chess-clocks">
              <span data-side="black"><small>BLACK</small><strong>{formatClock(liveClock.blackMs)}</strong></span>
              <span data-side="red"><small>RED</small><strong>{formatClock(liveClock.whiteMs)}</strong></span>
            </div>
            <ContractChessBoard
              pieces={snapshot?.pieces ?? []}
              playerColor={snapshot?.color ?? 'w'}
              legalMoves={snapshot?.legal ?? []}
              onMove={(from, to) => room.sendCommand('move', { from, to, promotion: 'q' })}
              disabled={room.state.phase !== 'active'}
            />
          </div>
          <HudPanel tone="rare" eyebrow="AUTHORITATIVE ROOM" title={`العقد · ${snapshot?.variant ?? 'standard'}`}>
            <p>كل نقلة والساعة والنتيجة يتحقق منها الخادم. عند انقطاع الاتصال تحاول القناة العودة تلقائيًا خلال 30 ثانية.</p>
            {room.state.error && <p className="echo-network-error" role="alert">{room.state.error}</p>}
            {room.state.receipt && (
              <div className="echo-network-receipt">
                <strong>تم تثبيت نتيجة العقد</strong>
                <span>{room.state.receipt.rewards[0]?.xpAmount ?? 0} XP في الإيصال الموثق</span>
              </div>
            )}
            <div className="echo-network-actions">
              <GameButton variant="ghost" onClick={() => room.sendCommand('preset-chat', { presetId: 'well-played' })}>إشارة احترام</GameButton>
              <GameButton variant="danger" onClick={room.leave}>مغادرة العقد</GameButton>
            </div>
          </HudPanel>
        </div>
      ) : (
        <div className="echo-network-online-lobby">
          <GlassPanel tone="rare" eyebrow="STANDARD RULES" title="المصنّف والعادي">
            <p>القواعد القياسية فقط في Ranked. أول عشر مباريات تصنيفية مؤقتة، وتصنيف Blitz منفصل عن Rapid.</p>
            <div className="echo-network-mode-grid">
              <GameButton variant="secondary" onClick={() => queue('chess_casual')}>Casual · 10+0</GameButton>
              <GameButton variant="danger" disabled={!eligibility.rankedChessUnlocked} onClick={() => queue('chess_ranked_blitz')}>Ranked Blitz · 3+2</GameButton>
              <GameButton variant="danger" disabled={!eligibility.rankedChessUnlocked} onClick={() => queue('chess_ranked_rapid')}>Ranked Rapid · 10+0</GameButton>
            </div>
            {!eligibility.rankedChessUnlocked && (
              <small>فتح Ranked: التدريب + {eligibility.casualChessCompleted}/3 مباريات Casual مكتملة.</small>
            )}
          </GlassPanel>
          <GlassPanel tone="memory" eyebrow="WEEKLY ROTATION" title="شذوذ غير مصنّف">
            <p>إشارة ثالثة، احتلال النواة، أو ذاكرة ضبابية. تتبدل أسبوعيًا ولا تغيّر تصنيفك.</p>
            <GameButton variant="memory" onClick={() => queue('chess_anomaly')}>دخول الشذوذ الحالي</GameButton>
          </GlassPanel>
          {room.state.phase === 'queueing' || room.state.phase === 'connecting' || room.state.phase === 'reconnecting' ? (
            <div className="echo-network-queue" role="status">
              <i aria-hidden="true" />
              <strong>{room.state.phase === 'queueing' ? 'البحث عن عقد مناسب…' : room.state.phase === 'reconnecting' ? 'إعادة ربط الغرفة…' : 'تثبيت المباراة…'}</strong>
              <GameButton size="sm" variant="ghost" onClick={room.leave}>إلغاء</GameButton>
            </div>
          ) : null}
          {room.state.error && <p className="echo-network-error" role="alert">{room.state.error}</p>}
        </div>
      )}
    </section>
  );
}
