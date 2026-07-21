/**
 * useNarrative — يربط أحداث WorldState بردود فعل UI
 * لا يحتوي على منطق UI مباشر — فقط يوجّه الأحداث
 */

import { useState, useEffect, useCallback } from "react";
import { getNarrativeEngine, type NarrativeState } from "../core/narrativeEngine";
import { useGameStore } from "../stores/gameStore";

interface NarrativeUIState {
  currentChapter: number;
  chapterLabel: string;
  activeMoment: string | null;
  pendingEvents: number;
  escalationLevel: "calm" | "building" | "intense" | "critical";
}

const ACT_LABELS: Record<string, string> = {
  awakening: "الفصل الأول: الاستيقاظ",
  corruption: "الفصل الثاني: الفساد",
  fragment_war: "الفصل الثالث: حرب الشظايا",
  truth_revelation: "الفصل الرابع: كشف الحقيقة",
};

const ESCALATION_MAP: Record<string, "calm" | "building" | "intense" | "critical"> = {
  awakening: "calm",
  corruption: "building",
  fragment_war: "intense",
  truth_revelation: "critical",
};

function deriveNarrativeUI(state: NarrativeState, solvedPuzzles: number): NarrativeUIState {
  let currentChapter = 1;
  if (solvedPuzzles >= 120) currentChapter = 4;
  else if (solvedPuzzles >= 80) currentChapter = 3;
  else if (solvedPuzzles >= 40) currentChapter = 2;

  return {
    currentChapter,
    chapterLabel: ACT_LABELS[state.currentAct] || "الفصل الأول: الصدى",
    activeMoment: state.currentAct,
    pendingEvents: 0,
    escalationLevel: ESCALATION_MAP[state.currentAct] || "calm",
  };
}

/**
 * useNarrative — يحضر حالة السرد القصصي
 */
export function useNarrative(): NarrativeUIState & {
  start: () => void;
  stop: () => void;
  guide: string;
} {
  const solvedPuzzles = useGameStore(s => s.solvedPuzzles);
  const [narrativeState, setNarrativeState] = useState<NarrativeUIState>(() => {
    return deriveNarrativeUI(getNarrativeEngine().getState(), solvedPuzzles);
  });

  useEffect(() => {
    const updateFromEngine = () => {
      setNarrativeState(deriveNarrativeUI(getNarrativeEngine().getState(), solvedPuzzles));
    };
    const unsubscribe = getNarrativeEngine().subscribe(updateFromEngine);
    updateFromEngine();
    return unsubscribe;
  }, [solvedPuzzles]);

  const start = useCallback(() => getNarrativeEngine().start(), []);
  const stop = useCallback(() => getNarrativeEngine().stop(), []);

  return {
    ...narrativeState,
    start,
    stop,
    guide: getNarrativeEngine().getNarrativeGuide(),
  };
}

/**
 * useStoryProgress — يعطي النسبة المئوية لتقدم القصة
 */
export function useStoryProgress(): number {
  const solvedPuzzles = useGameStore(s => s.solvedPuzzles);
  const totalPuzzles = useGameStore(s => s.totalPuzzles);
  return totalPuzzles > 0 ? Math.round((solvedPuzzles / totalPuzzles) * 100) : 0;
}

/**
 * useEscalationColor — يعطي لون CSS مناسب لمستوى التصعيد
 */
export function useEscalationColor(): string {
  const { escalationLevel } = useNarrative();
  const colors: Record<string, string> = {
    calm: "#6AAA8B",
    building: "#D4A84B",
    intense: "#CC4444",
    critical: "#CC1111",
  };
  return colors[escalationLevel] || "#6A6866";
}

/**
 * useChapter — يعطي الفصل الحالي للتقدم
 */
export function useChapter(): { number: number; label: string } {
  const { currentChapter, chapterLabel } = useNarrative();
  return { number: currentChapter, label: chapterLabel };
}
