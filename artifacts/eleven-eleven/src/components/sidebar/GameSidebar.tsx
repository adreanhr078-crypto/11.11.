/**
 * GameSidebar.tsx — الشريط الجانبي الكامل
 */

import React from 'react';
import { useGameStore } from '../../stores/gameStore';

const XP_MAX = 3500;

export type SectionId =
  | 'dashboard' | 'echo-mind' | 'day' | 'memories' | 'puzzles'
  | 'wishes' | 'flowers' | 'achievements' | 'night' | 'overview';

interface Props {
  activeSection: SectionId;
  onNavigate: (s: SectionId) => void;
  isNightMode: boolean;
  onToggleNight: () => void;
}

const NAV: { id: SectionId; label: string; icon: string; sub?: string }[] = [
  { id: 'dashboard',    label: 'الرئيسية',       icon: '⊹',  sub: 'لوحة التحكم' },
  { id: 'echo-mind',   label: 'Echo Mind',       icon: '◈',  sub: 'عقل الصدى' },
  { id: 'day',         label: 'النهار',          icon: '◐',  sub: 'النظام الصباحي' },
  { id: 'memories',    label: 'الذكريات',        icon: '◫',  sub: 'أحلام وشظايا' },
  { id: 'puzzles',     label: 'الألغاز',         icon: '⬡',  sub: 'استعادة الحقيقة' },
  { id: 'wishes',      label: 'الأمنيات',        icon: '✦',  sub: 'ما تريده يحدث' },
  { id: 'flowers',     label: 'الأزهار',         icon: '❋',  sub: 'نمو وتحول' },
  { id: 'achievements',label: 'الإنجازات',       icon: '◉',  sub: 'محطات الرحلة' },
  { id: 'night',       label: 'الليل',           icon: '◑',  sub: 'التحول 11:11' },
  { id: 'overview',    label: 'الرؤية',          icon: '⊛',  sub: 'الصورة الكاملة' },
];

export const GameSidebar: React.FC<Props> = ({ activeSection, onNavigate, isNightMode, onToggleNight }) => {
  const { echo, solvedPuzzles, totalPuzzles, flower, achievements, time } = useGameStore();

  const xpPct = Math.min(100, (echo.xp / XP_MAX) * 100);
  const nightActive = time.phaseIndex >= 1;
  const moodEmoji =
    echo.corruption > 70 ? '🌑' :
    echo.fear > 70       ? '🌘' :
    echo.trust > 60      ? '🌕' : '🌗';

  return (
    <aside className="app-sidebar">
      {/* الشعار */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">11.11</div>
        <div className="sidebar-logo-sub">رحلة الذاكرة</div>
        <div className="sidebar-logo-tag">كل قصة تقرب من الحقيقة…</div>
      </div>

      {/* القائمة */}
      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item${activeSection === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.sub}
          >
            <span className="nav-icon" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
            {item.id === 'puzzles' && (
              <span className="nav-badge">{solvedPuzzles}</span>
            )}
            {item.id === 'night' && nightActive && (
              <span className="nav-dot" />
            )}
          </button>
        ))}
      </nav>

      {/* الجزء السفلي */}
      <div className="sidebar-bottom">
        {/* معلومات المستخدم */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{moodEmoji}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Echo · الصدى</div>
            <div className="sidebar-user-level">المستوى {echo.level} · {echo.mood}</div>
            <div className="sidebar-xp-bar">
              <div className="sidebar-xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="sidebar-stats-row">
          <div className="sidebar-stat-chip">
            <span>⬡</span>
            <span>{solvedPuzzles}</span>
          </div>
          <div className="sidebar-stat-chip">
            <span>❋</span>
            <span>{Math.round(flower.growth)}%</span>
          </div>
          <div className="sidebar-stat-chip">
            <span>◉</span>
            <span>{achievements.filter(a => a.unlocked).length}</span>
          </div>
          <div className="sidebar-stat-chip">
            <span>◈</span>
            <span>{echo.trust}%</span>
          </div>
        </div>

        {/* زر الوضع */}
        <button className="sidebar-continue-btn" onClick={onToggleNight}>
          {isNightMode ? '☀️ الوضع النهاري' : '🌙 الوضع الليلي'}
        </button>
      </div>
    </aside>
  );
};

export default GameSidebar;
