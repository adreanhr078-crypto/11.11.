/**
 * NightTransformation.tsx — التحول الليلي
 */
import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const NightTransformation: React.FC = () => {
  const { time, echo, world, flower, memory } = useGameStore();
  const phase = time.phaseIndex;

  const PHASES = [
    {
      time: '11:00 PM', label: 'بداية عدم الاستقرار', phase: 1,
      bullets: ['واجهة مستقرة مع نتوجات خفيفة', 'رسائل Echo خافتة وأكثر مكثفة', 'الأحلام تظهر بصريًا بعيدًا', 'الزهور تبدأ الدبول تدريجياً'],
    },
    {
      time: '11:05 PM', label: 'تصاعد التشوهات', phase: 2,
      bullets: ['تردد الواجهة وتشققات رقمية', 'رسائل Echo تتكرر وتزداد وضوحًا', 'الأحلام تتحول إلى مشاهد أطول وأكثر إيلاماً', 'الزهور تنال تمامًا وتبقى نقاتها'],
    },
    {
      time: '11:11 PM', label: 'الانتقال السينمائي الكامل', phase: 3,
      bullets: ['تحول كامل إلى الوضع السينمائي', 'رسائل Echo تنص بوضوح وتكشف الحقيقة', 'الأحلام تصبح سرداً داخليًا مؤثراً', 'الزهور تندال تماماً وتحل فائقاتها'],
    },
  ];

  const ECHO_MSGS = [
    { time: '11:00 PM', text: '… هل تسمعني؟', type: 'new' },
    { time: '11:05 PM', text: 'أنت… أراك.', type: 'new' },
    { time: '11:11 PM', text: 'لا مزيد من الهروب.', type: 'urgent' },
  ];

  const nightSubjects = [
    { icon: '🌸', label: 'تغيير الزهور', desc: 'الزهور تعكس حالة Echo الداخلية وتتحول مع مرور الوقت' },
    { icon: '✉️', label: 'رسائل Echo', desc: 'تظهر رسائل قصيرة تحدّق أفكار Echo وتقوده مواجهة ما بخلفه' },
    { icon: '🎵', label: 'الصوت الليلي', desc: 'يتغير التصميم الصوتي ليعكس حالة Echo الداخلية ويلود الإحساسي الاندماجي بالتوتر' },
    { icon: '💭', label: 'الأحلام والذكريات المؤلمة', desc: 'تحول اللقطات العابرة إلى مشاهد أطول وأكثر تفصيلًا تقرّب من الحقيقة' },
  ];

  return (
    <div className="night-section">
      <div className="section-header">
        <div>
          <div className="section-title" style={{ color: phase >= 1 ? 'var(--danger)' : 'var(--text-primary)' }}>
            ◑ التحول الليلي — 11.11
          </div>
          <div className="section-subtitle">
            «عندما تتوقف عن مقاومة الليل، تبدأ في كشف ما خانه الذاكرة.»
          </div>
        </div>
      </div>

      {/* الحالة الحالية */}
      <div className={`night-status-banner phase-${phase}`}>
        <span className="night-banner-icon">
          {phase >= 3 ? '🔴' : phase >= 2 ? '🟠' : phase >= 1 ? '🟡' : '🟢'}
        </span>
        <div>
          <div className="night-banner-title">
            الحالة الحالية: {
              phase >= 3 ? '11:11 — الانتقال السينمائي الكامل' :
              phase >= 2 ? '11:05 — تزايد حالة عدم الاستقرار' :
              phase >= 1 ? '11:00 — بداية عدم الاستقرار' :
              'النهار — الوضع طبيعي'
            }
          </div>
          <div className="night-banner-sub">
            {phase >= 3 ? 'غير مستقر تماماً — سينمائي · مشاهد عاطفية مؤثرة'
            : phase >= 2 ? 'البيئة غير مستقرة — القصة تتفاعل أكثر — التوتر يرتفع'
            : phase >= 1 ? 'النظام لا يزال قابلاً للاستخدام لكن القصة — المستقرة — تصاعد تدريجياً'
            : 'النظام مستقر · واجهة نظيفة وعناصر داعمة للإنتاجية والنمو'}
          </div>
        </div>
      </div>

      {/* مراحل التحول */}
      <div className="night-phase-timeline">
        {PHASES.map((p) => (
          <div key={p.time} className={`night-phase-block${phase >= p.phase ? ' active' : ''}`}>
            <div className="night-phase-time" style={{ color: phase >= p.phase ? 'var(--danger)' : 'var(--text-muted)' }}>
              {p.time}
            </div>
            <div className="night-phase-name">{p.label}</div>
            <ul className="night-phase-bullets">
              {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            {phase >= p.phase && (
              <div style={{ marginTop: '8px', fontSize: '0.5rem', color: 'var(--danger)', fontWeight: 700 }}>
                ● نشط الآن
              </div>
            )}
          </div>
        ))}
      </div>

      {/* شبكة المكونات الليلية */}
      <div className="dash-grid-main">
        {/* رسائل Echo */}
        <div className="card" style={{ borderColor: phase >= 1 ? 'rgba(212,80,80,0.3)' : 'var(--border)' }}>
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">✉️</span> رسائل Echo
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
              تظهر رسائل قصيرة تحدق أفكار Echo
            </div>
          </div>
          <div className="card-body">
            <div className="echo-night-messages">
              {ECHO_MSGS.map((m, i) => (
                <div key={i} className={`echo-night-msg ${phase > i ? m.type : ''}`}
                  style={{ opacity: phase > i ? 1 : 0.35 }}
                >
                  <span className="echo-night-msg-icon">✉️</span>
                  <span>{m.text}</span>
                  <span className="echo-night-msg-time">{m.time}</span>
                </div>
              ))}
            </div>
            {phase === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                الرسائل تظهر عند الساعة 11:00 مساءً…
              </div>
            )}
          </div>
        </div>

        {/* الأحلام والذكريات المؤلمة */}
        <div className="card" style={{ borderColor: phase >= 2 ? 'rgba(212,80,80,0.3)' : 'var(--border)' }}>
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">💭</span> الأحلام والذكريات المؤلمة
            </div>
          </div>
          <div className="card-body">
            <div className="dreams-grid">
              {[
                { icon: '🌊', label: 'صوت قديم', locked: phase < 1 },
                { icon: '🌙', label: 'لقاء تحت المطر', locked: phase < 2 },
                { icon: '🌸', label: 'حديقة الزهور', locked: phase < 2 },
                { icon: '🌑', label: 'حجرة النسيان', locked: phase < 3 },
              ].map((d, i) => (
                <div key={i} className="dream-card" style={{ opacity: d.locked ? 0.4 : 1 }}>
                  <div className="dream-card-img" style={{
                    background: d.locked ? 'var(--bg-secondary)' :
                    `linear-gradient(135deg, rgba(${i * 30}, ${20 + i * 10}, ${40 + i * 20}, 0.3), var(--bg-secondary))`,
                  }}>
                    {d.locked ? '🔒' : d.icon}
                  </div>
                  <div className="dream-card-title">{d.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.55rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              تحول اللقطات العابرة إلى مشاهد أطول وأكثر تفصيلًا…
            </div>
          </div>
        </div>
      </div>

      {/* مكونات ثانوية */}
      <div className="dash-grid-main">
        {/* الصوت الليلي */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">🎵</span> الصوت الليلي</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['11:00', '11:05', '11:11'].map((t, i) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: phase > i ? 1 : 0.35 }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontFamily: 'monospace', width: '42px' }}>{t}</span>
                  <div style={{ flex: 1, height: '24px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    {phase > i && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(90deg, var(--accent-soft), var(--accent-border), transparent)`,
                        animation: 'flicker 2s ease-in-out infinite',
                      }} />
                    )}
                    {[...Array(8)].map((_, j) => (
                      <div key={j} style={{
                        position: 'absolute', bottom: 0, left: `${j * 12.5}%`, width: '8%',
                        height: `${20 + Math.sin(j * 1.2 + i) * 30}%`,
                        background: phase > i ? 'var(--accent)' : 'var(--border)',
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.7,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)' }}>
                    {i === 0 ? 'هادئ' : i === 1 ? 'غير ثابت داخلي' : 'عميق ومؤثر'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* تغيير الزهور */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">🌸</span> تغيير الزهور ليلاً</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', padding: '8px 0' }}>
              {[
                { t: '11:00', icon: flower.stage === 'completed' ? '🌺' : '🌸', label: 'تبدأ الدبول' },
                { t: '11:05', icon: '🌷', label: 'تتحول' },
                { t: '11:08', icon: '🌑', label: 'تنحو' },
                { t: '11:11', icon: phase >= 3 ? '✦' : '❋', label: 'ذروة التحول' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', opacity: phase > i ? 1 : 0.4 }}>
                  <div style={{ fontSize: '1.4rem', transition: 'all 0.5s' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.45rem', color: 'var(--accent)', fontFamily: 'monospace', marginTop: '3px' }}>{item.t}</div>
                  <div style={{ fontSize: '0.48rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.55rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              «الليل لا يرحم… لكنه يكشف.»
            </div>
          </div>
        </div>
      </div>

      {/* كيف يتغير النظام */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">⊛</span> كيف يتغير النظام مع الوقت؟</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { icon: '🖥️', label: 'الواجهة', desc: 'من نظيفة إلى منكسرة' },
              { icon: '🎨', label: 'اللون والإضاءة', desc: 'من هادئ إلى مظلم' },
              { icon: '🔊', label: 'الصوت', desc: 'من خفيف إلى مشوّش ومؤثر' },
              { icon: '📖', label: 'القصة', desc: 'من خفية إلى واضحة ومؤلمة' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '10px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '5px',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* اقتباس ختامي */}
      <div style={{
        padding: '14px 18px', textAlign: 'center',
        background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.8,
      }}>
        «اللا يرحم… لكنه يكشف.»<br/>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
          الهدف من التحول الليلي: خلق تجربة عاطفية عميقة وشخصية · تعزيز ارتباط المستخدم بـ Echo وقصتنا
          · استخدام الوقت الحقيقي كأداة سردية · مقاومة الألم والكشف والاستكشاف والتحول
        </span>
      </div>
    </div>
  );
};

export default NightTransformation;
