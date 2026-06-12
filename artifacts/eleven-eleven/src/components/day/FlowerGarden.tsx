/**
 * FlowerGarden — نظام الزهور البيضاء للنظام النهاري
 * تستند إلى الصور 02, 03, 07
 * الزهور تتفتح مع تقدم المستخدم، بيضاء في النهار، تتحول للداكن في الليل
 */

import React from "react";

interface FlowerStage {
  label: string;
  description: string;
  percentage: number;
}

const FLOWER_STAGES: FlowerStage[] = [
  { label: "بذرة", description: "البداية", percentage: 0 },
  { label: "برعم", description: "بداية النمو", percentage: 25 },
  { label: "تفتح", description: "الازدهار", percentage: 50 },
  { label: "اكتمال", description: "الزهرة كاملة", percentage: 75 },
  { label: "إشراق", description: "الحقيقة والشفاء", percentage: 100 },
];

interface FlowerGardenProps {
  progress: number; // 0-100
  isNight?: boolean;
}

export const FlowerGarden: React.FC<FlowerGardenProps> = ({
  progress,
  isNight = false,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const currentStageIndex = Math.min(
    FLOWER_STAGES.length - 1,
    Math.floor((clampedProgress / 100) * (FLOWER_STAGES.length - 1))
  );
  const currentStage = FLOWER_STAGES[currentStageIndex];

  return (
    <div className={`flower-garden ${isNight ? "flower-garden-night" : "flower-garden-day"}`} dir="rtl">
      <div className="flower-header">
        <h3 className="flower-title">الزهور</h3>
        <div className="flower-progress-info">
          <span className="flower-count">{Math.round(clampedProgress)}%</span>
          <span className="flower-stage">{currentStage.label}</span>
        </div>
      </div>

      {/* المزهرية / حقل الزهور */}
      <div className="flower-field">
        <svg viewBox="0 0 240 120" className="flower-svg">
          {/* الأرض */}
          <ellipse cx="120" cy="110" rx="100" ry="12" fill={isNight ? "rgba(30,20,20,0.5)" : "rgba(180,200,160,0.4)"} />
          
          {/* الزهور - كل زهرة تمثل 20% تقدم */}
          {Array.from({ length: 5 }).map((_, i) => {
            const flowerPercent = (i + 1) * 20;
            const bloomed = clampedProgress >= flowerPercent;
            const x = 40 + i * 40;
            const y = 70 - (bloomed ? 15 : 5);
            const size = bloomed ? 12 + (clampedProgress - flowerPercent) * 0.1 : 6;
            const color = isNight 
              ? (bloomed ? "#8B4040" : "#3A3030") 
              : (bloomed ? "#F5F0E8" : "#D0D0C8");
            const centerColor = isNight 
              ? (bloomed ? "#CC6666" : "#5A4A4A") 
              : (bloomed ? "#E8D5B7" : "#C0C0B8");

            return (
              <g key={i} opacity={bloomed ? 0.9 : 0.3}>
                {/* الساق */}
                <line x1={x} y1={y + size} x2={x} y2={95} stroke={isNight ? "#3A5A3A" : "#6A9A6A"} strokeWidth={1.5} />
                {/* البتلات */}
                <ellipse cx={x} cy={y - size * 0.5} rx={size * 0.4} ry={size * 0.7} fill={color} transform={`rotate(-30 ${x} ${y})`} />
                <ellipse cx={x} cy={y - size * 0.5} rx={size * 0.4} ry={size * 0.7} fill={color} transform={`rotate(30 ${x} ${y})`} />
                <ellipse cx={x} cy={y - size * 0.5} rx={size * 0.4} ry={size * 0.7} fill={color} transform={`rotate(-60 ${x} ${y})`} />
                <ellipse cx={x} cy={y - size * 0.5} rx={size * 0.4} ry={size * 0.7} fill={color} transform={`rotate(60 ${x} ${y})`} />
                {/* المركز */}
                <circle cx={x} cy={y - size * 0.5} r={size * 0.25} fill={centerColor} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* شريط تقدم الزهور */}
      <div className="flower-progress-track">
        <div className="flower-progress-fill" style={{ width: `${clampedProgress}%` }} />
        {FLOWER_STAGES.filter((_, i) => i > 0).map((stage, i) => (
          <div
            key={stage.label}
            className={`flower-marker ${clampedProgress >= stage.percentage ? "flower-marker-active" : ""}`}
            style={{ left: `${(i + 1) * 20}%` }}
            title={stage.description}
          />
        ))}
      </div>

      {/* وصف المرحلة الحالية */}
      <div className="flower-description">
        <p className="flower-quote">
          {isNight
            ? "الزهور تذبل في الظلام... لكنها لم تمت بعد"
            : "النمو لا يحدث دفعة واحدة، لكنه يحدث مع كل يوم وقرار صغير"
          }
        </p>
      </div>
    </div>
  );
};