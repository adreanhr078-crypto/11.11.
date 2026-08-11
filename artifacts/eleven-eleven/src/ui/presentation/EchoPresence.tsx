import { useEffect, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEmotionVisualProfile } from '../../features/emotion/useEmotionVisualSystem';
import {
  getEchoPresentationForStageId,
} from '../../application/ui/echoPresentationReadModel';
import {
  createEchoPresenceReadModel,
} from '../../domain/echo/echoPresence';
import { useStoryPuzzleStore } from '../../features/story-puzzles/storyPuzzleStore';
import { useEchoPresenceActivityStore } from '../../application/ui/echoPresenceActivityStore';
import {
  getEchoStatePresentationAssets,
} from './visualAssets';
import { cx } from '../design-system';

interface EchoPresenceStyle extends CSSProperties {
  '--echo-portrait': string;
  '--echo-corruption': string;
  '--echo-fear': string;
  '--echo-trust': string;
  '--echo-idle-speed': string;
  '--echo-story-red': string;
  '--echo-story-glitch': string;
  '--echo-story-scan': string;
  '--echo-reaction-intensity': string;
  '--echo-breathing': string;
}

export interface EchoPresenceProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  variant?: 'hero' | 'profile' | 'dialogue' | 'mini';
  showTelemetry?: boolean;
  eager?: boolean;
  label?: string;
}

export function EchoPresence({
  variant = 'profile',
  showTelemetry = false,
  eager = false,
  label = 'Echo',
  className,
  ...props
}: EchoPresenceProps) {
  const personality = useGameStore((state) => state.echo.personality);
  const progressionState = useGameStore((state) => state.progressionState);
  const puzzleSnapshot = useStoryPuzzleStore((state) => state.snapshot);
  const puzzleActivity = useStoryPuzzleStore((state) => state.latestActivity);
  const presenceActivity = useEchoPresenceActivityStore((state) => state.latestActivity);
  const profile = useEmotionVisualProfile();
  const [now, setNow] = useState(() => Date.now());
  const latestActivity = [puzzleActivity, presenceActivity]
    .filter((activity): activity is NonNullable<typeof activity> => activity !== null)
    .sort((left, right) => right.occurredAt - left.occurredAt)[0] ?? null;
  const presence = createEchoPresenceReadModel({
    progressionState,
    puzzleSnapshot,
    activity: latestActivity,
    now,
  });
  const storyStageId = presence.stage.stageId;
  const presentation = getEchoPresentationForStageId(
    storyStageId,
    storyStageId === 'awakening_fragile' ? 'echo_default' : `echo_${storyStageId}_slot`,
    presence.stage.assetStatus,
  );
  const stateAssets = getEchoStatePresentationAssets(storyStageId);

  useEffect(() => {
    if (!presence.reaction) return undefined;
    const delay = Math.max(0, presence.reaction.expiresAt - Date.now());
    const timer = window.setTimeout(() => setNow(Date.now()), delay + 20);
    return () => window.clearTimeout(timer);
  }, [presence.reaction]);

  const style: EchoPresenceStyle = {
    '--echo-portrait': `url("${stateAssets.portrait}")`,
    '--echo-corruption': String(personality.corruption / 100),
    '--echo-fear': String(personality.fear / 100),
    '--echo-trust': String(personality.trust / 100),
    '--echo-idle-speed': `${presence.stage.breathingSeconds}s`,
    '--echo-story-red': String(presence.stage.redEnergy),
    '--echo-story-glitch': String(presence.stage.glitchIntensity),
    '--echo-story-scan': String(presence.stage.scanIntensity),
    '--echo-reaction-intensity': presence.reaction ? '1' : '0',
    '--echo-breathing': `${presence.stage.breathingSeconds}s`,
  };

  return (
    <figure
      className={cx('echo-presence', className)}
      data-variant={variant}
      data-emotion={profile.dominantEmotion ?? 'balanced'}
      data-signature={profile.signature}
      data-story-state={presentation.stageId}
      data-form={presentation.form}
      data-idle-variant={presence.stage.idleVariant}
      data-reaction={presence.reaction?.visualEffect ?? 'idle'}
      data-puzzle-resonance={presence.memorySignals.dominantPuzzleResonance ?? 'none'}
      data-asset-status={presence.stage.assetStatus}
      style={style}
      aria-label={`${label}: ${profile.signature}, ${presence.stage.stageId}`}
      {...props}
    >
      <div className="echo-presence__field" aria-hidden="true">
        <span className="echo-presence__ring echo-presence__ring--outer" />
        <span className="echo-presence__ring echo-presence__ring--inner" />
        <span className="echo-presence__reticle" />
        <span className="echo-presence__signal echo-presence__signal--red" />
        <span className="echo-presence__signal echo-presence__signal--cyan" />
      </div>

      <div className="echo-presence__body">
        <img
          className="echo-presence__image"
          src={stateAssets.portrait}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
        <img
          className="echo-presence__glitch-layer"
          src={stateAssets.portrait}
          alt=""
          draggable={false}
          decoding="async"
          loading="lazy"
          aria-hidden="true"
        />
        <span className="echo-presence__grade" aria-hidden="true" />
        <span className="echo-presence__scan" aria-hidden="true" />
        <span className="echo-presence__fracture" aria-hidden="true" />
        <span className="echo-presence__focus" aria-hidden="true" />
      </div>

      {presence.reaction && (
        <div className="echo-presence__reaction" role="status" aria-live="polite">
          <i aria-hidden="true" />
          <span>
            <small>ECHO RESPONSE</small>
            <strong>{presence.reaction.acknowledgement}</strong>
          </span>
        </div>
      )}

      {showTelemetry && (
        <figcaption className="echo-presence__telemetry">
          <span>
            <small>ECHO MIND // A-17</small>
            <strong>{label}</strong>
          </span>
          <span>
            <i data-channel="cyan" />
            {profile.signature.toUpperCase()}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
