/**
 * ECHO FLEXIBLE CANON SYSTEM - LIVING NARRATIVE ENGINE
 *
 * Transforms rigid canonical structure into a LIVING FLEXIBLE NARRATIVE SYSTEM:
 * - Story is consistent but NOT perfectly deterministic
 * - Memories can be distorted or partially corrupted
 * - Echo perception is unreliable
 * - Narrative can shift slightly based on system state
 *
 * CORE RULE (VERY IMPORTANT):
 * The canon is NOT absolute truth. It is "A stable interpretation of unstable memories."
 */

import { echoCanonicalSystem } from "./echoCanonicalSystem";
import { echoSystemTransformation } from "./echoSystemTransformation";
import { echoMultilingualSystem } from "./echoMultilingualSystem";

// ─── FLEXIBLE CANON ARCHITECTURE ─────────────────────────────────
export interface FlexibleMemoryShard {
  id: number;
  stableCore: string; // Unchangeable core truth
  flexibleDetails: FlexibleDetail[];
  emotionalTone: "stable" | "uncertain" | "distorted" | "corrupted";
  corruptionLevel: number; // 0-1
  variationProbability: number; // 0-1 (chance of showing variation)
  currentVariationIndex: number;
}

export interface FlexibleDetail {
  id: string;
  arabic: string;
  english: string;
  emotionalImpact: number; // -5 to +5
  corruptionEffect: number; // 0-1
  probabilityWeight: number; // 0-1
}

export interface MemoryDistortion {
  id: number;
  distortionType: "glitch" | "emotional" | "temporal" | "system";
  intensity: number; // 0-1
  triggerCondition: string;
  effect: string;
}

export interface FlexibleCanonState {
  flexibilityEnabled: boolean;
  distortionLevel: number; // 0-1
  uncertaintyLevel: number; // 0-1
  memoryStability: number; // 0-1 (1 = stable, 0 = unstable)
  echoReliability: number; // 0-1 (1 = reliable, 0 = unreliable)
  activeDistortions: MemoryDistortion[];
}

// ─── FLEXIBLE CANON ENGINE ─────────────────────────────────────
export class EchoFlexibleCanonEngine {
  private canonicalSystem: typeof echoCanonicalSystem;
  private transformationSystem: typeof echoSystemTransformation;
  private multilingualSystem: typeof echoMultilingualSystem;
  private flexibleShards: FlexibleMemoryShard[];
  private state: FlexibleCanonState;
  private initialized: boolean;

  constructor() {
    this.canonicalSystem = echoCanonicalSystem;
    this.transformationSystem = echoSystemTransformation;
    this.multilingualSystem = echoMultilingualSystem;
    this.flexibleShards = [];
    this.initialized = false;

    // Initialize flexible canon system
    this.state = this.createInitialState();
    this.initializeFlexibleCanon();
  }

  private createInitialState(): FlexibleCanonState {
    return {
      flexibilityEnabled: true,
      distortionLevel: 0.2,
      uncertaintyLevel: 0.3,
      memoryStability: 0.8,
      echoReliability: 0.7,
      activeDistortions: []
    };
  }

  private initializeFlexibleCanon() {
    // Convert canonical shards to flexible shards
    this.convertCanonicalToFlexible();

    // Start monitoring system state
    this.startFlexibilityMonitoring();

    this.initialized = true;
    console.log("🔄 Flexible Canon System Initialized");
    console.log("🧠 Narrative is now alive and unstable");
  }

  private convertCanonicalToFlexible() {
    const canonicalShards = this.canonicalSystem.getCanonicalShards();

    canonicalShards.forEach(shard => {
      const flexibleShard: FlexibleMemoryShard = {
        id: shard.id,
        stableCore: this.extractStableCore(shard.fragment),
        flexibleDetails: this.generateFlexibleDetails(shard),
        emotionalTone: "stable",
        corruptionLevel: shard.corruptionLevel,
        variationProbability: 0.2,
        currentVariationIndex: 0
      };

      this.flexibleShards.push(flexibleShard);
    });
  }

  private extractStableCore(fragment: string): string {
    // Extract the unchangeable core truth from memory fragments
    const corePatterns = {
      kenja: /Kenja.*experiment/i,
      lina: /Lina.*memory|protect/i,
      echo: /Echo.*internal|realization/i,
      watcher: /Watcher.*transmission|warning/i
    };

    for (const [source, pattern] of Object.entries(corePatterns)) {
      if (pattern.test(fragment)) {
        return `CORE: ${source.toUpperCase()} - ${fragment.match(pattern)?.[0] || fragment}`;
      }
    }

    return `CORE: UNKNOWN - ${fragment.split('.')[0] || fragment}`;
  }

  private generateFlexibleDetails(shard: any): FlexibleDetail[] {
    const details: FlexibleDetail[] = [];
    const currentLang = this.multilingualSystem.getCurrentLanguage();

    // Generate 2-4 variations for each memory shard
    for (let i = 0; i < 3; i++) {
      const variation: FlexibleDetail = {
        id: `var_${shard.id}_${i}`,
        arabic: this.generateArabicVariation(shard, i),
        english: this.generateEnglishVariation(shard, i),
        emotionalImpact: this.getEmotionalImpactVariation(shard, i),
        corruptionEffect: this.getCorruptionEffectVariation(shard, i),
        probabilityWeight: this.getProbabilityWeight(shard, i)
      };

      details.push(variation);
    }

    return details;
  }

  private generateArabicVariation(shard: any, variationIndex: number): string {
    const variations = [
      `أعتقد أن ${shard.fragment}... أو ربما كنت مخطئًا`,
      `ذاكرتي عن ${shard.fragment}... لكنها تتغير دائمًا`,
      `النظام يقول ${shard.fragment}... لكنني لا أثق به`,
      `أذكر ${shard.fragment}... لكن التفاصيل غير واضحة`,
      `كان هناك ${shard.fragment}... لكنني لا أتذكر بالضبط`
    ];

    return variations[variationIndex % variations.length];
  }

  private generateEnglishVariation(shard: any, variationIndex: number): string {
    const variations = [
      `I think ${shard.fragment}... or maybe I was wrong`,
      `My memory of ${shard.fragment}... but it keeps changing`,
      `The system says ${shard.fragment}... but I don't trust it`,
      `I remember ${shard.fragment}... but the details are unclear`,
      `There was ${shard.fragment}... but I don't remember exactly`
    ];

    return variations[variationIndex % variations.length];
  }

  private getEmotionalImpactVariation(shard: any, variationIndex: number): number {
    // Vary emotional impact based on variation
    const baseImpact = shard.emotionalImpact;
    const variations = [-1, 0, 1, 2, -2];
    return Math.max(-5, Math.min(5, baseImpact + variations[variationIndex % variations.length]));
  }

  private getCorruptionEffectVariation(shard: any, variationIndex: number): number {
    // Vary corruption effect based on variation
    const baseCorruption = shard.corruptionLevel;
    const variations = [0.1, 0.2, -0.1, 0.3, -0.2];
    return Math.max(0, Math.min(1, baseCorruption + variations[variationIndex % variations.length]));
  }

  private getProbabilityWeight(shard: any, variationIndex: number): number {
    // Higher probability for earlier variations
    const weights = [0.5, 0.3, 0.2];
    return weights[variationIndex % weights.length];
  }

  private startFlexibilityMonitoring() {
    setInterval(() => {
      this.updateFlexibilityState();
      this.applyMemoryDistortions();
    }, 5000);
  }

  private updateFlexibilityState() {
    const progression = this.canonicalSystem.getCanonicalProgression(
      this.transformationSystem.getCurrentPuzzleId()
    );

    // Increase flexibility as game progresses
    this.state.distortionLevel = Math.min(1.0, progression.progression * 1.2);
    this.state.uncertaintyLevel = Math.min(1.0, progression.progression * 1.5);
    this.state.memoryStability = Math.max(0.2, 1.0 - progression.progression * 0.8);
    this.state.echoReliability = Math.max(0.1, 1.0 - progression.progression * 0.9);

    // Add distortions in later stages
    if (progression.phase >= 3 && Math.random() < 0.3) {
      this.addMemoryDistortion();
    }
  }

  private addMemoryDistortion() {
    const distortionTypes = ["glitch", "emotional", "temporal", "system"];
    const type = distortionTypes[Math.floor(Math.random() * distortionTypes.length)];

    const distortion: MemoryDistortion = {
      id: Date.now(),
      distortionType: type as "glitch" | "emotional" | "temporal" | "system",
      intensity: 0.3 + Math.random() * 0.7,
      triggerCondition: this.getDistortionTrigger(type),
      effect: this.getDistortionEffect(type)
    };

    this.state.activeDistortions.push(distortion);

    // Apply distortion to random shards
    const affectedShards = this.flexibleShards.filter(() => Math.random() < 0.3);
    affectedShards.forEach(shard => {
      shard.emotionalTone = "distorted";
      shard.corruptionLevel = Math.min(1.0, shard.corruptionLevel + 0.2);
    });
  }

  private getDistortionTrigger(type: string): string {
    const triggers = {
      glitch: "corruption > 0.5",
      emotional: "uncertainty > 0.6",
      temporal: "progression > 0.7",
      system: "echoReliability < 0.4"
    };

    return triggers[type] || "progression > 0.5";
  }

  private getDistortionEffect(type: string): string {
    const effects = {
      glitch: "Memory fragments become visually corrupted",
      emotional: "Emotional tone shifts unpredictably",
      temporal: "Time perception becomes unstable",
      system: "System messages interfere with memories"
    };

    return effects[type] || "Memory becomes unreliable";
  }

  private applyMemoryDistortions() {
    this.state.activeDistortions.forEach(distortion => {
      // Apply distortion effects to flexible shards
      this.flexibleShards.forEach(shard => {
        if (Math.random() < distortion.intensity) {
          this.applyDistortionToShard(shard, distortion);
        }
      });
    });

    // Remove expired distortions
    if (this.state.activeDistortions.length > 3) {
      this.state.activeDistortions.shift();
    }
  }

  private applyDistortionToShard(shard: FlexibleMemoryShard, distortion: MemoryDistortion) {
    switch (distortion.distortionType) {
      case "glitch":
        shard.emotionalTone = "corrupted";
        shard.corruptionLevel = Math.min(1.0, shard.corruptionLevel + 0.3);
        shard.variationProbability = Math.min(1.0, shard.variationProbability + 0.4);
        break;

      case "emotional":
        shard.emotionalTone = "uncertain";
        const emotionalVariations = ["confused", "sad", "angry", "fearful"];
        shard.flexibleDetails.forEach(detail => {
          detail.emotionalImpact += (Math.random() - 0.5) * 2;
        });
        break;

      case "temporal":
        shard.emotionalTone = "distorted";
        // Shift variation probabilities
        shard.flexibleDetails.forEach((detail, index) => {
          detail.probabilityWeight = Math.max(0.1, detail.probabilityWeight * (0.8 + Math.random() * 0.4));
        });
        break;

      case "system":
        shard.emotionalTone = "corrupted";
        shard.corruptionLevel = Math.min(1.0, shard.corruptionLevel + 0.4);
        // Add system interference
        shard.flexibleDetails.push({
          id: `system_${Date.now()}`,
          arabic: "النظام يقول: هذه الذاكرة غير موثوقة",
          english: "System says: This memory is unreliable",
          emotionalImpact: -3,
          corruptionEffect: 0.8,
          probabilityWeight: 0.5
        });
        break;
    }
  }

  // ─── FLEXIBLE MEMORY RETRIEVAL ─────────────────────────────────
  public getFlexibleMemoryShard(shardId: number): FlexibleMemoryShard | null {
    const shard = this.flexibleShards.find(s => s.id === shardId);
    if (!shard) return null;

    // Apply current distortions
    this.applyCurrentDistortions(shard);

    // Select variation based on probabilities
    if (Math.random() < shard.variationProbability) {
      const selectedVariation = this.selectVariation(shard);
      shard.currentVariationIndex = selectedVariation;
    }

    return { ...shard };
  }

  private applyCurrentDistortions(shard: FlexibleMemoryShard) {
    // Apply active distortions to this shard
    this.state.activeDistortions.forEach(distortion => {
      this.applyDistortionToShard(shard, distortion);
    });
  }

  private selectVariation(shard: FlexibleMemoryShard): number {
    // Select variation based on probability weights
    const totalWeight = shard.flexibleDetails.reduce((sum, detail) => sum + detail.probabilityWeight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < shard.flexibleDetails.length; i++) {
      random -= shard.flexibleDetails[i].probabilityWeight;
      if (random <= 0) {
        return i;
      }
    }

    return 0;
  }

  // ─── ECHO UNRELIABLE MEMORY BEHAVIOR ───────────────────────────
  public getEchoMemoryBehavior(puzzleId: number): {
    statement: string;
    reliability: number;
    arabic: string;
    english: string;
  } {
    const progression = this.canonicalSystem.getCanonicalProgression(puzzleId);
    const reliability = this.state.echoReliability;

    const behaviors = [
      {
        statement: "I think I remember...",
        reliability: 0.6,
        arabic: "أعتقد أنني أتذكر...",
        english: "I think I remember..."
      },
      {
        statement: "The system says...",
        reliability: 0.4,
        arabic: "النظام يقول...",
        english: "The system says..."
      },
      {
        statement: "Maybe it was...",
        reliability: 0.5,
        arabic: "ربما كان...",
        english: "Maybe it was..."
      },
      {
        statement: "I'm not sure, but...",
        reliability: 0.7,
        arabic: "لست متأكدًا، لكن...",
        english: "I'm not sure, but..."
      },
      {
        statement: "This memory keeps changing...",
        reliability: 0.3,
        arabic: "هذه الذاكرة تتغير باستمرار...",
        english: "This memory keeps changing..."
      }
    ];

    // Select behavior based on reliability
    const index = Math.floor((1 - reliability) * behaviors.length);
    return behaviors[index];
  }

  // ─── DYNAMIC NARRATIVE SHIFTING ────────────────────────────────
  public getNarrativeVariation(puzzleId: number): {
    stableCore: string;
    currentVariation: string;
    variationReason: string;
    corruptionEffect: number;
  } {
    const shard = this.getFlexibleMemoryShard(puzzleId);
    if (!shard) {
      return {
        stableCore: "No memory shard found",
        currentVariation: "No memory shard found",
        variationReason: "Shard not found",
        corruptionEffect: 0
      };
    }

    const currentLang = this.multilingualSystem.getCurrentLanguage();
    const variation = shard.flexibleDetails[shard.currentVariationIndex] || shard.flexibleDetails[0];

    return {
      stableCore: shard.stableCore,
      currentVariation: currentLang === "arabic" ? variation.arabic : variation.english,
      variationReason: this.getVariationReason(shard),
      corruptionEffect: variation.corruptionEffect
    };
  }

  private getVariationReason(shard: FlexibleMemoryShard): string {
    const reasons = [
      "Memory distortion from system corruption",
      "Echo's unreliable perception",
      "Emotional instability affecting recall",
      "Temporal distortion in memory",
      "System interference with memory",
      "Partial memory corruption",
      "Unstable consciousness state"
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  // ─── STABILITY VS CORRUPTION SCALING ────────────────────────────
  public getStabilityCorruptionBalance(): {
    stability: number;
    corruption: number;
    balanceDescription: string;
    arabicDescription: string;
    englishDescription: string;
  } {
    return {
      stability: this.state.memoryStability,
      corruption: this.state.distortionLevel,
      balanceDescription: this.getBalanceDescription(),
      arabicDescription: this.getBalanceDescriptionArabic(),
      englishDescription: this.getBalanceDescriptionEnglish()
    };
  }

  private getBalanceDescription(): string {
    if (this.state.memoryStability > 0.7) {
      return "Stable memories with minor distortions";
    } else if (this.state.memoryStability > 0.4) {
      return "Unstable memories with frequent distortions";
    } else {
      return "Highly corrupted memories, truth unclear";
    }
  }

  private getBalanceDescriptionArabic(): string {
    if (this.state.memoryStability > 0.7) {
      return "ذكريات مستقرة مع تشوهات طفيفة";
    } else if (this.state.memoryStability > 0.4) {
      return "ذكريات غير مستقرة مع تشوهات متكررة";
    } else {
      return "ذكريات فاسدة للغاية، الحقيقة غير واضحة";
    }
  }

  private getBalanceDescriptionEnglish(): string {
    if (this.state.memoryStability > 0.7) {
      return "Stable memories with minor distortions";
    } else if (this.state.memoryStability > 0.4) {
      return "Unstable memories with frequent distortions";
    } else {
      return "Highly corrupted memories, truth unclear";
    }
  }

  // ─── EXAMPLE FLEXIBLE MEMORIES ─────────────────────────────────
  public getExampleFlexibleMemories(): FlexibleMemoryShard[] {
    return [
      this.createExampleShard(50, "kenja"),
      this.createExampleShard(150, "lina"),
      this.createExampleShard(250, "echo")
    ];
  }

  private createExampleShard(shardId: number, source: string): FlexibleMemoryShard {
    const canonicalShard = this.canonicalSystem.getCanonicalShards().find(s => s.id === shardId);
    if (!canonicalShard) {
      return {
        id: shardId,
        stableCore: `CORE: ${source.toUpperCase()} - Example memory`,
        flexibleDetails: [],
        emotionalTone: "stable",
        corruptionLevel: 0.2,
        variationProbability: 0.3,
        currentVariationIndex: 0
      };
    }

    return {
      id: shardId,
      stableCore: this.extractStableCore(canonicalShard.fragment),
      flexibleDetails: this.generateFlexibleDetails(canonicalShard),
      emotionalTone: "uncertain",
      corruptionLevel: canonicalShard.corruptionLevel,
      variationProbability: 0.4,
      currentVariationIndex: 0
    };
  }

  // ─── EXPORT FLEXIBLE CANON SYSTEM ─────────────────────────────
  public getFlexibleCanonState(): FlexibleCanonState {
    return { ...this.state };
  }

  public getAllFlexibleShards(): FlexibleMemoryShard[] {
    return [...this.flexibleShards];
  }
}

// ─── EXPORT MAIN FLEXIBLE CANON SYSTEM ──────────────────────────
export const echoFlexibleCanonSystem = new EchoFlexibleCanonEngine();

// Export types for integration
export type {
  FlexibleMemoryShard,
  FlexibleDetail,
  MemoryDistortion,
  FlexibleCanonState
};

// Export functions
export function getFlexibleMemoryShard(shardId: number): FlexibleMemoryShard | null {
  return echoFlexibleCanonSystem.getFlexibleMemoryShard(shardId);
}

export function getEchoMemoryBehavior(puzzleId: number): {
  statement: string;
  reliability: number;
  arabic: string;
  english: string;
} {
  return echoFlexibleCanonSystem.getEchoMemoryBehavior(puzzleId);
}

export function getNarrativeVariation(puzzleId: number): {
  stableCore: string;
  currentVariation: string;
  variationReason: string;
  corruptionEffect: number;
} {
  return echoFlexibleCanonSystem.getNarrativeVariation(puzzleId);
}

export function getStabilityCorruptionBalance(): {
  stability: number;
  corruption: number;
  balanceDescription: string;
  arabicDescription: string;
  englishDescription: string;
} {
  return echoFlexibleCanonSystem.getStabilityCorruptionBalance();
}

export function getExampleFlexibleMemories(): FlexibleMemoryShard[] {
  return echoFlexibleCanonSystem.getExampleFlexibleMemories();
}

export function getFlexibleCanonState(): FlexibleCanonState {
  return echoFlexibleCanonSystem.getFlexibilityState();
}