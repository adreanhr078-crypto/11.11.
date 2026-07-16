/**
 * WishesSection.tsx — قسم الأمنيات
 */
import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

export const WishesSection: React.FC = () => {
  const { wishes, actions, echo } = useGameStore();
  const [newWish, setNewWish] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!newWish.trim()) return;
    actions.addWish(newWish.trim());
    setNewWish('');
    setAdding(false);
  };

  const active    = wishes.filter(w => w.status === 'active');
  const completed = wishes.filter(w => w.status === 'completed');

  const WISH_ICONS = ['✦', '◆', '❋', '◈', '⬡', '✿', '◉', '⊛'];

  return (
    <div className="wishes-section">
      <div className="section-header">
        <div>
          <div className="section-title">✦ الأمنيات</div>
          <div className="section-subtitle">أمنياتك توجّه Echo على مسار القصة للنمو</div>
        </div>
        <button className="section-action" onClick={() => setAdding(a => !a)}>
          {adding ? '✕ إلغاء' : '+ أمنية جديدة'}
        </button>
      </div>

      {/* إضافة أمنية */}
      {adding && (
        <div className="card" style={{ border: '1px dashed var(--accent-border)', animation: 'scaleIn 0.2s ease' }}>
          <div className="card-body">
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              اكتب أمنيتك — ستوجّه Echo لاحتضان قصتك للنمو
            </div>
            <textarea
              className="echo-chat-input"
              placeholder="أتمنى أن…"
              value={newWish}
              onChange={e => setNewWish(e.target.value)}
              rows={2}
              style={{ resize: 'none', width: '100%', marginBottom: '8px' }}
            />
            <button className="echo-chat-send" onClick={handleAdd} disabled={!newWish.trim()}>
              أضف الأمنية ✦
            </button>
          </div>
        </div>
      )}

      {/* شجرة الأمنيات */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">⬡</span> شجرة الأمنيات</div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            مهام عاطفية تعكس رغبات Echo وتؤثر على مسار القصة
          </div>
        </div>
        <div className="card-body">
          {/* رسم توضيحي للشجرة */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            {[
              { icon: '◈', label: 'الدردشة', sub: 'حل ألغاز يفتح\nذكريات جديدة' },
              { icon: '→', label: '', sub: '' },
              { icon: '✦', label: 'الأمنيات', sub: 'أمنية محققة تنبع\nمن نمو القصة' },
              { icon: '→', label: '', sub: '' },
              { icon: '❋', label: 'الزهور', sub: 'الزهور تعكس نمو\nالأمنيات والعلاقة' },
              { icon: '→', label: '', sub: '' },
              { icon: '◉', label: 'النهايات', sub: 'اختياراتك وتفاعلاتك\nتحدد النهاية' },
            ].map((item, i) => (
              item.icon === '→' ? (
                <div key={i} style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>→</div>
              ) : (
                <div key={i} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.48rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{item.sub}</div>
                </div>
              )
            ))}
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
            تغذية راجعة مستمرة — اختياراتك وتفاعلاتك تُعيد تشكيل القصة في كل لحظة
          </div>
        </div>
      </div>

      {/* أمنيات نشطة */}
      {active.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--accent)' }}>✦</span> الأمنيات النشطة ({active.length})
          </div>
          <div className="wishes-grid">
            {active.map((w, i) => (
              <div key={w.id} className="wish-card">
                <div className="wish-card-header">
                  <div className="wish-card-icon">{WISH_ICONS[i % WISH_ICONS.length]}</div>
                  <div className="wish-card-status active">نشطة</div>
                </div>
                <div className="wish-card-text">{w.text}</div>
                <div className="wish-card-date">{w.createdAt}</div>
                <div className="pbar-track">
                  <div className="pbar-fill teal" style={{ width: `${w.progress}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.52rem', color: 'var(--text-muted)' }}>
                  <span>التأثير: {w.storyImpact > 25 ? 'عالٍ' : w.storyImpact > 15 ? 'متوسط' : 'خفيف'}</span>
                  <span>{Math.round(w.progress)}%</span>
                </div>
                <button
                  onClick={() => actions.completeWish(w.id)}
                  style={{
                    marginTop: '2px', padding: '5px', fontSize: '0.55rem',
                    background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--accent)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >
                  تحقق الأمنية ✓
                </button>
              </div>
            ))}
            <div className="wish-add-card" onClick={() => setAdding(true)} style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>+</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>أضف أمنية جديدة</div>
              <div style={{ fontSize: '0.52rem', color: 'var(--text-faint)', textAlign: 'center' }}>
                أمنيات صغيرة تصنع أهدافاً وجدانية فاعلة للتحقيق والتحول
              </div>
            </div>
          </div>
        </div>
      )}

      {/* أمنيات متحققة */}
      {completed.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✓</span> متحقق ({completed.length})
          </div>
          <div className="wishes-grid">
            {completed.map((w, i) => (
              <div key={w.id} className="wish-card completed">
                <div className="wish-card-header">
                  <div className="wish-card-icon" style={{ opacity: 0.7 }}>{WISH_ICONS[i % WISH_ICONS.length]}</div>
                  <div className="wish-card-status completed">✓ تحقق</div>
                </div>
                <div className="wish-card-text" style={{ textDecoration: 'line-through', opacity: 0.6 }}>{w.text}</div>
                <div className="wish-card-impact">
                  <span>⬆</span> أثّر بـ {w.storyImpact} على مسار القصة
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* حالة فارغة */}
      {wishes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.5 }}>✦</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>لا توجد أمنيات بعد</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            أضف أمنيتك الأولى — Echo يريد أن يساعدك في تحقيقها
          </div>
          <button className="echo-chat-send" onClick={() => setAdding(true)}>
            أضف أولى أمنياتك ✦
          </button>
        </div>
      )}

      {/* رسالة Echo */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius)',
        fontSize: '0.65rem',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 1.7,
      }}>
        «كل ذكرى عائدة… تقربني من نفسي.» — Echo<br/>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>ثقة: {echo.trust}% · أمل: {echo.hope}%</span>
      </div>
    </div>
  );
};

export default WishesSection;
