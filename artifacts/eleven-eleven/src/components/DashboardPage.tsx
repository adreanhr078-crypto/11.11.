/**
 * DashboardPage.tsx — لوحة التحكم الرئيسية
 * تجمع كل الأنظمة: Echo، الألغاز، الأزهار، الذاكرة، الوقت
 * كل عنصر = نظام وظيفي حقيقي
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { EchoChat } from './echo/EchoChat';
import { PuzzleEngine } from './puzzle/PuzzleEngine';
import { FlowerSystem } from './flower/FlowerSystem';
import { MemorySystem } from './memory/MemorySystem';
import { motion, AnimatePresence } from 'framer-motion';

type Section = 'dashboard' | 'echo' | 'puzzles' | 'flowers' | 'memory' | 'entities';

export const DashboardPage: React.FC = () => {
  const { echo, time, world, solvedPuzzles, totalPuzzles, entities, flower, memory, player, achievements } = useGameStore();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      // advanceTime موجود في gameStore
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
    { id: 'echo', label: 'Echo Mind', icon: '🧠' },
    { id: 'puzzles', label: 'الألغاز', icon: '🧩' },
    { id: 'flowers', label: 'الأزهار', icon: '🌸' },
    { id: 'memory', label: 'الذاكرة', icon: '💠' },
    { id: 'entities', label: 'الكيانات', icon: '👁️' },
  ];

  const sections: Record<Section, React.ReactNode> = {
    dashboard: <DashboardHome />,
    echo: <EchoChat />,
    puzzles: <PuzzleEngine />,
    flowers: <FlowerSystem />,
    memory: <MemorySystem />,
    entities: <EntitiesPanel />,
  };

  return (
    <div className="dashboard-full">
      {/* الشريط العلوي */}
      <header className="dashboard-topbar">
        <div className="topbar-right">
          <h2 className="topbar-brand">
            <span className="brand-11">11.11</span>
            <span className="brand-time">{time.isNight ? '🌙' : '☀️'} {time.phase}</span>
          </h2>
        </div>
        <div className="topbar-center">
          <span className="topbar-mood-display">
            Echo: {echo.mood} {echo.corruption > 50 ? '⚠' : ''}
          </span>
        </div>
        <div className="topbar-left">
          <div className="topbar-stats">
            <span>🧩 {solvedPuzzles}/{totalPuzzles}</span>
            <span>🌸 {Math.round(flower.growth)}%</span>
            <span>🧠 {echo.trust}%</span>
          </div>
          <span className="topbar-glitch" style={{ opacity: world.glitchLevel > 50 ? 1 : 0 }}>
            ⚡ {Math.round(world.glitchLevel)}%
          </span>
        </div>
      </header>

      {/* التنقل */}
      <nav className="dashboard-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="nav-btn-icon">{item.icon}</span>
            <span className="nav-btn-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* المحتوى */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="dashboard-content"
        >
          {sections[activeSection]}
        </motion.main>
      </AnimatePresence>

      {/* تحذير الليل */}
      {time.phaseIndex >= 1 && (
        <div className="night-warning-bar" style={{
          background: time.phaseIndex >= 3 ? 'rgba(200,30,30,0.2)' : 'rgba(200,100,50,0.1)',
          borderColor: time.phaseIndex >= 3 ? 'rgba(200,50,50,0.4)' : 'rgba(200,100,50,0.2)',
        }}>
          <span className="night-warning-icon">
            {time.phaseIndex === 1 ? '🌙' : time.phaseIndex === 2 ? '🔴' : '🔥'}
          </span>
          <span>
            {time.phase === '11:00' && '11:00 PM — بداية عدم الاستقرار'}
            {time.phase === '11:05' && '11:05 PM — تزايد التشويش'}
            {time.phase === '11:11' && '🔥 11:11 PM — التحول السينمائي الكامل'}
          </span>
        </div>
      )}
    </div>
  );
};

/** القسم الرئيسي */
const DashboardHome: React.FC = () => {
  const { echo, time, world, solvedPuzzles, totalPuzzles, flower, memory, entities } = useGameStore();

  return (
    <div className="dashboard-home-grid">
      {/* Echo Status */}
      <div className="dashboard-card echo-status-card">
        <h4>🧠 Echo</h4>
        <div className="echo-mood-big">{echo.mood}</div>
        <div className="echo-bars">
          <Bar label="ثقة" value={echo.trust} color="#c8785a" />
          <Bar label="خوف" value={echo.fear} color="#cc6644" />
          <Bar label="ذاكرة" value={echo.memoryStability} color="#5A8AAA" />
          <Bar label="أمل" value={echo.hope} color="#4CAF50" />
        </div>
      </div>

      {/* Puzzles */}
      <div className="dashboard-card puzzles-status-card">
        <h4>🧩 الألغاز</h4>
        <div className="big-number">{solvedPuzzles}</div>
        <Bar label={`من ${totalPuzzles}`} value={(solvedPuzzles / totalPuzzles) * 100} color="#c8785a" />
        <div className="entity-mini-grid">
          {(Object.entries(entities) as any[]).map(([id, ent]) => (
            <div key={id} className="entity-mini">
              <span>{ent.glyph}</span>
              <span>{ent.puzzlesSolved}/{ent.totalPuzzles}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flower */}
      <div className="dashboard-card flower-status-card">
        <h4>🌸 الأزهار</h4>
        <div className="flower-icon-big">{['🌱','🌿','🌷','🌸','🌺'][['seed','sprout','bloom','flourish','completed'].indexOf(flower.stage)] || '🌱'}</div>
        <Bar label={flower.stage} value={flower.growth} color="#4CAF50" />
      </div>

      {/* Time & World */}
      <div className="dashboard-card time-status-card">
        <h4>⏰ الوقت</h4>
        <div className="time-phase-big">{time.isNight ? '🌙' : '☀️'} {time.phase}</div>
        <Bar label="استقرار" value={world.stability} color={world.stability < 40 ? '#f44336' : '#2196F3'} />
        <Bar label="تشويش" value={world.glitchLevel} color="#FF9800" />
      </div>
    </div>
  );
};

const Bar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="mini-bar-container">
    <div className="mini-bar-label">
      <span>{label}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="mini-bar-track">
      <div className="mini-bar-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  </div>
);

/** لوحة الكيانات */
const EntitiesPanel: React.FC = () => {
  const { entities } = useGameStore();

  return (
    <div className="entities-panel">
      {(Object.entries(entities) as [string, typeof entities.echo][]).map(([id, ent]) => (
        <div key={id} className={`entity-card ${ent.unlocked ? 'unlocked' : 'locked'} ${ent.completed ? 'completed' : ''}`}>
          <div className="entity-card-header">
            <span className="entity-card-glyph">{ent.glyph}</span>
            <h3>{ent.name}</h3>
            {!ent.unlocked && <span className="entity-lock-icon">🔒</span>}
          </div>
          <div className="entity-card-body">
            <Bar label="تقدم" value={(ent.puzzlesSolved / ent.totalPuzzles) * 100} color="#c8785a" />
            <p className="entity-card-stats">
              {ent.puzzlesSolved}/{ent.totalPuzzles} ألغاز
              {ent.completed ? ' ✅ مكتمل' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;