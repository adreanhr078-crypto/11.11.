/**
 * NightDashboard — لوحة النظام الليلي الرئيسية
 * تستند إلى الصور 01, 08, 11, 12, 13
 * تجربة سينمائية مظلمة مع glitch، تشققات، أحمر خافت، وانهيار بصري
 */

import React, { useState } from "react";
import { EchoProfile } from "../echo/EchoProfile";
import { GlassCard, ProgressBar, StatCard } from "../shared/GlassCard";
import { NightGlitchOverlay } from "./NightGlitchOverlay";
import { NightMemoryShards } from "./NightMemoryShards";
import { NightPuzzlePanel } from "./NightPuzzlePanel";
import { NightFlowerGarden } from "./NightFlowerGarden";
import { NightTransformation } from "./NightTransformation";
import type { AppTheme } from "../../themes/appTheme";

// بيانات تجريبية ليلية
const NIGHT_DATA = {
  trustLevel: 38,
  fear: 62,
  loneliness: 80,
  regret: 48,
  hope: 33,
  memory: 71,
  storyProgress: 67,
  flowerProgress: 75,
  instabilityLevel: 1,
  memoriesDiscovered: 28,
  totalMemories: 54,
  puzzlesSolved: 8,
  puzzlesInProgress: 3,
  puzzlesLocked: 5,
  activeWishes: 3,
};

const NIGHT_QUOTES = [
  "الليل لا يرحم… لكنه يكشف.",
  "11:11 ليست مجرد ساعة… بل بوابة إلى قصة لا تُنسى.",
  "ربما لا أستطيع تغيير الماضي… لكنني أستطيع فهمه.",
  "كلما تقدمت في الليل، اقتربت أكثر من الحقيقة.",
  "عندما تتوقف عن مقاومة الليل، يبدأ في كشف ما خانته الذاكرة.",
];

const SIDEBAR_ITEMS = [
  { label: "الرئيسية", icon: "◈", active: true },
  { label: "شظايا الذاكرة", icon: "💠", active: false },
  { label: "Echo Mind", icon: "💬", active: false },
  { label: "الألغاز", icon: "🧩", active: false },
  { label: "الأمنيات", icon: "✨", active: false },
  { label: "الأرشيف", icon: "📁", active: false },
  { label: "الإعدادات", icon: "⚙️", active: false },
];

interface NightDashboardProps {
  theme: AppTheme;
}

export const NightDashboard: React.FC<NightDashboardProps> = ({ theme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentQuote = NIGHT_QUOTES[Math.floor(Math.random() * NIGHT_QUOTES.length)];

  return (
    <div className="night-dashboard" dir="rtl">
      {/* طبقة Glitch فوق كل شيء */}
      <NightGlitchOverlay theme={theme} />

      {/* ─── SIDEBAR ─── */}
      <aside className={`night-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">11.11</h2>
          <span className="sidebar-status">⚠ الوضع الليلي نشط</span>
        </div>

        {/* قائمة التنقل */}
        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button key={item.label} className={`sidebar-item ${item.active ? "sidebar-item-active" : ""}`}>
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* بطاقة Echo مصغرة */}
        <div className="sidebar-echo-card">
          <div className="sidebar-echo-avatar">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="rgba(139,42,42,0.3)" />
              <circle cx="18" cy="16" r="8" fill="#2A1A1A" />
              <circle cx="15" cy="14" r="1" fill="#8B4040" />
              <circle cx="21" cy="14" r="1" fill="#8B4040" />
            </svg>
          </div>
          <div className="sidebar-echo-info">
            <span className="sidebar-echo-name">Echo</span>
            <span className="sidebar-echo-level">المستوى 17</span>
          </div>
          <div className="sidebar-echo-xp">
            <div className="sidebar-xp-track">
              <div className="sidebar-xp-fill" style={{ width: "71%" }} />
            </div>
            <span className="sidebar-xp-value">2480/3500</span>
          </div>
          <button className="sidebar-continue-btn">متابعة</button>
        </div>

        {/* زر طي الـ Sidebar */}
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="night-main" style={{ marginRight: sidebarOpen ? "280px" : "60px" }}>
        
        {/* شريط علوي */}
        <div className="night-topbar">
          <div className="night-topbar-left">
            <span className="night-topbar-title">Echo Mind</span>
            <span className="night-system-status">حالة النظام: {theme.isNight ? "غير مستقر" : "مستقر"}</span>
          </div>
          <div className="night-topbar-right">
            <span className="night-time-badge">{theme.mode === "cinematic_1111" ? "11:11" : theme.mode === "instability_1105" ? "11:05" : "11:00"}</span>
          </div>
        </div>

        {/* Grid الرئيسي */}
        <div className="night-content-grid">
          {/* العمود الأيمن: Echo */}
          <div className="night-col-right">
            <GlassCard title="Echo" glow>
              <EchoProfile
                name="Echo"
                age={17}
                phase="خائف"
                trustLevel={NIGHT_DATA.trustLevel}
                emotionalState="يحاول التذكر في الظلام"
                isNight={true}
                lastMemory="همسات في الظلام... شخص يناديني"
                emotions={[
                  { label: "الخوف", value: NIGHT_DATA.fear, color: "#8B2A2A" },
                  { label: "الوحدة", value: NIGHT_DATA.loneliness, color: "#5A4A8A" },
                  { label: "الندم", value: NIGHT_DATA.regret, color: "#8B6A40" },
                  { label: "الأمل", value: NIGHT_DATA.hope, color: "#4A8B5A" },
                  { label: "الذاكرة", value: NIGHT_DATA.memory, color: "#4A6A8B" },
                ]}
              />
            </GlassCard>

            <GlassCard title="التقدم">
              <ProgressBar label="تقدم القصة" value={NIGHT_DATA.storyProgress} color="#CC4444" />
              <ProgressBar label="استرجاع الذاكرة" value={NIGHT_DATA.memory} color="#4A6A8B" />
              <StatCard label="أيام النشاط" value={11} icon="📅" />
            </GlassCard>
          </div>

          {/* العمود الأوسط: Echo Mind + Transformation */}
          <div className="night-col-center">
            {/* بطاقة Echo الرئيسية في الحقل المظلم */}
            <GlassCard glow className="night-echo-hero">
              <div className="night-echo-hero-content">
                <div className="night-echo-hero-visual">
                  <svg width="160" height="200" viewBox="0 0 160 200">
                    {/* خلفية داكنة */}
                    <rect width="160" height="200" fill="rgba(5,0,0,0.5)" rx="12" />
                    {/* زهور مظلمة */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <circle key={i} cx={20 + i * 30} cy={180} r={4 + i % 3} fill="rgba(139,42,42,0.4)" />
                    ))}
                    {/* شخصية Echo - ظل */}
                    <ellipse cx="80" cy="170" rx="35" ry="25" fill="rgba(0,0,0,0.3)" />
                    <circle cx="80" cy="90" r="30" fill="#1A0A0A" />
                    <circle cx="80" cy="90" r="28" fill="#2A1A1A" />
                    <path d="M 50 90 Q 50 60 80 55 Q 110 60 110 90" fill="#0A0A0A" />
                    {/* عيون حمراء خافتة */}
                    <circle cx="73" cy="85" r="3" fill="rgba(180,40,40,0.6)" />
                    <circle cx="87" cy="85" r="3" fill="rgba(180,40,40,0.6)" />
                    {/* دمعة */}
                    <path d="M 73 90 Q 72 95 73 98" stroke="rgba(180,40,40,0.4)" strokeWidth="1" fill="none" />
                    {/* جزيئات عائمة */}
                    <circle cx="30" cy="60" r="1.5" fill="rgba(245,240,235,0.3)" />
                    <circle cx="130" cy="70" r="1" fill="rgba(245,240,235,0.2)" />
                    <circle cx="40" cy="120" r="1.2" fill="rgba(245,240,235,0.25)" />
                    <circle cx="120" cy="130" r="1.5" fill="rgba(245,240,235,0.2)" />
                  </svg>
                </div>
                <div className="night-echo-hero-text">
                  <h3>Echo — بين الذاكرة والحقيقة</h3>
                  <p>"ربما لا أستطيع تغيير الماضي… لكنني أستطيع فهمه."</p>
                  <div className="night-emotion-rings">
                    {[
                      { label: "الخوف", value: NIGHT_DATA.fear, color: "#CC4444" },
                      { label: "الوحدة", value: NIGHT_DATA.loneliness, color: "#6A5AAA" },
                      { label: "الذاكرة", value: NIGHT_DATA.memory, color: "#5A7AAA" },
                    ].map((emotion) => (
                      <div key={emotion.label} className="emotion-ring-item">
                        <div className="emotion-ring-track">
                          <div className="emotion-ring-fill" style={{
                            width: `${emotion.value}%`,
                            background: emotion.color,
                          }} />
                        </div>
                        <div className="emotion-ring-label">
                          <span>{emotion.label}</span>
                          <span style={{ color: emotion.color }}>{emotion.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="night-echo-btn">فتح Echo Mind</button>
                </div>
              </div>
            </GlassCard>

            {/* مراحل التحول الليلي */}
            <GlassCard title="التحول الليلي" glow>
              <NightTransformation initialStage={
                theme.mode === "cinematic_1111" ? "1111" : 
                theme.mode === "instability_1105" ? "1105" : "1100"
              } />
            </GlassCard>

            {/* اقتباس ليلي */}
            <GlassCard>
              <div className="night-quote-card">
                <p className="night-quote-text">{currentQuote}</p>
              </div>
            </GlassCard>
          </div>

          {/* العمود الأيسر: شظايا + ألغاز + زهور */}
          <div className="night-col-left">
            {/* شظايا الذاكرة */}
            <GlassCard title="شظايا الذاكرة">
              <NightMemoryShards
                discoveredCount={NIGHT_DATA.memoriesDiscovered}
                totalCount={NIGHT_DATA.totalMemories}
              />
            </GlassCard>

            {/* الألغاز الليلية */}
            <GlassCard title="الألغاز">
              <NightPuzzlePanel
                completedCount={NIGHT_DATA.puzzlesSolved}
                inProgressCount={NIGHT_DATA.puzzlesInProgress}
                lockedCount={NIGHT_DATA.puzzlesLocked}
              />
            </GlassCard>

            {/* الزهور الليلية */}
            <GlassCard title="الزهور">
              <NightFlowerGarden
                progress={NIGHT_DATA.flowerProgress}
                instabilityLevel={theme.instabilityLevel}
              />
            </GlassCard>
          </div>
        </div>

        {/* Footer ليلي */}
        <footer className="night-footer">
          <p className="night-footer-text">
            "كل دقيقة تقربني من الحقيقة أو تبعدني عنها."
          </p>
          <p className="night-footer-time">
            11.11 — النظام الليلي · {new Date().toLocaleTimeString("ar-SA")}
          </p>
        </footer>
      </main>
    </div>
  );
};