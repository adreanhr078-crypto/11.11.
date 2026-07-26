import { useEffect } from 'react';
import {
  useShellStore,
  useUiPreferencesStore,
} from '../../app/shell/shellStore';
import { useGameStore } from '../../stores/gameStore';
import { GameWorld } from '../gameplay/components/GameWorld';
import {
  GameplayErrorBoundary,
} from '../gameplay/components/GameplayErrorBoundary';
import '../gameplay/gameplay.css';

export default function GameplayScreen() {
  const paused = useShellStore((shell) => shell.pauseOpen);
  const openPause = useShellStore((shell) => shell.openPause);
  const goBack = useShellStore((shell) => shell.goBack);
  const quality = useUiPreferencesStore(
    (preferences) => preferences.quality,
  );

  useEffect(() => {
    const game = useGameStore.getState();
    if (!game.narrative.activeFlags.opening_room_session_started) {
      game.actions.setNarrativeFlag(
        'opening_room_session_started',
        true,
      );
      game.actions.recordNarrativeDecision(
        'opening-room-session',
        'entered',
        'system',
      );
    }
  }, []);

  return (
    <GameplayErrorBoundary onExit={goBack}>
      <GameWorld
        paused={paused}
        quality={quality}
        onPause={openPause}
      />
    </GameplayErrorBoundary>
  );
}
