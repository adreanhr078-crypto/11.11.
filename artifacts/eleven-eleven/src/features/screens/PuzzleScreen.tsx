import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from 'react';
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
  StoryPuzzleSnapshotEntry,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useCollectionStore } from '../collection/collectionStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import {
  useShellStore,
  useUiPreferencesStore,
} from '../../app/shell/shellStore';
import {
  playPuzzleCompletionSound,
  primeRewardAudio,
} from '../../infrastructure/audio/puzzleRewardAudio';
import { requestEchoTransformationCinematic } from '../../ui/presentation/EchoTransformationCinematic';
import { EchoPresence } from '../../ui/presentation/EchoPresence';
import { emitExperienceCue } from '../../ui/presentation/experienceCues';
import './story-puzzle-experience.css';

const EMPTY_STORY_PUZZLE_ENTRIES: readonly StoryPuzzleSnapshotEntry[] = Object.freeze([]);

const emptyDraft = (): StoryPuzzleDraft => ({
  stageIndex: 0,
  tokens: [],
  assignments: {},
  imageOrder: [],
  rotations: {},
});

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
      assignments: {},
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
  if (current.length >= maximum) return [...current.slice(1), optionId];
  return [...current, optionId];
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
        Object.keys(puzzle.rotationGoal ?? {}).every((tile) => draft.rotations[tile] !== undefined),
        'دوّر كل عقدة، ثم أرسل محاولتك للتحقق الخادمي.',
      );
    case 'layer-alignment':
      return complete(
        Object.keys(puzzle.rotationGoal ?? {}).every((layer) => draft.rotations[layer] !== undefined),
        'اضبط كل طبقة، ثم أرسل محاولتك للتحقق الخادمي.',
      );
    case 'load-balancing': {
      const values = ['power', 'data', 'cooling'].map((channel) => Number(draft.assignments[channel] ?? 0));
      return complete(
        ['power', 'data', 'cooling'].every((channel) => draft.assignments[channel] !== undefined),
        values.reduce((sum, value) => sum + value, 0) !== 100
          ? 'اجعل مجموع القنوات 100% ثم أرسل المحاولة للتحقق.'
          : 'المجموع مؤقت؛ أرسل المحاولة لمعرفة ما يحتاج إلى ضبط.',
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

function recordSignal(optionId: string): string {
  void optionId;
  return 'EVIDENCE NODE // INSPECT SOURCE RECORD';
}

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
  return (
    <section
      className="story-evidence-board"
      data-mode={mechanic}
      aria-label="Verified evidence board"
    >
      <header>
        <ScanLine aria-hidden="true" />
        <span>{mechanic === 'deduction' ? 'EVIDENCE SYNTHESIS' : 'RECORD COMPARISON'}</span>
      </header>
      <div>
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            data-selected={selected.includes(option.id)}
            onClick={() => onChange({
              ...draft,
              tokens: selectedTokens(selected, option.id, maximum),
            })}
          >
            <small>NODE {String(index + 1).padStart(2, '0')}</small>
            <strong>{option.label[locale]}</strong>
            {option.detail && <span>{option.detail[locale]}</span>}
            <span>{recordSignal(option.id)}</span>
          </button>
        ))}
      </div>
      <p>{mechanic === 'deduction'
        ? 'حدد الأدلة المتوافقة ثم ثبّت تسلسلها داخل السجل.'
        : 'قارن السجل مع الإشارة قبل تثبيت النتيجة.'}</p>
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
  const cells = [
    ['a1', '↗'], ['a2', '↗'], ['a3', '↗'],
    ['b1', '↗'], ['b2', '↗'], ['b3', '↗'],
    ['c1', '↗'], ['c2', '↗'], ['c3', '↗'],
    ['d1', '↗'], ['d2', '↗'], ['d3', '↘'],
  ] as const;
  return (
    <section className="story-pattern-scan" aria-label="Anomaly pattern scanner">
      <header><ScanLine aria-hidden="true" /> PATTERN SCAN // FIND THE DIRECTIONAL BREACH</header>
      <div>
        {cells.map(([cell, direction]) => {
          const display = cell.toUpperCase();
          return (
            <button
              key={cell}
              type="button"
              disabled={disabled}
              data-selected={draft.tokens.includes(cell)}
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
      <p>لا تعتمد على اللون فقط؛ افحص اتجاه كل عقدة.</p>
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
  return (
    <section className="story-data-route" aria-label="Data routing graph">
      <header><Crosshair aria-hidden="true" /> ROUTE PACKET // SELECT A SAFE ORDER</header>
      <div className="story-data-route__path" aria-live="polite">
        {draft.tokens.length > 0
          ? draft.tokens.map((token) => token.toUpperCase()).join(' → ')
          : 'AWAITING ROUTE'}
      </div>
      <div className="story-data-route__nodes">
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            data-selected={draft.tokens.includes(option.id)}
            style={{ '--node': index } as CSSProperties}
            onClick={() => onChange({
              ...draft,
              tokens: selectedTokens(draft.tokens, option.id, maximum),
            })}
          >
            <strong>{option.label[locale]}</strong>
            {option.detail && <small>{option.detail[locale]}</small>}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="story-data-route__clear"
        disabled={disabled || draft.tokens.length === 0}
        onClick={() => onChange({ ...draft, tokens: [] })}
      >
        إعادة المسار
      </button>
    </section>
  );
}

interface ImageReconstructionBoardProps {
  puzzle: StoryPuzzleDefinition;
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
}

function ImageReconstructionBoard({
  puzzle,
  draft,
  onChange,
  disabled,
}: ImageReconstructionBoardProps) {
  const locale = useUiPreferencesStore((state) => state.locale);
  const imageCopy = locale === 'ar'
    ? {
      board: 'تركيب الصورة',
      piece: 'قطعة',
      rotate: 'تدوير القطعة',
      instruction: 'اسحب القطع أو اضغط قطعتين لتبديلهما.',
      rotationHint: 'استخدم رمز التدوير عند الحاجة.',
    }
    : {
      board: 'Image reconstruction',
      piece: 'Piece',
      rotate: 'Rotate piece',
      instruction: 'Drag pieces, or select two pieces to swap them.',
      rotationHint: 'Use the rotation control when needed.',
    };
  const image = puzzle.image!;
  const count = image.rows * image.columns;
  const pieces = draft.imageOrder.length === count ? draft.imageOrder : shuffledPieces(count);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  const swapPieces = (fromPiece: string, toPiece: string) => {
    if (disabled || fromPiece === toPiece) return;
    const next = [...pieces];
    const from = next.indexOf(fromPiece);
    const to = next.indexOf(toPiece);
    if (from < 0 || to < 0) return;
    [next[from], next[to]] = [next[to]!, next[from]!];
    onChange({ ...draft, imageOrder: next });
    setSelectedPiece(null);
  };

  const rotatePiece = (pieceId: string) => {
    if (disabled || !image.allowRotation) return;
    onChange({
      ...draft,
      rotations: {
        ...draft.rotations,
        [pieceId]: ((draft.rotations[pieceId] ?? 0) + 1) % 4,
      },
    });
  };

  return (
    <section className="story-image-puzzle" aria-label={imageCopy.board}>
      <div
        className="story-image-puzzle__grid"
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
          return (
            <article
              key={pieceId}
              className="story-image-puzzle__piece"
              draggable={!disabled}
              data-selected={selectedPiece === pieceId}
              data-rotation={rotation}
              onDragStart={(event: DragEvent<HTMLElement>) => {
                event.dataTransfer.setData('text/plain', pieceId);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                swapPieces(event.dataTransfer.getData('text/plain'), pieceId);
              }}
              onClick={() => {
                if (disabled) return;
                if (!selectedPiece) setSelectedPiece(pieceId);
                else swapPieces(selectedPiece, pieceId);
              }}
            >
              <button
                type="button"
                className="story-image-puzzle__art"
                disabled={disabled}
                aria-label={`${imageCopy.piece} ${sourceIndex + 1}`}
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
                  disabled={disabled}
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
      <p>{imageCopy.instruction} {image.allowRotation ? imageCopy.rotationHint : ''}</p>
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
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
}

function LayerAlignmentBoard({
  puzzle,
  draft,
  onChange,
  disabled,
}: Omit<PuzzleMechanicProps, 'mechanic' | 'options'>) {
  const layers = ['layer1', 'layer2', 'layer3', 'layer4'];
  if (!puzzle.image) return null;
  return (
    <section className="story-layer-board" aria-label="محاذاة طبقات الذاكرة">
      <header>
        <ScanLine aria-hidden="true" />
        <span>MEMORY PHASE ALIGNMENT</span>
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
              aria-label={`تغيير طور الطبقة ${index + 1}، الطور الحالي ${phase}`}
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
      <p>اضغط كل طبقة لتغيير طورها. تتوهج الفواصل عندما تقترب المحاذاة.</p>
    </section>
  );
}

function LoadBalancingBoard({
  draft,
  onChange,
  disabled,
}: Omit<PuzzleMechanicProps, 'puzzle' | 'mechanic' | 'options'>) {
  const channels = [
    { id: 'power', label: 'الطاقة', code: 'PWR' },
    { id: 'data', label: 'البيانات', code: 'DATA' },
    { id: 'cooling', label: 'التبريد', code: 'COOL' },
  ] as const;
  const total = channels.reduce((sum, channel) => (
    sum + Number(draft.assignments[channel.id] ?? 0)
  ), 0);
  return (
    <section className="story-load-board" aria-label="موازنة حمل النظام">
      <header>
        <Activity aria-hidden="true" />
        <span>EMERGENCY LOAD // <strong>{total}%</strong></span>
      </header>
      <div>
        {channels.map((channel) => {
          const value = Number(draft.assignments[channel.id] ?? 20);
          return (
            <label key={channel.id}>
              <span><b>{channel.code}</b><small>{channel.label}</small><strong>{value}%</strong></span>
              <input
                type="range"
                min="10"
                max="60"
                step="10"
                value={value}
                disabled={disabled}
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
      <p>{total === 100
        ? 'المجموع مكتمل؛ أرسل المحاولة لترى نتيجة الفحص.'
        : `اضبط القنوات: الفرق عن الاستقرار ${Math.abs(100 - total)}%.`}</p>
    </section>
  );
}

const SIGNAL_PROBES = [
  {
    frequency: '42',
    scan: 'A',
    path: 'M2 27 C16 8 25 8 37 27 S60 46 74 27 S98 8 118 27',
    description: 'قمة الموجة لا تقابل قاعها حول خط الوسط؛ القراءة منحازة.',
  },
  {
    frequency: '58',
    scan: 'B',
    path: 'M2 27 C16 9 25 9 37 27 S60 45 74 27 S98 9 118 27',
    description: 'القمتان والقاعان على المسافة نفسها من خط الوسط.',
  },
  {
    frequency: '74',
    scan: 'C',
    path: 'M2 27 C15 18 26 4 37 27 S63 52 74 27 S98 18 118 27',
    description: 'سعة القاع أوسع من القمة؛ القراءة غير مستقرة.',
  },
] as const;

const SIGNAL_CHANNELS = [
  { id: 'channel-07', code: '07', noise: 'نبضتا تشويش متقاطعتان.' },
  { id: 'channel-11', code: '11', noise: 'لا توجد نبضة تشويش فوق خط القياس.' },
  { id: 'channel-13', code: '13', noise: 'نبضة تشويش تنزلق قرب نهاية القياس.' },
] as const;

const SIGNAL_PROBE_DESCRIPTIONS_EN: Record<string, string> = {
  '42': 'The wave crest and trough do not mirror around the center line; this reading is biased.',
  '58': 'The two crests and two troughs sit equally far from the center line.',
  '74': 'The trough is wider than the crest; this reading is unstable.',
};

const SIGNAL_CHANNEL_NOISE_EN: Record<string, string> = {
  'channel-07': 'Two interference pulses cross the channel.',
  'channel-11': 'No interference pulse crosses the measurement line.',
  'channel-13': 'An interference pulse slips near the end of the measurement.',
};

function PuzzleMechanic({ puzzle, mechanic, options: stageOptions, tokenLimit, draft, onChange, disabled }: PuzzleMechanicProps) {
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
    const pulseTimers = reducedMotion
      ? []
      : [1, 2, 3].map((index) => window.setTimeout(() => setMemoryPulseIndex(index), index * 520));
    const hideTimer = window.setTimeout(() => setMemoryPreview(false), reducedMotion ? 3000 : 2350);
    return () => {
      pulseTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(hideTimer);
    };
  }, [mechanic, puzzle.id, memoryReplay, reducedMotion]);

  if (mechanic === 'image-reconstruction') {
    return <ImageReconstructionBoard puzzle={puzzle} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'layer-alignment') {
    return <LayerAlignmentBoard puzzle={puzzle} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'load-balancing') {
    return <LoadBalancingBoard draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'signal') {
    const frequency = draft.tokens[0] ?? '';
    const channel = draft.tokens[1] ?? '';
    const signalCopy = locale === 'ar'
      ? {
        board: 'لوحة معايرة الإشارة',
        instruction: 'اختر القراءة المتوازنة، ثم القناة التي لا يقطعها التشويش. لا تُكشف صحة الاختيار قبل التحقق الخادمي.',
        readings: 'قراءات التردد',
        channel: 'قناة الإشارة',
        reading: 'القراءة',
      }
      : {
        board: 'Signal calibration board',
        instruction: 'Choose the balanced reading, then the channel without interference. Your choice is not revealed as correct until the server verifies it.',
        readings: 'Frequency readings',
        channel: 'Signal channel',
        reading: 'Reading',
      };
    return (
      <section className="story-signal-board" aria-label={signalCopy.board}>
        <p className="story-signal-board__instruction">{signalCopy.instruction}</p>
        <div className="story-signal-board__probes" role="group" aria-label={signalCopy.readings}>
          {SIGNAL_PROBES.map((probe) => (
            <button
              key={probe.frequency}
              type="button"
              disabled={disabled}
              data-selected={frequency === probe.frequency}
              aria-pressed={frequency === probe.frequency}
              aria-label={`${signalCopy.reading} ${probe.scan}, ${probe.frequency}. ${locale === 'en' ? SIGNAL_PROBE_DESCRIPTIONS_EN[probe.frequency] : probe.description}`}
              onClick={() => onChange({
                ...draft,
                tokens: [frequency === probe.frequency ? '' : probe.frequency, channel].filter(Boolean),
              })}
            >
              <svg viewBox="0 0 120 54" aria-hidden="true"><path d="M0 27 H120" /><path d={probe.path} /></svg>
              <strong dir="ltr">SCAN {probe.scan} // {probe.frequency}</strong>
            </button>
          ))}
        </div>
        <div className="story-choice-row" role="group" aria-label={signalCopy.channel}>
          {SIGNAL_CHANNELS.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              disabled={disabled}
              data-selected={channel === candidate.id}
              aria-pressed={channel === candidate.id}
              onClick={() => onChange({
                ...draft,
                tokens: [frequency, channel === candidate.id ? '' : candidate.id].filter(Boolean),
              })}
            >
              <strong dir="ltr">CH-{candidate.code}</strong><small>{locale === 'en' ? SIGNAL_CHANNEL_NOISE_EN[candidate.id] : candidate.noise}</small>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (mechanic === 'wiring' || mechanic === 'color-routing') {
    const accessNodeLock = (
      mechanic === 'wiring'
      && stageOptions?.some((option) => option.id === 'echo')
    );
    const sources = accessNodeLock ? ['access'] : assignmentSources(mechanic);
    const targets = accessNodeLock ? stageOptions! : assignmentTargets(mechanic);
    return (
      <section className="story-wiring-board" data-mode={mechanic} aria-label="لوحة التوصيل">
        {sources.map((source) => (
          <article key={source}>
            <strong>{source.toUpperCase()}</strong>
            <span className="story-wiring-board__line" data-active={Boolean(draft.assignments[source])} />
            <div>
              {targets.map((target) => (
                <button
                  key={target.id} type="button" disabled={disabled}
                  data-selected={draft.assignments[source] === target.id}
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
        ))}
      </section>
    );
  }

  if (mechanic === 'matrix') {
    const tiles = ['tile1', 'tile2', 'tile3', 'tile4'];
    return (
      <section className="story-matrix-board" aria-label="System matrix">
        {tiles.map((tile, index) => {
          const rotation = draft.rotations[tile] ?? ((index + 1) % 4);
          return (
            <button
              key={tile} type="button" disabled={disabled} data-rotation={rotation}
              onClick={() => onChange({ ...draft, rotations: { ...draft.rotations, [tile]: (rotation + 1) % 4 } })}
              aria-label={`تدوير عقدة ${index + 1}`}
            ><i /><i /><span>R{rotation}</span></button>
          );
        })}
      </section>
    );
  }

  if (mechanic === 'visual-forensics') {
    const selected = draft.tokens;
    const source = puzzle.image?.src;
    return (
      <section className="story-forensics-board" aria-label="Visual forensics scanner">
        <div className="story-forensics-board__record">
          {source && <img src={source} alt={puzzle.image?.alt[locale]} loading="lazy" />}
          <ScanLine aria-hidden="true" />
          {options.map((option, index) => (
            <button
              key={option.id} type="button" disabled={disabled}
              data-selected={selected.includes(option.id)}
              style={{ '--point': index } as CSSProperties}
              onClick={() => onChange({ ...draft, tokens: selectedTokens(selected, option.id, 2) })}
            >
              <strong>{option.id.toUpperCase()}</strong>
              {option.detail && <small>{option.detail[locale]}</small>}
            </button>
          ))}
        </div>
        <p>حرّك الماسح عبر السجل وحدد موضعي الشذوذ. التحكم لا يعتمد على اللون وحده.</p>
      </section>
    );
  }

  if (mechanic === 'memory-grid') {
    const grid = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
    const pulsePattern = ['a1', 'b2', 'c3', 'b2'];
    return (
      <section className="story-memory-grid" data-preview={memoryPreview} aria-label="Memory grid">
        <header>{memoryPreview
          ? reducedMotion ? 'PATTERN BUFFER // STATIC ACCESSIBLE VIEW' : `PATTERN BUFFER // PULSE ${memoryPulseIndex + 1} / 4`
          : 'PATTERN BUFFER // RESTORE'}</header>
        {memoryPreview && reducedMotion && (
          <p className="story-memory-grid__static-pattern" role="status">A1 → B2 → C3 → B2</p>
        )}
        <div>
          {grid.map((id) => (
            <button
              key={id} type="button" disabled={disabled || memoryPreview}
              data-preview={memoryPreview && !reducedMotion && pulsePattern[memoryPulseIndex] === id}
              data-selected={draft.tokens.includes(id)}
              onClick={() => onChange({ ...draft, tokens: selectedTokens(draft.tokens, id, 4, true) })}
            >{id.toUpperCase()}</button>
          ))}
        </div>
        <p>{memoryPreview ? 'احفظ النمط قبل أن يختفي.' : 'أعد النمط بالنقر على العقد بالترتيب.'}</p>
        <button
          type="button"
          className="story-memory-grid__replay"
          disabled={disabled || memoryPreview}
          onClick={() => setMemoryReplay((value) => value + 1)}
        >
          إعادة عرض النمط
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

  if (mechanic === 'evidence' || mechanic === 'contradiction' || mechanic === 'deduction') {
    return <EvidenceBoard mechanic={mechanic} options={options} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  const selected = draft.tokens;
  const limit = sequenceLimit(mechanic, tokenLimit);
  const ordered = ['sequence', 'timeline', 'cipher', 'mirror-code', 'data-route'].includes(mechanic);
  const repeatable = ['cipher', 'mirror-code', 'memory-grid'].includes(mechanic);
  return (
    <section className="story-token-board" data-mode={mechanic} aria-label="لوحة حل النظام">
      <div className="story-token-board__buffer" aria-live="polite">
        {selected.length === 0 ? <span>AWAITING INPUT</span> : selected.map((token, index) => (
          <button key={`${token}-${index}`} type="button" disabled={disabled} onClick={() => onChange({ ...draft, tokens: selected.filter((_, itemIndex) => itemIndex !== index) })}>
            {ordered && <small>{index + 1}</small>}{token.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="story-token-board__choices">
        {options.map((option) => (
          <button
            key={option.id} type="button" disabled={disabled}
            data-selected={!repeatable && selected.includes(option.id)}
            onClick={() => onChange({ ...draft, tokens: selectedTokens(selected, option.id, limit, repeatable) })}
          >
            {option.symbol && <i>{option.symbol}</i>}
            <strong>{option.label[locale]}</strong>
            {option.detail && <small>{option.detail[locale]}</small>}
            <small>{option.label.en}</small>
          </button>
        ))}
      </div>
      <button type="button" className="story-token-board__clear" disabled={disabled || selected.length === 0} onClick={() => onChange({ ...draft, tokens: [] })}>إعادة الإدخال</button>
    </section>
  );
}

function RewardMoment({ onDismiss }: { onDismiss: () => void }) {
  const reward = useStoryPuzzleStore((state) => state.latestReward);
  const locale = useUiPreferencesStore((state) => state.locale);
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
  return (
    <div ref={dialogRef} className="story-reward-moment" role="dialog" aria-modal="true" aria-labelledby="story-reward-title" aria-describedby="story-reward-description">
      <div className="story-reward-moment__shard"><Sparkles aria-hidden="true" /></div>
      <section>
        <EchoPresence
          className="story-reward-moment__echo"
          variant="mini"
          label="Echo"
          showTelemetry={false}
          eager
        />
        <small>SYSTEM MEMORY FRAGMENT DETECTED</small>
        <h2 id="story-reward-title">تم اكتساب شظية ذاكرة</h2>
        <p id="story-reward-description">{puzzle?.completionMessage[locale] ?? (locale === 'ar' ? 'تمت الاستعادة.' : 'Recovery complete.')}</p>
        <dl>
          <div><dt>XP</dt><dd>+{reward.xpGranted}</dd></div>
          <div><dt>SHARD</dt><dd dir="ltr">{reward.snapshot.shardCount} / 20</dd></div>
        </dl>
        <div className="story-reward-moment__echo-impact">
          <Activity aria-hidden="true" />
          <span><small>ECHO RESONANCE</small><strong>+{reward.echoImpact.amount} · {reward.echoImpact.label[locale]}</strong></span>
        </div>
        {reward.perfectBonusCoins > 0 && <strong className="story-reward-moment__perfect">PERFECT SOLVE +{reward.perfectBonusCoins} COINS</strong>}
        <button ref={continueRef} type="button" onClick={onDismiss}>متابعة</button>
      </section>
    </div>
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
      confirmStage: 'تثبيت المرحلة',
      verify: 'تحقق من الاستعادة',
      save: 'حفظ الآن',
      retry: 'إعادة المحاولة',
      echoRetry: 'ملاحظة Echo بعد المحاولة',
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
      confirmStage: 'Confirm stage',
      verify: 'Verify recovery',
      save: 'Save now',
      retry: 'Try again',
      echoRetry: 'Echo note after this attempt',
      hints: 'Puzzle hints',
      hintDetail: 'Using a hint does not remove XP or the shard; it only removes the perfect-solve bonus.',
    };
  const requestManhwaReader = useShellStore(
    (state) => state.requestManhwaReader,
  );
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>('story_puzzle_01_signal_calibration');
  const [draft, setDraft] = useState<StoryPuzzleDraft>(() => defaultDraft(STORY_PUZZLE_BY_ID.story_puzzle_01_signal_calibration!));
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const playedPuzzleCinematics = useRef(new Set<string>());

  useEffect(() => {
    if (authStatus === 'signed-in') void actions.load();
  }, [actions, authStatus]);

  useEffect(() => {
    if (latestReward?.awarded) void loadCollection(true);
  }, [latestReward, loadCollection]);

  const entries = snapshot?.entries ?? EMPTY_STORY_PUZZLE_ENTRIES;
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.puzzleId, entry])), [entries]);
  const visiblePuzzles = useMemo(() => STORY_PUZZLES.filter((puzzle) => (
    puzzle.classification === 'main' || entryById.get(puzzle.id)?.status !== 'hidden'
  )), [entryById]);
  const selectedPuzzle = STORY_PUZZLE_BY_ID[selectedPuzzleId] ?? STORY_PUZZLES[0]!;
  const selectedEntry = entryById.get(selectedPuzzle.id) ?? {
    puzzleId: selectedPuzzle.id, status: 'locked' as const, discovered: selectedPuzzle.classification === 'main', completedAt: null,
    perfectSolve: false, unlockedHintIndexes: [], hintCosts: [0, 12, 24] as [number, number, number], draft: null,
  };
  const stageDrafts = selectedPuzzle.stages?.length ? parseStages(selectedPuzzle, draft) : [];
  const stageIndex = Math.min(draft.stageIndex, Math.max(0, stageDrafts.length - 1));
  const currentStage = selectedPuzzle.stages?.[stageIndex];
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
      ? { ready: false, message: 'انتقل إلى المرحلة الحالية لإكمال اللغز.' }
      : draftReadiness(selectedPuzzle, selectedPuzzle.mechanic, draft, undefined, undefined, locale);
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
    const entry = entryById.get(selectedPuzzle.id);
    setDraft(entry?.draft ? cloneDraft(entry.draft) : defaultDraft(selectedPuzzle));
  }, [entryById, selectedPuzzle]);

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

  const queueSave = (next: StoryPuzzleDraft) => {
    setDraft(next);
    if (selectedEntry.status === 'locked' || selectedEntry.status === 'completed') return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void actions.saveDraft(selectedPuzzle.id, next); }, 550);
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
    if (selectedEntry.status === 'locked' || selectedEntry.status === 'completed') return;
    setBusy(true);
    await actions.saveDraft(selectedPuzzle.id, nextDraft);
    setBusy(false);
  };

  const complete = async () => {
    primeRewardAudio(audioEnabled);
    setBusy(true);
    const receipt = await actions.complete(selectedPuzzle.id, draft);
    if (receipt?.awarded) {
      emitExperienceCue({ name: 'puzzle-reward', sourceId: selectedPuzzle.id });
      if (audioEnabled) playPuzzleCompletionSound(sfxVolume);
      void loadProfile();
      void loadLeaderboard(true);
    }
    setBusy(false);
  };

  const advanceStage = async () => {
    if (!currentStage || !activeReadiness.ready) return;
    const nextIndex = Math.min(stageIndex + 1, stageDrafts.length - 1);
    const next = composeStageDraft(draft, nextIndex, stageDrafts);
    queueSave(next);
    await saveNow(next);
  };

  const resetPuzzle = () => {
    const next = defaultDraft(selectedPuzzle);
    queueSave(next);
  };

  const discover = async (secretId: string) => {
    setBusy(true);
    const next = await actions.discover(secretId);
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
                      data-complete={index < stageIndex}
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
                </div>
              )}
              <PuzzleMechanic
                puzzle={selectedPuzzle}
                mechanic={(currentStage?.mechanic ?? selectedPuzzle.mechanic) as Exclude<
                  StoryPuzzleMechanic,
                  'multi-stage' | 'breach-protocol'
                >}
                options={currentStage?.options}
                tokenLimit={currentStage?.tokenLimit}
                draft={activeDraft}
                onChange={updateActiveDraft}
                disabled={busy}
              />
              <p className="story-puzzle-console__readiness" data-ready={activeReadiness.ready} role="status">
                <Activity aria-hidden="true" /> {activeReadiness.message}
              </p>
              <div className="story-puzzle-console__actions">
                {currentStage && stageIndex < stageDrafts.length - 1 ? (
                  <button type="button" disabled={busy || !activeReadiness.ready} onClick={() => void advanceStage()}>{screenCopy.confirmStage} <ChevronLeft aria-hidden="true" /></button>
                ) : (
                  <button type="button" disabled={busy || !activeReadiness.ready} onClick={() => void complete()}><Zap aria-hidden="true" /> {screenCopy.verify}</button>
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
              <p><strong>Echo:</strong> {locale === 'ar' ? 'لم تُحسم الإشارة بعد.' : 'The signal is not resolved yet.'} {retryGuidance(currentStage?.mechanic ?? selectedPuzzle.mechanic, locale)}</p>
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
                {unlocked ? <p>{hint[locale]}</p> : <button type="button" disabled={busy || !preceding || selectedEntry.status === 'locked'} onClick={() => void actions.unlockHint(selectedPuzzle.id, index)}>{locale === 'ar' ? 'فتح التلميح' : 'Open hint'}</button>}
              </article>
            );
          })}
          <footer><ScanLine aria-hidden="true" /> {screenCopy.hintDetail}</footer>
        </aside>
      </main>

      {storeStatus === 'loading' && !snapshot && <div className="story-puzzle-loading">SYNCHRONIZING VERIFIED RECORDS…</div>}
      {latestReward && <RewardMoment onDismiss={actions.dismissReward} />}
    </div>
  );
}
