/**
 * useNarrative — يربط أحداث WorldState بردود فعل UI
 * لا يحتوي على منطق UI مباشر — فقط يوجّه الأحداث
 */

import { useState, useEffect, useCallback } from "react";
import { getNarrativeEngine, type NarrativeState } from "../core/narrativeEngine";
import { useGameStore } from "../stores/gameStore";
import { CHAPTER_DEFINITIONS } from "../infrastructure/content/contentRegistry";

interface NarrativeUIState {
  currentChapter: number;
  chapterLabel: string;
  activeMoment: string | null;
  pendingEvents: number;
  escalationLevel: "calm" | "building" | "intense" | "critical";
}

const LEGACY_ACT_LABELS: Record<string, string> = {
  awakening: "الفصل الأول: الاستيقاظ",
  corruption: "الفصل الثاني: الفساد",
  fragment_war: "الفصل الثالث: حرب الشظايا",
  truth_revelation: "الفصل الرابع: كشف الحقيقة",
};

const ACT_PHASES = [
  'awakening',
  'discovery',
  'connection',
  'truth',
  'fracture',
  'vengeance',
  'finale',
];

const ACT_LABELS: Record<string, string> = {
  ...LEGACY_ACT_LABELS,
  ...Object.fromEntries(CHAPTER_DEFINITIONS.map((chapter, index) => [
    ACT_PHASES[index],
    `${chapter.order}. ${chapter.title.ar}`,
  ])),
};

const ESCALATION_MAP: Record<string, "calm" | "building" | "intense" | "critical"> = {
  awakening: "calm",
  corruption: "building",
  fragment_war: "intense",
  truth_revelation: "critical",
  discovery: "building",
  connection: "building",
  truth: "intense",
  fracture: "intense",
  vengeance: "critical",
  finale: "critical",
};

function deriveNarrativeUI(state: NarrativeState, solvedPuzzles: number): NarrativeUIState {
  const currentChapter = Number(
    state.currentChapterId.replace('chapter_', ''),
  ) || 1;

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
  const progression = useGameStore(s => s.progression);
  const [narrativeState, setNarrativeState] = useState<NarrativeUIState>(() => {
    return deriveNarrativeUI(getNarrativeEngine().getState(), solvedPuzzles);
  });

  useEffect(() => {
    getNarrativeEngine().syncProgression(progression);
    const updateFromEngine = () => {
      setNarrativeState(deriveNarrativeUI(getNarrativeEngine().getState(), solvedPuzzles));
    };
    const unsubscribe = getNarrativeEngine().subscribe(updateFromEngine);
    updateFromEngine();
    return unsubscribe;
  }, [progression, solvedPuzzles]);

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
