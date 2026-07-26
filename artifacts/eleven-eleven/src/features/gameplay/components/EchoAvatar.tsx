import {
  useRef,
  type MutableRefObject,
} from 'react';
import { Clone, Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';

const configuredModelUrl = import.meta.env.VITE_ECHO_MODEL_URL?.trim();

export const ECHO_MODEL_CONFIG = Object.freeze({
  modelUrl: configuredModelUrl || null,
  scale: 1,
  yOffset: 0,
});

interface EchoAvatarProps {
  movingRef: MutableRefObject<boolean>;
}

function EchoGlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  return (
    <group
      scale={ECHO_MODEL_CONFIG.scale}
      position={[0, ECHO_MODEL_CONFIG.yOffset, 0]}
    >
      <Clone object={scene} />
    </group>
  );
}

function EchoPlaceholder({
  movingRef,
}: EchoAvatarProps) {
  const rootRef = useRef<Group>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;

    const moving = movingRef.current;
    const phase = clock.elapsedTime * (moving ? 8 : 1.5);
    const swing = moving ? Math.sin(phase) * 0.42 : 0;
    root.position.y = moving
      ? Math.abs(Math.sin(phase)) * 0.025
      : Math.sin(phase) * 0.012;

    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  return (
    <group ref={rootRef}>
      <Html
        center
        position={[0, 2.35, 0]}
        className="gameplay-echo-prototype-label"
        distanceFactor={8}
      >
        ECHO // PROTOTYPE RIG
      </Html>

      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.28, 18, 18]} />
        <meshStandardMaterial
          color="#d9fbff"
          emissive="#51eaff"
          emissiveIntensity={0.32}
          roughness={0.42}
        />
      </mesh>

      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.68, 8, 16]} />
        <meshStandardMaterial
          color="#101a24"
          emissive="#087f92"
          emissiveIntensity={0.22}
          metalness={0.2}
          roughness={0.68}
        />
      </mesh>

      <mesh
        ref={leftArmRef}
        position={[-0.39, 1.2, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.095, 0.55, 6, 10]} />
        <meshStandardMaterial color="#172633" roughness={0.7} />
      </mesh>
      <mesh
        ref={rightArmRef}
        position={[0.39, 1.2, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.095, 0.55, 6, 10]} />
        <meshStandardMaterial color="#172633" roughness={0.7} />
      </mesh>

      <mesh
        ref={leftLegRef}
        position={[-0.16, 0.45, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.115, 0.65, 6, 10]} />
        <meshStandardMaterial color="#0a1119" roughness={0.8} />
      </mesh>
      <mesh
        ref={rightLegRef}
        position={[0.16, 0.45, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.115, 0.65, 6, 10]} />
        <meshStandardMaterial color="#0a1119" roughness={0.8} />
      </mesh>

      <mesh position={[0, 1.82, -0.2]}>
        <ringGeometry args={[0.34, 0.37, 32]} />
        <meshBasicMaterial
          color="#54eaff"
          transparent
          opacity={0.52}
        />
      </mesh>
    </group>
  );
}

export function EchoAvatar(props: EchoAvatarProps) {
  if (ECHO_MODEL_CONFIG.modelUrl) {
    return <EchoGlbModel url={ECHO_MODEL_CONFIG.modelUrl} />;
  }
  return <EchoPlaceholder {...props} />;
}
