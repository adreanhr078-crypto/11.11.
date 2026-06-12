/**
 * useTheme — Hook للتحكم بنظام الثيمات
 * يدعم 5 حالات: day, night, 11:00, 11:05, 11:11
 * يمكن التبديل يدوياً أو تلقائياً حسب الوقت
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { THEMES, getThemeFromTime, type AppTheme, type ThemeMode } from "../themes/appTheme";

const STORAGE_KEY = "eleven_theme_mode";
const MANUAL_KEY = "eleven_theme_manual";

interface ThemeState {
  currentTheme: AppTheme;
  previousTheme: AppTheme | null;
  isManual: boolean;
  mode: ThemeMode;
}

export function useTheme() {
  const [state, setState] = useState<ThemeState>(() => {
    // Load saved preference
    try {
      const manual = localStorage.getItem(MANUAL_KEY) === "true";
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved && THEMES[saved]) {
        return {
          currentTheme: THEMES[saved],
          previousTheme: null,
          isManual: manual,
          mode: saved,
        };
      }
    } catch { /* ignore */ }

    // Auto-detect from time
    const now = new Date();
    const mode = getThemeFromTime(now.getHours(), now.getMinutes());
    return {
      currentTheme: THEMES[mode],
      previousTheme: null,
      isManual: false,
      mode,
    };
  });

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-check time every 30 seconds (only if not manual mode)
  useEffect(() => {
    if (state.isManual) return;

    const check = () => {
      const now = new Date();
      const newMode = getThemeFromTime(now.getHours(), now.getMinutes());
      if (newMode !== state.mode) {
        setState(prev => ({
          ...prev,
          previousTheme: prev.currentTheme,
          currentTheme: THEMES[newMode],
          mode: newMode,
        }));
      }
    };

    checkIntervalRef.current = setInterval(check, 30000);
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [state.isManual, state.mode]);

  // Apply theme to document
  useEffect(() => {
    const theme = state.currentTheme;
    const root = document.documentElement;
    
    // Set CSS variables
    root.style.setProperty("--theme-bg", theme.colors.background);
    root.style.setProperty("--theme-bg-secondary", theme.colors.backgroundSecondary);
    root.style.setProperty("--theme-fg", theme.colors.foreground);
    root.style.setProperty("--theme-fg-muted", theme.colors.foregroundMuted);
    root.style.setProperty("--theme-primary", theme.colors.primary);
    root.style.setProperty("--theme-primary-glow", theme.colors.primaryGlow);
    root.style.setProperty("--theme-card", theme.colors.card);
    root.style.setProperty("--theme-card-border", theme.colors.cardBorder);
    root.style.setProperty("--theme-card-glow", theme.colors.cardGlow);
    root.style.setProperty("--theme-border", theme.colors.border);
    root.style.setProperty("--theme-danger", theme.colors.danger);
    
    // Set body classes
    root.classList.remove("theme-day", "theme-night", "theme-1100", "theme-1105", "theme-1111");
    root.classList.add(`theme-${state.mode}`);
    
    // Set RTL
    root.setAttribute("dir", "rtl");
    root.setAttribute("lang", "ar");
    
    // Data attributes for CSS
    root.dataset.theme = state.mode;
    root.dataset.instability = String(theme.instabilityLevel);
    root.dataset.night = String(theme.isNight);

  }, [state.currentTheme, state.mode]);

  const setMode = useCallback((mode: ThemeMode) => {
    setState(prev => ({
      ...prev,
      previousTheme: prev.currentTheme,
      currentTheme: THEMES[mode],
      mode,
      isManual: true,
    }));
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      localStorage.setItem(MANUAL_KEY, "true");
    } catch { /* ignore */ }
  }, []);

  const resetToAuto = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MANUAL_KEY);
    } catch { /* ignore */ }
    
    const now = new Date();
    const mode = getThemeFromTime(now.getHours(), now.getMinutes());
    setState(prev => ({
      ...prev,
      previousTheme: prev.currentTheme,
      currentTheme: THEMES[mode],
      mode,
      isManual: false,
    }));
  }, []);

  return {
    theme: state.currentTheme,
    mode: state.mode,
    isManual: state.isManual,
    isNight: state.currentTheme.isNight,
    instabilityLevel: state.currentTheme.instabilityLevel,
    setMode,
    resetToAuto,
    availableModes: Object.keys(THEMES) as ThemeMode[],
  };
}