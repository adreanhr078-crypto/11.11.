/**
 * OverviewSection.tsx — الرؤية الشاملة
 */
import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const OverviewSection: React.FC = () => {
  const { echo, solvedPuzzles, totalPuzzles, flower, memory, achievements, wishes, time } = useGameStore();

  const CHARACTERS = [
    { icon: '👦', name: 'Echo', role: 'الوعي الرئيسي · الضحية', color: 'var(--accent)', bio: 'طفلٌ سُكب وعيه داخل النظام. يبدأ بذاكرة مشوّشة ويستعيدها معك.' },
    { icon: '👨‍🔬', name: 'كينجا', role: 'الأب · المهندس', color: '#AA5533', bio: 'العالم الذي بنى البوابة. مهووس بنقل الوعي البشري. خانة الغيرة.' },
    { icon: '👩', name: 'لينا', role: 'الأم · الإشارة المفقودة', color: '#7AACC0', bio: 'رسائلها المكسورة تصل من خارج النظام محاولةً إنقاذ ابنها.' },
  ];

  const SYSTEMS = [
    { icon: '◈', name: 'Echo Mind', desc: 'محادثة داخلية تعكس حالة Echo النفسية والذاكرية والمشاعر.', pct: Math.min(100, echo.trust), label: `ثقة ${echo.trust}%` },
    { icon: '⬡', name: 'الألغاز', desc: 'من ألغاز متنوعة لاكتشاف ذكريات قيّمة تبني قصة Echo.', pct: Math.round((solvedPuzzles/Math.max(1,totalPuzzles))*100), label: `${solvedPuzzles} من ${totalPuzzles}` },
    { icon: '✦', name: 'الأمنيات', desc: 'أمنيات صغيرة تصنع أهدافاً وجدانية فاعلة للتحقيق والتحول.', pct: wishes.length > 0 ? Math.round((wishes.filter(w=>w.status==='completed').length/wishes.length)*100) : 0, label: `${wishes.length} أمنية` },
    { icon: '◫', name: 'الذكريات', desc: 'استرجع ذكريات من الماضي عبر حل الألغاز وتقدّم الإنجازات.', pct: memory.totalFragments > 0 ? Math.round((memory.fragmentsCollected/memory.totalFragments)*100) : 0, label: `${memory.fragmentsCollected}/${memory.totalFragments}` },
    { icon: '❋', name: 'الأزهار', desc: 'تنمو مع تقدمك وتعكس حالة النمو العاطفي والداخلي.', pct: Math.round(flower.growth), label: `${Math.round(flower.growth)}%` },
    { icon: '🎵', name: 'الصوت', desc: 'موسيقى محيطية تتغير بكل مرحلة وتساعد التفاعلات والتفاصيل.', pct: 65, label: 'متاح دائماً' },
    { icon: '◉', name: 'حفظ التقدم', desc: 'يتم الحفظ التلقائي في كل مرحلة مهمة ويمكن بناء التقدم في أي وقت.', pct: 100, label: 'محفوظ' },
  ];

  const overallPct = Math.round((solvedPuzzles/Math.max(1,totalPuzzles))*100);

  return (
    <div className="overview-section">
      <div className="section-header">
        <div>
          <div className="section-title">⊛ الرؤية الشاملة</div>
          <div className="section-subtitle">هذه ليست مجرد قصة… إنها أنت، وذكرياتك، والاختيارات التي ستشكّل نهايتك.</div>
        </div>
      </div>

      {/* بطل الرؤية */}
      <div className="overview-hero">
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', marginBottom: '6px' }}>
            ما هو نظام 11.11؟
          </div>
          <div className="overview-logline">
            رحلة عاطفية تتبع شاباً يُذكر باسمه Echo في رحلة لاستعادة ذاكرته المفقودة.
            يتغير النظام بين النهار والليل، ويؤثر تفاعلاتك وخياراتك واستذكاراتك النفسية
            على الذكريات التي يسترجعها Echo وعلى المشاعر المتأثرة والنهاية التي يصل إليها.
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['قصة عميقة','نظام ديناميكي','نهايات متعددة','استعادة الذكريات','تأثير عاطفي','تصميم سينمائي'].map(tag => (
              <span key={tag} style={{
                fontSize: '0.55rem', padding: '3px 8px',
                background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                borderRadius: '99px', color: 'var(--accent)',
              }}>{tag}</span>
            ))}
          </div>

          {/* الهدف من التجربة */}
          <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { icon: '💭', label: 'استعادة الذكريات', desc: 'ربط الذكريات المتناثرة وبناء الصورة الكاملة بالكشف' },
              { icon: '❤️', label: 'التأثير العاطفي', desc: 'كل قرار يعكس حالة Echo النفسية ومدى تعاطفك واهتمامك' },
              { icon: '🔀', label: 'نهايات متعددة', desc: 'نهايات مختلفة تعتمد على اختياراتك وتفاعلاتك واستعادتك' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.icon}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* الشخصيات */}
        <div className="overview-chars">
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>الشخصيات الرئيسية</div>
          {CHARACTERS.map((c) => (
            <div key={c.name} className="char-chip">
              <div className="char-chip-icon">{c.icon}</div>
              <div>
                <div className="char-chip-name">{c.name}</div>
                <div className="char-chip-role" style={{ color: c.color }}>{c.role}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{c.bio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* حلقة اللعب */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">🔄</span> حلقة اللعب الأساسية</div>
        </div>
        <div className="card-body">
          <div className="game-loop-diagram">
            {[
              { icon: '🤝', label: 'تفاعل', sub: 'الدردشة والرسائل' },
              { arrow: true },
              { icon: '⬡', label: 'حل الألغاز', sub: 'استعادة الذكريات' },
              { arrow: true },
              { icon: '❋', label: 'تنمو الأزهار', sub: 'نمو داخلي' },
              { arrow: true },
              { icon: '◐', label: 'تأثير', sub: 'على Echo والإنجازات' },
              { arrow: true },
              { icon: '🏁', label: 'النهايات', sub: 'تتشكل من خياراتك' },
            ].map((item: any, i) =>
              item.arrow
                ? <div key={i} className="loop-arrow">→</div>
                : (
                  <div key={i} className="loop-step">
                    <div className="loop-step-icon">{item.icon}</div>
                    <div className="loop-step-name">{item.label}</div>
                    <div style={{ fontSize: '0.45rem', color: 'var(--text-faint)', textAlign: 'center', marginTop: '1px' }}>{item.sub}</div>
                  </div>
                )
            )}
          </div>
        </div>
      </div>

      {/* جميع الأنظمة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {SYSTEMS.map((s) => (
          <div key={s.name} className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--accent)' }}>{s.icon}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</span>
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
            <div>
              <div className="pbar-track">
                <div className="pbar-fill accent" style={{ width: `${s.pct}%` }} />
              </div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '3px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ما يميز 11.11 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">◆</span> ما يميز 11.11</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '❤️', label: 'قصة عاطفية عميقة تتفاعل مع التجربة', color: '#E877A0' },
              { icon: '◑', label: 'نظام ديناميكي يتغير بين النهار والليل', color: '#4A8FA8' },
              { icon: '⬡', label: 'ألغاز الكامل بين الألغاز والقصة والمشاعر', color: '#C49A3C' },
              { icon: '🎨', label: 'تصميم فني سينمائي وموسيقى فريدة', color: '#7AACC0' },
              { icon: '🔀', label: 'نهايات متعددة تعتمد على خياراتك واستذكاراتك', color: '#4CAF85' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '1.2rem', color: f.color }}>{f.icon}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* لوحة الإنجاز */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">◉</span> لوحة الإنجاز</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <StatBlock icon="⬡" val={`${overallPct}%`} label="إجمالي التقدم" />
            <StatBlock icon="◫" val={`${memory.fragmentsCollected}/${memory.totalFragments}`} label="الذكريات المستعادة" />
            <StatBlock icon="✦" val={`${wishes.filter(w=>w.status==='completed').length}/${wishes.length || 0}`} label="الأمنيات المحققة" />
            <StatBlock icon="◉" val={`${achievements.filter(a=>a.unlocked).length}`} label="الإنجازات" />
            <StatBlock icon="📅" val={`${time.dayCycle}`} label="أيام الاستمرار" />
          </div>
        </div>
      </div>

      {/* اقتباس ختامي */}
      <div style={{
        padding: '16px 20px', textAlign: 'center', background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)',
        fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.8,
      }}>
        «هذه ليست مجرد لعبة… إنها أنت، وذكرياتك، والاختيارات التي ستشكّل نهايتك.»
        <div style={{ marginTop: '4px', fontSize: '0.55rem', color: 'var(--text-muted)' }}>— 11.11 · رحلة الذاكرة</div>
      </div>
    </div>
  );
};

const StatBlock: React.FC<{ icon: string; val: string; label: string }> = ({ icon, val, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '10px 6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', textAlign: 'center',
  }}>
    <span style={{ fontSize: '1rem', color: 'var(--accent)' }}>{icon}</span>
    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{val}</span>
    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

export default OverviewSection;
