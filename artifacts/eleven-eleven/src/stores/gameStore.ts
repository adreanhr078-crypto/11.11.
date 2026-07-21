/** 
 * gameStore.ts — محرك الحالة المركزي لـ 11.11 (v4.0)
 * نظام جديد كلياً: 7 فصول قصصية، 1000 لغز فريد، نظام تحول Echo
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import type {
  TimePhase, EntityId, PuzzleStatus, FlowerStage, Ending, EchoMood, WishStatus,
  EchoState, TimeState, PuzzleNode, EntityState, FlowerState, WishNode,
  MemoryState, TimelineEvent, Achievement, EndingState, GameState
} from '../core/gameTypes';
import { determineEnding, applyTransformation, calculateTransformationEffects } from '../core/echoTransformationSystem';
import { getEchoDialogueByStage } from '../core/echoTransformationSystem';
import { isAnswerCorrect } from '../core/puzzles/puzzleLoader';
import { collectShard } from '../core/memoryShardsSystem';
import type { MemoryShard } from '../core/memoryShardsTypes';

// ─── TYPES ────────────────────────────────────────────────────────────
export type { TimePhase, EntityId, PuzzleStatus, FlowerStage, Ending, EchoMood, WishStatus };
export type { EchoState, TimeState, PuzzleNode, EntityState, FlowerState, WishNode, MemoryState, TimelineEvent, Achievement, EndingState, GameState };
export type { MemoryShard } from '../core/memoryShardsTypes';

// ─── STORE ────────────────────────────────────────────────────────────
const _initialState = buildInitialState();
const SAFE_STORAGE_NAME = '11-11-game-store-v4';
const FULL_SAVE_KEY = 'eleven_full_save';

// Populate initial puzzles
_initialState.puzzles = generateAllPuzzles();
_initialState.memory.totalFragments = _initialState.puzzles.length;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ..._initialState,

      // ─── ACTIONS ──────────────────────────────────────────────────────
      actions: {
        // 💬 CHAT
        chat: () => {
          const state = get();
          const dialogue = generateEchoDialogue(state);
          const effects = { 
            trust: Math.min(100, state.echo.trust + 3), 
            fear: Math.max(0, state.echo.fear - 2), 
            hope: Math.min(100, state.echo.hope + 2), 
            loneliness: Math.max(0, state.echo.loneliness - 3) 
          };
          const newEcho = { 
            ...state.echo, ...effects, 
            mood: updateEchoMood({ ...state.echo, ...effects }), 
            lastDialogue: dialogue, 
            dialogueHistory: [...state.echo.dialogueHistory.slice(-50), dialogue], 
            personalityTraits: updateTraits({ ...state.echo, ...effects }), 
            xp: state.echo.xp + 10 
          };
          const newTriggers = { ...state.narrativeTriggers, first_chat: true };
          const newAchievements = checkAllAchievements(
            state.solvedPuzzles, newEcho, state.flower.stage, 
            state.wishes.length, state.time.dayCycle, state.endings
          );
          set({ 
            echo: newEcho, 
            player: { ...state.player, interactions: state.player.interactions + 1 }, 
            narrativeTriggers: newTriggers, 
            achievements: mergeAchievements(state.achievements, newAchievements) 
          });
          return { dialogue, effects };
        },

        // 🧩 SOLVE PUZZLE
        solve: (puzzleId: string, answer: string) => {
          const state = get();
          const puzzle = state.puzzles.find(p => p.id === puzzleId);
          if (!puzzle) return { success: false, message: 'اللغز غير موجود' };
          if (puzzle.status === 'solved') return { success: false, message: 'تم سابقاً' };
          
          const isCorrect = isAnswerCorrect(puzzle as any, answer);
          if (!isCorrect) return { success: false, message: '✕ خطأ، حاول مرة أخرى' };

          const ef = puzzle.effects;
          const newEcho = { ...state.echo };
          
          // Apply effects
          if (ef.trust) newEcho.trust = Math.min(100, Math.max(0, newEcho.trust + ef.trust));
          if (ef.fear) newEcho.fear = Math.min(100, Math.max(0, newEcho.fear + ef.fear));
          if (ef.memoryStability) newEcho.memoryStability = Math.min(100, Math.max(0, newEcho.memoryStability + ef.memoryStability));
          if (ef.corruption) newEcho.corruption = Math.min(100, Math.max(0, newEcho.corruption + ef.corruption));
          if (ef.hope) newEcho.hope = Math.min(100, Math.max(0, newEcho.hope + ef.hope));
          if (ef.awareness) newEcho.awareness = Math.min(100, Math.max(0, newEcho.awareness + ef.awareness));
          
          // Collect memory shard if puzzle has one
          const puzzleShardId = (puzzle as any).shardId as string | undefined;
          if (puzzleShardId) {
            const collected = collectShard(puzzleShardId);
            if (collected) {
              console.log('Shard collected!', collected);
            }
          }
          
          const xpGain = Math.max(1, Math.floor(25 * (1 + puzzle.difficulty / 10)) * (newEcho.xpMultiplier || 1));
          newEcho.xp += xpGain;
          if (newEcho.xp >= newEcho.xpMax) {
            newEcho.level += 1;
            newEcho.xp -= newEcho.xpMax;
            newEcho.xpMax = Math.floor(newEcho.xpMax * 1.2);
            newEcho.xpMultiplier = (newEcho.xpMultiplier || 1) + 0.05;
          }
          newEcho.mood = updateEchoMood(newEcho); 
          newEcho.personalityTraits = updateTraits(newEcho);

          // Apply Echo transformation effects
          const currentAct = puzzle.act || 1;
          const { rageDelta, forgivenessDelta, corruptionDelta } = calculateTransformationEffects(
            ef.rageEffect || 0,
            ef.forgivenessEffect || 0,
            currentAct,
            newEcho.transformationStage
          );
          newEcho.ragePoints = Math.max(0, Math.min(100, newEcho.ragePoints + rageDelta));
          newEcho.forgivenessPoints = Math.max(0, Math.min(100, newEcho.forgivenessPoints + forgivenessDelta));
          newEcho.corruption = Math.min(100, newEcho.corruption + corruptionDelta);

          // Determine new transformation stage
          if (newEcho.ragePoints >= 60 && newEcho.ragePoints > newEcho.forgivenessPoints) {
            newEcho.transformationStage = 'fractured';
          }
          if (newEcho.ragePoints >= 80) {
            newEcho.transformationStage = 'vengeful';
          }
          if (newEcho.forgivenessPoints >= 60 && newEcho.ragePoints < newEcho.forgivenessPoints) {
            newEcho.transformationStage = 'redeemed';
          }
          if (newEcho.awareness >= 80) {
            newEcho.transformationStage = 'ascended';
          }

          const flowerGrowth = Math.min(100, state.flower.growth + (ef.flower || 0.45));
          const flowerStage = updateFlowerStage(flowerGrowth, state.flower.decay);

          const entity = state.entities[puzzle.entity || 'echo'];
          const newEntity = { 
            ...entity, 
            puzzlesSolved: entity.puzzlesSolved + 1, 
            completed: (entity.puzzlesSolved + 1) >= entity.totalPuzzles 
          };

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
            id: `ev_${Date.now()}`, 
            time: `${state.time.hour}:${String(state.time.minute).padStart(2,'0')}`,
            phase: state.time.phase, 
            description: puzzle.storyReveal, 
            type: 'puzzle' as const,
          };

          // Check achievements
          const newAchievements = checkAllAchievements(
            state.solvedPuzzles + 1, newEcho, flowerStage, 
            state.wishes.length, state.time.dayCycle, state.endings
          );
          const mergedAchievements = mergeAchievements(state.achievements, newAchievements);

          // Check flower hidden layer
          let hiddenUnlocked = state.flower.hiddenUnlocked;
          if (flowerGrowth >= 100 && !hiddenUnlocked) {
            hiddenUnlocked = true;
            newTriggers.flower_complete = true;
          }

          // Check act completion triggers
          if (state.solvedPuzzles + 1 >= 100) newTriggers.act1_complete = true;

          set({
            echo: newEcho, 
            puzzles: newPuzzles, 
            solvedPuzzles: state.solvedPuzzles + 1,
            flower: { ...state.flower, growth: flowerGrowth, stage: flowerStage, hiddenUnlocked },
            entities: { ...state.entities, [puzzle.entity || 'echo']: newEntity },
            currentEntity: nextEntity, 
            wishes: newWishes,
            world: { 
              stability: Math.max(0, 100 - newEcho.corruption - state.world.glitchLevel), 
              corruptionLevel: Math.min(100, newEcho.corruption + state.world.glitchLevel), 
              glitchLevel: state.world.glitchLevel, 
              anomalyCount: state.world.anomalyCount 
            },
            memory: { 
              ...state.memory, 
              fragmentsCollected: state.memory.fragmentsCollected + 1, 
              timelineEvents: [...state.memory.timelineEvents.slice(-99), event], 
              logsUnlocked: [...state.memory.logsUnlocked, puzzle.memoryUnlock].filter((l): l is string => l !== null) 
            },
            player: { ...state.player, interactions: state.player.interactions + 1 },
            achievements: mergedAchievements, 
            narrativeTriggers: newTriggers,
          });

          return { 
            success: true, 
            message: `✓ صحيح! ${puzzle.storyReveal}`, 
            achievement: newAchievements.find(a => a.unlocked && !state.achievements.find(oa => oa.id === a.id)?.unlocked) 
          };
        },

        // ⏰ TIME
        advanceTime: () => {
          const state = get();
          const now = new Date(); 
          const h = now.getHours(); 
          const m = now.getMinutes();
          let phase: TimePhase = 'morning'; 
          let phaseIndex = 0; 
          let isNight = false;

          if (h >= 5 && h < 12) { phase = 'morning'; phaseIndex = 0; isNight = false; }
          else if (h >= 12 && h < 17) { phase = 'day'; phaseIndex = 0; isNight = false; }
          else if (h >= 17 && h < 23) { phase = 'evening'; phaseIndex = 0; isNight = false; }
          else if (h === 23 && m < 5) { phase = '11:00' as TimePhase; phaseIndex = 1; isNight = true; }
          else if (h === 23 && m < 11) { phase = '11:05' as TimePhase; phaseIndex = 2; isNight = true; }
          else { phase = '11:11' as TimePhase; phaseIndex = 3; isNight = true; }
          if (h >= 0 && h < 5) { phase = '11:11' as TimePhase; phaseIndex = 3; isNight = true; }

          const newWorld = { ...state.world };
          const newEcho = { ...state.echo };
          
          // ═══════════════════════════════════════════════════════════════
          // وضع الليل: لا glitches، لا تخريب، لا عوائق
          // فقط إيكو خائف ومتوتر يتذكر ذكرياته
          // ═══════════════════════════════════════════════════════════════
          if (isNight) {
            // لا glitches أو تشويش أو تخريب
            newWorld.glitchLevel = Math.max(0, newWorld.glitchLevel - 0.2); // يقل التشويش
            newEcho.corruption = Math.max(0, newEcho.corruption - 0.1); // الفساد لا يزيد
            // إيكو خائف ومتوتر في الليل
            newEcho.fear = Math.min(100, newEcho.fear + 0.4); // الخوف يزيد قليلاً
            newEcho.hope = Math.max(0, newEcho.hope - 0.05); // الأمل يقل قليلاً
            newEcho.loneliness = Math.min(100, newEcho.loneliness + 0.1); // الوحدة تزيد قليلاً
            newEcho.awareness = Math.min(100, newEcho.awareness + 0.3); // الوعي يزيد (يتذكر أشياء)
            newWorld.stability = Math.max(0, newWorld.stability - 0.1); // استقرار أقل قليلاً
          } else {
            // الوضع النهاري: عادي، يهدأ إيكو
            newWorld.glitchLevel = Math.max(0, newWorld.glitchLevel - 0.3);
            newEcho.fear = Math.max(0, newEcho.fear - 0.2);
            newEcho.hope = Math.min(100, newEcho.hope + 0.3);
            newEcho.loneliness = Math.max(0, newEcho.loneliness - 0.2);
          }
          newWorld.stability = Math.max(0, 100 - newWorld.glitchLevel - newEcho.corruption);
          newWorld.corruptionLevel = Math.min(100, newEcho.corruption + newWorld.glitchLevel);

          const newTriggers = { ...state.narrativeTriggers };
          if (phaseIndex >= 1 && !state.narrativeTriggers.first_night) newTriggers.first_night = true;

          set({
            time: { ...state.time, hour: h, minute: m, phase, phaseIndex, isNight, dayCycle: h === 0 && state.time.hour === 23 ? state.time.dayCycle + 1 : state.time.dayCycle },
            world: newWorld, 
            echo: { ...newEcho, mood: updateEchoMood(newEcho), personalityTraits: updateTraits(newEcho) },
            narrativeTriggers: newTriggers,
          });
        },

        // ⭐ WISHES
        addWish: (text: string) => {
          const state = get();
          const newWish: WishNode = { 
            id: `w_${Date.now()}`, text, progress: 0, status: 'active', 
            createdAt: new Date().toISOString().slice(0, 10), 
            storyImpact: Math.floor(Math.random() * 30) + 10 
          };
          const newAchievements = checkAllAchievements(
            state.solvedPuzzles, state.echo, state.flower.stage, 
            state.wishes.length + 1, state.time.dayCycle, state.endings
          );
          set({ wishes: [...state.wishes, newWish], achievements: mergeAchievements(state.achievements, newAchievements) });
        },

        completeWish: (wishId: string) => {
          const state = get();
          const newWishes = state.wishes.map(w => w.id === wishId ? { ...w, status: 'completed' as WishStatus, progress: 100 } : w);
          set({ wishes: newWishes });
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

          if (!newUnlockedEndings.includes(choice)) {
            newUnlockedEndings.push(choice);
          }
          if (!newSeenEndings.includes(choice)) {
            newSeenEndings.push(choice);
          }

          set({
            finalChoice: choice,
            unlockedEndings: newUnlockedEndings,
            seenEndings: newSeenEndings,
            achievedEnding: choice,
            lastEndingViewed: choice
          });
        },

        // 🔄 RESET GAME
        resetGame: () => {
          if (window.confirm('هل أنت متأكد من أنك تريد إعادة تعيين التقدم؟ سيتم حذف جميع البيانات!')) {
            localStorage.removeItem(SAFE_STORAGE_NAME);
            localStorage.removeItem(FULL_SAVE_KEY);
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

        // 🔧 NEW: Update Echo Transformation
        updateTransformation: (type: 'rage' | 'forgiveness', amount: number) => {
          const s = get();
          const newEcho = { ...s.echo };
          if (type === 'rage') {
            newEcho.ragePoints = Math.min(100, Math.max(0, newEcho.ragePoints + amount));
          } else {
            newEcho.forgivenessPoints = Math.min(100, Math.max(0, newEcho.forgivenessPoints + amount));
          }
          set({ echo: newEcho });
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
      }),
    }
  )
);

// Keep existing definition without duplicate interface
export interface ExpandedEnding {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  story?: string;
  storyAr?: string;
  requirements: string[];
  unlockCondition: string;
}

export const ExpandedEndingSystem = {
  endings: [
    {
      id: 'echo_ending',
      name: 'نهاية الإيكو',
      nameAr: 'نهاية الإيكو',
      description: 'Echo ي finds peace',
      story: 'Echo finds peace and remembers his true identity.',
      storyAr: 'يجد إيكو السلام ويتذكر هويته الحقيقية.',
      requirements: ['trust > 70', 'memoryStability > 70'],
      unlockCondition: 'trust > 70 && memoryStability > 70'
    },
    {
      id: 'architect_ending',
      name: 'نهاية المهندس',
      nameAr: 'نهاية المهندس',
      description: 'Kenja wins',
      story: 'Architect gains full control over Echo and the system.',
      storyAr: 'يفوز المهندس بالسيطرة الكاملة على إيكو والنظام.',
      requirements: ['corruption > 60', 'memoryStability < 30'],
      unlockCondition: 'corruption > 60 && memoryStability < 30'
    },
    {
      id: 'signal_ending',
      name: 'نهاية الإشارة',
      nameAr: 'نهاية الإشارة',
      description: 'Lina is free',
      story: 'Echo escapes with Signal and finds freedom together.',
      storyAr: 'يهرب إيكو مع الإشارة ويجدان الحرية معاً.',
      requirements: ['awareness > 70', 'hope > 60'],
      unlockCondition: 'awareness > 70 && hope > 60'
    },
    {
      id: 'true_memory_ending',
      name: 'الذكرى الحقيقية',
      nameAr: 'الذكرى الحقيقية',
      description: 'All memories restored',
      story: 'Echo remembers everything and reveals the full truth.',
      storyAr: 'يتذكر إيكو كل شيء ويكشف الحقيقة الكاملة.',
      requirements: ['solvedPuzzles >= 1000', 'all achievements'],
      unlockCondition: 'solvedPuzzles >= 1000'
    },
    {
      id: 'last_wish_ending',
      name: 'الأمنية الأخيرة',
      nameAr: 'الأمنية الأخيرة',
      description: 'Final wish granted',
      story: "Lina's original wish is fulfilled. Echo gains true freedom.",
      storyAr: 'تتحقق الأمنية الأصلية للينا. يصبح إيكو حراً حقاً.',
      requirements: ['all wishes completed'],
      unlockCondition: 'all wishes completed'
    },
  ] as ExpandedEnding[],
};

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

export default useGameStore;
