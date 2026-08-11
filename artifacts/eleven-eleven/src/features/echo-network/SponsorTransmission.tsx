import { useEffect, useRef, useState } from 'react';
import {
  AD_FREQUENCY_CAP_MS,
  canShowAdvertisement,
  type AdPlacement,
} from '../../domain/echo-network/adPolicy';
import { useUiPreferencesStore } from '../../app/shell/shellStore';

interface ElevenAdProvider {
  ready: boolean;
  render: (
    element: HTMLElement,
    options: {
      placement: AdPlacement;
      locale: 'ar' | 'en';
      contextualOnly: true;
    },
  ) => void | (() => void);
}

declare global {
  interface Window {
    __ELEVEN_ELEVEN_AD_PROVIDER__?: ElevenAdProvider;
  }
}

function storageKey(placement: AdPlacement): string {
  return `eleven_ad_last_shown_${placement}`;
}

function lastShown(placement: AdPlacement): number | null {
  try {
    const parsed = Number(localStorage.getItem(storageKey(placement)) ?? '');
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function SponsorTransmission({ placement }: { placement: AdPlacement }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const consent = useUiPreferencesStore((state) => state.adConsent);
  const locale = useUiPreferencesStore((state) => state.locale);
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const provider = window.__ELEVEN_ELEVEN_AD_PROVIDER__;
  const eligible = canShowAdvertisement({
    placement,
    consent,
    providerReady: provider?.ready === true,
    online,
    lastShownAt: lastShown(placement),
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!eligible || !host || !provider) return undefined;
    const cleanup = provider.render(host, {
      placement,
      locale,
      contextualOnly: true,
    });
    try {
      localStorage.setItem(storageKey(placement), String(Date.now()));
    } catch {
      // The ad still renders for this session when storage is unavailable.
    }
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [eligible, locale, placement, provider]);

  if (!eligible) return null;
  return (
    <aside
      className="echo-network-ad"
      aria-label={locale === 'ar' ? 'إعلان' : 'Advertisement'}
    >
      <small>{locale === 'ar' ? 'رسالة الراعي · إعلان' : 'Sponsor transmission · Ad'}</small>
      <div ref={hostRef} />
      <span aria-hidden="true">{Math.round(AD_FREQUENCY_CAP_MS / 60_000)}m cap</span>
    </aside>
  );
}
