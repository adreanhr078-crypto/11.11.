/**
 * GameSidebar.tsx — الشريط الجانبي الكامل (C66)
 * 7 عناصر قائمة + زر الوضع الليلي + ملف المستخدم
 */

import React from 'react';
import { useGameStore, type TimePhase } from '../../stores/gameStore';
import { motion } from 'framer-motion';

export type SectionId = 'dashboard' | 'echo-mind' | 'day' | 'memories' | 'puzzles' | 'wishes' | 'flowers' | 'achievements' | 'night' | 'overview';

interface Props {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

const NAV_ITEMS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
  { id: 'echo-mind', label: 'Echo Mind', icon: '🧠' },
  { id: 'day', label: 'النظام الصباحي', icon: '☀️' },
  { id: 'memories', label: 'الذكريات والأحلام', icon: '💠' },
  { id: 'puzzles', label: 'الألغاز', icon: '🧩' },
  { id: 'wishes', label: 'الأمنيات', icon: '⭐' },
  { id: 'flowers', label: 'نظام الأزهار', icon: '🌸' },
  { id: 'achievements', label: 'الإنجازات', icon: '🏆' },
  { id: 'night', label: 'التحول الليلي', icon: '🌙' },
  { id: 'overview', label: 'الروية الشاملة', icon: '👁️' },
];

export const GameSidebar: React.FC<Props> = ({ activeSection, onNavigate }) => {
  const { echo, solvedPuzzles, totalPuzzles, time, flower, achievements } = useGameStore();
  const [isNightMode, setIsNightMode] = React.useState(false);

  const emoji = echo.corruption > 70 ? '😰' : echo.fear > 70 ? '😨' : echo.trust > 60 ? '😊' : '😐';
  const xpPct = Math.min(100, (echo.xp / 3500) * 100);
  const nightActive = time.phaseIndex >= 1;

  return (
    <aside className="game-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h2>11:11</h2>
        <div className="brand-subtitle">المشروع</div>
        <div className="brand-tagline">كل قصة تقرب من الحقيقة... أو تبعد عنها.</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'puzzles' && (
              <span className="nav-badge">{solvedPuzzles}/{totalPuzzles}</span>
            )}
            {item.id === 'night' && nightActive && (
              <span className="nav-alert">🌙</span>
            )}
          </button>
        ))}
      </nav>

      {/* Night Toggle */}
      <div className="sidebar-night-toggle">
        <button
          className={`night-toggle-btn ${nightActive ? 'active' : ''}`}
          onClick={() => {
            setIsNightMode(!isNightMode);
            document.getElementById('app')?.classList.toggle('night-active');
          }}
        >
          <span>{nightActive ? '🔥' : '🌙'}</span>
          <span>{nightActive ? 'التحول الليلي نشط' : 'الوضع الليلي'}</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="sidebar-user-card">
        <div className="user-avatar">{emoji}</div>
        <div className="user-info">
          <span className="user-name">Echo</span>
          <span className="user-level">المستوى {echo.level} · {echo.mood}</span>
          <div className="user-xp-bar">
            <div className="user-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="user-xp-text">{echo.xp} / 3500 XP</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="sidebar-stats">
        <div className="sidebar-stat">
          <span>🧩</span>
          <span>{solvedPuzzles}</span>
        </div>
        <div className="sidebar-stat">
          <span>🌸</span>
          <span>{Math.round(flower.growth)}%</span>
        </div>
        <div className="sidebar-stat">
          <span>🏆</span>
          <span>{achievements.filter(a => a.unlocked).length}</span>
        </div>
        <div className="sidebar-stat">
          <span>🧠</span>
          <span>{echo.trust}%</span>
        </div>
      </div>

      {/* Continue Button */}
      <div className="sidebar-continue">
        <button className="continue-btn" onClick={() => onNavigate('echo-mind')}>
          متابعة ▶
        </button>
      </div>
    </aside>
  );
};

export default GameSidebar;