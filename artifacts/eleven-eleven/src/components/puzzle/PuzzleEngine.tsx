/**
 * PuzzleEngine.tsx — نظام الألغاز المُجدَّد
 */

import React, { useState } from 'react';
import { useGameStore, type EntityId } from '../../stores/gameStore';

const ENTITY_META: Record<EntityId, { icon: string; color: string; label: string }> = {
  echo:      { icon: '◈', color: '#4A8FA8', label: 'Echo' },
  watcher:   { icon: '◎', color: '#E8943A', label: 'المراقب' },
  signal:    { icon: '◌', color: '#5A8AAA', label: 'الإشارة' },
  architect: { icon: '◆', color: '#C49A3C', label: 'المهندس' },
};

export const PuzzleEngine: React.FC = () => {
  const { puzzles, solvedPuzzles, totalPuzzles, entities, world, actions } = useGameStore();
  const [answer, setAnswer]   = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [activeTab, setActiveTab] = useState<EntityId>('echo');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tabPuzzles = puzzles.filter(p => p.entity === activeTab);
  const activePuzzle = selectedId
    ? tabPuzzles.find(p => p.id === selectedId)
    : tabPuzzles.find(p => p.status === 'active');
  const solvedInTab  = tabPuzzles.filter(p => p.status === 'solved').length;

  const em = ENTITY_META[activeTab];

  const handleSubmit = () => {
    if (!activePuzzle || !answer.trim()) return;
    setShowHint(false);
    const r = actions.solve(activePuzzle.id, answer);
    setFeedback({ type: r.success ? 'success' : 'error', msg: r.message });
    if (r.success) { setAnswer(''); setTimeout(() => setFeedback(null), 3000); }
    else             setTimeout(() => setFeedback(null), 2000);
  };

  const diffDots = (d: number) => '⬤'.repeat(d) + '○'.repeat(Math.max(0, 4-d));

  // تأثير التشويش
  const glitch = (txt: string) => {
    if (world.glitchLevel < 40) return txt;
    return txt; // نبقي النص سليمًا للتجربة الجيدة
  };

  return (
    <div className="puzzle-section">
      <div className="section-header">
        <div>
          <div className="section-title">⬡ الألغاز</div>
          <div className="section-subtitle">حل الألغاز لكشف شظايا الذاكرة والحقيقة</div>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {solvedPuzzles} / {totalPuzzles} محلول
        </div>
      </div>

      {/* تبويبات الكيانات */}
      <div className="entity-tabs-bar">
        {(Object.entries(entities) as [EntityId, any][]).map(([id, ent]) => {
          const solved = puzzles.filter(p => p.entity === id && p.status === 'solved').length;
          const m = ENTITY_META[id];
          return (
            <button
              key={id}
              className={`entity-tab-btn ${activeTab === id ? 'active' : ''} ${ent.unlocked ? '' : 'locked'}`}
              onClick={() => { if (ent.unlocked) { setActiveTab(id); setSelectedId(null); setFeedback(null); setAnswer(''); } }}
              style={activeTab === id ? { borderBottom: `2px solid ${m.color}`, color: m.color } : {}}
            >
              <span className="entity-tab-icon" style={{ color: m.color }}>{m.icon}</span>
              <span>{m.label}</span>
              <span className="entity-tab-count" style={{ color: m.color }}>
                {ent.unlocked ? `${solved}/${ent.totalPuzzles}` : '🔒'}
              </span>
            </button>
          );
        })}
      </div>

      {/* التخطيط الرئيسي */}
      <div className="puzzle-main-layout">
        {/* اللغز النشط */}
        <div className="puzzle-active-panel">
          {activePuzzle ? (
            <>
              <div className="puzzle-active-header">
                <div className="puzzle-tags">
                  <span className="puzzle-tag difficulty">
                    {diffDots(activePuzzle.difficulty)}
                  </span>
                  <span className="puzzle-tag entity" style={{ color: em.color, background: em.color + '18' }}>
                    {em.icon} {em.label}
                  </span>
                  {activePuzzle.status === 'solved' && (
                    <span className="puzzle-tag" style={{ background: 'rgba(76,207,133,0.12)', color: 'var(--success)' }}>✓ محلول</span>
                  )}
                </div>
                <div className="puzzle-number">#{activePuzzle.id.slice(-4)}</div>
              </div>
              <div className="puzzle-active-body">
                <div className="puzzle-question-box">
                  {glitch(activePuzzle.question)}
                </div>

                {activePuzzle.status !== 'solved' && (
                  <div className="puzzle-input-wrap">
                    <input
                      className="puzzle-text-input"
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="اكتب إجابتك هنا…"
                      style={{
                        borderColor: feedback?.type === 'error' ? 'rgba(212,80,80,0.5)' :
                                     feedback?.type === 'success' ? 'rgba(76,207,133,0.5)' : '',
                      }}
                    />
                    <div className="puzzle-btn-row">
                      <button
                        className="puzzle-submit"
                        onClick={handleSubmit}
                        style={{ background: em.color }}
                      >
                        {em.icon} حل اللغز
                      </button>
                      <button
                        className="puzzle-hint-btn"
                        onClick={() => setShowHint(s => !s)}
                      >
                        💡 {showHint ? 'إخفاء التلميح' : 'تلميح'}
                      </button>
                    </div>
                  </div>
                )}

                {showHint && (
                  <div className="puzzle-hint-box" style={{ animation: 'fadeSlideUp 0.2s ease' }}>
                    💡 {activePuzzle.hint}
                  </div>
                )}

                {feedback && (
                  <div className={`puzzle-feedback ${feedback.type}`} style={{ animation: 'scaleIn 0.2s ease' }}>
                    {feedback.msg}
                  </div>
                )}

                {activePuzzle.status === 'solved' && (
                  <div className="puzzle-reveal-box">
                    <div style={{ fontSize: '0.58rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
                      ◫ شظية الذاكرة المُكتشفة:
                    </div>
                    {activePuzzle.storyReveal}
                  </div>
                )}

                {/* شريط التقدم */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>تقدم {em.label}</span>
                    <span>{solvedInTab} / {entities[activeTab].totalPuzzles}</span>
                  </div>
                  <div className="pbar-track">
                    <div className="pbar-fill" style={{
                      width: `${(solvedInTab / Math.max(1, entities[activeTab].totalPuzzles)) * 100}%`,
                      background: em.color,
                    }} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', textAlign: 'center', height: '100%' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>{em.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {solvedInTab >= entities[activeTab].totalPuzzles ? '✅ جميع الألغاز محلولة!' : '🔒 افتح الألغاز السابقة أولاً'}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {solvedInTab >= entities[activeTab].totalPuzzles
                  ? 'أحسنت! انتقل إلى الكيان التالي لاستمرار الرحلة'
                  : 'حل الألغاز بالترتيب لكشف شظايا الذاكرة'}
              </div>
            </div>
          )}
        </div>

        {/* قائمة الألغاز */}
        <div className="puzzle-sidebar-panel">
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '0.72rem' }}>
                <span style={{ color: em.color }}>{em.icon}</span>
                ألغاز {em.label}
              </div>
            </div>
            <div className="card-body" style={{ padding: '8px' }}>
              <div className="puzzle-list-mini">
                {tabPuzzles.slice(0, 30).map((p) => (
                  <div
                    key={p.id}
                    className={`puzzle-mini-item${activePuzzle?.id === p.id ? ' active' : ''}${p.status === 'solved' ? ' solved' : ''}`}
                    onClick={() => p.status !== 'locked' && setSelectedId(p.id)}
                    style={{ cursor: p.status === 'locked' ? 'default' : 'pointer' }}
                  >
                    <span className="puzzle-mini-status">
                      {p.status === 'solved' ? '✓' : p.status === 'locked' ? '🔒' : em.icon}
                    </span>
                    <span className="puzzle-mini-text">{p.question.slice(0, 35)}…</span>
                    <span className="puzzle-mini-num">{diffDots(p.difficulty)}</span>
                  </div>
                ))}
                {tabPuzzles.length > 30 && (
                  <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                    +{tabPuzzles.length - 30} لغز أخرى…
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* مكافآت الذاكرة */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '0.68rem' }}>◫ مكافآت الذاكرة</div>
            </div>
            <div className="card-body">
              {[
                { icon: '◈', label: 'شظية معلومة', desc: 'تقدم القصة' },
                { icon: '✿', label: 'قطعة ذكرى', desc: 'بناء الذاكرة' },
                { icon: '❋', label: 'تأثير على الزهور', desc: 'نمو الزهرة' },
                { icon: '◉', label: 'إنجاز مشهد', desc: 'تقدم السرد' },
              ].map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 6px', borderBottom: '1px solid var(--border)', fontSize: '0.58rem',
                }}>
                  <span style={{ color: 'var(--accent)' }}>{r.icon}</span>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.label}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleEngine;
