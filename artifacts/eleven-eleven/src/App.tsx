/**
 * App.tsx — التطبيق الرئيسي 11.11
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from './stores/gameStore';
import { GameSidebar, type SectionId } from './components/sidebar/GameSidebar';
import { EchoChat } from './components/echo/EchoChat';
import { PuzzleEngine } from './components/puzzle/PuzzleEngine';
import { FlowerSystem } from './components/flower/FlowerSystem';
import { MemorySystem } from './components/memory/MemorySystem';
import { DashboardHome } from './components/sections/DashboardHome';
import { DaySection } from './components/sections/DaySection';
import { WishesSection } from './components/sections/WishesSection';
import { AchievementsSection } from './components/sections/AchievementsSection';
import { NightTransformation } from './components/sections/NightTransformation';
import { OverviewSection } from './components/sections/OverviewSection';
import { CinematicMode } from './components/effects/CinematicMode';
import { AnimationSystem } from './components/effects/AnimationSystem';
import { VideoMemorySystem } from './components/video/VideoMemorySystem';
import { toggleLanguage } from './core/echoMultilingualSystem';
import './styles/eleven-theme.css';

const SECTION_META: Record<SectionId, { title: string; subtitle: string }> = {
  dashboard:     { title: 'الرئيسية',          subtitle: 'نظرة عامة على رحلتك مع Echo' },
  'echo-mind':   { title: 'Echo Mind',          subtitle: 'تحدّث مع Echo واستكشف ذاكرته' },
  day:           { title: 'النظام الصباحي',     subtitle: 'تذكّر، تفاهم، وتواصل بهدوء' },
  memories:      { title: 'الذكريات والأحلام', subtitle: 'استرجاع الماضي شظية بشظية' },
  puzzles:       { title: 'الألغاز',            subtitle: 'حل الألغاز لكشف الحقيقة' },
  wishes:        { title: 'الأمنيات',           subtitle: 'أمنياتك توجّه مسار القصة للنمو' },
  flowers:       { title: 'نظام الأزهار',       subtitle: 'تنمو مع كل تقدم، وتتحول مع الليل' },
  achievements:  { title: 'الإنجازات',          subtitle: 'محطات في رحلة استعادة الذاكرة' },
  night:         { title: 'التحول الليلي',      subtitle: 'النظام يتغير عند 11:11' },
  overview:      { title: 'الرؤية الشاملة',    subtitle: 'هذه ليست مجرد لعبة… إنها رحلتك' },
};

export default function App() {
  const actions = useGameStore(s => s.actions);
  const time    = useGameStore(s => s.time);
  const echo    = useGameStore(s => s.echo);
  const world   = useGameStore(s => s.world);

  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [showCinematic, setShowCinematic] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // دورة الوقت
  useEffect(() => {
    actions.advanceTime();
    const iv = setInterval(() => actions.advanceTime(), 30_000);
    return () => clearInterval(iv);
  }, [actions]);

  // وضع الليل التلقائي
  useEffect(() => {
    if (time.phaseIndex >= 1 && !isNightMode) setIsNightMode(true);
    if (time.phaseIndex === 0 && isNightMode)  setIsNightMode(false);
  }, [time.phaseIndex]);

  // تحديث data-mode على <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', isNightMode ? 'night' : 'day');
  }, [isNightMode]);

  // سينمائي 11:11
  useEffect(() => {
    if (time.phaseIndex >= 3 && !showCinematic) {
      setShowCinematic(true);
      const t = setTimeout(() => setShowCinematic(false), 8_000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [time.phaseIndex, time.hour, time.minute]);

  const handleLangToggle = useCallback(() => {
    toggleLanguage();
    setLang(l => l === 'ar' ? 'en' : 'ar');
  }, []);

  const toggleNight = useCallback(() => {
    setIsNightMode(n => {
      const next = !n;
      document.documentElement.setAttribute('data-mode', next ? 'night' : 'day');
      return next;
    });
  }, []);

  const meta = SECTION_META[activeSection];

  const statusLabel =
    time.phaseIndex >= 3 ? 'خطر: 11:11' :
    time.phaseIndex >= 2 ? 'غير مستقر'  :
    time.phaseIndex >= 1 ? 'تحذير'       :
    'مستقر';
  const statusClass =
    time.phaseIndex >= 3 ? 'critical' :
    time.phaseIndex >= 2 ? 'unstable'  :
    time.phaseIndex >= 1 ? 'unstable'  :
    'stable';

  const renderSection = () => {
    const cls = 'page-enter';
    switch (activeSection) {
      case 'dashboard':   return <div className={cls} key="dashboard"><DashboardHome onNavigate={setActiveSection} /></div>;
      case 'echo-mind':   return <div className={cls} key="echo"><EchoChat /></div>;
      case 'day':         return <div className={cls} key="day"><DaySection /></div>;
      case 'memories':    return <div className={cls} key="mem"><MemorySystem /></div>;
      case 'puzzles':     return <div className={cls} key="puzz"><PuzzleEngine /></div>;
      case 'wishes':      return <div className={cls} key="wish"><WishesSection /></div>;
      case 'flowers':     return <div className={cls} key="flow"><FlowerSystem /></div>;
      case 'achievements':return <div className={cls} key="ach"><AchievementsSection /></div>;
      case 'night':       return <div className={cls} key="night"><NightTransformation /></div>;
      case 'overview':    return <div className={cls} key="ov"><OverviewSection /></div>;
      default:            return <div className={cls} key="d"><DashboardHome onNavigate={setActiveSection} /></div>;
    }
  };

  return (
    <div className={`app-root ${isNightMode ? 'night-mode' : ''}`} dir="rtl">
      {/* تأثيرات عالمية */}
      {showCinematic && <CinematicMode onEnd={() => setShowCinematic(false)} />}
      <AnimationSystem />
      <VideoMemorySystem />

      {/* تشويش الليل */}
      {time.phaseIndex >= 2 && (
        <div className="night-glitch-overlay" aria-hidden="true">
          <div className="glitch-line" />
          <div className="glitch-line" />
          <div className="glitch-line" />
        </div>
      )}

      {/* شريط عدم الاستقرار */}
      {time.phaseIndex >= 1 && (
        <div className={`system-instability-bar phase-${time.phaseIndex}`}>
          <span className="sys-badge">SYSTEM INSTABILITY</span>
          <span className="sys-badge">SIGNAL LOST</span>
          {time.phaseIndex >= 2 && <span className="sys-badge">MEMORY CORRUPTION</span>}
          {time.phaseIndex >= 3 && <span className="sys-badge" style={{animation:'blink 0.8s step-end infinite'}}>LINK ACTIVE — Echo</span>}
        </div>
      )}

      {/* الشريط الجانبي */}
      <GameSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isNightMode={isNightMode}
        onToggleNight={toggleNight}
      />

      {/* المحتوى الرئيسي */}
      <main className="app-main" style={{ marginTop: time.phaseIndex >= 1 ? '32px' : 0 }}>
        {/* الشريط العلوي */}
        <header className="app-topbar">
          <div>
            <div className="topbar-section-title">{meta.title}</div>
            <div className="topbar-section-sub">{meta.subtitle}</div>
          </div>

          <div className="topbar-center">
            <div className="topbar-time-badge">
              <span className="topbar-time-icon">{time.isNight ? '🌙' : '☀️'}</span>
              <div>
                <div className="topbar-time-text">
                  {String(time.hour).padStart(2,'0')}:{String(time.minute).padStart(2,'0')}
                </div>
                <div className="topbar-time-sub">{time.phase}</div>
              </div>
            </div>
          </div>

          <div className="topbar-right-cluster">
            <div className="topbar-day-chip">
              <span>📅</span>
              <span>اليوم {time.dayCycle}</span>
            </div>
            <div className={`topbar-status-chip ${statusClass}`}>
              <span>{statusClass === 'stable' ? '✦' : '⚠'}</span>
              <span>{statusLabel}</span>
            </div>
            <button className="topbar-night-btn" onClick={toggleNight} title="تبديل الوضع">
              {isNightMode ? '☀️ نهاري' : '🌙 ليلي'}
            </button>
            <button className="topbar-lang-btn" onClick={handleLangToggle}>
              {lang === 'ar' ? '🇬🇧 EN' : '🇸🇦 AR'}
            </button>
          </div>
        </header>

        {/* منطقة المحتوى */}
        <div className="app-content">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
