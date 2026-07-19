/**
 * EchoPortrait.tsx — صورة Echo الرئيسية مع الأنيميشن
 * يعرض صورة الشخصية في البطاقة الكبيرة مع الدوائر والإحصائيات
 */

import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const EchoPortrait: React.FC = () => {
  const { echo, time } = useGameStore();
  const isNight = time.isNight;
  
  // تحديد حالة المشاعر بناءً على الإحصائيات
  const getMoodColor = () => {
    if (echo.corruption > 70) return '#E85D5D'; // أحمر - مضطرب
    if (echo.fear > 70) return '#E85D5D'; // أحمر - خائف
    if (echo.trust > 60) return '#7EB3D4'; // أزرق - هادئ
    return '#D4A574'; // ذهبي - محايد
  };

  return (
    <div className={`echo-portrait ${isNight ? 'night' : 'day'}`}>
      {/* خلفية الصورة */}
      <div className="portrait-background">
        {isNight ? (
          <div className="dark-flowers">
            {/* أزهار داكنة مع إضاءة زرقاء */}
            <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
              <defs>
                <filter id="glowNight">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* زهور داكنة */}
              <circle cx="50" cy="80" r="30" fill="rgba(100, 60, 80, 0.4)" filter="url(#glowNight)" />
              <circle cx="350" cy="120" r="25" fill="rgba(80, 50, 100, 0.3)" filter="url(#glowNight)" />
              <circle cx="100" cy="250" r="28" fill="rgba(100, 60, 80, 0.35)" filter="url(#glowNight)" />
              <circle cx="320" cy="230" r="26" fill="rgba(80, 50, 100, 0.3)" filter="url(#glowNight)" />
            </svg>
          </div>
        ) : (
          <div className="light-flowers">
            {/* أزهار صفراء وبيضاء */}
            <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
              <defs>
                <filter id="glowDay">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* أزهار صفراء وبيضاء */}
              <circle cx="50" cy="80" r="30" fill="rgba(200, 180, 80, 0.3)" filter="url(#glowDay)" />
              <circle cx="350" cy="120" r="25" fill="rgba(240, 240, 200, 0.25)" filter="url(#glowDay)" />
              <circle cx="100" cy="250" r="28" fill="rgba(220, 200, 100, 0.3)" filter="url(#glowDay)" />
              <circle cx="320" cy="230" r="26" fill="rgba(240, 240, 200, 0.25)" filter="url(#glowDay)" />
            </svg>
          </div>
        )}
      </div>

      {/* صورة الشخصية (placeholder SVG) */}
      <div className="portrait-character">
        <svg width="180" height="200" viewBox="0 0 100 120" fill="none">
          <defs>
            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isNight ? '#4A4540' : '#8B7765'} />
              <stop offset="100%" stopColor={isNight ? '#3A3035' : '#6B5755'} />
            </linearGradient>
          </defs>
          
          {/* الشعر */}
          <path d="M 20 20 Q 20 10 50 10 Q 80 10 80 20 L 75 40 Q 50 45 25 40 Z" fill={isNight ? '#1A1A1A' : '#2C2C2C'} />
          
          {/* الرأس */}
          <ellipse cx="50" cy="35" rx="18" ry="22" fill="url(#skinGradient)" />
          
          {/* العيون */}
          <circle cx="40" cy="30" r="3" fill={isNight ? '#00B8E6' : '#5A9FBE'} />
          <circle cx="60" cy="30" r="3" fill={isNight ? '#00B8E6' : '#5A9FBE'} />
          
          {/* الفم */}
          <path d="M 45 40 Q 50 42 55 40" stroke={isNight ? '#B8967D' : '#A08470'} strokeWidth="1" fill="none" />
          
          {/* الجسم */}
          <rect x="35" y="55" width="30" height="40" rx="2" fill={isNight ? '#4A4540' : '#8B7765'} opacity="0.8" />
          
          {/* الذراع */}
          <rect x="20" y="58" width="12" height="35" rx="2" fill={isNight ? '#4A4540' : '#8B7765'} opacity="0.8" />
          <rect x="68" y="58" width="12" height="35" rx="2" fill={isNight ? '#4A4540' : '#8B7765'} opacity="0.8" />
        </svg>
      </div>

      {/* الدوائر الإحصائية حول الشخصية */}
      <div className="stat-circles">
        {/* الخوف - أعلى يسار */}
        <div className="stat-circle top-left" style={{ '--circle-color': '#E85D5D' } as React.CSSProperties}>
          <div className="circle-inner">
            <span className="circle-icon">❤️</span>
            <span className="circle-value">{echo.fear}%</span>
          </div>
          <span className="circle-label">الخوف</span>
        </div>

        {/* الوحدة - أعلى يمين */}
        <div className="stat-circle top-right" style={{ '--circle-color': '#D4A574' } as React.CSSProperties}>
          <div className="circle-inner">
            <span className="circle-icon">🌟</span>
            <span className="circle-value">{echo.isolation}%</span>
          </div>
          <span className="circle-label">الوحدة</span>
        </div>

        {/* الثقة - أسفل يسار */}
        <div className="stat-circle bottom-left" style={{ '--circle-color': '#7EB3D4' } as React.CSSProperties}>
          <div className="circle-inner">
            <span className="circle-icon">✨</span>
            <span className="circle-value">{echo.trust}%</span>
          </div>
          <span className="circle-label">الثقة</span>
        </div>

        {/* الذاكرة - أسفل يمين/أسفل مركز */}
        <div className="stat-circle bottom-center" style={{ '--circle-color': '#5A9FBE' } as React.CSSProperties}>
          <div className="circle-inner">
            <span className="circle-icon">🧠</span>
            <span className="circle-value">{echo.memoryStability}%</span>
          </div>
          <span className="circle-label">الذاكرة</span>
        </div>

        {/* الألم - أسفل يمين */}
        <div className="stat-circle bottom-right" style={{ '--circle-color': getMoodColor() } as React.CSSProperties}>
          <div className="circle-inner">
            <span className="circle-icon">⚡</span>
            <span className="circle-value">{echo.corruption}%</span>
          </div>
          <span className="circle-label">الفساد</span>
        </div>
      </div>

      {/* شريط أفقي لتقدم التحليل */}
      <div className="portrait-progress">
        <div className="progress-label">تقدم التحليل العقلي</div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${echo.memoryStability}%` }} />
        </div>
        <div className="progress-value">{echo.memoryStability}%</div>
      </div>

      {/* زر الكشف عن الجديد */}
      <button className="reveal-btn">كشف الجديد →</button>
    </div>
  );
};

export default EchoPortrait;
