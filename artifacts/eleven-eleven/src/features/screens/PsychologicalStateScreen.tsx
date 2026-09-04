import { useMemo } from 'react';
import { BrainCircuit } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
  StatMeter,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
import { useShellStore, useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  createPsychologicalStateReadModel,
} from '../../application/ui/psychologicalStateReadModel';
import {
  createEchoPresentationReadModel,
} from '../../application/ui/echoPresentationReadModel';
import {
  useEmotionVisualProfile,
} from '../emotion/useEmotionVisualSystem';
import {
  EchoInteractiveStage,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';
import { useStoryPuzzleStore } from '../story-puzzles/storyPuzzleStore';
import { deriveCorePlayerObjective } from '../../application/player-journey/corePlayerLoop';
import { MiniEchoCompanion } from '../echo/MiniEchoCompanion';
import './psychological-state-screen.css';
import { usePlayerProgressionStore } from '../player-progression/playerProgressionStore';

const MISSION_COPY = {
  ar: {
    header: 'مركز المهمة',
    eyebrow: 'المسار الموثق // الخطوة الحالية',
    status: 'الهدف يتغير مع تقدمك الموثق',
    objective: 'هدفك الآن',
    echo: 'إشارة Echo',
    records: 'عرض حالة الاتصال',
    recordsDetail: 'هذه الإشارات وصف لحالتك، وليست خطوة لعب مطلوبة.',
  },
  en: {
    header: 'Mission Control',
    eyebrow: 'VERIFIED ROUTE // CURRENT STEP',
    status: 'Objective updates from your verified progress',
    objective: 'Your objective',
    echo: 'Echo signal',
    records: 'View connection state',
    recordsDetail: 'These signals describe your state; they are not required actions.',
  },
} as const;

const MISSION_CONTROL_CHAMBER_ASSET = '/assets/ui/mission-control/mission-control-chamber-v1.jpg';

/**
 * The player-facing Home surface. It intentionally gives one action only;
 * secondary psychological telemetry is disclosed after the player has earned
 * their first server-verified reward.
 */
export default function PsychologicalStateScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const requestManhwaReader = useShellStore((shell) => shell.requestManhwaReader);
  const requestStoryPuzzleDiscovery = useShellStore((shell) => shell.requestStoryPuzzleDiscovery);
  const hasVerifiedReward = useShellStore(
    (shell) => shell.experienceEntitlements.snapshot.firstRewardReceived,
  );
  const locale = useUiPreferencesStore((preferences) => preferences.locale);
  const storyPuzzleSnapshot = useStoryPuzzleStore((store) => store.snapshot);
  const authoritativeStoryState = usePlayerProgressionStore(
    (store) => store.storyState,
  );
  const visualProfile = useEmotionVisualProfile();
  const copy = MISSION_COPY[locale];
  const model = useMemo(
    () => createPsychologicalStateReadModel(
      state,
      visualProfile.dominantEmotion,
    ),
    [state, visualProfile.dominantEmotion],
  );
  const echoPresentation = useMemo(
    () => createEchoPresentationReadModel(state),
    [state],
  );
  const objective = useMemo(
    () => deriveCorePlayerObjective(
      storyPuzzleSnapshot,
      locale,
      authoritativeStoryState,
    ),
    [authoritativeStoryState, locale, storyPuzzleSnapshot],
  );
  const continueMission = () => {
    if (objective.secretPuzzleId) {
      requestStoryPuzzleDiscovery(objective.secretPuzzleId);
      return;
    }
    if (objective.screen === 'memories') {
      requestManhwaReader();
      return;
    }
    navigate(objective.screen);
  };

  return (
    <div className="psychological-state" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div
        className="psychological-state__world"
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(2 4 8 / 84%), rgb(2 4 8 / 36%) 52%, rgb(2 4 8 / 76%)), url("${MISSION_CONTROL_CHAMBER_ASSET}"), url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
          backgroundBlendMode: 'normal, screen, normal',
        }}
        aria-hidden="true"
      >
        <span className="psychological-state__grade" />
        <span className="psychological-state__aura" />
      </div>

      <header className="psychological-state__header gds-safe-area">
        <span className="shell-screen-code">01</span>
        <span>
          <small>{copy.eyebrow}</small>
          <strong>{copy.header}</strong>
        </span>
        <span className="psychological-state__live">
          <i aria-hidden="true" />
          {copy.status}
        </span>
      </header>

      <section className="psychological-state__presence" aria-label="Echo">
        <EchoInteractiveStage
          className="psychological-state__echo-stage"
          form={echoPresentation.form}
          eager
          label="Echo"
        />
      </section>

      <GlassPanel
        className="psychological-state__reading"
        tone="danger"
        eyebrow={copy.eyebrow}
      >
        <div className="psychological-state__reading-title">
          <BrainCircuit aria-hidden="true" />
          <span>
            <small>{copy.objective}</small>
            <h2>{objective.title}</h2>
            <p>{objective.detail}</p>
          </span>
        </div>

        <div className="psychological-state__echo-line" role="status" aria-live="polite">
          <small>{copy.echo}</small>
          <p>{objective.echoLine}</p>
        </div>

        <MiniEchoCompanion
          className="psychological-state__mini-echo"
          available={hasVerifiedReward}
          locale={locale}
          objectiveKind={objective.kind}
          onSuggestedRoute={navigate}
        />

        <div className="psychological-state__start-game">
          <GameButton
            size="lg"
            fullWidth
            leadingIcon={<GameIcon id={objective.kind === 'read'
              ? 'screen-memory'
              : 'screen-puzzles'} />}
            onClick={continueMission}
          >
            {objective.actionLabel}
          </GameButton>
        </div>

        {hasVerifiedReward && (
          <details className="psychological-state__channels-disclosure">
            <summary>{copy.records}</summary>
            <p>{copy.recordsDetail}</p>
            <div
              className="psychological-state__channels"
              aria-label={copy.records}
            >
              {model.channels.map((channel) => (
                <article key={channel.id}>
                  <StatMeter
                    compact
                    label={channel.label}
                    value={channel.value}
                    tone={channel.tone}
                  />
                  <small>{channel.level}</small>
                </article>
              ))}
            </div>
          </details>
        )}
      </GlassPanel>
    </div>
  );
}
