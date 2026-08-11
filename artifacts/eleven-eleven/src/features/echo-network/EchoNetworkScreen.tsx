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

type NetworkTab = 'hub' | 'chess' | 'coop' | 'season' | 'community';

const TABS: Array<{ id: NetworkTab; ar: string; en: string; code: string }> = [
  { id: 'hub', ar: 'المركز', en: 'Hub', code: '00' },
  { id: 'chess', ar: 'شطرنج العقد', en: 'Contract Chess', code: 'CH' },
  { id: 'coop', ar: 'اختراقات التعاون', en: 'Co-op Breaches', code: 'CO' },
  { id: 'season', ar: 'شقوق Echo', en: 'Echo Fractures', code: 'S1' },
  { id: 'community', ar: 'لوحة الإشارة', en: 'Signal Board', code: 'SB' },
];

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
  const season = useMemo(() => seasonAt(), []);
  const week = seasonWeekAt();

  const refresh = useCallback(async () => {
    if (authStatus !== 'signed-in') return;
    setStatus('loading');
    try {
      const snapshot = await fetchEchoNetwork();
      setNetwork(snapshot);
      setError(null);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر مزامنة شبكة Echo.');
      setStatus('error');
    }
  }, [authStatus]);

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
        : 'تعذر توثيق التدريب. تقدّم التدريب المحلي لم يُفقد.');
    }
  }, []);

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
        <p className="echo-network-auth-gate" role="status">سجّل الدخول أو تابع كضيف محفوظ لفتح مزامنة الشبكة. التدريب المحلي يبقى قابلًا للعب.</p>
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
              weeklyTotalStages={live?.weekly.totalStages ?? 3}
              onlineAvailable={authStatus === 'signed-in' && navigator.onLine}
              onChoose={chooseActivity}
            />
            <div className="echo-network-hub-grid">
              <button type="button" className="echo-network-portal" data-portal="story" onClick={() => chooseActivity('story')}>
                <span><small>CANON CORE</small><strong>استعادة القصة</strong><p>{story?.mainCompletedCount ?? 0}/14 ألغاز رئيسية · {story?.totalCompletedCount ?? 0}/20 إجمالًا</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="daily" onClick={() => chooseActivity('daily')}>
                <span><small>11:11 UTC</small><strong>إشارة اليوم</strong><p>{live?.daily.status === 'completed' ? 'مستعادة اليوم' : '3–8 دقائق · بلا عقوبة تفويت'}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="chess" onClick={() => setTab('chess')}>
                <span><small>BLACK / RED</small><strong>شطرنج العقد</strong><p>{eligibility.rankedChessUnlocked ? 'Ranked مفتوح' : `${eligibility.casualChessCompleted}/3 Casual قبل Ranked`}</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="coop" onClick={() => setTab('coop')}>
                <span><small>2–4 SIGNALS</small><strong>اختراق تعاوني</strong><p>12 قضية · أدلة مختلفة لكل لاعب</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="season" onClick={() => setTab('season')}>
                <span><small>WEEK {week}/8</small><strong>{season.activities[week - 1]?.title[locale]}</strong><p>يبقى في الأرشيف بعد الموسم</p></span><i>→</i>
              </button>
              <button type="button" className="echo-network-portal" data-portal="community" onClick={() => setTab('community')}>
                <span><small>PRESET SAFE</small><strong>لوحة الإشارة</strong><p>أخبار، فرق، وألغاز مجتمع مراجعة</p></span><i>→</i>
              </button>
            </div>
            <div className="echo-network-overview-row">
              <HudPanel tone="progression" eyebrow="MASTERY PATHS" title="تقدم مستقل، لا رقم واحد">
                <div className="echo-network-mastery">
                  <div><span>القصة</span><GameProgress value={((story?.mainCompletedCount ?? 0) / 14) * 100} tone="danger" /></div>
                  <div><span>إتقان الألغاز</span><GameProgress value={((story?.totalCompletedCount ?? 0) / 20) * 100} tone="memory" /></div>
                  <div><span>تناغم التعاون</span><GameProgress value={Math.min(100, (network?.recentMatches.filter((match) => match.mode === 'coop_breach').length ?? 0) * 10)} tone="rare" /></div>
                  <div><span>الشطرنج</span><GameProgress value={Math.min(100, (network?.ratings.reduce((sum, rating) => sum + rating.games_played, 0) ?? 0) * 5)} tone="progression" /></div>
                </div>
              </HudPanel>
              <GlassPanel tone="rare" eyebrow="ACCOUNT SIGNAL" title={user?.displayName || user?.email || 'PLAYER'}>
                {status === 'loading' ? <p>جارٍ مزامنة الإيصالات…</p> : (
                  <dl className="echo-network-account-stats">
                    <div><dt>Blitz</dt><dd>{Math.round(network?.ratings.find((rating) => rating.speed === 'blitz')?.rating ?? 1500)}</dd></div>
                    <div><dt>Rapid</dt><dd>{Math.round(network?.ratings.find((rating) => rating.speed === 'rapid')?.rating ?? 1500)}</dd></div>
                    <div><dt>Cosmetics</dt><dd>{network?.cosmetics.length ?? 0}</dd></div>
                    <div><dt>Receipts</dt><dd>{network?.recentMatches.length ?? 0}</dd></div>
                  </dl>
                )}
                <div className="echo-network-actions"><GameButton size="sm" variant="ghost" onClick={() => navigate('leaderboard')}>الترتيب</GameButton><GameButton size="sm" variant="ghost" onClick={() => navigate('progress')}>المجموعة</GameButton><GameButton size="sm" variant="secondary" onClick={() => void refresh()}>تحديث</GameButton></div>
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
          />
        )}
        {tab === 'coop' && (
          <CoopBreachPanel
            eligibility={eligibility}
            onTrainingComplete={() => completeTraining('coop')}
            onReceipt={refresh}
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
