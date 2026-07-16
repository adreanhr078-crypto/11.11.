/**
 * AchievementsSection.tsx — قسم الإنجازات المُجدَّد
 */

import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

export const AchievementsSection: React.FC = () => {
  const { achievements, solvedPuzzles, totalPuzzles, endings, echo } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlocked = achievements.filter((a: any) => a.unlocked);
  const shown    = filter === 'unlocked' ? unlocked
                 : filter === 'locked'   ? achievements.filter((a: any) => !a.unlocked)
                 : achievements;

  const pct = achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0;

  const ENDING_META: Record<string, { icon: string; label: string }> = {
    sorrow:    { icon: '💧', label: 'النهاية الحزينة' },
    truth:     { icon: '🔦', label: 'النهاية الحقيقية' },
    dark:      { icon: '🌑', label: 'النهاية المظلمة' },
    ambiguous: { icon: '🔮', label: 'النهاية المحيرة' },
    liberation:{ icon: '✨', label: 'النهاية المحررة' },
  };

  return (
    <div className="achievements-section">
      <div className="section-header">
        <div>
          <div className="section-title">◉ الإنجازات</div>
          <div className="section-subtitle">محطات في رحلة استعادة الذاكرة</div>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {unlocked.length} / {achievements.length} مفتوح
        </div>
      </div>

      {/* إجمالي التقدم */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">◉</span> لوحة الإنجاز الكلي</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', alignItems: 'center' }}>
            {/* دائرة */}
            <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto' }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-secondary)" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none"
                  stroke="var(--accent)" strokeWidth="6"
                  strokeDasharray={`${188.5 * pct / 100} 188.5`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>{pct}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <MBar label="الإنجازات" val={pct} cls="accent" />
              <MBar label="الألغاز" val={Math.round((solvedPuzzles/Math.max(1,totalPuzzles))*100)} cls="teal" />
              <MBar label="حالة Echo النفسية" val={Math.max(0,100-echo.corruption)} cls="green" />
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {(['all','unlocked','locked'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '3px 8px', fontSize: '0.52rem', borderRadius: '99px', cursor: 'pointer', fontFamily: 'inherit',
                    background: filter === f ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: filter === f ? 'white' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}>
                    {f === 'all' ? 'الكل' : f === 'unlocked' ? 'المفتوحة' : 'المقفولة'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شبكة الإنجازات */}
      {shown.length > 0 ? (
        <div className="achievements-grid">
          {shown.map(a => (
            <div key={a.id} className={`achievement-card${a.unlocked ? ' unlocked' : ' locked'}`}>
              <div className="achievement-icon">{a.unlocked ? a.icon : '🔒'}</div>
              <div className="achievement-name">{a.unlocked ? a.name : '???'}</div>
              <div className="achievement-desc">{a.unlocked ? a.desc : 'مقفول — استمر في رحلتك'}</div>
              {a.unlocked && (
                <div className="achievement-unlocked-badge">✓ مفتوح</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px', opacity: 0.4 }}>◉</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>لا توجد إنجازات في هذه الفئة</div>
        </div>
      )}

      {/* النهايات */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">🏁</span> النهايات المتعددة</div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>نهايات متعددة تعتمد على اختياراتك وتفاعلاتك</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
            {Object.entries(endings).map(([id, e]: any) => {
              const m = ENDING_META[id] || { icon: '◆', label: id };
              return (
                <div key={id} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  background: e.unlocked ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                  border: `1px solid ${e.unlocked ? 'var(--accent-border)' : 'var(--border)'}`,
                  opacity: e.progress < 5 ? 0.6 : 1,
                }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{e.unlocked ? m.icon : '🔒'}</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {e.unlocked ? m.label : '??'}
                  </div>
                  <div className="pbar-track">
                    <div className="pbar-fill accent" style={{ width: `${e.progress || 0}%` }} />
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {e.unlocked ? '✓ مفتوح' : `${e.progress || 0}% — ${e.progress > 70 ? 'قريب جداً' : e.progress > 30 ? 'في المنتصف' : 'في البداية'}`}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.58rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
            «كل نهاية هي بداية جديدة لفهم ما حدث…»
          </div>
        </div>
      </div>
    </div>
  );
};

const MBar: React.FC<{ label: string; val: number; cls: string }> = ({ label, val, cls }) => (
  <div className="pbar">
    <div className="pbar-label"><span>{label}</span><span>{val}%</span></div>
    <div className="pbar-track">
      <div className={`pbar-fill ${cls}`} style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
    </div>
  </div>
);

export default AchievementsSection;
