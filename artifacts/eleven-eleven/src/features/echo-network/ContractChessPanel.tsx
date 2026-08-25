import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import {
  applyContractChessMove,
  createContractChessState,
  effectiveClock,
  type ContractChessState,
} from '../../domain/echo-network/chessRules';
import {
  canApplyEchoChessMove,
  type EchoChessDifficulty,
  type EchoChessEnginePort,
  type EchoChessMoveRequest,
} from '../../domain/echo-network/echoChessEngine';
import type { NetworkLocale, OnlineMode } from '../../domain/echo-network/contracts';
import {
  startOrResumeVerifiedChessTraining,
  submitVerifiedChessTrainingMove,
  type NetworkEligibilitySnapshot,
  type VerifiedChessTrainingSnapshot,
  type VerifiedChessTrainingStepId,
} from '../../infrastructure/echo-network/echoNetworkApi';
import { GameButton, GameProgress, GlassPanel, HudPanel } from '../../ui/design-system';
import { MiniEchoCompanion } from '../echo/MiniEchoCompanion';
import { useShellStore } from '../../app/shell/shellStore';
import { isRecoverableMatchState, roomHasUsableSnapshot, type RealtimeRoomController } from './useRealtimeRoom';
import { createEchoChessEnginePort } from './echoChessWorkerClient';

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

const CHESS_COPY = {
  ar: {
    eyebrow: 'عقد الأسود / الأحمر',
    title: 'شطرنج العقد الأسود والأحمر',
    training: 'مواجهة Echo',
    live: 'اللعب الحي',
    sanctum: 'محراب العقد',
    sanctumDescription: 'رقعة حية، ساعة موثقة، وقرار واحد واضح في كل دور.',
    casual: 'عادي · 10+0',
    blitz: 'مصنّف Blitz · 3+2',
    rapid: 'مصنّف Rapid · 10+0',
    anomaly: 'دخول الشذوذ الحالي',
    integrity: 'القواعد والساعة والنتيجة تتحقق داخل الغرفة الخادمية.',
    trainingTurn: 'مواجهة محلية · لا مكافأة ولا تصنيف',
    serverTurn: 'غرفة موثقة',
    red: 'أنت · الأحمر',
    black: 'الخصم · الأسود',
  },
  en: {
    eyebrow: 'BLACK / RED CONTRACT',
    title: 'Black / Red Contract Chess',
    training: 'Echo Duel',
    live: 'Live play',
    sanctum: 'The Contract Sanctum',
    sanctumDescription: 'A living board, a verified clock, and one clear decision each turn.',
    casual: 'Casual · 10+0',
    blitz: 'Ranked Blitz · 3+2',
    rapid: 'Ranked Rapid · 10+0',
    anomaly: 'Enter current anomaly',
    integrity: 'The room verifies every rule, clock tick, and result.',
    trainingTurn: 'Local duel · no reward or rating',
    serverTurn: 'Authoritative room',
    red: 'You · red',
    black: 'Opponent · black',
  },
} as const;

const CHESS_DETAIL_COPY = {
  ar: {
    boardLabel: 'لوحة شطرنج العقد الأسود والأحمر',
    empty: 'فارغ',
    selectSquare: (square: string) => `تم تحديد ${square}`,
    moveRecorded: (san: string) => `آخر نقلة: ${san}`,
    promotionTitle: 'ترقية البيدق',
    promotionPrompt: 'اختر القطعة الجديدة قبل إرسال النقلـة.',
    redSide: 'أحمر',
    blackSide: 'أسود',
    echoBlack: 'Echo · الأسود',
    youRed: 'أنت · الأحمر',
    trainingEyebrow: 'مواجهة محلية · بلا مكافأة أو تصنيف',
    trainingTitle: 'مواجهة Echo',
    trainingDescription: 'حرّك القطع الحمراء. يلعب Echo بالأسود بمستوى تختاره قبل البداية. هذه مواجهة محلية للتعلّم والمتعة؛ لا تمنح عملة أو XP أو ترتيبًا.',
    choosePiece: 'اختر قطعة ثم مربعًا مضيئًا.',
    watchEcho: 'راقب رد Echo وتبدّل الدور.',
    readClock: 'احمِ الملك واقرأ الساعة.',
    roundFinished: (reason: string) => `انتهت الجولة: ${reason}. يمكنك إعادة التدريب دون خسارة.`,
    resetBoard: 'إعادة اللوحة',
    difficultyLabel: 'قوة Echo',
    difficultyLocked: 'اختر القوة قبل أول نقلة. ابدأ مواجهة جديدة لتغييرها.',
    difficulty: { guided: 'موجّه', tactical: 'تكتيكي', 'black-echo': 'Black Echo' },
    difficultyDescription: {
      guided: 'يتجنب الأخطاء الكبيرة ويترك مساحة للتعلّم.',
      tactical: 'يرى الالتقاطات والتهديدات القصيرة.',
      'black-echo': 'يفكّر أعمق ويعاقب القطع المعلّقة.',
    },
    echoThinking: 'Echo يحلل العقد…',
    localOnly: 'هذه المواجهة لا تفتح Ranked. عقد التدريب الموثّق هو المسار الوحيد لفتح اللعب المصنّف.',
    newDuel: 'مواجهة جديدة',
    openVerifiedTraining: 'دخول عقد التدريب الموثّق',
    returnToDuel: 'العودة إلى مواجهة Echo',
    engineFailure: 'تعذّر على Echo إكمال النقلـة. أعد بدء المواجهة دون خسارة.',
    verifiedEyebrow: 'عقد تدريب موثّق · بلا مكافأة أو تصنيف',
    verifiedTitle: 'اختبار الشطرنج الموثّق',
    verifiedDescription: 'ثلاث قرارات قصيرة يتحقق منها الخادم. يحفظ التدريب رقعتك عند التحديث، ولا يقبل نتيجة أو FEN من المتصفح.',
    verifiedStart: 'بدء / استئناف التدريب',
    verifiedLoading: 'الخادم يثبت رقعة التدريب…',
    verifiedProgress: (step: number) => `عقد ${step}/3`,
    verifiedReady: 'اختر نقلة قانونية تحقق الهدف. يشرح Echo المبدأ بعد التحقق فقط.',
    verifiedSubmitting: 'يتم التحقق من النقلـة…',
    verifiedComplete: 'اكتمل عقد التدريب. سيتحقق السجل من شروط Ranked الأخرى قبل فتحه.',
    verifiedRetry: 'إعادة تحميل الرقعة الموثّقة',
    verifiedExpired: 'انتهت صلاحية الرقعة. أعد فتح التدريب لاستلام عقد جديد.',
    verifiedGoal: {
      'develop-a-knight': 'طوّر حصانًا نحو المركز.',
      'escape-check': 'أخرج ملكك من الكش.',
      'capture-hanging-queen': 'التقط الوزير غير المحمي.',
    },
    authoritativeEyebrow: 'غرفة موثقة',
    contractLabel: 'العقد',
    authoritativeDescription: 'كل نقلة والساعة والنتيجة يتحقق منها الخادم. عند انقطاع الاتصال تحاول القناة العودة تلقائيًا خلال 30 ثانية.',
    settlementTitle: 'النتيجة قيد التثبيت الخادمي',
    awaitingReceipt: 'انتهت المباراة وحُفظت حالتها. ننتظر الإيصال الموثّق؛ لن تظهر XP أو التصنيف قبل وصوله.',
    pendingServerFinalization: 'الإيصال محفوظ داخل الغرفة الموثّقة. يثبّت الخادم النتيجة في ملفك؛ هذه الشاشة لا تمنح XP أو تصنيفًا.',
    checkSealedResult: 'التحقق من الإيصال',
    respect: 'إشارة احترام',
    leave: 'مغادرة العقد',
    standardEyebrow: 'قواعد قياسية',
    standardTitle: 'المصنّف والعادي',
    standardDescription: 'القواعد القياسية فقط في Ranked. أول عشر مباريات تصنيفية مؤقتة، وتصنيف Blitz منفصل عن Rapid.',
    rankedGate: (completed: number) => `فتح Ranked: التدريب + ${completed}/3 مباريات Casual مكتملة.`,
    anomalyTitle: 'شذوذ غير مصنّف',
    anomalyDescription: 'إشارة ثالثة، احتلال النواة، أو ذاكرة ضبابية. تتبدل أسبوعيًا ولا تغيّر تصنيفك.',
    weeklyRotationEyebrow: 'دورة أسبوعية',
    variant: (value: string) => ({
      standard: 'قياسي',
      'three-signal': 'ثلاث إشارات',
      'core-control': 'سيطرة النواة',
      'fog-memory': 'ذاكرة ضبابية',
    }[value] ?? 'قياسي'),
    searching: 'البحث عن عقد مناسب…',
    reconnecting: 'إعادة ربط الغرفة…',
    connecting: 'تثبيت المباراة…',
    receiving: 'القناة مفتوحة. ننتظر حالة العقد الموثقة من الخادم…',
    waitingForOpponent: 'تم تثبيت مقعدك. ننتظر اتصال الخصم قبل إظهار الرقعة.',
    retryRoom: 'إعادة ربط العقد',
    cancel: 'إلغاء',
  },
  en: {
    boardLabel: 'Black and red contract chess board',
    empty: 'empty',
    selectSquare: (square: string) => `${square} selected`,
    moveRecorded: (san: string) => `Last move: ${san}`,
    promotionTitle: 'Promote pawn',
    promotionPrompt: 'Choose the new piece before sending the move.',
    redSide: 'red',
    blackSide: 'black',
    echoBlack: 'Echo · black',
    youRed: 'You · red',
    trainingEyebrow: 'LOCAL DUEL · NO REWARD OR RATING',
    trainingTitle: 'Echo Duel',
    trainingDescription: 'Move the red pieces. Echo plays black at the strength you choose before the opening. This local duel is for practice and fun; it grants no currency, XP, or rating.',
    choosePiece: 'Choose a piece, then a lit square.',
    watchEcho: 'Watch Echo answer and the turn change.',
    readClock: 'Protect your king and read the clock.',
    roundFinished: (reason: string) => `Round finished: ${reason}. You can restart training without loss.`,
    resetBoard: 'Reset board',
    difficultyLabel: 'Echo strength',
    difficultyLocked: 'Choose strength before your first move. Start a new duel to change it.',
    difficulty: { guided: 'Guided', tactical: 'Tactical', 'black-echo': 'Black Echo' },
    difficultyDescription: {
      guided: 'Avoids major blunders and leaves room to learn.',
      tactical: 'Sees captures and short threats.',
      'black-echo': 'Searches deeper and punishes hanging pieces.',
    },
    echoThinking: 'Echo is reading the contract…',
    localOnly: 'This duel does not unlock Ranked. The verified training contract is the only route toward Ranked.',
    newDuel: 'New duel',
    openVerifiedTraining: 'Enter verified training contract',
    returnToDuel: 'Return to Echo Duel',
    engineFailure: 'Echo could not complete that move. Restart the duel without loss.',
    verifiedEyebrow: 'VERIFIED TRAINING CONTRACT · NO REWARD OR RATING',
    verifiedTitle: 'Verified Chess Training',
    verifiedDescription: 'Three short decisions are checked by the server. The board resumes after refresh, and the browser never submits a result or FEN.',
    verifiedStart: 'Start / resume verified training',
    verifiedLoading: 'The server is sealing the training board…',
    verifiedProgress: (step: number) => `CONTRACT ${step}/3`,
    verifiedReady: 'Choose a legal move that meets the objective. Echo explains the principle only after verification.',
    verifiedSubmitting: 'Verifying move…',
    verifiedComplete: 'Training contract complete. Your record will check the remaining Ranked requirements before opening it.',
    verifiedRetry: 'Reload verified board',
    verifiedExpired: 'This board expired. Open training again for a fresh contract.',
    verifiedGoal: {
      'develop-a-knight': 'Develop a knight toward the centre.',
      'escape-check': 'Get your king out of check.',
      'capture-hanging-queen': 'Capture the unprotected queen.',
    },
    authoritativeEyebrow: 'Authoritative room',
    contractLabel: 'Contract',
    authoritativeDescription: 'The server verifies every move, clock tick, and result. If your connection drops, the channel retries for 30 seconds.',
    settlementTitle: 'Result settling on the server',
    awaitingReceipt: 'The match state is saved. We are waiting for its verified receipt; XP and rating stay hidden until it arrives.',
    pendingServerFinalization: 'The receipt is saved in the authoritative room. The server is finalizing your profile record; this screen does not grant XP or rating.',
    checkSealedResult: 'Check sealed result',
    respect: 'Send respect',
    leave: 'Leave contract',
    standardEyebrow: 'STANDARD RULES',
    standardTitle: 'Ranked and casual',
    standardDescription: 'Ranked uses standard chess only. Your first ten ranked games are provisional, with separate Blitz and Rapid ratings.',
    rankedGate: (completed: number) => `Unlock Ranked: training + ${completed}/3 completed Casual games.`,
    anomalyTitle: 'Unranked anomaly',
    anomalyDescription: 'Third signal, core control, or fogged memory. It rotates weekly and never changes your rating.',
    weeklyRotationEyebrow: 'WEEKLY ROTATION',
    variant: (value: string) => ({
      standard: 'Standard',
      'three-signal': 'Three signal',
      'core-control': 'Core control',
      'fog-memory': 'Fogged memory',
    }[value] ?? 'Standard'),
    searching: 'Finding a compatible contract…',
    reconnecting: 'Reconnecting the room…',
    connecting: 'Securing the match…',
    receiving: 'Channel open. Waiting for the server-authoritative contract state…',
    waitingForOpponent: 'Your seat is secured. Waiting for the opponent before showing the board.',
    retryRoom: 'Retry this contract',
    cancel: 'Cancel',
  },
} as const;

function chessCopy(locale: NetworkLocale) {
  return { ...CHESS_COPY[locale], ...CHESS_DETAIL_COPY[locale] };
}

function liveSideLabels(locale: NetworkLocale, playerColor: Color) {
  const labels = locale === 'ar'
    ? {
      youRed: '\u0623\u0646\u062a \u00b7 \u0627\u0644\u0623\u062d\u0645\u0631',
      youBlack: '\u0623\u0646\u062a \u00b7 \u0627\u0644\u0623\u0633\u0648\u062f',
      opponentRed: '\u0627\u0644\u062e\u0635\u0645 \u00b7 \u0627\u0644\u0623\u062d\u0645\u0631',
      opponentBlack: '\u0627\u0644\u062e\u0635\u0645 \u00b7 \u0627\u0644\u0623\u0633\u0648\u062f',
    }
    : {
      youRed: 'You \u00b7 red',
      youBlack: 'You \u00b7 black',
      opponentRed: 'Opponent \u00b7 red',
      opponentBlack: 'Opponent \u00b7 black',
    };

  return playerColor === 'w'
    ? { red: labels.youRed, black: labels.opponentBlack }
    : { red: labels.opponentRed, black: labels.youBlack };
}

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

function isChessSquare(value: unknown): value is Square {
  return typeof value === 'string' && /^[a-h][1-8]$/.test(value);
}

function readableLastMove(value: unknown): { from: Square; to: Square; san: string } | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { from?: unknown; to?: unknown; san?: unknown };
  return isChessSquare(candidate.from) && isChessSquare(candidate.to) && typeof candidate.san === 'string'
    ? { from: candidate.from, to: candidate.to, san: candidate.san.slice(0, 32) }
    : null;
}

function ContractChessBoard({
  pieces,
  playerColor,
  legalMoves,
  onMove,
  disabled,
  locale,
  lastMove,
  boardId = 'contract-chess-board',
}: {
  pieces: readonly BoardPiece[];
  playerColor: Color;
  legalMoves: readonly { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' }[];
  onMove: (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => void;
  disabled?: boolean;
  locale: NetworkLocale;
  lastMove?: { from: Square; to: Square; san: string } | null;
  boardId?: string;
}) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [focusedSquare, setFocusedSquare] = useState<Square>(playerColor === 'w' ? 'e2' : 'e7');
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    options: Array<'q' | 'r' | 'b' | 'n'>;
  } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const squareRefs = useRef(new Map<Square, HTMLButtonElement>());
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
  const copy = chessCopy(locale);

  useEffect(() => {
    setSelected(null);
    setPendingPromotion(null);
    setFocusedSquare(playerColor === 'w' ? 'e2' : 'e7');
  }, [playerColor]);

  useEffect(() => {
    if (lastMove) setAnnouncement(chessCopy(locale).moveRecorded(lastMove.san));
  }, [lastMove?.san, locale]);

  const squares = useMemo(() => (
    ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square))
  ), [files, ranks]);

  const focus = (square: Square) => {
    setFocusedSquare(square);
    requestAnimationFrame(() => squareRefs.current.get(square)?.focus());
  };

  const commitMove = (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
    onMove(from, to, promotion);
    setSelected(null);
    setPendingPromotion(null);
  };

  const activate = (square: Square) => {
    if (disabled) return;
    if (selected && destinations.has(square)) {
      const matchingMoves = legalMoves.filter((move) => move.from === selected && move.to === square);
      const promotionOptions = Array.from(new Set(matchingMoves.flatMap((move) => move.promotion ? [move.promotion] : [])));
      if (promotionOptions.length > 0) {
        setPendingPromotion({ from: selected, to: square, options: promotionOptions });
        return;
      }
      commitMove(selected, square);
      return;
    }
    const piece = pieceMap.get(square);
    const canMove = piece?.color === playerColor
      && legalMoves.some((move) => move.from === square);
    setSelected(canMove ? square : null);
    if (canMove) setAnnouncement(copy.selectSquare(square));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, square: Square) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(square);
      return;
    }
    const index = squares.indexOf(square);
    if (index < 0) return;
    const column = index % 8;
    let targetIndex: number | null = null;
    if (event.key === 'ArrowLeft' && column > 0) targetIndex = index - 1;
    if (event.key === 'ArrowRight' && column < 7) targetIndex = index + 1;
    if (event.key === 'ArrowUp' && index >= 8) targetIndex = index - 8;
    if (event.key === 'ArrowDown' && index < 56) targetIndex = index + 8;
    if (event.key === 'Home') targetIndex = index - column;
    if (event.key === 'End') targetIndex = index - column + 7;
    if (targetIndex === null) return;
    event.preventDefault();
    const target = squares[targetIndex];
    if (target) focus(target);
  };

  return (
    <div
      id={boardId}
      className="contract-chess-board-frame"
      data-player-color={playerColor}
      tabIndex={-1}
    >
      <span className="contract-chess-board-frame__seal" aria-hidden="true" />
      <div className="contract-chess-board" role="grid" aria-label={copy.boardLabel} aria-roledescription="chess board">
        {ranks.map((rank, rankIndex) => (
          <div className="contract-chess-board__row" role="row" key={rank}>
            {files.map((file, fileIndex) => {
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
                  onKeyDown={(event) => handleKeyDown(event, square)}
                  disabled={disabled}
                  aria-pressed={selected === square}
                  aria-current={lastMove?.to === square ? 'true' : undefined}
                  aria-label={`${square}, ${piece
                    ? `${piece.color === 'w' ? copy.redSide : copy.blackSide} ${PIECE_NAMES[piece.type][locale]}`
                    : copy.empty}`}
                  tabIndex={focusedSquare === square ? 0 : -1}
                  ref={(node) => {
                    if (node) squareRefs.current.set(square, node);
                    else squareRefs.current.delete(square);
                  }}
                >
                  {piece && (
                    <span
                      data-piece-color={piece.color}
                      data-last-move={lastMove?.to === square ? 'to' : lastMove?.from === square ? 'from' : undefined}
                      aria-hidden="true"
                    >
                      {PIECES[piece.color][piece.type]}
                    </span>
                  )}
                  <i aria-hidden="true" />
                  {fileIndex === 0 && <small data-coordinate="rank" aria-hidden="true">{rank}</small>}
                  {rankIndex === ranks.length - 1 && <small data-coordinate="file" aria-hidden="true">{file}</small>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="contract-chess-board__status" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      {pendingPromotion && (
        <div className="contract-chess-promotion" role="dialog" aria-modal="true" aria-labelledby="contract-chess-promotion-title">
          <strong id="contract-chess-promotion-title">{copy.promotionTitle}</strong>
          <span>{copy.promotionPrompt}</span>
          <div role="group" aria-label={copy.promotionTitle}>
            {pendingPromotion.options.map((promotion) => (
              <button
                type="button"
                key={promotion}
                onClick={() => commitMove(pendingPromotion.from, pendingPromotion.to, promotion)}
                aria-label={`${copy.promotionTitle}: ${PIECE_NAMES[promotion][locale]}`}
              >
                <span data-piece-color={playerColor} aria-hidden="true">{PIECES[playerColor][promotion]}</span>
              </button>
            ))}
            <button type="button" onClick={() => setPendingPromotion(null)}>{copy.cancel}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function createDuelSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now();
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffff_ffff)) >>> 0;
}

function createTrainingRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const random = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    ? crypto.getRandomValues(new Uint8Array(16))
    : Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  random[6] = (random[6]! & 0x0f) | 0x40;
  random[8] = (random[8]! & 0x3f) | 0x80;
  const hex = [...random].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function VerifiedChessTraining({
  locale,
  onCertified,
  onReturnToDuel,
}: {
  locale: NetworkLocale;
  onCertified: () => void;
  onReturnToDuel: () => void;
}) {
  const copy = chessCopy(locale);
  const [snapshot, setSnapshot] = useState<VerifiedChessTrainingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square; san: string } | null>(null);
  const requestIdsRef = useRef(new Map<string, string>());
  const certifiedRef = useRef(false);
  const session = snapshot?.session ?? null;
  const chess = useMemo(() => {
    if (session?.status !== 'active' || !session.fen) return null;
    try {
      return new Chess(session.fen);
    } catch {
      return null;
    }
  }, [session?.fen, session?.status]);
  const legalMoves = useMemo(() => {
    if (!chess || session?.status !== 'active' || chess.turn() !== 'w') return [];
    return chess.moves({ verbose: true }).map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion === 'q' || move.promotion === 'r' || move.promotion === 'b' || move.promotion === 'n'
        ? move.promotion
        : undefined,
    }));
  }, [chess, session?.status]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await startOrResumeVerifiedChessTraining());
      setLastMove(null);
    } catch (loadError) {
      setSnapshot(null);
      setError(loadError instanceof Error ? loadError.message : copy.engineFailure);
    } finally {
      setLoading(false);
    }
  }, [copy.engineFailure]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (session?.status !== 'completed' || certifiedRef.current) return;
    certifiedRef.current = true;
    onCertified();
  }, [onCertified, session?.status]);

  const move = async (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
    if (!session || session.status !== 'active' || !chess || submitting) return;
    let preview;
    try {
      preview = chess.move({ from, to, promotion });
    } catch {
      setError(copy.engineFailure);
      return;
    }
    const requestKey = `${session.id}:${session.version}:${from}:${to}:${promotion ?? ''}`;
    const idempotencyKey = requestIdsRef.current.get(requestKey) ?? createTrainingRequestId();
    requestIdsRef.current.set(requestKey, idempotencyKey);
    setSubmitting(true);
    setError(null);
    try {
      const next = await submitVerifiedChessTrainingMove({
        sessionId: session.id,
        idempotencyKey,
        expectedVersion: session.version,
        from,
        to,
        ...(promotion ? { promotion } : {}),
      });
      setSnapshot(next);
      setLastMove({ from, to, san: preview.san });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : copy.engineFailure;
      setError(message.includes('expired') ? copy.verifiedExpired : message);
    } finally {
      setSubmitting(false);
    }
  };

  const active = session?.status === 'active' && chess !== null;
  const goal = session?.step
    ? copy.verifiedGoal[session.step as VerifiedChessTrainingStepId]
    : null;

  // The verified surface replaces the local duel board. It needs its own
  // board-first hand-off once the server snapshot has actually arrived;
  // the parent cannot see this delayed mount.
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('verified-chess-training-board')?.scrollIntoView({
        block: 'start',
        behavior: 'auto',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, session?.id]);

  return (
    <section className="contract-chess-verified-training" aria-labelledby="contract-chess-verified-title">
      <div className="contract-chess-verified-training__heading">
        <small>{copy.verifiedEyebrow}</small>
        <h3 id="contract-chess-verified-title">{copy.verifiedTitle}</h3>
        <p>{copy.verifiedDescription}</p>
      </div>
      {loading ? (
        <p className="contract-chess-verified-training__state" role="status">{copy.verifiedLoading}</p>
      ) : active ? (
        <div className="contract-chess-verified-training__active">
          <div className="contract-chess-verified-training__objective" role="status" aria-live="polite">
            <small>{copy.verifiedProgress(session.stepIndex + 1)}</small>
            <strong>{goal}</strong>
            <span>{submitting ? copy.verifiedSubmitting : copy.verifiedReady}</span>
          </div>
          <ContractChessBoard
            pieces={piecesFromFen(session.fen ?? null)}
            playerColor="w"
            legalMoves={legalMoves}
          onMove={move}
          disabled={submitting}
          locale={locale}
          lastMove={lastMove}
          boardId="verified-chess-training-board"
          />
        </div>
      ) : session?.status === 'completed' ? (
        <p className="contract-chess-verified-training__complete" role="status">{copy.verifiedComplete}</p>
      ) : (
        <p className="contract-chess-verified-training__state" role="status">{copy.verifiedExpired}</p>
      )}
      {error && <p className="echo-network-error" role="alert">{error}</p>}
      <div className="echo-network-actions">
        <GameButton size="sm" variant="rare" disabled={loading || submitting} onClick={() => void load()}>
          {snapshot ? copy.verifiedRetry : copy.verifiedStart}
        </GameButton>
        <GameButton size="sm" variant="ghost" disabled={submitting} onClick={onReturnToDuel}>
          {copy.returnToDuel}
        </GameButton>
      </div>
    </section>
  );
}

function LocalEchoDuel({
  locale,
  onOpenVerifiedTraining,
}: {
  locale: NetworkLocale;
  onOpenVerifiedTraining: () => void;
}) {
  const [state, setState] = useState(() => createContractChessState('standard', 'rapid'));
  const [playerMoves, setPlayerMoves] = useState(0);
  const [difficulty, setDifficulty] = useState<EchoChessDifficulty>('guided');
  const [duelSeed, setDuelSeed] = useState(createDuelSeed);
  const [thinking, setThinking] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const engineRef = useRef<EchoChessEnginePort | null>(null);
  const activeRequestRef = useRef(0);
  const sequenceRef = useRef(0);
  const chess = useMemo(() => new Chess(state.fen), [state.fen]);
  const copy = chessCopy(locale);
  const hasVerifiedReward = useShellStore(
    (shell) => shell.experienceEntitlements.snapshot.firstRewardReceived,
  );
  const echoMoveEvent = useMemo(() => state.lastMove ? {
    id: `echo-duel-move-${state.version}`,
    kind: 'chess-move-completed' as const,
    sourceId: `${state.lastMove.from}-${state.lastMove.to}`,
    // This local session has no game authority; the cue only acknowledges a
    // legal board transition already checked by chess.js.
    authority: 'local-ui' as const,
    occurredAt: state.version,
    payloadVersion: 1 as const,
  } : null, [state.lastMove, state.version]);
  const playerTurn = chess.turn() === 'w' && state.status === 'active';
  const legalMoves = useMemo(() => (
    playerTurn
      ? chess.moves({ verbose: true }).map((move) => ({
        from: move.from,
        to: move.to,
        promotion: move.promotion === 'q' || move.promotion === 'r' || move.promotion === 'b' || move.promotion === 'n'
          ? move.promotion
          : undefined,
      }))
      : []
  ), [chess, playerTurn]);

  useEffect(() => {
    const engine = createEchoChessEnginePort();
    engineRef.current = engine;
    return () => {
      activeRequestRef.current += 1;
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state.status !== 'active' || new Chess(state.fen).turn() !== 'b') return undefined;
    const engine = engineRef.current;
    if (!engine) return undefined;
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    sequenceRef.current += 1;
    const request: EchoChessMoveRequest = {
      fen: state.fen,
      difficulty,
      sessionSequence: sequenceRef.current,
      positionVersion: state.version,
      sessionSeed: duelSeed,
      timeBudgetMs: difficulty === 'guided' ? 120 : difficulty === 'tactical' ? 350 : 900,
    };
    let cancelled = false;
    setThinking(true);
    setEngineError(null);
    void engine.chooseMove(request).then((response) => {
      if (cancelled || activeRequestRef.current !== requestId) return;
      if (!response.ok) {
        setEngineError(response.message);
        setThinking(false);
        return;
      }
      setState((current) => {
        const currentRequest: EchoChessMoveRequest = {
          ...request,
          fen: current.fen,
          positionVersion: current.version,
        };
        if (!canApplyEchoChessMove(currentRequest, response.result)) return current;
        try {
          return applyContractChessMove(current, {
            from: response.result.from,
            to: response.result.to,
            promotion: response.result.promotion,
          });
        } catch {
          return current;
        }
      });
      // Settle before React tears down this effect for Echo's new board state.
      // Otherwise a fast render can make the cleanup invalidate this request
      // before finally runs, leaving the board labelled as "thinking".
      setThinking(false);
    }).catch(() => {
      if (!cancelled && activeRequestRef.current === requestId) {
        setEngineError(copy.engineFailure);
        setThinking(false);
      }
    });
    return () => {
      cancelled = true;
      if (activeRequestRef.current === requestId) activeRequestRef.current += 1;
    };
  }, [difficulty, duelSeed, state.fen, state.status, state.version]);

  const move = (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => {
    if (!playerTurn) return;
    try {
      setState(applyContractChessMove(state, { from, to, promotion }));
      setPlayerMoves((value) => value + 1);
      setEngineError(null);
    } catch {
      setEngineError(copy.engineFailure);
    }
  };

  const startNewDuel = () => {
    activeRequestRef.current += 1;
    sequenceRef.current = 0;
    setState(createContractChessState('standard', 'rapid'));
    setPlayerMoves(0);
    setDuelSeed(createDuelSeed());
    setThinking(false);
    setEngineError(null);
  };

  const now = useClockNow(state.status === 'active');
  const clocks = effectiveClock(state, now);
  const difficultyLocked = playerMoves > 0 || state.version > 0 || thinking;
  return (
    <div className="echo-network-chess-layout contract-chess-stage" data-state="echo-duel" data-difficulty={difficulty}>
        <div className="contract-chess-stage__board-area">
        <div className="contract-chess-stage__eyebrow"><span aria-hidden="true" />{copy.trainingTurn}</div>
        <div className="contract-chess-clocks" aria-live="off">
          <span data-side="black"><i aria-hidden="true" /><small>{copy.echoBlack}</small><strong>{formatClock(clocks.blackMs)}</strong></span>
          <span data-side="red"><i aria-hidden="true" /><small>{copy.youRed}</small><strong>{formatClock(clocks.whiteMs)}</strong></span>
        </div>
        <ContractChessBoard
          pieces={piecesFromFen(state.fen)}
          playerColor="w"
          legalMoves={legalMoves}
          onMove={move}
          disabled={!playerTurn || thinking}
          locale={locale}
          lastMove={state.lastMove}
          boardId="echo-duel-board"
        />
        </div>
        <HudPanel tone="danger" eyebrow={copy.trainingEyebrow} title={copy.trainingTitle} className="contract-chess-stage__brief">
        <p>{copy.trainingDescription}</p>
        <MiniEchoCompanion
          className="contract-chess-stage__mini-echo"
          available={hasVerifiedReward}
          locale={locale}
          objectiveKind="solve"
          event={echoMoveEvent}
        />
        <div className="contract-chess-difficulty" role="group" aria-label={copy.difficultyLabel}>
          {(Object.keys(copy.difficulty) as EchoChessDifficulty[]).map((level) => (
            <GameButton
              key={level}
              size="sm"
              variant={difficulty === level ? 'danger' : 'ghost'}
              aria-pressed={difficulty === level}
              disabled={difficultyLocked && difficulty !== level}
              onClick={() => setDifficulty(level)}
            >
              {copy.difficulty[level]}
            </GameButton>
          ))}
        </div>
        <p className="contract-chess-difficulty__description">{copy.difficultyDescription[difficulty]}</p>
        {difficultyLocked && <small className="contract-chess-difficulty__locked">{copy.difficultyLocked}</small>}
        <GameProgress value={Math.min(100, (playerMoves / 3) * 100)} tone="danger" />
        <ol className="echo-network-checklist">
          <li data-complete={playerMoves >= 1}>{copy.choosePiece}</li>
          <li data-complete={playerMoves >= 2}>{thinking ? copy.echoThinking : copy.watchEcho}</li>
          <li data-complete={playerMoves >= 3}>{copy.readClock}</li>
        </ol>
        {state.status !== 'active' && (
          <p className="echo-network-callout">{copy.roundFinished(state.reason ?? '')}</p>
        )}
        {engineError && <p className="echo-network-error" role="alert">{engineError}</p>}
          <p className="contract-chess-local-only" role="status">{copy.localOnly}</p>
        <div className="echo-network-actions">
          <GameButton
            variant="rare"
            onClick={onOpenVerifiedTraining}
          >
            {copy.openVerifiedTraining}
          </GameButton>
          <GameButton
            variant="ghost"
            onClick={startNewDuel}
          >
            {copy.newDuel}
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
      return isChessSquare(from) && isChessSquare(to)
        ? [{
          from: from as Square,
          to: to as Square,
          promotion: (value as { promotion?: unknown }).promotion === 'q'
            || (value as { promotion?: unknown }).promotion === 'r'
            || (value as { promotion?: unknown }).promotion === 'b'
            || (value as { promotion?: unknown }).promotion === 'n'
            ? (value as { promotion: 'q' | 'r' | 'b' | 'n' }).promotion
            : undefined,
        }]
        : [];
    })
    : [];
  const fogPieces = Array.isArray(snapshot.fogPieces)
    ? snapshot.fogPieces as BoardPiece[]
    : [];
  const fen = typeof state?.fen === 'string' ? state.fen : null;
  const lastMove = readableLastMove(state?.lastMove);
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
    lastMove,
  };
}

export function ContractChessPanel({
  eligibility,
  onReceipt,
  onTrainingCertified,
  locale,
  room,
  allowRanked = false,
}: {
  eligibility: NetworkEligibilitySnapshot;
  onReceipt: () => void;
  /** Called only after the server marks the verified training milestone. */
  onTrainingCertified: () => void;
  locale: NetworkLocale;
  room: RealtimeRoomController;
  /** Ranked stays hidden until the player journey and server both permit it. */
  allowRanked?: boolean;
}) {
  const [view, setView] = useState<'training' | 'online'>('training');
  const [trainingSurface, setTrainingSurface] = useState<'duel' | 'verified'>('duel');
  const synchronizedReceiptIdRef = useRef<string | null>(null);
  const matchHandoffActive = room.state.target === 'match'
    && room.state.mode !== null
    && ['queueing', 'connecting', 'awaiting-snapshot', 'active', 'reconnecting', 'settling', 'completed'].includes(room.state.phase);
  const matchRecoveryAvailable = room.state.mode !== 'coop_breach'
    && isRecoverableMatchState(room.state);
  const activeView = matchHandoffActive || matchRecoveryAvailable ? 'online' : view;
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
    const receiptId = room.state.receipt?.receiptId;
    if (!receiptId || synchronizedReceiptIdRef.current === receiptId) return undefined;
    synchronizedReceiptIdRef.current = receiptId;
    const timer = setTimeout(() => void onReceipt(), 1_200);
    return () => clearTimeout(timer);
  }, [onReceipt, room.state.receipt?.receiptId]);

  const queue = (mode: OnlineMode) => {
    setView('online');
    void room.joinQueue({ mode });
  };
  const copy = chessCopy(locale);
  const roomReady = roomHasUsableSnapshot(room.state);
  const gameplayReady = roomReady && snapshot?.state !== null;
  const boardIsVisible = activeView === 'training' || gameplayReady;
  const boardTargetId = activeView === 'training' && trainingSurface === 'verified'
    ? 'verified-chess-training-board'
    : 'contract-chess-board';
  const liveSides = liveSideLabels(locale, snapshot?.color ?? 'w');
  const hasResultSettlement = room.state.settlement !== 'none';
  const settlementMessage = room.state.settlement === 'awaiting-receipt'
    ? copy.awaitingReceipt
    : copy.pendingServerFinalization;

  useEffect(() => {
    if (!boardIsVisible || typeof window === 'undefined') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(boardTargetId)?.scrollIntoView({
        block: 'start',
        behavior: 'auto',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [boardIsVisible, boardTargetId]);

  return (
    <section className="echo-network-mode contract-chess-surface" data-surface="chess" aria-labelledby="contract-chess-title">
      <header className="echo-network-mode__heading">
        <span><small>{copy.eyebrow}</small><h2 id="contract-chess-title">{copy.title}</h2></span>
        <div className="echo-network-segmented">
          <GameButton size="sm" variant={activeView === 'training' ? 'danger' : 'ghost'} onClick={() => setView('training')}>{copy.training}</GameButton>
          <GameButton size="sm" variant={activeView === 'online' ? 'rare' : 'ghost'} onClick={() => setView('online')}>{copy.live}</GameButton>
        </div>
      </header>

      {activeView === 'training' ? (
        trainingSurface === 'verified' ? (
          <VerifiedChessTraining
            locale={locale}
            onCertified={onTrainingCertified}
            onReturnToDuel={() => setTrainingSurface('duel')}
          />
        ) : (
          <LocalEchoDuel
            locale={locale}
            onOpenVerifiedTraining={() => setTrainingSurface('verified')}
          />
        )
      ) : gameplayReady ? (
        <div className="echo-network-chess-layout contract-chess-stage" data-state={room.state.phase}>
          <div className="contract-chess-stage__board-area">
            <div className="contract-chess-stage__eyebrow"><span aria-hidden="true" />{copy.serverTurn}</div>
            <div className="contract-chess-clocks">
              <span data-side="black"><i aria-hidden="true" /><small>{liveSides.black}</small><strong>{formatClock(liveClock.blackMs)}</strong></span>
              <span data-side="red"><i aria-hidden="true" /><small>{liveSides.red}</small><strong>{formatClock(liveClock.whiteMs)}</strong></span>
            </div>
            <ContractChessBoard
              pieces={snapshot?.pieces ?? []}
              playerColor={snapshot?.color ?? 'w'}
              legalMoves={snapshot?.legal ?? []}
              onMove={(from, to, promotion) => room.sendCommand('move', { from, to, promotion })}
              disabled={room.state.phase !== 'active'}
              locale={locale}
              lastMove={snapshot?.lastMove}
            />
          </div>
          <HudPanel tone="rare" eyebrow={copy.authoritativeEyebrow} title={`${copy.contractLabel} · ${copy.variant(snapshot?.variant ?? 'standard')}`} className="contract-chess-stage__brief">
            <p>{copy.authoritativeDescription}</p>
            {room.state.error && <p className="echo-network-error" role="alert">{room.state.error}</p>}
            {hasResultSettlement && (
              <div
                className="echo-network-receipt echo-network-settlement"
                data-settlement={room.state.settlement}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <strong>{copy.settlementTitle}</strong>
                <span>{settlementMessage}</span>
                {matchRecoveryAvailable && (
                  <GameButton size="sm" variant="rare" onClick={() => void room.retryExistingMatch()}>{copy.checkSealedResult}</GameButton>
                )}
              </div>
            )}
            <div className="echo-network-actions">
              <GameButton variant="ghost" onClick={() => room.sendCommand('preset-chat', { presetId: 'well-played' })}>{copy.respect}</GameButton>
              <GameButton variant="danger" onClick={room.leave}>{copy.leave}</GameButton>
            </div>
          </HudPanel>
        </div>
      ) : matchHandoffActive ? (
        <div className="contract-chess-waiting" role="status">
          <HudPanel tone="rare" eyebrow={copy.authoritativeEyebrow} title={copy.serverTurn}>
            <div className="echo-network-queue">
              <i aria-hidden="true" />
              <strong>{room.state.settlement === 'awaiting-receipt'
                ? copy.awaitingReceipt
                : room.state.settlement === 'pending-server-finalization'
                ? copy.pendingServerFinalization
                : room.state.phase === 'awaiting-snapshot'
                ? copy.receiving
                : room.state.phase === 'reconnecting'
                ? copy.reconnecting
                : snapshot?.status === 'waiting'
                ? copy.waitingForOpponent
                : copy.connecting}</strong>
              {matchRecoveryAvailable && (
                <GameButton size="sm" variant="rare" onClick={() => void room.retryExistingMatch()}>{copy.checkSealedResult}</GameButton>
              )}
              <GameButton size="sm" variant="ghost" onClick={room.leave}>{copy.cancel}</GameButton>
            </div>
            {room.state.error && <p className="echo-network-error" role="alert">{room.state.error}</p>}
          </HudPanel>
        </div>
      ) : (
        <div className="contract-chess-lobby">
          <div className="contract-chess-lobby__visual" aria-hidden="true" />
          <div className="contract-chess-lobby__hero">
            <span>{copy.eyebrow}</span>
            <h3>{copy.sanctum}</h3>
            <p>{copy.sanctumDescription}</p>
            <small>{copy.integrity}</small>
          </div>
          <GlassPanel tone="rare" eyebrow={copy.standardEyebrow} title={copy.standardTitle} className="contract-chess-lobby__modes">
            <p>{copy.standardDescription}</p>
            <div className="echo-network-mode-grid">
              <GameButton variant="secondary" onClick={() => queue('chess_casual')}>{copy.casual}</GameButton>
              {allowRanked && <>
                <GameButton variant="danger" disabled={!eligibility.rankedChessUnlocked} onClick={() => queue('chess_ranked_blitz')}>{copy.blitz}</GameButton>
                <GameButton variant="danger" disabled={!eligibility.rankedChessUnlocked} onClick={() => queue('chess_ranked_rapid')}>{copy.rapid}</GameButton>
              </>}
            </div>
            {allowRanked && !eligibility.rankedChessUnlocked && (
              <small>{copy.rankedGate(eligibility.casualChessCompleted)}</small>
            )}
          </GlassPanel>
          {matchRecoveryAvailable && (
            <div className="echo-network-queue echo-network-settlement" data-settlement={room.state.settlement} role="status" aria-live="polite" aria-atomic="true">
              <strong>{room.state.settlement === 'awaiting-receipt' ? copy.awaitingReceipt : room.state.error}</strong>
              <GameButton size="sm" variant="rare" onClick={() => void room.retryExistingMatch()}>{room.state.settlement === 'awaiting-receipt' ? copy.checkSealedResult : copy.retryRoom}</GameButton>
              <GameButton size="sm" variant="ghost" onClick={room.leave}>{copy.cancel}</GameButton>
            </div>
          )}
          {room.state.phase === 'queueing' || room.state.phase === 'connecting' || room.state.phase === 'awaiting-snapshot' || room.state.phase === 'reconnecting' ? (
            <div className="echo-network-queue" role="status">
              <i aria-hidden="true" />
              <strong>{room.state.phase === 'queueing'
                ? copy.searching
                : room.state.phase === 'reconnecting'
                ? copy.reconnecting
                : room.state.phase === 'awaiting-snapshot'
                ? copy.receiving
                : copy.connecting}</strong>
              <GameButton size="sm" variant="ghost" onClick={room.leave}>{copy.cancel}</GameButton>
            </div>
          ) : null}
          {room.state.error && !matchRecoveryAvailable && <p className="echo-network-error" role="alert">{room.state.error}</p>}
        </div>
      )}
    </section>
  );
}
