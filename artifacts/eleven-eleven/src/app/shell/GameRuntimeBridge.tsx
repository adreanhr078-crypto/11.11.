import { lazy, Suspense } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { EmotionVisualBridge } from '../../features/emotion/useEmotionVisualSystem';

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
  const progression = useGameStore((state) => state.progression);
  const totalPuzzles = useGameStore((state) => state.totalPuzzles);
  const finalChoice = useGameStore((state) => state.finalChoice);
  const achievedEnding = useGameStore((state) => state.achievedEnding);

  const journeyResolved = totalPuzzles > 0 && (
    progression.completedPuzzleIds.length
    + progression.skippedPuzzleIds.length
  ) >= totalPuzzles;

  return (
    <>
      <EmotionVisualBridge />
      <Suspense fallback={null}>
        {(achievedEnding || finalChoice) && <EndingResultScreen />}
        {journeyResolved && !finalChoice && <FinalChoiceSystem />}
        {NarrativeDebugPanel && <NarrativeDebugPanel />}
      </Suspense>
    </>
  );
}
