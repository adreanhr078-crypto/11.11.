import type { CSSProperties, HTMLAttributes } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEmotionVisualProfile } from '../../features/emotion/useEmotionVisualSystem';
import { ECHO_PRESENTATION_ASSETS } from './visualAssets';
import { cx } from '../design-system';

interface EchoPresenceStyle extends CSSProperties {
  '--echo-portrait': string;
  '--echo-corruption': string;
  '--echo-fear': string;
  '--echo-trust': string;
  '--echo-idle-speed': string;
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
  const profile = useEmotionVisualProfile();
  const style: EchoPresenceStyle = {
    '--echo-portrait': `url("${ECHO_PRESENTATION_ASSETS.portrait}")`,
    '--echo-corruption': String(personality.corruption / 100),
    '--echo-fear': String(personality.fear / 100),
    '--echo-trust': String(personality.trust / 100),
    '--echo-idle-speed': `${Math.max(4.2, 8.5 - profile.intensity * 3.5)}s`,
  };

  return (
    <figure
      className={cx('echo-presence', className)}
      data-variant={variant}
      data-emotion={profile.dominantEmotion ?? 'balanced'}
      data-signature={profile.signature}
      style={style}
      aria-label={`${label}: ${profile.signature}`}
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
          src={ECHO_PRESENTATION_ASSETS.portrait}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
        />
        <img
          className="echo-presence__glitch-layer"
          src={ECHO_PRESENTATION_ASSETS.portrait}
          alt=""
          draggable={false}
          decoding="async"
          loading="lazy"
          aria-hidden="true"
        />
        <span className="echo-presence__grade" aria-hidden="true" />
        <span className="echo-presence__scan" aria-hidden="true" />
        <span className="echo-presence__fracture" aria-hidden="true" />
      </div>

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
