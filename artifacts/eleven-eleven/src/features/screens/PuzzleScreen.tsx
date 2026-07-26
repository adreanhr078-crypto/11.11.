import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Coins,
  Diamond,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
} from 'lucide-react';
import {
  CHAPTER_01_PUZZLES,
} from '../../content/puzzles/chapter01Campaign';
import type {
  CampaignInteractionStage,
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
  HintTierId,
} from '../../domain/puzzles/campaignContracts';
import {
  deriveCampaignAvailability,
  isCampaignStageCorrect,
} from '../../domain/puzzles/campaignEngine';
import {
  PUZZLE_TEMPLATE_REGISTRY,
} from '../../domain/puzzles/puzzleTemplateRegistry';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import {
  PuzzleInteractionBoard,
} from '../puzzles/PuzzleInteractionBoard';
import './puzzle-campaign.css';

type CardStatus = 'locked' | 'available' | 'in_progress' | 'completed';

const difficultyLabels = {
  tutorial: 'تعليمي',
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
  page_finale: 'خاتمة الصفحة',
} as const;

function blankProgress(
  stage: CampaignInteractionStage,
  stageIndex: number,
): CampaignPuzzleProgress {
  return {
    stageIndex,
    values: stage.mode === 'rings'
      ? stage.rings.map((ring) => ring.values[0] ?? '')
      : [],
    matches: {},
  };
}

function createBlankPuzzleProgress(
  stages: readonly CampaignInteractionStage[],
): CampaignPuzzleProgress[] {
  return stages.map(blankProgress);
}

function stageCorrect(
  stage: CampaignInteractionStage,
  progress: CampaignPuzzleProgress,
) {
  return isCampaignStageCorrect(
    stage,
    progress.values,
    progress.matches,
  );
}

function applyAssistanceStep(
  stage: CampaignInteractionStage,
  progress: CampaignPuzzleProgress,
): CampaignPuzzleProgress {
  if (stage.mode === 'match') {
    const nextPair = Object.entries(stage.solution).find(
      ([source, target]) => progress.matches[source] !== target,
    );
    return nextPair
      ? {
          ...progress,
          matches: {
            ...progress.matches,
            [nextPair[0]]: nextPair[1],
          },
        }
      : progress;
  }
  if (stage.mode === 'rings') {
    const values = stage.rings.map((ring, index) => (
      progress.values[index] ?? ring.values[0] ?? ''
    ));
    const nextRing = values.findIndex(
      (value, index) => value !== stage.solution[index],
    );
    if (nextRing < 0) return progress;
    const nextValues = [...values];
    nextValues[nextRing] = stage.solution[nextRing] ?? nextValues[nextRing]!;
    return { ...progress, values: nextValues };
  }
  if (stage.mode === 'single') {
    // A one-option solution would reveal the whole puzzle, so the board
    // removes only some decoys instead.
    return progress;
  }
  if (stage.mode === 'sequence' || stage.mode === 'path') {
    let correctPrefixLength = 0;
    while (
      correctPrefixLength < progress.values.length
      && progress.values[correctPrefixLength]
        === stage.solution[correctPrefixLength]
    ) {
      correctPrefixLength += 1;
    }
    const assistedLength = Math.min(
      stage.solution.length,
      correctPrefixLength + 1,
    );
    return {
      ...progress,
      values: stage.solution.slice(0, assistedLength),
    };
  }
  const nextCorrect = stage.solution.find(
    (optionId) => !progress.values.includes(optionId),
  );
  return nextCorrect
    ? { ...progress, values: [...progress.values, nextCorrect] }
    : progress;
}

function statusLabel(status: CardStatus): string {
  switch (status) {
    case 'available': return 'متاح';
    case 'in_progress': return 'قيد الاستعادة';
    case 'completed': return 'مكتمل';
    default: return 'مقفل';
  }
}

interface CampaignHintsPanelProps {
  puzzle: CampaignPuzzleDefinition;
  status: CardStatus;
  unlockedHintIds: HintTierId[];
  onPurchase: (tierId: HintTierId) => void;
}

function CampaignHintsPanel({
  puzzle,
  status,
  unlockedHintIds,
  onPurchase,
}: CampaignHintsPanelProps) {
  const currency = useGameStore((state) => state.currency);

  return (
    <GlassPanel
      className="campaign-hints"
      tone="memory"
      eyebrow="ASSISTANCE CHANNEL"
      title="التلميحات"
    >
      {puzzle.hints.map((hint, index) => {
        const unlocked = unlockedHintIds.includes(hint.id);
        const previousUnlocked = index === 0
          || unlockedHintIds.includes(puzzle.hints[index - 1]!.id);
        const missingCurrency = Math.max(0, hint.cost - currency);
        return (
          <article key={hint.id} data-unlocked={unlocked}>
            <header>
              <span><Lightbulb aria-hidden="true" /> المستوى {index + 1}</span>
              <strong>{hint.cost === 0 ? 'FREE' : `${hint.cost} ◉`}</strong>
            </header>
            {unlocked ? (
              <p>{hint.text.ar}</p>
            ) : (
              <GameButton
                variant="ghost"
                size="sm"
                onClick={() => onPurchase(hint.id)}
                disabled={
                  status === 'locked'
                  || status === 'completed'
                  || !previousUnlocked
                  || missingCurrency > 0
                }
              >
                فتح التلميح
              </GameButton>
            )}
            {!unlocked
              && previousUnlocked
              && missingCurrency > 0
              && status !== 'locked' && (
                <small className="campaign-hint-balance">
                  تحتاج {missingCurrency} عملات إضافية
                </small>
              )}
          </article>
        );
      })}
    </GlassPanel>
  );
}

export default function PuzzleScreen() {
  const completedPuzzleIds = useGameStore(
    (state) => state.progression.completedPuzzleIds,
  );
  const puzzleProgress = useGameStore((state) => state.puzzleProgress);
  const collectedMemoryFragments = useGameStore(
    (state) => state.collectedMemoryFragments,
  );
  const lastAvailablePuzzleId = useGameStore(
    (state) => state.lastAvailablePuzzleId,
  );
  const unlockedHints = useGameStore(
    (state) => state.unlockedHintTiersByPuzzle,
  );
  const rewardEvent = useGameStore((state) => state.lastPuzzleReward);
  const actions = useGameStore((state) => state.actions);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(
    lastAvailablePuzzleId,
  );
  const [stageIndex, setStageIndex] = useState(0);
  const [draftProgress, setDraftProgress] = useState<
    CampaignPuzzleProgress[]
  >([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const rewardDialogRef = useRef<HTMLDivElement>(null);

  const statusById = useMemo(() => {
    const availability = deriveCampaignAvailability({
      completedPuzzleIds,
      collectedShardIds: collectedMemoryFragments,
      progressByPuzzleId: puzzleProgress,
    });
    return new Map<string, CardStatus>(
      Object.entries(availability.puzzleStatuses),
    );
  }, [collectedMemoryFragments, completedPuzzleIds, puzzleProgress]);

  const selectedPuzzle = CHAPTER_01_PUZZLES.find(
    (puzzle) => puzzle.id === selectedPuzzleId,
  ) ?? CHAPTER_01_PUZZLES[0]!;
  const selectedStatus = statusById.get(selectedPuzzle.id) ?? 'locked';
  const currentStage = selectedPuzzle.stages[stageIndex]
    ?? selectedPuzzle.stages[0]!;
  const currentProgress = draftProgress[stageIndex]
    ?? blankProgress(currentStage, stageIndex);
  const puzzleHints = unlockedHints[selectedPuzzle.id] ?? [];
  const assistanceHint = selectedPuzzle.hints.find(
    (hint) => (
      hint.id === 'assistance'
      && puzzleHints.includes(hint.id)
    ),
  );

  useEffect(() => {
    const saved = puzzleProgress[selectedPuzzle.id];
    const next = saved?.length === selectedPuzzle.stages.length
      ? saved
      : createBlankPuzzleProgress(selectedPuzzle.stages);
    setDraftProgress(next);
    const firstIncomplete = selectedPuzzle.stages.findIndex(
      (stage, index) => !stageCorrect(stage, next[index] ?? blankProgress(stage, index)),
    );
    setStageIndex(firstIncomplete < 0 ? selectedPuzzle.stages.length - 1 : firstIncomplete);
    setFeedback(null);
    // Store updates while interacting are mirrored locally. Reload saved
    // progress only when the player selects another puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPuzzle.id]);

  useLayoutEffect(() => {
    if (!rewardEvent) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = rewardDialogRef.current;
    const memoryTarget = document.querySelector<HTMLElement>(
      '[data-navigation-category="memory"]',
    );
    const currencyTarget = document.querySelector<HTMLElement>(
      '[data-resource="currency"]',
    );
    const setTarget = (
      target: HTMLElement | null,
      prefix: 'memory' | 'currency',
    ) => {
      if (!dialog || !target) return;
      const rect = target.getBoundingClientRect();
      dialog.style.setProperty(
        `--campaign-${prefix}-target-x`,
        `${rect.left + rect.width / 2}px`,
      );
      dialog.style.setProperty(
        `--campaign-${prefix}-target-y`,
        `${rect.top + rect.height / 2}px`,
      );
    };
    setTarget(memoryTarget, 'memory');
    setTarget(currencyTarget, 'currency');
    const firstButton = dialog?.querySelector<HTMLButtonElement>('button');
    firstButton?.focus();
    return () => previousFocus?.focus();
  }, [rewardEvent]);

  const updateCurrentProgress = (next: CampaignPuzzleProgress) => {
    const updated = selectedPuzzle.stages.map((stage, index) => (
      index === stageIndex
        ? next
        : draftProgress[index] ?? blankProgress(stage, index)
    ));
    setDraftProgress(updated);
    actions.saveCampaignPuzzleProgress(selectedPuzzle.id, updated);
    setFeedback(null);
  };

  const resetPuzzle = () => {
    const reset = createBlankPuzzleProgress(selectedPuzzle.stages);
    setDraftProgress(reset);
    setStageIndex(0);
    actions.saveCampaignPuzzleProgress(selectedPuzzle.id, reset);
    setFeedback('تمت إعادة مساحة اللغز إلى البداية.');
  };

  const verifyStage = () => {
    if (!stageCorrect(currentStage, currentProgress)) {
      setFeedback('الإشارة غير مستقرة بعد. راجع الأدلة وحاول ترتيبها من جديد.');
      return;
    }
    if (stageIndex < selectedPuzzle.stages.length - 1) {
      setStageIndex((current) => current + 1);
      setFeedback('اكتملت هذه المرحلة. انتقل إلى الجزء التالي من الذاكرة.');
      return;
    }
    const result = actions.completeCampaignPuzzle(
      selectedPuzzle.id,
      draftProgress,
    );
    setFeedback(result.message);
  };

  const buyHint = (tierId: HintTierId) => {
    const result = actions.purchaseCampaignHint(selectedPuzzle.id, tierId);
    if (
      result.success
      && !result.alreadyUnlocked
      && (
        result.hint?.effect === 'lock_correct_element'
        || result.hint?.effect === 'complete_one_step'
      )
    ) {
      const assisted = applyAssistanceStep(currentStage, currentProgress);
      if (assisted !== currentProgress) updateCurrentProgress(assisted);
    }
    setFeedback(result.message);
  };

  return (
    <div className="shell-screen campaign-puzzle-screen">
      <header
        className="shell-screen-heading"
        aria-hidden={rewardEvent ? 'true' : undefined}
        inert={Boolean(rewardEvent)}
      >
        <span className="shell-screen-code">04</span>
        <span>
          <small>PUZZLE ARCHIVE // CHAPTER 01</small>
          <h1>الألغاز</h1>
        </span>
        <div className="campaign-puzzle-screen__summary">
          <strong>{completedPuzzleIds.filter((id) => id.startsWith('puzzle_')).length}/20</strong>
          <span>ذاكرة مستعادة</span>
        </div>
      </header>

      <aside
        className="campaign-puzzle-index"
        aria-label="قائمة الألغاز"
        aria-hidden={rewardEvent ? 'true' : undefined}
        inert={Boolean(rewardEvent)}
      >
        {CHAPTER_01_PUZZLES.map((puzzle) => {
          const status = statusById.get(puzzle.id) ?? 'locked';
          const active = puzzle.id === selectedPuzzle.id;
          return (
            <button
              key={puzzle.id}
              type="button"
              data-status={status}
              data-active={active}
              disabled={status === 'locked'}
              onClick={() => setSelectedPuzzleId(puzzle.id)}
              aria-label={`${puzzle.order}. ${puzzle.title.ar} - ${statusLabel(status)}`}
            >
              <span className="campaign-puzzle-index__number">
                {status === 'completed'
                  ? <CheckCircle2 aria-hidden="true" />
                  : status === 'locked'
                    ? <LockKeyhole aria-hidden="true" />
                    : String(puzzle.order).padStart(2, '0')}
              </span>
              <span>
                <strong>{puzzle.title.ar}</strong>
                <small>
                  {PUZZLE_TEMPLATE_REGISTRY[puzzle.template].label.ar} · {difficultyLabels[puzzle.difficulty]}
                </small>
              </span>
              <ChevronLeft aria-hidden="true" />
            </button>
          );
        })}
      </aside>

      <main
        className="campaign-puzzle-workspace"
        aria-hidden={rewardEvent ? 'true' : undefined}
        inert={Boolean(rewardEvent)}
      >
        <HudPanel
          tone={selectedStatus === 'completed' ? 'memory' : 'danger'}
          eyebrow={`PUZZLE ${String(selectedPuzzle.order).padStart(3, '0')} // ${statusLabel(selectedStatus)}`}
          title={selectedPuzzle.title.ar}
        >
          <div className="campaign-puzzle-workspace__meta">
            <span>{PUZZLE_TEMPLATE_REGISTRY[selectedPuzzle.template].label.ar}</span>
            <span>{difficultyLabels[selectedPuzzle.difficulty]}</span>
            <span><Coins aria-hidden="true" /> {selectedPuzzle.rewards.coins}</span>
            <span><Diamond aria-hidden="true" /> شظية {String(selectedPuzzle.order).padStart(2, '0')}</span>
          </div>
          <p className="campaign-puzzle-workspace__description">
            {selectedPuzzle.description.ar}
          </p>

          {selectedStatus === 'locked' ? (
            <div className="campaign-puzzle-locked">
              <LockKeyhole aria-hidden="true" />
              <strong>الإشارة مقفلة</strong>
              <p>استعد اللغز السابق لفتح هذه الذاكرة.</p>
            </div>
          ) : (
            <>
              <div className="campaign-stage-heading">
                <span>
                  المرحلة {stageIndex + 1} من {selectedPuzzle.stages.length}
                </span>
                <i>
                  {selectedPuzzle.stages.map((stage, index) => (
                    <b
                      key={stage.id}
                      data-active={index === stageIndex}
                      data-complete={
                        stageCorrect(
                          stage,
                          draftProgress[index] ?? blankProgress(stage, index),
                        )
                      }
                    />
                  ))}
                </i>
              </div>
              <h2 className="campaign-stage-prompt">{currentStage.prompt.ar}</h2>
              <PuzzleInteractionBoard
                stage={currentStage}
                progress={currentProgress}
                onChange={updateCurrentProgress}
                assistanceLevel={puzzleHints.length}
                assistanceEffect={assistanceHint?.effect}
                disabled={selectedStatus === 'completed'}
              />
              {feedback && (
                <p className="campaign-puzzle-feedback" aria-live="polite">
                  {feedback}
                </p>
              )}
              <div className="campaign-puzzle-actions">
                <GameButton
                  size="lg"
                  onClick={verifyStage}
                  disabled={selectedStatus === 'completed'}
                >
                  {stageIndex < selectedPuzzle.stages.length - 1
                    ? 'تثبيت المرحلة'
                    : 'تحقق من الاستعادة'}
                </GameButton>
                <GameButton
                  variant="ghost"
                  leadingIcon={<RotateCcw aria-hidden="true" />}
                  onClick={resetPuzzle}
                  disabled={selectedStatus === 'completed'}
                >
                  إعادة اللغز
                </GameButton>
                {selectedStatus === 'completed' && (
                  <span className="campaign-puzzle-completed">
                    <CheckCircle2 aria-hidden="true" />
                    تم حفظ المكافأة
                  </span>
                )}
              </div>
            </>
          )}
        </HudPanel>

        <CampaignHintsPanel
          puzzle={selectedPuzzle}
          status={selectedStatus}
          unlockedHintIds={puzzleHints}
          onPurchase={buyHint}
        />
      </main>

      {rewardEvent && (
        <div
          ref={rewardDialogRef}
          className="campaign-reward"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-reward-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              actions.clearPuzzleRewardEvent();
              return;
            }
            if (event.key === 'Tab') {
              event.preventDefault();
              rewardDialogRef.current
                ?.querySelector<HTMLButtonElement>('button')
                ?.focus();
            }
          }}
        >
          <span className="campaign-reward__coin"><Coins aria-hidden="true" /></span>
          <span className="campaign-reward__shard"><Diamond aria-hidden="true" /></span>
          <GlassPanel tone="memory" eyebrow="MEMORY RECOVERED">
            <h2 id="campaign-reward-title">تمت استعادة الشظية</h2>
            <p>
              <strong>+{rewardEvent.coins}</strong> عملة
              <span> · </span>
              <strong>+1</strong> شظية ذاكرة
            </p>
            {rewardEvent.restoredPageId && (
              <small>اكتملت صفحة جديدة داخل أرشيف الذكريات.</small>
            )}
            <GameButton onClick={actions.clearPuzzleRewardEvent}>
              متابعة
            </GameButton>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
