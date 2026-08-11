import { useEffect, useMemo, useState } from 'react';
import { RadioTower } from 'lucide-react';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { useAuthStore } from '../auth/authStore';
import { useLiveChallengeStore } from './liveChallengeStore';
import {
  LIVE_HINT_COSTS,
} from '../../domain/live-challenges/liveChallengeEngine';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import {
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
      playPuzzleCompletionSound(sfxVolume);
    }
  }, [audioEnabled, receipt, sfxVolume]);

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
            <div className="live-challenges__options" data-mechanic={daily.challenge.mechanic} role="group" aria-label="Signal answers">
              {daily.challenge.options.map((option) => (
                <button key={option} type="button" data-selected={answer === option} onClick={() => selectAnswer(option)} disabled={daily.status === 'completed'}>
                  {option}
                </button>
              ))}
            </div>
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
                <div className="live-challenges__options" data-mechanic={currentStage.mechanic} role="group" aria-label="Trial answers">
                  {currentStage.options.map((option) => <button key={option} type="button" data-selected={answer === option} onClick={() => selectAnswer(option)}>{option}</button>)}
                </div>
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
          </GlassPanel>
        </section>
      )}

      {receipt && (
        <aside className="live-challenges__receipt" role="status">
          <strong>{receipt.kind === 'daily' ? '11:11 SIGNAL STABILIZED' : 'SYSTEM TRIAL UPDATED'}</strong>
          <span>+{receipt.xpGranted} XP // +{receipt.coinsGranted} COINS</span>
          <button type="button" onClick={actions.clearReceipt}>ACKNOWLEDGE</button>
        </aside>
      )}
      {error && <p className="live-challenges__error" role="alert">{error}</p>}
    </div>
  );
}
