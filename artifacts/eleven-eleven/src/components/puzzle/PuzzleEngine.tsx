/**
 * PuzzleEngine.tsx — نظام الألغاز
 * يعرض اللغز النشط الحالي، التأثيرات، وأزرار مساعدات المتجر
 */

import React, { useState, useEffect } from 'react';
import { useGameStore, type ChapterId } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../ui/Icon';

type ShopActionFeedback = { type: 'success' | 'error' | 'info'; msg: string };

export const PuzzleEngine: React.FC<{ chapter?: ChapterId }> = ({ chapter }) => {
  const {
    puzzles, solvedPuzzles, totalPuzzles, chapters, time, world, actions, echo, shopPrices,
  } = useGameStore();

  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<ShopActionFeedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [activeTab, setActiveTab] = useState<ChapterId>(chapter || 'chapter_1');

  const activePuzzle = puzzles
    .filter(p => p.chapterId === activeTab && p.status === 'active')
    .sort((a, b) => a.difficulty - b.difficulty)[0];

  const solvedInChapter = puzzles.filter(p => p.chapterId === activeTab && (p.status === 'solved' || p.status === 'skipped')).length;

  const chapterColors: Record<ChapterId, string> = {
    chapter_1: '#c8785a',
    chapter_2: '#FF9800',
    chapter_3: '#5A8AAA',
    chapter_4: '#AA8B40',
    chapter_5: '#888',
  };

  const flash = (msg: string, type: ShopActionFeedback['type'] = 'info') => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSubmit = () => {
    if (!activePuzzle) return;
    setShowHint(false);
    const result = actions.solve(activePuzzle.id, answer);
    if (result.success) {
      flash(result.message, 'success');
      setAnswer('');
    } else {
      flash(result.message, 'error');
    }
  };

  const handleBuyHint = () => {
    if (!activePuzzle) return flash('لا يوجد لغز نشط', 'error');
    const price = shopPrices.hintPrice;
    if (echo.coins < price) return flash(`❌ تحتاج ${price} 🪙`, 'error');
    const res = actions.buyHint(activePuzzle.id);
    if (res.success) {
      flash(res.message || '💡 تم شراء التلميح', 'success');
      setShowHint(true);
    } else {
      flash(res.message, 'error');
    }
  };

  const handleSkip = () => {
    if (!activePuzzle) return flash('لا يوجد لغز نشط', 'error');
    const price = shopPrices.skipPrice;
    if (echo.coins < price) return flash(`❌ تحتاج ${price} 🪙 للتخطي`, 'error');
    const res = actions.skipPuzzle(activePuzzle.id);
    if (res.success) {
      flash(res.message, 'success');
      setShowHint(false);
    } else {
      flash(res.message, 'error');
    }
  };

  const handleReroll = () => {
    if (!activePuzzle) return flash('لا يوجد لغز نشط', 'error');
    const price = shopPrices.rerollPrice;
    if (echo.coins < price) return flash(`❌ تحتاج ${price} 🪙 للتبديل`, 'error');
    const res = actions.rerollPuzzle(activePuzzle.id);
    if (res.success) {
      flash(res.message || '🔄 تم تبديل اللغز', 'success');
      setShowHint(false);
    } else {
      flash(res.message, 'error');
    }
  };

  const glitchText = (text: string): React.ReactNode => {
    if (world.glitchLevel < 40) return text;
    return text.split('').map((c, i) =>
      Math.random() > 0.9
        ? <span key={i} style={{ opacity: 0.3, textDecoration: 'line-through' }}>{c}</span>
        : c,
    );
  };

  const hasActive = !!activePuzzle;

  return (
    <div className="puzzle-engine-system">
      <div className="chapter-tabs">
        {Object.entries(chapters).map(([id, ch]) => (
          <button
            key={id}
            className={`chapter-tab ${activeTab === id ? 'active' : ''} ${ch.unlocked ? '' : 'locked'}`}
            onClick={() => ch.unlocked && setActiveTab(id as ChapterId)}
            style={activeTab === id ? { borderColor: chapterColors[id as ChapterId], color: chapterColors[id as ChapterId] } : {}}
          >
            <span className="chapter-glyph">{ch.glyph}</span>
            <span className="chapter-name">{ch.title}</span>
            <span className="chapter-count">{solvedInChapter}/{ch.totalPuzzles}</span>
            {!ch.unlocked && <span className="chapter-lock">🔒</span>}
          </button>
        ))}
      </div>

      <div className="puzzle-active-area">
        {activePuzzle ? (
          <motion.div
            key={activePuzzle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="puzzle-active-card"
          >
            <div className="puzzle-meta">
              <span className="puzzle-difficulty" style={{ color: chapterColors[activeTab] }}>
                {'⬤'.repeat(activePuzzle.difficulty)}{'○'.repeat(4 - activePuzzle.difficulty)}
              </span>
              <span className="puzzle-chapter-badge" style={{ background: chapterColors[activeTab] + '22', color: chapterColors[activeTab] }}>
                {chapters[activeTab]?.title || activeTab}
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
                  style={{ background: chapterColors[activeTab] + '22', borderColor: chapterColors[activeTab] + '44' }}
                >
                  ↵ حل
                </motion.button>
                <button className="puzzle-hint-btn" onClick={() => setShowHint(!showHint)}>
                  💡 {showHint ? 'إخفاء' : 'تلميح'}
                </button>
              </div>
            </div>

            <div className="puzzle-shop-actions">
              <button
                className="shop-action-btn"
                onClick={handleBuyHint}
                disabled={!hasActive || echo.coins < shopPrices.hintPrice}
                title={`التلميح القوي — ${shopPrices.hintPrice} 🪙`}
              >
                <Icon name="coin" className="h-4 w-4 text-amber-500" />
                <span>💡 تلميح قوي</span>
                <span className="shop-action-price">{shopPrices.hintPrice} 🪙</span>
              </button>
              <button
                className="shop-action-btn"
                onClick={handleSkip}
                disabled={!hasActive || echo.coins < shopPrices.skipPrice}
                title={`تخطي اللغز — ${shopPrices.skipPrice} 🪙`}
              >
                <Icon name="coin" className="h-4 w-4 text-amber-500" />
                <span>⏭ تخطي</span>
                <span className="shop-action-price">{shopPrices.skipPrice} 🪙</span>
              </button>
              <button
                className="shop-action-btn"
                onClick={handleReroll}
                disabled={!hasActive || echo.coins < shopPrices.rerollPrice}
                title={`تبديل اللغز — ${shopPrices.rerollPrice} 🪙`}
              >
                <Icon name="coin" className="h-4 w-4 text-amber-500" />
                <span>🔄 تبديل</span>
                <span className="shop-action-price">{shopPrices.rerollPrice} 🪙</span>
              </button>
            </div>

            <AnimatePresence>
              {showHint && hasActive && (
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
              {solvedInChapter >= (chapters[activeTab]?.totalPuzzles || 0)
                ? '✅ جميع الألغاز محلولة!'
                : '🔒 افتح الفصل السابق أولاً'}
            </p>
          </div>
        )}
      </div>

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
