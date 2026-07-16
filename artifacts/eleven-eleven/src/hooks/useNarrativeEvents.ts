/**
 * useNarrativeEvents — يربط أحداث WorldState بردود فعل UI
 * لا يحتوي على منطق UI مباشر — فقط يوجّه الأحداث
 */

import { useState, useEffect, useCallback } from "react";
import { getNarrativeEngine } from "../core/narrativeEngine";
import { worldState } from "../core/worldStateEngine";

interface NarrativeUIState {
  currentChapter: number;
  chapterLabel: string;
  activeMoment: string | null;
  pendingEvents: number;
  escalationLevel: "calm" | "building" | "intense" | "critical";
}

/**
 * useNarrative — يحضر حالة السرد القصصي
 */
export function useNarrative(): NarrativeUIState & {
  start: () => void;
  stop: () => void;
  guide: string;
} {
  const [narrativeState, setNarrativeState] = useState<NarrativeUIState>(() => ({
    currentChapter: 1,
    chapterLabel: "الفصل الأول: الصدى",
    activeMoment: null,
    pendingEvents: 0,
    escalationLevel: "calm",
  }));

  useEffect(() => {
    const unsubscribe = getNarrativeEngine().subscribe(() => {
      // Refresh UI state from narrative engine without changing story logic
      setNarrativeState({
        currentChapter: 1,
        chapterLabel: "الفصل الأول: الصدى",
        activeMoment: null,
        pendingEvents: 0,
        escalationLevel: "calm",
      });
    });
    return unsubscribe;
  }, []);

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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = worldState.subscribe((s) => {
      setProgress(s.story.overall);
    });
    return unsubscribe;
  }, []);

  return progress;
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