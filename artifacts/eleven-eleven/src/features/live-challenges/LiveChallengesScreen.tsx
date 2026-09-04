import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Coins, RadioTower, TriangleAlert } from 'lucide-react';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { useAuthStore } from '../auth/authStore';
import { useLiveChallengeStore } from './liveChallengeStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import {
  LIVE_HINT_COSTS,
} from '../../domain/live-challenges/liveChallengeEngine';
import type {
  LiveChallengePublicDefinition,
} from '../../domain/live-challenges/liveChallengeContracts';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  shouldRestoreLiveChallengeDraft,
  toPersistedLiveChallengeDraft,
} from './liveChallengeDraft';
import {
  playAchievementUnlockSound,
  playPuzzleCompletionSound,
  primeRewardAudio,
} from '../../infrastructure/audio/puzzleRewardAudio';
import './live-challenges.css';

interface LiveChallengesScreenProps {
  mode?: 'daily' | 'weekly';
  embedded?: boolean;
}

function statusLabel(status: string, locale: LiveUiLocale): string {
  const labels = locale === 'ar'
    ? {
      available: 'متاح',
      in_progress: 'قيد الاستعادة',
      completed: 'مكتمل',
    }
    : {
      available: 'AVAILABLE',
      in_progress: 'IN PROGRESS',
      completed: 'COMPLETE',
    };
  return labels[status as keyof typeof labels] ?? status.replace('_', ' ').toUpperCase();
}

function answerParts(answer: string): string[] {
  return answer.split(',').map((part) => part.trim()).filter(Boolean);
}

function wiringAnswer(answer: string): Record<string, string> {
  return Object.fromEntries(
    answer.split('|')
      .map((part) => part.split('=').map((value) => value.trim()))
      .filter(([source, target]) => Boolean(source && target)) as Array<[string, string]>,
  );
}

function liveAnswerIsComplete(
  definition: LiveChallengePublicDefinition | null | undefined,
  answer: string,
): boolean {
  if (!definition || !answer) return false;
  if (definition.visual?.kind === 'memory-fragment') {
    const pieces = answerParts(answer);
    return pieces.length === definition.visual.rows * definition.visual.columns
      && new Set(pieces).size === pieces.length;
  }
  if (definition.visual?.kind === 'wiring') {
    return Object.keys(wiringAnswer(answer)).length === definition.visual.sources.length;
  }
  return true;
}

const LIVE_UI_COPY = {
  ar: {
    protectedTitle: 'قناة التحديات محمية',
    protectedDetail: 'سجّل الدخول لتثبيت نافذة الخادم وحفظ مكافآت Daily وWeekly دون تكرار.',
    retry: 'إعادة المحاولة',
    syncFailure: 'تعذرت مزامنة قناة اللعب.',
    syncing: 'تتم مزامنة قناة اللعب…',
    recoveryLoop: 'حلقة الاستعادة الحية',
    title: 'الإشارات اليومية واختبارات النظام',
    reset: 'إعادة الضبط',
    dailySignal: 'إشارة 11:11 اليومية',
    weeklyTrial: 'اختبار النظام الأسبوعي',
    newSignal: 'إشارة 11:11 جديدة',
    signalCompleted: 'اكتملت الإشارة',
    stabilizeSignal: 'ثبّت الإشارة',
    mechanic: 'الآلية',
    xp: 'نقطة خبرة',
    coins: 'عملات',
    signalStatus: 'حالة الإشارة',
    signalWindow: 'إشارة خادمية موثقة واحدة متاحة في هذه النافذة.',
    perfectSolve: 'الحل المثالي',
    verified: 'موثق',
    notYet: 'ليس بعد',
    nextReset: 'إعادة الضبط التالية',
    weeklyRecovery: 'الاستعادة الأسبوعية',
    signalDays: 'أيام إشارة',
    weeklyGoal: 'خمسة أيام تفتح المكافأة الأسبوعية',
    weeklyDetail: 'تفويت يوم لا يعيد ضبط نافذة الاستعادة التي يتابعها الخادم.',
    rewardClaimed: 'تم استلام مكافأة الاستعادة الأسبوعية',
    rewardPending: 'حالة المكافأة: بانتظار الإكمال',
    sealedReward: 'لا يُكشف المحتوى قبل إتمام المهمة.',
    sealedRewardLabel: 'ملف ذاكرة نادر مختوم',
    stage: 'المرحلة',
    stagesVerified: 'مراحل موثقة',
    verifyStage: 'تحقق من المرحلة',
    weeklyComplete: 'اكتمل الاختبار الأسبوعي — تم تحديث السجل',
    dailyReceipt: 'تم تثبيت إشارة 11:11',
    weeklyReceipt: 'تم تحديث اختبار النظام',
    acknowledge: 'متابعة',
    hint: 'تلميح',
    opened: 'مفتوح',
    locked: 'مقفل',
    buyHint: 'فتح التلميح',
    hintNeedsPrevious: 'افتح التلميح السابق أولًا',
    hintNeedsCoins: 'عملات أكثر مطلوبة',
    earnCoins: 'اذهب إلى ألغاز القصة',
    purchaseTitle: 'فتح تلميح موثّق',
    purchaseBody: 'سيُحفظ تقدمك الحالي أولًا، ثم يفتح الخادم هذا التلميح مرة واحدة فقط.',
    currentBalance: 'الرصيد الحالي',
    afterPurchase: 'بعد الفتح',
    cost: 'التكلفة',
    cancel: 'إلغاء',
    confirm: 'تأكيد الفتح',
    purchasing: 'جارٍ التحقق…',
    chooseSlot: 'اختر قطعة ثم ضعها في الخانة',
    emptySlot: 'خانة فارغة',
    placePiece: 'ضع',
    memoryPieces: 'قطع الذكرى',
    fragmentsPlaced: 'شظايا مثبتة',
    sources: 'المصادر',
    targets: 'الوجهات',
    chooseTarget: 'اختر وجهة لـ',
    chooseSource: 'اختر مصدرًا لبدء السلك',
    wiresPlaced: 'أسلاك مثبتة',
    answerChoices: 'اختيارات الإجابة',
    encodedMemory: 'ذاكرة مشفّرة',
    alphabet: 'الأبجدية',
  },
  en: {
    protectedTitle: 'Challenge channel protected',
    protectedDetail: 'Sign in to secure the server window and save Daily and Weekly rewards without duplicates.',
    retry: 'Retry',
    syncFailure: 'The live play channel could not synchronize.',
    syncing: 'Synchronizing play channel…',
    recoveryLoop: 'Live recovery loop',
    title: 'Daily signals & system trials',
    reset: 'Reset',
    dailySignal: 'Daily 11:11 Signal',
    weeklyTrial: 'Weekly System Trial',
    newSignal: 'New 11:11 Signal',
    signalCompleted: 'Signal complete',
    stabilizeSignal: 'Stabilize signal',
    mechanic: 'Mechanic',
    xp: 'XP',
    coins: 'Coins',
    signalStatus: 'Signal status',
    signalWindow: 'One verified server signal is available during this window.',
    perfectSolve: 'Perfect solve',
    verified: 'Verified',
    notYet: 'Not yet',
    nextReset: 'Next reset',
    weeklyRecovery: 'Weekly recovery',
    signalDays: 'signal days',
    weeklyGoal: 'Five days unlock the weekly reward',
    weeklyDetail: 'Missing a day does not reset this server-tracked recovery window.',
    rewardClaimed: 'Weekly recovery reward claimed',
    rewardPending: 'Reward status: pending',
    sealedReward: 'The content stays sealed until the mission is complete.',
    sealedRewardLabel: 'Sealed rare memory file',
    stage: 'Stage',
    stagesVerified: 'Verified stages',
    verifyStage: 'Verify stage',
    weeklyComplete: 'Weekly trial complete — system record updated',
    dailyReceipt: '11:11 Signal stabilized',
    weeklyReceipt: 'System trial updated',
    acknowledge: 'Continue',
    hint: 'Hint',
    opened: 'Opened',
    locked: 'Locked',
    buyHint: 'Open hint',
    hintNeedsPrevious: 'Open the previous hint first',
    hintNeedsCoins: 'More coins required',
    earnCoins: 'Go to Story Puzzles',
    purchaseTitle: 'Open verified hint',
    purchaseBody: 'Your current progress is saved first. The server then unlocks this hint only once.',
    currentBalance: 'Current balance',
    afterPurchase: 'After opening',
    cost: 'Cost',
    cancel: 'Cancel',
    confirm: 'Confirm unlock',
    purchasing: 'Verifying…',
    chooseSlot: 'Choose a piece, then place it in a slot',
    emptySlot: 'Empty slot',
    placePiece: 'Place',
    memoryPieces: 'Memory pieces',
    fragmentsPlaced: 'fragments placed',
    sources: 'Sources',
    targets: 'Targets',
    chooseTarget: 'Choose a destination for',
    chooseSource: 'Choose a source to start the wire',
    wiresPlaced: 'wires placed',
    answerChoices: 'Answer choices',
    encodedMemory: 'Encoded memory',
    alphabet: 'Alphabet',
  },
} as const;

type LiveUiLocale = keyof typeof LIVE_UI_COPY;

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
}

function LiveHintPurchaseDialog({
  locale,
  hintIndex,
  cost,
  balance,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  locale: LiveUiLocale;
  hintIndex: number;
  cost: number;
  balance: number;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = LIVE_UI_COPY[locale];
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(busy);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const focusables = dialog ? focusableElements(dialog) : [];
    (focusables[0] ?? dialog)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = focusableElements(dialog);
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openerRef.current?.focus();
    };
  }, [onCancel]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="live-hint-purchase" role="presentation">
      <button
        className="live-hint-purchase__backdrop"
        type="button"
        aria-label={copy.cancel}
        disabled={busy}
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        className="live-hint-purchase__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-hint-purchase-title"
        aria-describedby="live-hint-purchase-description"
        tabIndex={-1}
      >
        <small>{copy.hint.toUpperCase()} // {String(hintIndex + 1).padStart(2, '0')}</small>
        <h2 id="live-hint-purchase-title">{copy.purchaseTitle}</h2>
        <p id="live-hint-purchase-description">{copy.purchaseBody}</p>
        <dl>
          <div><dt>{copy.cost}</dt><dd><Coins aria-hidden="true" /> {cost}</dd></div>
          <div><dt>{copy.currentBalance}</dt><dd>{balance}</dd></div>
          <div><dt>{copy.afterPurchase}</dt><dd>{Math.max(0, balance - cost)}</dd></div>
        </dl>
        {error && <p className="live-hint-purchase__error" role="alert"><TriangleAlert aria-hidden="true" /> {error}</p>}
        <footer>
          <GameButton variant="ghost" onClick={onCancel} disabled={busy}>{copy.cancel}</GameButton>
          <GameButton variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? copy.purchasing : copy.confirm}
          </GameButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function VisualPuzzleBoard({
  definition,
  answer,
  onAnswerChange,
  disabled = false,
  locale,
}: {
  definition: LiveChallengePublicDefinition;
  answer: string;
  onAnswerChange: (value: string, ready?: boolean) => void;
  disabled?: boolean;
  locale: LiveUiLocale;
}) {
  const visual = definition.visual;
  const copy = LIVE_UI_COPY[locale];
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPiece(null);
  }, [definition.id]);

  if (!visual) return null;

  if (visual.kind === 'memory-fragment') {
    const pieceById = new Map(visual.pieces.map((piece) => [piece.id, piece]));
    const placement = Array.from({ length: visual.rows * visual.columns }, (_, index) => (
      answerParts(answer)[index] ?? ''
    ));
    const filled = placement.filter(Boolean).length;
    const placePiece = (slot: number) => {
      if (disabled || !selectedPiece) return;
      const next = placement.map((piece, index) => (
        index === slot ? selectedPiece : piece === selectedPiece ? '' : piece
      ));
      setSelectedPiece(null);
      const nextAnswer = next.filter(Boolean).join(',');
      onAnswerChange(nextAnswer, next.every(Boolean));
    };
    return (
      <div className="live-visual-puzzle live-visual-puzzle--memory" data-complete={filled === placement.length}>
        <div className="live-memory-board" style={{ '--memory-columns': visual.columns, '--memory-rows': visual.rows } as CSSProperties} aria-label={visual.alt}>
          {placement.map((pieceId, index) => {
            const piece = pieceId ? pieceById.get(pieceId) : null;
            return (
              <button
                key={`slot-${index}`}
                type="button"
                className="live-memory-board__slot"
                onClick={() => placePiece(index)}
                disabled={disabled || !selectedPiece}
                aria-label={piece
                  ? `${copy.placePiece} ${piece.label} ${index + 1}`
                  : `${copy.emptySlot} ${index + 1}`}
              >
                {piece ? <span style={{ backgroundImage: `url(${visual.imageSrc})`, backgroundPosition: piece.backgroundPosition, backgroundSize: `${visual.columns * 100}% ${visual.rows * 100}%` }} /> : <strong>{index + 1}</strong>}
              </button>
            );
          })}
        </div>
        <div className="live-memory-tray" aria-label={copy.memoryPieces}>
          {visual.pieces.map((piece) => (
            <button
              key={piece.id}
              type="button"
              className="live-memory-tray__piece"
              data-selected={selectedPiece === piece.id}
              onClick={() => setSelectedPiece(piece.id)}
              disabled={disabled}
              aria-pressed={selectedPiece === piece.id}
              title={piece.label}
            >
              <span style={{ backgroundImage: `url(${visual.imageSrc})`, backgroundPosition: piece.backgroundPosition, backgroundSize: `${visual.columns * 100}% ${visual.rows * 100}%` }} />
              <small>{piece.label}</small>
            </button>
          ))}
        </div>
        <small className="live-visual-puzzle__status">{filled} / {placement.length} {copy.fragmentsPlaced} — {copy.chooseSlot}</small>
      </div>
    );
  }

  if (visual.kind === 'wiring') {
    const selectedSource = selectedPiece;
    const connections = wiringAnswer(answer);
    const connect = (targetId: string) => {
      if (disabled || !selectedSource) return;
      const next = Object.fromEntries(
        Object.entries(connections).filter(([, connectedTarget]) => connectedTarget !== targetId),
      );
      next[selectedSource] = targetId;
      setSelectedPiece(null);
      const complete = visual.sources.every((source) => next[source.id]);
      onAnswerChange(
        Object.entries(next).map(([source, target]) => `${source}=${target}`).join('|'),
        complete,
      );
    };
    return (
      <div className="live-visual-puzzle live-visual-puzzle--wiring">
        <div className="live-wiring-board" role="group" aria-label={`${copy.sources} / ${copy.targets}`}>
          <div className="live-wiring-board__column">
            <small>SOURCES // {copy.sources}</small>
            {visual.sources.map((source) => (
              <button key={source.id} type="button" data-selected={selectedSource === source.id} data-connected={Boolean(connections[source.id])} onClick={() => setSelectedPiece(source.id)} disabled={disabled} aria-pressed={selectedSource === source.id}>
                <span className="live-wiring-node" aria-hidden="true" />{source.label}
                {source.signature && <em>{source.signature}</em>}
                {connections[source.id] && <small>→ {connections[source.id]}</small>}
              </button>
            ))}
          </div>
          <div className="live-wiring-board__current" aria-live="polite">{selectedSource ? `${copy.chooseTarget} ${selectedSource}` : copy.chooseSource}</div>
          <div className="live-wiring-board__column">
            <small>TARGETS // {copy.targets}</small>
            {visual.targets.map((target) => (
              <button key={target.id} type="button" data-connected={Object.values(connections).includes(target.id)} onClick={() => connect(target.id)} disabled={disabled || !selectedSource}>
                <span className="live-wiring-node live-wiring-node--target" aria-hidden="true" />{target.label}
                {target.signature && <em>{target.signature}</em>}
                <small>{target.detail}</small>
              </button>
            ))}
          </div>
        </div>
        <small className="live-visual-puzzle__status">{Object.keys(connections).length} / {visual.sources.length} {copy.wiresPlaced}</small>
      </div>
    );
  }

  if (visual.kind === 'cipher') {
    return (
      <div className="live-visual-puzzle live-visual-puzzle--cipher">
        <div className="live-cipher-display"><small>{copy.encodedMemory.toUpperCase()}</small><strong dir="ltr">{visual.encoded}</strong><span>ROT-{visual.shift}</span></div>
        <div className="live-cipher-alphabet" dir="ltr" aria-label={copy.alphabet}><span>{visual.alphabet}</span><span>{visual.alphabet.slice(visual.shift)}{visual.alphabet.slice(0, visual.shift)}</span></div>
      </div>
    );
  }

  return (
    <div className={`live-visual-puzzle live-visual-puzzle--choice live-visual-puzzle--${visual.layout}`}>
      {visual.items.map((item) => <div key={`${item.label}-${item.detail ?? ''}`} className="live-choice-card"><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div>)}
    </div>
  );
}

function AnswerOptions({
  definition,
  answer,
  onAnswerChange,
  disabled = false,
  locale,
}: {
  definition: LiveChallengePublicDefinition;
  answer: string;
  onAnswerChange: (value: string, ready?: boolean) => void;
  disabled?: boolean;
  locale: LiveUiLocale;
}) {
  if (definition.options.length === 0) return null;
  return (
    <div className="live-challenges__options" data-mechanic={definition.mechanic} role="group" aria-label={LIVE_UI_COPY[locale].answerChoices}>
      {definition.options.map((option) => (
        <button key={option} type="button" data-selected={answer === option} onClick={() => onAnswerChange(option)} disabled={disabled} aria-pressed={answer === option}>
          {option}
        </button>
      ))}
    </div>
  );
}

export default function LiveChallengesScreen({
  mode,
  embedded = false,
}: LiveChallengesScreenProps = {}) {
  const authStatus = useAuthStore((state) => state.status);
  const status = useLiveChallengeStore((state) => state.status);
  const snapshot = useLiveChallengeStore((state) => state.snapshot);
  const error = useLiveChallengeStore((state) => state.error);
  const receipt = useLiveChallengeStore((state) => state.latestReceipt);
  const actions = useLiveChallengeStore((state) => state.actions);
  const refreshProfile = usePlayerProgressionStore((state) => state.actions.loadProfile);
  const refreshStoryPuzzles = useStoryPuzzleStore((state) => state.actions.load);
  const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled);
  const sfxVolume = useUiPreferencesStore((state) => state.sfxVolume);
  const locale = useUiPreferencesStore((state) => state.locale) as LiveUiLocale;
  const uiCopy = LIVE_UI_COPY[locale];
  const navigate = useShellStore((state) => state.navigate);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [answer, setAnswer] = useState('');
  const [answerReady, setAnswerReady] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingHintIndex, setPendingHintIndex] = useState<number | null>(null);
  const terminalActionInFlight = useRef(false);
  const pendingDraftSave = useRef<Promise<unknown>>(Promise.resolve());
  const restoredChallengeKey = useRef<string | null>(null);
  const activeTab = mode ?? tab;
  const daily = snapshot?.daily;
  const weekly = snapshot?.weekly;
  const currentStage = useMemo(
    () => weekly?.trial.stages[weekly.currentStage] ?? null,
    [weekly],
  );
  const activeDefinition = activeTab === 'daily' ? daily?.challenge : currentStage;
  const restoredAnswer = activeTab === 'daily'
    ? daily?.draft.answer ?? ''
    : weekly?.draft.answer ?? '';
  const activeChallengeKey = activeTab === 'daily'
    ? `daily:${daily?.periodKey ?? 'pending'}:${daily?.challenge.id ?? 'pending'}`
    : `weekly:${weekly?.weekId ?? 'pending'}:${weekly?.currentStage ?? 'pending'}:${currentStage?.id ?? 'pending'}`;
  const coinBalance = Math.max(0, snapshot?.coinBalance ?? 0);

  useEffect(() => {
    if (authStatus === 'signed-in' && status === 'idle') void actions.load(false, locale);
  }, [actions, authStatus, locale, status]);

  useEffect(() => {
    if (!activeDefinition || !shouldRestoreLiveChallengeDraft(restoredChallengeKey.current, activeChallengeKey)) return;
    restoredChallengeKey.current = activeChallengeKey;
    setAnswer(restoredAnswer);
    setAnswerReady(liveAnswerIsComplete(activeDefinition, restoredAnswer));
    setHint(null);
    setPendingHintIndex(null);
  }, [
    activeChallengeKey,
    activeDefinition,
    restoredAnswer,
  ]);

  useEffect(() => {
    if (receipt?.awarded && audioEnabled) {
      if (receipt.reward?.tier === 'rare') playAchievementUnlockSound('rare', sfxVolume);
      else playPuzzleCompletionSound(sfxVolume);
    }
  }, [audioEnabled, receipt, sfxVolume]);

  useEffect(() => {
    if (receipt?.awarded && receipt.reward?.kind === 'avatar') {
      void refreshProfile();
    }
    if (receipt?.awarded) void refreshStoryPuzzles(true);
  }, [receipt, refreshProfile, refreshStoryPuzzles]);

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    if (terminalActionInFlight.current) return null;
    terminalActionInFlight.current = true;
    setBusy(true);
    try {
      return await action();
    } finally {
      terminalActionInFlight.current = false;
      setBusy(false);
    }
  }

  function queueDraftSave(nextAnswer: string): Promise<unknown> {
    const save = activeTab === 'daily'
      ? actions.saveDailyDraft(toPersistedLiveChallengeDraft(nextAnswer), locale)
      : actions.saveWeeklyDraft(toPersistedLiveChallengeDraft(nextAnswer), locale);
    pendingDraftSave.current = save;
    return save;
  }

  async function persistCurrentDraft(): Promise<boolean> {
    await pendingDraftSave.current;
    return Boolean(await queueDraftSave(answer));
  }

  function selectAnswer(value: string, ready = Boolean(value)): void {
    if (busy || terminalActionInFlight.current) return;
    setAnswer(value);
    setAnswerReady(ready);
    void queueDraftSave(value);
  }

  async function openHint(index: number): Promise<string | null> {
    if (!await persistCurrentDraft()) return null;
    return activeTab === 'daily'
      ? actions.useDailyHint(index, locale)
      : actions.useWeeklyHint(index, locale);
  }

  async function submit(): Promise<void> {
    if (!answer || !answerReady) return;
    primeRewardAudio(audioEnabled);
    const receipt = await run(async () => {
      if (!await persistCurrentDraft()) return null;
      if (activeTab === 'daily') return actions.completeDaily(answer, locale);
      if (currentStage) {
        return actions.completeWeeklyStage(
          currentStage.stageIndex ?? weekly?.currentStage ?? 0,
          answer,
          locale,
        );
      }
      return null;
    });
    if (receipt) {
      setAnswer('');
      setAnswerReady(false);
    }
  }

  const closeHintPurchase = useCallback(() => setPendingHintIndex(null), []);

  if (authStatus !== 'signed-in') {
    return (
      <section className="live-challenges__gate" role="status">
        <RadioTower aria-hidden="true" />
        <h2>{uiCopy.protectedTitle}</h2>
        <p>{uiCopy.protectedDetail}</p>
      </section>
    );
  }

  if (status === 'error' && !snapshot) {
    return (
      <div className="shell-screen live-challenges live-challenges--loading" role="alert">
        <p>{error ?? uiCopy.syncFailure}</p>
        <GameButton variant="ghost" onClick={() => void actions.load(true, locale)}>{uiCopy.retry}</GameButton>
      </div>
    );
  }

  if (status === 'loading' || !snapshot) {
    return <div className="shell-screen live-challenges live-challenges--loading">{uiCopy.syncing}</div>;
  }

  return (
    <div className={`shell-screen live-challenges${embedded ? ' live-challenges--embedded' : ''}`}>
      {!embedded && <header className="shell-screen-heading live-challenges__heading">
        <span className="shell-screen-code">11:11</span>
        <span>
          <small>{uiCopy.recoveryLoop.toUpperCase()} // {snapshot.timezone}</small>
          <h1>{uiCopy.title}</h1>
        </span>
        <span className="live-challenges__clock">{uiCopy.reset.toUpperCase()} {snapshot.resetLabel}</span>
      </header>}

      {!mode && <div className="live-challenges__tabs" role="tablist" aria-label={`${uiCopy.dailySignal} / ${uiCopy.weeklyTrial}`}>
        <button type="button" role="tab" aria-selected={activeTab === 'daily'} onClick={() => setTab('daily')}>
          <small>{uiCopy.dailySignal}</small><strong>{statusLabel(daily?.status ?? 'available', locale)}</strong>
        </button>
        {weekly && (
          <button type="button" role="tab" aria-selected={activeTab === 'weekly'} onClick={() => setTab('weekly')}>
            <small>{uiCopy.weeklyTrial}</small><strong>{statusLabel(weekly.status, locale)}</strong>
          </button>
        )}
      </div>}

      {activeTab === 'daily' && daily && (
        <section className="live-challenges__grid" aria-label={uiCopy.dailySignal}>
          <HudPanel className="live-challenges__main" tone="danger" eyebrow={uiCopy.newSignal} title={daily.challenge.title}>
            <small className="live-challenges__mechanic">{uiCopy.mechanic.toUpperCase()} // {daily.challenge.mechanic.toUpperCase()}</small>
            <p className="live-challenges__instructions">{daily.challenge.instructions}</p>
            <div className="live-challenges__prompt" data-mechanic={daily.challenge.mechanic}>{daily.challenge.prompt}</div>
            <VisualPuzzleBoard definition={daily.challenge} answer={answer} onAnswerChange={selectAnswer} disabled={busy || daily.status === 'completed'} locale={locale} />
            <AnswerOptions definition={daily.challenge} answer={answer} onAnswerChange={selectAnswer} disabled={busy || daily.status === 'completed'} locale={locale} />
            <div className="live-challenges__actions">
              <GameButton variant="danger" onClick={() => void submit()} disabled={!answer || !answerReady || busy || daily.status === 'completed'}>
                {daily.status === 'completed' ? uiCopy.signalCompleted : uiCopy.stabilizeSignal}
              </GameButton>
              {[0, 1, 2].map((index) => (
                <span className="live-challenges__hint-action" key={index}>
                  <GameButton
                    variant="ghost"
                    onClick={() => {
                      if (index < daily.hintsUsed) {
                        void run(async () => {
                          const nextHint = await openHint(index);
                          if (nextHint) setHint(nextHint);
                          return nextHint;
                        });
                        return;
                      }
                      if (index === daily.hintsUsed && coinBalance >= LIVE_HINT_COSTS[index]) {
                        setPendingHintIndex(index);
                      }
                    }}
                    disabled={busy || index > daily.hintsUsed || daily.status === 'completed' || (index === daily.hintsUsed && coinBalance < LIVE_HINT_COSTS[index])}
                  >
                    {LIVE_UI_COPY[locale].hint.toUpperCase()} {index + 1} · {LIVE_HINT_COSTS[index]} C {index < daily.hintsUsed ? `// ${LIVE_UI_COPY[locale].opened}` : ''}
                  </GameButton>
                  {index === daily.hintsUsed && coinBalance < LIVE_HINT_COSTS[index] && daily.status !== 'completed' && (
                    <small>{LIVE_UI_COPY[locale].hintNeedsCoins}</small>
                  )}
                  {index > daily.hintsUsed && <small>{LIVE_UI_COPY[locale].hintNeedsPrevious}</small>}
                </span>
              ))}
            </div>
            {daily.hintsUsed < LIVE_HINT_COSTS.length && coinBalance < LIVE_HINT_COSTS[daily.hintsUsed] && daily.status !== 'completed' && (
              <GameButton variant="ghost" onClick={() => navigate('puzzles')}>
                {LIVE_UI_COPY[locale].earnCoins}
              </GameButton>
            )}
            {hint && <p className="live-challenges__hint" role="status">{hint}</p>}
          </HudPanel>
          <GlassPanel className="live-challenges__side" tone="memory" title={uiCopy.signalStatus}>
            <span className="live-challenges__status">{statusLabel(daily.status, locale)}</span>
            <p>{uiCopy.signalWindow}</p>
            <p>{uiCopy.perfectSolve}: <strong>{daily.perfectSolve ? uiCopy.verified : uiCopy.notYet}</strong></p>
            <small>{uiCopy.nextReset}: {new Date(daily.nextResetAt).toLocaleString(locale === 'ar' ? 'ar' : 'en')}</small>
            <div className="live-challenges__history">
              {snapshot.dailyHistory.slice(0, 7).map((entry) => <span key={entry.periodKey} data-complete={entry.status === 'completed'} title={entry.periodKey}>{entry.status === 'completed' ? '◆' : '◇'}</span>)}
            </div>
          </GlassPanel>
        </section>
      )}

      {activeTab === 'weekly' && weekly && (
        <section className="live-challenges__grid" aria-label={uiCopy.weeklyTrial}>
          <HudPanel className="live-challenges__main" tone="progression" eyebrow={uiCopy.weeklyTrial} title={weekly.trial.title}>
            <p className="live-challenges__instructions">{weekly.trial.instructions}</p>
            <div className="live-challenges__stage-meter">
              <strong dir="ltr">{weekly.completedStages} / {weekly.totalStages}</strong>
              <GameProgress value={(weekly.completedStages / weekly.totalStages) * 100} label={uiCopy.stagesVerified} tone="progression" />
            </div>
            {currentStage && weekly.status !== 'completed' ? (
              <>
                <small className="live-challenges__stage-label">{uiCopy.stage.toUpperCase()} {(weekly.currentStage + 1).toString().padStart(2, '0')}</small>
                <h2>{currentStage.title}</h2>
                <small className="live-challenges__mechanic">{uiCopy.mechanic.toUpperCase()} // {currentStage.mechanic.toUpperCase()}</small>
                <p className="live-challenges__instructions">{currentStage.instructions}</p>
                <div className="live-challenges__prompt" data-mechanic={currentStage.mechanic}>{currentStage.prompt}</div>
                <VisualPuzzleBoard definition={currentStage} answer={answer} onAnswerChange={selectAnswer} disabled={busy} locale={locale} />
                <AnswerOptions definition={currentStage} answer={answer} onAnswerChange={selectAnswer} disabled={busy} locale={locale} />
                <div className="live-challenges__actions">
                  {[0, 1, 2].map((index) => (
                    <span className="live-challenges__hint-action" key={index}>
                      <GameButton
                        variant="ghost"
                        onClick={() => {
                          if (index < weekly.currentStageHintsUsed) {
                            void run(async () => {
                              const nextHint = await openHint(index);
                              if (nextHint) setHint(nextHint);
                              return nextHint;
                            });
                            return;
                          }
                          if (index === weekly.currentStageHintsUsed && coinBalance >= LIVE_HINT_COSTS[index]) {
                            setPendingHintIndex(index);
                          }
                        }}
                        disabled={busy || index > weekly.currentStageHintsUsed || (index === weekly.currentStageHintsUsed && coinBalance < LIVE_HINT_COSTS[index])}
                      >
                        {LIVE_UI_COPY[locale].hint.toUpperCase()} {index + 1} · {LIVE_HINT_COSTS[index]} C {index < weekly.currentStageHintsUsed ? `// ${LIVE_UI_COPY[locale].opened}` : ''}
                      </GameButton>
                      {index === weekly.currentStageHintsUsed && coinBalance < LIVE_HINT_COSTS[index] && (
                        <small>{LIVE_UI_COPY[locale].hintNeedsCoins}</small>
                      )}
                      {index > weekly.currentStageHintsUsed && <small>{LIVE_UI_COPY[locale].hintNeedsPrevious}</small>}
                    </span>
                  ))}
                </div>
                {weekly.currentStageHintsUsed < LIVE_HINT_COSTS.length && coinBalance < LIVE_HINT_COSTS[weekly.currentStageHintsUsed] && (
                  <GameButton variant="ghost" onClick={() => navigate('puzzles')}>
                    {LIVE_UI_COPY[locale].earnCoins}
                  </GameButton>
                )}
                <GameButton variant="danger" onClick={() => void submit()} disabled={!answer || !answerReady || busy}>{uiCopy.verifyStage}</GameButton>
              </>
            ) : <p className="live-challenges__complete">{uiCopy.weeklyComplete}</p>}
          </HudPanel>
          <GlassPanel className="live-challenges__side" tone="danger" title={uiCopy.weeklyRecovery}>
            <span className="live-challenges__status" dir="ltr">{weekly.recoveryCompletedDays} / 7 {uiCopy.signalDays}</span>
            <GameProgress value={(weekly.recoveryCompletedDays / 7) * 100} label={uiCopy.weeklyGoal} tone="danger" />
            <p>{uiCopy.weeklyDetail}</p>
            <small>{weekly.recoveryRewardClaimed ? uiCopy.rewardClaimed : uiCopy.rewardPending}</small>
            <div className="live-challenges__sealed-reward">
              <b>{weekly.trial.reward?.icon ?? '✦'}</b>
              <span>{weekly.trial.reward?.label ?? uiCopy.sealedRewardLabel}</span>
              <small>{uiCopy.sealedReward}</small>
            </div>
          </GlassPanel>
        </section>
      )}

      {receipt && (
        <aside className="live-challenges__receipt" role="status">
           <strong>{receipt.kind === 'daily' ? uiCopy.dailyReceipt : uiCopy.weeklyReceipt}</strong>
           <span>+{receipt.xpGranted} {uiCopy.xp} // +{receipt.coinsGranted} {uiCopy.coins}</span>
           {receipt.reward && (
             <div className={`live-challenges__reward live-challenges__reward--${receipt.reward.tier}`}>
               {receipt.reward.imageSrc
                 ? <img src={receipt.reward.imageSrc} alt="" decoding="async" />
                 : <b>{receipt.reward.icon}</b>}
               <span>
                 <strong>{receipt.reward.label}</strong>
                 {receipt.reward.storyExcerpt && <small>{receipt.reward.storyExcerpt}</small>}
                 {receipt.reward.sourceLabel && <em>{receipt.reward.sourceLabel}</em>}
               </span>
             </div>
           )}
          <button type="button" onClick={actions.clearReceipt}>{uiCopy.acknowledge}</button>
        </aside>
      )}
      {pendingHintIndex !== null && LIVE_HINT_COSTS[pendingHintIndex] !== undefined && (
        <LiveHintPurchaseDialog
          locale={locale}
          hintIndex={pendingHintIndex}
          cost={LIVE_HINT_COSTS[pendingHintIndex]}
          balance={coinBalance}
          busy={busy}
          error={error}
          onCancel={closeHintPurchase}
          onConfirm={() => {
            void run(async () => {
              const nextHint = await openHint(pendingHintIndex);
              if (nextHint) {
                setHint(nextHint);
                closeHintPurchase();
              }
              return nextHint;
            });
          }}
        />
      )}
      {error && pendingHintIndex === null && <p className="live-challenges__error" role="alert">{error}</p>}
    </div>
  );
}
