import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  open: 4000,
  echo: 4500,
  entities: 4500,
  puzzles: 4000,
  close: 4500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  echo: Scene2,
  entities: Scene3,
  puzzles: Scene4,
  close: Scene5,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // Audio ref and time-synced playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Persistent Background Video Layer */}
      <div className="absolute inset-0 opacity-40">
        <video
          src={`${import.meta.env.BASE_URL}videos/particles.mp4`}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Clock Video Background - Only visible in Scene 1 & 5 */}
      <motion.div
        className="absolute inset-0 opacity-30 mix-blend-lighten"
        animate={{ opacity: (sceneIndex === 0 || sceneIndex === 4) ? 0.4 : 0 }}
        transition={{ duration: 1.5 }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/clock.mp4`}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Persistent Animated Glitch Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
          backgroundSize: '100% 4px',
        }}
        animate={{
          y: ['0%', '-10%', '5%', '0%'],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Persistent Accent Line */}
      <motion.div
        className="absolute h-[2px] bg-primary/70 z-20"
        animate={{
          left: ['0%', '10%', '0%', '20%', '0%'][sceneIndex],
          width: ['100%', '30%', '100%', '60%', '100%'][sceneIndex],
          top: ['50%', '80%', '20%', '90%', '50%'][sceneIndex],
          opacity: sceneIndex === 0 || sceneIndex === 4 ? 0 : 0.5,
        }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
