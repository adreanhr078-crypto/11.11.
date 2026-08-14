import { useEffect } from 'react';
import {
  documentTitle,
  localeDirection,
} from './i18n/runtime';
import { useUiPreferencesStore } from './shell/shellStore';
import { useShellStore } from './shell/shellStore';

export function LocaleDocumentBridge() {
  const locale = useUiPreferencesStore((state) => state.locale);
  const notificationsEnabled = useUiPreferencesStore((state) => state.notificationsEnabled);
  const quietHoursStart = useUiPreferencesStore((state) => state.quietHoursStart);
  const quietHoursEnd = useUiPreferencesStore((state) => state.quietHoursEnd);
  const currentScreen = useShellStore((state) => state.currentScreen);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
    document.title = documentTitle(locale, currentScreen);
  }, [currentScreen, locale]);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const send = (registration: ServiceWorkerRegistration) => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      worker?.postMessage({
        type: 'ELEVEN_NOTIFICATION_PREFERENCES',
        value: {
          enabled: notificationsEnabled,
          quietHoursStart,
          quietHoursEnd,
          timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        },
      });
    };
    void navigator.serviceWorker.ready.then(send);
  }, [notificationsEnabled, quietHoursEnd, quietHoursStart]);
  return null;
}
