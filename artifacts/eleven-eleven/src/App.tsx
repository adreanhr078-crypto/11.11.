import './ui/design-system/styles/index.css';
import './styles/eleven-theme.css';
import './styles/dashboard.css';
import './styles/backgrounds.css';
import './styles/EchoPortrait.css';
import './app/shell/application-shell.css';
import './ui/presentation/premium-presentation.css';
import './features/screens/core-five-screens.css';
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
