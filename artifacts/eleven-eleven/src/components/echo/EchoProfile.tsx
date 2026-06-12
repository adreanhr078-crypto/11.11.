/**
 * EchoProfile — بطاقة شخصية Echo مع حالتها النفسية
 * تستند إلى الصور 02, 03, 10 (النظام الصباحي وتطور الذاكرة)
 */

import React from "react";

interface EmotionMeter {
  label: string;
  value: number;
  color: string;
}

interface EchoProfileProps {
  name: string;
  age: number;
  phase: string;
  trustLevel: number;
  emotionalState: string;
  emotions: EmotionMeter[];
  isNight: boolean;
  lastMemory?: string;
}

const DEFAULT_EMOTIONS: EmotionMeter[] = [
  { label: "الخوف", value: 62, color: "#8B2A2A" },
  { label: "الوحدة", value: 80, color: "#5A4A8A" },
  { label: "الندم", value: 48, color: "#8B6A40" },
  { label: "الأمل", value: 33, color: "#4A8B5A" },
  { label: "الذاكرة", value: 71, color: "#4A6A8B" },
];

export const EchoProfile: React.FC<Partial<EchoProfileProps>> = ({
  name = "Echo",
  age = 17,
  phase = "مرتبك",
  trustLevel = 35,
  emotionalState = "فاقد للذاكرة",
  emotions = DEFAULT_EMOTIONS,
  isNight = false,
  lastMemory,
}) => {
  return (
    <div className={`echo-profile ${isNight ? "echo-profile-night" : "echo-profile-day"}`} dir="rtl">
      {/* صورة Echo */}
      <div className="echo-avatar-container">
        <div className="echo-avatar">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="35" r="18" fill={isNight ? "#2A1A1A" : "#E8D5C8"} />
            <circle cx="40" cy="35" r="16" fill={isNight ? "#1A0A0A" : "#F0E0D0"} />
            <path d="M 22 35 Q 22 18 40 15 Q 58 18 58 35" fill={isNight ? "#0A0A0A" : "#1A1A1A"} />
            <path d="M 22 35 Q 20 25 25 22" fill={isNight ? "#0A0A0A" : "#1A1A1A"} />
            <path d="M 58 35 Q 60 25 55 22" fill={isNight ? "#0A0A0A" : "#1A1A1A"} />
            <circle cx="35" cy="33" r="2" fill={isNight ? "#8B4040" : "#4A4A4A"} />
            <circle cx="45" cy="33" r="2" fill={isNight ? "#8B4040" : "#4A4A4A"} />
            <path d="M 36 40 Q 40 42 44 40" fill="none" stroke="#6A5050" strokeWidth="0.8" />
          </svg>
        </div>
        <div className="echo-status-ring" style={{
          background: `conic-gradient(var(--theme-primary) ${trustLevel}%, transparent ${trustLevel}%)`
        }} />
      </div>

      {/* معلومات Echo */}
      <div className="echo-info">
        <h3 className="echo-name">{name}</h3>
        <span className="echo-age">{age} سنة</span>
        <span className={`echo-phase phase-${phase}`}>{phase}</span>
        <span className="echo-emotional-state">{emotionalState}</span>
      </div>

      {/* مستوى الثقة */}
      <div className="echo-trust-bar">
        <span className="trust-label">الثقة</span>
        <div className="trust-track">
          <div className="trust-fill" style={{ width: `${trustLevel}%` }} />
        </div>
        <span className="trust-value">{trustLevel}%</span>
      </div>

      {/* دائرة المشاعر */}
      <div className="echo-emotions">
        <h4 className="emotions-title">المشاعر</h4>
        <div className="emotions-ring">
          {emotions.map((emotion) => (
            <div key={emotion.label} className="emotion-item">
              <div className="emotion-bar">
                <div className="emotion-fill" style={{ width: `${emotion.value}%`, background: emotion.color }} />
              </div>
              <div className="emotion-info">
                <span className="emotion-label">{emotion.label}</span>
                <span className="emotion-value">{emotion.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* آخر ذكرى */}
      {lastMemory && (
        <div className="echo-last-memory">
          <span className="memory-label">آخر ذكرى</span>
          <p className="memory-text">{lastMemory}</p>
        </div>
      )}
    </div>
  );
};