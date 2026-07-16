/**
 * WishBoard — لوحة الأمنيات للنظام النهاري
 * تستند إلى الصور 02, 03, 07
 * الأمنيات تؤثر على مسار القصة والنهايات
 */

import React from "react";

interface Wish {
  id: string;
  title: string;
  description: string;
  priority: "عالية" | "متوسطة" | "منخفضة";
  progress: number; // 0-100
  isHidden: boolean;
  isActive: boolean;
}

const SAMPLE_WISHES: Wish[] = [
  { id: "w1", title: "أريد أن أتذكر", description: "استعادة الذكريات المفقودة", priority: "عالية", progress: 60, isHidden: false, isActive: true },
  { id: "w2", title: "أريد أن أغفر", description: "مسامحة الماضي", priority: "عالية", progress: 30, isHidden: false, isActive: true },
  { id: "w3", title: "أريد أن أعود", description: "العودة إلى البداية", priority: "متوسطة", progress: 15, isHidden: false, isActive: true },
  { id: "w4", title: "أريد السلام", description: "راحة البال الدائمة", priority: "عالية", progress: 0, isHidden: false, isActive: false },
  { id: "w5", title: "أريد الحرية", description: "التحرر من القيود", priority: "متوسطة", progress: 0, isHidden: false, isActive: false },
  { id: "w6", title: "أريد قضاء يوم هادئ مع لينا", description: "لحظة دافئة مع من أحب", priority: "منخفضة", progress: 0, isHidden: true, isActive: false },
  { id: "w7", title: "أريد أن أفهم ماضي", description: "فهم الحقيقة كاملة", priority: "عالية", progress: 0, isHidden: false, isActive: false },
  { id: "hidden", title: "???", description: "أمنية مخفية", priority: "عالية", progress: 0, isHidden: true, isActive: false },
];

interface WishBoardProps {
  wishes?: Wish[];
  totalProgress?: number;
  activeCount?: number;
}

export const WishBoard: React.FC<WishBoardProps> = ({
  wishes = SAMPLE_WISHES,
  totalProgress = 37,
  activeCount = 3,
}) => {
  const visibleWishes = wishes.filter(w => !w.isHidden);
  const hiddenCount = wishes.filter(w => w.isHidden).length;

  return (
    <div className="wish-board" dir="rtl">
      <div className="wish-header">
        <h3 className="wish-title">الأمنيات</h3>
        <div className="wish-stats">
          <span className="wish-active-count">نشطة: {activeCount}</span>
          <span className="wish-total-progress">التقدم: {totalProgress}%</span>
        </div>
      </div>

      {/* التقدم الكلي */}
      <div className="wish-overall-progress">
        <div className="wish-overall-label">
          <span>تقدم الأمنيات</span>
          <span>{totalProgress}%</span>
        </div>
        <div className="wish-overall-track">
          <div className="wish-overall-fill" style={{ width: `${totalProgress}%` }} />
        </div>
      </div>

      {/* بطاقات الأمنيات */}
      <div className="wish-cards">
        {visibleWishes.map((wish) => (
          <div key={wish.id} className={`wish-card ${wish.isActive ? "wish-active" : "wish-locked"}`}>
            <div className="wish-card-header">
              <span className="wish-card-title">{wish.title}</span>
              <span className={`wish-priority priority-${wish.priority === "عالية" ? "high" : wish.priority === "متوسطة" ? "medium" : "low"}`}>
                {wish.priority}
              </span>
            </div>
            <p className="wish-card-description">{wish.description}</p>
            {wish.isActive && (
              <div className="wish-card-progress">
                <div className="wish-card-progress-label">
                  <span>التقدم</span>
                  <span>{wish.progress}%</span>
                </div>
                <div className="wish-card-progress-track">
                  <div className="wish-card-progress-fill" style={{ width: `${wish.progress}%` }} />
                </div>
              </div>
            )}
            {!wish.isActive && (
              <span className="wish-locked-label">🔒 غير متاحة بعد</span>
            )}
          </div>
        ))}
        
        {/* الأمنيات المخفية */}
        {hiddenCount > 0 && (
          <div className="wish-card wish-hidden">
            <div className="wish-card-header">
              <span className="wish-card-title">???</span>
              <span className="wish-priority priority-high">مخفية</span>
            </div>
            <p className="wish-card-description">أمنية لم تُكتشف بعد... قد تغير كل شيء</p>
            <span className="wish-hidden-badge">{hiddenCount} أمنية مخفية</span>
          </div>
        )}
      </div>

      {/* اقتباس */}
      <div className="wish-quote">
        <p>"كل أمنية تحققها... تقربك من الحقيقة"</p>
      </div>
    </div>
  );
};