import { useCallback, useEffect, useState } from 'react';
import {
  useShellStore,
  useUiPreferencesStore,
} from '../../app/shell/shellStore';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';
import type { AuthoritativeStoryState } from '../../domain/story/storyState';
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
  const motion = useUiPreferencesStore(
    (preferences) => preferences.motion,
  );
  const experienceEntitlements = useShellStore(
    (shell) => shell.experienceEntitlements,
  );
  const requestManhwaReader = useShellStore(
    (shell) => shell.requestManhwaReader,
  );
  const [roomComplete, setRoomComplete] = useState(false);

  const handleRoomComplete = useCallback((storyState: AuthoritativeStoryState) => {
    usePlayerProgressionStore.getState().actions.hydrateStoryState(storyState);
    useGameStore.getState().actions.syncAuthoritativeStoryState(storyState);
    setRoomComplete(true);
  }, []);

  useEffect(() => {
    if (roomComplete && experienceEntitlements.accessibleScreens.includes('memories')) {
      requestManhwaReader();
    }
  }, [experienceEntitlements.accessibleScreens, requestManhwaReader, roomComplete]);

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
        motion={motion}
        onPause={openPause}
        onRoomComplete={handleRoomComplete}
      />
    </GameplayErrorBoundary>
  );
}
