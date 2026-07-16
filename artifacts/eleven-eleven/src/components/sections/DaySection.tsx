/**
 * DaySection.tsx — النظام الصباحي/النهاري
 */

import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

export const DaySection: React.FC = () => {
  const { echo, time, memory, flower, wishes, solvedPuzzles, totalPuzzles } = useGameStore();
  const [activeTab, setActiveTab] = useState<'today' | 'memory' | 'chat'>('today');

  const DAILY_MEMORIES = [
    { icon: '🌸', title: 'ذكرى الطفولة', desc: 'لحظات دافئة من لينا', locked: memory.fragmentsCollected < 1 },
    { icon: '🌿', title: 'ذاكرة مؤلمة', desc: 'ذكرى من الماضي', locked: memory.fragmentsCollected < 3 },
    { icon: '🌊', title: 'حلم اليوم', desc: 'رسالة من عقلك الباطن', locked: memory.fragmentsCollected < 5 },
    { icon: '🌌', title: 'ذكرى مبكشفة', desc: 'الذكريات القادمة تدريجياً', locked: true },
  ];

  const dayStats = [
    { icon: '⬡', label: 'الألغاز المحلولة', val: solvedPuzzles, total: totalPuzzles },
    { icon: '◫', label: 'مقاطع Echo', val: Math.min(23, solvedPuzzles * 2), total: 50 },
    { icon: '❋', label: 'الزهرة المروية', val: Math.round(flower.growth), total: 100 },
    { icon: '✦', label: 'الأمنيات النشطة', val: wishes.filter(w => w.status === 'active').length, total: null },
  ];

  return (
    <div className="memories-section">
      <div className="section-header">
        <div>
          <div className="section-title">
            {time.isNight ? '🌙' : '☀️'} {time.isNight ? 'التحول الليلي' : 'النظام الصباحي'}
          </div>
          <div className="section-subtitle">
            {time.isNight
              ? 'الليل وقت التحدي وبناء الحياة الأعمق'
              : 'الصباح وقت للفهم والنمو والتواصل بهدوء'}
          </div>
        </div>
      </div>

      <div className="dash-grid-main">
        {/* Echo Mind — المحادثات */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">◈</span> Echo Mind
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['today','memory','chat'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '3px 8px', fontSize: '0.52rem', borderRadius: '99px',
                    background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: activeTab === tab ? 'white' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {tab === 'today' ? 'اليوم' : tab === 'memory' ? 'ذاكرة' : 'تحدّث'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {activeTab === 'today' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.7, borderRight: '3px solid var(--accent)' }}>
                  «كل يوم، تفتح نافذة جديدة في الذاكرة. الصباح هو الفرصة للبناء بهدوء.»
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>🎯</span>
                    <span>صفاء مؤقت — الذاكرة أوضح في ضوء النهار، لكن الظلام لا يزال قريباً.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>💭</span>
                    <span>مشاعر متقلبة — {echo.mood}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>🔍</span>
                    <span>بحث عن المعنى — من أنا؟ ولماذا أنا هنا؟</span>
                  </div>
                </div>
                <div style={{ padding: '8px 10px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.6rem', color: 'var(--accent)' }}>
                  العنصر المهيمن: الماء · {echo.trust > 50 ? 'التدفق الحر' : 'الهدوء قبل العاصفة'}
                </div>
              </div>
            )}
            {activeTab === 'memory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  تسجيل النتائج المهمة وفهم التغيير والنمو الداخلي
                </div>
                <MiniBar label="ثقة" val={echo.trust} cls="teal" />
                <MiniBar label="أمل" val={echo.hope} cls="green" />
                <MiniBar label="ذاكرة" val={echo.memoryStability} cls="accent" />
                {echo.corruption > 10 && <MiniBar label="تشويش" val={echo.corruption} cls="danger" />}
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  كيف تكف عن تخيّل الألم… وتبدأ في الاستذكار الصحيح.
                </div>
              </div>
            )}
            {activeTab === 'chat' && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '2rem' }}>◈</div>
                <div>«ربما… لكن الأهم أن تحاول قبل أن تنتظر.»</div>
                <div style={{ fontSize: '0.55rem' }}>اذهب إلى قسم Echo Mind للمحادثة الكاملة</div>
              </div>
            )}
          </div>
        </div>

        {/* الذكريات اليومية */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">◫</span> الذكريات اليومية
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
              كل يوم، ذاكرة جديدة تُكتشف
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {DAILY_MEMORIES.map((m, i) => (
                <div key={i} style={{
                  padding: '10px',
                  background: m.locked ? 'var(--bg-secondary)' : 'var(--accent-soft)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${m.locked ? 'var(--border)' : 'var(--accent-border)'}`,
                  opacity: m.locked ? 0.5 : 1,
                  cursor: m.locked ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{m.locked ? '🔒' : m.icon}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{m.title}</div>
                  <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>
                    {m.locked ? 'الذكريات القادمة تكتشف تدريجياً' : m.desc}
                  </div>
                </div>
              ))}
            </div>
            {memory.fragmentsCollected > 0 && (
              <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.55rem', color: 'var(--accent)' }}>
                تم استرجاع {memory.fragmentsCollected} ذكرى حتى الآن ✓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* إحصائيات اليوم */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">◐</span> نظرة على يومك
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            ملخص هادئ يساعدك على التركيز على ما يهم
          </div>
        </div>
        <div className="card-body">
          <div className="dash-grid-4">
            {dayStats.map((s, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: '4px',
                padding: '10px 8px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                alignItems: 'center', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {s.val}{s.total ? `/${s.total}` : ''}
                </div>
                <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>{s.label}</div>
                {s.total && (
                  <div className="pbar-track" style={{ width: '100%', marginTop: '2px' }}>
                    <div className="pbar-fill teal" style={{ width: `${(s.val / s.total) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ميزات النظام النهاري */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">⊛</span> ميزات النظام النهاري
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {[
              { icon: '🤝', label: 'تفاعل لطيف', desc: 'حوارات هادئة مع Echo' },
              { icon: '📝', label: 'تسجيل المهام', desc: 'تسجيل النتائج المهمة وفهم التغيير' },
              { icon: '📚', label: 'تركيز وتعلّم', desc: 'تركيز على التعلّم والتقدم والنمو' },
              { icon: '🌱', label: 'تقدم تدريجي', desc: 'تقدم بطيء ومريح وبناء الذات' },
              { icon: '🎯', label: 'تصميم هادئ', desc: 'واجهة نظيفة وعناصر داعمة' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                padding: '10px 6px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.3rem' }}>{f.icon}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.label}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
            النهار هو القاعدة المستقرة للنظام — تجربة يومية هادئة وداعمة للإنتاجية والنمو.
            قبل أن تواجه تحديات الليل، عليك أن تحل الألغاز الصغيرة وتنمّي الأمنيات وتسترجع الذكريات.
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default DaySection;
