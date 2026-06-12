/**
 * DayDashboard — لوحة النظام النهاري الرئيسية
 * تستند إلى الصور 02, 03, 04, 07
 * تجمع كل مكونات النهار في واجهة واحدة هادئة ومضيئة
 */

import React from "react";
import { EchoProfile } from "../echo/EchoProfile";
import { GlassCard, ProgressBar, StatCard } from "../shared/GlassCard";
import { DayMemoryCards } from "./DayMemoryCards";
import { WishBoard } from "./WishBoard";
import { FlowerGarden } from "./FlowerGarden";
import { DayTimeline } from "./DayTimeline";

// البيانات التجريبية
const SAMPLE_DATA = {
  trustLevel: 64,
  memoryClarity: 71,
  stability: 65,
  hope: 33,
  storyProgress: 67,
  flowerProgress: 75,
  memoriesDiscovered: 28,
  totalMemories: 54,
  activeWishes: 3,
  puzzlesSolved: 8,
  totalPuzzles: 16,
  activeDays: 11,
};

const MORNING_QUOTES = [
  "السلام في الصباح… لا يدوم للأبد",
  "كل صباح… فرصة لأن تتذكر، أو تتغير",
  "الصباح هو وقتك للشفاء",
  "النهار يمنحنا وضوحًا… لنفهم، نتذكر، ونتقدم بهدوء",
  "أنت لست وحدك في هذه الرحلة",
];

const currentQuote = MORNING_QUOTES[Math.floor(Math.random() * MORNING_QUOTES.length)];

export const DayDashboard: React.FC = () => {
  return (
    <div className="day-dashboard" dir="rtl">
      {/* ─── HEADER ─── */}
      <header className="day-header">
        <div className="day-header-left">
          <h1 className="day-logo">11.11</h1>
          <span className="day-mode-badge">الوضع الصباحي</span>
        </div>
        <div className="day-header-center">
          <p className="day-quote">{currentQuote}</p>
        </div>
        <div className="day-header-right">
          <span className="day-date">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <span className="day-system-status">✓ النظام مستقر</span>
        </div>
      </header>

      {/* ─── MAIN GRID ─── */}
      <div className="day-main-grid">
        {/* العمود الأيمن: Echo + مؤشرات */}
        <div className="day-column-right">
          {/* بطاقة Echo */}
          <GlassCard title="Echo" glow>
            <EchoProfile
              name="Echo"
              age={17}
              phase="باحث"
              trustLevel={SAMPLE_DATA.trustLevel}
              emotionalState="يحاول التذكر"
              isNight={false}
              lastMemory="صوت امرأة تناديني... كانت دافئة"
            />
          </GlassCard>

          {/* مربع المقاييس */}
          <GlassCard title="المؤشرات النفسية">
            <div className="day-metrics">
              <ProgressBar label="وضوح الذكريات" value={SAMPLE_DATA.memoryClarity} color="#6A8BAA" />
              <ProgressBar label="الاستقرار النفسي" value={SAMPLE_DATA.stability} color="#8BAA6A" />
              <ProgressBar label="الثقة" value={SAMPLE_DATA.trustLevel} color="#AA8B6A" />
              <ProgressBar label="الأمل" value={SAMPLE_DATA.hope} color="#AA6A8B" />
              <ProgressBar label="تقدم القصة" value={SAMPLE_DATA.storyProgress} color="#6AAA8B" />
            </div>
          </GlassCard>

          {/* مربع الإحصائيات السريعة */}
          <GlassCard title="ملخص التقدم">
            <div className="day-stats-grid">
              <StatCard label="أيام النشاط" value={SAMPLE_DATA.activeDays} icon="📅" trend="up" />
              <StatCard label="ذكريات مكتشفة" value={`${SAMPLE_DATA.memoriesDiscovered}/${SAMPLE_DATA.totalMemories}`} icon="💭" trend="up" />
              <StatCard label="ألغاز محلولة" value={`${SAMPLE_DATA.puzzlesSolved}/${SAMPLE_DATA.totalPuzzles}`} icon="🧩" trend="stable" />
              <StatCard label="أمنيات نشطة" value={SAMPLE_DATA.activeWishes} icon="✨" trend="stable" />
            </div>
          </GlassCard>
        </div>

        {/* العمود الأوسط: المحتوى الرئيسي */}
        <div className="day-column-center">
          {/* بطاقة Echo في النهار مع زر المحادثة */}
          <GlassCard glow className="day-echo-card">
            <div className="day-echo-content">
              <div className="day-echo-visual">
                {/* رسم Echo يكتب في دفتر */}
                <svg width="120" height="120" viewBox="0 0 120 120" className="day-echo-svg">
                  {/* الجسم */}
                  <ellipse cx="60" cy="100" rx="30" ry="20" fill="rgba(0,0,0,0.08)" />
                  {/* الرأس */}
                  <circle cx="60" cy="50" r="22" fill="#E8D5C8" />
                  <circle cx="60" cy="50" r="20" fill="#F0E0D0" />
                  {/* الشعر */}
                  <path d="M 38 50 Q 38 28 60 25 Q 82 28 82 50" fill="#1A1A1A" />
                  <path d="M 38 50 Q 36 38 42 34" fill="#1A1A1A" />
                  <path d="M 82 50 Q 84 38 78 34" fill="#1A1A1A" />
                  {/* العينان */}
                  <circle cx="54" cy="48" r="2.5" fill="#4A4A4A" />
                  <circle cx="66" cy="48" r="2.5" fill="#4A4A4A" />
                  {/* الفم */}
                  <path d="M 56 55 Q 60 58 64 55" fill="none" stroke="#6A5050" strokeWidth="1" />
                  {/* المكتب */}
                  <rect x="30" y="85" width="60" height="5" rx="2" fill="rgba(139, 76, 122, 0.15)" />
                  {/* الدفتر */}
                  <rect x="40" y="70" width="40" height="18" rx="2" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                  {/* الكتابة */}
                  <line x1="45" y1="76" x2="68" y2="76" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
                  <line x1="45" y1="80" x2="65" y2="80" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
                  <line x1="45" y1="84" x2="60" y2="84" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                  {/* زهور صغيرة حوله */}
                  <circle cx="85" cy="95" r="4" fill="#F5F0E8" />
                  <circle cx="85" cy="95" r="1.5" fill="#E8D5B7" />
                  <circle cx="35" cy="98" r="3.5" fill="#F5F0E8" />
                  <circle cx="35" cy="98" r="1.2" fill="#E8D5B7" />
                </svg>
              </div>
              <div className="day-echo-text">
                <h3>صباح الخير</h3>
                <p>"كل فكرة تكتبها… خطوة نحو نفسك الحقيقية."</p>
                <button className="day-talk-btn">تحدث مع Echo</button>
              </div>
            </div>
          </GlassCard>

          {/* الذاكرة اليومية — اليوم */}
          <GlassCard title="ذاكرة اليوم" glow>
            <div className="day-memory-today">
              <div className="memory-day-badge">اليوم الثالث</div>
              <h4 className="memory-day-title">صوت من الماضي</h4>
              <p className="memory-day-desc">
                سمعت صوتاً يناديني من بعيد... كان دافئاً، لكنه حزين.
                أحاول أن أتذكر لمن ينتمي هذا الصوت.
              </p>
              <div className="memory-day-people">
                <span className="memory-person">👤 لينا</span>
                <span className="memory-person">👤 كينجا</span>
              </div>
            </div>
          </GlassCard>

          {/* اقتباس صباحي */}
          <GlassCard className="day-quote-card">
            <p className="morning-quote-text">
              "كل ذكرى عائدة… تقرّبني من نفسي."
            </p>
            <p className="morning-quote-author">— Echo</p>
          </GlassCard>
        </div>

        {/* العمود الأيسر: الذكريات + الأمنيات + الزهور */}
        <div className="day-column-left">
          {/* نظام الزهور */}
          <GlassCard>
            <FlowerGarden progress={SAMPLE_DATA.flowerProgress} isNight={false} />
          </GlassCard>

          {/* الذكريات اليومية (مختصرة) */}
          <GlassCard title="الذكريات">
            <DayMemoryCards
              discoveredCount={SAMPLE_DATA.memoriesDiscovered}
              totalCount={SAMPLE_DATA.totalMemories}
            />
          </GlassCard>

          {/* الأمنيات */}
          <GlassCard title="الأمنيات">
            <WishBoard
              totalProgress={37}
              activeCount={SAMPLE_DATA.activeWishes}
            />
          </GlassCard>
        </div>
      </div>

      {/* ─── TIMELINE ─── */}
      <div className="day-timeline-section">
        <GlassCard>
          <DayTimeline />
        </GlassCard>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="day-footer">
        <p className="day-footer-text">
          11.11 — رحلة عاطفية تفاعلية تتغير مع الوقت
        </p>
        <p className="day-footer-time">
          آخر تحديث: {new Date().toLocaleTimeString("ar-SA")}
        </p>
      </footer>
    </div>
  );
};