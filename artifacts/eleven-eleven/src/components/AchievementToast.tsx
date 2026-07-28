import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import {
  createAchievementViews,
} from '../domain/achievements/achievementProgression';

interface AchievementToastState {
  visible: boolean;
  achievement: { id: string; name: string; icon: string } | null;
}

export const AchievementToast: React.FC = () => {
  const progress = useGameStore(
    (state) => state.progressionState.achievements,
  );
  const achievements = useMemo(
    () => createAchievementViews(progress),
    [progress],
  );
  const [toast, setToast] = useState<AchievementToastState>({ visible: false, achievement: null });
  const prevUnlockedRef = React.useRef<Set<string>>(new Set());
  const initializedRef = React.useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const currentUnlocked = new Set(
      achievements.filter((achievement) => achievement.unlocked).map(
        (achievement) => achievement.id,
      ),
    );
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevUnlockedRef.current = currentUnlocked;
      return undefined;
    }

    const newlyUnlocked = achievements.filter(a => a.unlocked && a.unlockedAt && !prevUnlockedRef.current.has(a.id));
    if (newlyUnlocked.length > 0) {
      const latest = newlyUnlocked[newlyUnlocked.length - 1];
      setToast({ visible: true, achievement: latest });
      timer = setTimeout(() => setToast({ visible: false, achievement: null }), 3000);
    }

    prevUnlockedRef.current = currentUnlocked;

    return () => { if (timer) clearTimeout(timer); };
  }, [achievements]);

  if (!toast.visible || !toast.achievement) return null;

  return (
    <div className="achievement-toast" style={{
      position: 'fixed',
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10002,
      background: 'rgba(20, 20, 20, 0.95)',
      border: '1px solid rgba(200, 120, 90, 0.5)',
      borderRadius: '8px',
      padding: '0.8rem 1.2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      animation: 'slideDown 0.3s ease-out',
      direction: 'rtl',
      fontFamily: 'inherit'
    }}>
      <span style={{ fontSize: '1.5rem' }}>{toast.achievement.icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(224,220,212,0.6)' }}>إنجاز جديد!</p>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>{toast.achievement.name}</p>
      </div>
    </div>
  );
};

export default AchievementToast;
