import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  MathUtils,
  Vector3,
  type Group,
} from 'three';

export interface ThirdPersonCameraConfig {
  distance: number;
  height: number;
  lookHeight: number;
  followSmoothing: number;
  pointerSensitivity: number;
  minPitch: number;
  maxPitch: number;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    minY: number;
    maxY: number;
  };
}

interface ThirdPersonCameraProps {
  targetRef: MutableRefObject<Group | null>;
  yawRef: MutableRefObject<number>;
  enabled: boolean;
  config: ThirdPersonCameraConfig;
}

export function ThirdPersonCamera({
  targetRef,
  yawRef,
  enabled,
  config,
}: ThirdPersonCameraProps) {
  const { camera, gl } = useThree();
  const pitchRef = useRef(0.12);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    x: number;
    y: number;
  }>({
    active: false,
    pointerId: -1,
    x: 0,
    y: 0,
  });
  const targetPosition = useMemo(() => new Vector3(), []);
  const desiredPosition = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const element = gl.domElement;

    const handlePointerDown = (event: PointerEvent) => {
      if (!enabled || event.button !== 0) return;
      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      element.setPointerCapture(event.pointerId);
      element.classList.add('is-camera-dragging');
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!enabled || !drag.active || drag.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      yawRef.current -= deltaX * config.pointerSensitivity;
      pitchRef.current = MathUtils.clamp(
        pitchRef.current + deltaY * config.pointerSensitivity,
        config.minPitch,
        config.maxPitch,
      );
    };

    const releasePointer = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;
      drag.active = false;
      element.classList.remove('is-camera-dragging');
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', releasePointer);
    element.addEventListener('pointercancel', releasePointer);

    return () => {
      element.classList.remove('is-camera-dragging');
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', releasePointer);
      element.removeEventListener('pointercancel', releasePointer);
    };
  }, [
    config.maxPitch,
    config.minPitch,
    config.pointerSensitivity,
    enabled,
    gl,
    yawRef,
  ]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const target = targetRef.current;
    if (!target) return;

    target.getWorldPosition(targetPosition);
    const yaw = yawRef.current;
    const distance = config.distance;
    const pitchHeight = pitchRef.current * distance;

    desiredPosition.set(
      targetPosition.x + Math.sin(yaw) * distance,
      targetPosition.y + config.height + pitchHeight,
      targetPosition.z + Math.cos(yaw) * distance,
    );
    desiredPosition.set(
      MathUtils.clamp(
        desiredPosition.x,
        config.bounds.minX,
        config.bounds.maxX,
      ),
      MathUtils.clamp(
        desiredPosition.y,
        config.bounds.minY,
        config.bounds.maxY,
      ),
      MathUtils.clamp(
        desiredPosition.z,
        config.bounds.minZ,
        config.bounds.maxZ,
      ),
    );

    const followAlpha = 1 - Math.exp(-config.followSmoothing * delta);
    camera.position.lerp(desiredPosition, followAlpha);
    lookTarget.set(
      targetPosition.x,
      targetPosition.y + config.lookHeight,
      targetPosition.z,
    );
    camera.lookAt(lookTarget);
  });

  return null;
}
