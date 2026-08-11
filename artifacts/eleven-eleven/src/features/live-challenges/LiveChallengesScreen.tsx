import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { RadioTower } from 'lucide-react';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { useAuthStore } from '../auth/authStore';
import { useLiveChallengeStore } from './liveChallengeStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import {
  LIVE_HINT_COSTS,
} from '../../domain/live-challenges/liveChallengeEngine';
import type {
  LiveChallengePublicDefinition,
} from '../../domain/live-challenges/liveChallengeContracts';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  playAchievementUnlockSound,
  playPuzzleCompletionSound,
  primeRewardAudio,
} from '../../infrastructure/audio/puzzleRewardAudio';

interface LiveChallengesScreenProps {
  mode?: 'daily' | 'weekly';
  embedded?: boolean;
}

function statusLabel(status: string): string {
  return status.replace('_', ' ').toUpperCase();
}

function VisualPuzzleBoard({
  definition,
  answer,
  onAnswerChange,
  disabled = false,
}: {
  definition: LiveChallengePublicDefinition;
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled?: boolean;
}) {
  const visual = definition.visual;
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [placement, setPlacement] = useState<string[]>([]);
  const [connections, setConnections] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedPiece(null);
    setPlacement(visual?.kind === 'memory-fragment'
      ? Array.from({ length: visual.rows * visual.columns }, () => '')
      : []);
    setConnections({});
  }, [definition.id]);

  if (!visual) return null;

  if (visual.kind === 'memory-fragment') {
    const pieceById = new Map(visual.pieces.map((piece) => [piece.id, piece]));
    const filled = placement.filter(Boolean).length;
    const placePiece = (slot: number) => {
      if (disabled || !selectedPiece) return;
      const next = placement.map((piece, index) => (
        index === slot ? selectedPiece : piece === selectedPiece ? '' : piece
      ));
      setPlacement(next);
      setSelectedPiece(null);
      onAnswerChange(next.every(Boolean) ? next.join(',') : '');
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
                aria-label={piece ? `ضع ${piece.label} في الخانة ${index + 1}` : `خانة فارغة ${index + 1}`}
              >
                {piece ? <span style={{ backgroundImage: `url(${visual.imageSrc})`, backgroundPosition: piece.backgroundPosition, backgroundSize: `${visual.columns * 100}% ${visual.rows * 100}%` }} /> : <strong>{index + 1}</strong>}
              </button>
            );
          })}
        </div>
        <div className="live-memory-tray" aria-label="قطع الذكرى">
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
        <small className="live-visual-puzzle__status">{filled} / {placement.length} شظايا مثبتة — اختر قطعة ثم خانتها</small>
      </div>
    );
  }

  if (visual.kind === 'wiring') {
    const selectedSource = selectedPiece;
    const connect = (targetId: string) => {
      if (disabled || !selectedSource) return;
      const next = Object.fromEntries(
        Object.entries(connections).filter(([, connectedTarget]) => connectedTarget !== targetId),
      );
      next[selectedSource] = targetId;
      setConnections(next);
      setSelectedPiece(null);
      const complete = visual.sources.every((source) => next[source.id]);
      if (complete) {
        onAnswerChange(visual.sources.map((source) => `${source.id}=${next[source.id]}`).join('|'));
      } else {
        onAnswerChange('');
      }
    };
    return (
      <div className="live-visual-puzzle live-visual-puzzle--wiring">
        <div className="live-wiring-board" role="group" aria-label="لوحة توصيل الأسلاك">
          <div className="live-wiring-board__column">
            <small>SOURCES // المصادر</small>
            {visual.sources.map((source) => (
              <button key={source.id} type="button" data-selected={selectedSource === source.id} data-connected={Boolean(connections[source.id])} onClick={() => setSelectedPiece(source.id)} disabled={disabled} aria-pressed={selectedSource === source.id}>
                <span className="live-wiring-node" aria-hidden="true" />{source.label}
                {source.signature && <em>{source.signature}</em>}
                {connections[source.id] && <small>→ {connections[source.id]}</small>}
              </button>
            ))}
          </div>
          <div className="live-wiring-board__current" aria-live="polite">{selectedSource ? `اختر وجهة لـ ${selectedSource}` : 'اختر مصدرًا لبدء السلك'}</div>
          <div className="live-wiring-board__column">
            <small>TARGETS // الوجهات</small>
            {visual.targets.map((target) => (
              <button key={target.id} type="button" data-connected={Object.values(connections).includes(target.id)} onClick={() => connect(target.id)} disabled={disabled || !selectedSource}>
                <span className="live-wiring-node live-wiring-node--target" aria-hidden="true" />{target.label}
                {target.signature && <em>{target.signature}</em>}
                <small>{target.detail}</small>
              </button>
            ))}
          </div>
        </div>
        <small className="live-visual-puzzle__status">{Object.keys(connections).length} / {visual.sources.length} أسلاك مثبتة</small>
      </div>
    );
  }

  if (visual.kind === 'cipher') {
    return (
      <div className="live-visual-puzzle live-visual-puzzle--cipher">
        <div className="live-cipher-display"><small>ENCODED MEMORY</small><strong dir="ltr">{visual.encoded}</strong><span>ROT-{visual.shift}</span></div>
        <div className="live-cipher-alphabet" dir="ltr" aria-label="الأبجدية"><span>{visual.alphabet}</span><span>{visual.alphabet.slice(visual.shift)}{visual.alphabet.slice(0, visual.shift)}</span></div>
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
}: {
  definition: LiveChallengePublicDefinition;
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled?: boolean;
}) {
  if (definition.options.length === 0) return null;
  return (
    <div className="live-challenges__options" data-mechanic={definition.mechanic} role="group" aria-label="اختيارات الإجابة">
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
  const audioEnabled = useUiPreferencesStore((state) => state.audioEnabled);
  const sfxVolume = useUiPreferencesStore((state) => state.sfxVolume);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const activeTab = mode ?? tab;

  useEffect(() => {
    if (authStatus === 'signed-in' && status === 'idle') void actions.load();
  }, [actions, authStatus, status]);

  useEffect(() => {
    setAnswer('');
    setHint(null);
  }, [activeTab]);

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
  }, [receipt, refreshProfile]);

  const daily = snapshot?.daily;
  const weekly = snapshot?.weekly;
  const currentStage = useMemo(
    () => weekly?.trial.stages[weekly.currentStage] ?? null,
    [weekly],
  );

  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  }

  function selectAnswer(value: string): void {
    setAnswer(value);
    if (!value) return;
    if (activeTab === 'daily') void actions.saveDailyDraft(value);
    else void actions.saveWeeklyDraft(value);
  }

  async function submit(): Promise<void> {
    if (!answer) return;
    primeRewardAudio(audioEnabled);
    if (activeTab === 'daily') {
      await run(async () => { await actions.completeDaily(answer); });
    } else if (currentStage) {
      await run(async () => {
        await actions.completeWeeklyStage(currentStage.stageIndex ?? weekly?.currentStage ?? 0, answer);
      });
    }
    setAnswer('');
  }

  if (authStatus !== 'signed-in') {
    return (
      <section className="live-challenges__gate" role="status">
        <RadioTower aria-hidden="true" />
        <h2>قناة التحديات محمية</h2>
        <p>سجّل الدخول لتثبيت نافذة الخادم وحفظ مكافآت Daily وWeekly دون تكرار.</p>
      </section>
    );
  }

  if (status === 'error' && !snapshot) {
    return (
      <div className="shell-screen live-challenges live-challenges--loading" role="alert">
        <p>{error ?? 'LIVE SYSTEM SYNC FAILED.'}</p>
        <GameButton variant="ghost" onClick={() => void actions.load(true)}>RETRY SYNC</GameButton>
      </div>
    );
  }

  if (status === 'loading' || !snapshot) {
    return <div className="shell-screen live-challenges live-challenges--loading">SYNCING LIVE SYSTEM...</div>;
  }

  return (
    <div className={`shell-screen live-challenges${embedded ? ' live-challenges--embedded' : ''}`}>
      {!embedded && <header className="shell-screen-heading live-challenges__heading">
        <span className="shell-screen-code">11:11</span>
        <span>
          <small>LIVE RECOVERY LOOP // {snapshot.timezone}</small>
          <h1>DAILY SIGNALS &amp; SYSTEM TRIALS</h1>
        </span>
        <span className="live-challenges__clock">RESET {snapshot.resetLabel}</span>
      </header>}

      {!mode && <div className="live-challenges__tabs" role="tablist" aria-label="Live challenges">
        <button type="button" role="tab" aria-selected={activeTab === 'daily'} onClick={() => setTab('daily')}>
          <small>DAILY 11:11 SIGNAL</small><strong>{statusLabel(daily?.status ?? 'available')}</strong>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'weekly'} onClick={() => setTab('weekly')}>
          <small>WEEKLY SYSTEM TRIAL</small><strong>{statusLabel(weekly?.status ?? 'available')}</strong>
        </button>
      </div>}

      {activeTab === 'daily' && daily && (
        <section className="live-challenges__grid" aria-label="Daily 11:11 Signal">
          <HudPanel className="live-challenges__main" tone="danger" eyebrow="NEW 11:11 SIGNAL" title={daily.challenge.title}>
            <small className="live-challenges__mechanic">MECHANIC // {daily.challenge.mechanic.toUpperCase()}</small>
            <p className="live-challenges__instructions">{daily.challenge.instructions}</p>
            <div className="live-challenges__prompt" data-mechanic={daily.challenge.mechanic}>{daily.challenge.prompt}</div>
            <VisualPuzzleBoard definition={daily.challenge} answer={answer} onAnswerChange={selectAnswer} disabled={daily.status === 'completed'} />
            <AnswerOptions definition={daily.challenge} answer={answer} onAnswerChange={selectAnswer} disabled={daily.status === 'completed'} />
            <div className="live-challenges__actions">
              <GameButton variant="danger" onClick={() => void submit()} disabled={!answer || busy || daily.status === 'completed'}>
                {daily.status === 'completed' ? 'SIGNAL COMPLETED' : 'STABILIZE SIGNAL'}
              </GameButton>
              {[0, 1, 2].map((index) => (
                <GameButton key={index} variant="ghost" onClick={() => void run(async () => { setHint(await actions.useDailyHint(index)); })} disabled={busy || index > daily.hintsUsed || daily.status === 'completed'}>
                  HINT {index + 1} · {LIVE_HINT_COSTS[index]} C
                </GameButton>
              ))}
            </div>
            {hint && <p className="live-challenges__hint" role="status">{hint}</p>}
          </HudPanel>
          <GlassPanel className="live-challenges__side" tone="memory" title="SIGNAL STATUS">
            <span className="live-challenges__status">{statusLabel(daily.status)}</span>
            <p>One verified system signal is available during this server window.</p>
            <p>Perfect solve: <strong>{daily.perfectSolve ? 'VERIFIED' : 'NOT YET'}</strong></p>
            <small>Next reset: {new Date(daily.nextResetAt).toLocaleString()}</small>
            <div className="live-challenges__history">
              {snapshot.dailyHistory.slice(0, 7).map((entry) => <span key={entry.periodKey} data-complete={entry.status === 'completed'} title={entry.periodKey}>{entry.status === 'completed' ? '◆' : '◇'}</span>)}
            </div>
          </GlassPanel>
        </section>
      )}

      {activeTab === 'weekly' && weekly && (
        <section className="live-challenges__grid" aria-label="Weekly System Trial">
          <HudPanel className="live-challenges__main" tone="progression" eyebrow="WEEKLY SYSTEM TRIAL" title={weekly.trial.title}>
            <p className="live-challenges__instructions">{weekly.trial.instructions}</p>
            <div className="live-challenges__stage-meter">
              <strong dir="ltr">{weekly.completedStages} / {weekly.totalStages}</strong>
              <GameProgress value={(weekly.completedStages / weekly.totalStages) * 100} label="STAGES VERIFIED" tone="progression" />
            </div>
            {currentStage && weekly.status !== 'completed' ? (
              <>
                <small className="live-challenges__stage-label">STAGE {(weekly.currentStage + 1).toString().padStart(2, '0')}</small>
                <h2>{currentStage.title}</h2>
                <small className="live-challenges__mechanic">MECHANIC // {currentStage.mechanic.toUpperCase()}</small>
                <p className="live-challenges__instructions">{currentStage.instructions}</p>
                <div className="live-challenges__prompt" data-mechanic={currentStage.mechanic}>{currentStage.prompt}</div>
                <VisualPuzzleBoard definition={currentStage} answer={answer} onAnswerChange={selectAnswer} />
                <AnswerOptions definition={currentStage} answer={answer} onAnswerChange={selectAnswer} />
                <div className="live-challenges__actions">
                  {[0, 1, 2].map((index) => (
                    <GameButton key={index} variant="ghost" onClick={() => void run(async () => { setHint(await actions.useWeeklyHint(index)); })} disabled={busy || index > weekly.currentStageHintsUsed}>
                      HINT {index + 1} · {LIVE_HINT_COSTS[index]} C
                    </GameButton>
                  ))}
                </div>
                <GameButton variant="danger" onClick={() => void submit()} disabled={!answer || busy}>VERIFY STAGE</GameButton>
              </>
            ) : <p className="live-challenges__complete">WEEKLY TRIAL COMPLETE // SYSTEM RECORD UPDATED</p>}
          </HudPanel>
          <GlassPanel className="live-challenges__side" tone="danger" title="WEEKLY RECOVERY">
            <span className="live-challenges__status" dir="ltr">{weekly.recoveryCompletedDays} / 7 SIGNAL DAYS</span>
            <GameProgress value={(weekly.recoveryCompletedDays / 7) * 100} label="5 DAYS RECOVER THE WEEKLY REWARD" tone="danger" />
            <p>Missing a day does not reset this server-tracked recovery window.</p>
            <small>{weekly.recoveryRewardClaimed ? 'WEEKLY RECOVERY REWARD CLAIMED' : 'REWARD STATUS: PENDING'}</small>
            <div className="live-challenges__sealed-reward">
              <b>{weekly.trial.reward?.icon ?? '✦'}</b>
              <span>{weekly.trial.reward?.label ?? 'ملف ذاكرة نادر مختوم'}</span>
              <small>تتناوب شظايا القصة مع أفاتارات الشخصيات، ولا يُكشف المحتوى قبل إتمام المهمة.</small>
            </div>
          </GlassPanel>
        </section>
      )}

      {receipt && (
        <aside className="live-challenges__receipt" role="status">
           <strong>{receipt.kind === 'daily' ? '11:11 SIGNAL STABILIZED' : 'SYSTEM TRIAL UPDATED'}</strong>
           <span>+{receipt.xpGranted} XP // +{receipt.coinsGranted} COINS</span>
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
          <button type="button" onClick={actions.clearReceipt}>ACKNOWLEDGE</button>
        </aside>
      )}
      {error && <p className="live-challenges__error" role="alert">{error}</p>}
    </div>
  );
}
