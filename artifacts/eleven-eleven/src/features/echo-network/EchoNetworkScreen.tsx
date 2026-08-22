import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import { seasonAt, seasonWeekAt, nextSignalResetAt } from '../../domain/echo-network/seasonCatalog';
import type { DirectedActivity } from '../../domain/echo-network/activityDirector';
import {
  completeNetworkTraining,
  fetchEchoNetwork,
  type NetworkEligibilitySnapshot,
  type NetworkSnapshot,
} from '../../infrastructure/echo-network/echoNetworkApi';
import { useAuthStore } from '../auth/authStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { useLiveChallengeStore } from '../live-challenges/liveChallengeStore';
import { GameButton, GameProgress, GlassPanel, HudPanel } from '../../ui/design-system';
import { SponsorTransmission } from './SponsorTransmission';
import { ActivityDirectorPanel } from './ActivityDirectorPanel';
import { ContractChessPanel } from './ContractChessPanel';
import { CoopBreachPanel } from './CoopBreachPanel';
import { SeasonPanel } from './SeasonPanel';
import { SignalBoardPanel } from './SignalBoardPanel';
import { useRealtimeRoom } from './useRealtimeRoom';

type NetworkTab = 'hub' | 'chess' | 'coop' | 'season' | 'community';

const TABS: Array<{ id: NetworkTab; ar: string; en: string; code: string }> = [
  { id: 'hub', ar: 'المركز', en: 'Hub', code: '00' },
  { id: 'chess', ar: 'شطرنج العقد', en: 'Contract Chess', code: 'CH' },
  { id: 'coop', ar: 'اختراقات التعاون', en: 'Co-op Breaches', code: 'CO' },
  { id: 'season', ar: 'شقوق Echo', en: 'Echo Fractures', code: 'S1' },
  { id: 'community', ar: 'لوحة الإشارة', en: 'Signal Board', code: 'SB' },
];

const NETWORK_COPY = {
  ar: {
    syncFailed: 'تعذر مزامنة شبكة Echo.',
    trainingFailed: 'تعذر توثيق التدريب. تقدّم التدريب المحلي لم يُفقد.',
    authGate: 'سجّل الدخول أو تابع كضيف محفوظ لفتح مزامنة الشبكة. التدريب المحلي يبقى قابلًا للعب.',
    story: 'استعادة القصة',
    storyProgress: (main: number, total: number) => `${main}/14 ألغاز رئيسية · ${total}/20 إجمالًا`,
    daily: 'إشارة اليوم',
    dailyRecovered: 'مستعادة اليوم',
    dailyAvailable: '3–8 دقائق · بلا عقوبة تفويت',
    chess: 'شطرنج العقد',
    rankedOpen: 'المصنّف مفتوح',
    rankedGate: (completed: number) => `${completed}/3 عادية قبل المصنّف`,
    coop: 'اختراق تعاوني',
    coopDescription: '12 قضية · أدلة مختلفة لكل لاعب',
    seasonArchive: 'يبقى في الأرشيف بعد الموسم',
    community: 'لوحة الإشارة',
    communityDescription: 'أخبار، فرق، وألغاز مجتمع مراجعة',
    masteryEyebrow: 'مسارات الإتقان',
    masteryTitle: 'تقدم مستقل، لا رقم واحد',
    storyMastery: 'القصة',
    puzzleMastery: 'إتقان الألغاز',
    coopResonance: 'تناغم التعاون',
    chessMastery: 'الشطرنج',
    syncingReceipts: 'جارٍ مزامنة الإيصالات…',
    blitz: 'خاطف',
    rapid: 'سريع',
    cosmetics: 'المظاهر',
    receipts: 'الإيصالات',
    leaderboard: 'الترتيب',
    collection: 'المجموعة',
    refresh: 'تحديث',
  },
  en: {
    syncFailed: 'Echo Network could not be synchronized.',
    trainingFailed: 'Training could not be certified. Your local training progress was not lost.',
    authGate: 'Sign in or continue with a saved guest to synchronize the network. Local training remains playable.',
    story: 'Story recovery',
    storyProgress: (main: number, total: number) => `${main}/14 main puzzles · ${total}/20 total`,
    daily: 'Daily signal',
    dailyRecovered: 'Recovered today',
    dailyAvailable: '3–8 min · no missed-day penalty',
    chess: 'Contract Chess',
    rankedOpen: 'Ranked unlocked',
    rankedGate: (completed: number) => `${completed}/3 Casual matches before Ranked`,
    coop: 'Co-op breach',
    coopDescription: '12 cases · different evidence for every player',
    seasonArchive: 'Stays in the archive after the season',
    community: 'Signal Board',
    communityDescription: 'News, parties, and reviewed community puzzles',
    masteryEyebrow: 'MASTERY PATHS',
    masteryTitle: 'Separate progress, not one number',
    storyMastery: 'Story',
    puzzleMastery: 'Puzzle mastery',
    coopResonance: 'Co-op resonance',
    chessMastery: 'Chess',
    syncingReceipts: 'Synchronizing receipts…',
    blitz: 'Blitz',
    rapid: 'Rapid',
    cosmetics: 'Cosmetics',
    receipts: 'Receipts',
    leaderboard: 'Leaderboard',
    collection: 'Collection',
    refresh: 'Refresh',
  },
} as const;

const EMPTY_ELIGIBILITY: NetworkEligibilitySnapshot = {
  chessTrainingCompleted: false,
  casualChessCompleted: 0,
  rankedChessUnlocked: false,
  coopTrainingCompleted: false,
  communityRulesAccepted: false,
  ageGateConfirmed: false,
};

function setRequestedPuzzleMode(mode: 'story' | 'daily' | 'weekly') {
  try {
    sessionStorage.setItem('eleven_puzzle_hub_requested_mode', mode);
  } catch {
    // Navigation still opens the Puzzle Hub when session storage is disabled.
  }
}

export default function EchoNetworkScreen() {
  const locale = useUiPreferencesStore((state) => state.locale);
  const navigate = useShellStore((state) => state.navigate);
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const story = useStoryPuzzleStore((state) => state.snapshot);
  const live = useLiveChallengeStore((state) => state.snapshot);
  const loadLive = useLiveChallengeStore((state) => state.actions.load);
  const [tab, setTab] = useState<NetworkTab>('hub');
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  // A private party becomes its authoritative match in this single controller.
  // Keeping it above the tabs means the player does not lose their socket while
  // the interface changes from the community board to Chess or Co-op.
  // A reload can restore only a server-verified match locator. The new ticket
  // is issued after authentication and validates room membership again.
  const partyRoom = useRealtimeRoom({ resumeMatch: authStatus === 'signed-in', locale });
  const copy = NETWORK_COPY[locale];
  const season = useMemo(() => seasonAt(), []);
  const week = seasonWeekAt();

  useEffect(() => {
    if (partyRoom.state.target !== 'match') return;
    // A terminal snapshot may arrive while the player is browsing the hub.
    // Keep the verified room surface visible for `settling`, whose wording is
    // deliberately pending rather than a claim that D1 already granted XP.
    if (!['connecting', 'awaiting-snapshot', 'active', 'reconnecting', 'settling', 'completed'].includes(partyRoom.state.phase)) return;
    setTab(partyRoom.state.mode === 'coop_breach' ? 'coop' : 'chess');
  }, [partyRoom.state.mode, partyRoom.state.phase, partyRoom.state.target]);

  const refresh = useCallback(async () => {
    if (authStatus !== 'signed-in') return;
    setStatus('loading');
    try {
      const snapshot = await fetchEchoNetwork();
      setNetwork(snapshot);
      setError(null);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.syncFailed);
      setStatus('error');
    }
  }, [authStatus, copy.syncFailed]);

  useEffect(() => {
    if (authStatus !== 'signed-in') return;
    void refresh();
    if (!live) void loadLive();
  }, [authStatus, live, loadLive, refresh]);

  const eligibility = network?.eligibility ?? EMPTY_ELIGIBILITY;
  const completeTraining = useCallback(async (training: 'chess' | 'coop') => {
    try {
      const next = await completeNetworkTraining(training);
      setNetwork((previous) => previous ? { ...previous, eligibility: next } : {
        eligibility: next,
        ratings: [],
        recentMatches: [],
        cosmetics: [],
        seasonProgress: [],
        characterBonds: [],
      });
      setError(null);
    } catch (trainingError) {
      setError(trainingError instanceof Error
        ? trainingError.message
        : copy.trainingFailed);
    }
  }, [copy.trainingFailed]);

  const chooseActivity = (activity: DirectedActivity) => {
    if (activity === 'chess' || activity === 'coop' || activity === 'community') {
      setTab(activity);
      return;
    }
    if (activity === 'weekly' || activity === 'daily' || activity === 'story') {
      setRequestedPuzzleMode(activity);
      navigate('puzzles');
    }
  };

  const selectTabFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = (index + 1) % TABS.length;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = (index - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    setTab(TABS[next]!.id);
    requestAnimationFrame(() => document.getElementById(`echo-network-tab-${TABS[next]!.id}`)?.focus());
  };

  return (
    <div className="echo-network" data-tab={tab}>
      <header className="echo-network-hero">
        <div className="echo-network-hero__memory" aria-hidden="true" />
        <div className="echo-network-hero__signal" aria-hidden="true"><i /><i /><i /><strong>11:11</strong></div>
        <div className="echo-network-hero__copy">
          <small>ECHO NETWORK // LIVE MEMORY LAYER</small>
          <h1>{locale === 'ar' ? 'شبكة Echo' : 'Echo Network'}</h1>
          <p>{locale === 'ar'
            ? 'القصة تبقى العمود الفقري. هنا تختار جلسة قصيرة، عقد شطرنج عادل، قضية تعاون، أو أثرًا من الموسم—بلا طاقة وبلا دفع للفوز.'
            : 'Story remains the spine. Choose a short session, fair contract chess, a co-op case, or a season trace—without energy systems or pay-to-win.'}</p>
        </div>
        <div className="echo-network-hero__status">
          <span data-online={navigator.onLine || undefined}><i />{navigator.onLine ? 'NETWORK READY' : 'OFFLINE ARCHIVE'}</span>
          <strong>{season.title[locale]}</strong>
          <small>WEEK {week} · RESET {new Date(nextSignalResetAt()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
      </header>

      <div className="echo-network-tabs" role="tablist" aria-label={locale === 'ar' ? 'أقسام شبكة Echo' : 'Echo Network sections'}>
        {TABS.map((item, index) => (
          <button
            type="button"
            role="tab"
            id={`echo-network-tab-${item.id}`}
            aria-controls={`echo-network-panel-${item.id}`}
            aria-selected={tab === item.id}
            tabIndex={tab === item.id ? 0 : -1}
            key={item.id}
            data-active={tab === item.id || undefined}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => selectTabFromKeyboard(event, index)}
          >
            <i>{item.code}</i><span>{item[locale]}</span>
          </button>
        ))}
      </div>

      {authStatus !== 'signed-in' && (
        <p className="echo-network-auth-gate" role="status">{copy.authGate}</p>
      )}
      {error && <p className="echo-network-error" role="alert">{error}</p>}

      <div
        id={`echo-network-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`echo-network-tab-${tab}`}
        className="echo-network-panel"
      >
        {tab === 'hub' && (
          <>
            <ActivityDirectorPanel
              locale={locale}
              storyCompleted={story?.totalCompletedCount ?? 0}
              dailyCompleted={live?.daily.status === 'completed'}
              weeklyCompletedStages={live?.weekly.completedStages ?? 0}
              // The server publishes four stages. Keep the loading fallback
              // truthful so the director never flashes a false 3-stage goal.
              weeklyTotalStages={live?.weekly.totalStages ?? 4}
              onlineAvailable={authStatus === 'signed-in' && navigator.onLine}
              onChoose={chooseActivity}
            />
            <div className="echo-network-hub-grid">
              <button type="button" className="echo-network-portal" data-portal="story" onClick={() => chooseActivity('story')}>
                <span><small>CANON CORE</small><strong>{copy.story}</strong><p>{copy.storyProgress(story?.mainCompletedCount ?? 0, story?.totalCompletedCount ?? 0)}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="daily" onClick={() => chooseActivity('daily')}>
                <span><small>11:11 UTC</small><strong>{copy.daily}</strong><p>{live?.daily.status === 'completed' ? copy.dailyRecovered : copy.dailyAvailable}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="chess" onClick={() => setTab('chess')}>
                <span><small>BLACK / RED</small><strong>{copy.chess}</strong><p>{eligibility.rankedChessUnlocked ? copy.rankedOpen : copy.rankedGate(eligibility.casualChessCompleted)}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="coop" onClick={() => setTab('coop')}>
                <span><small>2–4 SIGNALS</small><strong>{copy.coop}</strong><p>{copy.coopDescription}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="season" onClick={() => setTab('season')}>
                <span><small>WEEK {week}/8</small><strong>{season.activities[week - 1]?.title[locale]}</strong><p>{copy.seasonArchive}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="community" onClick={() => setTab('community')}>
                <span><small>PRESET SAFE</small><strong>{copy.community}</strong><p>{copy.communityDescription}</p></span><i>→</i>
              </button>
            </div>
            <div className="echo-network-overview-row">
              <HudPanel tone="progression" eyebrow={copy.masteryEyebrow} title={copy.masteryTitle}>
                <div className="echo-network-mastery">
                  <div><span>{copy.storyMastery}</span><GameProgress value={((story?.mainCompletedCount ?? 0) / 14) * 100} tone="danger" /></div>
                  <div><span>{copy.puzzleMastery}</span><GameProgress value={((story?.totalCompletedCount ?? 0) / 20) * 100} tone="memory" /></div>
                  <div><span>{copy.coopResonance}</span><GameProgress value={Math.min(100, (network?.recentMatches.filter((match) => match.mode === 'coop_breach').length ?? 0) * 10)} tone="rare" /></div>
                  <div><span>{copy.chessMastery}</span><GameProgress value={Math.min(100, (network?.ratings.reduce((sum, rating) => sum + rating.games_played, 0) ?? 0) * 5)} tone="progression" /></div>
                </div>
              </HudPanel>
              <GlassPanel tone="rare" eyebrow="ACCOUNT SIGNAL" title={user?.displayName || user?.email || 'PLAYER'}>
                {status === 'loading' ? <p>{copy.syncingReceipts}</p> : (
                  <dl className="echo-network-account-stats">
                    <div><dt>{copy.blitz}</dt><dd>{Math.round(network?.ratings.find((rating) => rating.speed === 'blitz')?.rating ?? 1500)}</dd></div>
                    <div><dt>{copy.rapid}</dt><dd>{Math.round(network?.ratings.find((rating) => rating.speed === 'rapid')?.rating ?? 1500)}</dd></div>
                    <div><dt>{copy.cosmetics}</dt><dd>{network?.cosmetics.length ?? 0}</dd></div>
                    <div><dt>{copy.receipts}</dt><dd>{network?.recentMatches.length ?? 0}</dd></div>
                  </dl>
                )}
                <div className="echo-network-actions"><GameButton size="sm" variant="ghost" onClick={() => navigate('leaderboard')}>{copy.leaderboard}</GameButton><GameButton size="sm" variant="ghost" onClick={() => navigate('progress')}>{copy.collection}</GameButton><GameButton size="sm" variant="secondary" onClick={() => void refresh()}>{copy.refresh}</GameButton></div>
              </GlassPanel>
            </div>
            <SponsorTransmission placement="echo-network-hub" />
          </>
        )}
        {tab === 'chess' && (
          <ContractChessPanel
            eligibility={eligibility}
            onTrainingComplete={() => completeTraining('chess')}
            onReceipt={refresh}
            locale={locale}
            room={partyRoom}
          />
        )}
        {tab === 'coop' && (
          <CoopBreachPanel
            eligibility={eligibility}
            onTrainingComplete={() => completeTraining('coop')}
            onReceipt={refresh}
            room={partyRoom}
            locale={locale}
          />
        )}
        {tab === 'season' && (
          <SeasonPanel
            network={network}
            onOpenWeekly={() => chooseActivity('weekly')}
            onOpenCoop={() => setTab('coop')}
          />
        )}
        {tab === 'community' && (
          <SignalBoardPanel
            locale={locale}
            eligibility={eligibility}
            partyRoom={partyRoom}
            onEligibility={(next) => setNetwork((previous) => previous ? { ...previous, eligibility: next } : {
              eligibility: next,
              ratings: [],
              recentMatches: [],
              cosmetics: [],
              seasonProgress: [],
              characterBonds: [],
            })}
          />
        )}
      </div>
    </div>
  );
}
