/**
 * MemorySystem.tsx — نظام الذاكرة والتأريخ
 * يعرض شظايا الذاكرة، الأحداث الزمنية، والسجلات المفتوحة
 */

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion } from 'framer-motion';

export const MemorySystem: React.FC = () => {
  const { memory, echo, time } = useGameStore();

  return (
    <div className="memory-system-container">
      <div className="memory-header">
        <h3>💠 الذاكرة</h3>
        <span className="memory-counter">
          {memory.fragmentsCollected} / {memory.totalFragments} شظية
        </span>
      </div>

      <div className="memory-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(memory.fragmentsCollected / memory.totalFragments) * 100}%`,
              background: echo.corruption > 50 ? 'linear-gradient(90deg, #f44336, #FF9800)' : 'linear-gradient(90deg, #5A8AAA, #c8785a)',
            }}
          />
        </div>
        <div className="memory-status">
          <span>حالة الذاكرة: {echo.memoryStability}%</span>
          {echo.corruption > 30 && <span style={{ color: '#f44336' }}>⚠ تلف: {echo.corruption}%</span>}
        </div>
      </div>

      {/* الأحداث الزمنية */}
      <div className="memory-timeline">
        <h4>📜 الأحداث</h4>
        <div className="timeline-events">
          {memory.timelineEvents.length === 0 ? (
            <p className="timeline-empty">حل الألغاز لتسجيل الأحداث...</p>
          ) : (
            [...memory.timelineEvents].reverse().slice(0, 20).map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`timeline-event ${event.type}`}
              >
                <span className="event-time">{event.time}</span>
                <span className="event-desc">{event.description}</span>
                <span className={`event-phase ${event.phase !== 'day' ? 'night' : ''}`}>
                  {event.phase}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* السجلات المفتوحة */}
      {memory.logsUnlocked.length > 0 && (
        <div className="memory-logs">
          <h4>📖 سجلات مكتشفة</h4>
          <div className="logs-list">
            {memory.logsUnlocked.map((log, i) => (
              <div key={i} className="log-entry">
                <span className="log-icon">📄</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemorySystem;