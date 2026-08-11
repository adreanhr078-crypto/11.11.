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
  Check,
  ChevronLeft,
  CircleHelp,
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
  StoryPuzzleSnapshotEntry,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useCollectionStore } from '../collection/collectionStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  playPuzzleCompletionSound,
  primeRewardAudio,
} from '../../infrastructure/audio/puzzleRewardAudio';
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
      rotations: { tile1: 1, tile2: 2, tile3: 3, tile4: 0 },
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

function sequenceLimit(mechanic: StoryPuzzleMechanic): number {
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

function sourceOptions(puzzle: StoryPuzzleDefinition): readonly StoryPuzzleOption[] {
  return puzzle.options ?? [
    { id: 'signal', label: { ar: 'إشارة', en: 'Signal' }, symbol: '⌁' },
    { id: 'memory', label: { ar: 'ذاكرة', en: 'Memory' }, symbol: '◇' },
    { id: 'access', label: { ar: 'وصول', en: 'Access' }, symbol: '⌘' },
    { id: 'echo', label: { ar: 'Echo', en: 'Echo' }, symbol: '◉' },
  ];
}

function statusLabel(status: StoryPuzzleSnapshotEntry['status']): string {
  switch (status) {
    case 'available': return 'متاح';
    case 'in_progress': return 'قيد الاستعادة';
    case 'completed': return 'مكتمل';
    case 'locked': return 'مقفل';
    default: return 'إشارة مخفية';
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
  const signals: Record<string, string> = {
    cam07: 'CAMERA SYNC // TIMESTAMP CONSISTENT',
    cam03: 'CAMERA SYNC // OFFSET DETECTED',
    cam11: 'CAMERA SYNC // DUPLICATE RECORD',
    r01: 'RECORD ORDER // WITHIN PROTOCOL',
    r02: 'RECORD ORDER // PARTIAL MATCH',
    r03: 'RECORD ORDER // TEMPORAL CONFLICT',
    '1111': 'TIME MARK // VERIFIED',
  };
  return signals[optionId] ?? `EVIDENCE NODE // ${optionId.toUpperCase()}`;
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
            <strong>{option.label.ar}</strong>
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

function PatternScanBoard({
  draft,
  onChange,
  disabled,
}: Pick<PuzzleMechanicProps, 'draft' | 'onChange' | 'disabled'>) {
  const cells = Array.from({ length: 12 }, (_, index) => {
    const row = String.fromCharCode(65 + Math.floor(index / 3));
    return `${row}${(index % 3) + 1}`.toLowerCase();
  });
  return (
    <section className="story-pattern-scan" aria-label="Anomaly pattern scanner">
      <header><ScanLine aria-hidden="true" /> PATTERN SCAN // FIND THE DIRECTIONAL BREACH</header>
      <div>
        {cells.map((cell) => {
          const display = cell.toUpperCase();
          const direction = cell === 'd3' ? '↘' : '↗';
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
}: {
  options: readonly StoryPuzzleOption[];
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
}) {
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
              tokens: selectedTokens(draft.tokens, option.id, 4),
            })}
          >
            {option.label.ar}
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
    <section className="story-image-puzzle" aria-label="تركيب الصورة / Image reconstruction">
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
                aria-label={`قطعة ${sourceIndex + 1}`}
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
                  aria-label={`تدوير القطعة ${sourceIndex + 1}`}
                >
                  <RotateCcw aria-hidden="true" />
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p>اسحب القطع أو اضغط قطعتين لتبديلهما. {image.allowRotation ? 'استخدم رمز التدوير عند الحاجة.' : ''}</p>
    </section>
  );
}

interface PuzzleMechanicProps {
  puzzle: StoryPuzzleDefinition;
  mechanic: Exclude<StoryPuzzleMechanic, 'multi-stage'>;
  options?: readonly StoryPuzzleOption[];
  draft: StoryPuzzleDraft;
  onChange: (next: StoryPuzzleDraft) => void;
  disabled: boolean;
}

function PuzzleMechanic({ puzzle, mechanic, options: stageOptions, draft, onChange, disabled }: PuzzleMechanicProps) {
  const options = stageOptions ?? sourceOptions(puzzle);
  const [memoryPreview, setMemoryPreview] = useState(mechanic === 'memory-grid');
  useEffect(() => {
    if (mechanic !== 'memory-grid') return undefined;
    const timer = window.setTimeout(() => setMemoryPreview(false), 1700);
    return () => window.clearTimeout(timer);
  }, [mechanic]);

  if (mechanic === 'image-reconstruction') {
    return <ImageReconstructionBoard puzzle={puzzle} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'signal') {
    const frequency = Number(draft.tokens[0] ?? 35);
    const channel = draft.tokens[1] ?? 'channel-07';
    return (
      <section className="story-signal-board" aria-label="Signal tuning board">
        <div className="story-signal-board__scope" style={{ '--signal': `${frequency}%` } as CSSProperties}>
          <i /><i /><i /><b />
        </div>
        <label>
          <span>FREQUENCY <strong>{frequency}</strong></span>
          <input
            type="range" min="0" max="100" value={frequency} disabled={disabled}
            onChange={(event) => onChange({ ...draft, tokens: [event.target.value, channel] })}
          />
        </label>
        <div className="story-choice-row" role="group" aria-label="قناة الإشارة">
          {['07', '11', '13'].map((value) => {
            const id = `channel-${value}`;
            return <button key={id} type="button" disabled={disabled} data-selected={channel === id} onClick={() => onChange({ ...draft, tokens: [String(frequency), id] })}>CH-{value}</button>;
          })}
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
                  onClick={() => onChange({ ...draft, assignments: { ...draft.assignments, [source]: target.id } })}
                >{target.label.ar}</button>
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
            ><i /><i /></button>
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
          {source && <img src={source} alt={puzzle.image?.alt.ar} loading="lazy" />}
          <ScanLine aria-hidden="true" />
          {options.map((option, index) => (
            <button
              key={option.id} type="button" disabled={disabled}
              data-selected={selected.includes(option.id)}
              style={{ '--point': index } as CSSProperties}
              onClick={() => onChange({ ...draft, tokens: selectedTokens(selected, option.id, 2) })}
            >{option.id.toUpperCase()}</button>
          ))}
        </div>
        <p>حرّك الماسح عبر السجل وحدد موضعي الشذوذ. التحكم لا يعتمد على اللون وحده.</p>
      </section>
    );
  }

  if (mechanic === 'memory-grid') {
    const grid = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
    return (
      <section className="story-memory-grid" data-preview={memoryPreview} aria-label="Memory grid">
        <header>{memoryPreview ? 'PATTERN BUFFER // OBSERVE' : 'PATTERN BUFFER // RESTORE'}</header>
        <div>
          {grid.map((id) => (
            <button
              key={id} type="button" disabled={disabled || memoryPreview}
              data-preview={memoryPreview && ['a1', 'b2', 'c3'].includes(id)}
              data-selected={draft.tokens.includes(id)}
              onClick={() => onChange({ ...draft, tokens: selectedTokens(draft.tokens, id, 4, true) })}
            >{id.toUpperCase()}</button>
          ))}
        </div>
        <p>{memoryPreview ? 'احفظ النمط قبل أن يختفي.' : 'أعد النمط بالنقر على العقد بالترتيب.'}</p>
      </section>
    );
  }

  if (mechanic === 'pattern-scan') {
    return <PatternScanBoard draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'data-route') {
    return <DataRouteBoard options={options} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  if (mechanic === 'evidence' || mechanic === 'contradiction' || mechanic === 'deduction') {
    return <EvidenceBoard mechanic={mechanic} options={options} draft={draft} onChange={onChange} disabled={disabled} />;
  }

  const selected = draft.tokens;
  const limit = sequenceLimit(mechanic);
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
            <strong>{option.label.ar}</strong>
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
  if (!reward?.awarded) return null;
  const puzzle = STORY_PUZZLE_BY_ID[reward.puzzleId];
  return (
    <div className="story-reward-moment" role="dialog" aria-modal="true" aria-labelledby="story-reward-title">
      <div className="story-reward-moment__shard"><Sparkles aria-hidden="true" /></div>
      <section>
        <small>SYSTEM MEMORY FRAGMENT DETECTED</small>
        <h2 id="story-reward-title">تم اكتساب شظية ذاكرة</h2>
        <p>{puzzle?.completionMessage.ar ?? 'تمت الاستعادة.'}</p>
        <dl>
          <div><dt>XP</dt><dd>+{reward.xpGranted}</dd></div>
          <div><dt>COINS</dt><dd>+{reward.coinsGranted + reward.perfectBonusCoins}</dd></div>
          <div><dt>SHARD</dt><dd dir="ltr">{reward.snapshot.shardCount} / 20</dd></div>
        </dl>
        {reward.perfectBonusCoins > 0 && <strong className="story-reward-moment__perfect">PERFECT SOLVE +{reward.perfectBonusCoins} COINS</strong>}
        <button type="button" onClick={onDismiss}>متابعة</button>
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
  const actions = useStoryPuzzleStore((state) => state.actions);
  const loadCollection = useCollectionStore((state) => state.actions.load);
  const loadProfile = usePlayerProgressionStore((state) => state.actions.loadProfile);
  const loadLeaderboard = usePlayerProgressionStore((state) => state.actions.loadLeaderboard);
  const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled);
  const sfxVolume = useUiPreferencesStore((state) => state.sfxVolume);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>('story_puzzle_01_signal_calibration');
  const [draft, setDraft] = useState<StoryPuzzleDraft>(() => defaultDraft(STORY_PUZZLE_BY_ID.story_puzzle_01_signal_calibration!));
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef<number | null>(null);

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
  const stageDrafts = selectedPuzzle.mechanic === 'multi-stage' ? parseStages(selectedPuzzle, draft) : [];
  const stageIndex = Math.min(draft.stageIndex, Math.max(0, stageDrafts.length - 1));
  const currentStage = selectedPuzzle.stages?.[stageIndex];
  const activeDraft = currentStage ? stageDrafts[stageIndex]! : draft;

  useEffect(() => {
    if (!visiblePuzzles.some((puzzle) => puzzle.id === selectedPuzzleId)) {
      const next = visiblePuzzles.find((puzzle) => entryById.get(puzzle.id)?.status === 'in_progress')
        ?? visiblePuzzles.find((puzzle) => entryById.get(puzzle.id)?.status === 'available')
        ?? visiblePuzzles[0];
      if (next) setSelectedPuzzleId(next.id);
    }
  }, [entryById, selectedPuzzleId, visiblePuzzles]);

  useEffect(() => {
    const entry = entryById.get(selectedPuzzle.id);
    setDraft(entry?.draft ? cloneDraft(entry.draft) : defaultDraft(selectedPuzzle));
  }, [entryById, selectedPuzzle]);

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
      if (audioEnabled) playPuzzleCompletionSound(sfxVolume);
      void loadProfile();
      void loadLeaderboard(true);
    }
    setBusy(false);
  };

  const advanceStage = async () => {
    if (!currentStage) return;
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
        <h1>قناة الألغاز محمية</h1>
        <p>سجّل الدخول لربط أدلة المانهوا وسجل الاستعادة بحسابك.</p>
      </section>
    );
  }

  return (
    <div className="story-puzzle-screen" data-mechanic={selectedPuzzle.mechanic}>
      <header className="story-puzzle-screen__header">
        <div><small>11.11 // STORY INTERFERENCE</small><h1>استعادة الذاكرة</h1></div>
        <dl>
          <div><dt>MAIN PATH</dt><dd dir="ltr">{snapshot?.mainCompletedCount ?? 0} / 14</dd></div>
          <div><dt>MEMORY SHARDS</dt><dd dir="ltr">{snapshot?.shardCount ?? 0} / 20</dd></div>
          <div><dt><Coins aria-hidden="true" /> COINS</dt><dd>{snapshot?.coinBalance ?? 0}</dd></div>
        </dl>
      </header>

      <aside className="story-puzzle-index" aria-label="قائمة ألغاز القصة">
        {visiblePuzzles.map((puzzle) => {
          const entry = entryById.get(puzzle.id);
          const status = entry?.status ?? 'locked';
          return (
            <button
              key={puzzle.id} type="button" data-active={puzzle.id === selectedPuzzle.id}
              data-status={status} disabled={status === 'locked'} onClick={() => selectPuzzle(puzzle)}
            >
              <span>{status === 'completed' ? <Check aria-hidden="true" /> : puzzle.classification === 'secret' ? <Crosshair aria-hidden="true" /> : String(puzzle.order).padStart(2, '0')}</span>
              <i><strong>{puzzle.classification === 'secret' && status === 'hidden' ? '///' : puzzle.title.ar}</strong><small>{puzzle.classification === 'secret' ? 'SECRET SIGNAL' : `CHAPTER ${puzzle.chapterId.slice(-1)}`}</small></i>
              {status === 'locked' && <LockKeyhole aria-hidden="true" />}
            </button>
          );
        })}
      </aside>

      <main className="story-puzzle-workspace">
        <section className="story-puzzle-console">
          <header>
            <span><Activity aria-hidden="true" /> {selectedPuzzle.classification === 'secret' ? 'ANOMALY CHANNEL' : 'SYSTEM CHANNEL'}</span>
            <small>PUZZLE {String(selectedPuzzle.order).padStart(2, '0')} // {statusLabel(selectedEntry.status)}</small>
          </header>
          <div className="story-puzzle-console__title">
            <div><small>{selectedPuzzle.mechanic.replace('-', ' ').toUpperCase()}</small><h2>{selectedPuzzle.title.ar}</h2><p>{selectedPuzzle.objective.ar}</p></div>
            <span className="story-puzzle-console__page">SOURCE // {String(selectedPuzzle.source.globalPageNumber).padStart(2, '0')}</span>
          </div>

          {selectedEntry.status === 'locked' ? (
            <div className="story-puzzle-console__locked"><LockKeyhole aria-hidden="true" /><strong>الدليل غير متاح بعد</strong><p>تابع قراءة المانهوا بالترتيب، ثم أكمل مسار الاستعادة السابق.</p></div>
          ) : selectedEntry.status === 'completed' ? (
            <div className="story-puzzle-console__completed">
              <Check aria-hidden="true" /><h3>{selectedPuzzle.completionMessage.ar}</h3><p>{selectedEntry.perfectSolve ? 'تمت الاستعادة دون استخدام تلميحات.' : 'تم حفظ الاستعادة في السجل الخادمي.'}</p>
              {selectedPuzzle.image && <img src={selectedPuzzle.image.src} alt={selectedPuzzle.image.alt.ar} loading="lazy" />}
            </div>
          ) : (
            <>
              {currentStage && (
                <div className="story-puzzle-stages">
                  <span dir="ltr">STAGE {stageIndex + 1} / {stageDrafts.length}</span>
                  <div>{stageDrafts.map((_, index) => <i key={index} data-active={index === stageIndex} data-complete={index < stageIndex} />)}</div>
                  <strong>{currentStage.objective.ar}</strong>
                </div>
              )}
              <PuzzleMechanic
                puzzle={selectedPuzzle}
                mechanic={(currentStage?.mechanic ?? selectedPuzzle.mechanic) as Exclude<StoryPuzzleMechanic, 'multi-stage'>}
                options={currentStage?.options}
                draft={activeDraft}
                onChange={updateActiveDraft}
                disabled={busy}
              />
              <div className="story-puzzle-console__actions">
                {currentStage && stageIndex < stageDrafts.length - 1 ? (
                  <button type="button" disabled={busy} onClick={() => void advanceStage()}>تثبيت المرحلة <ChevronLeft aria-hidden="true" /></button>
                ) : (
                  <button type="button" disabled={busy} onClick={() => void complete()}><Zap aria-hidden="true" /> تحقق من الاستعادة</button>
                )}
                <button type="button" className="story-puzzle-console__quiet" disabled={busy} onClick={() => void saveNow()}>حفظ الآن</button>
                <button type="button" className="story-puzzle-console__quiet" disabled={busy} onClick={resetPuzzle}><RotateCcw aria-hidden="true" /> إعادة المحاولة</button>
              </div>
              {snapshot?.discoverableSecretPuzzleIds.filter((secretId) => STORY_PUZZLE_BY_ID[secretId]?.anomalyHostPuzzleId === selectedPuzzle.id).map((secretId) => (
                <button key={secretId} type="button" className="story-puzzle-anomaly" disabled={busy} onClick={() => void discover(secretId)} aria-label="إشارة غير مستقرة">
                  <span>///</span><small>UNSTABLE SUBCHANNEL DETECTED</small>
                </button>
              ))}
            </>
          )}
          {error && <p className="story-puzzle-console__error"><TriangleAlert aria-hidden="true" /> {error}</p>}
        </section>

        <aside className="story-puzzle-hints" aria-label="تلميحات اللغز">
          <header><CircleHelp aria-hidden="true" /><span>ASSISTANCE CHANNEL</span></header>
          {selectedPuzzle.hints.map((hint, index) => {
            const unlocked = selectedEntry.unlockedHintIndexes.includes(index);
            const preceding = index === 0 || selectedEntry.unlockedHintIndexes.includes(index - 1);
            const cost = selectedEntry.hintCosts[index];
            return (
              <article key={index} data-unlocked={unlocked}>
                <small>HINT {String(index + 1).padStart(2, '0')} <strong>{cost === 0 ? 'FREE' : `${cost} ◉`}</strong></small>
                {unlocked ? <p>{hint.ar}</p> : <button type="button" disabled={busy || !preceding || selectedEntry.status === 'locked'} onClick={() => void actions.unlockHint(selectedPuzzle.id, index)}>فتح التلميح</button>}
              </article>
            );
          })}
          <footer><ScanLine aria-hidden="true" /> استخدام التلميح لا يلغي XP أو الشظية؛ يلغي فقط مكافأة الحل المثالي.</footer>
        </aside>
      </main>

      {storeStatus === 'loading' && !snapshot && <div className="story-puzzle-loading">SYNCHRONIZING VERIFIED RECORDS…</div>}
      {latestReward && <RewardMoment onDismiss={actions.dismissReward} />}
    </div>
  );
}
