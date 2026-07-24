import './ui/design-system/styles/index.css';
import './styles/eleven-theme.css';
import './styles/dashboard.css';
import './styles/day-mode.css';
import './styles/backgrounds.css';
import './styles/EchoPortrait.css';
import './styles/night-dashboard.css';
import './app/shell/application-shell.css';
import { ApplicationShell } from './app/shell/ApplicationShell';
import { GameRuntimeBridge } from './app/shell/GameRuntimeBridge';

export default function App() {
  return (
    <>
      <ApplicationShell />
      <GameRuntimeBridge />
    </>
  );
}
