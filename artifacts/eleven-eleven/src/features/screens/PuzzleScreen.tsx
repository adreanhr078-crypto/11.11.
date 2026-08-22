import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  BookOpenCheck,
  Check,
  ChevronLeft,
  CircleHelp,
  Clapperboard,
  Coins,
  Crosshair,
  LockKeyhole,
  RotateCcw,
  ScanLine,
  Sparkles,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import {
  STORY_PUZZLE_BY_ID,
  STORY_PUZZLES,
} from '../../content/puzzles/storyPuzzleCatalog';
import type {
  StoryPuzzleDefinition,
  StoryPuzzleDraft,
  StoryPuzzleMechanic,
  StoryPuzzleOption,
  StoryPuzzleReference,
  StoryPuzzleSignalConfig,
  StoryPuzzleSnapshotEntry,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useCollectionStore } from '../collection/collectionStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import {
  appendUniqueRouteToken,
  isLoadBalanceReady,
  loadBalanceTotal,
  normalizeLoadBalanceAssignments,
  readSignalSelection,
  removeRouteTokenAt,
  swapPuzzlePieces,
  toggleSignalSelection,
} from '../story-puzzles/verticalSliceInteractions';
import {
  useShellStore,
  useUiPreferencesStore,
} from '../../app/shell/shellStore';
import { deriveCorePlayerObjective } from '../../application/player-journey/corePlayerLoop';
import {
  playPuzzleCompletionSound,
  primeRewardAudio,
} from '../../infrastructure/audio/puzzleRewardAudio';
import { requestEchoTransformationCinematic } from '../../ui/presentation/EchoTransformationCinematic';
import { EchoPresence } from '../../ui/presentation/EchoPresence';
import { emitExperienceCue } from '../../ui/presentation/experienceCues';
import './story-puzzle-experience.css';

const EMPTY_STORY_PUZZLE_ENTRIES: readonly StoryPuzzleSnapshotEntry[] = Object.freeze([]);
const MATRIX_TILE_IDS = ['tile1', 'tile2', 'tile3', 'tile4'] as const;
const MEMORY_LAYER_IDS = ['layer1', 'layer2', 'layer3', 'layer4'] as const;

const emptyDraft = (): StoryPuzzleDraft => ({
  stageIndex: 0,
  tokens: [],
  assignments: {},
  imageOrder: [],
  rotations: {},
});

function hasPuzzleDraftInput(draft: StoryPuzzleDraft): boolean {
  return (
    draft.tokens.length > 0
    || draft.imageOrder.length > 0
    || Object.keys(draft.assignments).some((key) => key !== '__stages')
    || Object.keys(draft.rotations).length > 0
  );
}

function shuffledPieces(count: number): string[] {
  const pieces = Array.from({ length: count }, (_, index) => `piece-${index}`);
  // Deterministic enough to persist sensibly on reload, while never beginning
  // already solved for the images used by this campaign.
  return pieces.map((_, index) => pieces[(index * 5 + 2) % count]!);
}

function defaultDraft(puzzle: StoryPuzzleDefinition): StoryPuzzleDraft {
  if (puzzle.mechanic === 'matrix') {
    return {
      ...emptyDraft(),
      rotations: {},
    };
  }
  if (puzzle.mechanic === 'layer-alignment') {
    return {
      ...emptyDraft(),
      rotations: {},
    };
  }
  if (puzzle.mechanic === 'load-balancing') {
    return {
      ...emptyDraft(),
      assignments: normalizeLoadBalanceAssignments({}),
    };
  }
  if (!puzzle.image) return emptyDraft();
  const count = puzzle.image.rows * puzzle.image.columns;
  return {
    ...emptyDraft(),
    imageOrder: shuffledPieces(count),
    rotations: Object.fromEntries(
      Array.from({ length: count }, (_, index) => [`piece-${index}`, 0]),
    ),
  };
}

function cloneDraft(draft: StoryPuzzleDraft): StoryPuzzleDraft {
  return {
    stageIndex: draft.stageIndex,
    tokens: [...draft.tokens],
    assignments: { ...draft.assignments },
    imageOrder: [...draft.imageOrder],
    rotations: { ...draft.rotations },
  };
}

function normalizePuzzleDraft(
  puzzle: StoryPuzzleDefinition,
  draft: StoryPuzzleDraft,
): StoryPuzzleDraft {
  const normalized = cloneDraft(draft);
  if (puzzle.mechanic !== 'load-balancing') return normalized;
  return {
    ...normalized,
    assignments: normalizeLoadBalanceAssignments(normalized.assignments),
  };
}

function parseStages(
  puzzle: StoryPuzzleDefinition,
  draft: StoryPuzzleDraft,
): StoryPuzzleDraft[] {
  const count = puzzle.stages?.length ?? 0;
  if (count === 0) return [];
  try {
    const parsed = JSON.parse(draft.assignments.__stages ?? '[]') as unknown;
    if (Array.isArray(parsed) && parsed.length === count) {
      return parsed.map((entry) => {
        if (!entry || typeof entry !== 'object') return emptyDraft();
        const candidate = entry as Partial<StoryPuzzleDraft>;
        return {
          stageIndex: 0,
          tokens: Array.isArray(candidate.tokens) ? candidate.tokens.filter((value): value is string => typeof value === 'string') : [],
          assignments: candidate.assignments && typeof candidate.assignments === 'object' && !Array.isArray(candidate.assignments)
            ? Object.fromEntries(Object.entries(candidate.assignments).filter(([, value]) => typeof value === 'string')) as Record<string, string>
            : {},
          imageOrder: Array.isArray(candidate.imageOrder) ? candidate.imageOrder.filter((value): value is string => typeof value === 'string') : [],
          rotations: candidate.rotations && typeof candidate.rotations === 'object' && !Array.isArray(candidate.rotations)
            ? Object.fromEntries(Object.entries(candidate.rotations).filter(([, value]) => typeof value === 'number')) as Record<string, number>
            : {},
        };
      });
    }
  } catch {
    // A malformed temporary save is safely replaced with an empty local draft.
  }
  return Array.from({ length: count }, () => emptyDraft());
}

function composeStageDraft(
  draft: StoryPuzzleDraft,
  stageIndex: number,
  stages: StoryPuzzleDraft[],
): StoryPuzzleDraft {
  return {
    ...emptyDraft(),
    stageIndex,
    assignments: { __stages: JSON.stringify(stages) },
  };
}

function selectedTokens(
  current: readonly string[],
  optionId: string,
  maximum: number,
  allowRepeated = false,
): string[] {
  if (!allowRepeated && current.includes(optionId)) {
    return current.filter((token) => token !== optionId);
  }
  // A full sequence is a player decision, not a rolling input buffer. Dropping
  // the earliest symbol made ordered puzzles appear to ignore a tap.
  if (current.length >= maximum) return [...current];
  return [...current, optionId];
}

/** Mirrors selectedTokens so a full hypothesis never looks like a dead tap. */
function tokenOptionUnavailable(
  current: readonly string[],
  optionId: string,
  maximum: number,
  allowRepeated = false,
): boolean {
  return current.length >= maximum && (allowRepeated || !current.includes(optionId));
}

function sequenceLimit(mechanic: StoryPuzzleMechanic, tokenLimit?: number): number {
  if (tokenLimit !== undefined) return tokenLimit;
  switch (mechanic) {
    case 'cipher':
    case 'mirror-code': return 3;
    case 'evidence':
    case 'pattern-scan':
    case 'contradiction': return 1;
    case 'visual-forensics': return 2;
    case 'deduction': return 3;
    default: return 4;
  }
}

function draftReadiness(
  puzzle: StoryPuzzleDefinition,
  mechanic: Exclude<StoryPuzzleMechanic, 'multi-stage' | 'breach-protocol'>,
  draft: StoryPuzzleDraft,
  tokenLimit?: number,
  stageOptions?: readonly StoryPuzzleOption[],
  locale: 'ar' | 'en' = 'ar',
): { ready: boolean; message: string } {
  const limit = sequenceLimit(mechanic, tokenLimit);
  const complete = (ready: boolean, message: string) => ({ ready, message });
  if (locale === 'en') {
    if (mechanic === 'signal') {
      return complete(
        draft.tokens.length === 2,
        'Choose one reading and one channel, then submit them to the record for verification.',
      );
    }
    if (mechanic === 'image-reconstruction') {
      const count = (puzzle.image?.rows ?? 0) * (puzzle.image?.columns ?? 0);
      return complete(
        new Set(draft.imageOrder).size === count && draft.imageOrder.length === count,
        'Arrange every shard as you see it, then submit the record for verification. Piece correctness remains hidden until submission.',
      );
    }
    if (mechanic === 'sequence') {
      return complete(
        draft.tokens.length === limit,
        `Place the ${limit} symbols in the order supported by the record.`,
      );
    }
    switch (mechanic) {
      case 'wiring': {
        const accessNodeLock = stageOptions?.some((option) => option.id === 'echo');
        const sources = accessNodeLock ? ['access'] : assignmentSources(mechanic);
        return complete(sources.every((source) => Boolean(draft.assignments[source])), 'Connect every route before submitting the record.');
      }
      case 'color-routing':
        return complete(assignmentSources(mechanic).every((source) => Boolean(draft.assignments[source])), 'Match all three channels to their shapes before submitting the record.');
      case 'matrix':
        return complete(MATRIX_TILE_IDS.every((tile) => draft.rotations[tile] !== undefined), 'Rotate every node, then submit the matrix for server verification.');
      case 'layer-alignment':
        return complete(MEMORY_LAYER_IDS.every((layer) => draft.rotations[layer] !== undefined), 'Adjust every layer, then submit the record for server verification.');
      case 'load-balancing': {
        const total = loadBalanceTotal(draft.assignments);
        return complete(
          isLoadBalanceReady(draft.assignments),
          total !== 100
            ? `The current total is ${total}%. Set the channels to 100% before submitting.`
            : 'The total is 100%. Submit the attempt; the server record verifies the final balance.',
        );
      }
      case 'visual-forensics':
        return complete(draft.tokens.length === 2, 'Mark two anomaly positions in the record.');
      case 'memory-grid':
        return complete(draft.tokens.length === limit, `Repeat ${limit} pulses in order.`);
      case 'pattern-scan':
        return complete(draft.tokens.length === limit, 'Select the one anomaly node.');
      case 'data-route':
        return complete(draft.tokens.length === limit, `Build a ${limit}-node route.`);
      case 'evidence':
      case 'contradiction':
        return complete(draft.tokens.length === 1, 'Choose one record supported by the evidence.');
      case 'deduction':
        return complete(draft.tokens.length === limit, `Lock ${limit} compatible evidence records.`);
      default:
        return complete(draft.tokens.length === limit, `Complete a ${limit}-symbol sequence.`);
    }
  }
  switch (mechanic) {
    case 'signal':
      return complete(
        draft.tokens.length === 2,
        'اختر قياسًا وقناة ثم أرسلهما إلى السجل للتحقق.',
      );
    case 'image-reconstruction': {
      const count = (puzzle.image?.rows ?? 0) * (puzzle.image?.columns ?? 0);
      return complete(
        new Set(draft.imageOrder).size === count && draft.imageOrder.length === count,
        'رتّب كل الشظايا كما تراها، ثم أرسل السجل للتحقق. لن تظهر صحة القطع قبل الإرسال.',
      );
    }
    case 'wiring': {
      const accessNodeLock = stageOptions?.some((option) => option.id === 'echo');
      const sources = accessNodeLock ? ['access'] : assignmentSources(mechanic);
      return complete(sources.every((source) => Boolean(draft.assignments[source])), 'أكمل توصيل كل المسارات.');
    }
    case 'color-routing':
      return complete(assignmentSources(mechanic).every((source) => Boolean(draft.assignments[source])), 'طابق القنوات الثلاث مع أشكالها.');
    case 'matrix':
      return complete(
        MATRIX_TILE_IDS.every((tile) => draft.rotations[tile] !== undefined),
        'دوّر كل عقدة، ثم أرسل محاولتك للتحقق الخادمي.',
      );
    case 'layer-alignment':
      return complete(
        MEMORY_LAYER_IDS.every((layer) => draft.rotations[layer] !== undefined),
        'اضبط كل طبقة، ثم أرسل محاولتك للتحقق الخادمي.',
      );
    case 'load-balancing': {
      const total = loadBalanceTotal(draft.assignments);
      return complete(
        isLoadBalanceReady(draft.assignments),
        total !== 100
          ? (locale === 'ar'
            ? `المجموع الحالي ${total}%. اجعل مجموع القنوات 100% قبل إرسال المحاولة.`
            : `The current total is ${total}%. Set the channels to 100% before submitting.`)
          : (locale === 'ar'
            ? 'المجموع 100%. أرسل المحاولة؛ السجل الخادمي يتحقق من التوازن النهائي.'
            : 'The total is 100%. Submit the attempt; the server record verifies the final balance.'),
      );
    }
    case 'visual-forensics':
      return complete(draft.tokens.length === 2, 'حدّد موضعي الشذوذ في السجل.');
    case 'memory-grid':
      return complete(draft.tokens.length === limit, `أعد ${limit} نبضات بالترتيب.`);
    case 'pattern-scan':
      return complete(draft.tokens.length === limit, 'حدّد عقدة الشذوذ الوحيدة.');
    case 'data-route':
      return complete(draft.tokens.length === limit, `ابنِ مسارًا من ${limit} عقد.`);
    case 'evidence':
    case 'contradiction':
      return complete(draft.tokens.length === 1, 'اختر سجلًا واحدًا تدعمه الأدلة.');
    case 'deduction':
      return complete(draft.tokens.length === limit, `ثبّت ${limit} أدلة متوافقة.`);
    default:
      return complete(draft.tokens.length === limit, `أكمل التسلسل من ${limit} رموز.`);
  }
}

function sourceOptions(puzzle: StoryPuzzleDefinition): readonly StoryPuzzleOption[] {
  return puzzle.options ?? [
    { id: 'signal', label: { ar: 'إشارة', en: 'Signal' }, symbol: '⌁' },
    { id: 'memory', label: { ar: 'ذاكرة', en: 'Memory' }, symbol: '◇' },
    { id: 'access', label: { ar: 'وصول', en: 'Access' }, symbol: '⌘' },
    { id: 'echo', label: { ar: 'Echo', en: 'Echo' }, symbol: '◉' },
  ];
}

function statusLabel(status: StoryPuzzleSnapshotEntry['status'], locale: 'ar' | 'en'): string {
  if (locale === 'en') {
    return {
      available: 'AVAILABLE',
      in_progress: 'IN PROGRESS',
      completed: 'COMPLETE',
      locked: 'LOCKED',
      hidden: 'HIDDEN SIGNAL',
    }[status];
  }
  switch (status) {
    case 'available': return 'متاح';
    case 'in_progress': return 'قيد الاستعادة';
    case 'completed': return 'مكتمل';
    case 'locked': return 'مقفل';
    default: return 'إشارة مخفية';
  }
}

function retryGuidance(mechanic: StoryPuzzleMechanic, locale: 'ar' | 'en'): string {
  if (locale === 'en') {
    switch (mechanic) {
      case 'signal':
        return 'Read the wave shape first, then reconsider the channel. Change only one choice at a time.';
      case 'image-reconstruction':
        return 'Anchor the outer edges first, then review one piece and its rotation before making another swap.';
      case 'memory-grid':
        return 'Replay the rhythm in short passes; do not replace the whole sequence at once.';
      case 'pattern-scan':
      case 'visual-forensics':
        return 'Inspect the relation inside each element, not its color or position alone.';
      case 'evidence':
      case 'contradiction':
      case 'deduction':
        return 'Return to one clue and identify what it proves before changing your choice.';
      case 'matrix':
      case 'layer-alignment':
        return 'Choose one stable reference, then adjust one element at a time.';
      case 'wiring':
      case 'color-routing':
      case 'load-balancing':
        return 'Lock one clear constraint first, then observe what it changes in the remaining route.';
      case 'data-route':
      case 'cipher':
      case 'mirror-code':
        return 'Begin with one confirmed point in the reference, then verify only the next step.';
      default:
        return 'Review one clue, then change one choice in your next attempt.';
    }
  }
  switch (mechanic) {
    case 'signal':
      return 'اقرأ شكل النبضة أولًا، ثم راجع اختيار القناة. غيّر اختيارًا واحدًا فقط.';
    case 'image-reconstruction':
      return 'ثبّت الحواف أولًا، ثم راجع قطعة واحدة واتجاهها قبل أي تبديل جديد.';
    case 'memory-grid':
      return 'أعِد الإيقاع على دفعات قصيرة؛ لا تغيّر التسلسل كله دفعةً واحدة.';
    case 'pattern-scan':
    case 'visual-forensics':
      return 'افحص العلاقة داخل كل عنصر، لا اللون أو الموضع وحده.';
    case 'evidence':
    case 'contradiction':
    case 'deduction':
      return 'ارجع إلى دليل واحد وحدد ما الذي يثبته قبل تغيير اختيارك.';
    case 'matrix':
    case 'layer-alignment':
      return 'اختر مرجعًا ثابتًا ثم اضبط عنصرًا واحدًا في كل مرة.';
    case 'wiring':
    case 'color-routing':
    case 'load-balancing':
      return 'ثبّت قيدًا واحدًا واضحًا أولًا، ثم راقب أثره على بقية المسار.';
    case 'data-route':
    case 'cipher':
    case 'mirror-code':
      return 'ابدأ من نقطة مؤكدة في المرجع، ثم راجع ترتيب الخطوة التالية فقط.';
    default:
      return 'راجع دليلًا واحدًا فقط، ثم غيّر اختيارًا واحدًا في المحاولة التالية.';
  }
}

function assignmentSources(mechanic: StoryPuzzleMechanic): string[] {
  if (mechanic === 'color-routing') return ['triangle', 'square', 'circle'];
  if (mechanic === 'wiring') return ['power', 'data', 'memory'];
  return ['access'];
}

function assignmentTargets(mechanic: StoryPuzzleMechanic): StoryPuzzleOption[] {
  if (mechanic === 'color-routing') return [
    { id: 'triangle', label: { ar: 'مثلث △', en: 'Triangle △' } },
    { id: 'square', label: { ar: 'مربع □', en: 'Square □' } },
    { id: 'circle', label: { ar: 'دائرة ○', en: 'Circle ○' } },
  ];
  if (mechanic === 'wiring') return [
    { id: 'terminal-wave', label: { ar: 'طرف ⌁', en: '⌁ terminal' } },
    { id: 'terminal-access', label: { ar: 'طرف ⌘', en: '⌘ terminal' } },
    { id: 'terminal-memory', label: { ar: 'طرف ◇', en: '◇ terminal' } },
  ];
  return [
    { id: 'echo', label: { ar: 'عقدة Echo', en: 'Echo node' } },
    { id: 'memory', label: { ar: 'عقدة الذاكرة', en: 'Memory node' } },
    { id: 'access', label: { ar: 'عقدة الوصول', en: 'Access node' } },
  ];
}

function recordSignal(optionId: string, locale: 'ar' | 'en'): string {
  void optionId;
  return locale === 'ar'
    ? 'عقدة دليل // افحص السجل المرجعي'
    : 'EVIDENCE NODE // INSPECT SOURCE RECORD';
}

const MEMORY_GRID_PULSE_PATTERN = ['a1', 'b2', 'c3', 'b2'] as const;

function EvidenceBoard({
  mechanic,
  options,
  draft,
  onChange,
  disabled,
}: {
  mechanic: Extract<StoryPuzzleMechanic, 'evidence' | 'contradiction' | 'deduction'>;
  options: readonly StoryPuzzleOption[];
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
}) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const selected = draft.tokens;
  const maximum = mechanic === 'deduction' ? 3 : 1;
  const copy = locale === 'ar'
    ? {
      board: 'لوحة الأدلة الموثقة',
      synthesis: 'تركيب الأدلة',
      comparison: 'مقارنة السجلات',
      records: 'السجلات المتاحة',
      record: (index: number, label: string) => `السجل ${String(index + 1).padStart(2, '0')}: ${label}`,
      deduction: 'حدّد الأدلة المتوافقة، ثم ثبّت تسلسلها في السجل. يمكنك إلغاء أي اختيار قبل الإرسال.',
      comparisonHint: 'قارن السجل مع المرجع قبل تثبيت النتيجة. يمكنك إلغاء أي اختيار قبل الإرسال.',
    }
    : {
      board: 'Verified evidence board',
      synthesis: 'EVIDENCE SYNTHESIS',
      comparison: 'RECORD COMPARISON',
      records: 'Available records',
      record: (index: number, label: string) => `Record ${String(index + 1).padStart(2, '0')}: ${label}`,
      deduction: 'Select compatible evidence, then arrange it in the record. You can remove any choice before submitting.',
      comparisonHint: 'Compare the record with the reference before committing. You can remove any choice before submitting.',
    };
  return (
    <section
      className="story-evidence-board"
      data-mode={mechanic}
      aria-label={copy.board}
    >
      <header>
        <ScanLine aria-hidden="true" />
        <span>{mechanic === 'deduction' ? copy.synthesis : copy.comparison}</span>
      </header>
      <div role="group" aria-label={copy.records}>
        {options.map((option, index) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || tokenOptionUnavailable(selected, option.id, maximum)}
              data-selected={isSelected}
              aria-pressed={isSelected}
              aria-label={copy.record(index, option.label[locale])}
              onClick={() => onChange({
                ...draft,
                tokens: selectedTokens(selected, option.id, maximum),
              })}
            >
              <small>NODE {String(index + 1).padStart(2, '0')}</small>
              <strong>{option.label[locale]}</strong>
              {option.detail && <span>{option.detail[locale]}</span>}
              <span>{recordSignal(option.id, locale)}</span>
            </button>
          );
        })}
      </div>
      <p>{mechanic === 'deduction' ? copy.deduction : copy.comparisonHint}</p>
    </section>
  );
}

function PuzzleReference({ reference }: { reference?: StoryPuzzleReference }) {
  const locale = useUiPreferencesStore((state) => state.locale);
  if (!reference) return null;
  return (
    <section className="story-puzzle-reference" aria-label={reference.title[locale]}>
      <header>
        <BookOpenCheck aria-hidden="true" />
        <span>{reference.title[locale]}</span>
        <small>FIELD NOTES</small>
      </header>
      <ul>
        {reference.entries.map((entry, index) => (
          <li key={`${entry.en}-${index}`}>{entry[locale]}</li>
        ))}
      </ul>
    </section>
  );
}

function PatternScanBoard({
  draft,
  onChange,
  disabled,
}: Pick<PuzzleMechanicProps, 'draft' | 'onChange' | 'disabled'>) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const cells = [
    ['a1', '↗'], ['a2', '↗'], ['a3', '↗'],
    ['b1', '↗'], ['b2', '↗'], ['b3', '↗'],
    ['c1', '↗'], ['c2', '↗'], ['c3', '↗'],
    ['d1', '↗'], ['d2', '↗'], ['d3', '↘'],
  ] as const;
  const copy = locale === 'ar'
    ? {
      board: 'ماسح نمط الشذوذ',
      heading: 'فحص النمط // ابحث عن الانحراف الاتجاهي',
      node: (label: string, direction: string) => `العقدة ${label}، اتجاهها ${direction}`,
      instruction: 'لا تعتمد على اللون وحده؛ افحص اتجاه كل عقدة. اضغط العقدة نفسها مرة ثانية لتبديل اختيارك.',
    }
    : {
      board: 'Anomaly pattern scanner',
      heading: 'PATTERN SCAN // FIND THE DIRECTIONAL BREACH',
      node: (label: string, direction: string) => `Node ${label}, direction ${direction}`,
      instruction: 'Do not rely on color alone; inspect every node direction. Select the same node again to toggle your choice.',
    };
  return (
    <section className="story-pattern-scan" aria-label={copy.board}>
      <header><ScanLine aria-hidden="true" /> {copy.heading}</header>
      <div>
        {cells.map(([cell, direction]) => {
          const display = cell.toUpperCase();
          return (
            <button
              key={cell}
              type="button"
              disabled={disabled || tokenOptionUnavailable(draft.tokens, cell, 1)}
              data-selected={draft.tokens.includes(cell)}
              aria-pressed={draft.tokens.includes(cell)}
              aria-label={copy.node(display, direction)}
              onClick={() => onChange({
                ...draft,
                tokens: selectedTokens(draft.tokens, cell, 1),
              })}
            >
              <i>{direction}</i><span>{display}</span>
            </button>
          );
        })}
      </div>
      <p>{copy.instruction}</p>
    </section>
  );
}

function DataRouteBoard({
  options,
  draft,
  onChange,
  disabled,
  tokenLimit,
}: {
  options: readonly StoryPuzzleOption[];
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
  tokenLimit?: number;
}) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const maximum = tokenLimit ?? 4;
  const copy = locale === 'ar'
    ? {
      board: 'مخطط توجيه البيانات',
      heading: 'حزمة المسار // اختر ترتيبًا آمنًا',
      empty: 'بانتظار بناء المسار',
      nodes: 'عقد المسار المتاحة',
      node: (label: string) => `عقدة ${label}`,
      clear: 'مسح المسار وإعادة بنائه',
      clearLabel: 'إعادة بناء المسار',
    }
    : {
      board: 'Data routing graph',
      heading: 'ROUTE PACKET // SELECT A SAFE ORDER',
      empty: 'AWAITING ROUTE',
      nodes: 'Available route nodes',
      node: (label: string) => `Node ${label}`,
      clear: 'Clear route and rebuild it',
      clearLabel: 'Rebuild route',
    };
  return (
    <section className="story-data-route" aria-label={copy.board}>
      <header><Crosshair aria-hidden="true" /> {copy.heading}</header>
      <div className="story-data-route__path" aria-live="polite">
        {draft.tokens.length > 0
          ? draft.tokens.map((token) => token.toUpperCase()).join(' → ')
          : copy.empty}
      </div>
      <div className="story-data-route__nodes" role="group" aria-label={copy.nodes}>
        {options.map((option, index) => {
          const isSelected = draft.tokens.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || tokenOptionUnavailable(draft.tokens, option.id, maximum)}
              data-selected={isSelected}
              aria-pressed={isSelected}
              aria-label={copy.node(option.label[locale])}
              style={{ '--node': index } as CSSProperties}
              onClick={() => onChange({
                ...draft,
                tokens: selectedTokens(draft.tokens, option.id, maximum),
              })}
            >
              <strong>{option.label[locale]}</strong>
              {option.detail && <small>{option.detail[locale]}</small>}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="story-data-route__clear"
        aria-label={copy.clear}
        disabled={disabled || draft.tokens.length === 0}
        onClick={() => onChange({ ...draft, tokens: [] })}
      >
        {copy.clearLabel}
      </button>
    </section>
  );
}

type PuzzleVisualAssetStatus = 'loading' | 'ready' | 'failed';

function usePuzzleVisualAsset(source?: string) {
  const [assetStatus, setAssetStatus] = useState<PuzzleVisualAssetStatus>(source ? 'loading' : 'failed');
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    if (!source) {
      setAssetStatus('failed');
      return undefined;
    }
    let active = true;
    setAssetStatus('loading');
    // CSS background slices do not reliably surface their load result to
    // React, especially when the source is already cached. A detached probe
    // gives the playable board one bounded, browser-native source of truth.
    const probe = new Image();
    probe.onload = () => {
      if (active) setAssetStatus('ready');
    };
    probe.onerror = () => {
      if (active) setAssetStatus('failed');
    };
    probe.src = source;
    return () => {
      active = false;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [source, retryVersion]);

  return {
    assetKey: `${source ?? 'missing'}:${retryVersion}`,
    assetStatus,
    onAssetError: () => setAssetStatus('failed'),
    onAssetLoad: () => setAssetStatus('ready'),
    retryAsset: source
      ? () => {
        setAssetStatus('loading');
        setRetryVersion((version) => version + 1);
      }
      : undefined,
  };
}

function PuzzleVisualFallback({
  title,
  detail,
  retryLabel,
  onRetry,
  disabled,
}: {
  title: string;
  detail: string;
  retryLabel: string;
  onRetry?: () => void;
  disabled: boolean;
}) {
  return (
    <div className="story-puzzle-visual-fallback" role="alert" aria-live="assertive">
      <TriangleAlert aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      {onRetry && (
        <button type="button" disabled={disabled} onClick={onRetry}>
          <RotateCcw aria-hidden="true" /> {retryLabel}
        </button>
      )}
    </div>
  );
}

interface ImageReconstructionBoardProps {
  puzzle: StoryPuzzleDefinition;
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
  onVisualAssetStateChange?: (status: PuzzleVisualAssetStatus) => void;
}

function ImageReconstructionBoard({
  puzzle,
  draft,
  onChange,
  disabled,
  onVisualAssetStateChange,
}: ImageReconstructionBoardProps) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const image = puzzle.image!;
  const count = image.rows * image.columns;
  const pieces = draft.imageOrder.length === count ? draft.imageOrder : shuffledPieces(count);
  const {
    assetKey,
    assetStatus,
    onAssetError,
    onAssetLoad,
    retryAsset,
  } = usePuzzleVisualAsset(image.src);
  const imageCopy = locale === 'ar'
    ? {
      board: 'تركيب الصورة',
      piece: 'قطعة',
      rotate: 'تدوير القطعة',
      instruction: 'اضغط قطعة لتحديدها، ثم اضغط قطعة أخرى لتبديلهما. السحب تحسين اختياري على الكمبيوتر.',
      rotationHint: 'استخدم رمز التدوير عند الحاجة.',
      awaiting: 'اختر قطعة لتبدأ المطابقة.',
      selected: 'تم تحديد القطعة {piece}. اختر قطعة أخرى لتبديلهما، أو اضغطها مرة ثانية لإلغاء التحديد.',
      swapped: 'تم تبديل القطعتين. افحص الحواف التالية.',
      loading: 'يجري تحميل سجل الذاكرة. ستُفتح القطع بعد اكتمال التحميل.',
      unavailableTitle: 'سجل الذاكرة غير متاح',
      unavailableDetail: 'لم تتمكن محطة الاستعادة من تحميل المصدر البصري. لن يُرسل أي حل حتى عودة السجل، لكن يمكنك إعادة المحاولة بأمان.',
      retryAsset: 'إعادة تحميل السجل',
    }
    : {
      board: 'Image reconstruction',
      piece: 'Piece',
      rotate: 'Rotate piece',
      instruction: 'Select one piece, then select another to swap them. Dragging is an optional desktop enhancement.',
      rotationHint: 'Use the rotation control when needed.',
      awaiting: 'Select a piece to begin matching.',
      selected: 'Piece {piece} selected. Choose another piece to swap, or select it again to cancel.',
      swapped: 'Pieces exchanged. Inspect the next edges.',
      loading: 'Loading the memory record. Pieces open after the visual source is ready.',
      unavailableTitle: 'Memory record unavailable',
      unavailableDetail: 'The recovery station could not load this visual source. No attempt can be sent until the record returns, but it is safe to retry the load.',
      retryAsset: 'Retry record load',
    };
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'awaiting' | 'selected' | 'swapped'>('awaiting');

  useEffect(() => {
    onVisualAssetStateChange?.(assetStatus);
  }, [assetStatus, onVisualAssetStateChange]);

  useEffect(() => {
    if (image.allowRotation) return;
    const normalized = Object.fromEntries(
      Array.from({ length: count }, (_, index) => [`piece-${index}`, 0]),
    );
    const needsReset = Object.entries(normalized).some(([pieceId, rotation]) => (
      draft.rotations[pieceId] !== rotation
    ));
    if (needsReset) onChange({ ...draft, rotations: normalized });
  }, [count, draft, image.allowRotation, onChange]);

  const swapPieces = (fromPiece: string, toPiece: string) => {
    if (disabled || assetStatus !== 'ready' || fromPiece === toPiece) return;
    const next = swapPuzzlePieces(pieces, fromPiece, toPiece);
    onChange({ ...draft, imageOrder: next });
    setSelectedPiece(null);
    setLastAction('swapped');
  };

  const rotatePiece = (pieceId: string) => {
    if (disabled || assetStatus !== 'ready' || !image.allowRotation) return;
    onChange({
      ...draft,
      rotations: {
        ...draft.rotations,
        [pieceId]: ((draft.rotations[pieceId] ?? 0) + 1) % 4,
      },
    });
  };

  const selectPiece = (pieceId: string) => {
    if (disabled || assetStatus !== 'ready') return;
    if (!selectedPiece) {
      setSelectedPiece(pieceId);
      setLastAction('selected');
      return;
    }
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      setLastAction('awaiting');
      return;
    }
    swapPieces(selectedPiece, pieceId);
  };
  const selectedSourceIndex = selectedPiece === null ? null : Number(selectedPiece.replace('piece-', '')) + 1;
  const interactionStatus = lastAction === 'selected' && selectedSourceIndex !== null
    ? imageCopy.selected.replace('{piece}', String(selectedSourceIndex))
    : lastAction === 'swapped' ? imageCopy.swapped : imageCopy.awaiting;

  return (
    <section className="story-image-puzzle" data-asset-state={assetStatus} aria-label={imageCopy.board}>
      <img
        key={assetKey}
        className="story-puzzle-visual-asset-probe"
        src={image.src}
        alt=""
        aria-hidden="true"
        onError={onAssetError}
        onLoad={onAssetLoad}
      />
      {assetStatus === 'failed' ? (
        <PuzzleVisualFallback
          title={imageCopy.unavailableTitle}
          detail={imageCopy.unavailableDetail}
          retryLabel={imageCopy.retryAsset}
          onRetry={retryAsset}
          disabled={disabled}
        />
      ) : (
        <>
          {assetStatus === 'loading' && <p className="story-puzzle-visual-loading" role="status">{imageCopy.loading}</p>}
          <div
            className="story-image-puzzle__grid"
            aria-busy={assetStatus === 'loading'}
            style={{
              '--rows': image.rows,
              '--columns': image.columns,
              aspectRatio: image.aspectRatio ?? (2 / 3),
            } as CSSProperties}
          >
            {pieces.map((pieceId) => {
              const sourceIndex = Number(pieceId.replace('piece-', ''));
              const column = sourceIndex % image.columns;
              const row = Math.floor(sourceIndex / image.columns);
              const rotation = draft.rotations[pieceId] ?? 0;
              const interactionDisabled = disabled || assetStatus !== 'ready';
              return (
                <article
                  key={pieceId}
                  className="story-image-puzzle__piece"
                  draggable={!interactionDisabled}
                  data-selected={selectedPiece === pieceId}
                  data-rotation={rotation}
                  onDragStart={(event: DragEvent<HTMLElement>) => {
                    if (interactionDisabled) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData('text/plain', pieceId);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => {
                    if (!interactionDisabled) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!interactionDisabled) swapPieces(event.dataTransfer.getData('text/plain'), pieceId);
                  }}
                >
                  <button
                    type="button"
                    className="story-image-puzzle__art"
                    disabled={interactionDisabled}
                    aria-pressed={selectedPiece === pieceId}
                    aria-label={`${imageCopy.piece} ${sourceIndex + 1}`}
                    aria-describedby="story-image-puzzle-instruction"
                    onClick={() => selectPiece(pieceId)}
                    style={{
                      backgroundImage: `url(${image.src})`,
                      backgroundSize: `${image.columns * 100}% ${image.rows * 100}%`,
                      backgroundPosition: `${(column / Math.max(1, image.columns - 1)) * 100}% ${(row / Math.max(1, image.rows - 1)) * 100}%`,
                      transform: `rotate(${rotation * 90}deg)`,
                    }}
                  />
                  {image.allowRotation && (
                    <button
                      type="button"
                      className="story-image-puzzle__rotate"
                      disabled={interactionDisabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        rotatePiece(pieceId);
                      }}
                      aria-label={`${imageCopy.rotate} ${sourceIndex + 1}`}
                    >
                      <RotateCcw aria-hidden="true" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      <p id="story-image-puzzle-instruction">
        {assetStatus === 'failed'
          ? imageCopy.unavailableDetail
          : `${imageCopy.instruction} ${image.allowRotation ? imageCopy.rotationHint : ''}`}
      </p>
      <p className="story-image-puzzle__status" role="status" aria-live="polite">
        {assetStatus === 'ready' ? interactionStatus : assetStatus === 'loading' ? imageCopy.loading : imageCopy.unavailableTitle}
      </p>
    </section>
  );
}

interface PuzzleMechanicProps {
  puzzle: StoryPuzzleDefinition;
  mechanic: Exclude<
    StoryPuzzleMechanic,
    'multi-stage' | 'breach-protocol'
  >;
  options?: readonly StoryPuzzleOption[];
  tokenLimit?: number;
  signal?: StoryPuzzleSignalConfig;
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
  onVisualAssetStateChange?: (status: PuzzleVisualAssetStatus) => void;
}

function LayerAlignmentBoard({
  puzzle,
  draft,
  onChange,
  disabled,
}: Omit<PuzzleMechanicProps, 'mechanic' | 'options'>) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const layers = MEMORY_LAYER_IDS;
  if (!puzzle.image) return null;
  const copy = locale === 'ar'
    ? {
      board: 'محاذاة طبقات الذاكرة',
      heading: 'محاذاة أطوار الذاكرة',
      layer: (index: number, phase: number) => `الطبقة ${index + 1}، طورها الحالي ${phase}. اضغط لتغيير الطور.`,
      status: (count: number) => `تم تعديل ${count} من 4 طبقات. راقب الفواصل ثم أرسل السجل للتحقق الخادمي.`,
    }
    : {
      board: 'Memory layer alignment',
      heading: 'MEMORY PHASE ALIGNMENT',
      layer: (index: number, phase: number) => `Layer ${index + 1}, current phase ${phase}. Select to change the phase.`,
      status: (count: number) => `${count} of 4 layers adjusted. Inspect the seams, then submit the record for server verification.`,
    };
  return (
    <section className="story-layer-board" aria-label={copy.board}>
      <header>
        <ScanLine aria-hidden="true" />
        <span>{copy.heading}</span>
      </header>
      <div className="story-layer-board__viewport">
        {layers.map((layerId, index) => {
          const phase = draft.rotations[layerId] ?? 0;
          return (
            <button
              key={layerId}
              type="button"
              disabled={disabled}
              data-phase={phase}
              onClick={() => onChange({
                ...draft,
                rotations: {
                  ...draft.rotations,
                  [layerId]: (phase + 1) % 4,
                },
              })}
              aria-label={copy.layer(index, phase)}
            >
              <i
                style={{
                  backgroundImage: `url(${puzzle.image!.src})`,
                  backgroundSize: '100% 400%',
                  backgroundPosition: `center ${(index / 3) * 100}%`,
                  transform: `translateX(${(phase - 1.5) * 3.5}%)`,
                }}
              />
              <span>L{index + 1} // PHASE {phase}</span>
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite">{copy.status(layers.filter((layer) => draft.rotations[layer] !== undefined).length)}</p>
    </section>
  );
}

function LoadBalancingBoard({
  draft,
  onChange,
  disabled,
}: Omit<PuzzleMechanicProps, 'puzzle' | 'mechanic' | 'options'>) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const channels = [
    { id: 'power', label: { ar: 'الطاقة', en: 'Power' }, code: 'PWR' },
    { id: 'data', label: { ar: 'البيانات', en: 'Data' }, code: 'DATA' },
    { id: 'cooling', label: { ar: 'التبريد', en: 'Cooling' }, code: 'COOL' },
  ] as const;
  const total = loadBalanceTotal(draft.assignments);
  const copy = locale === 'ar'
    ? {
      board: 'موازنة حمل النظام',
      heading: 'حمل الطوارئ',
      currentTotal: `المجموع الحالي ${total}%. عدّل القنوات حتى تصل إلى 100%، ثم أرسل السجل للتحقق النهائي.`,
      totalReady: 'وصل المجموع إلى 100%. السجل الخادمي وحده يحسم توازن القنوات.',
      value: (label: string, value: number) => `${label}: ${value}%`,
    }
    : {
      board: 'System load balancing',
      heading: 'Emergency load',
      currentTotal: `Current total ${total}%. Adjust the channels to reach 100%, then submit the record for final verification.`,
      totalReady: 'The total is 100%. Only the server record decides whether the channels are balanced.',
      value: (label: string, value: number) => `${label}: ${value}%`,
    };
  return (
    <section className="story-load-board" aria-label={copy.board}>
      <header>
        <Activity aria-hidden="true" />
        <span>{copy.heading} // <output aria-live="polite">{total}%</output></span>
      </header>
      <div>
        {channels.map((channel) => {
          const value = Number(draft.assignments[channel.id] ?? 20);
          return (
            <label key={channel.id}>
              <span><b>{channel.code}</b><small>{channel.label[locale]}</small><strong>{value}%</strong></span>
              <input
                type="range"
                min="10"
                max="60"
                step="10"
                value={value}
                disabled={disabled}
                aria-label={copy.value(channel.label[locale], value)}
                aria-valuetext={copy.value(channel.label[locale], value)}
                onChange={(event) => onChange({
                  ...draft,
                  assignments: {
                    ...draft.assignments,
                    [channel.id]: event.target.value,
                  },
                })}
              />
            </label>
          );
        })}
      </div>
      <p role="status" aria-live="polite">{total === 100 ? copy.totalReady : copy.currentTotal}</p>
    </section>
  );
}

type SignalProbe = {
  frequency: string;
  scan: string;
  path: string;
  readout: { ar: string; en: string };
};

type SignalChannel = {
  id: string;
  code: string;
  trace: string;
  readout: { ar: string; en: string };
};

const OPENING_SIGNAL_PROBES = [
  {
    frequency: '42',
    scan: 'A',
    path: 'M2 27 C12 11 20 11 30 27 S48 36 58 27 S76 11 86 27 S104 36 118 27',
    readout: { ar: 'Δ↑ 16  //  Δ↓ 9', en: 'Δ↑ 16  //  Δ↓ 9' },
  },
  {
    frequency: '58',
    scan: 'B',
    path: 'M2 27 C12 13 20 13 30 27 S48 41 58 27 S76 13 86 27 S104 41 118 27',
    readout: { ar: 'Δ↑ 14  //  Δ↓ 14', en: 'Δ↑ 14  //  Δ↓ 14' },
  },
  {
    frequency: '74',
    scan: 'C',
    path: 'M2 27 C12 5 20 5 30 27 S48 35 58 27 S76 5 86 27 S104 35 118 27',
    readout: { ar: 'Δ↑ 22  //  Δ↓ 8', en: 'Δ↑ 22  //  Δ↓ 8' },
  },
] as const;

const SIGNAL_CHANNELS = [
  {
    id: 'channel-07',
    code: '07',
    trace: 'M2 26 C20 10 34 42 52 26 S84 10 118 26',
    readout: { ar: 'أثر ثانوي ×2', en: 'Secondary trace ×2' },
  },
  {
    id: 'channel-11',
    code: '11',
    trace: '',
    readout: { ar: 'أثر ثانوي ×0', en: 'Secondary trace ×0' },
  },
  {
    id: 'channel-13',
    code: '13',
    trace: 'M76 26 C88 12 100 40 118 26',
    readout: { ar: 'أثر ثانوي ×1', en: 'Secondary trace ×1' },
  },
] as const;

const SIGNAL_PRESENTATIONS = {
  opening: {
    probes: OPENING_SIGNAL_PROBES,
    channels: SIGNAL_CHANNELS,
  },
  breach: {
    probes: [
      {
        frequency: '42', scan: 'A',
        path: 'M2 27 C12 9 20 9 30 27 S48 38 58 27 S76 9 86 27 S104 38 118 27',
        readout: { ar: 'Δ↑ 18  //  Δ↓ 11', en: 'Δ↑ 18  //  Δ↓ 11' },
      },
      {
        frequency: '74', scan: 'B',
        path: 'M2 27 C12 9 20 9 30 27 S48 45 58 27 S76 9 86 27 S104 45 118 27',
        readout: { ar: 'Δ↑ 18  //  Δ↓ 18', en: 'Δ↑ 18  //  Δ↓ 18' },
      },
      {
        frequency: '88', scan: 'C',
        path: 'M2 27 C12 3 20 3 30 27 S48 35 58 27 S76 3 86 27 S104 35 118 27',
        readout: { ar: 'Δ↑ 24  //  Δ↓ 8', en: 'Δ↑ 24  //  Δ↓ 8' },
      },
    ] as const,
    channels: SIGNAL_CHANNELS,
  },
  core: {
    probes: [
      {
        frequency: '63', scan: 'A',
        path: 'M2 27 C12 10 20 10 30 27 S48 36 58 27 S76 10 86 27 S104 36 118 27',
        readout: { ar: 'Δ↑ 17  //  Δ↓ 9', en: 'Δ↑ 17  //  Δ↓ 9' },
      },
      {
        frequency: '81', scan: 'B',
        path: 'M2 27 C12 7 20 7 30 27 S48 47 58 27 S76 7 86 27 S104 47 118 27',
        readout: { ar: 'Δ↑ 20  //  Δ↓ 20', en: 'Δ↑ 20  //  Δ↓ 20' },
      },
      {
        frequency: '97', scan: 'C',
        path: 'M2 27 C12 2 20 2 30 27 S48 34 58 27 S76 2 86 27 S104 34 118 27',
        readout: { ar: 'Δ↑ 25  //  Δ↓ 7', en: 'Δ↑ 25  //  Δ↓ 7' },
      },
    ] as const,
    channels: SIGNAL_CHANNELS,
  },
} satisfies Record<StoryPuzzleSignalConfig['visualProfile'], {
  probes: readonly SignalProbe[];
  channels: readonly SignalChannel[];
}>;

function signalBoardPresentation(signal?: StoryPuzzleSignalConfig) {
  const presentation = SIGNAL_PRESENTATIONS[signal?.visualProfile ?? 'opening'];
  const configuredFrequencyIds = signal?.frequencyOptions.map(String);
  const configuredChannelIds = signal?.channelOptions.map((channel) => `channel-${channel}`);
  const probes = configuredFrequencyIds
    ? presentation.probes.filter((probe) => configuredFrequencyIds.includes(probe.frequency))
    : presentation.probes;
  const channels = configuredChannelIds
    ? presentation.channels.filter((channel) => configuredChannelIds.includes(channel.id))
    : presentation.channels;

  // A malformed presentation must leave the known profile playable instead of
  // rendering a blank choice board. Catalog tests guard the shipped data.
  return {
    profile: signal?.visualProfile ?? 'opening',
    probes: probes.length === configuredFrequencyIds?.length ? probes : presentation.probes,
    channels: channels.length === configuredChannelIds?.length ? channels : presentation.channels,
  };
}

function SignalCalibrationBoard({
  draft,
  onChange,
  disabled,
  signal,
}: Pick<PuzzleMechanicProps, 'draft' | 'onChange' | 'disabled' | 'signal'>) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const { profile, probes, channels } = signalBoardPresentation(signal);
  const frequencyIds = probes.map((probe) => probe.frequency);
  const channelIds = channels.map((candidate) => candidate.id);
  const { frequency, channel } = readSignalSelection(draft.tokens, frequencyIds, channelIds);
  const signalCopy = locale === 'ar'
    ? {
      board: 'مختبر معايرة الإشارة',
      instruction: 'قارن مقدار الانحراف عن خط القياس، ثم افحص الأثر الثانوي في كل مرحّل. السجل وحده يحسم الفرضية بعد إرسالها.',
      readings: 'مجسات التردد',
      relays: 'مرحلات القناة',
      reading: 'مجس',
      relay: 'مرحل',
      awaiting: 'بانتظار مجس ومرحل.',
      armed: 'تم تسليح {probe} وربط {relay}. أرسل الفرضية إلى السجل للتحقق.',
    }
    : {
      board: 'Signal calibration lab',
      instruction: 'Compare each deviation against the measurement line, then inspect the secondary trace on every relay. Only the record decides after you submit a hypothesis.',
      readings: 'Frequency probes',
      relays: 'Channel relays',
      reading: 'Probe',
      relay: 'Relay',
      awaiting: 'Awaiting one probe and one relay.',
      armed: '{probe} armed and {relay} linked. Submit the hypothesis to the record for verification.',
    };
  const frequencyProbe = probes.find((probe) => probe.frequency === frequency);
  const channelRelay = channels.find((candidate) => candidate.id === channel);
  const status = frequencyProbe && channelRelay
    ? signalCopy.armed
      .replace('{probe}', `${signalCopy.reading} ${frequencyProbe.scan}`)
      .replace('{relay}', `${signalCopy.relay} ${channelRelay.code}`)
    : signalCopy.awaiting;

  return (
    <section className="story-signal-board" data-profile={profile} aria-label={signalCopy.board}>
      <div className="story-signal-board__atmosphere" aria-hidden="true" />
      <p className="story-signal-board__instruction">{signalCopy.instruction}</p>
      <div className="story-signal-board__probes" role="group" aria-label={signalCopy.readings}>
        {probes.map((probe) => (
          <button
            key={probe.frequency}
            type="button"
            disabled={disabled}
            data-selected={frequency === probe.frequency}
            aria-pressed={frequency === probe.frequency}
            aria-label={`${signalCopy.reading} ${probe.scan}: ${probe.readout[locale]}`}
            onClick={() => onChange({
              ...draft,
              tokens: toggleSignalSelection(draft.tokens, probe.frequency, frequencyIds, channelIds),
            })}
          >
            <svg viewBox="0 0 120 54" aria-hidden="true"><path d="M0 27 H120" /><path d={probe.path} /></svg>
            <strong dir="ltr">PROBE {probe.scan}</strong>
            <small dir="ltr">{probe.readout[locale]}</small>
          </button>
        ))}
      </div>
      <div className="story-signal-board__relays" role="group" aria-label={signalCopy.relays}>
        {channels.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            disabled={disabled}
            data-selected={channel === candidate.id}
            aria-pressed={channel === candidate.id}
            aria-label={`${signalCopy.relay} ${candidate.code}: ${candidate.readout[locale]}`}
            onClick={() => onChange({
              ...draft,
              tokens: toggleSignalSelection(draft.tokens, candidate.id, frequencyIds, channelIds),
            })}
          >
            <svg viewBox="0 0 120 52" aria-hidden="true">
              <path d="M0 26 H120" />
              {candidate.trace && <path d={candidate.trace} />}
            </svg>
            <strong dir="ltr">RELAY {candidate.code}</strong>
            <small>{candidate.readout[locale]}</small>
          </button>
        ))}
      </div>
      <p className="story-signal-board__status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}

const SYSTEM_SEQUENCE_PORTS: Readonly<Record<string, { input: string; output: string }>> = Object.freeze({
  signal: { input: 'START', output: '◇' },
  access: { input: '◇', output: '△' },
  memory: { input: '△', output: '□' },
  echo: { input: '□', output: 'END' },
});

function SystemSequenceBoard({
  options,
  draft,
  onChange,
  disabled,
}: {
  options: readonly StoryPuzzleOption[];
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
}) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const selected = draft.tokens.filter((token) => options.some((option) => option.id === token));
  const byId = new Map(options.map((option) => [option.id, option]));
  const presentationOptions = [...options].sort((left, right) => (
    ['memory', 'echo', 'signal', 'access'].indexOf(left.id)
    - ['memory', 'echo', 'signal', 'access'].indexOf(right.id)
  ));
  const copy = locale === 'ar'
    ? {
      board: 'لوحة المسار المستعاد',
      instruction: 'ابدأ من START، طابق مخرج كل رمز مع مدخل الرمز التالي، وأنهِ المسار عند END. ضع الرموز، ثم حرّك أو أزل أي رمز قبل الإرسال.',
      slots: 'مسار الاستعادة',
      symbols: 'الرموز المتاحة',
      empty: 'فارغ',
      moveEarlier: 'تحريك الرمز خطوة للخلف',
      moveLater: 'تحريك الرمز خطوة للأمام',
      remove: 'إزالة الرمز المحدد',
      clear: 'مسح المسار',
      awaiting: 'اختر رمزًا لتضعه في أول خانة فارغة.',
      full: 'امتلأت الخانات الأربع. حدّد رمزًا ثم حرّكه أو أزله.',
      selected: 'تم تحديد الخانة {slot}. استخدم أزرار التحريك أو الإزالة.',
      slotLabel: 'الخانة {slot}: {label}',
      availableLabel: '{label}: مدخل {input}، مخرج {output}',
    }
    : {
      board: 'Recovered route board',
      instruction: 'Begin at START, match each symbol’s exit to the next symbol’s entry, and finish at END. Place symbols, then move or remove any symbol before submitting.',
      slots: 'Recovery route',
      symbols: 'Available symbols',
      empty: 'Empty',
      moveEarlier: 'Move selected symbol earlier',
      moveLater: 'Move selected symbol later',
      remove: 'Remove selected symbol',
      clear: 'Clear route',
      awaiting: 'Choose a symbol to place it in the first empty slot.',
      full: 'All four slots are occupied. Select a symbol to move or remove it.',
      selected: 'Slot {slot} selected. Use move or remove controls.',
      slotLabel: 'Slot {slot}: {label}',
      availableLabel: '{label}: entry {input}, exit {output}',
    };
  const status = selectedSlot !== null
    ? copy.selected.replace('{slot}', String(selectedSlot + 1))
    : selected.length === 4 ? copy.full : copy.awaiting;
  const moveSelected = (direction: -1 | 1) => {
    if (selectedSlot === null) return;
    const target = selectedSlot + direction;
    if (target < 0 || target >= selected.length) return;
    onChange({
      ...draft,
      tokens: swapPuzzlePieces(selected, selected[selectedSlot]!, selected[target]!),
    });
    setSelectedSlot(target);
  };
  const removeSelected = () => {
    if (selectedSlot === null) return;
    onChange({ ...draft, tokens: removeRouteTokenAt(selected, selectedSlot) });
    setSelectedSlot(null);
  };

  return (
    <section className="story-system-route" aria-label={copy.board}>
      <p className="story-system-route__instruction">{copy.instruction}</p>
      <ol className="story-system-route__slots" dir="ltr" aria-label={copy.slots}>
        {Array.from({ length: 4 }, (_, index) => {
          const token = selected[index];
          const option = token ? byId.get(token) : undefined;
          return (
            <li key={index} data-filled={Boolean(option)} data-selected={selectedSlot === index}>
              {option ? (
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selectedSlot === index}
                  aria-label={copy.slotLabel
                    .replace('{slot}', String(index + 1))
                    .replace('{label}', option.label[locale])}
                  onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
                >
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  <strong>{option.symbol ?? '◇'}</strong>
                  <span>{option.label[locale]}</span>
                </button>
              ) : <span><small>{String(index + 1).padStart(2, '0')}</small>{copy.empty}</span>}
            </li>
          );
        })}
      </ol>
      <div className="story-system-route__controls" aria-label={locale === 'ar' ? 'تحرير المسار' : 'Route editing'}>
        <button type="button" disabled={disabled || selectedSlot === null || selectedSlot === 0} onClick={() => moveSelected(-1)}>{copy.moveEarlier}</button>
        <button type="button" disabled={disabled || selectedSlot === null} onClick={removeSelected}>{copy.remove}</button>
        <button type="button" disabled={disabled || selectedSlot === null || selectedSlot === selected.length - 1} onClick={() => moveSelected(1)}>{copy.moveLater}</button>
        <button type="button" disabled={disabled || selected.length === 0} onClick={() => { onChange({ ...draft, tokens: [] }); setSelectedSlot(null); }}>{copy.clear}</button>
      </div>
      <div className="story-system-route__nodes" role="group" aria-label={copy.symbols}>
        {presentationOptions.map((option) => {
          const ports = SYSTEM_SEQUENCE_PORTS[option.id] ?? { input: '?', output: '?' };
          const isPlaced = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || isPlaced || selected.length >= 4}
              data-placed={isPlaced}
              aria-label={copy.availableLabel
                .replace('{label}', option.label[locale])
                .replace('{input}', ports.input)
                .replace('{output}', ports.output)}
              onClick={() => {
                onChange({ ...draft, tokens: appendUniqueRouteToken(selected, option.id, 4) });
                setSelectedSlot(null);
              }}
            >
              <span aria-hidden="true">{ports.input}</span>
              <strong>{option.symbol ?? '◇'}</strong>
              <span aria-hidden="true">{ports.output}</span>
              <small>{option.label[locale]}</small>
            </button>
          );
        })}
      </div>
      <p className="story-system-route__status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}

function forensicPointPosition(id: string, index: number): { x: string; y: string } {
  const coordinates = /^([xyz])([123])$/i.exec(id);
  if (!coordinates) {
    return {
      x: `${18 + ((index % 3) * 32)}%`,
      y: `${18 + (Math.floor(index / 3) * 32)}%`,
    };
  }
  const row = coordinates[1]!.toLowerCase().charCodeAt(0) - 'x'.charCodeAt(0);
  const column = Number(coordinates[2]!) - 1;
  return {
    x: `${18 + (column * 32)}%`,
    y: `${18 + (row * 32)}%`,
  };
}

function VisualForensicsBoard({
  puzzle,
  options,
  draft,
  onChange,
  disabled,
  onVisualAssetStateChange,
}: Pick<PuzzleMechanicProps, 'puzzle' | 'draft' | 'onChange' | 'disabled' | 'onVisualAssetStateChange'> & {
  options: readonly StoryPuzzleOption[];
}) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const source = puzzle.image?.src;
  const [view, setView] = useState<'map' | 'evidence'>('map');
  const {
    assetKey,
    assetStatus,
    onAssetError,
    onAssetLoad,
    retryAsset,
  } = usePuzzleVisualAsset(source);
  const selected = draft.tokens;
  const usesEvidenceList = view === 'evidence' || assetStatus !== 'ready';
  const forensicCopy = locale === 'ar'
    ? {
      board: 'ماسح الأدلة البصرية',
      point: (id: string, detail?: string) => `موضع الفحص ${id}${detail ? `: ${detail}` : ''}`,
      instruction: `حمّل سجل الفحص، ثم حدّد موضعي الشذوذ. تم اختيار ${selected.length} من 2؛ لا يعتمد التحكم على اللون وحده.`,
      mapView: 'عرض خريطة السجل',
      evidenceView: 'عرض بطاقات الأدلة النصية',
      loading: 'يجري تحميل سجل الفحص. يمكنك استعراض بطاقات الأدلة إلى أن يصل المصدر.',
      unavailableTitle: 'سجل الفحص غير متاح',
      unavailableDetail: 'تعذر تحميل المصدر البصري. قراءة بطاقات الأدلة متاحة، ولن يُرسل أي اختيار حتى عودة السجل.',
      retryAsset: 'إعادة تحميل السجل',
    }
    : {
      board: 'Visual forensics scanner',
      point: (id: string, detail?: string) => `Inspection point ${id}${detail ? `: ${detail}` : ''}`,
      instruction: `Load the inspection record, then mark two anomaly positions. ${selected.length} of 2 selected; the control does not rely on color alone.`,
      mapView: 'Show record map',
      evidenceView: 'Show text evidence cards',
      loading: 'Loading the inspection record. You can review the text evidence cards while the source arrives.',
      unavailableTitle: 'Inspection record unavailable',
      unavailableDetail: 'The visual source did not load. Text evidence cards remain available, and no choice can be submitted until the record returns.',
      retryAsset: 'Retry record load',
    };

  useEffect(() => {
    onVisualAssetStateChange?.(assetStatus);
  }, [assetStatus, onVisualAssetStateChange]);

  return (
    <section className="story-forensics-board" aria-label={forensicCopy.board}>
      {assetStatus === 'ready' && (
        <button
          type="button"
          className="story-forensics-board__view-toggle"
          aria-pressed={view === 'evidence'}
          onClick={() => setView((current) => (current === 'map' ? 'evidence' : 'map'))}
        >
          {view === 'map' ? forensicCopy.evidenceView : forensicCopy.mapView}
        </button>
      )}
      <div
        className="story-forensics-board__record"
        data-asset-state={assetStatus}
        data-view={usesEvidenceList ? 'evidence' : 'map'}
        aria-busy={assetStatus === 'loading'}
      >
        {source && assetStatus !== 'failed' && (
          <img
            key={assetKey}
            src={source}
            alt={puzzle.image?.alt[locale] ?? ''}
            loading="lazy"
            onError={onAssetError}
            onLoad={onAssetLoad}
          />
        )}
        {assetStatus === 'ready' && !usesEvidenceList && <ScanLine aria-hidden="true" />}
        {assetStatus === 'loading' && <p className="story-puzzle-visual-loading" role="status">{forensicCopy.loading}</p>}
        {assetStatus === 'failed' && (
          <PuzzleVisualFallback
            title={forensicCopy.unavailableTitle}
            detail={forensicCopy.unavailableDetail}
            retryLabel={forensicCopy.retryAsset}
            onRetry={retryAsset}
            disabled={disabled}
          />
        )}
        <div className="story-forensics-board__points">
          {options.map((option, index) => {
            const position = forensicPointPosition(option.id, index);
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled || assetStatus !== 'ready' || tokenOptionUnavailable(selected, option.id, 2)}
                data-selected={selected.includes(option.id)}
                aria-pressed={selected.includes(option.id)}
                aria-label={forensicCopy.point(option.id.toUpperCase(), option.detail?.[locale])}
                style={{ '--point-x': position.x, '--point-y': position.y } as CSSProperties}
                onClick={() => onChange({ ...draft, tokens: selectedTokens(selected, option.id, 2) })}
              >
                <strong>{option.id.toUpperCase()}</strong>
                {option.detail && <small>{option.detail[locale]}</small>}
              </button>
            );
          })}
        </div>
      </div>
      <p role="status" aria-live="polite">{forensicCopy.instruction}</p>
    </section>
  );
}

function PuzzleMechanic({ puzzle, mechanic, options: stageOptions, tokenLimit, signal, draft, onChange, disabled, onVisualAssetStateChange }: PuzzleMechanicProps) {
  const options = stageOptions ?? sourceOptions(puzzle);
  const reducedMotion = useUiPreferencesStore((state) => state.motion === 'reduced');
  const locale = useUiPreferencesStore((state) => state.locale);
  const [memoryPreview, setMemoryPreview] = useState(mechanic === 'memory-grid');
  const [memoryReplay, setMemoryReplay] = useState(0);
  const [memoryPulseIndex, setMemoryPulseIndex] = useState(0);
  useEffect(() => {
    if (mechanic !== 'memory-grid') return undefined;
    setMemoryPreview(true);
    setMemoryPulseIndex(0);
    // Reduced Motion keeps the same playable observation phase, but advances
    // one pulse at a time under player control rather than dumping the answer.
    if (reducedMotion) return undefined;
    const pulseTimers = [1, 2, 3].map((index) => window.setTimeout(() => setMemoryPulseIndex(index), index * 520));
    const hideTimer = window.setTimeout(() => setMemoryPreview(false), 2350);
    return () => {
      pulseTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(hideTimer);
    };
  }, [mechanic, puzzle.id, memoryReplay, reducedMotion]);

  if (mechanic === 'image-reconstruction') {
    return <ImageReconstructionBoard puzzle={puzzle} draft={draft} onChange={onChange} disabled={disabled} onVisualAssetStateChange={onVisualAssetStateChange} />;
  }

  if (mechanic === 'layer-alignment') {
    return <LayerAlignmentBoard puzzle={puzzle} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'load-balancing') {
    return <LoadBalancingBoard draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'signal') {
    return <SignalCalibrationBoard draft={draft} onChange={onChange} disabled={disabled} signal={signal} />;
  }

  if (mechanic === 'wiring' || mechanic === 'color-routing') {
    const accessNodeLock = (
      mechanic === 'wiring'
      && stageOptions?.some((option) => option.id === 'echo')
    );
    const sources = accessNodeLock ? ['access'] : assignmentSources(mechanic);
    const targets = accessNodeLock ? stageOptions! : assignmentTargets(mechanic);
    const wiringCopy = locale === 'ar'
      ? {
        board: mechanic === 'wiring' ? 'لوحة استعادة الدائرة' : 'لوحة مطابقة القنوات',
        instruction: mechanic === 'wiring'
          ? 'اختر طرفًا واحدًا لكل مسار. يمكنك تغيير أي وصلة قبل إرسال السجل.'
          : 'طابق هوية كل قناة مع شكلها، ثم راجع كل وصلة قبل إرسال السجل.',
        targetGroup: (source: string) => `الأطراف المتاحة لمسار ${source}`,
        status: (count: number, total: number) => `تم إعداد ${count} من ${total} وصلات. التحقق الخادمي يحسم المطابقة النهائية.`,
      }
      : {
        board: mechanic === 'wiring' ? 'Circuit restore board' : 'Channel matching board',
        instruction: mechanic === 'wiring'
          ? 'Choose one terminal for each route. You can change any connection before submitting the record.'
          : 'Match each channel identity to its shape, then review every connection before submitting the record.',
        targetGroup: (source: string) => `Available terminals for ${source}`,
        status: (count: number, total: number) => `${count} of ${total} connections prepared. Server verification decides the final match.`,
      };
    return (
      <section className="story-wiring-board" data-mode={mechanic} aria-label={wiringCopy.board}>
        <p className="story-wiring-board__instruction">{wiringCopy.instruction}</p>
        {sources.map((source) => {
          const sourceOption = options.find((option) => option.id === source);
          const sourceLabel = sourceOption?.label[locale] ?? source;
          return (
            <article key={source} data-connected={Boolean(draft.assignments[source])}>
              <strong>
                {sourceOption?.symbol && <i aria-hidden="true">{sourceOption.symbol}</i>}
                <span>{sourceLabel}</span>
              </strong>
              <span className="story-wiring-board__line" data-active={Boolean(draft.assignments[source])} />
              <div role="group" aria-label={wiringCopy.targetGroup(sourceLabel)}>
                {targets.map((target) => (
                  <button
                    key={target.id} type="button" disabled={disabled}
                    data-selected={draft.assignments[source] === target.id}
                    aria-pressed={draft.assignments[source] === target.id}
                    aria-label={`${sourceLabel} → ${target.label[locale]}`}
                    onClick={() => {
                      const assignments = Object.fromEntries(
                        Object.entries(draft.assignments).filter(([otherSource, otherTarget]) => (
                          otherSource === source || otherTarget !== target.id
                        )),
                      );
                      assignments[source] = target.id;
                      onChange({ ...draft, assignments });
                    }}
                  >{target.label[locale]}</button>
                ))}
              </div>
            </article>
          );
        })}
        <p className="story-wiring-board__status" role="status" aria-live="polite">
          {wiringCopy.status(sources.filter((source) => Boolean(draft.assignments[source])).length, sources.length)}
        </p>
      </section>
    );
  }

  if (mechanic === 'matrix') {
    const tiles = MATRIX_TILE_IDS;
    const matrixCopy = locale === 'ar'
      ? {
        board: 'مصفوفة النظام',
        heading: 'مصفوفة النظام // محاذاة الوصلات',
        tile: (index: number, rotation: number) => `العقدة ${index + 1}، اتجاهها الحالي ${rotation}. اضغط لتدويرها.`,
        status: (count: number) => `تم ضبط ${count} من 4 عقد. أرسل المصفوفة إلى السجل للتحقق من الوصلات.`,
      }
      : {
        board: 'System matrix',
        heading: 'SYSTEM MATRIX // ALIGN CONNECTIONS',
        tile: (index: number, rotation: number) => `Node ${index + 1}, current orientation ${rotation}. Select to rotate it.`,
        status: (count: number) => `${count} of 4 nodes adjusted. Submit the matrix to the record to verify the connections.`,
      };
    return (
      <section className="story-matrix-board" aria-label={matrixCopy.board}>
        <header><ScanLine aria-hidden="true" /> {matrixCopy.heading}</header>
        <div className="story-matrix-board__tiles">
          {tiles.map((tile, index) => {
            const rotation = draft.rotations[tile] ?? ((index + 1) % 4);
            return (
              <button
                key={tile} type="button" disabled={disabled} data-rotation={rotation}
                onClick={() => onChange({ ...draft, rotations: { ...draft.rotations, [tile]: (rotation + 1) % 4 } })}
                aria-label={matrixCopy.tile(index, rotation)}
              ><i /><i /><span dir="ltr">R{rotation}</span></button>
            );
          })}
        </div>
        <p role="status" aria-live="polite">{matrixCopy.status(tiles.filter((tile) => draft.rotations[tile] !== undefined).length)}</p>
      </section>
    );
  }

  if (mechanic === 'visual-forensics') {
    return <VisualForensicsBoard puzzle={puzzle} options={options} draft={draft} onChange={onChange} disabled={disabled} onVisualAssetStateChange={onVisualAssetStateChange} />;
  }

  if (mechanic === 'memory-grid') {
    const grid = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
    const memoryCopy = locale === 'ar'
      ? {
        board: 'شبكة الذاكرة',
        preview: (index: number) => `مخزن النمط // نبضة ${index + 1} / ${MEMORY_GRID_PULSE_PATTERN.length}`,
        guided: (index: number) => `مخزن النمط // خطوة مضبوطة ${index + 1} / ${MEMORY_GRID_PULSE_PATTERN.length}`,
        restore: 'مخزن النمط // استعادة',
        observe: 'احفظ النمط قبل أن يختفي.',
        input: 'أعد النمط بالنقر على العقد بالترتيب. اضغط مسح الإدخال لتصحيح المحاولة.',
        replay: 'إعادة عرض النمط',
      }
      : {
        board: 'Memory grid',
        preview: (index: number) => `PATTERN BUFFER // PULSE ${index + 1} / ${MEMORY_GRID_PULSE_PATTERN.length}`,
        guided: (index: number) => `PATTERN BUFFER // CONTROLLED STEP ${index + 1} / ${MEMORY_GRID_PULSE_PATTERN.length}`,
        restore: 'PATTERN BUFFER // RESTORE',
        observe: 'Memorize the pattern before it disappears.',
        input: 'Repeat the pattern by selecting nodes in order. Use Clear input to correct the attempt.',
        replay: 'Replay pattern',
      };
    const advanceReducedMemoryPreview = () => {
      if (memoryPulseIndex >= MEMORY_GRID_PULSE_PATTERN.length - 1) {
        setMemoryPreview(false);
        return;
      }
      setMemoryPulseIndex((index) => index + 1);
    };
    return (
    <section className="story-memory-grid" data-preview={memoryPreview} aria-label={memoryCopy.board}>
      <header>{memoryPreview
          ? reducedMotion ? memoryCopy.guided(memoryPulseIndex) : memoryCopy.preview(memoryPulseIndex)
          : memoryCopy.restore}</header>
        {memoryPreview && reducedMotion && (
          <div className="story-memory-grid__guided-step" role="status" aria-live="polite">
            <span>{locale === 'ar'
              ? `النبضة ${memoryPulseIndex + 1} ظاهرة الآن. ثبّت موقعها قبل متابعة العرض.`
              : `Pulse ${memoryPulseIndex + 1} is visible now. Hold its position before continuing.`}</span>
            <button type="button" disabled={disabled} onClick={advanceReducedMemoryPreview}>
              {memoryPulseIndex >= MEMORY_GRID_PULSE_PATTERN.length - 1
                ? (locale === 'ar' ? 'ابدأ الاستعادة' : 'Begin restoration')
                : (locale === 'ar' ? 'أظهر النبضة التالية' : 'Show next pulse')}
            </button>
          </div>
        )}
        <div>
          {grid.map((id) => {
            const selectionCount = draft.tokens.filter((token) => token === id).length;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled || memoryPreview || tokenOptionUnavailable(draft.tokens, id, MEMORY_GRID_PULSE_PATTERN.length, true)}
                data-preview={memoryPreview && MEMORY_GRID_PULSE_PATTERN[memoryPulseIndex] === id}
                data-selected={selectionCount > 0}
                aria-pressed={selectionCount > 0}
                aria-label={`${locale === 'ar' ? 'عقدة الذاكرة' : 'Memory node'} ${id.toUpperCase()}${selectionCount > 0 ? `, ${locale === 'ar' ? `محددة ${selectionCount} مرة` : `selected ${selectionCount} times`}` : ''}`}
                onClick={() => onChange({ ...draft, tokens: selectedTokens(draft.tokens, id, MEMORY_GRID_PULSE_PATTERN.length, true) })}
              >{id.toUpperCase()}</button>
            );
          })}
        </div>
        <p>{memoryPreview ? memoryCopy.observe : memoryCopy.input}</p>
        <button
          type="button"
          className="story-memory-grid__replay"
          disabled={disabled || memoryPreview}
          onClick={() => setMemoryReplay((value) => value + 1)}
        >
          {memoryCopy.replay}
        </button>
        <button
          type="button"
          className="story-memory-grid__clear"
          disabled={disabled || memoryPreview || draft.tokens.length === 0}
          onClick={() => onChange({ ...draft, tokens: [] })}
        >
          {locale === 'ar' ? 'مسح الإدخال' : 'Clear input'}
        </button>
      </section>
    );
  }

  if (mechanic === 'pattern-scan') {
    return <PatternScanBoard draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'data-route') {
    return <DataRouteBoard options={options} tokenLimit={tokenLimit} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'sequence' && puzzle.id === 'story_puzzle_02_system_sequence') {
    return <SystemSequenceBoard options={options} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'evidence' || mechanic === 'contradiction' || mechanic === 'deduction') {
    return <EvidenceBoard mechanic={mechanic} options={options} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  const selected = draft.tokens;
  const limit = sequenceLimit(mechanic, tokenLimit);
  const ordered = ['sequence', 'timeline', 'cipher', 'mirror-code', 'data-route'].includes(mechanic);
  const repeatable = ['cipher', 'mirror-code', 'memory-grid'].includes(mechanic);
  const composerCopy = locale === 'ar'
    ? {
      board: 'لوحة تكوين الفرضية',
      buffer: 'الفرضية الحالية',
      empty: 'بانتظار اختيارك.',
      selected: `تم اختيار ${selected.length} من ${limit}. اضغط عنصرًا من الفرضية لإزالته.`,
      choices: 'الرموز المتاحة',
      remove: (token: string, index: number) => `إزالة ${token} من الموضع ${index + 1}`,
      add: (label: string) => `إضافة ${label} إلى الفرضية`,
      toggle: (label: string) => `تبديل اختيار ${label}`,
      clear: 'مسح الفرضية وإعادة الإدخال',
      clearAction: 'إعادة الإدخال',
    }
    : {
      board: 'Hypothesis composer',
      buffer: 'Current hypothesis',
      empty: 'Awaiting your selection.',
      selected: `${selected.length} of ${limit} selected. Select an item in the hypothesis to remove it.`,
      choices: 'Available symbols',
      remove: (token: string, index: number) => `Remove ${token} from position ${index + 1}`,
      add: (label: string) => `Add ${label} to the hypothesis`,
      toggle: (label: string) => `Toggle ${label}`,
      clear: 'Clear hypothesis and start again',
      clearAction: 'Clear input',
    };
  return (
    <section className="story-token-board" data-mode={mechanic} aria-label={composerCopy.board}>
      <div className="story-token-board__buffer" role="status" aria-live="polite" aria-label={composerCopy.buffer} data-full={selected.length >= limit}>
        {selected.length === 0 ? <span>{composerCopy.empty}</span> : selected.map((token, index) => (
          <button
            key={`${token}-${index}`}
            type="button"
            disabled={disabled}
            aria-label={composerCopy.remove(token.toUpperCase(), index)}
            onClick={() => onChange({ ...draft, tokens: selected.filter((_, itemIndex) => itemIndex !== index) })}
          >
            {ordered && <small>{index + 1}</small>}{token.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="story-token-board__selection-status" aria-live="polite">{selected.length === 0 ? composerCopy.empty : composerCopy.selected}</p>
      <div className="story-token-board__choices" role="group" aria-label={composerCopy.choices}>
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const canToggle = !repeatable && isSelected;
          const unavailable = tokenOptionUnavailable(selected, option.id, limit, repeatable);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || unavailable}
              data-selected={!repeatable && isSelected}
              aria-pressed={!repeatable ? isSelected : undefined}
              aria-label={canToggle
                ? composerCopy.toggle(option.label[locale])
                : composerCopy.add(option.label[locale])}
              onClick={() => onChange({ ...draft, tokens: selectedTokens(selected, option.id, limit, repeatable) })}
            >
              {option.symbol && <i>{option.symbol}</i>}
              <strong>{option.label[locale]}</strong>
              {option.detail && <small>{option.detail[locale]}</small>}
              <small>{option.label.en}</small>
            </button>
          );
        })}
      </div>
      <button type="button" className="story-token-board__clear" aria-label={composerCopy.clear} disabled={disabled || selected.length === 0} onClick={() => onChange({ ...draft, tokens: [] })}>{composerCopy.clearAction}</button>
    </section>
  );
}

function RewardMoment({
  onDismiss,
  onContinueManhwa,
}: {
  onDismiss: () => void;
  onContinueManhwa: () => void;
}) {
  const reward = useStoryPuzzleStore((state) => state.latestReward);
  const locale = useUiPreferencesStore((state) => state.locale);
  const nextObjective = useMemo(
    () => deriveCorePlayerObjective(reward?.snapshot ?? null, locale),
    [locale, reward?.snapshot],
  );
  const copy = locale === 'ar'
    ? {
      detected: 'تم رصد شظية ذاكرة في النظام',
      title: 'تم اكتساب شظية ذاكرة',
      shard: 'شظية',
      echoResonance: 'تناغم Echo',
      perfect: (coins: number) => `حل مثالي +${coins} عملات`,
      echoResponse: 'استجابة Echo',
      nextObjective: 'الهدف التالي',
      continueManhwa: 'افتح المانهوا وتابع الدليل',
      dismiss: 'العودة إلى الألغاز',
    }
    : {
      detected: 'System memory fragment detected',
      title: 'Memory shard acquired',
      shard: 'Shard',
      echoResonance: 'Echo resonance',
      perfect: (coins: number) => `Perfect solve +${coins} coins`,
      echoResponse: 'Echo response',
      nextObjective: 'Next objective',
      continueManhwa: 'Open Manhwa and follow the clue',
      dismiss: 'Return to puzzles',
    };
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!reward?.awarded) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const frame = window.requestAnimationFrame(() => continueRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const items = focusable ? [...focusable] : [];
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [onDismiss, reward?.awarded]);
  if (!reward?.awarded) return null;
  const puzzle = STORY_PUZZLE_BY_ID[reward.puzzleId];
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div ref={dialogRef} className="story-reward-moment" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} role="dialog" aria-modal="true" aria-labelledby="story-reward-title" aria-describedby="story-reward-description">
      <div className="story-reward-moment__shard"><Sparkles aria-hidden="true" /></div>
      <section>
        <EchoPresence
          className="story-reward-moment__echo"
          variant="mini"
          label="Echo"
          showTelemetry={false}
          eager
        />
        <small>{copy.detected}</small>
        <h2 id="story-reward-title">{copy.title}</h2>
        <p id="story-reward-description">{puzzle?.completionMessage[locale] ?? (locale === 'ar' ? 'تمت الاستعادة.' : 'Recovery complete.')}</p>
        <dl>
          <div><dt>XP</dt><dd>+{reward.xpGranted}</dd></div>
          <div><dt>{copy.shard}</dt><dd dir="ltr">{reward.snapshot.shardCount} / 20</dd></div>
        </dl>
        <div className="story-reward-moment__echo-impact">
          <Activity aria-hidden="true" />
          <span><small>{copy.echoResonance}</small><strong>+{reward.echoImpact.amount} · {reward.echoImpact.label[locale]}</strong></span>
        </div>
        <div className="story-reward-moment__echo-response" role="status" aria-live="polite">
          <Activity aria-hidden="true" />
          <span><small>{copy.echoResponse}</small><strong>{nextObjective.echoLine}</strong></span>
        </div>
        <div className="story-reward-moment__next-objective">
          <small>{copy.nextObjective}</small>
          <strong>{nextObjective.title}</strong>
          <p>{nextObjective.detail}</p>
        </div>
        {reward.perfectBonusCoins > 0 && <strong className="story-reward-moment__perfect">{copy.perfect(reward.perfectBonusCoins)}</strong>}
        <div className="story-reward-moment__actions">
          <button ref={continueRef} className="story-reward-moment__continue" type="button" onClick={onContinueManhwa}>
            <BookOpenCheck aria-hidden="true" /> {copy.continueManhwa}
          </button>
          <button className="story-reward-moment__dismiss" type="button" onClick={onDismiss}>{copy.dismiss}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default function PuzzleScreen() {
  const authStatus = useAuthStore((state) => state.status);
  const storeStatus = useStoryPuzzleStore((state) => state.status);
  const snapshot = useStoryPuzzleStore((state) => state.snapshot);
  const error = useStoryPuzzleStore((state) => state.error);
  const latestReward = useStoryPuzzleStore((state) => state.latestReward);
  const latestActivity = useStoryPuzzleStore((state) => state.latestActivity);
  const actions = useStoryPuzzleStore((state) => state.actions);
  const loadCollection = useCollectionStore((state) => state.actions.load);
  const loadProfile = usePlayerProgressionStore((state) => state.actions.loadProfile);
  const loadLeaderboard = usePlayerProgressionStore((state) => state.actions.loadLeaderboard);
  const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled);
  const sfxVolume = useUiPreferencesStore((state) => state.sfxVolume);
  const locale = useUiPreferencesStore((state) => state.locale);
  const screenCopy = locale === 'ar'
    ? {
      gateTitle: 'قناة الألغاز محمية',
      gateDetail: 'سجّل الدخول لربط أدلة المانهوا وسجل الاستعادة بحسابك.',
      title: 'ألغاز القصة',
      indexLabel: 'قائمة ألغاز القصة',
      discovery: 'إشارة سرية قابلة للاكتشاف',
      unlockChannel: 'اضغط لفك القناة',
      replayCinematic: 'إعادة مشهد التحول',
      missionLabel: 'هدف هذه الخطوة',
      missionTitle: 'الهدف الآن',
      missionDetail: 'بعد التحقق الخادمي: تُحفظ المكافأة، يرد Echo، ويظهر الدليل التالي.',
      evidencePage: (page: number) => `الدليل في الصفحة ${page}`,
      blockedByPuzzle: (title: string, page: number) => `أكمل أولًا لغز «${title}»، ثم تابع قراءة المانهوا بالترتيب حتى الصفحة ${page}.`,
      blockedByPage: (page: number) => `افتح المانهوا واقرأ حتى الصفحة ${page}؛ سيُسجّل الدليل تلقائيًا بعد تحميل الصفحة بنجاح.`,
      continueManhwa: 'متابعة المانهوا',
      stage: (index: number) => `الانتقال إلى المرحلة ${index}`,
      confirmStage: 'حفظ المسودة ومتابعة',
      stageDetail: 'تُجمع مداخلات المراحل وتُفحص معًا فقط عند التحقق الأخير.',
      verify: 'تحقق من الاستعادة',
      visualAssetPending: 'ينتظر التحقق عودة السجل البصري. استخدم إعادة التحميل داخل محطة اللغز ثم تابع.',
      save: 'حفظ الآن',
      retry: 'إعادة المحاولة',
      echoRetry: 'ملاحظة Echo بعد المحاولة',
      echoResponse: 'استجابة Echo',
      nextObjective: 'الهدف التالي',
      hints: 'تلميحات اللغز',
      hintDetail: 'استخدام التلميح لا يلغي XP أو الشظية؛ يلغي فقط مكافأة الحل المثالي.',
    }
    : {
      gateTitle: 'Puzzle channel protected',
      gateDetail: 'Sign in to connect Manhwa evidence and the recovery record to your account.',
      title: 'Story Puzzles',
      indexLabel: 'Story puzzle index',
      discovery: 'A secret signal is ready to discover',
      unlockChannel: 'Select to unlock the channel',
      replayCinematic: 'Replay transformation scene',
      missionLabel: 'Objective for this step',
      missionTitle: 'Objective now',
      missionDetail: 'After server verification: the reward is recorded, Echo responds, and the next clue appears.',
      evidencePage: (page: number) => `Evidence is on page ${page}`,
      blockedByPuzzle: (title: string, page: number) => `Complete “${title}” first, then continue reading the Manhwa in order through page ${page}.`,
      blockedByPage: (page: number) => `Open the Manhwa and read through page ${page}. The evidence is recorded automatically after the page loads successfully.`,
      continueManhwa: 'Continue the Manhwa',
      stage: (index: number) => `Go to stage ${index}`,
      confirmStage: 'Save draft & continue',
      stageDetail: 'Stage inputs are collected and verified together only at final submission.',
      verify: 'Verify recovery',
      visualAssetPending: 'Verification waits for the visual record to return. Retry the source inside the puzzle station, then continue.',
      save: 'Save now',
      retry: 'Try again',
      echoRetry: 'Echo note after this attempt',
      echoResponse: 'Echo response',
      nextObjective: 'Next objective',
      hints: 'Puzzle hints',
      hintDetail: 'Using a hint does not remove XP or the shard; it only removes the perfect-solve bonus.',
    };
  const requestManhwaReader = useShellStore(
    (state) => state.requestManhwaReader,
  );
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>('story_puzzle_01_signal_calibration');
  const [draft, setDraft] = useState<StoryPuzzleDraft>(() => defaultDraft(STORY_PUZZLE_BY_ID.story_puzzle_01_signal_calibration!));
  const [draftResetVersion, setDraftResetVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [visualAssetState, setVisualAssetState] = useState<{
    context: string;
    status: PuzzleVisualAssetStatus;
  } | null>(null);
  const saveTimer = useRef<number | null>(null);
  // Every draft write shares one chain. A late debounce response must never
  // replace a newer hint or completion snapshot in the store.
  const draftSaveChain = useRef<Promise<unknown>>(Promise.resolve());
  const terminalPuzzleAction = useRef(false);
  const hydratedPuzzleId = useRef<string | null>(null);
  const playedPuzzleCinematics = useRef(new Set<string>());

  useEffect(() => {
    if (authStatus === 'signed-in') void actions.load(false, undefined, locale);
  }, [actions, authStatus, locale]);

  useEffect(() => {
    if (latestReward?.awarded) void loadCollection(true);
  }, [latestReward, loadCollection]);

  const entries = snapshot?.entries ?? EMPTY_STORY_PUZZLE_ENTRIES;
  const nextObjective = useMemo(
    () => deriveCorePlayerObjective(snapshot, locale),
    [locale, snapshot],
  );
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.puzzleId, entry])), [entries]);
  const visiblePuzzles = useMemo(() => STORY_PUZZLES.filter((puzzle) => (
    puzzle.classification === 'main' || entryById.get(puzzle.id)?.status !== 'hidden'
  )), [entryById]);
  const selectedPuzzle = STORY_PUZZLE_BY_ID[selectedPuzzleId] ?? STORY_PUZZLES[0]!;
  const selectedEntry = entryById.get(selectedPuzzle.id) ?? {
    puzzleId: selectedPuzzle.id, status: 'locked' as const, discovered: selectedPuzzle.classification === 'main', completedAt: null,
    perfectSolve: false, unlockedHintIndexes: [], hintCosts: [4, 8, 14] as [number, number, number], draft: null,
  };
  const stageDrafts = selectedPuzzle.stages?.length ? parseStages(selectedPuzzle, draft) : [];
  const stageIndex = Math.min(draft.stageIndex, Math.max(0, stageDrafts.length - 1));
  const currentStage = selectedPuzzle.stages?.[stageIndex];
  const activeMechanic = (currentStage?.mechanic ?? selectedPuzzle.mechanic) as Exclude<
    StoryPuzzleMechanic,
    'multi-stage' | 'breach-protocol'
  >;
  const visualAssetContext = activeMechanic === 'image-reconstruction' || activeMechanic === 'visual-forensics'
    ? `${selectedPuzzle.id}:${currentStage?.id ?? 'main'}`
    : null;
  const reportVisualAssetState = useCallback((status: PuzzleVisualAssetStatus) => {
    if (!visualAssetContext) return;
    setVisualAssetState((current) => (
      current?.context === visualAssetContext && current.status === status
        ? current
        : { context: visualAssetContext, status }
    ));
  }, [visualAssetContext]);
  const visualAssetReady = visualAssetContext === null || (
    visualAssetState?.context === visualAssetContext
    && visualAssetState.status === 'ready'
  );
  const activeDraft = currentStage ? stageDrafts[stageIndex]! : draft;
  const activeReadiness = currentStage
    ? draftReadiness(
      selectedPuzzle,
      currentStage.mechanic,
      activeDraft,
      currentStage.tokenLimit,
      currentStage.options,
      locale,
    )
    : selectedPuzzle.mechanic === 'multi-stage' || selectedPuzzle.mechanic === 'breach-protocol'
      ? {
        ready: false,
        message: locale === 'ar'
          ? 'انتقل إلى المرحلة الحالية لإكمال اللغز.'
          : 'Open the current stage to continue the puzzle.',
      }
      : draftReadiness(selectedPuzzle, selectedPuzzle.mechanic, draft, undefined, undefined, locale);
  const actionReadiness = visualAssetReady
    ? activeReadiness
    : { ready: false, message: screenCopy.visualAssetPending };
  const missingPrerequisite = selectedPuzzle.prerequisitePuzzleIds
    .map((puzzleId) => STORY_PUZZLE_BY_ID[puzzleId])
    .find((puzzle) => (
      puzzle && entryById.get(puzzle.id)?.status !== 'completed'
    ));
  const discoverableSecretIds = snapshot?.discoverableSecretPuzzleIds ?? [];

  useEffect(() => {
    if (!visiblePuzzles.some((puzzle) => puzzle.id === selectedPuzzleId)) {
      const next = visiblePuzzles.find((puzzle) => entryById.get(puzzle.id)?.status === 'in_progress')
        ?? visiblePuzzles.find((puzzle) => entryById.get(puzzle.id)?.status === 'available')
        ?? visiblePuzzles[0];
      if (next) setSelectedPuzzleId(next.id);
    }
  }, [entryById, selectedPuzzleId, visiblePuzzles]);

  useEffect(() => {
    if (
      selectedEntry.status === 'available'
      || selectedEntry.status === 'in_progress'
    ) {
      emitExperienceCue({ name: 'puzzle-armed', sourceId: selectedPuzzle.id });
    }
  }, [selectedEntry.status, selectedPuzzle.id]);

  useEffect(() => {
    if (!snapshot) {
      hydratedPuzzleId.current = null;
      return;
    }
    if (hydratedPuzzleId.current === selectedPuzzle.id) return;
    const entry = entryById.get(selectedPuzzle.id);
    setDraft(entry?.draft
      ? normalizePuzzleDraft(selectedPuzzle, entry.draft)
      : defaultDraft(selectedPuzzle));
    setDraftResetVersion((version) => version + 1);
    hydratedPuzzleId.current = selectedPuzzle.id;
  }, [entryById, selectedPuzzle, snapshot]);

  useEffect(() => {
    if (
      !selectedPuzzle.cinematicStageId
      || selectedEntry.status === 'locked'
      || selectedEntry.status === 'hidden'
      || selectedEntry.status === 'completed'
      || playedPuzzleCinematics.current.has(selectedPuzzle.id)
    ) return undefined;
    playedPuzzleCinematics.current.add(selectedPuzzle.id);
    const timer = window.setTimeout(() => {
      requestEchoTransformationCinematic(selectedPuzzle.cinematicStageId!);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [selectedEntry.status, selectedPuzzle]);

  useEffect(() => () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
  }, []);

  const cancelQueuedSave = () => {
    if (saveTimer.current === null) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
  };

  const enqueueDraftSave = (puzzleId: string, nextDraft: StoryPuzzleDraft) => {
    // Capture the exact draft at the time of the player action. Later local
    // interactions must enqueue a later write instead of mutating this one.
    const persistedDraft = cloneDraft(nextDraft);
    const request = draftSaveChain.current
      .catch(() => undefined)
      .then(() => actions.saveDraft(puzzleId, persistedDraft, locale))
      // Store actions already translate expected API failures to `null`, but
      // keep the queue usable even if an unexpected transport failure escapes.
      .catch(() => null);
    draftSaveChain.current = request;
    return request;
  };

  const queueSave = (next: StoryPuzzleDraft) => {
    if (
      terminalPuzzleAction.current
      || selectedEntry.status === 'locked'
      || selectedEntry.status === 'completed'
    ) return;
    setDraft(next);
    cancelQueuedSave();
    const puzzleId = selectedPuzzle.id;
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      void enqueueDraftSave(puzzleId, next);
    }, 550);
  };

  const selectPuzzle = (puzzle: StoryPuzzleDefinition) => {
    if (entryById.get(puzzle.id)?.status === 'locked') return;
    setSelectedPuzzleId(puzzle.id);
  };

  const updateActiveDraft = (next: StoryPuzzleDraft) => {
    if (!currentStage) {
      queueSave(next);
      return;
    }
    const nextStages = [...stageDrafts];
    nextStages[stageIndex] = next;
    queueSave(composeStageDraft(draft, stageIndex, nextStages));
  };

  const saveNow = async (nextDraft = draft) => {
    if (
      terminalPuzzleAction.current
      || selectedEntry.status === 'locked'
      || selectedEntry.status === 'completed'
    ) return null;
    cancelQueuedSave();
    setBusy(true);
    try {
      return await enqueueDraftSave(selectedPuzzle.id, nextDraft);
    } finally {
      setBusy(false);
    }
  };

  const openHint = async (index: number) => {
    if (
      busy
      || terminalPuzzleAction.current
      || selectedEntry.status === 'locked'
      || selectedEntry.status === 'completed'
    ) return;
    terminalPuzzleAction.current = true;
    cancelQueuedSave();
    setBusy(true);
    try {
      // The chain drains every prior debounce first, then makes this exact
      // draft the last write before the hint response updates the snapshot.
      const saved = await enqueueDraftSave(selectedPuzzle.id, draft);
      if (!saved) return;
      await actions.unlockHint(selectedPuzzle.id, index, locale);
    } finally {
      terminalPuzzleAction.current = false;
      setBusy(false);
    }
  };

  const complete = async () => {
    if (busy || terminalPuzzleAction.current || !actionReadiness.ready) return;
    terminalPuzzleAction.current = true;
    cancelQueuedSave();
    primeRewardAudio(audioEnabled);
    setBusy(true);
    try {
      // Do not let a prior autosave return after the authoritative receipt.
      // This exact final draft is serialized after all earlier saves first.
      const saved = await enqueueDraftSave(selectedPuzzle.id, draft);
      if (!saved) return;
      const receipt = await actions.complete(selectedPuzzle.id, draft, locale);
      if (receipt?.awarded) {
        emitExperienceCue({ name: 'puzzle-reward', sourceId: selectedPuzzle.id });
        if (audioEnabled) playPuzzleCompletionSound(sfxVolume);
        void loadProfile();
        void loadLeaderboard(true);
      }
    } finally {
      terminalPuzzleAction.current = false;
      setBusy(false);
    }
  };

  const advanceStage = async () => {
    if (!currentStage || !actionReadiness.ready) return;
    const nextIndex = Math.min(stageIndex + 1, stageDrafts.length - 1);
    const next = composeStageDraft(draft, nextIndex, stageDrafts);
    setDraft(next);
    await saveNow(next);
  };

  const resetPuzzle = () => {
    const next = defaultDraft(selectedPuzzle);
    setDraftResetVersion((version) => version + 1);
    queueSave(next);
  };

  const continueToNextManhwa = () => {
    actions.dismissReward();
    requestManhwaReader();
  };

  const discover = async (secretId: string) => {
    setBusy(true);
    const next = await actions.discover(secretId, locale);
    setBusy(false);
    if (next) setSelectedPuzzleId(secretId);
  };

  if (authStatus !== 'signed-in') {
    return (
      <section className="story-puzzle-gate">
        <LockKeyhole aria-hidden="true" />
        <h1>{screenCopy.gateTitle}</h1>
        <p>{screenCopy.gateDetail}</p>
      </section>
    );
  }

  return (
    <div className="story-puzzle-screen" data-mechanic={selectedPuzzle.mechanic}>
      <header className="story-puzzle-screen__header">
        <div><small>11.11 // STORY INTERFERENCE</small><h1>{screenCopy.title}</h1></div>
        <dl>
          <div><dt>MAIN PATH</dt><dd dir="ltr">{snapshot?.mainCompletedCount ?? 0} / 14</dd></div>
          <div><dt>MEMORY SHARDS</dt><dd dir="ltr">{snapshot?.shardCount ?? 0} / 20</dd></div>
          <div><dt>ECHO RESONANCE</dt><dd>{snapshot?.echoResonance.total ?? 0}</dd></div>
          <div><dt><Coins aria-hidden="true" /> COINS</dt><dd>{snapshot?.coinBalance ?? 0}</dd></div>
        </dl>
      </header>

      <aside className="story-puzzle-index" aria-label={screenCopy.indexLabel}>
        {discoverableSecretIds.map((secretId) => {
          const secret = STORY_PUZZLE_BY_ID[secretId];
          if (!secret) return null;
          return (
            <button
              key={`detect-${secretId}`}
              type="button"
              className="story-puzzle-index__discovery"
              disabled={busy}
              onClick={() => void discover(secretId)}
            >
              <span><Crosshair aria-hidden="true" /></span>
              <i>
                <strong>{screenCopy.discovery}</strong>
                <small>PAGE {secret.source.globalPageNumber} // {screenCopy.unlockChannel}</small>
              </i>
            </button>
          );
        })}
        {visiblePuzzles.map((puzzle) => {
          const entry = entryById.get(puzzle.id);
          const status = entry?.status ?? 'locked';
          return (
            <button
              key={puzzle.id} type="button" data-active={puzzle.id === selectedPuzzle.id}
              data-status={status} disabled={status === 'locked'} onClick={() => selectPuzzle(puzzle)}
            >
              <span>{status === 'completed' ? <Check aria-hidden="true" /> : puzzle.classification === 'secret' ? <Crosshair aria-hidden="true" /> : String(puzzle.order).padStart(2, '0')}</span>
              <i><strong>{puzzle.classification === 'secret' && status === 'hidden' ? '///' : puzzle.title[locale]}</strong><small>{puzzle.classification === 'secret' ? 'SECRET SIGNAL' : `CHAPTER ${puzzle.chapterId.slice(-1)}`}</small></i>
              {status === 'locked' && <LockKeyhole aria-hidden="true" />}
            </button>
          );
        })}
      </aside>

      <main className="story-puzzle-workspace">
        <section className="story-puzzle-console">
          <header>
            <span><Activity aria-hidden="true" /> {selectedPuzzle.classification === 'secret' ? 'ANOMALY CHANNEL' : 'SYSTEM CHANNEL'}</span>
            <small>PUZZLE {String(selectedPuzzle.order).padStart(2, '0')} // {statusLabel(selectedEntry.status, locale)}</small>
          </header>
          <div className="story-puzzle-console__title">
            <div><small>{selectedPuzzle.mechanic.replace('-', ' ').toUpperCase()}</small><h2>{selectedPuzzle.title[locale]}</h2><p>{selectedPuzzle.objective[locale]}</p></div>
            <span className="story-puzzle-console__page">SOURCE // {String(selectedPuzzle.source.globalPageNumber).padStart(2, '0')}</span>
            {selectedPuzzle.cinematicStageId && selectedEntry.status !== 'locked' && (
              <button
                type="button"
                className="story-puzzle-console__cinematic"
                onClick={() => requestEchoTransformationCinematic(selectedPuzzle.cinematicStageId!)}
              >
                <Clapperboard aria-hidden="true" /> {screenCopy.replayCinematic}
              </button>
            )}
          </div>
          <PuzzleReference reference={selectedPuzzle.reference} />

          {selectedEntry.status !== 'locked' && selectedEntry.status !== 'completed' && (
            <section className="story-puzzle-console__mission" aria-label={screenCopy.missionLabel}>
              <span><Sparkles aria-hidden="true" /> {screenCopy.missionTitle}</span>
              <p>{selectedPuzzle.brief?.[locale] ?? selectedPuzzle.objective[locale]}</p>
              <small>{screenCopy.missionDetail}</small>
            </section>
          )}

          {selectedEntry.status === 'locked' ? (
            <div className="story-puzzle-console__locked">
              <LockKeyhole aria-hidden="true" />
              <strong>{screenCopy.evidencePage(selectedPuzzle.source.globalPageNumber)}</strong>
              {missingPrerequisite ? (
                <p>{screenCopy.blockedByPuzzle(missingPrerequisite.title[locale], selectedPuzzle.source.globalPageNumber)}</p>
              ) : (
                <p>{screenCopy.blockedByPage(selectedPuzzle.source.globalPageNumber)}</p>
              )}
              <button type="button" onClick={requestManhwaReader}>
                <BookOpenCheck aria-hidden="true" /> {screenCopy.continueManhwa}
              </button>
            </div>
          ) : selectedEntry.status === 'completed' ? (
            <div className="story-puzzle-console__completed">
              <Check aria-hidden="true" /><h3>{selectedPuzzle.completionMessage[locale]}</h3><p>{selectedEntry.perfectSolve ? (locale === 'ar' ? 'تمت الاستعادة دون استخدام تلميحات.' : 'Recovery completed without hints.') : (locale === 'ar' ? 'تم حفظ الاستعادة في السجل الخادمي.' : 'The recovery is saved in the server record.')}</p>
              <section className="story-puzzle-console__completion-loop" aria-label={screenCopy.nextObjective}>
                <div className="story-puzzle-console__completion-echo" role="status" aria-live="polite">
                  <EchoPresence variant="mini" showTelemetry={false} label="Echo" />
                  <span><small>{screenCopy.echoResponse}</small><strong>{nextObjective.echoLine}</strong></span>
                </div>
                <small>{screenCopy.nextObjective}</small>
                <strong>{nextObjective.title}</strong>
                <p>{nextObjective.detail}</p>
                <button type="button" onClick={requestManhwaReader}>
                  <BookOpenCheck aria-hidden="true" /> {screenCopy.continueManhwa}
                </button>
              </section>
              {selectedPuzzle.image && <img src={selectedPuzzle.image.src} alt={selectedPuzzle.image.alt[locale]} loading="lazy" />}
            </div>
          ) : (
            <>
              {currentStage && (
                <div className="story-puzzle-stages">
                  <span dir="ltr">STAGE {stageIndex + 1} / {stageDrafts.length}</span>
                  <div>{stageDrafts.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      data-active={index === stageIndex}
                      data-prepared={index < stageIndex && hasPuzzleDraftInput(stageDrafts[index]!)}
                      disabled={index > stageIndex || busy}
                      aria-label={screenCopy.stage(index + 1)}
                      aria-current={index === stageIndex ? 'step' : undefined}
                      onClick={() => {
                        if (index <= stageIndex) queueSave(composeStageDraft(draft, index, stageDrafts));
                      }}
                    >{index + 1}</button>
                  ))}</div>
                  <strong>{currentStage.objective[locale]}</strong>
                  {currentStage.clue && <p>{currentStage.clue[locale]}</p>}
                  <small className="story-puzzle-stages__verification-note">{screenCopy.stageDetail}</small>
                </div>
              )}
              <PuzzleMechanic
                key={`${selectedPuzzle.id}:${stageIndex}:${draftResetVersion}`}
                puzzle={selectedPuzzle}
                mechanic={activeMechanic}
                options={currentStage?.options}
                tokenLimit={currentStage?.tokenLimit}
                signal={currentStage?.signal ?? selectedPuzzle.signal}
                draft={activeDraft}
                onChange={updateActiveDraft}
                disabled={busy}
                onVisualAssetStateChange={visualAssetContext ? reportVisualAssetState : undefined}
              />
              <p className="story-puzzle-console__readiness" data-ready={actionReadiness.ready} role="status">
                <Activity aria-hidden="true" /> {actionReadiness.message}
              </p>
              <div className="story-puzzle-console__actions">
                {currentStage && stageIndex < stageDrafts.length - 1 ? (
                  <button type="button" disabled={busy || !actionReadiness.ready} onClick={() => void advanceStage()}>{screenCopy.confirmStage} <ChevronLeft aria-hidden="true" /></button>
                ) : (
                  <button type="button" disabled={busy || !actionReadiness.ready} onClick={() => void complete()}><Zap aria-hidden="true" /> {screenCopy.verify}</button>
                )}
                <button type="button" className="story-puzzle-console__quiet" disabled={busy} onClick={() => void saveNow()}>{screenCopy.save}</button>
                <button type="button" className="story-puzzle-console__quiet" disabled={busy} onClick={resetPuzzle}><RotateCcw aria-hidden="true" /> {screenCopy.retry}</button>
              </div>
            </>
          )}
          {error && <p className="story-puzzle-console__error" role="alert"><TriangleAlert aria-hidden="true" /> {error}</p>}
          {latestActivity?.kind === 'puzzle-attempt-rejected' && latestActivity.puzzleId === selectedPuzzle.id && (
            <aside className="story-puzzle-console__echo-retry" aria-label={screenCopy.echoRetry} role="status" aria-live="polite">
              <EchoPresence variant="mini" showTelemetry={false} label="Echo" />
              <div className="story-puzzle-console__echo-retry-copy"><small>{screenCopy.echoResponse}</small><p><strong>Echo:</strong> {locale === 'ar' ? 'لم تُحسم الإشارة بعد.' : 'The signal is not resolved yet.'} {retryGuidance(currentStage?.mechanic ?? selectedPuzzle.mechanic, locale)}</p></div>
            </aside>
          )}
        </section>

        <aside className="story-puzzle-hints" aria-label={screenCopy.hints}>
          <header><CircleHelp aria-hidden="true" /><span>ASSISTANCE CHANNEL</span></header>
          {selectedPuzzle.hints.map((hint, index) => {
            const unlocked = selectedEntry.unlockedHintIndexes.includes(index);
            const preceding = index === 0 || selectedEntry.unlockedHintIndexes.includes(index - 1);
            const cost = selectedEntry.hintCosts[index];
            return (
              <article key={index} data-unlocked={unlocked}>
                <small>HINT {String(index + 1).padStart(2, '0')} <strong>{cost === 0 ? 'FREE' : `${cost} ◉`}</strong></small>
                {unlocked ? <p>{hint[locale]}</p> : <button type="button" disabled={busy || !preceding || selectedEntry.status === 'locked'} onClick={() => void openHint(index)}>{locale === 'ar' ? 'فتح التلميح' : 'Open hint'}</button>}
              </article>
            );
          })}
          <footer><ScanLine aria-hidden="true" /> {screenCopy.hintDetail}</footer>
        </aside>
      </main>

      {storeStatus === 'loading' && !snapshot && <div className="story-puzzle-loading">SYNCHRONIZING VERIFIED RECORDS…</div>}
      {latestReward && <RewardMoment onDismiss={actions.dismissReward} onContinueManhwa={continueToNextManhwa} />}
    </div>
  );
}
