/**
 * ECHO EMOTIONAL FLOWER SYSTEM
 *
 * The living emotional entity that represents Echo's psychological state, corruption level, and narrative evolution.
 * This is NOT decoration - it is the SOUL STATE of Echo, deeply integrated with emotion, narrative progression, and player interaction.
 *
 * CORE CONCEPT:
 * The Flower is a living emotional entity that reflects EVERYTHING happening in Echo's mind.
 */

import { echoSimplifiedEngine } from "./echoSimplifiedEngine";
import { echoEmotionEngine } from "./echoSimplifiedEngine";

// ─── FLOWER STATE INTERFACES ─────────────────────────────────────
export interface FlowerState {
  growthLevel: number; // 0-100%
  corruptionLevel: number; // 0-100%
  emotionalIntensity: number; // 0-100%
  stability: number; // 0-100%
  stage: "seed" | "sprout" | "bloom" | "wilted" | "corrupted" | "void";
  colorPalette: string;
  animationState: "idle" | "breathing" | "distorted" | "breaking" | "glitching";
  petalCount: number; // 0-12 (fully bloomed)
  glitchIntensity: number; // 0-1
  pulseFrequency: number; // 0-1 (animation speed)
}

// ─── FLOWER EVOLUTION STAGES ────────────────────────────────────
export interface FlowerStage {
  name: string;
  threshold: number; // 0-100%
  color: string;
  description: string;
  animation: string;
  petalCount: number;
  glitchEffect: string;
}

// ─── EMOTIONAL FLOWER SYSTEM ENGINE ─────────────────────────────
export class EchoFlowerSystem {
  private state: FlowerState;
  private stages: FlowerStage[];
  private engine: typeof echoSimplifiedEngine;
  private emotionEngine: typeof echoEmotionEngine;
  private initialized: boolean;

  constructor() {
    this.engine = echoSimplifiedEngine;
    this.emotionEngine = echoEmotionEngine;
    this.initialized = false;

    // Initialize flower stages
    this.stages = this.createFlowerStages();

    // Initialize state
    this.state = this.createInitialState();

    // Start monitoring
    this.startFlowerMonitoring();

    this.initialized = true;
    console.log("🌸 Emotional Flower System Initialized");
    console.log("💖 Echo's soul is now visible");
  }

  private createFlowerStages(): FlowerStage[] {
    return [
      {
        name: "seed",
        threshold: 0,
        color: "#f0f8ff", // Alice blue
        description: "Innocence and confusion",
        animation: "gentle-pulse",
        petalCount: 0,
        glitchEffect: "none"
      },
      {
        name: "sprout",
        threshold: 15,
        color: "#e6e6fa", // Lavender
        description: "Curiosity begins to grow",
        animation: "slow-breathing",
        petalCount: 3,
        glitchEffect: "subtle"
      },
      {
        name: "bloom",
        threshold: 35,
        color: "#dda0dd", // Plum
        description: "Emotional awareness emerges",
        animation: "pulsing",
        petalCount: 7,
        glitchEffect: "mild"
      },
      {
        name: "wilted",
        threshold: 60,
        color: "#9370db", // Medium purple
        description: "Emotional damage visible",
        animation: "irregular",
        petalCount: 9,
        glitchEffect: "moderate"
      },
      {
        name: "corrupted",
        threshold: 80,
        color: "#4b0082", // Indigo
        description: "Psychological instability",
        animation: "distorted",
        petalCount: 5,
        glitchEffect: "severe"
      },
      {
        name: "void",
        threshold: 95,
        color: "#000000", // Black
        description: "Complete transformation",
        animation: "glitching",
        petalCount: 0,
        glitchEffect: "extreme"
      }
    ];
  }

  private createInitialState(): FlowerState {
    return {
      growthLevel: 10,
      corruptionLevel: 5,
      emotionalIntensity: 15,
      stability: 90,
      stage: "seed",
      colorPalette: this.stages[0].color,
      animationState: "idle",
      petalCount: 0,
      glitchIntensity: 0.0,
      pulseFrequency: 0.3
    };
  }

  private startFlowerMonitoring() {
    // Update flower state every time a puzzle is processed
    setInterval(() => {
      this.updateFlowerState();
    }, 1000);
  }

  // ─── FLOWER STATE UPDATE ─────────────────────────────────────
  public updateFlowerState(): FlowerState {
    const currentState = this.engine.getCurrentState();
    const emotionState = this.emotionEngine.getCurrentState();

    // Update growth based on puzzle progression
    const progression = this.calculateProgression(currentState.puzzleId);
    this.state.growthLevel = progression;

    // Update corruption based on emotion engine
    this.state.corruptionLevel = emotionState.corruptionLevel * 100;

    // Update emotional intensity
    this.state.emotionalIntensity = emotionState.intensity * 100;

    // Update stability
    this.state.stability = emotionState.stability * 100;

    // Determine current stage
    this.updateFlowerStage();

    // Update visual properties
    this.updateVisualProperties();

    return { ...this.state };
  }

  private calculateProgression(puzzleId: number): number {
    // Progression from 0-100% based on puzzle completion
    const totalPuzzles = 333; // Base game
    return Math.min(100, (puzzleId / totalPuzzles) * 100);
  }

  private updateFlowerStage() {
    // Find current stage based on growth level
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (this.state.growthLevel >= this.stages[i].threshold) {
        this.state.stage = this.stages[i].name;
        return;
      }
    }
    this.state.stage = "seed";
  }

  private updateVisualProperties() {
    const currentStage = this.stages.find(s => s.name === this.state.stage) || this.stages[0];

    // Update color palette
    this.state.colorPalette = currentStage.color;

    // Update animation state
    this.state.animationState = currentStage.animation;

    // Update petal count
    this.state.petalCount = currentStage.petalCount;

    // Update glitch intensity based on corruption
    this.state.glitchIntensity = this.state.corruptionLevel / 100;

    // Update pulse frequency based on emotional intensity
    this.state.pulseFrequency = 0.3 + (this.state.emotionalIntensity / 200);
  }

  // ─── FLOWER EMOTIONAL RESPONSE ──────────────────────────────
  public respondToEmotion(emotion: string, intensity: number): void {
    // Adjust flower properties based on specific emotions
    switch (emotion) {
      case "confusion":
        this.state.emotionalIntensity = Math.min(100, intensity * 50);
        this.state.animationState = "gentle-pulse";
        break;

      case "fear":
        this.state.emotionalIntensity = Math.min(100, intensity * 60);
        this.state.animationState = "fast-pulse";
        this.state.glitchIntensity = Math.min(1.0, 0.3 + intensity * 0.2);
        break;

      case "sadness":
        this.state.emotionalIntensity = Math.min(100, intensity * 40);
        this.state.animationState = "slow-breathing";
        this.state.colorPalette = "#9370db"; // Purple
        break;

      case "anger":
        this.state.emotionalIntensity = Math.min(100, intensity * 80);
        this.state.animationState = "irregular";
        this.state.glitchIntensity = Math.min(1.0, 0.5 + intensity * 0.3);
        this.state.colorPalette = "#8b0000"; // Dark red
        break;

      case "obsession":
        this.state.emotionalIntensity = Math.min(100, intensity * 70);
        this.state.animationState = "distorted";
        this.state.glitchIntensity = Math.min(1.0, 0.6 + intensity * 0.3);
        break;

      case "corruption":
        this.state.emotionalIntensity = Math.min(100, intensity * 90);
        this.state.animationState = "glitching";
        this.state.glitchIntensity = Math.min(1.0, 0.8 + intensity * 0.2);
        this.state.colorPalette = "#4b0082"; // Indigo
        break;

      case "dominance":
        this.state.emotionalIntensity = 100;
        this.state.animationState = "glitching";
        this.state.glitchIntensity = 1.0;
        this.state.colorPalette = "#000000"; // Black
        break;
    }
  }

  // ─── FLOWER MEMORY SHARD RESPONSE ──────────────────────────
  public respondToMemoryShard(shard: any): void {
    // Flower reacts to memory shard emotional impact
    const impact = shard.emotionalImpact;
    const absoluteImpact = Math.abs(impact);

    // Positive impact (happy memories)
    if (impact > 0) {
      this.state.emotionalIntensity = Math.min(100, this.state.emotionalIntensity + absoluteImpact * 5);
      this.state.animationState = "joyful-pulse";
      this.state.colorPalette = "#ff69b4"; // Hot pink
    }
    // Negative impact (painful memories)
    else if (impact < 0) {
      this.state.emotionalIntensity = Math.min(100, this.state.emotionalIntensity + absoluteImpact * 8);
      this.state.animationState = "painful-pulse";
      this.state.colorPalette = "#483d8b"; // Dark slate blue
      this.state.glitchIntensity = Math.min(1.0, this.state.glitchIntensity + 0.2);
    }
  }

  // ─── FLOWER TRANSFORMATION RESPONSE ────────────────────────
  public respondToTransformation(): void {
    // Final transformation at puzzle 333
    this.state.stage = "void";
    this.state.colorPalette = "#000000";
    this.state.animationState = "glitching";
    this.state.glitchIntensity = 1.0;
    this.state.petalCount = 0;
    this.state.emotionalIntensity = 100;
    this.state.stability = 0;

    console.log("🌑 Flower has transformed into void entity");
    console.log("💀 Echo's soul is now one with the system");
  }

  // ─── FLOWER SYSTEM INTEGRATION ─────────────────────────────
  public getFlowerState(): FlowerState {
    return { ...this.state };
  }

  public getFlowerStage(): string {
    return this.state.stage;
  }

  public getVisualProperties(): {
    color: string;
    animation: string;
    petals: number;
    glitch: number;
    pulse: number;
  } {
    return {
      color: this.state.colorPalette,
      animation: this.state.animationState,
      petals: this.state.petalCount,
      glitch: this.state.glitchIntensity,
      pulse: this.state.pulseFrequency
    };
  }

  // ─── EXPORT FLOWER SYSTEM ─────────────────────────────────
  public getCurrentStageInfo(): {
    name: string;
    description: string;
    progress: number;
    nextStage: string | null;
  } {
    const currentIndex = this.stages.findIndex(s => s.name === this.state.stage);
    const nextStage = currentIndex < this.stages.length - 1 ? this.stages[currentIndex + 1].name : null;

    return {
      name: this.state.stage,
      description: this.stages[currentIndex].description,
      progress: this.state.growthLevel,
      nextStage
    };
  }
}

// ─── EXPORT MAIN FLOWER SYSTEM ──────────────────────────────
export const echoFlowerSystem = new EchoFlowerSystem();

// Export types for integration
export type {
  FlowerState,
  FlowerStage
};

// Export functions
export function getFlowerState(): FlowerState {
  return echoFlowerSystem.getFlowerState();
}

export function getFlowerStage(): string {
  return echoFlowerSystem.getFlowerStage();
}

export function getVisualProperties(): {
  color: string;
  animation: string;
  petals: number;
  glitch: number;
  pulse: number;
} {
  return echoFlowerSystem.getVisualProperties();
}

export function getCurrentStageInfo(): {
  name: string;
  description: string;
  progress: number;
  nextStage: string | null;
} {
  return echoFlowerSystem.getCurrentStageInfo();
}