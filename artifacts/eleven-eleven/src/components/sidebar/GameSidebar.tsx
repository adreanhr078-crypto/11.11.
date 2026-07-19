/**
 * GameSidebar.tsx — الشريط الجانبي الكامل (C66)
 * 7 عناصر قائمة + زر الوضع الليلي + ملف المستخدم
 */

import React from 'react';
import { useGameStore, type TimePhase } from '../../stores/gameStore';
import Icon from '../ui/Icon';

const XP_MAX = 3500;
import { motion } from 'framer-motion';

export type SectionId = 'dashboard' | 'echo-mind' | 'day' | 'memories' | 'puzzles' | 'wishes' | 'flowers' | 'achievements' | 'night' | 'overview';

interface Props {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

const NAV_ITEMS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
  { id: 'memories', label: 'شظايا الذاكرة', icon: '🧾' },
  { id: 'echo-mind', label: 'إيكو مايند', icon: '🧠' },
  { id: 'puzzles', label: 'الألغاز', icon: '🧩' },
  { id: 'wishes', label: 'الأمنيات', icon: '⭐' },
  { id: 'overview', label: 'الأرشيف', icon: '📚' },
  { id: 'achievements', label: 'الإنجازات', icon: '🏆' },
  { id: 'day', label: 'الوضع النهاري', icon: '☀️' },
  { id: 'night', label: 'التحول الليلي', icon: '🌙' },
];

export const GameSidebar: React.FC<Props> = ({ activeSection, onNavigate }) => {
  const NavIcon: React.FC<{ id: SectionId }> = ({ id }) => {
    switch (id) {
      case 'dashboard':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 11.5L12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" fill="currentColor" opacity="0.9"/>
          </svg>
        );
      case 'memories':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="3" fill="currentColor" />
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        );
      case 'echo-mind':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a8 8 0 100 16 8 8 0 000-16z" fill="currentColor" opacity="0.95" />
            <path d="M8 12h8" stroke="#fff" strokeWidth="1.2" opacity="0.2" />
          </svg>
        );
      case 'puzzles':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" fill="currentColor" />
            <rect x="14" y="3" width="7" height="7" fill="currentColor" opacity="0.9" />
            <rect x="3" y="14" width="7" height="7" fill="currentColor" opacity="0.9" />
          </svg>
        );
      case 'wishes':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l2.6 5.4L20 9l-4 3.6L17 20l-5-2.6L7 20l1-7.4L4 9l5.4-1.6L12 2z" fill="currentColor" />
          </svg>
        );
      case 'overview':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5c4.97 0 9 3.59 9 8s-4.03 8-9 8-9-3.59-9-8 4.03-8 9-8zm0 2a6 6 0 100 12 6 6 0 000-12z" fill="currentColor" />
          </svg>
        );
      case 'achievements':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="3" fill="currentColor" />
            <path d="M7 21l5-3 5 3V17a5 5 0 00-10 0v4z" fill="currentColor" opacity="0.95" />
          </svg>
        );
      case 'day':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
        );
      case 'night':
        return (
          <svg className="sidebar-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" fill="currentColor" />
          </svg>
        );
      default:
        return <span className="sidebar-nav-icon">•</span>;
    }
  };
  const { echo, solvedPuzzles, totalPuzzles, time, flower, achievements } = useGameStore();
  const [isNightMode, setIsNightMode] = React.useState(false);

  const emoji = echo.corruption > 70 ? '😰' : echo.fear > 70 ? '😨' : echo.trust > 60 ? '😊' : '😐';
  const xpPct = Math.min(100, (echo.xp / XP_MAX) * 100);
  const nightActive = time.phaseIndex >= 1;

  return (
    <aside className="dashboard-sidebar">
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
            <NavIcon id={item.id} />
            <span className="nav-label">{item.label}</span>
            {item.id === 'puzzles' && (
              <span className="nav-badge">{solvedPuzzles}/{totalPuzzles}</span>
            )}
            {item.id === 'night' && nightActive && (
                          <span className="nav-alert"><NavIcon id={'night'} /></span>
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
          <span className="night-toggle-icon"><NavIcon id={nightActive ? 'day' : 'night'} /></span>
          <span>{nightActive ? 'الوضع النهاري نشط' : 'الوضع النهاري'}</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="sidebar-user-card">
        <div className="user-avatar-small"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" fill="currentColor"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.9"/></svg></div>
        <div className="user-info-small">
          <span className="user-name-small">Echo</span>
          <span className="user-level">المستوى {echo.level} · {echo.mood}</span>
          <div className="user-xp-bar">
            <div className="user-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="user-xp-text">{echo.xp} / {XP_MAX} XP</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="sidebar-stats">
        <div className="sidebar-stat">
                  <Icon name="puzzle" className="stat-icon" />
          <span>{solvedPuzzles}</span>
        </div>
        <div className="sidebar-stat">
                  <Icon name="flower" className="stat-icon" />
          <span>{Math.round(flower.growth)}%</span>
        </div>
        <div className="sidebar-stat">
                  <Icon name="progress" className="stat-icon" />
          <span>{achievements.filter(a => a.unlocked).length}</span>
        </div>
        <div className="sidebar-stat">
                  <Icon name="echo" className="stat-icon" />
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