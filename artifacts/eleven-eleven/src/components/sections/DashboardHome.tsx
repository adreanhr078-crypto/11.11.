/**
 * DashboardHome.tsx — لوحة التحكم الرئيسية
 * تصميم مطابق للصور: Echo Mind بطل + شبكة أنظمة
 */

import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { SectionId } from '../sidebar/GameSidebar';

interface Props {
  onNavigate?: (s: SectionId) => void;
}

const StatRow: React.FC<{ icon: string; label: string; val: number; color: string }> = ({ icon, label, val, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
    <span style={{ fontSize: '0.75rem' }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
        <span>{label}</span><span>{Math.round(Math.min(100,Math.max(0,val)))}%</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100,Math.max(0,val))}%`, background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  </div>
);

const FLOWER_ICONS = ['🌱','🌿','🌷','🌸','🌺'];
const FLOWER_STAGES = ['seed','sprout','bloom','flourish','completed'];
const FLOWER_LABELS = ['بداية','نمو','ازدهار','اكتمال','تحقق'];

export const DashboardHome: React.FC<Props> = ({ onNavigate }) => {
  const {
    echo, solvedPuzzles, totalPuzzles, flower, memory,
    world, time, entities, achievements, wishes, puzzles,
  } = useGameStore();

  const [highlightedStat, setHighlightedStat] = useState<string | null>(null);

  const flowerIdx   = FLOWER_STAGES.indexOf(flower.stage);
  const flowerIcon  = FLOWER_ICONS[flowerIdx] || '🌱';
  const overallPct  = Math.round((solvedPuzzles / Math.max(1, totalPuzzles)) * 100);
  const nightActive = time.phaseIndex >= 1;

  const echoQuote =
    echo.trust > 70  ? 'أبدأ أتذكّر… كل لغز يعيد لي قطعة.'        :
    echo.fear  > 60  ? 'الظلام يضيق… لكنك لا تزال هنا.'            :
    echo.hope  > 50  ? 'ثمة شيء يتضح في الأفق… استمر.'             :
                       'الذاكرة ضبابية… لكنك هنا. هذا يكفي الآن.';

  const dayPuzzles = puzzles.filter((p: any) => ['echo','watcher'].includes(p.entity)).slice(0, 3);

  return (
    <div className="dashboard-home">
      {/* ── البطل: Echo Mind ── */}
      <div className="echo-hero-card">
        <div className={`echo-hero-bg ${nightActive ? 'echo-hero-gradient-night' : 'echo-hero-gradient-day'}`} />

        {/* زهور خلفية */}
        <div className="echo-hero-flowers" aria-hidden="true">
          {['🌸','🌺','✿','🌼','❋'].map((f, i) => (
            <div key={i} className="echo-hero-flower" style={{
              top:  `${10 + i * 18}%`,
              left: `${5 + i * 20}%`,
              animationDelay: `${i * 1.2}s`,
              fontSize: `${1.8 + (i % 3) * 0.8}rem`,
            }}>{f}</div>
          ))}
        </div>

        <div className="echo-hero-content">
          {/* يسار: معلومات Echo */}
          <div className="echo-hero-left">
            <div className="echo-hero-tag">
              <span>{nightActive ? '🌙' : '◈'}</span>
              <span>Echo Mind · {time.phase}</span>
            </div>
            <div>
              <div className="echo-hero-name">Echo Mind</div>
              <div className="echo-hero-name-sub">عقل Echo في {time.isNight ? 'الليل' : 'الصباح'}</div>
            </div>
            <div className="echo-hero-quote">«{echoQuote}»</div>

            {/* إحصائيات Echo */}
            <div className="echo-hero-stats">
              <StatRow icon="💙" label="حالة التركيز" val={echo.memoryStability} color="#4A8FA8" />
              <StatRow icon="💛" label="وضوح الذكريات" val={echo.hope} color="#C49A3C" />
              <StatRow icon="💚" label="الاستقرار النفسي" val={Math.max(0,100 - echo.corruption)} color="#4CAF85" />
              {nightActive && (
                <StatRow icon="🔴" label="مستوى التشويش" val={echo.corruption} color="#D45050" />
              )}
            </div>

            <button
              className="echo-chat-cta"
              onClick={() => onNavigate?.('echo-mind')}
            >
              <span>◈</span> تحدّث مع Echo الآن
            </button>
          </div>

          {/* يمين: شخصية Echo */}
          <div className="echo-hero-right">
            <div className="echo-char-art">
              <div className="echo-char-silhouette" style={{
                filter: nightActive
                  ? 'drop-shadow(0 8px 30px rgba(200,50,50,0.4)) brightness(0.7)'
                  : 'drop-shadow(0 8px 30px rgba(74,143,168,0.4))',
              }}>
                {nightActive ? '🌑' : '🧑‍💻'}
              </div>

              {/* زينة زهور أمام الشخصية */}
              {['🌸','🌼','🌺'].map((f, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  fontSize: `${1.2 + i * 0.3}rem`,
                  opacity: nightActive ? 0.15 : 0.35,
                  bottom: `${20 + i * 25}px`,
                  left: i % 2 === 0 ? `${10 + i * 8}%` : undefined,
                  right: i % 2 !== 0 ? `${10 + i * 8}%` : undefined,
                  animation: `float-flower ${5 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                }}>{f}</div>
              ))}

              {/* توهج تحت الشخصية */}
              <div className="echo-char-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* ── شبكة الأنظمة الرئيسية ── */}
      <div className="dash-grid-main">
        {/* الألغاز */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">⬡</span> الألغاز
            </div>
            <button className="card-action" onClick={() => onNavigate?.('puzzles')}>
              عرض الكل ‹
            </button>
          </div>
          <div className="card-body">
            <div className="puzzle-preview-grid">
              {dayPuzzles.length > 0 ? dayPuzzles.map((pz: any, i: number) => (
                <div
                  key={pz.id}
                  className="puzzle-preview-card"
                  onClick={() => onNavigate?.('puzzles')}
                >
                  <div className="puzzle-preview-img">
                    {['🔍','🧩','🔮'][i % 3]}
                  </div>
                  <div className="puzzle-preview-info">
                    <div className="puzzle-preview-name">
                      {pz.status === 'solved' ? '✓ ' : ''}{pz.question.slice(0, 22)}…
                    </div>
                    <div className="puzzle-preview-pct">
                      {pz.entity} · {pz.status === 'solved' ? 'مكتمل' : pz.status === 'locked' ? '🔒 مقفل' : 'متاح'}
                    </div>
                    <div className="puzzle-preview-bar">
                      <div className="puzzle-preview-fill" style={{
                        width: pz.status === 'solved' ? '100%' : pz.status === 'active' ? '40%' : '0%',
                      }} />
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                  ابدأ بحل الألغاز لكشف الذكريات
                </div>
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <MiniBar label={`${solvedPuzzles} من ${totalPuzzles}`} val={overallPct} cls="accent" />
            </div>
          </div>
        </div>

        {/* الأمنيات */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">✦</span> الأمنيات
            </div>
            <button className="card-action" onClick={() => onNavigate?.('wishes')}>
              عرض الكل ‹
            </button>
          </div>
          <div className="card-body">
            <div className="wish-mini-grid">
              {wishes.slice(0, 3).map((w: any) => (
                <div key={w.id} className="wish-mini-card">
                  <div className="wish-mini-icon">✦</div>
                  <div className="wish-mini-text">{w.text.slice(0, 30)}{w.text.length > 30 ? '…' : ''}</div>
                  <div className="wish-mini-priority" style={{ color: w.status === 'completed' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {w.status === 'completed' ? '✓ تحقق' : `الأولوية: ${w.storyImpact > 20 ? 'عالية' : 'متوسطة'}`}
                  </div>
                  <div className="pbar-track" style={{ height: '3px', marginTop: '4px' }}>
                    <div className="pbar-fill teal" style={{ width: `${w.progress}%` }} />
                  </div>
                </div>
              ))}
              <button className="wish-add-btn" onClick={() => onNavigate?.('wishes')}>
                <span style={{ fontSize: '1.2rem' }}>+</span>
                <span>أضف أمنية</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── نظام الأزهار + إحصائيات ── */}
      <div className="dash-grid-3">
        {/* نظام الأزهار */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">❋</span> نظام الأزهار
            </div>
            <button className="card-action" onClick={() => onNavigate?.('flowers')}>
              الحديقة ‹
            </button>
          </div>
          <div className="card-body">
            <div className="flower-stages-visual">
              {FLOWER_STAGES.map((s, i) => (
                <div
                  key={s}
                  className={`flower-stage-item ${i < flowerIdx ? 'reached' : ''} ${i === flowerIdx ? 'current' : ''}`}
                >
                  <div className="flower-stage-emoji">{FLOWER_ICONS[i]}</div>
                  <div className="flower-stage-pct">{[0, 25, 50, 75, 100][i]}%</div>
                  <div className="flower-stage-label">{FLOWER_LABELS[i]}</div>
                </div>
              ))}
            </div>
            <MiniBar label={`${Math.round(flower.growth)}% — ${flower.stage}`} val={Math.round(flower.growth)} cls="pink" />
            <div style={{ marginTop: '6px', fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              زهرة اليوم · {nightActive ? 'تتحول مع الليل' : 'تنمو مع تقدمك'}
            </div>
          </div>
        </div>

        {/* Echo الحالة */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">◈</span> حالة Echo
            </div>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1 }}>
                {echo.corruption > 70 ? '🌑' : echo.trust > 60 ? '🌕' : '🌗'}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
                {echo.mood}
              </div>
            </div>
            <MiniBar label="ثقة" val={echo.trust} cls="teal" />
            <MiniBar label="أمل" val={echo.hope} cls="green" />
            <MiniBar label="ذاكرة" val={echo.memoryStability} cls="accent" />
            {echo.corruption > 20 && (
              <MiniBar label="تشويش" val={echo.corruption} cls="danger" />
            )}
          </div>
        </div>

        {/* إجمالي التقدم */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">◉</span> إجمالي التقدم
            </div>
          </div>
          <div className="card-body">
            {/* دائرة التقدم */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-secondary)" strokeWidth="6" />
                  <circle
                    cx="36" cy="36" r="30" fill="none"
                    stroke="var(--accent)" strokeWidth="6"
                    strokeDasharray={`${188.5 * overallPct / 100} 188.5`}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>{overallPct}%</span>
                  <span style={{ fontSize: '0.42rem', color: 'var(--text-muted)' }}>تقدم</span>
                </div>
              </div>
            </div>
            <div className="stat-grid">
              <MiniStat icon="⬡" val={`${solvedPuzzles}`} label="ألغاز" />
              <MiniStat icon="◫" val={`${memory.fragmentsCollected}`} label="ذكريات" />
              <MiniStat icon="◉" val={`${achievements.filter(a=>a.unlocked).length}`} label="إنجازات" />
              <MiniStat icon="📅" val={`${time.dayCycle}`} label="يوم" />
            </div>
          </div>
        </div>
      </div>

      {/* ── خط التقدم الزمني ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">◫</span> مسار التقدم
          </div>
        </div>
        <div className="card-body">
          <div className="progress-timeline">
            {[
              { label: 'بداية الرحلة', sub: 'اكتشاف الذات' },
              { label: 'اكتشاف الذات', sub: 'الألغاز الأولى' },
              { label: 'مواجهة الماضي', sub: 'Echo يتذكر' },
              { label: 'اختبار المصل', sub: 'قريباً' },
              { label: 'النهاية الحقيقية', sub: 'قريباً' },
            ].map((step, i) => {
              const done    = i < echo.level;
              const current = i === echo.level;
              return (
                <div key={i} className="progress-step">
                  <div className={`progress-step-dot ${done ? 'done' : current ? 'current' : ''}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div className="progress-step-label">
                    <div style={{ fontWeight: done || current ? 600 : 400, color: done ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.46rem', color: 'var(--text-faint)', marginTop: '2px' }}>{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '0.58rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            «الصوت لا يصبح قوة لكنه يمنحك الألوان لتضيء. أنتَ على الطريق الصحيح.» — Echo
          </div>
        </div>
      </div>

      {/* ── تنبيه الليل ── */}
      {nightActive && (
        <div className={`night-status-banner phase-${time.phaseIndex}`}>
          <span className="night-banner-icon">
            {time.phaseIndex >= 3 ? '🔴' : time.phaseIndex >= 2 ? '🟠' : '🟡'}
          </span>
          <div>
            <div className="night-banner-title" style={{ color: time.phaseIndex >= 3 ? 'var(--danger)' : 'var(--warning)' }}>
              {time.phase} — {time.phaseIndex >= 3 ? 'الانتقال السينمائي الكامل' : time.phaseIndex >= 2 ? 'تزايد حالة عدم الاستقرار' : 'بداية عدم الاستقرار'}
            </div>
            <div className="night-banner-sub">
              {time.phaseIndex >= 3
                ? 'تتكسر الواجهة القديمة وتختفي معظم عناصرها. يبقى فقط العناصر الأساسية.'
                : 'الواجهة تضعف تدريجياً — استمر في حل الألغاز'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── مكونات مساعدة ── */
const MiniBar: React.FC<{ label: string; val: number; cls: string }> = ({ label, val, cls }) => (
  <div className="pbar">
    <div className="pbar-label">
      <span>{label}</span>
      <span>{Math.round(Math.min(100, Math.max(0, val)))}%</span>
    </div>
    <div className="pbar-track">
      <div className={`pbar-fill ${cls}`} style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
    </div>
  </div>
);

const MiniStat: React.FC<{ icon: string; val: string; label: string }> = ({ icon, val, label }) => (
  <div className="stat-chip">
    <div style={{ fontSize: '0.9rem' }}>{icon}</div>
    <div className="stat-chip-value">{val}</div>
    <div className="stat-chip-label">{label}</div>
  </div>
);

export default DashboardHome;
