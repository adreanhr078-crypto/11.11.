/**
 * NightFlowerGarden — الزهور الليلية تتحول من أبيض إلى أحمر/داكن
 * تستند إلى الصور 01, 08, 11
 * تعكس تدهور الحالة النفسية مع تقدم الليل
 */

import React from "react";

interface NightFlowerGardenProps {
  progress: number; // 0-100
  instabilityLevel?: number; // 0-3
}

export const NightFlowerGarden: React.FC<NightFlowerGardenProps> = ({
  progress,
  instabilityLevel = 0,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const redShift = instabilityLevel * 0.25 + (clampedProgress / 100) * 0.3;

  return (
    <div className="night-flower-garden" dir="rtl">
      <div className="night-flower-header">
        <h3 className="night-flower-title">الزهور</h3>
        <span className="night-flower-status">حالة: {redShift > 0.5 ? "ذابلة" : "ذابلة تدريجياً"}</span>
      </div>

      {/* حقل الزهور الليلي */}
      <div className="night-flower-field">
        <svg viewBox="0 0 240 120" className="night-flower-svg">
          {/* أرض مظلمة */}
          <ellipse cx="120" cy="110" rx="100" ry="12" fill="rgba(40,20,20,0.6)" />
          
          {/* الزهور - تتحول من أبيض إلى أحمر */}
          {Array.from({ length: 5 }).map((_, i) => {
            const flowerPct = (i + 1) * 20;
            const alive = clampedProgress >= flowerPct;
            const x = 40 + i * 40;
            const y = alive ? 55 : 65;
            const size = alive ? 10 + (clampedProgress - flowerPct) * 0.05 : 5;
            
            // حساب لون البتلات (أبيض ← أحمر)
            const whiteness = Math.max(0, 1 - redShift - (i * 0.05));
            const redness = Math.min(1, redShift + (i * 0.08));
            const r = Math.round(200 + (55 - 200) * redness);
            const g = Math.round(190 * (1 - redness * 0.8));
            const b = Math.round(180 * (1 - redness * 0.9));
            const color = alive ? `rgb(${r}, ${g}, ${b})` : "#3A3030";
            
            const centerR = Math.round(200 + (180 - 200) * redness);
            const centerG = Math.round(180 * (1 - redness * 0.7));
            const centerB = Math.round(150 * (1 - redness * 0.8));
            const centerColor = alive ? `rgb(${centerR}, ${centerG}, ${centerB})` : "#2A2020";

            return (
              <g key={i} opacity={alive ? 0.7 + redness * 0.3 : 0.2}>
                {/* ساق متعرج (كأنه يذبل) */}
                <path d={`M ${x} ${y + size} Q ${x + (i % 2 ? 3 : -3)} ${90} ${x} ${95}`} 
                  stroke={alive ? "#3A5A3A" : "#2A3A2A"} strokeWidth={1.2} fill="none" />
                {/* بتلات مشوهة */}
                <ellipse cx={x} cy={y - size * 0.4} rx={size * 0.35} ry={size * 0.6} fill={color} transform={`rotate(${-25 + i * 8} ${x} ${y})`} opacity={0.85} />
                <ellipse cx={x} cy={y - size * 0.4} rx={size * 0.35} ry={size * 0.6} fill={color} transform={`rotate(${25 - i * 8} ${x} ${y})`} opacity={0.85} />
                <ellipse cx={x} cy={y - size * 0.4} rx={size * 0.3} ry={size * 0.5} fill={color} transform={`rotate(${-55 + i * 5} ${x} ${y})`} opacity={0.7} />
                <ellipse cx={x} cy={y - size * 0.4} rx={size * 0.3} ry={size * 0.5} fill={color} transform={`rotate(${55 - i * 5} ${x} ${y})`} opacity={0.7} />
                {/* مركز داكن */}
                <circle cx={x} cy={y - size * 0.4} r={size * 0.2} fill={centerColor} />
                {/* بتلات متطايرة */}
                {alive && redness > 0.3 && (
                  <circle cx={x + 12} cy={y - 20 - i * 3} r={2} fill={color} opacity={0.4} />
                )}
              </g>
            );
          })}

          {/* بتلات متطايرة في الريح */}
          {instabilityLevel >= 2 && Array.from({ length: 4 }).map((_, i) => (
            <circle key={`petal-${i}`} cx={30 + i * 50} cy={20 + i * 8} r={1.5} 
              fill="rgba(180, 60, 60, 0.3)" />
          ))}
        </svg>
      </div>

      {/* شريط تقدم ليلي */}
      <div className="night-flower-track">
        <div className="night-flower-fill" style={{ 
          width: `${clampedProgress}%`,
          background: `linear-gradient(90deg, #5A3A3A, #8B2A2A, #CC4444)`
        }} />
        <div className="night-flower-glow" style={{ left: `${clampedProgress}%` }} />
      </div>

      {/* رسالة ليلية */}
      <p className="night-flower-message">
        {instabilityLevel >= 2 
          ? "الزهور تموت... مثلي تماماً" 
          : "الزهور لم تعد كما كانت"}
      </p>
    </div>
  );
};