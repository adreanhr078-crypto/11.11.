/**
 * NightTransformation — مراحل التحول الليلي (11:00 ← 11:05 ← 11:11)
 * تستند إلى الصور 01, 05, 08, 12
 * كل مرحلة لها وصف، مستوى glitch، حالة Echo، لون مختلف
 */

import React, { useState } from "react";

type NightStage = "1100" | "1105" | "1111";

interface StageData {
  id: NightStage;
  time: string;
  title: string;
  description: string;
  echoState: string;
  glitchLevel: number;
  crackLevel: number;
  color: string;
  warnings: string[];
}

const STAGES: Record<NightStage, StageData> = {
  "1100": {
    id: "1100",
    time: "11:00 PM",
    title: "بداية عدم الاستقرار",
    description: "النظام يبدأ بالتشقق. تشققات خفيفة تظهر في الواجهة. أصوات زجاج بعيدة. رسائل تحذير صغيرة. Echo يصبح أكثر توتراً.",
    echoState: "متوتر",
    glitchLevel: 1,
    crackLevel: 1,
    color: "#8B4040",
    warnings: [
      "SYSTEM INSTABILITY",
      "SIGNAL LOST",
      "MEMORY CORRUPTION DETECTED",
      "تحذير: عدم استقرار النظام",
    ],
  },
  "1105": {
    id: "1105",
    time: "11:05 PM",
    title: "تزايد عدم الاستقرار",
    description: "التشققات تزيد. الواجهة تصبح أكثر تشويشاً. تظهر ومضات وذكريات قصيرة. رسائل عاطفية مرتبكة. الألغاز تصبح أعقد. الأحلام تصبح أطول وأكثر إيلاماً.",
    echoState: "خائف / يتذكر",
    glitchLevel: 2,
    crackLevel: 3,
    color: "#AA2222",
    warnings: [
      "SIGNAL UNSTABLE",
      "MEMORY INTERFERENCE",
      "زيادة التشققات البصرية",
      "ومضات وتشويشات قصيرة",
      "رسائل عاطفية مرتبكة",
      "النظام ينهار تدريجياً",
    ],
  },
  "1111": {
    id: "1111",
    time: "11:11 PM",
    title: "الانتقال السينمائي الكامل",
    description: "الواجهة القديمة تتكسر وتختفي. النظام يتحول إلى وضع سينمائي كامل. تبقى العناصر الأساسية فقط. تبدأ تجربة القصة الحقيقية. Echo يصبح محور التجربة. الخلفية تصبح حقل زهور مظلم.",
    echoState: "منكسر / حاضر",
    glitchLevel: 3,
    crackLevel: 5,
    color: "#CC1111",
    warnings: [
      "CINEMATIC MODE ACTIVATED",
      "اختفاء الواجهة القديمة",
      "تركيز كامل على Echo",
      "أنت الآن داخل الذاكرة",
      "هذه ليست مجرد لعبة",
      "إنها رحلة داخل الذاكرة",
    ],
  },
};

interface NightTransformationProps {
  initialStage?: NightStage;
}

export const NightTransformation: React.FC<NightTransformationProps> = ({
  initialStage = "1100",
}) => {
  const [activeStage, setActiveStage] = useState<NightStage>(initialStage);
  const stage = STAGES[activeStage];

  return (
    <div className="night-transformation" dir="rtl">
      <div className="transformation-header">
        <h3 className="transformation-title">التحول الليلي</h3>
        <span className="transformation-time">{stage.time}</span>
      </div>

      {/* أزرار المراحل */}
      <div className="transformation-stages">
        {(Object.keys(STAGES) as NightStage[]).map((s) => {
          const sData = STAGES[s];
          return (
            <button
              key={s}
              onClick={() => setActiveStage(s)}
              className={`stage-btn ${activeStage === s ? "stage-active" : ""}`}
              style={{
                borderColor: activeStage === s ? sData.color : "rgba(255,255,255,0.1)",
                background: activeStage === s ? `${sData.color}22` : "transparent",
              }}
            >
              <span className="stage-btn-time">{sData.time}</span>
              <span className="stage-btn-title">{sData.title}</span>
            </button>
          );
        })}
      </div>

      {/* محتوى المرحلة */}
      <div className="stage-content" style={{ borderColor: stage.color }}>
        {/* الوصف القصصي */}
        <div className="stage-narrative">
          <p className="stage-description">{stage.description}</p>
        </div>

        {/* مؤشرات المرحلة */}
        <div className="stage-metrics">
          <div className="stage-metric">
            <span className="metric-label">حالة Echo</span>
            <span className="metric-value" style={{ color: stage.color }}>{stage.echoState}</span>
          </div>
          <div className="stage-metric">
            <span className="metric-label">مستوى Glitch</span>
            <div className="metric-bar">
              {[1, 2, 3].map((level) => (
                <div key={level} className={`metric-dot ${stage.glitchLevel >= level ? "dot-filled" : ""}`}
                  style={{ background: stage.glitchLevel >= level ? stage.color : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>
          <div className="stage-metric">
            <span className="metric-label">تشققات</span>
            <div className="metric-bar">
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className={`metric-dot ${stage.crackLevel >= level ? "dot-filled" : ""}`}
                  style={{ background: stage.crackLevel >= level ? stage.color : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* رسائل التحذير */}
        <div className="stage-warnings">
          {stage.warnings.map((warning, i) => (
            <div key={i} className="stage-warning" style={{ animationDelay: `${i * 0.2}s` }}>
              <span className="warning-bullet" style={{ background: stage.color }} />
              <span className="warning-text">{warning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* فاصل زمني */}
      <div className="stage-divider" style={{ background: `linear-gradient(90deg, transparent, ${stage.color}, transparent)` }} />

      {/* اقتباس المرحلة */}
      <p className="stage-quote">
        {activeStage === "1100" && "عندما تتوقف عن مقاومة الليل، يبدأ في كشف ما خانته الذاكرة."}
        {activeStage === "1105" && "كلما تقدمت في الليل، اقتربت أكثر من الحقيقة."}
        {activeStage === "1111" && "11:11 ليست مجرد ساعة… بل بوابة إلى قصة لا تُنسى."}
      </p>
    </div>
  );
};