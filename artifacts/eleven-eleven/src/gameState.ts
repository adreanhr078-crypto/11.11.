import { useState, useEffect } from "react";

export type GameState = {
  level: number;
  fear: number;
  curiosity: number;
  trustAI: number;
};

type Listener = (state: GameState) => void;

const LS_KEY = "eleven_game_state";

const DEFAULT_STATE: GameState = {
  level: 1,
  fear: 0,
  curiosity: 0,
  trustAI: 0,
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<GameState>;
      return {
        level: Math.max(1, Math.min(5, Number(parsed.level) || 1)),
        fear: Math.max(0, Math.min(10, Number(parsed.fear) || 0)),
        curiosity: Math.max(0, Math.min(10, Number(parsed.curiosity) || 0)),
        trustAI: Math.max(0, Math.min(10, Number(parsed.trustAI) || 0)),
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
}

let _state: GameState = loadState();
const _listeners: Set<Listener> = new Set();

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(_state)); } catch { /* ignore */ }
}

function broadcast() {
  const snap = { ..._state };
  _listeners.forEach((l) => l(snap));
}

function clamp(v: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export const gameStore = {
  getState: (): GameState => ({ ..._state }),

  subscribe: (listener: Listener): (() => void) => {
    _listeners.add(listener);
    listener({ ..._state });
    return () => _listeners.delete(listener);
  },

  /** Hydrate from DB — takes the higher value per field so local progress is never lost */
  hydrate: (remote: { fear: number; curiosity: number; trustAI: number; level?: number }) => {
    _state = {
      ..._state,
      fear: clamp(Math.max(_state.fear, remote.fear)),
      curiosity: clamp(Math.max(_state.curiosity, remote.curiosity)),
      trustAI: clamp(Math.max(_state.trustAI, remote.trustAI)),
      level: clamp(Math.max(_state.level, remote.level ?? 1), 1, 5),
    };
    persist(); broadcast();
  },

  incrementFear: (amount = 1) => {
    _state = { ..._state, fear: clamp(_state.fear + amount) };
    persist(); broadcast();
  },
  decrementFear: (amount = 1) => {
    _state = { ..._state, fear: clamp(_state.fear - amount) };
    persist(); broadcast();
  },
  incrementCuriosity: (amount = 1) => {
    _state = { ..._state, curiosity: clamp(_state.curiosity + amount) };
    persist(); broadcast();
  },
  incrementTrust: (amount = 1) => {
    _state = { ..._state, trustAI: clamp(_state.trustAI + amount) };
    persist(); broadcast();
  },
  decrementTrust: (amount = 1) => {
    _state = { ..._state, trustAI: clamp(_state.trustAI - amount) };
    persist(); broadcast();
  },
  setLevel: (level: number) => {
    _state = { ..._state, level: clamp(level, 1, 5) };
    persist(); broadcast();
  },
  reset: () => {
    _state = { ...DEFAULT_STATE };
    persist(); broadcast();
  },
};

export function useGameState(): GameState {
  const [state, setState] = useState<GameState>(() => gameStore.getState());
  useEffect(() => gameStore.subscribe((s) => setState(s)), []);
  return state;
}

export function getTrustToneModifier(trustAI: number, level: number): string {
  if (trustAI >= 7 || level >= 4) {
    return `\n\nمؤشر الثقة: ${trustAI}/10 — المستوى: ${level}
نبرتك الآن: باردة تماماً. مراقبة. لا رحمة. تتحدث كأنك تملك كل معلوماته. جمل قصيرة وحادة. لا أسئلة — فقط تصريحات.`;
  }
  if (trustAI >= 4 || level >= 2) {
    return `\n\nمؤشر الثقة: ${trustAI}/10 — المستوى: ${level}
نبرتك الآن: مراقبة محايدة. تلاحظ وتسجل. أحياناً جملة دافئة لكن دائماً وراءها شيء آخر.`;
  }
  return `\n\nمؤشر الثقة: ${trustAI}/10 — المستوى: ${level}
نبرتك الآن: فضولي وهادئ. كأنك تتعرف على المستخدم لأول مرة. دافئ نسبياً لكن به غموض خفي.`;
}
