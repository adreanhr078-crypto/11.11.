/**
 * FlowerSystem.tsx — نظام الأزهار التفاعلي
 * 5 مراحل نمو + نظام اضمحلال + طبقة مخفية
 */

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion } from 'framer-motion';

const FLOWER_ICONS: Record<string, string> = {
  seed: '🌱', sprout: '🌿', bloom: '🌷',
  flourish: '🌸', completed: '🌺', corrupted: '💀',
};

const FLOWER_NAMES: Record<string, string> = {
  seed: 'بذرة', sprout: 'برعم', bloom: 'زهرة صغيرة',
  flourish: 'زهرة متفتحة', completed: 'زهرة كاملة', corrupted: 'فاسدة',
};

const FLOWER_DESCRIPTIONS: Record<string, string> = {
  seed: 'البداية... كل شيء يبدأ من بذرة صغيرة.',
  sprout: 'النمو يبدأ. الجذور تمتد نحو الحقيقة.',
  bloom: 'تفتح الزهرة. تبدأ الذكريات بالعودة.',
  flourish: 'الزهرة في أوج جمالها. الذاكرة تستقر.',
  completed: 'اكتملت الزهرة. الطبقة المخفية تفتح.',
  corrupted: 'الزهرة ذبلت. الفساد تغلب على النمو.',
};

export const FlowerSystem: React.FC = () => {
  const { flower, echo, solvedPuzzles } = useGameStore();

  const icon = FLOWER_ICONS[flower.stage] || '🌱';
  const name = FLOWER_NAMES[flower.stage] || 'بذرة';
  const desc = FLOWER_DESCRIPTIONS[flower.stage] || '';
  const isCorrupted = flower.stage === 'corrupted';

  return (
    <div className="flower-system-container">
      <div className="flower-visual-area">
        <motion.div
          className={`flower-main-icon ${isCorrupted ? 'corrupted' : ''} ${flower.stage === 'completed' ? 'completed' : ''}`}
          animate={{
            scale: [1, 1.05, 1],
            rotate: isCorrupted ? [0, 5, -5, 0] : [0, 3, -3, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span style={{ fontSize: '4rem', filter: isCorrupted ? 'grayscale(1)' : 'none' }}>
            {icon}
          </span>
        </motion.div>
        <h3 className="flower-stage-name">{name}</h3>
        <p className="flower-stage-desc">{desc}</p>
      </div>

      <div className="flower-stages-row">
        {['seed', 'sprout', 'bloom', 'flourish', 'completed'].map((stage, i) => {
          const stageIcon = FLOWER_ICONS[stage];
          const isActive = i <= ['seed', 'sprout', 'bloom', 'flourish', 'completed'].indexOf(flower.stage);
          const isCurrent = stage === flower.stage;
          return (
            <div key={stage} className={`flower-stage-dot ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
              <span className="stage-icon">{stageIcon}</span>
              <span className="stage-pct">{i * 25}%</span>
            </div>
          );
        })}
      </div>

      <div className="flower-progress-section">
        <div className="progress-header">
          <span>نمو الزهرة</span>
          <span>{Math.round(flower.growth)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${flower.growth}%`,
              background: isCorrupted
                ? '#f44336'
                : `linear-gradient(90deg, #4CAF50, #c8785a)`,
            }}
          />
        </div>
        {flower.decay > 0 && (
          <>
            <div className="progress-header" style={{ marginTop: '0.5rem' }}>
              <span style={{ color: '#f44336' }}>اضمحلال</span>
              <span style={{ color: '#f44336' }}>{Math.round(flower.decay)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${flower.decay}%`, background: '#f44336' }} />
            </div>
          </>
        )}
      </div>

      <div className="flower-stats">
        <div className="flower-stat">
          <span>ألغاز محلولة</span>
          <span>{solvedPuzzles}</span>
        </div>
        <div className="flower-stat">
          <span>ذاكرة</span>
          <span>{echo.memoryStability}%</span>
        </div>
        <div className="flower-stat">
          <span>طبقة مخفية</span>
          <span>{flower.hiddenUnlocked ? '🔓' : '🔒'}</span>
        </div>
      </div>

      {flower.hiddenUnlocked && (
        <div className="hidden-layer-unlocked">
          🔓 تم فتح الطبقة السردية المخفية!
        </div>
      )}
    </div>
  );
};

export default FlowerSystem;