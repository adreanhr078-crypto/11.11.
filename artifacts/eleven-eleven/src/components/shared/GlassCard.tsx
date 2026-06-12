/**
 * GlassCard — بطاقة زجاجية قابلة لإعادة الاستخدام
 * تتبدل تلقائياً بين glassmorphism (نهاري) وداكن (ليلي)
 */

import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  title?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  glow = false,
  onClick,
  style,
  title,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${glow ? "glass-card-glow" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={style}
      dir="rtl"
    >
      {title && (
        <div className="glass-card-header">
          <h3 className="glass-card-title">{title}</h3>
        </div>
      )}
      <div className="glass-card-body">
        {children}
      </div>
    </div>
  );
};

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color,
  size = "md",
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`progress-bar-container progress-${size}`} dir="rtl">
      {label && (
        <div className="progress-bar-label">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${clamped}%`,
            background: color || undefined,
          }}
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "stable";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
}) => {
  return (
    <div className="stat-card">
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
      {trend && (
        <span className={`stat-trend trend-${trend}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
        </span>
      )}
    </div>
  );
};