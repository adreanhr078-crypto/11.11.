/**
 * NightMemoryShards — شظايا الذاكرة للنظام الليلي
 * تستند إلى الصور 01, 11, 13
 * شظايا متكسرة، بعضها مكشوف وبعضها مقفل، بأجواء داكنة وحمراء
 */

import React from "react";

interface MemoryShard {
  id: string;
  title: string;
  description: string;
  progress: number;
  isUnlocked: boolean;
  isNew: boolean;
}

const SAMPLE_SHARDS: MemoryShard[] = [
  { id: "s1", title: "غرفة قديمة", description: "شيء مألوف... لكن مشوه", progress: 12, isUnlocked: true, isNew: false },
  { id: "s2", title: "صوت من الماضي", description: "همسات في الظلام", progress: 35, isUnlocked: true, isNew: true },
  { id: "s3", title: "لقاء تحت المطر", description: "كانت تقف هناك... تنتظر", progress: 58, isUnlocked: true, isNew: true },
  { id: "s4", title: "رسالة غير مرسلة", description: "لم أجرؤ على إرسالها", progress: 22, isUnlocked: true, isNew: false },
  { id: "s5", title: "الزهور البيضاء", description: "تحولت إلى حمراء", progress: 0, isUnlocked: false, isNew: false },
  { id: "s6", title: "???", description: "شظية مجهولة", progress: 0, isUnlocked: false, isNew: false },
];

interface NightMemoryShardsProps {
  shards?: MemoryShard[];
  discoveredCount?: number;
  totalCount?: number;
}

export const NightMemoryShards: React.FC<NightMemoryShardsProps> = ({
  shards = SAMPLE_SHARDS,
  discoveredCount = 4,
  totalCount = 6,
}) => {
  return (
    <div className="night-shards" dir="rtl">
      <div className="shards-header">
        <h3 className="shards-title">شظايا الذاكرة</h3>
        <span className="shards-count">مكتشفة {discoveredCount}/{totalCount}</span>
      </div>

      <div className="shards-grid">
        {shards.map((shard) => (
          <div key={shard.id} className={`shard-card ${shard.isUnlocked ? "shard-unlocked" : "shard-locked"} ${shard.isNew ? "shard-new" : ""}`}>
            {shard.isNew && <div className="shard-new-badge">جديد</div>}
            
            <div className="shard-icon">
              {shard.isUnlocked ? "💠" : "🔒"}
            </div>
            
            <h4 className="shard-title">{shard.title}</h4>
            <p className="shard-desc">{shard.description}</p>
            
            {shard.isUnlocked && (
              <div className="shard-progress">
                <div className="shard-progress-track">
                  <div className="shard-progress-fill" style={{ width: `${shard.progress}%` }} />
                </div>
                <span className="shard-progress-value">{shard.progress}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="shards-view-all">
        عرض كل الشظايا ←
      </button>
    </div>
  );
};