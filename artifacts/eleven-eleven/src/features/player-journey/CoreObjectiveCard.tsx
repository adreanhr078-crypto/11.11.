import { BookOpenCheck, CheckCircle2, ChevronLeft, ChevronRight, Puzzle, Radio } from 'lucide-react';
import { deriveCorePlayerObjective } from '../../application/player-journey/corePlayerLoop';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import './core-objective-card.css';

const objectiveIcon = {
  read: BookOpenCheck,
  solve: Puzzle,
  complete: CheckCircle2,
} as const;

export function CoreObjectiveCard({ compact = false }: { compact?: boolean }) {
  const snapshot = useStoryPuzzleStore((state) => state.snapshot);
  const latestActivity = useStoryPuzzleStore((state) => state.latestActivity);
  const navigate = useShellStore((state) => state.navigate);
  const requestManhwaReader = useShellStore((state) => state.requestManhwaReader);
  const requestStoryPuzzleDiscovery = useShellStore((state) => state.requestStoryPuzzleDiscovery);
  const locale = useUiPreferencesStore((state) => state.locale);
  const objective = deriveCorePlayerObjective(snapshot, locale);
  const Icon = objectiveIcon[objective.kind];
  const reaction = latestActivity?.kind === 'main-puzzle-solved'
    ? locale === 'en'
      ? 'Echo: I caught the shard. The record changed; your next clue is waiting.'
      : 'Echo: التقطت الشظية. تغيّر السجل؛ الدليل التالي ينتظرك.'
    : objective.echoLine;
  const ActionChevron = locale === 'en' ? ChevronRight : ChevronLeft;

  return (
    <aside
      className="core-objective-card"
      data-compact={compact || undefined}
      aria-label={locale === 'en' ? 'Next step in the journey' : 'الخطوة التالية في الرحلة'}
    >
      <div className="core-objective-card__art" aria-hidden="true" />
      <span className="core-objective-card__signal">
        <Radio aria-hidden="true" /> {locale === 'en' ? 'Current Echo objective' : 'هدف Echo الحالي'}
      </span>
      <div className="core-objective-card__copy">
        <Icon aria-hidden="true" />
        <span><strong>{objective.title}</strong><small>{objective.detail}</small></span>
      </div>
      <p className="core-objective-card__echo"><b>Echo</b> {reaction}</p>
      <button
        type="button"
        onClick={() => {
          if (objective.secretPuzzleId) {
            requestStoryPuzzleDiscovery(objective.secretPuzzleId);
            return;
          }
          if (objective.screen === 'memories') requestManhwaReader();
          else navigate(objective.screen);
        }}
      >
        {objective.actionLabel}<ActionChevron aria-hidden="true" />
      </button>
    </aside>
  );
}
