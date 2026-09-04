import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  completeNetworkTraining,
  fetchEchoNetwork,
  type NetworkEligibilitySnapshot,
  type NetworkSnapshot,
} from '../../infrastructure/echo-network/echoNetworkApi';
import { useAuthStore } from '../auth/authStore';
import { ContractChessPanel } from './ContractChessPanel';
import { CoopBreachPanel } from './CoopBreachPanel';
import { useRealtimeRoom } from './useRealtimeRoom';
import './echo-network.css';

type NetworkTab = 'chess' | 'coop';

const TABS: ReadonlyArray<{ id: NetworkTab; ar: string; en: string; code: string }> = [
  { id: 'chess', ar: 'شطرنج Echo', en: 'Echo Chess', code: 'CH' },
  { id: 'coop', ar: 'اختراق تعاوني', en: 'Co-op Breach', code: 'CO' },
];

const COPY = {
  ar: {
    syncFailed: 'تعذر مزامنة اللعب المشترك. حاول مرة أخرى.',
    trainingFailed: 'تعذر توثيق التدريب. لم يُفقد تقدّمك المحلي.',
    authGate: 'سجّل الدخول لمزامنة اللقاءات المتصلة. مواجهة Echo المحلية تبقى للتدريب فقط.',
    title: 'اللعب معًا',
    description: 'اختر مواجهة Echo أو قضية تعاونية. القصة تبقى المسار الرئيسي، والنتائج المتصلة يوثّقها الخادم.',
    status: 'قناة مشتركة',
    statusDetail: 'يظهر التصنيف والموسم مع تقدّمك الموثّق.',
    tabs: 'أنماط اللعب المشترك',
    unavailable: 'هذه القناة لم تُفتح لسجلك الموثّق بعد.',
  },
  en: {
    syncFailed: 'Play Together could not be synchronized. Try again.',
    trainingFailed: 'Training could not be certified. Your local progress was not lost.',
    authGate: 'Sign in to synchronize connected matches. The local Echo Duel remains practice only.',
    title: 'Play Together',
    description: 'Choose an Echo Duel or a co-op case. Story remains the spine, and connected results are verified by the server.',
    status: 'SHARED CHANNEL',
    statusDetail: 'Ranked and season records appear with verified progression.',
    tabs: 'Play Together modes',
    unavailable: 'This channel has not opened for your verified record yet.',
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

/**
 * Stage 3 deliberately keeps Play Together small: Chess and Co-op only.
 * Story, Daily, Weekly, Season, and Community remain on their own gated
 * surfaces instead of creating a second dashboard of unexplained systems.
 */
export default function EchoNetworkScreen() {
  const locale = useUiPreferencesStore((state) => state.locale);
  const networkModes = useShellStore((state) => state.experienceEntitlements.networkModes);
  const requestNetworkExperienceRefresh = useShellStore((state) => state.requestExperienceNetworkRefresh);
  const authStatus = useAuthStore((state) => state.status);
  const [tab, setTab] = useState<NetworkTab>('chess');
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const partyRoom = useRealtimeRoom({ resumeMatch: authStatus === 'signed-in', locale });
  const copy = COPY[locale];
  const visibleTabs = useMemo(() => TABS.filter((item) => (
    item.id === 'chess'
      ? networkModes.includes('casual-chess')
      : networkModes.includes('coop-training')
  )), [networkModes]);

  useEffect(() => {
    if (partyRoom.state.target !== 'match') return;
    if (!['connecting', 'awaiting-snapshot', 'active', 'reconnecting', 'settling', 'completed'].includes(partyRoom.state.phase)) return;
    setTab(partyRoom.state.mode === 'coop_breach' ? 'coop' : 'chess');
  }, [partyRoom.state.mode, partyRoom.state.phase, partyRoom.state.target]);

  const refresh = useCallback(async () => {
    if (authStatus !== 'signed-in') return;
    try {
      const snapshot = await fetchEchoNetwork();
      setNetwork(snapshot);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.syncFailed);
    }
  }, [authStatus, copy.syncFailed]);

  useEffect(() => {
    if (authStatus !== 'signed-in') return;
    void refresh();
  }, [authStatus, refresh]);

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) {
      setTab(visibleTabs[0]?.id ?? 'chess');
    }
  }, [tab, visibleTabs]);

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
      setError(trainingError instanceof Error ? trainingError.message : copy.trainingFailed);
    }
  }, [copy.trainingFailed]);
  const handleVerifiedChessTraining = useCallback(() => {
    // This is a server-owned milestone. Refresh both the visible Network
    // record and the shell's entitlement projection; no local duel state is
    // ever used as a Ranked unlock.
    requestNetworkExperienceRefresh();
    void refresh();
  }, [refresh, requestNetworkExperienceRefresh]);

  const selectTabFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (visibleTabs.length === 0) return;
    let next: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = (index + 1) % visibleTabs.length;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = (index - 1 + visibleTabs.length) % visibleTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = visibleTabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    const nextTab = visibleTabs[next];
    if (!nextTab) return;
    setTab(nextTab.id);
    requestAnimationFrame(() => document.getElementById(`echo-network-tab-${nextTab.id}`)?.focus());
  };

  const online = typeof navigator !== 'undefined' && navigator.onLine;
  return (
    <div className="echo-network" data-tab={tab} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="echo-network-hero">
        <div className="echo-network-hero__memory" aria-hidden="true" />
        <div className="echo-network-hero__signal" aria-hidden="true"><i /><i /><i /><strong>11:11</strong></div>
        <div className="echo-network-hero__copy">
          <small>PLAY TOGETHER // VERIFIED CHANNEL</small>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="echo-network-hero__status">
          <span data-online={online || undefined}><i />{online ? 'NETWORK READY' : 'OFFLINE ARCHIVE'}</span>
          <strong>{copy.status}</strong>
          <small>{copy.statusDetail}</small>
        </div>
      </header>

      {visibleTabs.length > 0 && (
        <div className="echo-network-tabs" role="tablist" aria-label={copy.tabs}>
          {visibleTabs.map((item, index) => (
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
      )}

      {authStatus !== 'signed-in' && <p className="echo-network-auth-gate" role="status">{copy.authGate}</p>}
      {error && <p className="echo-network-error" role="alert">{error}</p>}

      {visibleTabs.length === 0 ? (
        <p className="echo-network-auth-gate" role="status">{copy.unavailable}</p>
      ) : (
        <div
          id={`echo-network-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`echo-network-tab-${tab}`}
          className="echo-network-panel"
        >
          {tab === 'chess' && (
            <ContractChessPanel
              eligibility={eligibility}
              onReceipt={refresh}
              onTrainingCertified={handleVerifiedChessTraining}
              locale={locale}
              room={partyRoom}
              allowRanked={networkModes.includes('ranked')}
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
        </div>
      )}
    </div>
  );
}
