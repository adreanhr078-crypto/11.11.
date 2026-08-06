import { useEffect, useMemo, useState } from 'react';
import { Radio, X } from 'lucide-react';
import {
  useEchoMindLivingStore,
} from '../../application/echo/echoMindLivingStore';
import {
  playEchoMindSignal,
} from '../../infrastructure/audio/echoMindSignalAudio';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import './echo-mind-living.css';

export function EchoIntrusionOverlay() {
  const intrusions = useEchoMindLivingStore((state) => state.intrusions);
  const preferences = useEchoMindLivingStore((state) => state.preferences);
  const markSeen = useEchoMindLivingStore((state) => state.markIntrusionSeen);
  const screen = useShellStore((state) => state.currentScreen);
  const navigate = useShellStore((state) => state.navigate);
  const motion = useUiPreferencesStore((state) => state.motion);
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const locale = typeof document !== 'undefined'
    && document.documentElement.lang.startsWith('en')
    ? 'en'
    : 'ar';
  const pending = useMemo(() => intrusions.find((intrusion) => (
    !intrusion.seen
  )) ?? null, [intrusions]);

  useEffect(() => {
    if (!pending || screen === 'echo-mind') {
      setVisibleId(null);
      return;
    }
    const minimumDelay = motion === 'reduced' ? 250 : 1_200;
    const delay = Math.max(minimumDelay, pending.availableAfter - Date.now());
    const timeout = globalThis.setTimeout(() => {
      setVisibleId(pending.id);
      if (preferences.signalSoundsEnabled) {
        playEchoMindSignal(pending.tone, preferences.signalVolume);
      }
    }, delay);
    return () => globalThis.clearTimeout(timeout);
  }, [motion, pending, preferences.signalSoundsEnabled, preferences.signalVolume, screen]);

  const visible = pending?.id === visibleId ? pending : null;
  if (!visible) return null;

  const dismiss = () => {
    markSeen(visible.id);
    setVisibleId(null);
  };

  return (
    <aside
      className="echo-intrusion"
      data-tone={visible.tone}
      data-motion={motion}
      role="status"
      aria-live="polite"
      aria-label={locale === 'en' ? 'Incoming Echo signal' : 'إشارة واردة من Echo'}
    >
      <div className="echo-intrusion__scan" aria-hidden="true" />
      <header>
        <span><Radio size={14} /> ECHO // INTERRUPT</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label={locale === 'en' ? 'Dismiss signal' : 'إغلاق الإشارة'}
        >
          <X size={16} />
        </button>
      </header>
      <p>{visible.text[locale]}</p>
      {preferences.captionsEnabled && (
        <small>[{visible.caption[locale]}]</small>
      )}
      <button
        type="button"
        className="echo-intrusion__open"
        onClick={() => {
          dismiss();
          navigate('echo-mind');
        }}
      >
        {locale === 'en' ? 'Open Echo channel' : 'فتح قناة Echo'}
      </button>
    </aside>
  );
}
