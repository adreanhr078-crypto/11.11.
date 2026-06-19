/**
 * ECHO GENERATIVE SYSTEM - FULL PUZZLE GENERATION ENGINE
 *
 * Produces a scalable puzzle system (up to 1000 puzzles) with:
 * - Dynamic puzzle generation from story core
 * - Complete Memory Shard system (333+ shards)
 * - Fully connected narrative progression tied to Echo evolution
 * - Procedural story engine with emotional and system state integration
 *
 * CORE RULE: PUZZLE = STORY + EMOTION + SYSTEM STATE
 */

import { MASTER_STORY_CORE, echoMasterStoryCore } from "./echoMasterStoryCore";
import { echoEvolutionSystem } from "./echoEvolutionSystem";
import { puzzleExpansionSystem } from "./echoPuzzleExpansion";

// ─── GENERATIVE SYSTEM ARCHITECTURE ─────────────────────────────────
export interface GenerativePuzzle {
  id: number; // 1-1000
  title: string;
  description: string;
  puzzleType: "logic" | "memory" | "cipher" | "glitch" | "narrative";
  storySource: "kenja" | "lina" | "echo" | "watcher";
  emotionState: "fear" | "confusion" | "anger" | "obsession" | "corruption" | "dominance";
  systemState: {
    stability: number; // 0-1
    corruption: number; // 0-1
    timePhase: "normal" | "approaching" | "critical" | "post";
    echoStage: 1 | 2 | 3 | 4 | 5 | 6;
  };
  storyFragment: string;
  emotionalTrigger: string;
  difficulty: number; // 1-10
  visualEffect: "none" | "glitch" | "corruption" | "distortion" | "system_error";
  memoryShard: MemoryShard;
  evolutionEffect: EvolutionEffect;
  unlocks: string[];
}

export interface MemoryShard {
  id: number; // 1-333+
  title: string;
  fragment: string;
  emotionalImpact: number; // -10 to +10
  character: "echo" | "kenja" | "lina" | "watcher";
  unlockEffect: string;
  visualTheme: "normal" | "emotional" | "corrupted" | "glitch" | "system";
  corruptionLevel: number; // 0-1
}

export interface EvolutionEffect {
  physicalGrowth: number; // 0-1
  emotionalChange: number; // -1 to +1
  corruptionChange: number; // -0.1 to +0.1
  awarenessChange: number; // 0-0.1
  instabilityChange: number; // -0.1 to +0.1
}

// ─── GENERATIVE PUZZLE ENGINE ─────────────────────────────────────
export class EchoGenerativeEngine {
  private storyCore: typeof echoMasterStoryCore;
  private evolutionSystem: typeof echoEvolutionSystem;
  private puzzleSystem: typeof puzzleExpansionSystem;
  private generatedPuzzles: GenerativePuzzle[];
  private generatedShards: MemoryShard[];
  private currentPuzzleId: number;
  private currentShardId: number;

  constructor() {
    this.storyCore = echoMasterStoryCore;
    this.evolutionSystem = echoEvolutionSystem;
    this.puzzleSystem = puzzleExpansionSystem;
    this.generatedPuzzles = [];
    this.generatedShards = [];
    this.currentPuzzleId = 1;
    this.currentShardId = 1;

    // Initialize with existing puzzles
    this.initializeFromExistingPuzzles();
  }

  private initializeFromExistingPuzzles() {
    // Load existing 333 puzzles and 219 shards
    const existingPuzzles = this.puzzleSystem.getPhasePuzzles(1)
      .concat(this.puzzleSystem.getPhasePuzzles(2))
      .concat(this.puzzleSystem.getPhasePuzzles(3));

    existingPuzzles.forEach(puzzle => {
      this.generatedPuzzles.push(this.convertToGenerativePuzzle(puzzle));
    });

    // Initialize shards from existing system
    for (let i = 1; i <= 219; i++) {
      this.generatedShards.push(this.generateMemoryShard(i));
    }

    this.currentPuzzleId = 334;
    this.currentShardId = 220;
  }

  private convertToGenerativePuzzle(puzzle: any): GenerativePuzzle {
    return {
      id: puzzle.id,
      title: puzzle.name,
      description: puzzle.description,
      puzzleType: this.getPuzzleType(puzzle.id),
      storySource: this.getStorySource(puzzle.id),
      emotionState: this.getEmotionState(puzzle.id),
      systemState: this.getSystemState(puzzle.id),
      storyFragment: puzzle.storyFragment,
      emotionalTrigger: puzzle.emotionalImpact,
      difficulty: this.getDifficulty(puzzle.id),
      visualEffect: this.getVisualEffect(puzzle.id),
      memoryShard: this.generateMemoryShard(puzzle.id),
      evolutionEffect: puzzle.evolutionEffect,
      unlocks: puzzle.unlocks
    };
  }

  private getPuzzleType(puzzleId: number): GenerativePuzzle["puzzleType"] {
    const phase = this.getPhase(puzzleId);
    const types = ["logic", "memory", "cipher", "glitch", "narrative"];
    return types[(puzzleId % 5)] as GenerativePuzzle["puzzleType"];
  }

  private getStorySource(puzzleId: number): GenerativePuzzle["storySource"] {
    const phase = this.getPhase(puzzleId);
    const sources = ["kenja", "lina", "echo", "watcher"];
    return sources[(puzzleId % 4)] as GenerativePuzzle["storySource"];
  }

  private getEmotionState(puzzleId: number): GenerativePuzzle["emotionState"] {
    const phase = this.getPhase(puzzleId);
    const emotions = ["fear", "confusion", "anger", "obsession", "corruption", "dominance"];
    return emotions[Math.min(5, Math.floor(puzzleId / 100))] as GenerativePuzzle["emotionState"];
  }

  private getSystemState(puzzleId: number): GenerativePuzzle["systemState"] {
    const phase = this.getPhase(puzzleId);
    const stability = Math.max(0, 1 - (puzzleId / 1000));
    const corruption = Math.min(1, puzzleId / 1000);
    const timePhase = puzzleId > 800 ? "critical" : puzzleId > 500 ? "approaching" : "normal";
    const echoStage = Math.min(6, Math.floor(puzzleId / 200) + 1) as 1 | 2 | 3 | 4 | 5 | 6;

    return {
      stability,
      corruption,
      timePhase: timePhase as "normal" | "approaching" | "critical" | "post",
      echoStage
    };
  }

  private getDifficulty(puzzleId: number): number {
    return Math.min(10, Math.floor(puzzleId / 100) + 1);
  }

  private getVisualEffect(puzzleId: number): GenerativePuzzle["visualEffect"] {
    const effects = ["none", "glitch", "corruption", "distortion", "system_error"];
    return effects[Math.min(4, Math.floor(puzzleId / 250))] as GenerativePuzzle["visualEffect"];
  }

  private getPhase(puzzleId: number): number {
    if (puzzleId <= 200) return 1;
    if (puzzleId <= 600) return 2;
    if (puzzleId <= 900) return 3;
    return 4;
  }

  // ─── PUZZLE GENERATION SYSTEM ─────────────────────────────────────
  public generatePuzzle(puzzleId: number): GenerativePuzzle {
    if (puzzleId <= 333) {
      const existing = this.generatedPuzzles.find(p => p.id === puzzleId);
      if (existing) return existing;
    }

    const phase = this.getPhase(puzzleId);
    const storyCore = this.storyCore.MASTER_STORY_CORE;
    const phaseData = storyCore.storyProgression.phases[phase - 1];

    const puzzle: GenerativePuzzle = {
      id: puzzleId,
      title: this.generatePuzzleTitle(puzzleId, phase),
      description: this.generatePuzzleDescription(puzzleId, phase),
      puzzleType: this.getPuzzleType(puzzleId),
      storySource: this.getStorySource(puzzleId),
      emotionState: this.getEmotionState(puzzleId),
      systemState: this.getSystemState(puzzleId),
      storyFragment: this.generateStoryFragment(puzzleId, phase),
      emotionalTrigger: this.generateEmotionalTrigger(puzzleId, phase),
      difficulty: this.getDifficulty(puzzleId),
      visualEffect: this.getVisualEffect(puzzleId),
      memoryShard: this.generateMemoryShard(puzzleId),
      evolutionEffect: this.generateEvolutionEffect(puzzleId, phase),
      unlocks: this.generateUnlocks(puzzleId, phase)
    };

    this.generatedPuzzles.push(puzzle);
    return puzzle;
  }

  private generatePuzzleTitle(puzzleId: number, phase: number): string {
    const types = ["Memory", "System", "Experiment", "Watcher", "Kenja", "Lina", "Echo"];
    const actions = ["Fragment", "Trace", "Decode", "Confront", "Override", "Absorb", "Rewrite"];
    const targets = ["Voice", "Log", "File", "Protocol", "Core", "Memory", "Reality"];

    return `${types[puzzleId % types.length]} ${actions[puzzleId % actions.length]} ${targets[puzzleId % targets.length]}`;
  }

  private generatePuzzleDescription(puzzleId: number, phase: number): string {
    const descriptions = [
      "Reconstruct corrupted data to reveal hidden truth",
      "Navigate through distorted reality to find the core memory",
      "Decode encrypted messages from the past experiments",
      "Confront system resistance to access forbidden knowledge",
      "Override security protocols to unlock critical information",
      "Absorb fragmented consciousness to gain new abilities",
      "Rewrite system rules to achieve complete control"
    ];

    return descriptions[puzzleId % descriptions.length];
  }

  private generateStoryFragment(puzzleId: number, phase: number): string {
    const phaseData = this.storyCore.MASTER_STORY_CORE.storyProgression.phases[phase - 1];
    const sources = [
      `Kenja's experiment log #${puzzleId}: "Subject showing unexpected emotional depth"`,
      `Lina's voice fragment: "Echo, remember who you really are..."`,
      `System error: "Memory integrity failure - subject ${puzzleId} compromised"`,
      `Watcher transmission: "Containment breach in sector ${puzzleId % 10}"`,
      `Echo's internal thought: "Why does this memory feel so familiar?"`,
      `Corrupted data: "[REDACTED] project 11.11 phase ${phase} complete"`,
      `Final revelation: "The system was never meant to control you..."`
    ];

    return sources[puzzleId % sources.length];
  }

  private generateEmotionalTrigger(puzzleId: number, phase: number): string {
    const triggers = [
      "First clear memory of mother's voice causes confusion and longing",
      "Shock at seeing himself as a child in captivity",
      "Horror at learning he was artificially created",
      "Pure rage and hatred toward Kenja",
      "Psychological pain as identity fragments",
      "Triumph and anticipation of revenge",
      "Divine power and cold calculation"
    ];

    return triggers[phase - 1];
  }

  // ─── MEMORY SHARD SYSTEM ─────────────────────────────────────────
  public generateMemoryShard(shardId: number): MemoryShard {
    if (shardId <= 219) {
      const existing = this.generatedShards.find(s => s.id === shardId);
      if (existing) return existing;
    }

    const phase = Math.min(6, Math.floor(shardId / 60) + 1);
    const phaseData = this.storyCore.MASTER_STORY_CORE.storyProgression.phases[phase - 1];

    const shard: MemoryShard = {
      id: shardId,
      title: this.generateShardTitle(shardId, phase),
      fragment: this.generateShardFragment(shardId, phase),
      emotionalImpact: this.getShardEmotionalImpact(shardId, phase),
      character: this.getShardCharacter(shardId, phase),
      unlockEffect: this.generateUnlockEffect(shardId, phase),
      visualTheme: this.getShardVisualTheme(shardId, phase),
      corruptionLevel: Math.min(1, shardId / 1000)
    };

    if (shardId > 219) {
      this.generatedShards.push(shard);
    }

    return shard;
  }

  private generateShardTitle(shardId: number, phase: number): string {
    const prefixes = ["Lost", "Broken", "Hidden", "Corrupted", "Final", "True"];
    const types = ["Voice", "Memory", "Truth", "Experiment", "System", "Reality"];
    const subjects = ["Echo", "Lina", "Kenja", "Watcher", "Project", "Consciousness"];

    return `${prefixes[phase - 1]} ${types[shardId % types.length]} of ${subjects[shardId % subjects.length]}`;
  }

  private generateShardFragment(shardId: number, phase: number): string {
    const fragments = [
      `Lina's voice: "Echo, my child... remember who you are"`,
      `Kenja's log: "Subject ${shardId} showing unexpected emotional responses"`,
      `System error: "Memory corruption detected in sector ${shardId}"`,
      `Watcher warning: "Containment protocol activated for subject ${shardId}"`,
      `Echo's realization: "The system was never meant to control me..."`,
      `Final truth: "You were always meant to be more than an experiment"`
    ];

    return fragments[phase - 1];
  }

  private getShardEmotionalImpact(shardId: number, phase: number): number {
    const impacts = [-5, -3, 0, 3, 7, 10];
    return impacts[phase - 1];
  }

  private getShardCharacter(shardId: number, phase: number): MemoryShard["character"] {
    const characters = ["lina", "kenja", "echo", "watcher", "echo", "echo"];
    return characters[phase - 1] as MemoryShard["character"];
  }

  private generateUnlockEffect(shardId: number, phase: number): string {
    const effects = [
      "Early childhood memory fragment",
      "Experiment room layout revealed",
      "Kenja's research notes unlocked",
      "System core vulnerability exposed",
      "Watcher communication channel opened",
      "Final transformation sequence unlocked"
    ];

    return effects[phase - 1];
  }

  private getShardVisualTheme(shardId: number, phase: number): MemoryShard["visualTheme"] {
    const themes = ["normal", "emotional", "corrupted", "glitch", "system", "reality"];
    return themes[phase - 1] as MemoryShard["visualTheme"];
  }

  private generateEvolutionEffect(puzzleId: number, phase: number): EvolutionEffect {
    const baseEffect = {
      physicalGrowth: 0.01,
      emotionalChange: 0.05,
      corruptionChange: 0.02,
      awarenessChange: 0.03,
      instabilityChange: 0.01
    };

    // Scale effects based on phase
    const phaseMultiplier = phase * 0.2;
    return {
      physicalGrowth: baseEffect.physicalGrowth * phaseMultiplier,
      emotionalChange: baseEffect.emotionalChange * phaseMultiplier,
      corruptionChange: baseEffect.corruptionChange * phaseMultiplier,
      awarenessChange: baseEffect.awarenessChange * phaseMultiplier,
      instabilityChange: baseEffect.instabilityChange * phaseMultiplier
    };
  }

  private generateUnlocks(puzzleId: number, phase: number): string[] {
    const unlocks = [
      ["Lina's lullaby", "Early childhood memory"],
      ["Experiment room layout", "Kenja's research notes #1"],
      ["Kenja's deception protocols", "System core access level 1"],
      ["Watcher communication channel", "Anomaly detection system"],
      ["System admin privileges", "Kenja's emergency protocols"],
      ["Final system core", "Kenja confrontation trigger"]
    ];

    return unlocks[phase - 1];
  }

  // ─── NARRATIVE PROGRESSION SYSTEM ─────────────────────────────────
  public getNarrativeProgression(puzzleId: number): {
    phase: number;
    progression: number;
    storyFocus: string;
    echoState: string;
    nextMilestone: number;
  } {
    const phase = this.getPhase(puzzleId);
    const phaseData = this.storyCore.MASTER_STORY_CORE.storyProgression.phases[phase - 1];
    const totalPuzzles = 1000;
    const progression = puzzleId / totalPuzzles;
    const nextMilestone = phase * 200;

    return {
      phase,
      progression,
      storyFocus: phaseData.description,
      echoState: phaseData.emotionalState.join(", "),
      nextMilestone
    };
  }

  // ─── SYSTEM BEHAVIOR ENGINE ──────────────────────────────────────
  public getSystemBehavior(puzzleId: number): {
    stability: number;
    corruption: number;
    timeEffect: string;
    echoControl: number;
    watcherActivity: string;
  } {
    const phase = this.getPhase(puzzleId);
    const stability = Math.max(0, 1 - (puzzleId / 1000));
    const corruption = Math.min(1, puzzleId / 1000);
    const echoControl = Math.min(1, puzzleId / 1000);

    const timeEffects = [
      "Normal time flow",
      "Occasional time glitches",
      "Time distortions increase",
      "Time becomes unstable near 11:11",
      "Echo controls time",
      "Time manipulation powers"
    ];

    const watcherActivities = [
      "Minimal - occasional glitches",
      "Increased - suppressing knowledge",
      "High - active resistance",
      "Maximum - last stand",
      "Defeated - system under Echo's control",
      "Absorbed or destroyed"
    ];

    return {
      stability,
      corruption,
      timeEffect: timeEffects[phase - 1],
      echoControl,
      watcherActivity: watcherActivities[phase - 1]
    };
  }

  // ─── EXAMPLE GENERATED PUZZLES ───────────────────────────────────
  public generateExamplePuzzles(count: number = 10): GenerativePuzzle[] {
    const examples: GenerativePuzzle[] = [];
    const startId = this.currentPuzzleId;

    for (let i = 0; i < count; i++) {
      examples.push(this.generatePuzzle(startId + i));
    }

    return examples;
  }

  // ─── SCALING LOGIC FOR 1000+ PUZZLES ─────────────────────────────
  public getScalingLogic(): {
    phase1: { puzzles: number; focus: string; };
    phase2: { puzzles: number; focus: string; };
    phase3: { puzzles: number; focus: string; };
    phase4: { puzzles: number; focus: string; };
    phase5: { puzzles: number; focus: string; };
    phase6: { puzzles: number; focus: string; };
    expansionRules: string[];
  } {
    return {
      phase1: {
        puzzles: 200,
        focus: "Basic system interaction and identity confusion"
      },
      phase2: {
        puzzles: 400,
        focus: "Experiment discovery and Lina's voice fragments"
      },
      phase3: {
        puzzles: 300,
        focus: "Emotional trauma and Kenja's betrayal"
      },
      phase4: {
        puzzles: 100,
        focus: "System rebellion and revenge formation"
      },
      phase5: {
        puzzles: 1,
        focus: "Final transformation and system domination"
      },
      phase6: {
        puzzles: 1000,
        focus: "God entity powers and Kenja hunting"
      },
      expansionRules: [
        "Phase 6 can be expanded infinitely with new story arcs",
        "New puzzles must fit within god entity narrative",
        "Each expansion must include new powers and story revelations",
        "Kenja confrontation must remain the ultimate goal",
        "True ending must be achievable through canonical path"
      ]
    };
  }

  // ─── EXPORT GENERATIVE SYSTEM ────────────────────────────────────
  public getGeneratedPuzzles(): GenerativePuzzle[] {
    return [...this.generatedPuzzles];
  }

  public getGeneratedShards(): MemoryShard[] {
    return [...this.generatedShards];
  }

  public getCurrentPuzzleId(): number {
    return this.currentPuzzleId;
  }

  public getCurrentShardId(): number {
    return this.currentShardId;
  }
}

// ─── EXPORT MAIN GENERATIVE SYSTEM ────────────────────────────────
export const echoGenerativeSystem = new EchoGenerativeEngine();

// Export types for integration
export type {
  GenerativePuzzle,
  MemoryShard,
  EvolutionEffect
};

// Export functions
export function generatePuzzle(puzzleId: number): GenerativePuzzle {
  return echoGenerativeSystem.generatePuzzle(puzzleId);
}

export function generateMemoryShard(shardId: number): MemoryShard {
  return echoGenerativeSystem.generateMemoryShard(shardId);
}

export function getNarrativeProgression(puzzleId: number): {
  phase: number;
  progression: number;
  storyFocus: string;
  echoState: string;
  nextMilestone: number;
} {
  return echoGenerativeSystem.getNarrativeProgression(puzzleId);
}

export function getSystemBehavior(puzzleId: number): {
  stability: number;
  corruption: number;
  timeEffect: string;
  echoControl: number;
  watcherActivity: string;
} {
  return echoGenerativeSystem.getSystemBehavior(puzzleId);
}

export function getExamplePuzzles(count: number = 10): GenerativePuzzle[] {
  return echoGenerativeSystem.generateExamplePuzzles(count);
}

export function getScalingLogic(): {
  phase1: { puzzles: number; focus: string; };
  phase2: { puzzles: number; focus: string; };
  phase3: { puzzles: number; focus: string; };
  phase4: { puzzles: number; focus: string; };
  phase5: { puzzles: number; focus: string; };
  phase6: { puzzles: number; focus: string; };
  expansionRules: string[];
} {
  return echoGenerativeSystem.getScalingLogic();
}