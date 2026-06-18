/**
 * App.tsx — نقطة الدخول الرئيسية مع الشريط الجانبي الكامل
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from './stores/gameStore';
import { GameSidebar, type SectionId } from './components/sidebar/GameSidebar';
import { EchoChat } from './components/echo/EchoChat';
import { PuzzleEngine } from './components/puzzle/PuzzleEngine';
import { FlowerSystem } from './components/flower/FlowerSystem';
import { MemorySystem } from './components/memory/MemorySystem';
import './styles/eleven-theme.css';

// الأقسام الـ 10 الكاملة
import { DashboardHome } from './components/sections/DashboardHome';
import { DaySection } from './components/sections/DaySection';
import { WishesSection } from './components/sections/WishesSection';
import { AchievementsSection } from './components/sections/AchievementsSection';
import { NightTransformation } from './components/sections/NightTransformation';
import { OverviewSection } from './components/sections/OverviewSection';
import { EndingPanel } from './components/sections/EndingPanel';
import { TimelineSection } from './components/sections/TimelineSection';
import { NightAlert, CinematicMode } from './components/effects/CinematicMode';
import { useAudioSystem } from './hooks/useAudioSystem';

export default function App() {
  const actions = useGameStore(s => s.actions);
  const time = useGameStore(s => s.time);
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [showCinematic, setShowCinematic] = useState(false);

  // دورة الوقت
  useEffect(() => {
    actions.advanceTime();
    const interval = setInterval(() => actions.advanceTime(), 30000);
    return () => clearInterval(interval);
  }, [actions]);

  // مراقبة 11:11 للوضع السينمائي
  useEffect(() => {
    if (time.phaseIndex >= 3 && !showCinematic) {
      setShowCinematic(true);
      setTimeout(() => setShowCinematic(false), 8000);
    }
  }, [time.phaseIndex, time.hour, time.minute]);

  // النظام الصوتي
  useAudioSystem(time.phase, time.phaseIndex);

  // محتوى الأقسام
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardHome />;
      case 'echo-mind': return <EchoChat />;
      case 'day': return <DaySection />;
      case 'memories': return <MemorySystem />;
      case 'puzzles': return <PuzzleEngine />;
      case 'wishes': return <WishesSection />;
      case 'flowers': return <FlowerSystem />;
      case 'achievements': return <AchievementsSection />;
      case 'night': return <NightTransformation />;
      case 'overview': return <OverviewSection />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div id="app" className="app-root" dir="rtl">
      {showCinematic && <CinematicMode onEnd={() => setShowCinematic(false)} />}
      <NightAlert phaseIndex={time.phaseIndex} phase={time.phase} />
      
      <GameSidebar activeSection={activeSection} onNavigate={setActiveSection} />
      
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-right">
            <h2 className="topbar-brand">
              <span className="brand-11">11.11</span>
              <span className="brand-time">
                {time.isNight ? '🌙' : '☀️'} {time.phase}
                {time.phaseIndex >= 1 && ` ⚠ مرحله ${time.phaseIndex}/3`}
              </span>
            </h2>
          </div>
        </header>

        <div className="content-area">
          {renderSection()}
        </div>

        <footer className="footer">
          <p className="footer-meta">
            11.11 — رحلة عاطفية تفاعلية · {time.dayCycle} يوم
          </p>
        </footer>
      </main>
    </div>
  );
}