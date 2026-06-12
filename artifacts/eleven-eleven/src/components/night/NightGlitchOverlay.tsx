/**
 * NightGlitchOverlay — طبقة التشويش البصري للنظام الليلي
 * تستند إلى الصور 01, 05, 08, 12 (مراحل التحول الليلي)
 * تزداد حدة التأثيرات مع زيادة instabilityLevel
 */

import React, { useEffect, useState } from "react";
import type { AppTheme } from "../../themes/appTheme";

interface GlitchOverlayProps {
  theme: AppTheme;
}

const WARNING_MESSAGES = [
  "SYSTEM INSTABILITY",
  "SIGNAL LOST",
  "MEMORY CORRUPTION DETECTED",
  "LINK ACTIVE",
  "تحذير: عدم استقرار النظام",
  "الإشارة تتقطع",
  "تشويش في الذاكرة",
  "ارتباط Echo بدأ",
];

const EMOTIONAL_MESSAGES = [
  "لماذا لا أتذكر؟",
  "أمي... أين أنت؟",
  "كينجا... ماذا فعلت بي؟",
  "الغرفة 111...",
  "أشعر أنني أنهار",
  "لا تدعني أنساها",
  "سأعود... يوماً ما",
  "الزهور كانت بيضاء",
];

export const NightGlitchOverlay: React.FC<GlitchOverlayProps> = ({ theme }) => {
  const { instabilityLevel } = theme;
  const [glitchText, setGlitchText] = useState<string>("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [crackStyle, setCrackStyle] = useState<React.CSSProperties>({});

  // عداد عشوائي للرسائل التحذيرية
  useEffect(() => {
    if (instabilityLevel === 0) {
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const shouldShow = Math.random() < (instabilityLevel * 0.3);
      if (shouldShow) {
        const warnings = instabilityLevel >= 2 ? [...WARNING_MESSAGES, ...EMOTIONAL_MESSAGES] : WARNING_MESSAGES;
        const msg = warnings[Math.floor(Math.random() * warnings.length)];
        setWarningText(msg);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2500 + Math.random() * 2000);
      }
    }, 4000 - instabilityLevel * 1000);

    return () => clearInterval(interval);
  }, [instabilityLevel]);

  // تأثير التشققات
  useEffect(() => {
    if (instabilityLevel === 0) {
      setCrackStyle({});
      return;
    }

    const crackIntensity = instabilityLevel * 20;
    const randomCracks = Array.from({ length: instabilityLevel * 2 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      w: 20 + Math.random() * 60,
      h: 1 + Math.random() * 2,
      angle: Math.random() * 360,
    }));

    setCrackStyle({
      clipPath: randomCracks.length > 0 
        ? undefined 
        : undefined,
    });

  }, [instabilityLevel]);

  if (instabilityLevel === 0) return null;

  return (
    <div className="glitch-overlay" dir="rtl">
      {/* طبقة التشويش الأحمر */}
      {instabilityLevel >= 1 && (
        <div 
          className="glitch-red-layer"
          style={{ opacity: instabilityLevel * 0.08 }}
        />
      )}

      {/* تشققات زجاج */}
      {instabilityLevel >= 1 && (
        <div className="glitch-cracks" style={{ opacity: instabilityLevel * 0.25 }}>
          {Array.from({ length: instabilityLevel * 4 }).map((_, i) => (
            <div
              key={`crack-${i}`}
              className="glitch-crack"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                width: `${20 + Math.random() * 40}px`,
                height: `${1 + Math.random() * 2}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* تشويش النصوص (glitch text) */}
      {instabilityLevel >= 2 && (
        <div className="glitch-text-layer" style={{ opacity: (instabilityLevel - 1) * 0.3 }}>
          {glitchText && (
            <span className="glitch-floating-text" data-text={glitchText}>
              {glitchText}
            </span>
          )}
        </div>
      )}

      {/* ومضات تحذيرية */}
      {showWarning && (
        <div className="glitch-warning-container">
          <div className={`glitch-warning ${instabilityLevel >= 2 ? "glitch-warning-urgent" : ""}`}>
            <div className="warning-dot" />
            <span className="warning-text">{warningText}</span>
          </div>
        </div>
      )}

      {/* طبقة ضوضاء (للـ 11:11) */}
      {instabilityLevel >= 3 && (
        <>
          <div className="glitch-noise-layer" />
          <div className="glitch-vignette" style={{ opacity: 0.6 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`scan-${i}`}
              className="glitch-scan-line"
              style={{
                top: `${30 + i * 20 + Math.random() * 10}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </>
      )}

      {/* شريط علوي أحمر للتحذير */}
      {instabilityLevel >= 2 && (
        <div className="glitch-top-bar" style={{ opacity: (instabilityLevel - 1) * 0.4 }}>
          <span className="top-bar-text">
            ⚠ 11:11 MODE ACTIVE — SYSTEM AT {instabilityLevel === 3 ? "CRITICAL" : "ELEVATED"} INSTABILITY
          </span>
        </div>
      )}
    </div>
  );
};