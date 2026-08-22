import { lazy, Suspense } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { EmotionVisualBridge } from '../../features/emotion/useEmotionVisualSystem';

const EndingResultScreen = lazy(() => import(
  '../../components/sections/EndingResultScreen'
).then((module) => ({ default: module.EndingResultScreen })));
const FinalChoiceSystem = lazy(() => import(
  '../../components/sections/FinalChoiceSystem'
).then((module) => ({ default: module.FinalChoiceSystem })));
/**
 * Developer panels must never sit above player controls just because a local
 * build happens to be running in development mode. Keep the narrative panel
 * available for diagnosis, but require an explicit opt-in in either the URL
 * query or hash query: `?narrative-debug=1`.
 */
const narrativeDebugEnabled = import.meta.env.DEV && (() => {
  if (typeof window === 'undefined') return false;
  const hashQuery = window.location.hash.split('?')[1] ?? '';
  const query = window.location.search || hashQuery;
  return new URLSearchParams(query).get('narrative-debug') === '1';
})();

const NarrativeDebugPanel = narrativeDebugEnabled
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
