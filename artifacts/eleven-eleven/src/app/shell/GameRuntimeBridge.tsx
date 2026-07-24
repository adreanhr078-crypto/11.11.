import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useAudioSystem } from '../../hooks/useAudioSystem';
import { AnimationSystem } from '../../components/effects/AnimationSystem';
import { AchievementToast } from '../../components/AchievementToast';
import { EmotionVisualBridge } from '../../features/emotion/useEmotionVisualSystem';

const CinematicMode = lazy(() => import(
  '../../components/effects/CinematicMode'
).then((module) => ({ default: module.CinematicMode })));
const EndingResultScreen = lazy(() => import(
  '../../components/sections/EndingResultScreen'
).then((module) => ({ default: module.EndingResultScreen })));
const FinalChoiceSystem = lazy(() => import(
  '../../components/sections/FinalChoiceSystem'
).then((module) => ({ default: module.FinalChoiceSystem })));
const NarrativeDebugPanel = import.meta.env.DEV
  ? lazy(() => import('../../features/devtools/NarrativeDebugPanel'))
  : null;

export function GameRuntimeBridge() {
  const actions = useGameStore((state) => state.actions);
  const time = useGameStore((state) => state.time);
  const progression = useGameStore((state) => state.progression);
  const totalPuzzles = useGameStore((state) => state.totalPuzzles);
  const finalChoice = useGameStore((state) => state.finalChoice);
  const achievedEnding = useGameStore((state) => state.achievedEnding);
  const [showTimeCinematic, setShowTimeCinematic] = useState(false);
  const shownTimePhase = useRef<number | null>(null);

  useEffect(() => {
    actions.advanceTime();
    const interval = window.setInterval(() => actions.advanceTime(), 30_000);
    return () => window.clearInterval(interval);
  }, [actions]);

  useEffect(() => {
    if (
      time.phaseIndex < 3
      || shownTimePhase.current === time.phaseIndex
    ) return;
    shownTimePhase.current = time.phaseIndex;
    setShowTimeCinematic(true);
    const timer = window.setTimeout(
      () => setShowTimeCinematic(false),
      8_000,
    );
    return () => window.clearTimeout(timer);
  }, [time.phaseIndex]);

  useAudioSystem(time.phase, time.phaseIndex);

  const journeyResolved = (
    progression.completedPuzzleIds.length
    + progression.skippedPuzzleIds.length
  ) >= totalPuzzles;

  return (
    <>
      <AnimationSystem />
      <EmotionVisualBridge />
      <AchievementToast />
      <Suspense fallback={null}>
        {showTimeCinematic && (
          <CinematicMode onEnd={() => setShowTimeCinematic(false)} />
        )}
        {(achievedEnding || finalChoice) && <EndingResultScreen />}
        {journeyResolved && !finalChoice && <FinalChoiceSystem />}
        {NarrativeDebugPanel && <NarrativeDebugPanel />}
      </Suspense>
    </>
  );
}
