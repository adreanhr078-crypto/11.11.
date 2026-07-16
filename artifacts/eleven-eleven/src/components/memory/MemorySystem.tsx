/**
 * MemorySystem.tsx — نظام الذاكرة والأحلام المُجدَّد
 */

import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

const DREAM_SCENES = [
  { icon: '🌊', label: 'صوت قديم',         desc: 'لقاء بين النسيان', unlockAt: 0 },
  { icon: '🌙', label: 'لقاء تحت المطر',   desc: 'ذكرى من الطفولة',  unlockAt: 2 },
  { icon: '🌸', label: 'حديقة الزهور',     desc: 'مع أمي... لينا',   unlockAt: 5 },
  { icon: '🌌', label: 'حجرة النسيان',     desc: 'ما حدث في الليل',  unlockAt: 10 },
];

export const MemorySystem: React.FC = () => {
  const { memory, echo, time } = useGameStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'dreams' | 'logs'>('timeline');

  const pct = memory.totalFragments > 0 ? (memory.fragmentsCollected / memory.totalFragments) * 100 : 0;
  const nightOn = time.phaseIndex >= 1;

  return (
    <div className="memories-section">
      <div className="section-header">
        <div>
          <div className="section-title">◫ الذكريات والأحلام</div>
          <div className="section-subtitle">مشاهد لقطح من الماضي… تُرى وتُعاد</div>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {memory.fragmentsCollected} / {memory.totalFragments} شظية
        </div>
      </div>

      {/* بطاقة التقدم */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">◫</span> استرجاع الذاكرة</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <StatChip val={`${memory.fragmentsCollected}`} label="شظايا مُجمَّعة" icon="◫" />
            <StatChip val={`${echo.memoryStability}%`} label="استقرار الذاكرة" icon="◈" />
            <StatChip val={`${echo.corruption > 0 ? echo.corruption + '%' : 'صفر'}`} label="مستوى التشويش" icon="⚡" />
          </div>
          <div className="pbar">
            <div className="pbar-label">
              <span>إجمالي استرجاع الذاكرة</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="pbar-track">
              <div className="pbar-fill" style={{
                width: `${pct}%`,
                background: echo.corruption > 50
                  ? 'linear-gradient(90deg, #D45050, #E8943A)'
                  : 'linear-gradient(90deg, var(--teal-light), var(--accent))',
              }} />
            </div>
          </div>
          {echo.corruption > 30 && (
            <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(212,80,80,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212,80,80,0.2)', fontSize: '0.58rem', color: 'var(--danger)' }}>
              ⚠ تلف الذاكرة: {echo.corruption}% — حل الألغاز لاسترداد الذاكرة
            </div>
          )}
        </div>
      </div>

      {/* تبويبات */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        {(['timeline','dreams','logs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '7px', fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
            color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
            border: 'none', boxShadow: activeTab === tab ? 'var(--shadow-card)' : 'none',
            transition: 'all 0.2s',
          }}>
            {tab === 'timeline' ? '◫ الأحداث' : tab === 'dreams' ? '💭 الأحلام' : '📄 السجلات'}
          </button>
        ))}
      </div>

      {/* الأحداث الزمنية */}
      {activeTab === 'timeline' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">◫</span> خط الأحداث</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{memory.timelineEvents.length} حدث</div>
          </div>
          <div className="card-body" style={{ padding: '10px' }}>
            {memory.timelineEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }}>◫</div>
                حل الألغاز لتسجيل الأحداث وبناء خط الذاكرة
              </div>
            ) : (
              <div className="memory-timeline-list">
                {[...memory.timelineEvents].reverse().slice(0, 20).map((ev) => (
                  <div key={ev.id} className={`memory-event${ev.phase !== 'morning' && ev.phase !== 'day' ? ' night-event' : ''}`}>
                    <div className="memory-event-icon">
                      {ev.type === 'puzzle' ? '⬡' : (ev.type as string) === 'dream' ? '💭' : '◫'}
                    </div>
                    <div className="memory-event-time">{ev.time}</div>
                    <div className="memory-event-text">{ev.description}</div>
                    <div className="memory-event-phase">{ev.phase}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* الأحلام */}
      {activeTab === 'dreams' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '10px', fontStyle: 'italic' }}>
            مشاهد لقطح من الماضي… تُرى وتُعاد. أعد مشاهدة الذكريات في أي وقت واكتشف تفاصيل جديدة.
          </div>

          {/* مشاهد مفتوحة */}
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🎬</span> مشاهد مفتوحة</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--accent)' }}>
                {DREAM_SCENES.filter(d => memory.fragmentsCollected >= d.unlockAt).length} مشاهد
              </div>
            </div>
            <div className="card-body">
              <div className="dreams-grid">
                {DREAM_SCENES.map((d, i) => {
                  const unlocked = memory.fragmentsCollected >= d.unlockAt;
                  return (
                    <div key={i} className="dream-card" style={{ opacity: unlocked ? 1 : 0.45 }}>
                      <div className="dream-card-img" style={{
                        background: unlocked
                          ? `linear-gradient(135deg, rgba(${[74,143,168,200,80,120,232,160,191][i % 3]},0.15), var(--bg-secondary))`
                          : 'var(--bg-secondary)',
                      }}>
                        {unlocked ? d.icon : '🔒'}
                      </div>
                      <div className="dream-card-title">{unlocked ? d.label : '??'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* معرض الذكريات */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🖼️</span> معرض الذكريات</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>أعد مشاهدة الذكريات في أي وقت</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
                {[...Array(Math.max(0, Math.min(8, memory.fragmentsCollected)))].map((_, i) => (
                  <div key={i} style={{
                    flexShrink: 0, width: '80px', height: '60px', borderRadius: 'var(--radius-sm)',
                    background: `linear-gradient(135deg, rgba(74,143,168,${0.1 + i * 0.05}), rgba(100,${180 - i * 10},${200 - i * 15},0.2))`,
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}>
                    {['◫','💭','🌸','◈','✦','🌊','🌙','◉'][i % 8]}
                  </div>
                ))}
                {memory.fragmentsCollected === 0 && (
                  <div style={{ textAlign: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.6rem', padding: '16px', fontStyle: 'italic' }}>
                    حل الألغاز لفتح ذكريات Echo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* السجلات */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">📄</span> سجلات مكتشفة</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{memory.logsUnlocked.length} سجل</div>
          </div>
          <div className="card-body">
            {memory.logsUnlocked.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                لا توجد سجلات بعد — حل الألغاز لاكتشاف السجلات المخفية
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {memory.logsUnlocked.map((log, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    fontSize: '0.62rem', color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: 'var(--accent)' }}>📄</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatChip: React.FC<{ icon: string; val: string; label: string }> = ({ icon, val, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    padding: '8px 6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', textAlign: 'center',
  }}>
    <span style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>{icon}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{val}</span>
    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

export default MemorySystem;
