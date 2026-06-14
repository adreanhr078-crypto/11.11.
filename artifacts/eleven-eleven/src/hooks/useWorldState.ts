/**
 * useWorldState — Hook للتفاعل مع WorldState Engine
 * يوفر وصولاً تفاعلياً لحالة العالم الموحدة
 * تستخدمه كل الأنظمة (Day, Night, Echo) للقراءة فقط
 * التغييرات تتم عبر الأحداث (Events) فقط
 */

import { useState, useEffect, useCallback } from "react";
import { worldState, type WorldState, type EventType } from "../core/worldStateEngine";

interface WorldStateActions {
  /** إرسال حدث إلى المحرك */
  emit: (eventType: EventType, payload?: Record<string, unknown>) => void;
  /** الحصول على الحالة الحالية مباشرة */
  getState: () => WorldState;
  /** تغيير حالة الوقت (Day/Night/Transition) */
  setTimeState: (timeState: "day" | "night" | "transition", nightPhase?: "11:00" | "11:05" | "11:11" | null) => void;
  /** تقدم مرحلة الليل (11:00 → 11:05 → 11:11) */
  advanceNightPhase: () => void;
  /** إضافة شظية ذاكرة */
  addMemoryFragment: (fragment: string) => void;
  /** إضافة تقدم للزهور */
  growFlowers: (amount: number) => void;
  /** إعادة تعيين كل شيء */
  reset: () => void;
}

export function useWorldState(): WorldState & WorldStateActions {
  const [state, setState] = useState<WorldState>(() => worldState.getState());

  useEffect(() => {
    const unsubscribe = worldState.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const emit = useCallback((eventType: EventType, payload?: Record<string, unknown>) => {
    worldState.emit(eventType, payload);
  }, []);

  const getState = useCallback(() => worldState.getState(), []);

  const setTimeState = useCallback((
    timeState: "day" | "night" | "transition",
    nightPhase?: "11:00" | "11:05" | "11:11" | null
  ) => {
    worldState.setTimeState(timeState, nightPhase);
  }, []);

  const advanceNightPhase = useCallback(() => {
    worldState.advanceNightPhase();
  }, []);

  const addMemoryFragment = useCallback((fragment: string) => {
    worldState.addMemoryFragment(fragment);
  }, []);

  const growFlowers = useCallback((amount: number) => {
    worldState.growFlowers(amount);
  }, []);

  const reset = useCallback(() => {
    worldState.reset();
  }, []);

  return {
    // State (read-only from engine)
    ...state,
    // Actions
    emit,
    getState,
    setTimeState,
    advanceNightPhase,
    addMemoryFragment,
    growFlowers,
    reset,
  };
}

/**
 * useWorldStability — تراقب الاستقرار وتعطي class مناسب
 * مثال: useWorldStability() === "stable" | "unstable" | "critical"
 */
export function useWorldStability(): "stable" | "unstable" | "critical" {
  const { instabilityLevel } = useWorldState();
  if (instabilityLevel >= 3) return "critical";
  if (instabilityLevel >= 1) return "unstable";
  return "stable";
}

/**
 * useEchoMood — حالة Echo المزاجية المبسطة
 */
export function useEchoMood(): string {
  const { echo } = useWorldState();
  const moodLabels: Record<string, string> = {
    lost: "تائه",
    confused: "مرتبك",
    aware: "مدرك",
    sad: "حزين",
    awakening: "صاحٍ",
  };
  return moodLabels[echo.mood] || "تائه";
}