/**
 * DayTimeline — الخط الزمني الصباحي للنظام النهاري
 * تستند إلى الصور 04, 05, 07
 * يعرض تدفق تجربة الصباح من 08:00 إلى 11:00
 */

import React from "react";

interface TimelineEvent {
  time: string;
  label: string;
  description: string;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
}

const SAMPLE_EVENTS: TimelineEvent[] = [
  { time: "08:00", label: "بداية اليوم", description: "استيقاظ النظام", icon: "🌅", isActive: false, isCompleted: true },
  { time: "08:15", label: "تذكّر يومي", description: "استرجاع الذاكرة اليومية", icon: "💭", isActive: false, isCompleted: true },
  { time: "08:45", label: "دردشة مع Echo", description: "محادثة صباحية هادئة", icon: "💬", isActive: true, isCompleted: false },
  { time: "09:15", label: "حل ألغاز", description: "تحديات الذاكرة", icon: "🧩", isActive: false, isCompleted: false },
  { time: "10:00", label: "ذاكرة", description: "كشف ذكرى جديدة", icon: "📖", isActive: false, isCompleted: false },
  { time: "10:30", label: "أمنيات صباحية", description: "تحديث الأمنيات", icon: "✨", isActive: false, isCompleted: false },
  { time: "11:00", label: "نظام الظهيرة", description: "استمرار الرحلة", icon: "☀️", isActive: false, isCompleted: false },
];

interface DayTimelineProps {
  events?: TimelineEvent[];
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  events = SAMPLE_EVENTS,
}) => {
  return (
    <div className="day-timeline" dir="rtl">
      <div className="timeline-header">
        <h3 className="timeline-title">الخط الزمني الصباحي</h3>
        <span className="timeline-subtitle">رحلة اليوم</span>
      </div>

      <div className="timeline-track">
        {/* الخط الرابط */}
        <div className="timeline-line" />

        {/* الأحداث */}
        <div className="timeline-events">
          {events.map((event, index) => (
            <div
              key={event.time}
              className={`timeline-event ${event.isCompleted ? "event-completed" : ""} ${event.isActive ? "event-active" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="timeline-dot-wrapper">
                <div className={`timeline-dot ${event.isCompleted ? "dot-done" : ""} ${event.isActive ? "dot-current" : ""}`}>
                  {event.isCompleted ? "✓" : event.isActive ? "◉" : "○"}
                </div>
              </div>
              <div className="timeline-content">
                <div className="timeline-event-header">
                  <span className="timeline-time">{event.time}</span>
                  <span className="timeline-icon">{event.icon}</span>
                </div>
                <h4 className="timeline-event-title">{event.label}</h4>
                <p className="timeline-event-desc">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ملخص اليوم */}
      <div className="timeline-summary">
        <div className="summary-item">
          <span className="summary-label">مكتمل</span>
          <span className="summary-value">{events.filter(e => e.isCompleted).length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">حالي</span>
          <span className="summary-value">{events.filter(e => e.isActive).length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">متبقي</span>
          <span className="summary-value">{events.filter(e => !e.isCompleted && !e.isActive).length}</span>
        </div>
      </div>
    </div>
  );
};