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
import {
  OPENING_ROOM_3D_ENABLED,
} from '../../app/config/featureFlags';

export default function GameplayScreen() {
  const paused = useShellStore((shell) => shell.pauseOpen);
  const openPause = useShellStore((shell) => shell.openPause);
  const goBack = useShellStore((shell) => shell.goBack);
  const navigate = useShellStore((shell) => shell.navigate);
  const quality = useUiPreferencesStore(
    (preferences) => preferences.quality,
  );
  const motion = useUiPreferencesStore(
    (preferences) => preferences.motion,
  );

  useEffect(() => {
    if (!OPENING_ROOM_3D_ENABLED) {
      navigate('puzzles');
      return;
    }
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
  }, [navigate]);

  if (!OPENING_ROOM_3D_ENABLED) return null;

  return (
    <GameplayErrorBoundary onExit={goBack}>
      <GameWorld
        paused={paused}
        quality={quality}
        motion={motion}
        onPause={openPause}
      />
    </GameplayErrorBoundary>
  );
}
