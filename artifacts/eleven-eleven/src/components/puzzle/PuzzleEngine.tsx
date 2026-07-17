/**
 * PuzzleEngine.tsx — نظام الألغاز (219 لغزاً)
 * يعرض اللغز النشط الحالي، التأثيرات، وشجرة التبعيات
 */

import React, { useState, useEffect } from 'react';
import { useGameStore, type EntityId } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const PuzzleEngine: React.FC<{ entity?: EntityId }> = ({ entity }) => {
  const { puzzles, solvedPuzzles, totalPuzzles, entities, time, world, actions } = useGameStore();
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [activeTab, setActiveTab] = useState<EntityId>(entity || 'echo');

  // الحصول على اللغز النشط للكيان المختار
  const activePuzzle = puzzles
    .filter(p => p.entity === activeTab && p.status === 'active')
    .sort((a, b) => a.difficulty - b.difficulty)[0];

  // إحصائيات الكيان
  const currentEntity = entities[activeTab];
  const solvedInEntity = puzzles.filter(p => p.entity === activeTab && p.status === 'solved').length;

  // ألوان الكيانات
  const entityColors: Record<EntityId, string> = {
    echo: '#c8785a',
    watcher: '#FF9800',
    signal: '#5A8AAA',
    architect: '#AA8B40',
  };

  const handleSubmit = () => {
    if (!activePuzzle) return;
    setShowHint(false);
    const result = actions.solve(activePuzzle.id, answer);
    
    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });
      setAnswer('');
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', msg: result.message });
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  // تأثير التشويش على النص
  const glitchText = (text: string) => {
    if (world.glitchLevel < 40) return text;
    return text.split('').map((c, i) => 
      Math.random() > 0.9 ? <span key={i} style={{ opacity: 0.3, textDecoration: 'line-through' }}>{c}</span> : c
    );
  };

  return (
    <div className="puzzle-engine-system">
      {/* شريط تبويب الكيانات */}
      <div className="entity-tabs">
        {(Object.entries(entities) as [EntityId, typeof entities.echo][]).map(([id, ent]) => (
          <button
            key={id}
            className={`entity-tab ${activeTab === id ? 'active' : ''} ${ent.unlocked ? '' : 'locked'}`}
            onClick={() => ent.unlocked && setActiveTab(id)}
            style={activeTab === id ? { borderColor: entityColors[id], color: entityColors[id] } : {}}
          >
            <span className="entity-glyph">{ent.glyph}</span>
            <span className="entity-name">{ent.name}</span>
            <span className="entity-count">{solvedInEntity}/{ent.totalPuzzles}</span>
            {!ent.unlocked && <span className="entity-lock">🔒</span>}
          </button>
        ))}
      </div>

      {/* اللغز النشط */}
      <div className="puzzle-active-area">
        {activePuzzle ? (
          <motion.div
            key={activePuzzle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="puzzle-active-card"
          >
            <div className="puzzle-meta">
              <span className="puzzle-difficulty" style={{ color: entityColors[activeTab] }}>
                {'⬤'.repeat(activePuzzle.difficulty)}{'○'.repeat(4 - activePuzzle.difficulty)}
              </span>
              <span className="puzzle-entity-badge" style={{ background: entityColors[activeTab] + '22', color: entityColors[activeTab] }}>
                {entities[activeTab].name}
              </span>
            </div>

            <p className="puzzle-question">{glitchText(activePuzzle.question)}</p>

            <div className="puzzle-input-area">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="..."
                className="puzzle-input"
                style={{ borderColor: feedback?.type === 'error' ? '#cc4444' : feedback?.type === 'success' ? '#4CAF50' : 'var(--accent-border)' }}
              />
              <div className="puzzle-actions">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="puzzle-submit-btn"
                  onClick={handleSubmit}
                  style={{ background: entityColors[activeTab] + '22', borderColor: entityColors[activeTab] + '44' }}
                >
                  ↵ حل
                </motion.button>
                <button className="puzzle-hint-btn" onClick={() => setShowHint(!showHint)}>
                  💡 {showHint ? 'إخفاء' : 'تلميح'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="puzzle-hint"
                >
                  💡 {activePuzzle.hint}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {feedback && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`puzzle-feedback ${feedback.type}`}
                >
                  {feedback.msg}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="puzzle-empty-state">
            <p>
              {solvedInEntity >= entities[activeTab].totalPuzzles
                ? '✅ جميع الألغاز محلولة!'
                : '🔒 افتح الألغاز السابقة أولاً'}
            </p>
          </div>
        )}
      </div>

      {/* شريط التقدم */}
      <div className="puzzle-progress-bar">
        <div className="progress-header">
          <span>التقدم</span>
          <span>{solvedPuzzles}/{totalPuzzles}</span>
        </div>
        <div className="progress-track-puzzle">
          <div
            className="progress-fill-puzzle"
            style={{ width: `${(solvedPuzzles / totalPuzzles) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PuzzleEngine;