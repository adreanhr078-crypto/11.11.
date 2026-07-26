import { useMemo } from 'react';
import { BrainCircuit } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
  StatMeter,
} from '../../ui/design-system';
import { GameIcon } from '../../ui/icons';
import { useShellStore } from '../../app/shell/shellStore';
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
import './psychological-state-screen.css';

export default function PsychologicalStateScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const visualProfile = useEmotionVisualProfile();
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
  const openingRoomEntered = Boolean(
    state.narrative.activeFlags.opening_room_entered,
  );

  const enterOpeningRoom = () => {
    navigate('puzzles');
  };

  return (
    <div className="psychological-state" dir="rtl">
      <div
        className="psychological-state__world"
        style={{
          backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
        }}
        aria-hidden="true"
      >
        <span className="psychological-state__grade" />
        <span className="psychological-state__aura" />
      </div>

      <header className="psychological-state__header gds-safe-area">
        <span className="shell-screen-code">01</span>
        <span>
          <small>PSYCHOLOGICAL STATE</small>
          <strong>الحالة النفسية</strong>
        </span>
        <span className="psychological-state__live">
          <i />
          تتغير مع قراراتك
        </span>
      </header>

      <section className="psychological-state__presence">
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
        eyebrow={echoPresentation.isContractFormRevealed
          ? 'ECHO // ALTERED FORM'
          : 'ECHO // CURRENT STATE'}
      >
        <div className="psychological-state__reading-title">
          <BrainCircuit aria-hidden="true" />
          <span>
            <h2>{model.title}</h2>
            <p>{model.summary}</p>
            <small>{model.dominantLabel}</small>
          </span>
        </div>

        <div
          className="psychological-state__channels"
          aria-label="قيم الحالة النفسية"
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

        <div className="psychological-state__start-game">
          <GameButton
            size="lg"
            fullWidth
            leadingIcon={<GameIcon id="screen-gameplay" />}
            onClick={enterOpeningRoom}
          >
            {openingRoomEntered ? 'استكمال اللعبة' : 'ابدأ اللعبة'}
          </GameButton>
          <small>
            منظور الشخص الثالث قريبًا
          </small>
        </div>
      </GlassPanel>
    </div>
  );
}
