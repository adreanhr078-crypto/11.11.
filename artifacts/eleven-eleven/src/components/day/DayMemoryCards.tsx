/**
 * DayMemoryCards — بطاقات الذكريات اليومية للنظام النهاري
 * تستند إلى الصور 02, 03, 04, 07
 * كل يوم تظهر ذكرى جديدة، بعضها مفتوح وبعضها مقفل
 */

import React from "react";

interface Memory {
  id: string;
  title: string;
  date: string;
  description: string;
  isUnlocked: boolean;
  isNew: boolean;
  progress?: number;
}

const SAMPLE_MEMORIES: Memory[] = [
  { id: "m1", title: "غرفة قديمة", date: "01 مايو", description: "شيء مألوف في الغرفة... لكنني لا أتذكر لماذا", isUnlocked: true, isNew: false, progress: 12 },
  { id: "m2", title: "صوت من الماضي", date: "02 مايو", description: "صوت امرأة تناديني... كانت دافئة", isUnlocked: true, isNew: true, progress: 35 },
  { id: "m3", title: "لقاء تحت المطر", date: "03 مايو", description: "كنت أقف تحت المطر... ثم جاءت هي", isUnlocked: true, isNew: true, progress: 58 },
  { id: "m4", title: "رسالة غير مرسلة", date: "04 مايو", description: "كتبت رسالة... لكنني لم أرسلها أبداً", isUnlocked: true, isNew: false, progress: 22 },
  { id: "m5", title: "الزهور البيضاء", date: "05 مايو", description: "حقل مليء بالزهور البيضاء... كان جميلاً", isUnlocked: false, isNew: false },
  { id: "m6", title: "أول لقاء في الحقل", date: "—", description: "ذكرى لم تُفتح بعد", isUnlocked: false, isNew: false },
  { id: "m7", title: "حلم الانهيار", date: "—", description: "ذكرى مقفلة", isUnlocked: false, isNew: false },
  { id: "m8", title: "صوت في الظلام", date: "—", description: "ذكرى مقفلة", isUnlocked: false, isNew: false },
];

interface DayMemoryCardsProps {
  memories?: Memory[];
  discoveredCount?: number;
  totalCount?: number;
}

export const DayMemoryCards: React.FC<DayMemoryCardsProps> = ({
  memories = SAMPLE_MEMORIES,
  discoveredCount = 4,
  totalCount = 8,
}) => {
  const unlockedMemories = memories.filter(m => m.isUnlocked);
  const lockedMemories = memories.filter(m => !m.isUnlocked);

  return (
    <div className="day-memories" dir="rtl">
      <div className="memories-header">
        <h3 className="memories-title">الذكريات اليومية</h3>
        <div className="memories-stats">
          <span className="memories-count">مكتشفة {discoveredCount} / {totalCount}</span>
        </div>
      </div>

      {/* الذاكرة الرئيسية لليوم */}
      {unlockedMemories.filter(m => m.isNew).slice(0, 1).map(memory => (
        <div key={memory.id} className="memory-today-card glass-card glass-card-glow">
          <div className="memory-today-badge">جديد</div>
          <div className="memory-today-date">{memory.date}</div>
          <h4 className="memory-today-title">{memory.title}</h4>
          <p className="memory-today-desc">{memory.description}</p>
          {memory.progress !== undefined && (
            <div className="memory-today-progress">
              <div className="memory-progress-label">
                <span>استرجاع</span>
                <span>{memory.progress}%</span>
              </div>
              <div className="memory-progress-track">
                <div className="memory-progress-fill" style={{ width: `${memory.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* باقي الذكريات */}
      <div className="memories-grid">
        {unlockedMemories.map(memory => (
          <div key={memory.id} className={`memory-card ${memory.isNew ? "memory-new" : ""}`}>
            <div className="memory-card-header">
              <span className="memory-card-date">{memory.date}</span>
              {memory.isNew && <span className="memory-new-badge">جديد</span>}
            </div>
            <h4 className="memory-card-title">{memory.title}</h4>
            <p className="memory-card-desc">{memory.description}</p>
            {memory.progress !== undefined && (
              <div className="memory-mini-progress">
                <div className="memory-mini-fill" style={{ width: `${memory.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* الذكريات المقفلة */}
      <div className="memories-locked-section">
        <h4 className="locked-title">ذكريات مقفلة</h4>
        <div className="locked-grid">
          {lockedMemories.map(memory => (
            <div key={memory.id} className="memory-card memory-locked">
              <div className="locked-icon">🔒</div>
              <h4 className="memory-card-title locked-text">{memory.title}</h4>
              <p className="memory-card-desc locked-text">يكتشف بعد حل الألغاز</p>
            </div>
          ))}
        </div>
      </div>

      <button className="memories-view-all">
        عرض كل الذكريات ←
      </button>
    </div>
  );
};