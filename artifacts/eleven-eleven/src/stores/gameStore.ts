/**
 * gameStore.ts — محرك الحالة المركزي لـ 11.11 (v3.0)
 * ALL 18 SYSTEMS: Echo, Puzzles(ORIGINAL_PUZZLE_COUNT), Entities(4), Flowers, Memory, Wishes,
 * Time(08:00→11:11), Morning, Day, Evening, Night, Progression,
 * Endings(4), World, Player, Achievements(24), Save/Load, Dialogue
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateFractureArcPuzzles, generateFractureMemoryShards, generateFractureCinematicScenes, generateFractureAchievements, FractureArcData } from '../core/echoFractureArc';
import { generatePreludeArcPuzzles, generatePreludeMemoryShards, generatePreludeCinematicScenes, generatePreludeAchievements, PreludeArcData } from '../core/echoTransformationPreludeArc';
import { generateArchitectArcPuzzles, generateArchitectMemoryShards, generateArchitectCinematicScenes, generateArchitectAchievements, ArchitectArcData } from '../core/echoArchitectArc';
import { generateSignalArcPuzzles, generateSignalMemoryShards, generateSignalCinematicScenes, generateSignalAchievements, SignalArcData } from '../core/echoSignalArc';
import { generateFinalArcPuzzles, generateFinalMemoryShards, generateFinalCinematicScenes, generateFinalAchievements, FinalArcData, ExpandedEndingSystem } from '../core/echoFinalArc';
import { generateOriginalMemoryShards } from '../core/memoryShardsSystem';
import type { MemoryShard } from '../core/memoryShardsTypes';
import {
  ORIGINAL_PUZZLE_COUNT,
  TOTAL_PUZZLES,
  PRELUDE_START,
  PRELUDE_END,
  FRACTURE_START,
  FRACTURE_END,
  ARCHITECT_START,
  ARCHITECT_END,
  SIGNAL_START,
  SIGNAL_END,
  FINAL_START,
  FINAL_END,
  PRELUDE_PUZZLE_COUNT,
  FRACTURE_PUZZLE_COUNT,
  ARCHITECT_PUZZLE_COUNT,
  SIGNAL_PUZZLE_COUNT,
  FINAL_PUZZLE_COUNT,
  TOTAL_MEMORY_SHARDS,
} from '../constants/puzzleConstants';
import {
  buildInitialState,
  generateAllAchievements,
  generateAllPuzzles,
  updateFlowerStage,
  updateEchoMood,
  updateTraits,
  generateEchoDialogue,
  checkAllAchievements,
  mergeAchievements,
  checkEndingProgress,
} from './gameStoreHelpers';
import { getNarrativeEngine } from '../core/narrativeEngine';
import type {
  TimePhase, EntityId, PuzzleStatus, FlowerStage, Ending, EchoMood, WishStatus,
  EchoState, TimeState, PuzzleNode, EntityState, FlowerState, WishNode,
  MemoryState, TimelineEvent, Achievement, EndingState, GameState
} from '../core/gameTypes';

// ─── TYPES ────────────────────────────────────────────────────────────
// Re-export for backward compatibility
export type { TimePhase, EntityId, PuzzleStatus, FlowerStage, Ending, EchoMood, WishStatus };
export type { EchoState, TimeState, PuzzleNode, EntityState, FlowerState, WishNode, MemoryState, TimelineEvent, Achievement, EndingState, GameState };
export type { MemoryShard } from '../core/memoryShardsTypes';

// ─── STORE ────────────────────────────────────────────────────────────
const _initialState = buildInitialState();
const SAFE_STORAGE_NAME = '11-11-game-store-v2';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ..._initialState,
      puzzles: _initialState.puzzles,
      memory: { ..._initialState.memory, totalFragments: _initialState.allMemoryShards.length },
      allMemoryShards: _initialState.allMemoryShards,

      // ─── ACTIONS ──────────────────────────────────────────────────────
      actions: {
        // 💬 CHAT
        chat: () => {
          const state = get();
          const dialogue = generateEchoDialogue(state);
          const effects = { trust: Math.min(100, state.echo.trust + 3), fear: Math.max(0, state.echo.fear - 2), hope: Math.min(100, state.echo.hope + 2), loneliness: Math.max(0, state.echo.loneliness - 3) };
          const newEcho = { ...state.echo, ...effects, mood: updateEchoMood({ ...state.echo, ...effects }), lastDialogue: dialogue, dialogueHistory: [...state.echo.dialogueHistory.slice(-50), dialogue], personalityTraits: updateTraits({ ...state.echo, ...effects }), xp: state.echo.xp + 10 };
          const newTriggers = { ...state.narrativeTriggers, first_chat: true };
          const newAchievements = checkAllAchievements(state.solvedPuzzles, newEcho, state.flower.stage, state.wishes.length, state.time.dayCycle, state.endings);
          set({ echo: newEcho, player: { ...state.player, interactions: state.player.interactions + 1 }, narrativeTriggers: newTriggers, achievements: mergeAchievements(state.achievements, newAchievements) });
          return { dialogue, effects };
        },

        // 🧩 SOLVE PUZZLE
        solve: (puzzleId: string, answer: string) => {
          const state = get();
          const puzzle = state.puzzles.find(p => p.id === puzzleId);
          if (!puzzle) return { success: false, message: 'اللغز غير موجود' };
          if (puzzle.status === 'solved') return { success: false, message: 'تم سابقاً' };
          if (!puzzle.answers.some(a => answer.trim().toLowerCase().includes(a))) return { success: false, message: '✕ خطأ' };

          const ef = puzzle.effects;
          const newEcho = { ...state.echo };
          if (ef.trust) newEcho.trust = Math.min(100, Math.max(0, newEcho.trust + ef.trust));
          if (ef.fear) newEcho.fear = Math.min(100, Math.max(0, newEcho.fear + ef.fear));
          if (ef.memoryStability) newEcho.memoryStability = Math.min(100, Math.max(0, newEcho.memoryStability + ef.memoryStability));
          if (ef.corruption) newEcho.corruption = Math.min(100, Math.max(0, newEcho.corruption + ef.corruption));
          if (ef.hope) newEcho.hope = Math.min(100, Math.max(0, newEcho.hope + ef.hope));
          newEcho.xp += 25; newEcho.mood = updateEchoMood(newEcho); newEcho.personalityTraits = updateTraits(newEcho);

          const flowerGrowth = Math.min(100, state.flower.growth + (ef.flower || 0.45));
          const flowerStage = updateFlowerStage(flowerGrowth, state.flower.decay);

          const entity = state.entities[puzzle.entity];
          const newEntity = { ...entity, puzzlesSolved: entity.puzzlesSolved + 1, completed: (entity.puzzlesSolved + 1) >= entity.totalPuzzles };

          const newPuzzles = state.puzzles.map(p => {
            if (p.id === puzzleId) return { ...p, status: 'solved' as PuzzleStatus };
            if (p.dependencies.includes(puzzleId) && p.status === 'locked') return { ...p, status: 'active' as PuzzleStatus };
            return p;
          });

          const entityOrder: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
          const cIdx = entityOrder.indexOf(state.currentEntity);
          let nextEntity = state.currentEntity;
          const newTriggers = { ...state.narrativeTriggers };

          if (newEntity.completed && cIdx < 3) {
            nextEntity = entityOrder[cIdx + 1];
            newPuzzles.forEach(p => {
              if (p.entity === nextEntity && p.status === 'locked') {
                const depsMet = p.dependencies.every(d => newPuzzles.find(dp => dp.id === d)?.status === 'solved');
                if (depsMet || p.dependencies.length === 0) p.status = 'active';
              }
            });
            newTriggers[`entity_${puzzle.entity}_complete`] = true;
          }

          // Entity complete triggers
          if (puzzle.entity === 'echo' && newEntity.completed) newTriggers.entity_echo_complete = true;
          if (puzzle.entity === 'watcher' && newEntity.completed) newTriggers.entity_watcher_complete = true;
          if (puzzle.entity === 'signal' && newEntity.completed) newTriggers.entity_signal_complete = true;
          if (puzzle.entity === 'architect' && newEntity.completed) newTriggers.entity_architect_complete = true;

          // Update wishes progress
          const newWishes = state.wishes.map(w => ({
            ...w, progress: Math.min(100, w.progress + 0.5),
            status: (w.progress + 0.5 >= 100 ? 'completed' : 'active') as WishStatus,
          }));

          const event: TimelineEvent = {
            id: `ev_${Date.now()}`, time: `${state.time.hour}:${String(state.time.minute).padStart(2,'0')}`,
            phase: state.time.phase, description: puzzle.storyReveal, type: 'puzzle',
          };

          // Check achievements
          const newAchievements = checkAllAchievements(state.solvedPuzzles + 1, newEcho, flowerStage, state.wishes.length, state.time.dayCycle, state.endings);
          const mergedAchievements = mergeAchievements(state.achievements, newAchievements);

          // Check flower hidden layer
          let hiddenUnlocked = state.flower.hiddenUnlocked;
          if (flowerGrowth >= 100 && !hiddenUnlocked) {
            hiddenUnlocked = true;
            newTriggers.flower_complete = true;
          }

          set({
            echo: newEcho, puzzles: newPuzzles, solvedPuzzles: state.solvedPuzzles + 1,
            flower: { ...state.flower, growth: flowerGrowth, stage: flowerStage, hiddenUnlocked },
            entities: { ...state.entities, [puzzle.entity]: newEntity },
            currentEntity: nextEntity, wishes: newWishes,
            world: { stability: Math.max(0, 100 - newEcho.corruption - state.world.glitchLevel), corruptionLevel: Math.min(100, newEcho.corruption + state.world.glitchLevel), glitchLevel: state.world.glitchLevel, anomalyCount: state.world.anomalyCount },
            memory: { ...state.memory, fragmentsCollected: state.memory.fragmentsCollected + 1, timelineEvents: [...state.memory.timelineEvents.slice(-99), event], logsUnlocked: [...state.memory.logsUnlocked, puzzle.memoryUnlock].filter((l): l is string => l !== null) },
            player: { ...state.player, interactions: state.player.interactions + 1 },
            achievements: mergedAchievements, narrativeTriggers: newTriggers,
          });

          return { success: true, message: `✓ صحيح! ${puzzle.storyReveal}`, achievement: newAchievements.find(a => a.unlocked && !state.achievements.find(oa => oa.id === a.id)?.unlocked) };
        },

        // ⏰ TIME
        advanceTime: () => {
          const state = get();
          const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
          let phase: TimePhase = 'morning'; let phaseIndex = 0; let isNight = false;

          if (h >= 5 && h < 12) { phase = 'morning'; phaseIndex = 0; isNight = false; }
          else if (h >= 12 && h < 17) { phase = 'day'; phaseIndex = 0; isNight = false; }
          else if (h >= 17 && h < 23) { phase = 'evening'; phaseIndex = 0; isNight = false; }
          else if (h === 23 && m < 5) { phase = '11:00'; phaseIndex = 1; isNight = true; }
          else if (h === 23 && m < 11) { phase = '11:05'; phaseIndex = 2; isNight = true; }
          else { phase = '11:11'; phaseIndex = 3; isNight = true; }
          if (h >= 0 && h < 5) { phase = '11:11'; phaseIndex = 3; isNight = true; }

          const newWorld = { ...state.world };
          const newEcho = { ...state.echo };
          if (isNight) {
            newWorld.glitchLevel = Math.min(100, newWorld.glitchLevel + (phaseIndex >= 3 ? 1 : 0.5));
            newEcho.corruption = Math.min(100, newEcho.corruption + (phaseIndex >= 3 ? 0.5 : 0.2));
            newEcho.fear = Math.min(100, newEcho.fear + (phaseIndex >= 3 ? 0.5 : 0.3));
            // Night anomaly events
            if (Math.random() > 0.8) newWorld.anomalyCount++;
          } else {
            newWorld.glitchLevel = Math.max(0, newWorld.glitchLevel - 0.3);
            newEcho.fear = Math.max(0, newEcho.fear - 0.2);
            newEcho.hope = Math.min(100, newEcho.hope + 0.2);
          }
          newWorld.stability = Math.max(0, 100 - newWorld.glitchLevel - newEcho.corruption);
          newWorld.corruptionLevel = Math.min(100, newEcho.corruption + newWorld.glitchLevel);

          const newTriggers = { ...state.narrativeTriggers };
          if (phaseIndex >= 1 && !state.narrativeTriggers.first_night) newTriggers.first_night = true;

          set({
            time: { ...state.time, hour: h, minute: m, phase: phase as TimePhase, phaseIndex, isNight, dayCycle: h < 5 && state.time.hour >= 23 ? state.time.dayCycle + 1 : state.time.dayCycle },
            world: newWorld, echo: { ...newEcho, mood: updateEchoMood(newEcho), personalityTraits: updateTraits(newEcho) },
            narrativeTriggers: newTriggers,
          });
        },

        // ⭐ WISHES
        addWish: (text: string) => {
          const state = get();
          const newWish: WishNode = { id: `w_${Date.now()}`, text, progress: 0, status: 'active', createdAt: new Date().toISOString().slice(0, 10), storyImpact: Math.floor(Math.random() * 30) + 10 };
          const newAchievements = checkAllAchievements(state.solvedPuzzles, state.echo, state.flower.stage, state.wishes.length + 1, state.time.dayCycle, state.endings);
          set({ wishes: [...state.wishes, newWish], achievements: mergeAchievements(state.achievements, newAchievements) });
        },

        completeWish: (wishId: string) => {
          const state = get();
          const newWishes = state.wishes.map(w => w.id === wishId ? { ...w, status: 'completed' as WishStatus, progress: 100 } : w);
          const completedCount = newWishes.filter(w => w.status === 'completed').length;
          set({ wishes: newWishes });
          // Check ending progress
          const ended = checkEndingProgress(state);
          set({ endings: ended });
        },

        // 🏁 ENDINGS
        checkEndings: () => {
          const state = get();
          const ended = checkEndingProgress(state);
          set({ endings: ended });
        },

        // ✅ FINAL CHOICE SYSTEM
        makeFinalChoice: (choice: string) => {
          const state = get();
          const newUnlockedEndings = [...state.unlockedEndings];
          const newSeenEndings = [...state.seenEndings];
          const newAchievedEnding = choice;

          // Determine which ending to unlock based on choice and conditions
          const ending = ExpandedEndingSystem.endings.find(e => e.id === choice);
          if (ending) {
            if (!newUnlockedEndings.includes(choice)) {
              newUnlockedEndings.push(choice);
            }
            if (!newSeenEndings.includes(choice)) {
              newSeenEndings.push(choice);
            }
          }

          set({
            finalChoice: choice,
            unlockedEndings: newUnlockedEndings,
            seenEndings: newSeenEndings,
            achievedEnding: newAchievedEnding,
            lastEndingViewed: choice
          });
        },

        // 🔄 RESET GAME
        resetGame: () => {
          if (window.confirm('هل أنت متأكد من أنك تريد إعادة تعيين التقدم؟ سيتم حذف جميع البيانات!')) {
            localStorage.removeItem('11-11-game-store');
            window.location.reload();
          }
        },

        // 🎬 REPLAY ENDING
        replayEnding: (endingId: string) => {
          const state = get();
          const newSeenEndings = [...state.seenEndings];
          if (!newSeenEndings.includes(endingId)) {
            newSeenEndings.push(endingId);
          }

          set({
            lastEndingViewed: endingId,
            seenEndings: newSeenEndings
          });
        },

        // 🔧 LEGACY COMPATIBILITY ACTIONS
        incrementTrust: (amount = 1) => {
          const s = get();
          set({ echo: { ...s.echo, trust: Math.min(100, Math.max(0, s.echo.trust + amount)) } });
        },
        decrementTrust: (amount = 1) => {
          const s = get();
          set({ echo: { ...s.echo, trust: Math.min(100, Math.max(0, s.echo.trust - amount)) } });
        },
        incrementFear: (amount = 1) => {
          const s = get();
          set({ echo: { ...s.echo, fear: Math.min(100, Math.max(0, s.echo.fear + amount)) } });
        },
        decrementFear: (amount = 1) => {
          const s = get();
          set({ echo: { ...s.echo, fear: Math.min(100, Math.max(0, s.echo.fear - amount)) } });
        },
        incrementCuriosity: (amount = 1) => {
          const s = get();
          set({ player: { ...s.player, curiosity: Math.min(100, Math.max(0, s.player.curiosity + amount)) } });
        },
        setLevel: (level: number) => {
          const s = get();
          set({ echo: { ...s.echo, level: Math.max(1, Math.min(5, level)) } });
        },
      },
    }),
    {
      name: SAFE_STORAGE_NAME,
      partialize: (state) => ({
        echo: state.echo, solvedPuzzles: state.solvedPuzzles,
        flower: state.flower, memory: state.memory,
        player: state.player, achievements: state.achievements,
        endings: state.endings, wishes: state.wishes,
        narrativeTriggers: state.narrativeTriggers,
        world: state.world, time: state.time,
        entities: state.entities, currentEntity: state.currentEntity,
        allMemoryShards: state.allMemoryShards,
        puzzles: state.puzzles,
      }),
    }
  )
);

// Initialize narrative engine after the store is ready
getNarrativeEngine().initialize();

// ─── LEGACY COMPATIBILITY ─────────────────────────────────────────────
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

export { ExpandedEndingSystem };
export default useGameStore;
