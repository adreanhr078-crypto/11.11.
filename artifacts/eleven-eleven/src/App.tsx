import './ui/design-system/styles/index.css';
import './app/shell/application-shell.css';
import './ui/presentation/premium-presentation.css';
import './features/screens/core-five-screens.css';
import './features/auth/auth.css';
import './features/player-progression/leaderboard.css';
import './features/player-progression/profile.css';
import './features/onboarding/first-time-onboarding.css';
import './ui/presentation/achievement-presentation.css';
import './features/screens/collection-hub.css';
import './features/live-challenges/live-challenges.css';
import './features/puzzle-hub/puzzle-hub.css';
import { ApplicationShell } from './app/shell/ApplicationShell';
import { GameRuntimeBridge } from './app/shell/GameRuntimeBridge';
import { AuthBootstrap } from './features/auth/AuthBootstrap';
import { PlayerSyncBootstrap } from './features/player-sync/PlayerSyncBootstrap';
import { PlayerSyncFailureOverlay } from './features/player-sync/PlayerSyncFailureOverlay';
import { FirstTimeOnboarding } from './features/onboarding/FirstTimeOnboarding';
import './features/player-sync/player-sync.css';
import './features/echo-network/echo-network.css';
import { LocaleDocumentBridge } from './app/LocaleDocumentBridge';
import { TelemetryBridge } from './app/telemetry/TelemetryBridge';

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <LocaleDocumentBridge />
      <TelemetryBridge />
      <PlayerSyncBootstrap />
      <ApplicationShell />
      <GameRuntimeBridge />
      <FirstTimeOnboarding />
      <PlayerSyncFailureOverlay />
    </>
  );
}
