import type {
  StoryPuzzleActivity,
  StoryPuzzleActivityKind,
} from '../story-puzzles/storyPuzzleContracts';
import type { NetworkLocale } from '../echo-network/contracts';

/**
 * A presentation-only event shape shared by the companion, puzzle feedback,
 * and future server-side Echo Agent. It deliberately carries no answer,
 * reward, or profile mutation payload.
 */
export interface EchoEventEnvelope {
  id: string;
  kind: StoryPuzzleActivityKind | 'objective-updated' | 'chess-move-completed';
  sourceId?: string;
  occurredAt: number;
  authority: 'server-receipt' | 'local-ui';
  payloadVersion: 1;
}

export type EchoExpression =
  | 'calm'
  | 'curious'
  | 'concerned'
  | 'focused'
  | 'celebrating';

export type EchoGesture =
  | 'idle'
  | 'look'
  | 'point'
  | 'encourage'
  | 'celebrate';

/**
 * A cue can guide a player to an already-authorized route, but cannot perform
 * navigation or change gameplay. The server remains the source of rewards and
 * progression; the cue only reacts to that state.
 */
export interface EchoCue {
  cueId: string;
  source: 'authored' | 'deterministic' | 'ai';
  text: string;
  caption: string;
  expression: EchoExpression;
  gesture: EchoGesture;
  suggestedRoute?: 'memories' | 'puzzles' | 'echo-mind';
  cooldownMs: number;
}

const COPY = {
  ar: {
    idle: 'أنا هنا. اتبع الهدف الحالي عندما تكون مستعدًا.',
    idleCaption: 'إيكو يراقب الإشارة التالية بهدوء.',
    read: 'الأثر التالي موجود في الأرشيف. اقرأه أولًا، ثم نختبر ما وجدته.',
    readCaption: 'إيكو يشير إلى صفحة المانهوا التالية.',
    solve: 'الدليل جاهز. لا تخمّن؛ جرّب الفرضية التي لاحظتها.',
    solveCaption: 'إيكو يثبت نظره على قناة اللغز.',
    encourage: 'المحاولة لم تغيّر السجل. خذ لحظة واقرأ العلاقة مرة أخرى.',
    encourageCaption: 'إيكو يهدئ الإشارة دون أن يكشف الحل.',
    hint: 'التلميح يوضح المبدأ فقط. قرارك ما زال هو الذي يفتح الإشارة.',
    hintCaption: 'إيكو يحمي مساحة الاكتشاف.',
    reward: 'التقطت الشظية. تغيّر السجل؛ الدليل التالي ينتظرنا.',
    rewardCaption: 'إيكو يستجيب لوصول إيصال موثّق.',
    secret: 'هناك شيء انفتح خارج المسار المعتاد. لا نحتاج مطاردته الآن.',
    secretCaption: 'إيكو يلاحظ شذوذًا هادئًا في الذاكرة.',
    chapter: 'هذا الفصل أصبح جزءًا منا الآن. لنبحث عن الإشارة التالية بهدوء.',
    chapterCaption: 'إيكو يستقر بعد اكتمال فصل موثّق.',
    all: 'اكتملت الشظايا. ما خرج من الذاكرة صار طريقًا إلى الخارج.',
    allCaption: 'إيكو يحتفل دون ادعاء مكافأة جديدة.',
    chess: 'نقلة واضحة. سأقرأ الرقعة معك، لكن قرار اللعب يبقى لك.',
    chessCaption: 'إيكو يتابع الرقعة بعد نقلة قانونية.',
  },
  en: {
    idle: 'I am here. Follow the current objective when you are ready.',
    idleCaption: 'Echo watches the next signal quietly.',
    read: 'The next trace is in the archive. Read it first, then we can test what you found.',
    readCaption: 'Echo points toward the next Manhwa page.',
    solve: 'The evidence is ready. Do not guess; test the hypothesis you noticed.',
    solveCaption: 'Echo focuses on the puzzle channel.',
    encourage: 'The attempt did not change the record. Take a moment and read the relationship again.',
    encourageCaption: 'Echo steadies the signal without revealing the answer.',
    hint: 'The hint explains the principle only. Your decision still opens the signal.',
    hintCaption: 'Echo protects the space for discovery.',
    reward: 'I caught the shard. The record changed; the next clue is waiting.',
    rewardCaption: 'Echo reacts to a verified receipt arriving.',
    secret: 'Something opened outside the usual path. We do not have to chase it yet.',
    secretCaption: 'Echo notices a quiet anomaly in the memory.',
    chapter: 'This chapter is part of us now. Let us find the next signal carefully.',
    chapterCaption: 'Echo settles after a verified chapter completion.',
    all: 'The shards are complete. What left the memory has become a path outward.',
    allCaption: 'Echo celebrates without claiming a new reward.',
    chess: 'A clear move. I will read the board with you, but the decision is still yours.',
    chessCaption: 'Echo follows the board after a legal move.',
  },
} as const;

function cue(
  locale: NetworkLocale,
  key: keyof typeof COPY.ar,
  expression: EchoExpression,
  gesture: EchoGesture,
  suggestedRoute?: EchoCue['suggestedRoute'],
): EchoCue {
  const copy = COPY[locale] ?? COPY.ar;
  return {
    cueId: `echo-${key}`,
    source: 'deterministic',
    text: copy[key],
    caption: copy[`${key}Caption` as keyof typeof copy] ?? copy.idleCaption,
    expression,
    gesture,
    ...(suggestedRoute ? { suggestedRoute } : {}),
    cooldownMs: key === 'reward' || key === 'all' ? 5_000 : 12_000,
  };
}

/**
 * Produces safe player-facing guidance from verified activity. This is
 * intentionally deterministic: AI can enrich a cue later, but never becomes
 * the authority for a route, puzzle result, reward, or chess move.
 */
export function resolveEchoCue(
  event: EchoEventEnvelope | StoryPuzzleActivity | null,
  locale: NetworkLocale = 'ar',
  objectiveKind: 'read' | 'solve' | 'complete' = 'read',
): EchoCue {
  switch (event?.kind) {
    case 'main-puzzle-solved':
    case 'memory-shard-acquired':
    case 'perfect-solve':
      return cue(locale, 'reward', 'celebrating', 'celebrate', 'memories');
    case 'secret-puzzle-solved':
    case 'secret-puzzle-discovered':
      return cue(locale, 'secret', 'curious', 'look', 'puzzles');
    case 'puzzle-attempt-rejected':
      return cue(locale, 'encourage', 'concerned', 'encourage', 'puzzles');
    case 'hint-used':
      return cue(locale, 'hint', 'focused', 'look', 'puzzles');
    case 'chapter-completed':
    case 'all-chapter-shards-found':
      return cue(locale, 'chapter', 'celebrating', 'celebrate', 'memories');
    case 'all-20-shards-found':
      return cue(locale, 'all', 'celebrating', 'celebrate', 'memories');
    case 'chess-move-completed':
      return cue(locale, 'chess', 'focused', 'look');
    default:
      return objectiveKind === 'solve'
        ? cue(locale, 'solve', 'focused', 'point', 'puzzles')
        : cue(locale, 'read', 'curious', 'point', 'memories');
  }
}

export function toEchoEventEnvelope(
  activity: StoryPuzzleActivity,
): EchoEventEnvelope {
  return {
    id: `${activity.kind}:${activity.puzzleId ?? activity.sourceId ?? activity.occurredAt}`,
    kind: activity.kind,
    sourceId: activity.sourceId ?? activity.puzzleId,
    occurredAt: activity.occurredAt,
    authority: activity.kind === 'puzzle-attempt-rejected' || activity.kind === 'login-session-start'
      ? 'local-ui'
      : 'server-receipt',
    payloadVersion: 1,
  };
}
