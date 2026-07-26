import {
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react';
import {
  useFrame,
  useThree,
} from '@react-three/fiber';
import {
  MathUtils,
  Vector3,
  type Group,
} from 'three';

interface OpeningCinematicProps {
  targetRef: MutableRefObject<Group | null>;
  active: boolean;
  paused: boolean;
  reducedMotion: boolean;
  onComplete: () => void;
}

export function OpeningCinematic({
  targetRef,
  active,
  paused,
  reducedMotion,
  onComplete,
}: OpeningCinematicProps) {
  const { camera } = useThree();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const start = useMemo(() => new Vector3(-3.65, 1.65, 2.35), []);
  const midpoint = useMemo(() => new Vector3(2.8, 2.25, 2.25), []);
  const end = useMemo(() => new Vector3(), []);
  const desired = useMemo(() => new Vector3(), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);

  useFrame((_, frameDelta) => {
    if (!active || paused || completedRef.current) return;
    const target = targetRef.current;
    if (!target) return;

    const duration = reducedMotion ? 1.35 : 4.6;
    elapsedRef.current += Math.min(frameDelta, 0.05);
    const progress = MathUtils.clamp(elapsedRef.current / duration, 0, 1);

    target.getWorldPosition(targetPosition);
    end.set(
      targetPosition.x,
      targetPosition.y + 2.34,
      targetPosition.z + 2.45,
    );

    if (reducedMotion) {
      desired.lerpVectors(start, end, MathUtils.smoothstep(progress, 0, 1));
    } else if (progress < 0.48) {
      desired.lerpVectors(
        start,
        midpoint,
        MathUtils.smootherstep(progress / 0.48, 0, 1),
      );
    } else {
      desired.lerpVectors(
        midpoint,
        end,
        MathUtils.smootherstep((progress - 0.48) / 0.52, 0, 1),
      );
    }

    camera.position.copy(desired);
    lookTarget.set(
      targetPosition.x,
      targetPosition.y + 0.72,
      targetPosition.z - MathUtils.lerp(0.6, 0, progress),
    );
    camera.lookAt(lookTarget);

    if (progress >= 1) {
      completedRef.current = true;
      onComplete();
    }
  });

  return null;
}

export function OpeningCinematicOverlay({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  if (!active) return null;

  return (
    <div
      className={[
        'opening-cinematic-overlay',
        reducedMotion ? 'is-reduced' : '',
      ].filter(Boolean).join(' ')}
      aria-live="polite"
    >
      <span className="opening-cinematic-overlay__blackout" />
      <div className="opening-cinematic-overlay__copy">
        <small>CONSCIOUSNESS LINK // 01</small>
        <strong>11:11</strong>
        <span>استعادة قناة الإدراك…</span>
      </div>
      <i className="opening-cinematic-overlay__scan" />
    </div>
  );
}
