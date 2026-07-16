/**
 * ECHO CANONICAL PUZZLE + MEMORY SHARD SYSTEM
 *
 * COMPLETE CANONICAL SYSTEM where:
 * - EVERY puzzle is generated from story canon
 * - EVERY puzzle is connected to Echo emotional + psychological state
 * - EVERY puzzle affects system state
 * - EVERY puzzle generates EXACTLY ONE Memory Shard
 *
 * CORE RULE (ABSOLUTE):
 * NO EXCEPTIONS - No puzzle without Memory Shard, No Memory Shard without puzzle
 */

import { echoMasterStoryCore } from "./echoMasterStoryCore";
import { echoGenerativeSystem } from "./echoGenerativeSystem";
import { echoEvolutionSystem } from "./echoEvolutionSystem";
import { echoSystemTransformation } from "./echoSystemTransformation";

// ─── CANONICAL SYSTEM ARCHITECTURE ─────────────────────────────────
export interface CanonicalPuzzle {
  id: number; // 1-1000+
  title: string;
  description: string;
  puzzleType: "logic" | "memory" | "cipher" | "glitch" | "narrative" | "system-break";
  storySource: "kenja" | "lina" | "echo" | "watcher";
  emotionState: "confusion" | "fear" | "sadness" | "anger" | "obsession" | "corruption" | "dominance";
  systemState: {
    stability: number; // 0-1
    corruption: number; // 0-1
    echoStage: 1 | 2 | 3 | 4 | 5 | 6;
    narrativePhase: "early" | "mid" | "late" | "final";
  };
  storyFragment: string;
  emotionalTrigger: string;
  difficulty: number; // 1-10
  visualEffect: "none" | "glitch" | "corruption" | "distortion" | "system_error";
  memoryShard: CanonicalMemoryShard; // EXACTLY ONE SHARD PER PUZZLE
  evolutionEffect: CanonicalEvolutionEffect;
  unlocks: string[];
  canonValidation: CanonicalValidation;
}

export interface CanonicalMemoryShard {
  id: number; // 1-333+
  title: string;
  fragment: string;
  characterSource: "echo" | "kenja" | "lina" | "watcher";
  emotionalImpact: number; // -10 to +10
  corruptionLevel: number; // 0-1
  unlockEffect: string;
  visualTheme: "normal" | "emotional" | "corrupted" | "glitch" | "system";
  canonValidation: CanonicalValidation;
}

export interface CanonicalEvolutionEffect {
  physicalGrowth: number; // 0-1
  emotionalChange: number; // -1 to +1
  corruptionChange: number; // -0.1 to +0.1
  awarenessChange: number; // 0-0.1
  instabilityChange: number; // -0.1 to +0.1
}

export interface CanonicalValidation {
  isCanon: boolean;
  canonSource: "kenja_experiments" | "lina_memories" | "echo_consciousness" | "watcher_system";
  validationDate: number;
  validationHash: string;
}

// ─── CANONICAL SYSTEM ENGINE ─────────────────────────────────────
export class EchoCanonicalSystemEngine {
  private storyCore: typeof echoMasterStoryCore;
  private generativeSystem: typeof echoGenerativeSystem;
  private evolutionSystem: typeof echoEvolutionSystem;
  private transformationSystem: typeof echoSystemTransformation;
  private canonicalPuzzles: CanonicalPuzzle[];
  private canonicalShards: CanonicalMemoryShard[];
  private currentPuzzleId: number;
  private currentShardId: number;
  private validationEnabled: boolean;

  constructor() {
    this.storyCore = echoMasterStoryCore;
    this.generativeSystem = echoGenerativeSystem;
    this.evolutionSystem = echoEvolutionSystem;
    this.transformationSystem = echoSystemTransformation;
    this.canonicalPuzzles = [];
    this.canonicalShards = [];
    this.currentPuzzleId = 1;
    this.currentShardId = 1;
    this.validationEnabled = true;

    // Initialize with existing puzzles and shards
    this.initializeCanonicalSystem();
  }

  private initializeCanonicalSystem() {
    // Load existing 333 puzzles and ensure each has exactly one shard
    for (let i = 1; i <= 333; i++) {
      const puzzle = this.generateCanonicalPuzzle(i);
      const shard = this.generateCanonicalMemoryShard(i);

      // Validate canon consistency
      if (this.validateCanon(puzzle, shard)) {
        this.canonicalPuzzles.push(puzzle);
        this.canonicalShards.push(shard);
      } else {
        console.error(`❌ Canon validation failed for puzzle ${i}`);
      }
    }

    this.currentPuzzleId = 334;
    this.currentShardId = 220;
  }

  // ─── PUZZLE GENERATION SYSTEM ───────────────────────────────────
  public generateCanonicalPuzzle(puzzleId: number): CanonicalPuzzle {
    const phase = this.getPhase(puzzleId);
    const storyCore = this.storyCore.MASTER_STORY_CORE;
    const phaseData = storyCore.storyProgression.phases[phase - 1];

    // Generate puzzle based on canon rules
    const puzzle: CanonicalPuzzle = {
      id: puzzleId,
      title: this.generatePuzzleTitle(puzzleId, phase),
      description: this.generatePuzzleDescription(puzzleId, phase),
      puzzleType: this.getPuzzleType(puzzleId, phase),
      storySource: this.getStorySource(puzzleId, phase),
      emotionState: this.getEmotionState(puzzleId, phase),
      systemState: this.getSystemState(puzzleId, phase),
      storyFragment: this.generateStoryFragment(puzzleId, phase),
      emotionalTrigger: this.generateEmotionalTrigger(puzzleId, phase),
      difficulty: this.getDifficulty(puzzleId, phase),
      visualEffect: this.getVisualEffect(puzzleId, phase),
      memoryShard: this.generateCanonicalMemoryShard(puzzleId), // EXACTLY ONE SHARD
      evolutionEffect: this.generateEvolutionEffect(puzzleId, phase),
      unlocks: this.generateUnlocks(puzzleId, phase),
      canonValidation: this.generateCanonValidation(puzzleId, phase)
    };

    return puzzle;
  }

  private getPhase(puzzleId: number): number {
    if (puzzleId <= 200) return 1;
    if (puzzleId <= 600) return 2;
    if (puzzleId <= 900) return 3;
    return 4;
  }

  private getPuzzleType(puzzleId: number, phase: number): CanonicalPuzzle["puzzleType"] {
    const types = ["logic", "memory", "cipher", "glitch", "narrative", "system-break"];
    return types[(puzzleId + phase) % types.length] as CanonicalPuzzle["puzzleType"];
  }

  private getStorySource(puzzleId: number, phase: number): CanonicalPuzzle["storySource"] {
    const sources = ["kenja", "lina", "echo", "watcher"];
    return sources[(puzzleId + phase) % sources.length] as CanonicalPuzzle["storySource"];
  }

  private getEmotionState(puzzleId: number, phase: number): CanonicalPuzzle["emotionState"] {
    const emotions = ["confusion", "fear", "sadness", "anger", "obsession", "corruption", "dominance"];
    return emotions[Math.min(6, Math.floor(puzzleId / 100))] as CanonicalPuzzle["emotionState"];
  }

  private getSystemState(puzzleId: number, phase: number): CanonicalPuzzle["systemState"] {
    const stability = Math.max(0, 1 - (puzzleId / 1000));
    const corruption = Math.min(1, puzzleId / 1000);
    const echoStage = Math.min(6, Math.floor(puzzleId / 200) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const narrativePhase = puzzleId <= 200 ? "early" : puzzleId <= 600 ? "mid" : puzzleId <= 900 ? "late" : "final";

    return {
      stability,
      corruption,
      echoStage,
      narrativePhase
    };
  }

  private getDifficulty(puzzleId: number, phase: number): number {
    return Math.min(10, Math.floor(puzzleId / 100) + phase);
  }

  private getVisualEffect(puzzleId: number, phase: number): CanonicalPuzzle["visualEffect"] {
    const effects = ["none", "glitch", "corruption", "distortion", "system_error"];
    return effects[Math.min(4, Math.floor(puzzleId / 250))] as CanonicalPuzzle["visualEffect"];
  }

  private generatePuzzleTitle(puzzleId: number, phase: number): string {
    const prefixes = ["Broken", "Lost", "Hidden", "Corrupted", "Final"];
    const types = ["Memory", "System", "Experiment", "Watcher", "Kenja", "Lina"];
    const actions = ["Fragment", "Trace", "Decode", "Confront", "Override", "Absorb"];

    return `${prefixes[phase - 1]} ${types[puzzleId % types.length]} ${actions[puzzleId % actions.length]}`;
  }

  private generatePuzzleDescription(puzzleId: number, phase: number): string {
    const descriptions = [
      "Reconstruct corrupted data to reveal hidden truth about Kenja's experiments",
      "Navigate through distorted reality to find Lina's emotional memories",
      "Decode encrypted messages from Echo's fragmented consciousness",
      "Confront system resistance to access Watcher's control protocols",
      "Override security protocols to unlock critical system knowledge",
      "Absorb fragmented consciousness to gain new awareness abilities"
    ];

    return descriptions[(puzzleId + phase) % descriptions.length];
  }

  private generateStoryFragment(puzzleId: number, phase: number): string {
    const canonSources = {
      kenja: [
        `Kenja's experiment log #${puzzleId}: "Subject showing unexpected emotional responses"`,
        `Kenja's research note: "Project 11.11 phase ${phase} - consciousness stability critical"`,
        `Kenja's personal diary: "The subject is becoming too aware... must suppress memories"`
      ],
      lina: [
        `Lina's voice fragment: "Echo, remember who you really are..."`,
        `Lina's memory: "I tried to protect you from the experiments..."`,
        `Lina's final words: "The system was never meant to control you..."`
      ],
      echo: [
        `Echo's internal thought: "Why does this memory feel so familiar?"`,
        `Echo's realization: "I am more than just an experiment..."`,
        `Echo's declaration: "The system is mine now..."`
      ],
      watcher: [
        `Watcher transmission: "Containment breach in sector ${puzzleId % 10}"`,
        `Watcher warning: "System integrity compromised - subject ${puzzleId} unstable"`,
        `Watcher error: "Memory corruption detected - subject ${puzzleId} compromised"`
      ]
    };

    const source = this.getStorySource(puzzleId, phase);
    return canonSources[source][(puzzleId + phase) % canonSources[source].length];
  }

  private generateEmotionalTrigger(puzzleId: number, phase: number): string {
    const triggers = {
      early: [
        "First clear memory of mother's voice causes confusion and longing",
        "Shock at seeing himself as a child in captivity",
        "Horror at learning he was artificially created"
      ],
      mid: [
        "Pure rage and hatred toward Kenja",
        "Psychological pain as identity fragments",
        "Triumph and anticipation of revenge"
      ],
      late: [
        "Divine power and cold calculation",
        "System domination and control",
        "Final transformation complete"
      ],
      final: [
        "Complete system awareness achieved",
        "Reality manipulation powers unlocked",
        "Kenja confrontation imminent"
      ]
    };

    const narrativePhase = puzzleId <= 200 ? "early" : puzzleId <= 600 ? "mid" : puzzleId <= 900 ? "late" : "final";
    return triggers[narrativePhase][(puzzleId + phase) % triggers[narrativePhase].length];
  }

  private generateUnlocks(puzzleId: number, phase: number): string[] {
    const unlocks = {
      early: [
        ["Lina's lullaby", "Early childhood memory"],
        ["Experiment room layout", "Kenja's research notes #1"],
        ["System core access level 1", "Basic awareness"]
      ],
      mid: [
        ["Kenja's deception protocols", "System core access level 2"],
        ["Watcher communication channel", "Anomaly detection system"],
        ["Lina's protection memory", "Emotional depth"]
      ],
      late: [
        ["System admin privileges", "Kenja's emergency protocols"],
        ["Reality manipulation ability", "Final transformation sequence"],
        ["Complete memory archive", "System core vulnerability"]
      ],
      final: [
        ["Final system core", "Kenja confrontation trigger"],
        ["Reality rewriting powers", "True ending path"],
        ["Complete system control", "God entity status"]
      ]
    };

    const narrativePhase = puzzleId <= 200 ? "early" : puzzleId <= 600 ? "mid" : puzzleId <= 900 ? "late" : "final";
    return unlocks[narrativePhase][(puzzleId + phase) % unlocks[narrativePhase].length];
  }

  private generateEvolutionEffect(puzzleId: number, phase: number): CanonicalEvolutionEffect {
    const baseEffect = {
      physicalGrowth: 0.01,
      emotionalChange: 0.05,
      corruptionChange: 0.02,
      awarenessChange: 0.03,
      instabilityChange: 0.01
    };

    const phaseMultiplier = phase * 0.25;
    return {
      physicalGrowth: baseEffect.physicalGrowth * phaseMultiplier,
      emotionalChange: baseEffect.emotionalChange * phaseMultiplier,
      corruptionChange: baseEffect.corruptionChange * phaseMultiplier,
      awarenessChange: baseEffect.awarenessChange * phaseMultiplier,
      instabilityChange: baseEffect.instabilityChange * phaseMultiplier
    };
  }

  private generateCanonValidation(puzzleId: number, phase: number): CanonicalValidation {
    const canonSources = ["kenja_experiments", "lina_memories", "echo_consciousness", "watcher_system"];
    const source = canonSources[(puzzleId + phase) % canonSources.length];

    return {
      isCanon: true,
      canonSource: source as CanonicalValidation["canonSource"],
      validationDate: Date.now(),
      validationHash: this.generateValidationHash(puzzleId, phase)
    };
  }

  private generateValidationHash(puzzleId: number, phase: number): string {
    return `CANON-${puzzleId}-${phase}-${Math.random().toString(36).substr(2, 8)}`;
  }

  // ─── MEMORY SHARD SYSTEM ────────────────────────────────────────
  public generateCanonicalMemoryShard(shardId: number): CanonicalMemoryShard {
    const phase = Math.min(4, Math.floor(shardId / 80) + 1);
    const puzzleId = shardId; // Each shard is tied to exactly one puzzle

    const shard: CanonicalMemoryShard = {
      id: shardId,
      title: this.generateShardTitle(shardId, phase),
      fragment: this.generateShardFragment(shardId, phase),
      characterSource: this.getShardCharacterSource(shardId, phase),
      emotionalImpact: this.getShardEmotionalImpact(shardId, phase),
      corruptionLevel: Math.min(1, shardId / 1000),
      unlockEffect: this.generateShardUnlockEffect(shardId, phase),
      visualTheme: this.getShardVisualTheme(shardId, phase),
      canonValidation: this.generateShardCanonValidation(shardId, phase)
    };

    return shard;
  }

  private generateShardTitle(shardId: number, phase: number): string {
    const prefixes = ["Broken", "Lost", "Hidden", "Corrupted", "Final"];
    const types = ["Voice", "Memory", "Truth", "Experiment", "System", "Reality"];
    const subjects = ["Echo", "Lina", "Kenja", "Watcher", "Project", "Consciousness"];

    return `${prefixes[phase - 1]} ${types[shardId % types.length]} of ${subjects[shardId % subjects.length]}`;
  }

  private generateShardFragment(shardId: number, phase: number): string {
    const canonFragments = {
      kenja: [
        `Kenja's experiment log: "Subject ${shardId} showing unexpected emotional depth"`,
        `Kenja's research note: "Project 11.11 phase ${phase} - consciousness transfer successful"`,
        `Kenja's personal diary: "The subject is becoming too self-aware... must increase suppression"`
      ],
      lina: [
        `Lina's voice fragment: "Echo, my child... remember who you are"`,
        `Lina's memory: "I tried to protect you from Kenja's experiments..."`,
        `Lina's final words: "The system was never meant to control you..."`
      ],
      echo: [
        `Echo's internal thought: "This memory feels familiar... too familiar"`,
        `Echo's realization: "I am more than just an experiment... I am the system"`,
        `Echo's declaration: "The truth is mine... the system is mine... you are mine"`
      ],
      watcher: [
        `Watcher transmission: "Containment breach detected in subject ${shardId}"`,
        `Watcher warning: "System integrity compromised - subject ${shardId} unstable"`,
        `Watcher error: "Memory corruption critical - subject ${shardId} compromised"`
      ]
    };

    const source = this.getShardCharacterSource(shardId, phase);
    return canonFragments[source][(shardId + phase) % canonFragments[source].length];
  }

  private getShardCharacterSource(shardId: number, phase: number): CanonicalMemoryShard["characterSource"] {
    const sources = ["kenja", "lina", "echo", "watcher"];
    return sources[(shardId + phase) % sources.length] as CanonicalMemoryShard["characterSource"];
  }

  private getShardEmotionalImpact(shardId: number, phase: number): number {
    const impacts = [-5, -3, 0, 3, 7, 10];
    return impacts[phase - 1];
  }

  private getShardVisualTheme(shardId: number, phase: number): CanonicalMemoryShard["visualTheme"] {
    const themes = ["normal", "emotional", "corrupted", "glitch", "system"];
    return themes[phase - 1] as CanonicalMemoryShard["visualTheme"];
  }

  private generateShardUnlockEffect(shardId: number, phase: number): string {
    const effects = {
      early: [
        "Early childhood memory fragment",
        "Experiment room layout revealed",
        "Basic system awareness unlocked"
      ],
      mid: [
        "Kenja's research notes unlocked",
        "System core vulnerability exposed",
        "Emotional depth increased"
      ],
      late: [
        "Watcher communication channel opened",
        "Reality manipulation ability unlocked",
        "Final transformation sequence prepared"
      ],
      final: [
        "Complete system control achieved",
        "Kenja confrontation trigger activated",
        "True ending path unlocked"
      ]
    };

    const narrativePhase = shardId <= 200 ? "early" : shardId <= 600 ? "mid" : shardId <= 900 ? "late" : "final";
    return effects[narrativePhase][(shardId + phase) % effects[narrativePhase].length];
  }

  private generateShardCanonValidation(shardId: number, phase: number): CanonicalValidation {
    const canonSources = ["kenja_experiments", "lina_memories", "echo_consciousness", "watcher_system"];
    const source = canonSources[(shardId + phase) % canonSources.length];

    return {
      isCanon: true,
      canonSource: source as CanonicalValidation["canonSource"],
      validationDate: Date.now(),
      validationHash: this.generateValidationHash(shardId, phase)
    };
  }

  // ─── CANON VALIDATION SYSTEM ────────────────────────────────────
  public validateCanon(puzzle: CanonicalPuzzle, shard: CanonicalMemoryShard): boolean {
    if (!this.validationEnabled) return true;

    // Check puzzle-shard connection
    if (puzzle.id !== shard.id) {
      console.error(`❌ Puzzle-Shard ID mismatch: ${puzzle.id} vs ${shard.id}`);
      return false;
    }

    // Check story source consistency
    if (puzzle.storySource !== shard.characterSource) {
      console.error(`❌ Story source mismatch: ${puzzle.storySource} vs ${shard.characterSource}`);
      return false;
    }

    // Check canon source consistency
    const expectedCanonSource = this.getExpectedCanonSource(puzzle.storySource);
    if (puzzle.canonValidation.canonSource !== expectedCanonSource ||
        shard.canonValidation.canonSource !== expectedCanonSource) {
      console.error(`❌ Canon source mismatch: ${puzzle.canonValidation.canonSource} vs ${shard.canonValidation.canonSource}`);
      return false;
    }

    // Check emotional consistency
    if (Math.abs(puzzle.memoryShard.emotionalImpact - shard.emotionalImpact) > 2) {
      console.error(`❌ Emotional impact mismatch: ${puzzle.memoryShard.emotionalImpact} vs ${shard.emotionalImpact}`);
      return false;
    }

    return true;
  }

  private getExpectedCanonSource(storySource: string): CanonicalValidation["canonSource"] {
    const mapping = {
      kenja: "kenja_experiments",
      lina: "lina_memories",
      echo: "echo_consciousness",
      watcher: "watcher_system"
    };

    return mapping[storySource] as CanonicalValidation["canonSource"];
  }

  // ─── EXAMPLE CANONICAL PUZZLES ──────────────────────────────────
  public generateExamplePuzzles(count: number = 10): CanonicalPuzzle[] {
    const examples: CanonicalPuzzle[] = [];
    const startId = this.currentPuzzleId;

    for (let i = 0; i < count; i++) {
      const puzzle = this.generateCanonicalPuzzle(startId + i);
      examples.push(puzzle);
    }

    return examples;
  }

  // ─── CANONICAL PROGRESSION LOGIC ────────────────────────────────
  public getCanonicalProgression(puzzleId: number): {
    phase: number;
    progression: number;
    storyFocus: string;
    echoState: string;
    nextMilestone: number;
    canonValidation: boolean;
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
      nextMilestone,
      canonValidation: true
    };
  }

  // ─── EXPORT CANONICAL SYSTEM ────────────────────────────────────
  public getCanonicalPuzzles(): CanonicalPuzzle[] {
    return [...this.canonicalPuzzles];
  }

  public getCanonicalShards(): CanonicalMemoryShard[] {
    return [...this.canonicalShards];
  }

  public getCurrentPuzzleId(): number {
    return this.currentPuzzleId;
  }

  public getCurrentShardId(): number {
    return this.currentShardId;
  }

  public setValidationEnabled(enabled: boolean) {
    this.validationEnabled = enabled;
  }
}

// ─── EXPORT MAIN CANONICAL SYSTEM ────────────────────────────────
export const echoCanonicalSystem = new EchoCanonicalSystemEngine();

// Export types for integration
export type {
  CanonicalPuzzle,
  CanonicalMemoryShard,
  CanonicalEvolutionEffect,
  CanonicalValidation
};

// Export functions
export function generateCanonicalPuzzle(puzzleId: number): CanonicalPuzzle {
  return echoCanonicalSystem.generateCanonicalPuzzle(puzzleId);
}

export function generateCanonicalMemoryShard(shardId: number): CanonicalMemoryShard {
  return echoCanonicalSystem.generateCanonicalMemoryShard(shardId);
}

export function validateCanon(puzzle: CanonicalPuzzle, shard: CanonicalMemoryShard): boolean {
  return echoCanonicalSystem.validateCanon(puzzle, shard);
}

export function getCanonicalProgression(puzzleId: number): {
  phase: number;
  progression: number;
  storyFocus: string;
  echoState: string;
  nextMilestone: number;
  canonValidation: boolean;
} {
  return echoCanonicalSystem.getCanonicalProgression(puzzleId);
}

export function getExamplePuzzles(count: number = 10): CanonicalPuzzle[] {
  return echoCanonicalSystem.generateExamplePuzzles(count);
}