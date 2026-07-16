/**
 * ModeToggle — زر التبديل بين النظام النهاري والليلي
 * يدعم 5 حالات: day, night, 11:00, 11:05, 11:11
 */

import React from "react";
import type { ThemeMode } from "../../themes/appTheme";

interface ModeToggleProps {
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  isManual: boolean;
  onReset: () => void;
}

const MODE_BUTTONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: "day", label: "النهار", icon: "☀️" },
  { mode: "night", label: "الليل", icon: "🌙" },
  { mode: "instability_1100", label: "11:00", icon: "⚠️" },
  { mode: "instability_1105", label: "11:05", icon: "⚡" },
  { mode: "cinematic_1111", label: "11:11", icon: "🔴" },
];

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
  isManual,
  onReset,
}) => {
  const getButtonClass = (mode: ThemeMode) => {
    const base = "mode-toggle-btn";
    if (mode === currentMode) {
      if (mode === "day") return `${base} mode-active-day`;
      if (mode === "night") return `${base} mode-active-night`;
      return `${base} mode-active-instability`;
    }
    return base;
  };

  return (
    <div className="mode-toggle-container" dir="rtl">
      <div className="mode-toggle-header">
        <span className="mode-toggle-label">الوضع الحالي</span>
        <span className="mode-toggle-current">{currentMode}</span>
      </div>
      <div className="mode-toggle-buttons">
        {MODE_BUTTONS.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={getButtonClass(mode)}
            title={label}
          >
            <span className="mode-toggle-icon">{icon}</span>
            <span className="mode-toggle-text">{label}</span>
          </button>
        ))}
      </div>
      {isManual && (
        <button onClick={onReset} className="mode-toggle-reset">
          ← العودة للتلقائي
        </button>
      )}
    </div>
  );
};