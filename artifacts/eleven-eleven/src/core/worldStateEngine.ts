/**
 * worldStateEngine.ts — محرك حالة العالم الموحد
 * يربط جميع أنظمة 11.11: Day, Night, Echo
 * كل الأنظمة تقرأ من WorldState ولا تعدّله مباشرة
 * الأحداث (Events) هي الطريقة الوحيدة لتغيير الحالة
 */

import { gameStore } from "../gameState";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type TimeState = "day" | "night" | "transition";
export type NightPhase = "11:00" | "11:05" | "11:11" | null;

export interface EmotionState {
  fear: number;       // 0-100
  hope: number;       // 0-100
  stability: number;  // 0-100
  loneliness: number; // 0-100
}

export interface EchoWorldState {
  trust: number;      // 0-100
  mood: "lost" | "confused" | "aware" | "sad" | "awakening";
  memoryFragments: string[];
}

export interface StoryProgress {
  overall: number;          // 0-100
  memoriesDiscovered: number;
  puzzlesSolved: number;
  wishesActive: number;
  flowerProgress: number;
  activeDays: number;
}

export interface WorldState {
  timeState: TimeState;
  nightPhase: NightPhase;
  instabilityLevel: number; // 0-3
  emotion: EmotionState;
  echo: EchoWorldState;
  story: StoryProgress;
  lastUpdated: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export type EventType =
  | "ECHO_MESSAGE_SENT"
  | "ECHO_TRUST_CHANGED"
  | "ECHO_MOOD_CHANGED"
  | "NIGHT_GLITCH_INCREASE"
  | "NIGHT_PHASE_CHANGED"
  | "PUZZLE_COMPLETED"
  | "PUZZLE_PROGRESS"
  | "DAY_PROGRESS"
  | "FLOWER_GROWTH"
  | "WISH_ACTIVATED"
  | "MEMORY_DISCOVERED"
  | "TIME_STATE_CHANGED"
  | "RESET_ALL";

export interface GameEvent {
  type: EventType;
  payload?: Record<string, unknown>;
  timestamp: number;
}

type EventHandler = (event: GameEvent) => void;

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_WORLD_STATE: WorldState = {
  timeState: "day",
  nightPhase: null,
  instabilityLevel: 0,
  emotion: {
    fear: 30,
    hope: 40,
    stability: 70,
    loneliness: 50,
  },
  echo: {
    trust: 35,
    mood: "lost",
    memoryFragments: [],
  },
  story: {
    overall: 15,
    memoriesDiscovered: 4,
    puzzlesSolved: 0,
    wishesActive: 0,
    flowerProgress: 15,
    activeDays: 1,
  },
  lastUpdated: Date.now(),
};

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "eleven_world_state";

class WorldStateEngine {
  private state: WorldState;
  private listeners: Set<(state: WorldState) => void> = new Set();
  private eventHandlers: Map<EventType, EventHandler[]> = new Map();

  constructor() {
    this.state = this.load();
    this.registerCoreHandlers();
    this.syncFromGameState();
  }

  // ─── Load / Save ──────────────────────────────────────────────────────

  private load(): WorldState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_WORLD_STATE, ...parsed, lastUpdated: Date.now() };
      }
    } catch {}
    return { ...DEFAULT_WORLD_STATE };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  // ─── Read ─────────────────────────────────────────────────────────────

  getState(): WorldState {
    return { ...this.state, lastUpdated: Date.now() };
  }

  // ─── Subscribe ────────────────────────────────────────────────────────

  subscribe(listener: (state: WorldState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  // ─── Events ───────────────────────────────────────────────────────────

  on(eventType: EventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  emit(eventType: EventType, payload?: Record<string, unknown>): void {
    const event: GameEvent = { type: eventType, payload, timestamp: Date.now() };
    
    // Execute handlers
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(h => h(event));
    }

    // Broadcast to all listeners
    this.broadcast();
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private broadcast(): void {
    const snap = this.getState();
    this.listeners.forEach(l => l(snap));
    this.save();
  }

  private setState(partial: Partial<WorldState>): void {
    this.state = { ...this.state, ...partial, lastUpdated: Date.now() };
  }

  // ─── Progression Logic ────────────────────────────────────────────────

  private registerCoreHandlers(): void {
    // Echo trust → affects Night instability
    this.on("ECHO_TRUST_CHANGED", (e) => {
      const trust = (e.payload?.trust as number) ?? this.state.echo.trust;
      // Higher trust = lower instability during day, but higher during night
      if (this.state.timeState === "day") {
        const stabilityBoost = Math.floor(trust / 20);
        this.setState({
          emotion: {
            ...this.state.emotion,
            stability: Math.min(100, this.state.emotion.stability + 5),
          },
        });
      } else {
        // Night: trust creates emotional conflict → instability rises
        const instabilityDelta = Math.floor(trust / 25);
        this.setState({
          instabilityLevel: Math.min(3, this.state.instabilityLevel + instabilityDelta > 0 ? 1 : 0),
          emotion: {
            ...this.state.emotion,
            fear: Math.min(100, this.state.emotion.fear + 3),
          },
        });
      }
    });

    // Night glitch → affects Echo fear + mood
    this.on("NIGHT_GLITCH_INCREASE", () => {
      const fearIncrease = this.state.instabilityLevel * 8;
      this.setState({
        emotion: {
          ...this.state.emotion,
          fear: Math.min(100, this.state.emotion.fear + fearIncrease),
          stability: Math.max(0, this.state.emotion.stability - 10),
        },
        echo: {
          ...this.state.echo,
          trust: Math.max(0, this.state.echo.trust - 3),
        },
      });
    });

    // Puzzle solved → story progress + flower growth
    this.on("PUZZLE_COMPLETED", (e) => {
      const reward = (e.payload?.progressReward as number) ?? 3;
      this.setState({
        story: {
          ...this.state.story,
          overall: Math.min(100, this.state.story.overall + reward),
          puzzlesSolved: this.state.story.puzzlesSolved + 1,
          flowerProgress: Math.min(100, this.state.story.flowerProgress + 2),
        },
        emotion: {
          ...this.state.emotion,
          hope: Math.min(100, this.state.emotion.hope + 4),
          stability: Math.min(100, this.state.emotion.stability + 3),
        },
      });
      this.emit("FLOWER_GROWTH", { delta: 2 });
    });

    // Time state change → everything shifts
    this.on("TIME_STATE_CHANGED", (e) => {
      const newTime = e.payload?.timeState as TimeState;
      if (newTime === "night") {
        this.setState({
          nightPhase: "11:00",
          instabilityLevel: 1,
          emotion: {
            ...this.state.emotion,
            fear: Math.min(100, this.state.emotion.fear + 15),
            stability: Math.max(0, this.state.emotion.stability - 20),
          },
        });
      } else {
        this.setState({
          nightPhase: null,
          instabilityLevel: 0,
          emotion: {
            ...this.state.emotion,
            fear: Math.max(0, this.state.emotion.fear - 10),
            stability: Math.min(100, this.state.emotion.stability + 15),
            hope: Math.min(100, this.state.emotion.hope + 5),
          },
        });
      }
    });

    // Night phase progression (11:00 → 11:05 → 11:11)
    this.on("NIGHT_PHASE_CHANGED", (e) => {
      const phase = e.payload?.phase as NightPhase;
      if (phase === "11:05") {
        this.setState({
          instabilityLevel: 2,
          emotion: {
            ...this.state.emotion,
            fear: Math.min(100, this.state.emotion.fear + 10),
            loneliness: Math.min(100, this.state.emotion.loneliness + 8),
          },
        });
      } else if (phase === "11:11") {
        this.setState({
          instabilityLevel: 3,
          emotion: {
            ...this.state.emotion,
            fear: Math.min(100, this.state.emotion.fear + 20),
            hope: Math.max(0, this.state.emotion.hope - 10),
            loneliness: Math.min(100, this.state.emotion.loneliness + 15),
          },
        });
      }
    });

    // Day progress → stability + hope recovery
    this.on("DAY_PROGRESS", () => {
      this.setState({
        emotion: {
          ...this.state.emotion,
          stability: Math.min(100, this.state.emotion.stability + 5),
          hope: Math.min(100, this.state.emotion.hope + 3),
          fear: Math.max(0, this.state.emotion.fear - 5),
        },
        story: {
          ...this.state.story,
          overall: Math.min(100, this.state.story.overall + 1),
          activeDays: this.state.story.activeDays + 1,
        },
      });
    });

    // Memory discovered → story + emotion changes
    this.on("MEMORY_DISCOVERED", () => {
      this.setState({
        story: {
          ...this.state.story,
          memoriesDiscovered: this.state.story.memoriesDiscovered + 1,
          overall: Math.min(100, this.state.story.overall + 2),
        },
        emotion: {
          ...this.state.emotion,
          stability: Math.min(100, this.state.emotion.stability + 4),
        },
      });
    });

    // Echo message sent → trust changes over time
    this.on("ECHO_MESSAGE_SENT", (e) => {
      const trustDelta = (e.payload?.trustDelta as number) ?? 2;
      const newTrust = Math.min(100, Math.max(0, this.state.echo.trust + trustDelta));
      
      // Determine mood from trust
      let newMood = this.state.echo.mood;
      if (newTrust >= 80) newMood = "awakening";
      else if (newTrust >= 60) newMood = "sad";
      else if (newTrust >= 40) newMood = "aware";
      else if (newTrust >= 20) newMood = "confused";
      
      this.setState({
        echo: {
          ...this.state.echo,
          trust: newTrust,
          mood: newMood,
        },
      });
    });
  }

  // Sync from gameState (existing legacy system)
  private syncFromGameState(): void {
    const gs = gameStore.getState();
    const trustMapped = Math.round((gs.trustAI / 10) * 100);
    const fearMapped = Math.round((gs.fear / 10) * 100);
    
    this.setState({
      echo: { ...this.state.echo, trust: trustMapped },
      emotion: { ...this.state.emotion, fear: fearMapped },
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /** تحديث الوقت يدوياً (من useTheme أو من toggle) */
  setTimeState(timeState: TimeState, nightPhase?: NightPhase): void {
    this.setState({ timeState, nightPhase: nightPhase ?? this.state.nightPhase });
    this.emit("TIME_STATE_CHANGED", { timeState });
  }

  /** تقدم مرحلة الليل */
  advanceNightPhase(): void {
    const phases: NightPhase[] = ["11:00", "11:05", "11:11"];
    const currentIndex = phases.indexOf(this.state.nightPhase);
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      this.setState({ nightPhase: nextPhase });
      this.emit("NIGHT_PHASE_CHANGED", { phase: nextPhase });
    }
  }

  /** إضافة شظية ذاكرة */
  addMemoryFragment(fragment: string): void {
    const fragments = [fragment, ...this.state.echo.memoryFragments].slice(0, 10);
    this.setState({ echo: { ...this.state.echo, memoryFragments: fragments } });
  }

  /** إضافة تقدم للزهور */
  growFlowers(amount: number): void {
    const newProgress = Math.min(100, this.state.story.flowerProgress + amount);
    this.setState({ story: { ...this.state.story, flowerProgress: newProgress } });
    this.emit("FLOWER_GROWTH", { delta: amount });
  }

  /** إعادة تعيين كل شيء */
  reset(): void {
    this.state = { ...DEFAULT_WORLD_STATE, lastUpdated: Date.now() };
    this.save();
    this.broadcast();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────

export const worldState = new WorldStateEngine();