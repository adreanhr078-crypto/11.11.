/**
 * 11.11 — نظام الثيمات المتكامل
 * 
 * 5 حالات للنظام:
 * - day: الوضع النهاري (هادئ، مضيء، زهور بيضاء)
 * - night: الوضع الليلي (داكن، أحمر خافت، غموض)
 * - instability_1100: بداية عدم الاستقرار (11:00 PM)
 * - instability_1105: تزايد التشوهات (11:05 PM)
 * - cinematic_1111: الانتقال السينمائي الكامل (11:11 PM)
 */

export type ThemeMode = "day" | "night" | "instability_1100" | "instability_1105" | "cinematic_1111";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  foreground: string;
  foregroundMuted: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  card: string;
  cardBorder: string;
  cardGlow: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
  glitchColor: string;
  glitchOverlay: string;
}

export interface ThemeEffects {
  blur: number;
  glitchIntensity: number; // 0-1
  crackOpacity: number;    // 0-1
  redTint: number;         // 0-1
  vignette: number;        // 0-1
  scanLine: boolean;
  noise: boolean;
}

export interface AppTheme {
  mode: ThemeMode;
  name: { ar: string; en: string };
  colors: ThemeColors;
  effects: ThemeEffects;
  isNight: boolean;
  instabilityLevel: number; // 0-3
}

// ─── DAY THEME ────────────────────────────────────────────────────────────
const dayTheme: AppTheme = {
  mode: "day",
  name: { ar: "الوضع الصباحي", en: "Morning Mode" },
  colors: {
    background: "#F5F3F0",
    backgroundSecondary: "#EFEFEB",
    foreground: "#2C2C2C",
    foregroundMuted: "#757575",
    primary: "#5A9FBE",
    primaryGlow: "rgba(90, 159, 190, 0.15)",
    secondary: "#B8D4E8",
    accent: "#D4A574",
    card: "rgba(255, 255, 255, 0.8)",
    cardBorder: "rgba(100, 150, 180, 0.1)",
    cardGlow: "rgba(90, 159, 190, 0.08)",
    border: "rgba(140, 140, 140, 0.08)",
    danger: "#D97070",
    success: "#7CB342",
    warning: "#F9A825",
    glitchColor: "rgba(0,0,0,0)",
    glitchOverlay: "rgba(0,0,0,0)",
  },
  effects: {
    blur: 0.5,
    glitchIntensity: 0,
    crackOpacity: 0,
    redTint: 0,
    vignette: 0.08,
    scanLine: false,
    noise: false,
  },
  isNight: false,
  instabilityLevel: 0,
};

// ─── NIGHT THEME ──────────────────────────────────────────────────────────
const nightTheme: AppTheme = {
  mode: "night",
  name: { ar: "الوضع الليلي", en: "Night Mode" },
  colors: {
    background: "#0A0808",
    backgroundSecondary: "#121010",
    foreground: "#D8D4D0",
    foregroundMuted: "#6B6763",
    primary: "#E85D5D",
    primaryGlow: "rgba(232, 93, 93, 0.2)",
    secondary: "#2A2A2A",
    accent: "#00B8E6",
    card: "rgba(15, 15, 18, 0.9)",
    cardBorder: "rgba(232, 93, 93, 0.15)",
    cardGlow: "rgba(232, 93, 93, 0.1)",
    border: "rgba(255, 255, 255, 0.06)",
    danger: "#E85D5D",
    success: "#2B5A3A",
    warning: "#D4A040",
    glitchColor: "rgba(232, 93, 93, 0.08)",
    glitchOverlay: "rgba(0, 184, 230, 0.05)",
  },
  effects: {
    blur: 0.8,
    glitchIntensity: 0.1,
    crackOpacity: 0.05,
    redTint: 0.08,
    vignette: 0.35,
    scanLine: true,
    noise: true,
  },
  isNight: true,
  instabilityLevel: 0,
};

// ─── 11:00 INSTABILITY ────────────────────────────────────────────────────
const instability1100: AppTheme = {
  mode: "instability_1100",
  name: { ar: "11:00 — بداية عدم الاستقرار", en: "11:00 — Initial Instability" },
  colors: {
    ...nightTheme.colors,
    background: "#0D0A0A",
    foreground: "#D4D0CE",
    glitchColor: "rgba(139, 42, 42, 0.08)",
    glitchOverlay: "rgba(139, 42, 42, 0.03)",
  },
  effects: {
    blur: 0.5,
    glitchIntensity: 0.15,
    crackOpacity: 0.1,
    redTint: 0.1,
    vignette: 0.35,
    scanLine: true,
    noise: true,
  },
  isNight: true,
  instabilityLevel: 1,
};

// ─── 11:05 INSTABILITY ────────────────────────────────────────────────────
const instability1105: AppTheme = {
  mode: "instability_1105",
  name: { ar: "11:05 — تزايد عدم الاستقرار", en: "11:05 — Escalating Instability" },
  colors: {
    ...nightTheme.colors,
    background: "#0A0505",
    foreground: "#C8C2BE",
    primary: "#AA2222",
    primaryGlow: "rgba(170, 34, 34, 0.3)",
    cardBorder: "rgba(170, 34, 34, 0.3)",
    glitchColor: "rgba(170, 34, 34, 0.15)",
    glitchOverlay: "rgba(170, 34, 34, 0.06)",
  },
  effects: {
    blur: 1.5,
    glitchIntensity: 0.35,
    crackOpacity: 0.3,
    redTint: 0.2,
    vignette: 0.45,
    scanLine: true,
    noise: true,
  },
  isNight: true,
  instabilityLevel: 2,
};

// ─── 11:11 CINEMATIC ──────────────────────────────────────────────────────
const cinematic1111: AppTheme = {
  mode: "cinematic_1111",
  name: { ar: "11:11 — الانتقال السينمائي", en: "11:11 — Cinematic Transition" },
  colors: {
    background: "#050000",
    backgroundSecondary: "#0A0202",
    foreground: "#E8E0DA",
    foregroundMuted: "#5A4848",
    primary: "#CC1111",
    primaryGlow: "rgba(204, 17, 17, 0.4)",
    secondary: "#1A0A0A",
    accent: "#2A0A0A",
    card: "rgba(10, 5, 5, 0.9)",
    cardBorder: "rgba(204, 17, 17, 0.25)",
    cardGlow: "rgba(204, 17, 17, 0.12)",
    border: "rgba(204, 17, 17, 0.1)",
    danger: "#CC0000",
    success: "#2A4A2A",
    warning: "#8B4A10",
    glitchColor: "rgba(204, 17, 17, 0.25)",
    glitchOverlay: "rgba(204, 17, 17, 0.1)",
  },
  effects: {
    blur: 3,
    glitchIntensity: 0.6,
    crackOpacity: 0.6,
    redTint: 0.35,
    vignette: 0.6,
    scanLine: true,
    noise: true,
  },
  isNight: true,
  instabilityLevel: 3,
};

// ─── THEME MAP ────────────────────────────────────────────────────────────
export const THEMES: Record<ThemeMode, AppTheme> = {
  day: dayTheme,
  night: nightTheme,
  instability_1100: instability1100,
  instability_1105: instability1105,
  cinematic_1111: cinematic1111,
};

/**
 * الحصول على الثيم المناسب بناءً على الوقت الحالي.
 * Transition التدريجي من day → 11:00 → 11:05 → 11:11
 */
export function getThemeFromTime(hours: number, minutes: number): ThemeMode {
  // Day: 6:00 AM — 10:59 PM
  if (hours < 23) return "day";
  
  // 11:00 PM — 11:04 PM
  if (hours === 23 && minutes >= 0 && minutes < 5) return "instability_1100";
  
  // 11:05 PM — 11:10 PM
  if (hours === 23 && minutes >= 5 && minutes < 11) return "instability_1105";
  
  // 11:11 PM +
  if (hours === 23 && minutes >= 11) return "cinematic_1111";
  
  // 12:00 AM — 5:59 AM
  return "night";
}