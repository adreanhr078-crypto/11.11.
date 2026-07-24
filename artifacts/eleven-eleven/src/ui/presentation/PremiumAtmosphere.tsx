import type { CSSProperties } from 'react';
import { useEmotionVisualProfile } from '../../features/emotion/useEmotionVisualSystem';

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: (index * 37 + 11) % 97,
  y: (index * 53 + 7) % 91,
  delay: (index % 7) * -0.7,
  duration: 5.5 + (index % 5) * 1.15,
}));

const STREAMS = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  x: 8 + index * 17,
  delay: index * -1.4,
}));

export function PremiumAtmosphere() {
  const profile = useEmotionVisualProfile();

  return (
    <div
      className="premium-atmosphere"
      data-emotion={profile.dominantEmotion ?? 'balanced'}
      data-signature={profile.signature}
      aria-hidden="true"
    >
      <span className="premium-atmosphere__nebula" />
      <span className="premium-atmosphere__grid" />
      <span className="premium-atmosphere__vignette" />
      <div className="premium-atmosphere__particles">
        {PARTICLES.map((particle) => (
          <i
            key={particle.id}
            style={{
              '--particle-x': `${particle.x}%`,
              '--particle-y': `${particle.y}%`,
              '--particle-delay': `${particle.delay}s`,
              '--particle-duration': `${particle.duration}s`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="premium-atmosphere__streams">
        {STREAMS.map((stream) => (
          <i
            key={stream.id}
            style={{
              '--stream-x': `${stream.x}%`,
              '--stream-delay': `${stream.delay}s`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
