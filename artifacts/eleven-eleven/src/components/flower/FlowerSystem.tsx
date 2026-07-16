/**
 * FlowerSystem.tsx — نظام الأزهار المُجدَّد
 */

import React from 'react';
import { useGameStore } from '../../stores/gameStore';

const STAGES = ['seed','sprout','bloom','flourish','completed'];
const ICONS  = { seed:'🌱', sprout:'🌿', bloom:'🌷', flourish:'🌸', completed:'🌺', corrupted:'💀' } as Record<string,string>;
const NAMES  = { seed:'بذرة الروح', sprout:'برعم الأمل', bloom:'أول تفتح', flourish:'ازدهار الذاكرة', completed:'اكتمال الرحلة', corrupted:'ذبول' } as Record<string,string>;
const DESCS  = {
  seed:      'البداية… كل شيء يبدأ من بذرة صغيرة مخبأة في أعماق الذاكرة.',
  sprout:    'النمو يبدأ. الجذور تمتد نحو الحقيقة في أعماق النظام.',
  bloom:     'تفتح الزهرة. تبدأ الذكريات بالعودة، تدريجياً وببطء.',
  flourish:  'الزهرة في أوج جمالها. الذاكرة تستقر والقصة تتضح.',
  completed: 'اكتملت الزهرة. الطبقة المخفية تُفتح. الحقيقة تنتظر.',
  corrupted: 'الزهرة ذبلت… الفساد يتغلب على النمو.',
} as Record<string,string>;

const GROWTH_BG: Record<string, string> = {
  seed:      'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  sprout:    'linear-gradient(135deg, #DCEDC8, #AED581)',
  bloom:     'linear-gradient(135deg, #FCE4EC, #F48FB1)',
  flourish:  'linear-gradient(135deg, #F3E5F5, #CE93D8)',
  completed: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
  corrupted: 'linear-gradient(135deg, #212121, #424242)',
};

const DAY_FLOWERS = [
  { icon: '🌸', label: 'زهرة الثقة', val: 60 },
  { icon: '🌺', label: 'زهرة الصفاء', val: 85 },
];

export const FlowerSystem: React.FC = () => {
  const { flower, echo, solvedPuzzles, time } = useGameStore();

  const idx       = STAGES.indexOf(flower.stage);
  const icon      = ICONS[flower.stage]  || '🌱';
  const name      = NAMES[flower.stage]  || 'بذرة';
  const desc      = DESCS[flower.stage]  || '';
  const isCorr    = flower.stage === 'corrupted';
  const nightOn   = time.phaseIndex >= 1;

  const flowerBg  = nightOn
    ? 'linear-gradient(135deg, #0A1020, #1A0A28)'
    : GROWTH_BG[flower.stage] || GROWTH_BG.seed;

  return (
    <div className="flower-section">
      <div className="section-header">
        <div>
          <div className="section-title">❋ نظام الأزهار</div>
          <div className="section-subtitle">تنمو مع كل تقدم، وتتحول مع الليل</div>
        </div>
      </div>

      {/* العرض الرئيسي */}
      <div className="flower-main-display" style={{ background: flowerBg }}>
        <div className="flower-garden-bg" />
        <div className="flower-big-icon" style={{
          filter: isCorr ? 'grayscale(1) brightness(0.5)' :
                  nightOn ? 'drop-shadow(0 8px 24px rgba(200,50,50,0.4))' :
                           'drop-shadow(0 8px 24px rgba(232,160,191,0.5))',
        }}>
          {nightOn && !isCorr ? '🌑' : icon}
        </div>
        <div className="flower-stage-title" style={{ color: isCorr ? 'var(--danger)' : nightOn ? 'var(--danger)' : 'var(--accent)' }}>
          {nightOn ? 'الزهرة تتحول مع الليل…' : name}
        </div>
        <div className="flower-stage-desc">{desc}</div>

        <div className="flower-growth-bar">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
            <span>نمو الزهرة</span>
            <span>{Math.round(flower.growth)}%</span>
          </div>
          <div className="flower-growth-track">
            <div className="flower-growth-fill" style={{
              width: `${flower.growth}%`,
              background: isCorr ? 'linear-gradient(90deg, #D45050, #AA2020)' :
                          nightOn ? 'linear-gradient(90deg, #8B1A1A, #CC4444)' : undefined,
            }} />
          </div>
        </div>

        {flower.hiddenUnlocked && (
          <div style={{
            marginTop: '12px', padding: '8px 12px',
            background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.65rem', fontWeight: 700, color: 'white',
          }}>
            🔓 الطبقة السردية المخفية مُفتوحة!
          </div>
        )}
      </div>

      {/* مراحل الزهرة */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">❋</span> مراحل نمو الزهرة</div>
        </div>
        <div className="card-body">
          <div className="flower-stages-visual">
            {STAGES.map((s, i) => (
              <div key={s} className={`flower-stage-item${i < idx ? ' reached' : ''}${i === idx ? ' current' : ''}`}>
                <div className="flower-stage-emoji">{ICONS[s]}</div>
                <div className="flower-stage-pct">{i * 25}%</div>
                <div className="flower-stage-label">{NAMES[s].split(' ')[0]}</div>
              </div>
            ))}
          </div>
          {flower.decay > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--danger)', marginBottom: '4px' }}>
                <span>اضمحلال</span><span>{Math.round(flower.decay)}%</span>
              </div>
              <div className="pbar-track">
                <div className="pbar-fill danger" style={{ width: `${flower.decay}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dash-grid-main">
        {/* إحصائيات الزهرة */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">◫</span> بيانات الزهرة</div>
          </div>
          <div className="card-body">
            <div className="stat-grid">
              <StatChip icon="⬡" val={`${solvedPuzzles}`} label="ألغاز محلولة" />
              <StatChip icon="◈" val={`${echo.memoryStability}%`} label="استقرار الذاكرة" />
              <StatChip icon="💧" val={`${Math.round(flower.growth)}%`} label="نمو الزهرة" />
              <StatChip icon={flower.hiddenUnlocked ? '🔓' : '🔒'} val={flower.hiddenUnlocked ? 'مفتوح' : 'مقفول'} label="الطبقة المخفية" />
            </div>
          </div>
        </div>

        {/* زهرة اليوم */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">🌸</span> زهرة اليوم</div>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '2.5rem', filter: nightOn ? 'brightness(0.5) saturate(0.3)' : undefined }}>
                {nightOn ? '🌑' : icon}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginTop: '6px' }}>
                {nightOn ? 'الزهرة تنام مع الليل' : name}
              </div>
            </div>
            {DAY_FLOWERS.map((f, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>{f.icon} {f.label}</span><span>{f.val}%</span>
                </div>
                <div className="pbar-track">
                  <div className="pbar-fill pink" style={{ width: `${f.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* كيف تعمل الزهرة */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">⊛</span> كيف تنمو الزهرة؟</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { icon: '⬡', label: 'الألغاز', desc: 'كل لغز محلول يُنمّي الزهرة' },
              { icon: '◈', label: 'تفاعل Echo', desc: 'المحادثات تعزز النمو' },
              { icon: '✦', label: 'الأمنيات', desc: 'تحقيق الأمنيات يُزهر' },
              { icon: '◑', label: 'الليل', desc: 'الليل يُغير لون الزهرة' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '10px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '5px',
              }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{item.icon}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatChip: React.FC<{ icon: string; val: string; label: string }> = ({ icon, val, label }) => (
  <div className="stat-chip">
    <div style={{ fontSize: '1rem' }}>{icon}</div>
    <div className="stat-chip-value" style={{ fontSize: '0.85rem' }}>{val}</div>
    <div className="stat-chip-label">{label}</div>
  </div>
);

export default FlowerSystem;
