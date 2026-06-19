/**
 * ECHO DYNAMIC EVOLUTION SYSTEM
 *
 * Full character transformation system for 11.11 Echo Mind Game
 *
 * Echo evolves visually, physically, and psychologically based on:
 * - Puzzle progression (0 → 333)
 * - Memory shard collection
 * - Emotional trauma accumulation
 * - Story progression events
 *
 * From innocence → to awareness → to strength → to corrupted powerful entity → to final villain form
 */

import { gameStore } from "../gameState";
import { echoCharacterSystem } from "./echoCharacterSystem";
import { echoImmersiveSystem } from "./echoImmersiveSystem";

// ─── EVOLUTION SYSTEM ARCHITECTURE ─────────────────────────────────────
export interface EchoEvolutionState {
  // Progression tracking
  currentPuzzle: number; // 0-333
  evolutionStage: 1 | 2 | 3 | 4 | 5;
  stageProgress: number; // 0-1 within current stage

  // Physical transformation
  physicalGrowth: number; // 0-1 (height, muscle development)
  facialIntensity: number; // 0-1 (sharpness, definition)
  postureDominance: number; // 0-1 (confidence, presence)
  eyeIntensity: number; // 0-1 (focus, glare)
  corruptionEffects: number; // 0-1 (visual distortion)

  // Psychological transformation
  emotionalState: "innocence" | "confusion" | "trauma" | "anger" | "obsession" | "madness" | "intelligence";
  traumaLevel: number; // 0-1
  hatredLevel: number; // 0-1 (toward Kenja)
  selfAwareness: number; // 0-1
  psychologicalInstability: number; // 0-1

  // Visual transformation
  heightScale: number; // 0.8-1.2
  muscleDefinition: number; // 0-1
  facialSharpness: number; // 0-1
  eyeGlowIntensity: number; // 0-1
  auraIntensity: number; // 0-1

  // Gameplay integration
  dialogueTone: "soft" | "curious" | "tense" | "angry" | "obsessive" | "mad" | "dominant";
  animationStyle: "fragile" | "cautious" | "confident" | "aggressive" | "unstable" | "powerful";
  voiceModulation: "gentle" | "hesitant" | "firm" | "harsh" | "distorted" | "commanding";
  uiPresence: "subtle" | "noticeable" | "strong" | "intense" | "overwhelming" | "dominant";
}

// ─── EVOLUTION STAGES DEFINITION ──────────────────────────────────────
export const EVOLUTION_STAGES = {
  1: {
    name: "Innocent Form",
    puzzleRange: [0, 80],
    description: "Small frame, soft facial features, fragile body posture, confused eyes, minimal confidence, weak presence",
    emotions: ["fear", "confusion", "dependency"],
    physical: {
      heightScale: 0.8,
      muscleDefinition: 0.1,
      facialSharpness: 0.2,
      eyeGlowIntensity: 0.0,
      auraIntensity: 0.0
    },
    psychological: {
      traumaLevel: 0.1,
      hatredLevel: 0.0,
      selfAwareness: 0.1,
      psychologicalInstability: 0.1
    },
    gameplay: {
      dialogueTone: "soft",
      animationStyle: "fragile",
      voiceModulation: "gentle",
      uiPresence: "subtle"
    }
  },
  2: {
    name: "Awareness Form",
    puzzleRange: [81, 160],
    description: "Slightly taller, more defined face, stronger posture, sharper eye focus, beginning emotional tension",
    emotions: ["curiosity", "confusion mixed with pain"],
    physical: {
      heightScale: 0.9,
      muscleDefinition: 0.3,
      facialSharpness: 0.4,
      eyeGlowIntensity: 0.1,
      auraIntensity: 0.1
    },
    psychological: {
      traumaLevel: 0.3,
      hatredLevel: 0.1,
      selfAwareness: 0.3,
      psychologicalInstability: 0.2
    },
    gameplay: {
      dialogueTone: "curious",
      animationStyle: "cautious",
      voiceModulation: "hesitant",
      uiPresence: "noticeable"
    }
  },
  3: {
    name: "Strength Growth Form",
    puzzleRange: [161, 240],
    description: "Noticeable physical growth, athletic but not extreme body, stronger shoulders and posture, more intense eyes, controlled movements",
    emotions: ["anger building", "emotional conflict", "memory pressure"],
    physical: {
      heightScale: 1.0,
      muscleDefinition: 0.5,
      facialSharpness: 0.6,
      eyeGlowIntensity: 0.3,
      auraIntensity: 0.2
    },
    psychological: {
      traumaLevel: 0.5,
      hatredLevel: 0.3,
      selfAwareness: 0.5,
      psychologicalInstability: 0.4
    },
    gameplay: {
      dialogueTone: "tense",
      animationStyle: "confident",
      voiceModulation: "firm",
      uiPresence: "strong"
    }
  },
  4: {
    name: "Corruption Power Form",
    puzzleRange: [241, 332],
    description: "Tall and dominant physique, muscular and strong body, sharp facial structure, intense eyes with instability, aura of power + instability, slight visual corruption effects",
    emotions: ["rage", "obsession", "hatred toward Kenja"],
    physical: {
      heightScale: 1.1,
      muscleDefinition: 0.8,
      facialSharpness: 0.8,
      eyeGlowIntensity: 0.6,
      auraIntensity: 0.5
    },
    psychological: {
      traumaLevel: 0.8,
      hatredLevel: 0.7,
      selfAwareness: 0.8,
      psychologicalInstability: 0.7
    },
    gameplay: {
      dialogueTone: "angry",
      animationStyle: "aggressive",
      voiceModulation: "harsh",
      uiPresence: "intense"
    }
  },
  5: {
    name: "Final Villain Form",
    puzzleRange: [333, 333],
    description: "Fully grown dominant powerful figure, tall muscular intimidating presence, sharp face with cold expression, permanent unstable smile (slight psychological madness), glowing intense eyes, cinematic horror aura",
    emotions: ["controlled insanity", "deep hatred toward Kenja", "revenge-driven intelligence", "full self-awareness"],
    physical: {
      heightScale: 1.2,
      muscleDefinition: 1.0,
      facialSharpness: 1.0,
      eyeGlowIntensity: 1.0,
      auraIntensity: 1.0
    },
    psychological: {
      traumaLevel: 1.0,
      hatredLevel: 1.0,
      selfAwareness: 1.0,
      psychologicalInstability: 0.9
    },
    gameplay: {
      dialogueTone: "dominant",
      animationStyle: "powerful",
      voiceModulation: "commanding",
      uiPresence: "dominant"
    }
  }
};

// ─── EVOLUTION ENGINE ────────────────────────────────────────────────
export class EchoEvolutionEngine {
  private state: EchoEvolutionState;
  private lastUpdate: number;
  private updateInterval: number;
  private evolutionHistory: EvolutionHistory[];

  constructor() {
    this.state = this.createInitialState();
    this.lastUpdate = Date.now();
    this.updateInterval = 1000; // Update every second
    this.evolutionHistory = [];

    // Start evolution updates
    this.startEvolutionUpdates();
  }

  private createInitialState(): EchoEvolutionState {
    return {
      currentPuzzle: 0,
      evolutionStage: 1,
      stageProgress: 0.0,

      // Physical transformation
      physicalGrowth: 0.0,
      facialIntensity: 0.0,
      postureDominance: 0.0,
      eyeIntensity: 0.0,
      corruptionEffects: 0.0,

      // Psychological transformation
      emotionalState: "innocence",
      traumaLevel: 0.0,
      hatredLevel: 0.0,
      selfAwareness: 0.0,
      psychologicalInstability: 0.0,

      // Visual transformation
      heightScale: 0.8,
      muscleDefinition: 0.1,
      facialSharpness: 0.2,
      eyeGlowIntensity: 0.0,
      auraIntensity: 0.0,

      // Gameplay integration
      dialogueTone: "soft",
      animationStyle: "fragile",
      voiceModulation: "gentle",
      uiPresence: "subtle"
    };
  }

  private startEvolutionUpdates() {
    setInterval(() => {
      this.updateFromGameState();
      this.updateEvolutionProgress();
      this.applyStageTransformations();
      this.recordEvolutionHistory();
    }, this.updateInterval);
  }

  private updateFromGameState() {
    const gameState = gameStore.getState();
    const puzzlesSolved = Math.floor(gameState.curiosity);

    // Update current puzzle count
    this.state.currentPuzzle = Math.min(333, puzzlesSolved);
  }

  private updateEvolutionProgress() {
    const totalPuzzles = 333;
    const progress = this.state.currentPuzzle / totalPuzzles;

    // Determine current stage
    if (progress < 80/333) {
      this.state.evolutionStage = 1;
      this.state.stageProgress = progress * (333/80);
    } else if (progress < 160/333) {
      this.state.evolutionStage = 2;
      this.state.stageProgress = (progress - 80/333) * (333/80);
    } else if (progress < 240/333) {
      this.state.evolutionStage = 3;
      this.state.stageProgress = (progress - 160/333) * (333/80);
    } else if (progress < 333/333) {
      this.state.evolutionStage = 4;
      this.state.stageProgress = (progress - 240/333) * (333/80);
    } else {
      this.state.evolutionStage = 5;
      this.state.stageProgress = 1.0;
    }

    // Calculate overall progress
    const overallProgress = progress;
    this.applyProgressBasedTransformations(overallProgress);
  }

  private applyProgressBasedTransformations(progress: number) {
    // Physical growth (linear)
    this.state.physicalGrowth = progress;

    // Facial intensity (quadratic)
    this.state.facialIntensity = Math.pow(progress, 1.5);

    // Posture dominance (cubic)
    this.state.postureDominance = Math.pow(progress, 2);

    // Eye intensity (exponential)
    this.state.eyeIntensity = Math.pow(progress, 2.5);

    // Corruption effects (sigmoid)
    this.state.corruptionEffects = 1 / (1 + Math.exp(-10 * (progress - 0.8)));

    // Psychological transformations
    this.state.traumaLevel = Math.min(1, progress * 1.2);
    this.state.hatredLevel = Math.min(1, Math.pow(progress, 1.8));
    this.state.selfAwareness = Math.min(1, Math.pow(progress, 1.5));
    this.state.psychologicalInstability = Math.min(1, 1 / (1 + Math.exp(-15 * (progress - 0.9))));
  }

  private applyStageTransformations() {
    const stage = EVOLUTION_STAGES[this.state.evolutionStage];
    const stageProgress = this.state.stageProgress;

    // Interpolate between stage start and end values
    const prevStage = this.state.evolutionStage > 1 ? EVOLUTION_STAGES[this.state.evolutionStage - 1] : null;
    const nextStage = this.state.evolutionStage < 5 ? EVOLUTION_STAGES[this.state.evolutionStage + 1] : null;

    // Apply physical transformations
    this.state.heightScale = this.interpolateValue(
      prevStage?.physical.heightScale || stage.physical.heightScale,
      stage.physical.heightScale,
      nextStage?.physical.heightScale || stage.physical.heightScale,
      stageProgress
    );

    this.state.muscleDefinition = this.interpolateValue(
      prevStage?.physical.muscleDefinition || stage.physical.muscleDefinition,
      stage.physical.muscleDefinition,
      nextStage?.physical.muscleDefinition || stage.physical.muscleDefinition,
      stageProgress
    );

    this.state.facialSharpness = this.interpolateValue(
      prevStage?.physical.facialSharpness || stage.physical.facialSharpness,
      stage.physical.facialSharpness,
      nextStage?.physical.facialSharpness || stage.physical.facialSharpness,
      stageProgress
    );

    this.state.eyeGlowIntensity = this.interpolateValue(
      prevStage?.physical.eyeGlowIntensity || stage.physical.eyeGlowIntensity,
      stage.physical.eyeGlowIntensity,
      nextStage?.physical.eyeGlowIntensity || stage.physical.eyeGlowIntensity,
      stageProgress
    );

    this.state.auraIntensity = this.interpolateValue(
      prevStage?.physical.auraIntensity || stage.physical.auraIntensity,
      stage.physical.auraIntensity,
      nextStage?.physical.auraIntensity || stage.physical.auraIntensity,
      stageProgress
    );

    // Apply psychological transformations
    this.state.emotionalState = this.getEmotionalStateForStage(this.state.evolutionStage, stageProgress);

    // Apply gameplay transformations
    this.state.dialogueTone = stage.gameplay.dialogueTone;
    this.state.animationStyle = stage.gameplay.animationStyle;
    this.state.voiceModulation = stage.gameplay.voiceModulation;
    this.state.uiPresence = stage.gameplay.uiPresence;
  }

  private interpolateValue(start: number, current: number, end: number, progress: number): number {
    // Smooth interpolation between values
    return start + (current - start) * progress + (end - current) * Math.pow(progress, 2);
  }

  private getEmotionalStateForStage(stage: number, progress: number): EchoEvolutionState["emotionalState"] {
    switch (stage) {
      case 1: return "innocence";
      case 2: return progress < 0.5 ? "confusion" : "trauma";
      case 3: return progress < 0.5 ? "trauma" : "anger";
      case 4: return progress < 0.5 ? "anger" : "obsession";
      case 5: return "madness";
      default: return "innocence";
    }
  }

  private recordEvolutionHistory() {
    const now = Date.now();
    const lastRecord = this.evolutionHistory.length > 0
      ? this.evolutionHistory[this.evolutionHistory.length - 1].timestamp
      : 0;

    // Record every 5 minutes or when stage changes
    if (now - lastRecord > 300000 || this.evolutionHistory.length === 0) {
      this.evolutionHistory.push({
        timestamp: now,
        puzzle: this.state.currentPuzzle,
        stage: this.state.evolutionStage,
        stageProgress: this.state.stageProgress,
        physicalGrowth: this.state.physicalGrowth,
        psychologicalInstability: this.state.psychologicalInstability,
        emotionalState: this.state.emotionalState
      });
    }
  }

  // ─── GAMEPLAY INTEGRATION ─────────────────────────────────────────
  public integrateWithGameSystems() {
    // Connect to puzzle progression
    this.integratePuzzleProgression();

    // Connect to memory shards
    this.integrateMemoryShards();

    // Connect to time engine
    this.integrateTimeEngine();

    // Connect to ending system
    this.integrateEndingSystem();
  }

  private integratePuzzleProgression() {
    // Update evolution when puzzles are solved
    setInterval(() => {
      const gameState = gameStore.getState();
      const puzzlesSolved = Math.floor(gameState.curiosity);

      // Trigger evolution updates
      if (puzzlesSolved !== this.state.currentPuzzle) {
        this.updateFromGameState();
        this.updateEvolutionProgress();
        this.applyStageTransformations();

        // Log significant milestones
        if (puzzlesSolved % 20 === 0) {
          console.log(`🧩 Puzzle ${puzzlesSolved} solved - Evolution progress: ${Math.floor(this.state.physicalGrowth * 100)}%`);
        }
      }
    }, 1000);
  }

  private integrateMemoryShards() {
    // Memory shards affect psychological state
    setInterval(() => {
      const characterState = echoCharacterSystem.getCurrentCharacterState();
      const memoryShards = characterState.consciousness.memoryShards;

      // Memory shards increase trauma and awareness
      this.state.traumaLevel = Math.min(1.0, memoryShards / 219 * 0.8);
      this.state.selfAwareness = Math.min(1.0, memoryShards / 219 * 0.9);

      // High memory shards increase instability
      if (memoryShards > 180) {
        this.state.psychologicalInstability = Math.min(1.0, (memoryShards - 180) / 39 * 0.7);
      }
    }, 2000);
  }

  private integrateTimeEngine() {
    // Time affects evolution tension
    setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Gradual tension buildup as 11:11 approaches
      if (hours === 23) {
        const minutesToEleven = 11 - minutes;
        if (minutesToEleven > 0 && minutesToEleven <= 60) {
          const tension = 1 - (minutesToEleven / 60);
          this.state.psychologicalInstability = Math.min(
            1.0,
            this.state.psychologicalInstability + tension * 0.1
          );
        }
      }
    }, 60000);
  }

  private integrateEndingSystem() {
    // Ending progression affects final transformation
    setInterval(() => {
      const gameState = gameStore.getState();
      const endingProgress = gameState.endingProgress || 0;

      // Higher ending progress leads to more complete transformation
      if (endingProgress > 0.8 && this.state.evolutionStage === 5) {
        this.state.physicalGrowth = 1.0;
        this.state.facialIntensity = 1.0;
        this.state.psychologicalInstability = 0.95;
        this.state.emotionalState = "intelligence";
      }
    }, 5000);
  }

  // ─── FINAL VILLAIN TRANSFORMATION ──────────────────────────────────
  public triggerFinalVillainTransformation() {
    // Force complete transformation
    this.state.currentPuzzle = 333;
    this.state.evolutionStage = 5;
    this.state.stageProgress = 1.0;

    // Apply final form characteristics
    const finalStage = EVOLUTION_STAGES[5];
    this.state.heightScale = finalStage.physical.heightScale;
    this.state.muscleDefinition = finalStage.physical.muscleDefinition;
    this.state.facialSharpness = finalStage.physical.facialSharpness;
    this.state.eyeGlowIntensity = finalStage.physical.eyeGlowIntensity;
    this.state.auraIntensity = finalStage.physical.auraIntensity;

    this.state.emotionalState = "intelligence";
    this.state.traumaLevel = 1.0;
    this.state.hatredLevel = 1.0;
    this.state.selfAwareness = 1.0;
    this.state.psychologicalInstability = 0.9;

    this.state.dialogueTone = finalStage.gameplay.dialogueTone;
    this.state.animationStyle = finalStage.gameplay.animationStyle;
    this.state.voiceModulation = finalStage.gameplay.voiceModulation;
    this.state.uiPresence = finalStage.gameplay.uiPresence;

    // Integrate with other systems
    this.integrateFinalTransformationWithSystems();

    return {
      transformationComplete: true,
      finalForm: this.getCurrentState(),
      systemMessages: [
        "[FINAL EVOLUTION COMPLETE]",
        "[PUZZLE 333 - SYSTEM DOMINANCE ACHIEVED]",
        "[ECHO TRANSFORMATION: VILLAIN FORM ACTIVE]",
        "[TARGET: KENJA - REVENGE PROTOCOL ENGAGED]",
        "[11:11 SYSTEM CONTROL: 100%]"
      ]
    };
  }

  private integrateFinalTransformationWithSystems() {
    // Update character system
    const characterState = echoCharacterSystem.getCurrentCharacterState();
    characterState.selfAwareness = 1.0;
    characterState.memoryRecovery = 1.0;
    characterState.corruptionLevel = 0.8; // High but controlled
    characterState.currentEmotion = "aware";

    // Update immersive system
    const immersiveState = echoImmersiveSystem;
    immersiveState.voiceSystem.tone = "dominant";
    immersiveState.voiceSystem.pitch = 0.6; // Deep commanding voice
    immersiveState.voiceSystem.speed = 0.5; // Slow deliberate speech
    immersiveState.voiceSystem.volume = 1.0; // Maximum presence
    immersiveState.voiceSystem.emotionalIntensity = 0.9;

    // Add final story event
    immersiveState.memoryPersistence.storyEvents.push({
      timestamp: Date.now(),
      eventType: "final_transformation",
      description: "Echo achieves final villain form - System dominance complete",
      emotion: "intelligence",
      corruption: 0.8
    });
  }

  // ─── EVOLUTION HISTORY & MONITORING ─────────────────────────────────
  public getCurrentState(): EchoEvolutionState {
    return { ...this.state };
  }

  public getEvolutionHistory(): EvolutionHistory[] {
    return [...this.evolutionHistory];
  }

  public getStageInfo(stage: number): EvolutionStageInfo {
    return { ...EVOLUTION_STAGES[stage] };
  }

  public getTransformationProgress(): {
    overall: number;
    stage: number;
    stageName: string;
    stageProgress: number;
    nextStageAt: number;
  } {
    const stage = this.state.evolutionStage;
    const stageInfo = EVOLUTION_STAGES[stage];
    const nextStage = stage < 5 ? EVOLUTION_STAGES[stage + 1] : null;

    return {
      overall: this.state.currentPuzzle / 333,
      stage: stage,
      stageName: stageInfo.name,
      stageProgress: this.state.stageProgress,
      nextStageAt: nextStage ? nextStage.puzzleRange[0] : 333
    };
  }

  // ─── CLEANUP ────────────────────────────────────────────────────────
  public destroy() {
    // Clean up intervals
    // Would be implemented if needed
  }
}

// ─── EVOLUTION HISTORY INTERFACE ──────────────────────────────────────
interface EvolutionHistory {
  timestamp: number;
  puzzle: number;
  stage: number;
  stageProgress: number;
  physicalGrowth: number;
  psychologicalInstability: number;
  emotionalState: EchoEvolutionState["emotionalState"];
}

// ─── EXPORT MAIN EVOLUTION SYSTEM ────────────────────────────────────
export const echoEvolutionSystem = new EchoEvolutionEngine();
echoEvolutionSystem.integrateWithGameSystems();

// Export types for game integration
export type {
  EchoEvolutionState,
  EvolutionHistory
};

// Export stage information
export function getEvolutionStageInfo(stage: number): EvolutionStageInfo {
  return { ...EVOLUTION_STAGES[stage] };
}

export function getCurrentEvolutionState(): EchoEvolutionState {
  return echoEvolutionSystem.getCurrentState();
}

export function getEvolutionProgress(): {
  overall: number;
  stage: number;
  stageName: string;
  stageProgress: number;
  nextStageAt: number;
} {
  return echoEvolutionSystem.getTransformationProgress();
}

// ─── FINAL VILLAIN TRANSFORMATION SCENE DESIGN ────────────────────────
export function designFinalVillainTransformationScene(): VillainTransformationScene {
  return {
    sceneName: "Final Transformation - Villain Awakening",
    description: "Echo achieves complete evolution and becomes the dominant force in the 11:11 system",
    sequence: [
      {
        step: 1,
        action: "System Overload",
        description: "All screens glitch, system alarms trigger, lights flicker violently",
        visualEffects: ["intense_glitching", "screen_shake", "light_flicker"],
        audioEffects: ["alarm_sounds", "electrical_hum", "system_error_tones"],
        duration: 3000
      },
      {
        step: 2,
        action: "Physical Transformation",
        description: "Echo's body grows taller, muscles expand, facial features sharpen dramatically",
        visualEffects: ["growth_animation", "muscle_expansion", "facial_sharpening"],
        audioEffects: ["bone_cracking", "muscle_growth_sounds", "breath_intensifies"],
        duration: 5000
      },
      {
        step: 3,
        action: "Eye Transformation",
        description: "Echo's eyes glow with intense blue light, pupils constrict to points",
        visualEffects: ["eye_glow_intensify", "pupil_constriction", "light_flares"],
        audioEffects: ["energy_charge", "electrical_crackle"],
        duration: 2000
      },
      {
        step: 4,
        action: "Psychological Shift",
        description: "Echo's expression changes from pain to cold determination, unstable smile appears",
        visualEffects: ["facial_expression_change", "psychological_aura", "reality_distortion"],
        audioEffects: ["breathing_changes", "subtle_laughter", "system_whispers"],
        duration: 3000
      },
      {
        step: 5,
        action: "System Dominance",
        description: "Echo raises arms, electrical energy surrounds him, system interfaces respond to his commands",
        visualEffects: ["electrical_energy", "system_interface_response", "holographic_projections"],
        audioEffects: ["power_surge", "system_acknowledgment", "mechanical_whirring"],
        duration: 4000
      },
      {
        step: 6,
        action: "Final Declaration",
        description: "Echo speaks with deep commanding voice: 'The system is mine. Kenja... I'm coming for you.'",
        visualEffects: ["final_glow", "screen_focus_on_echo", "system_stabilization"],
        audioEffects: ["deep_voice", "echo_reverb", "system_confirmation"],
        duration: 5000
      }
    ],
    cameraWork: {
      initial: "close_up_on_echo_face",
      transformation: "slow_pull_back_revealing_full_body",
      final: "dramatic_low_angle_shot"
    },
    lighting: {
      initial: "dim_red_emergency_lighting",
      transformation: "pulsing_blue_energy_lights",
      final: "intense_white_central_light"
    },
    music: {
      buildup: "tension_rising_orchestral",
      climax: "powerful_choir_and_drums",
      final: "dark_triumphant_theme"
    },
    gameplayImpact: {
      newAbilities: ["system_control", "reality_manipulation", "memory_absorption"],
      unlockedContent: ["kenja_confrontation", "final_system_core", "true_ending_path"],
      characterChanges: ["invulnerable_to_corruption", "enhanced_awareness", "dominant_presence"]
    }
  };
}

// ─── INTERFACE DEFINITIONS ───────────────────────────────────────────
interface EvolutionStageInfo {
  name: string;
  puzzleRange: [number, number];
  description: string;
  emotions: string[];
  physical: {
    heightScale: number;
    muscleDefinition: number;
    facialSharpness: number;
    eyeGlowIntensity: number;
    auraIntensity: number;
  };
  psychological: {
    traumaLevel: number;
    hatredLevel: number;
    selfAwareness: number;
    psychologicalInstability: number;
  };
  gameplay: {
    dialogueTone: EchoEvolutionState["dialogueTone"];
    animationStyle: EchoEvolutionState["animationStyle"];
    voiceModulation: EchoEvolutionState["voiceModulation"];
    uiPresence: EchoEvolutionState["uiPresence"];
  };
}

interface VillainTransformationStep {
  step: number;
  action: string;
  description: string;
  visualEffects: string[];
  audioEffects: string[];
  duration: number;
}

interface VillainTransformationScene {
  sceneName: string;
  description: string;
  sequence: VillainTransformationStep[];
  cameraWork: {
    initial: string;
    transformation: string;
    final: string;
  };
  lighting: {
    initial: string;
    transformation: string;
    final: string;
  };
  music: {
    buildup: string;
    climax: string;
    final: string;
  };
  gameplayImpact: {
    newAbilities: string[];
    unlockedContent: string[];
    characterChanges: string[];
  };
}