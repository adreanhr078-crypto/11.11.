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
import { ApplicationShell } from './app/shell/ApplicationShell';
import { GameRuntimeBridge } from './app/shell/GameRuntimeBridge';
import { AuthBootstrap } from './features/auth/AuthBootstrap';
import { CloudSaveBootstrap } from './features/cloud-save/CloudSaveBootstrap';
import {
  PlayerProgressionBootstrap,
} from './features/player-progression/PlayerProgressionBootstrap';
import { StoryPuzzleBootstrap } from './features/story-puzzles/StoryPuzzleBootstrap';
import { FirstTimeOnboarding } from './features/onboarding/FirstTimeOnboarding';

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <CloudSaveBootstrap />
      <PlayerProgressionBootstrap />
      <StoryPuzzleBootstrap />
      <ApplicationShell />
      <GameRuntimeBridge />
      <FirstTimeOnboarding />
    </>
  );
}
