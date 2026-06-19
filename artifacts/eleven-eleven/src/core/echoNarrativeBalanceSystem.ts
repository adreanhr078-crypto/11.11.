/**
 * ECHO NARRATIVE BALANCE ENGINE
 *
 * Ensures perfect pacing between story, puzzles, memory shards, Echo evolution,
 * videos, and system events to prevent overwhelming, too fast, or unbalanced gameplay.
 *
 * CORE RULE:
 * "No emotional spike can happen without a recovery phase."
 * Every high-impact event MUST be followed by calm puzzle, neutral exploration,
 * or slow emotional build-up.
 */

import { echoCanonicalSystem } from "./echoCanonicalSystem";
import { echoSystemTransformation } from "./echoSystemTransformation";
import { echoFlexibleCanonSystem } from "./echoFlexibleCanonSystem";
import { echoMultilingualSystem } from "./echoMultilingualSystem";

// ─── NARRATIVE BALANCE ARCHITECTURE ──────────────────────────────
export interface EmotionalPaceState {
  currentLoad: number; // 0-100%
  recoveryPhase: boolean;
  lastEventType: "calm" | "medium" | "high" | "critical";
  lastEventPuzzle: number;
  cooldownCounter: number;
}

export interface StoryRevealBalance {
  mysteryPhase: boolean;
  hintPhase: boolean;
  partialRevealPhase: boolean;
  silencePhase: boolean;
  fullRevealPhase: boolean;
  revealCooldown: number;
}

export interface PuzzleRhythmState {
  lastPuzzleType: string;
  consecutiveHighStress: number;
  puzzleDistribution: Record<string, number>;
  rhythmScore: number; // 0-1 (1 = perfect rhythm)
}

export interface MemoryVideoPacing {
  lastVideoPuzzle: number;
  videoCooldown: number;
  videoQueue: number[];
  pacingViolation: boolean;
}

export interface EchoTransformationControl {
  lastTransformationPuzzle: number;
  transformationCooldown: number;
  transformationPhase: number;
  transformationReady: boolean;
}

export interface CorruptionStability {
  currentCorruption: number; // 0-1
  stabilityPhase: boolean;
  corruptionSpikeAllowed: boolean;
  lastSpikePuzzle: number;
}

export interface NarrativeBalanceState {
  emotionalPace: EmotionalPaceState;
  storyReveal: StoryRevealBalance;
  puzzleRhythm: PuzzleRhythmState;
  memoryVideoPacing: MemoryVideoPacing;
  echoTransformation: EchoTransformationControl;
  corruptionStability: CorruptionStability;
  playerComfort: {
    comfortLevel: number; // 0-1
    comfortViolations: number;
    recoveryNeeded: boolean;
  };
}

// ─── NARRATIVE BALANCE ENGINE ───────────────────────────────────
export class EchoNarrativeBalanceEngine {
  private canonicalSystem: typeof echoCanonicalSystem;
  private transformationSystem: typeof echoSystemTransformation;
  private flexibleCanonSystem: typeof echoFlexibleCanonSystem;
  private multilingualSystem: typeof echoMultilingualSystem;
  private state: NarrativeBalanceState;
  private initialized: boolean;

  constructor() {
    this.canonicalSystem = echoCanonicalSystem;
    this.transformationSystem = echoSystemTransformation;
    this.flexibleCanonSystem = echoFlexibleCanonSystem;
    this.multilingualSystem = echoMultilingualSystem;
    this.initialized = false;

    // Initialize balance engine
    this.state = this.createInitialState();
    this.initializeBalanceEngine();
  }

  private createInitialState(): NarrativeBalanceState {
    return {
      emotionalPace: {
        currentLoad: 20,
        recoveryPhase: false,
        lastEventType: "calm",
        lastEventPuzzle: 0,
        cooldownCounter: 0
      },
      storyReveal: {
        mysteryPhase: true,
        hintPhase: false,
        partialRevealPhase: false,
        silencePhase: false,
        fullRevealPhase: false,
        revealCooldown: 0
      },
      puzzleRhythm: {
        lastPuzzleType: "logic",
        consecutiveHighStress: 0,
        puzzleDistribution: {
          logic: 0,
          memory: 0,
          cipher: 0,
          glitch: 0,
          narrative: 0,
          "system-break": 0
        },
        rhythmScore: 1.0
      },
      memoryVideoPacing: {
        lastVideoPuzzle: 0,
        videoCooldown: 0,
        videoQueue: [],
        pacingViolation: false
      },
      echoTransformation: {
        lastTransformationPuzzle: 0,
        transformationCooldown: 0,
        transformationPhase: 1,
        transformationReady: false
      },
      corruptionStability: {
        currentCorruption: 0.1,
        stabilityPhase: true,
        corruptionSpikeAllowed: true,
        lastSpikePuzzle: 0
      },
      playerComfort: {
        comfortLevel: 0.9,
        comfortViolations: 0,
        recoveryNeeded: false
      }
    };
  }

  private initializeBalanceEngine() {
    // Start monitoring narrative balance
    this.startBalanceMonitoring();

    this.initialized = true;
    console.log("⚖️ Narrative Balance Engine Initialized");
    console.log("📊 Perfect pacing system active");
  }

  private startBalanceMonitoring() {
    setInterval(() => {
      this.updateBalanceState();
      this.checkPacingViolations();
      this.applyRecoveryPhases();
    }, 3000);
  }

  private updateBalanceState() {
    const currentPuzzleId = this.transformationSystem.getCurrentPuzzleId();
    const progression = this.canonicalSystem.getCanonicalProgression(currentPuzzleId);

    // Update emotional pace
    this.updateEmotionalPace(currentPuzzleId);

    // Update story reveal balance
    this.updateStoryRevealBalance(currentPuzzleId);

    // Update puzzle rhythm
    this.updatePuzzleRhythm(currentPuzzleId);

    // Update memory video pacing
    this.updateMemoryVideoPacing(currentPuzzleId);

    // Update Echo transformation control
    this.updateEchoTransformationControl(currentPuzzleId);

    // Update corruption stability
    this.updateCorruptionStability(currentPuzzleId);

    // Update player comfort
    this.updatePlayerComfort();
  }

  // ─── EMOTIONAL PACE CONTROL ───────────────────────────────────
  private updateEmotionalPace(puzzleId: number) {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);

    // Determine event type based on puzzle
    const puzzle = this.canonicalSystem.getCanonicalPuzzles().find(p => p.id === puzzleId);
    if (!puzzle) return;

    let eventType: "calm" | "medium" | "high" | "critical" = "calm";

    // Classify puzzle emotional impact
    if (puzzle.difficulty <= 3) {
      eventType = "calm";
    } else if (puzzle.difficulty <= 6) {
      eventType = "medium";
    } else if (puzzle.difficulty <= 8) {
      eventType = "high";
    } else {
      eventType = "critical";
    }

    // Update emotional load
    const emotionalImpact = this.getEmotionalImpact(puzzle);
    this.state.emotionalPace.currentLoad = Math.min(100, Math.max(0, this.state.emotionalPace.currentLoad + emotionalImpact));

    // Check if recovery phase is needed
    if (this.state.emotionalPace.currentLoad > 60 && this.state.emotionalPace.lastEventType === "high") {
      this.state.emotionalPace.recoveryPhase = true;
      this.state.emotionalPace.cooldownCounter = 3; // 3 puzzles cooldown
    }

    // Update last event
    this.state.emotionalPace.lastEventType = eventType;
    this.state.emotionalPace.lastEventPuzzle = puzzleId;

    // Reduce cooldown counter
    if (this.state.emotionalPace.cooldownCounter > 0) {
      this.state.emotionalPace.cooldownCounter--;
      if (this.state.emotionalPace.cooldownCounter === 0) {
        this.state.emotionalPace.recoveryPhase = false;
      }
    }
  }

  private getEmotionalImpact(puzzle: any): number {
    // Calculate emotional impact based on puzzle properties
    const baseImpact = puzzle.difficulty * 5;
    const emotionMultiplier = {
      confusion: 0.8,
      fear: 1.0,
      sadness: 0.9,
      anger: 1.2,
      obsession: 1.3,
      corruption: 1.5,
      dominance: 1.1
    };

    return baseImpact * (emotionMultiplier[puzzle.emotionState] || 1.0);
  }

  // ─── STORY REVEAL BALANCE ─────────────────────────────────────
  private updateStoryRevealBalance(puzzleId: number) {
    // Check if this puzzle triggers a story reveal
    const isRevealPuzzle = this.isStoryRevealPuzzle(puzzleId);

    if (isRevealPuzzle) {
      // Advance reveal phase
      if (this.state.storyReveal.mysteryPhase) {
        this.state.storyReveal.mysteryPhase = false;
        this.state.storyReveal.hintPhase = true;
      } else if (this.state.storyReveal.hintPhase) {
        this.state.storyReveal.hintPhase = false;
        this.state.storyReveal.partialRevealPhase = true;
      } else if (this.state.storyReveal.partialRevealPhase) {
        this.state.storyReveal.partialRevealPhase = false;
        this.state.storyReveal.silencePhase = true;
      } else if (this.state.storyReveal.silencePhase) {
        this.state.storyReveal.silencePhase = false;
        this.state.storyReveal.fullRevealPhase = true;
      } else {
        // Reset cycle after full reveal
        this.state.storyReveal.mysteryPhase = true;
        this.state.storyReveal.hintPhase = false;
        this.state.storyReveal.partialRevealPhase = false;
        this.state.storyReveal.silencePhase = false;
        this.state.storyReveal.fullRevealPhase = false;
      }

      // Set cooldown
      this.state.storyReveal.revealCooldown = 5;
    } else {
      // Reduce cooldown
      if (this.state.storyReveal.revealCooldown > 0) {
        this.state.storyReveal.revealCooldown--;
      }
    }
  }

  private isStoryRevealPuzzle(puzzleId: number): boolean {
    // Story reveal puzzles are at key milestones
    const revealPuzzles = [25, 50, 75, 100, 150, 200, 250, 300, 333];
    return revealPuzzles.includes(puzzleId);
  }

  // ─── PUZZLE RHYTHM SYSTEM ─────────────────────────────────────
  private updatePuzzleRhythm(puzzleId: number) {
    const puzzle = this.canonicalSystem.getCanonicalPuzzles().find(p => p.id === puzzleId);
    if (!puzzle) return;

    // Update puzzle distribution
    this.state.puzzleRhythm.puzzleDistribution[puzzle.puzzleType] =
      (this.state.puzzleRhythm.puzzleDistribution[puzzle.puzzleType] || 0) + 1;

    // Check for high-stress puzzles
    const highStressTypes = ["glitch", "system-break"];
    if (highStressTypes.includes(puzzle.puzzleType)) {
      this.state.puzzleRhythm.consecutiveHighStress++;
    } else {
      this.state.puzzleRhythm.consecutiveHighStress = 0;
    }

    // Update rhythm score
    this.calculateRhythmScore();

    // Update last puzzle type
    this.state.puzzleRhythm.lastPuzzleType = puzzle.puzzleType;
  }

  private calculateRhythmScore() {
    // Calculate rhythm score based on distribution
    const totalPuzzles = Object.values(this.state.puzzleRhythm.puzzleDistribution).reduce((a, b) => a + b, 0);
    if (totalPuzzles === 0) return;

    // Ideal distribution: 40% logic, 30% memory, 15% cipher, 10% glitch, 5% narrative
    const idealDistribution = {
      logic: 0.4,
      memory: 0.3,
      cipher: 0.15,
      glitch: 0.1,
      narrative: 0.05,
      "system-break": 0.0
    };

    let score = 1.0;
    for (const [type, count] of Object.entries(this.state.puzzleRhythm.puzzleDistribution)) {
      const actualRatio = count / totalPuzzles;
      const idealRatio = idealDistribution[type] || 0;
      const difference = Math.abs(actualRatio - idealRatio);
      score -= difference * 0.2; // Penalize differences
    }

    // Penalize consecutive high-stress puzzles
    if (this.state.puzzleRhythm.consecutiveHighStress > 2) {
      score -= 0.3;
    }

    this.state.puzzleRhythm.rhythmScore = Math.max(0, Math.min(1, score));
  }

  // ─── MEMORY VIDEO PACING ──────────────────────────────────────
  private updateMemoryVideoPacing(puzzleId: number) {
    const pacing = this.flexibleCanonSystem.getOptimalVideoPacing(puzzleId);

    if (pacing.shouldShowVideo && pacing.videoId) {
      // Check if video cooldown is respected
      const puzzlesSinceLastVideo = puzzleId - this.state.memoryVideoPacing.lastVideoPuzzle;

      // Determine expected cooldown based on phase
      const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);
      const expectedCooldown = progression.phase === 1 ? 25 :
                              progression.phase === 2 ? 35 :
                              progression.phase === 3 ? 45 : 70;

      if (puzzlesSinceLastVideo < expectedCooldown * 0.8) {
        // Pacing violation - too soon
        this.state.memoryVideoPacing.pacingViolation = true;
        console.warn(`⚠️ Memory video pacing violation at puzzle ${puzzleId}`);
      } else {
        // Valid pacing
        this.state.memoryVideoPacing.lastVideoPuzzle = puzzleId;
        this.state.memoryVideoPacing.videoCooldown = expectedCooldown;
        this.state.memoryVideoPacing.pacingViolation = false;
      }
    }

    // Reduce cooldown counter
    if (this.state.memoryVideoPacing.videoCooldown > 0) {
      this.state.memoryVideoPacing.videoCooldown--;
    }
  }

  // ─── ECHO TRANSFORMATION CONTROL ──────────────────────────────
  private updateEchoTransformationControl(puzzleId: number) {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);

    // Check if transformation phase should advance
    const transformationPhases = [100, 200, 300, 333];
    if (transformationPhases.includes(puzzleId)) {
      // Check if transformation is allowed
      if (this.state.emotionalPace.currentLoad < 70 &&
          this.state.emotionalPace.recoveryPhase === false &&
          this.state.echoTransformation.transformationCooldown === 0) {

        this.state.echoTransformation.transformationPhase++;
        this.state.echoTransformation.lastTransformationPuzzle = puzzleId;
        this.state.echoTransformation.transformationCooldown = 10; // 10 puzzle cooldown
        this.state.echoTransformation.transformationReady = true;

        console.log(`🔄 Echo transformation phase ${this.state.echoTransformation.transformationPhase} activated`);
      } else {
        console.warn(`⚠️ Transformation blocked at puzzle ${puzzleId} - emotional load too high or cooldown active`);
      }
    }

    // Reduce transformation cooldown
    if (this.state.echoTransformation.transformationCooldown > 0) {
      this.state.echoTransformation.transformationCooldown--;
    }
  }

  // ─── CORRUPTION STABILITY ──────────────────────────────────────
  private updateCorruptionStability(puzzleId: number) {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);

    // Base corruption increases with progression
    const baseCorruption = progression.progression * 0.8;
    this.state.corruptionStability.currentCorruption = baseCorruption;

    // Check if corruption spike is allowed
    if (this.state.corruptionStability.currentCorruption > 0.6 &&
        this.state.corruptionStability.stabilityPhase) {
      // Allow spike only if emotional load is balanced
      if (this.state.emotionalPace.currentLoad < 60) {
        this.state.corruptionStability.corruptionSpikeAllowed = true;
        this.state.corruptionStability.stabilityPhase = false;
        this.state.corruptionStability.lastSpikePuzzle = puzzleId;
        console.log(`⚡ Corruption spike allowed at puzzle ${puzzleId}`);
      }
    }

    // Return to stability phase after spike
    if (!this.state.corruptionStability.stabilityPhase &&
        puzzleId - this.state.corruptionStability.lastSpikePuzzle > 5) {
      this.state.corruptionStability.stabilityPhase = true;
      this.state.corruptionStability.corruptionSpikeAllowed = false;
    }
  }

  // ─── PLAYER COMFORT LOOP ──────────────────────────────────────
  private updatePlayerComfort() {
    // Calculate comfort level based on all balance factors
    const comfortFactors = [
      this.state.emotionalPace.currentLoad < 70 ? 0.3 : -0.2,
      this.state.puzzleRhythm.rhythmScore > 0.7 ? 0.2 : -0.1,
      !this.state.memoryVideoPacing.pacingViolation ? 0.2 : -0.3,
      this.state.corruptionStability.stabilityPhase ? 0.1 : -0.1,
      this.state.storyReveal.revealCooldown === 0 ? 0.1 : -0.05
    ];

    const totalComfort = comfortFactors.reduce((sum, factor) => sum + factor, 0);
    this.state.playerComfort.comfortLevel = Math.max(0, Math.min(1, totalComfort));

    // Check if recovery is needed
    this.state.playerComfort.recoveryNeeded =
      this.state.playerComfort.comfortLevel < 0.4 ||
      this.state.emotionalPace.currentLoad > 80;

    // Track violations
    if (this.state.playerComfort.comfortLevel < 0.3) {
      this.state.playerComfort.comfortViolations++;
    }
  }

  // ─── PACING VIOLATION CHECKS ──────────────────────────────────
  private checkPacingViolations() {
    const violations: string[] = [];

    // Check emotional overload
    if (this.state.emotionalPace.currentLoad > 80 &&
        this.state.emotionalPace.lastEventType === "high") {
      violations.push("Emotional overload detected");
    }

    // Check consecutive high-stress puzzles
    if (this.state.puzzleRhythm.consecutiveHighStress > 2) {
      violations.push("Too many consecutive high-stress puzzles");
    }

    // Check memory video pacing
    if (this.state.memoryVideoPacing.pacingViolation) {
      violations.push("Memory video pacing violation");
    }

    // Check transformation cooldown
    if (this.state.echoTransformation.transformationCooldown > 0 &&
        this.state.echoTransformation.transformationReady) {
      violations.push("Transformation cooldown violation");
    }

    // Log violations
    if (violations.length > 0) {
      console.warn(`⚠️ Pacing violations detected: ${violations.join(", ")}`);
    }
  }

  // ─── RECOVERY PHASES ─────────────────────────────────────────
  private applyRecoveryPhases() {
    if (this.state.playerComfort.recoveryNeeded) {
      // Force calm puzzle
      this.forceCalmPuzzle();

      // Reduce emotional load
      this.state.emotionalPace.currentLoad = Math.max(30, this.state.emotionalPace.currentLoad - 10);

      // Reset transformation cooldown
      this.state.echoTransformation.transformationCooldown = 0;

      console.log("💆 Recovery phase activated - reducing emotional load");
    }
  }

  private forceCalmPuzzle() {
    // In a real implementation, this would modify the puzzle generation
    // For now, we'll just log the action
    console.log("🎯 Forcing calm puzzle generation");
  }

  // ─── BALANCE RECOMMENDATIONS ──────────────────────────────────
  public getBalanceRecommendations(puzzleId: number): {
    nextPuzzleType: string;
    emotionalLoad: number;
    storyRevealPhase: string;
    videoAllowed: boolean;
    transformationAllowed: boolean;
    corruptionSpikeAllowed: boolean;
    comfortLevel: number;
  } {
    // Determine next puzzle type based on current rhythm
    let nextPuzzleType = "logic"; // Default to calm puzzle

    if (this.state.puzzleRhythm.consecutiveHighStress >= 2) {
      nextPuzzleType = "logic"; // Force calm puzzle
    } else if (this.state.emotionalPace.currentLoad > 60) {
      nextPuzzleType = "memory"; // Medium intensity
    } else {
      // Rotate through puzzle types
      const puzzleTypes = ["logic", "memory", "cipher", "narrative"];
      const currentIndex = puzzleTypes.indexOf(this.state.puzzleRhythm.lastPuzzleType);
      nextPuzzleType = puzzleTypes[(currentIndex + 1) % puzzleTypes.length];
    }

    return {
      nextPuzzleType,
      emotionalLoad: this.state.emotionalPace.currentLoad,
      storyRevealPhase: this.getCurrentStoryRevealPhase(),
      videoAllowed: this.state.memoryVideoPacing.videoCooldown === 0,
      transformationAllowed: this.state.echoTransformation.transformationReady,
      corruptionSpikeAllowed: this.state.corruptionStability.corruptionSpikeAllowed,
      comfortLevel: this.state.playerComfort.comfortLevel
    };
  }

  private getCurrentStoryRevealPhase(): string {
    if (this.state.storyReveal.mysteryPhase) return "mystery";
    if (this.state.storyReveal.hintPhase) return "hint";
    if (this.state.storyReveal.partialRevealPhase) return "partial-reveal";
    if (this.state.storyReveal.silencePhase) return "silence";
    return "full-reveal";
  }

  // ─── EXAMPLE BALANCED SEQUENCE ────────────────────────────────
  public getExampleBalancedSequence(): {
    puzzleId: number;
    puzzleType: string;
    emotionalLoad: number;
    storyPhase: string;
    videoTrigger: boolean;
    transformation: boolean;
    comfortLevel: number;
  }[] {
    return [
      {
        puzzleId: 1,
        puzzleType: "logic",
        emotionalLoad: 20,
        storyPhase: "mystery",
        videoTrigger: false,
        transformation: false,
        comfortLevel: 0.9
      },
      {
        puzzleId: 25,
        puzzleType: "memory",
        emotionalLoad: 35,
        storyPhase: "hint",
        videoTrigger: true,
        transformation: false,
        comfortLevel: 0.8
      },
      {
        puzzleId: 50,
        puzzleType: "cipher",
        emotionalLoad: 45,
        storyPhase: "partial-reveal",
        videoTrigger: false,
        transformation: false,
        comfortLevel: 0.7
      },
      {
        puzzleId: 75,
        puzzleType: "logic",
        emotionalLoad: 30,
        storyPhase: "silence",
        videoTrigger: false,
        transformation: false,
        comfortLevel: 0.85
      },
      {
        puzzleId: 100,
        puzzleType: "narrative",
        emotionalLoad: 50,
        storyPhase: "full-reveal",
        videoTrigger: true,
        transformation: true,
        comfortLevel: 0.75
      },
      {
        puzzleId: 101,
        puzzleType: "logic",
        emotionalLoad: 35,
        storyPhase: "mystery",
        videoTrigger: false,
        transformation: false,
        comfortLevel: 0.8
      },
      {
        puzzleId: 125,
        puzzleType: "memory",
        emotionalLoad: 40,
        storyPhase: "hint",
        videoTrigger: false,
        transformation: false,
        comfortLevel: 0.8
      },
      {
        puzzleId: 150,
        puzzleType: "cipher",
        emotionalLoad: 48,
        storyPhase: "partial-reveal",
        videoTrigger: true,
        transformation: false,
        comfortLevel: 0.78
      },
      {
        puzzleId: 175,
        puzzleType: "logic",
        emotionalLoad: 32,
        storyPhase: "silence",
        videoTrigger: false,
        transformation: false,
        comfortLevel: 0.87
      },
      {
        puzzleId: 200,
        puzzleType: "narrative",
        emotionalLoad: 55,
        storyPhase: "full-reveal",
        videoTrigger: true,
        transformation: true,
        comfortLevel: 0.72
      }
    ];
  }

  // ─── EXPORT NARRATIVE BALANCE SYSTEM ──────────────────────────
  public getBalanceState(): NarrativeBalanceState {
    return { ...this.state };
  }

  public getEmotionalPace(): EmotionalPaceState {
    return { ...this.state.emotionalPace };
  }

  public getPuzzleRhythm(): PuzzleRhythmState {
    return { ...this.state.puzzleRhythm };
  }

  public getMemoryVideoPacing(): MemoryVideoPacing {
    return { ...this.state.memoryVideoPacing };
  }

  public getEchoTransformationControl(): EchoTransformationControl {
    return { ...this.state.echoTransformation };
  }

  public getCorruptionStability(): CorruptionStability {
    return { ...this.state.corruptionStability };
  }

  public getPlayerComfort(): {
    comfortLevel: number;
    comfortViolations: number;
    recoveryNeeded: boolean;
  } {
    return { ...this.state.playerComfort };
  }
}

// ─── EXPORT MAIN BALANCE SYSTEM ────────────────────────────────
export const echoNarrativeBalanceSystem = new EchoNarrativeBalanceEngine();

// Export types for integration
export type {
  EmotionalPaceState,
  StoryRevealBalance,
  PuzzleRhythmState,
  MemoryVideoPacing,
  EchoTransformationControl,
  CorruptionStability,
  NarrativeBalanceState
};

// Export functions
export function getBalanceRecommendations(puzzleId: number): {
  nextPuzzleType: string;
  emotionalLoad: number;
  storyRevealPhase: string;
  videoAllowed: boolean;
  transformationAllowed: boolean;
  corruptionSpikeAllowed: boolean;
  comfortLevel: number;
} {
  return echoNarrativeBalanceSystem.getBalanceRecommendations(puzzleId);
}

export function getExampleBalancedSequence(): {
  puzzleId: number;
  puzzleType: string;
  emotionalLoad: number;
  storyPhase: string;
  videoTrigger: boolean;
  transformation: boolean;
  comfortLevel: number;
}[] {
  return echoNarrativeBalanceSystem.getExampleBalancedSequence();
}

export function getBalanceState(): NarrativeBalanceState {
  return echoNarrativeBalanceSystem.getBalanceState();
}