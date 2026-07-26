import {
  useRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import {
  MathUtils,
  type Group,
} from 'three';
import type {
  EchoVisualStateRef,
} from '../types/echoAnimation.types';

interface EchoAnimationControllerProps {
  visualStateRef: EchoVisualStateRef;
}

function Limb({
  length,
  radius,
  color,
  emissive,
}: {
  length: number;
  radius: number;
  color: string;
  emissive?: string;
}) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow>
      <capsuleGeometry args={[radius, length - radius * 2, 6, 10]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissive ? 0.38 : 0}
        metalness={0.16}
        roughness={0.7}
      />
    </mesh>
  );
}

/**
 * Procedural animation fallback. Crossfades are represented by damped
 * locomotion/run/interaction weights and no React state is written per frame.
 */
export function EchoAnimationController({
  visualStateRef,
}: EchoAnimationControllerProps) {
  const rootRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftForearmRef = useRef<Group>(null);
  const rightForearmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftShinRef = useRef<Group>(null);
  const rightShinRef = useRef<Group>(null);
  const phaseRef = useRef(0);
  const locomotionBlendRef = useRef(0);
  const runBlendRef = useRef(0);
  const interactionBlendRef = useRef(0);

  useFrame((_, frameDelta) => {
    const visual = visualStateRef.current;
    const root = rootRef.current;
    const torso = torsoRef.current;
    const head = headRef.current;
    if (!root || !torso || !head || visual.frozen) return;

    const delta = Math.min(frameDelta, 0.05);
    const moving = visual.state === 'walk' || visual.state === 'run';
    const running = visual.state === 'run';
    const interacting = visual.state === 'interact';

    locomotionBlendRef.current = MathUtils.damp(
      locomotionBlendRef.current,
      moving ? 1 : 0,
      9,
      delta,
    );
    runBlendRef.current = MathUtils.damp(
      runBlendRef.current,
      running ? 1 : 0,
      8,
      delta,
    );
    interactionBlendRef.current = MathUtils.damp(
      interactionBlendRef.current,
      interacting ? 1 : 0,
      11,
      delta,
    );

    const locomotion = locomotionBlendRef.current;
    const run = runBlendRef.current;
    const interaction = interactionBlendRef.current;
    const cadence = MathUtils.lerp(5.6, 9.4, run);
    phaseRef.current += delta * cadence * Math.max(0.32, visual.speedNormalized);

    const phase = phaseRef.current;
    const stride = Math.sin(phase) * MathUtils.lerp(0.48, 0.78, run)
      * locomotion;
    const oppositeStride = Math.sin(phase + Math.PI)
      * MathUtils.lerp(0.48, 0.78, run) * locomotion;
    const bob = Math.abs(Math.sin(phase * 2))
      * MathUtils.lerp(0.018, 0.045, run) * locomotion;
    const breath = Math.sin(phaseRef.current * 0.24) * 0.012
      * (1 - locomotion * 0.72);

    root.position.y = bob + breath;
    root.rotation.z = MathUtils.damp(
      root.rotation.z,
      visual.turnLean * 0.08,
      10,
      delta,
    );
    torso.rotation.x = MathUtils.damp(
      torso.rotation.x,
      -run * 0.16 - interaction * 0.11,
      9,
      delta,
    );
    torso.rotation.z = Math.sin(phase) * 0.035 * locomotion;

    if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = oppositeStride;
    if (leftShinRef.current) {
      leftShinRef.current.rotation.x = Math.max(0, -stride) * 0.72;
    }
    if (rightShinRef.current) {
      rightShinRef.current.rotation.x = Math.max(0, -oppositeStride) * 0.72;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = oppositeStride * 0.72
        - interaction * 0.28;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = stride * 0.72
        - interaction * 1.02;
      rightArmRef.current.rotation.z = -interaction * 0.16;
    }
    if (leftForearmRef.current) {
      leftForearmRef.current.rotation.x = -0.12 - run * 0.28;
    }
    if (rightForearmRef.current) {
      rightForearmRef.current.rotation.x = -0.12 - run * 0.28
        - interaction * 0.62;
    }

    head.rotation.y = MathUtils.damp(
      head.rotation.y,
      visual.lookYaw,
      interacting ? 12 : 6,
      delta,
    );
    head.rotation.x = MathUtils.damp(
      head.rotation.x,
      interaction * 0.12 + Math.sin(phase * 0.18) * 0.018,
      8,
      delta,
    );
  });

  return (
    <group ref={rootRef} name="echo-procedural-proxy">
      <group ref={torsoRef} position={[0, 1.17, 0]}>
        <mesh castShadow scale={[0.82, 1, 0.52]}>
          <capsuleGeometry args={[0.32, 0.62, 8, 16]} />
          <meshStandardMaterial
            color="#0a1018"
            emissive="#072c37"
            emissiveIntensity={0.36}
            metalness={0.18}
            roughness={0.72}
          />
        </mesh>
        <mesh position={[0, 0.11, 0.285]}>
          <boxGeometry args={[0.035, 0.54, 0.014]} />
          <meshBasicMaterial color="#56e9ff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.075, -0.1, 0.29]}>
          <boxGeometry args={[0.035, 0.25, 0.014]} />
          <meshBasicMaterial color="#56e9ff" toneMapped={false} />
        </mesh>
        <mesh position={[0.075, -0.1, 0.29]}>
          <boxGeometry args={[0.035, 0.25, 0.014]} />
          <meshBasicMaterial color="#56e9ff" toneMapped={false} />
        </mesh>
        <mesh
          position={[0, 0.29, 0.12]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.34, 0.055, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#101b25" roughness={0.8} />
        </mesh>
      </group>

      <group ref={headRef} position={[0, 1.87, 0]}>
        <mesh castShadow scale={[0.88, 1, 0.82]}>
          <sphereGeometry args={[0.27, 18, 14]} />
          <meshStandardMaterial
            color="#9aaab0"
            emissive="#10252c"
            emissiveIntensity={0.2}
            roughness={0.66}
          />
        </mesh>
        <mesh position={[0, 0.11, 0.015]} scale={[0.98, 0.7, 0.9]} castShadow>
          <dodecahedronGeometry args={[0.29, 1]} />
          <meshStandardMaterial color="#020509" roughness={0.8} />
        </mesh>
        {[-0.2, -0.08, 0.06, 0.18].map((x, index) => (
          <mesh
            key={x}
            position={[x, -0.01 + (index % 2) * 0.035, 0.245]}
            rotation={[0.45, 0, x * 1.4]}
            castShadow
          >
            <coneGeometry args={[0.075, 0.28, 5]} />
            <meshStandardMaterial color="#03070b" roughness={0.86} />
          </mesh>
        ))}
        <mesh position={[-0.095, -0.025, 0.248]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#58eaff" toneMapped={false} />
        </mesh>
        <mesh position={[0.095, -0.025, 0.248]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#ff485f" toneMapped={false} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[-0.38, 1.45, 0]}>
        <Limb length={0.56} radius={0.09} color="#111b26" />
        <group ref={leftForearmRef} position={[0, -0.54, 0]}>
          <Limb length={0.52} radius={0.078} color="#0b121a" />
          <mesh position={[0, -0.53, 0]} castShadow>
            <sphereGeometry args={[0.095, 10, 8]} />
            <meshStandardMaterial color="#86999f" roughness={0.74} />
          </mesh>
        </group>
      </group>
      <group ref={rightArmRef} position={[0.38, 1.45, 0]}>
        <Limb length={0.56} radius={0.09} color="#111b26" emissive="#063944" />
        <group ref={rightForearmRef} position={[0, -0.54, 0]}>
          <Limb length={0.52} radius={0.078} color="#0b121a" />
          <mesh position={[0, -0.53, 0]} castShadow>
            <sphereGeometry args={[0.095, 10, 8]} />
            <meshStandardMaterial color="#86999f" roughness={0.74} />
          </mesh>
        </group>
      </group>

      <group ref={leftLegRef} position={[-0.17, 1.15, 0]}>
        <Limb length={0.55} radius={0.115} color="#080e15" />
        <group ref={leftShinRef} position={[0, -0.52, 0]}>
          <Limb length={0.55} radius={0.1} color="#050a10" />
          <mesh position={[0, -0.55, -0.06]} castShadow>
            <boxGeometry args={[0.23, 0.16, 0.38]} />
            <meshStandardMaterial color="#020509" metalness={0.25} />
          </mesh>
        </group>
      </group>
      <group ref={rightLegRef} position={[0.17, 1.15, 0]}>
        <Limb length={0.55} radius={0.115} color="#080e15" />
        <group ref={rightShinRef} position={[0, -0.52, 0]}>
          <Limb length={0.55} radius={0.1} color="#050a10" />
          <mesh position={[0, -0.55, -0.06]} castShadow>
            <boxGeometry args={[0.23, 0.16, 0.38]} />
            <meshStandardMaterial color="#020509" metalness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
