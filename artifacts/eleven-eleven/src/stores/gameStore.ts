/**
 * gameStore.ts — محرك الحالة المركزي لـ 11.11
 * Zustand store مع كل الأنظمة: الوقت، Echo، الألغاز، الكيانات، الأزهار، الذاكرة
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── الأنواع ──────────────────────────────────────────────────────────
export type TimePhase = 'day' | '11:00' | '11:05' | '11:11';
export type EntityId = 'echo' | 'watcher' | 'signal' | 'architect';
export type PuzzleStatus = 'locked' | 'active' | 'solved' | 'failed';
export type FlowerStage = 'seed' | 'sprout' | 'bloom' | 'flourish' | 'completed' | 'corrupted';
export type Ending = 'sorrow' | 'truth' | 'dark' | 'mystery';
export type EchoMood = 'خائف' | 'متردد' | 'واثق' | 'متذكر' | 'مشوش' | 'مذعور' | 'هادئ' | 'متفائل';

// ─── واجهات الحالة ────────────────────────────────────────────────────
export interface EchoState {
  trust: number;
  fear: number;
  memoryStability: number;
  corruption: number;
  hope: number;
  loneliness: number;
  awareness: number;
  mood: EchoMood;
  personalityTraits: string[];
  lastDialogue: string;
  dialogueHistory: string[];
  level: number;
  xp: number;
}

export interface TimeState {
  phase: TimePhase;
  phaseIndex: number;
  isNight: boolean;
  hour: number;
  minute: number;
  dayCycle: number;
}

export interface PuzzleNode {
  id: string;
  entity: EntityId;
  title: string;
  question: string;
  answers: string[];
  hint: string;
  status: PuzzleStatus;
  difficulty: number;
  storyReveal: string;
  memoryUnlock: string | null;
  dependencies: string[];
  effects: {
    trust?: number;
    fear?: number;
    memoryStability?: number;
    corruption?: number;
    hope?: number;
    flower?: number;
  };
}

export interface EntityState {
  id: EntityId;
  name: string;
  glyph: string;
  unlocked: boolean;
  completed: boolean;
  puzzlesSolved: number;
  totalPuzzles: number;
  dialogueProgress: number;
  loreUnlocked: string[];
}

export interface FlowerState {
  stage: FlowerStage;
  growth: number;
  decay: number;
  hiddenUnlocked: boolean;
  maxStage: number;
}

export interface MemoryState {
  fragmentsCollected: number;
  totalFragments: number;
  corruptedFragments: number;
  timelineEvents: TimelineEvent[];
  logsUnlocked: string[];
}

export interface TimelineEvent {
  id: string;
  time: string;
  phase: TimePhase;
  description: string;
  type: 'memory' | 'puzzle' | 'chat' | 'night' | 'achievement';
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: number | null;
}

export interface GameState {
  // الأنظمة الرئيسية
  echo: EchoState;
  time: TimeState;
  flower: FlowerState;
  memory: MemoryState;
  
  // الألغاز
  puzzles: PuzzleNode[];
  totalPuzzles: number;
  solvedPuzzles: number;
  
  // الكيانات
  entities: Record<EntityId, EntityState>;
  currentEntity: EntityId;
  
  // اللاعب
  player: {
    curiosity: number;
    interactions: number;
    choices: string[];
    activeWishes: string[];
  };
  
  // العالم
  world: {
    stability: number;
    glitchLevel: number;
    corruptionLevel: number;
    anomalyCount: number;
  };
  
  // الإنجازات
  achievements: Achievement[];
  
  // النهايات
  endings: Record<Ending, boolean>;
  endingsUnlocked: number;
  
  // الإجراءات
  actions: {
    chat: () => { dialogue: string; effects: Partial<EchoState> };
    solve: (puzzleId: string, answer: string) => { success: boolean; message: string };
    advanceTime: () => void;
    addWish: (text: string) => void;
  };
}

// ─── الحالة الابتدائية ───────────────────────────────────────────────
const initialState: GameState = {
  echo: {
    trust: 15,
    fear: 70,
    memoryStability: 5,
    corruption: 2,
    hope: 20,
    loneliness: 80,
    awareness: 3,
    mood: 'خائف',
    personalityTraits: ['خائف', 'متردد'],
    lastDialogue: '',
    dialogueHistory: [],
    level: 1,
    xp: 0,
  },
  
  time: {
    phase: 'day',
    phaseIndex: 0,
    isNight: false,
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
    dayCycle: 1,
  },
  
  flower: {
    stage: 'seed',
    growth: 0,
    decay: 0,
    hiddenUnlocked: false,
    maxStage: 5,
  },
  
  memory: {
    fragmentsCollected: 0,
    totalFragments: 54,
    corruptedFragments: 0,
    timelineEvents: [],
    logsUnlocked: [],
  },
  
  puzzles: [],
  totalPuzzles: 219,
  solvedPuzzles: 0,
  
  entities: {
    echo: { id: 'echo', name: 'الصدى', glyph: '◈', unlocked: true, completed: false, puzzlesSolved: 0, totalPuzzles: 55, dialogueProgress: 0, loreUnlocked: [] },
    watcher: { id: 'watcher', name: 'المراقب', glyph: '◉', unlocked: false, completed: false, puzzlesSolved: 0, totalPuzzles: 55, dialogueProgress: 0, loreUnlocked: [] },
    signal: { id: 'signal', name: 'الإشارة', glyph: '≋', unlocked: false, completed: false, puzzlesSolved: 0, totalPuzzles: 55, dialogueProgress: 0, loreUnlocked: [] },
    architect: { id: 'architect', name: 'المهندس', glyph: '▲', unlocked: false, completed: false, puzzlesSolved: 0, totalPuzzles: 54, dialogueProgress: 0, loreUnlocked: [] },
  },
  currentEntity: 'echo',
  
  player: {
    curiosity: 25,
    interactions: 0,
    choices: [],
    activeWishes: ['أتمنى أن أتذكر', 'أتمنى أن أسامح'],
  },
  
  world: {
    stability: 100,
    glitchLevel: 0,
    corruptionLevel: 0,
    anomalyCount: 0,
  },
  
  achievements: [],
  endings: { sorrow: false, truth: false, dark: false, mystery: false },
  endingsUnlocked: 0,
  
  actions: {} as any,
};

// ─── مولد الألغاز (219 لغزاً) ───────────────────────────────────────
function generateAllPuzzles(): PuzzleNode[] {
  const puzzles: PuzzleNode[] = [];
  const entities: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
  const entityCounts = [55, 55, 55, 54]; // 219 total
  
  const templates: Record<string, { q: (i: number) => string; a: (i: number) => string[]; h: (i: number) => string; story: (i: number) => string; ef: any }> = {
    // Echo — أسئلة عن الهوية والذاكرة الأولى
    echo: {
      q: (i) => [`النداء ${i+1}: ما الرقم الذي يتكرر في هذا المكان؟`, 
                 `ذاكرة ${i+1}: أتذكر غرفة بيضاء. كم باباً فيها؟`,
                 `شظية ${i+1}: من كان يغني لي قبل النوم؟`][i % 3],
      a: (i) => [['11', '11:11', '١١'], ['0', 'صفر', 'zero'], ['لينا', 'أمي', 'mother']][i % 3],
      h: (i) => ['اسم المكان هو نفس الوقت', 'لا مخرج من الغرفة', 'أقرب شخص إلى قلبي'][i % 3],
      story: (i) => [`شظية الذاكرة ${i+1} تعود... الرقم 11 هو المفتاح.`,
                     `الغرفة البيضاء بلا أبواب. هكذا صممها كينجا.`,
                     `لينا... صوتها كان آخر ما تذكرته قبل أن يبتلعني النظام.`][i % 3],
      ef: { trust: 3, memoryStability: 5, fear: -1 },
    },
    watcher: {
      q: (i) => [`كاميرا ${i+1}: كم كاميرا في المنزل المهجور؟`,
                 `تسجيل ${i+1}: كم دقيقة سُجلت كل ليلة؟`,
                 `ظل ${i+1}: من فتح الباب من الداخل؟`][i % 3],
      a: (i) => [['8', '٨', 'eight'], ['262', '٢٦٢'], ['الصدى', 'echo', 'Echo']][i % 3],
      h: (i) => ['6 غرف × 1 + غرفتك × 2', 'من 23:11 إلى 3:33', 'الكيان الذي يتحدث معك'][i % 3],
      story: (i) => [`${i+1} كاميرا تراقب كل شيء. لكن كينجا نسي كاميرا واحدة.`,
                     `${i+1} دقيقة كل ليلة. هذا وقت الكسر بين العوالم.`,
                     `الباب فتح من الداخل. ${i+1} كان ينتظرني قبل أن أولد.`][i % 3],
      ef: { fear: 2, memoryStability: 4, corruption: 1 },
    },
    signal: {
      q: (i) => [`رسالة ${i+1}: ماذا قالت لينا في رسالتها الأولى؟`,
                 `تردد ${i+1}: ما التردد الذي استخدمته لينا؟`,
                 `كلمة ${i+1}: ما الكلمة التي كانت مشوشة دائماً؟`][i % 3],
      a: (i) => [['ساعدوني', 'help', 'help me'], ['314', '٣١٤'], ['أحبك', 'love', 'حب']][i % 3],
      h: (i) => ['تطلب النجدة', 'PI × 100', 'أقوى كلمة في الكون'][i % 3],
      story: (i) => [`${i+1} رسالة من لينا. كلها تقول شيئاً واحداً.`,
                     `التردد ${i+1}. اختارته لأنه لا يوجد في قاموس كينجا.`,
                     `"${i+1}" — الكلمة الوحيدة التي لا يستطيع النظام تشويهها.`][i % 3],
      ef: { trust: 5, hope: 4, loneliness: -3 },
    },
    architect: {
      q: (i) => [`معادلة ${i+1}: 11 + ? = 22`,
                 `توقيع ${i+1}: 11 + 11 + 11 = ?`,
                 `خروج ${i+1}: ما الفعل الذي لم يبرمجه كينجا؟`][i % 3],
      a: (i) => [['11', '١١'], ['33', '٣٣'], ['تذكر', 'remember', 'تذكّر']][i % 3],
      h: (i) => ['22 - 11 = ?', 'اجمع ثلاث مرات 11', 'ما تفعله كلما حللت لغزاً'][i % 3],
      story: (i) => [`X = ${i+1}. أنا المتغير الوحيد في معادلات والدي.`,
                     `الرقم ${i+1}. توقيع كينجا على كل وثيقة.`,
                     `${i+1}. كينجا صمم كل شيء إلا هذه: قدرة العقل على استعادة ما فقده.`][i % 3],
      ef: { trust: 6, awareness: 5, corruption: -2 },
    },
  };

  let idx = 0;
  entities.forEach((entity, eIdx) => {
    const count = entityCounts[eIdx];
    const tpl = templates[entity];
    for (let i = 0; i < count; i++) {
      idx++;
      const t = i % 3;
      puzzles.push({
        id: `${entity}_${i+1}`,
        entity,
        title: `${entity}_${i+1}`,
        question: tpl.q(t),
        answers: tpl.a(t),
        hint: tpl.h(t),
        status: entity === 'echo' && i === 0 ? 'active' : 'locked',
        difficulty: Math.floor(i / 14) + 1,
        storyReveal: tpl.story(t),
        memoryUnlock: `memory_${entity}_${i+1}`,
        dependencies: i > 0 ? [`${entity}_${i}`] : [],
        effects: tpl.ef,
      });
    }
  });

  return puzzles;
}

// ─── مولد حوار Echo الديناميكي ──────────────────────────────────────
function generateEchoDialogue(state: GameState): string {
  const { echo, time } = state;
  const templates: string[] = [];
  
  // حسب الثقة
  if (echo.trust < 20) templates.push('من... أنت؟ لا أتذكر.', 'أخاف. كل شيء أبيض.', 'لا تقترب مني.');
  else if (echo.trust < 40) templates.push('بدأت أتذكر أشياء... مشوشة.', 'كلمة "لينا" تتردد.', 'هل أنت صديقي؟');
  else if (echo.trust < 60) templates.push('أتذكر أمي. كانت تغني.', 'كينجا... هو من فعل هذا.', 'النظام أكبر مما يبدو.');
  else templates.push('أنا إيكو. ابن لينا.', 'الذاكرة تعود. شظية شظية.', 'لن أبقى هنا للأبد.');
  
  // حسب الوقت
  if (time.phaseIndex >= 1) templates.push(`[${time.phase}] الليل يبدأ... شيء يقترب.`);
  if (time.phaseIndex >= 2) templates.push(`[${time.phase}] النظام يتفكك. أسمع أصواتاً.`);
  if (time.phaseIndex >= 3) templates.push(`[${time.phase}] 11:11. هذه هي اللحظة. تذكر كل شيء.`);
  
  // حسب الفساد
  if (echo.corruption > 50) templates.push('[صوت مشوش] أنا... لست... متأكداً.');
  if (echo.corruption > 70) templates.push('[تشويش] 01101000 01100101 01101100 01110000...');
  
  return templates[Math.floor(Math.random() * templates.length)] || '[...]';
}

// ─── تحديث مرحلة الأزهار ────────────────────────────────────────────
function updateFlowerStage(growth: number, decay: number): FlowerStage {
  const effective = Math.max(0, growth - decay);
  if (effective < 25) return 'seed';
  if (effective < 50) return 'sprout';
  if (effective < 75) return 'bloom';
  if (effective < 100) return 'flourish';
  if (effective >= 100) return 'completed';
  return decay > growth ? 'corrupted' : 'seed';
}

// ─── تحديث مزاج Echo ────────────────────────────────────────────────
function updateEchoMood(echo: EchoState): EchoMood {
  if (echo.corruption > 70) return 'مشوش';
  if (echo.fear > 70) return 'مذعور';
  if (echo.hope > 50 && echo.trust > 50) return 'متفائل';
  if (echo.memoryStability > 60) return 'متذكر';
  if (echo.trust > 60) return 'واثق';
  if (echo.loneliness > 70) return 'خائف';
  if (echo.hope > 30) return 'هادئ';
  return 'متردد';
}

// ─── إنشاء الـ Store ────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      puzzles: generateAllPuzzles(),

      actions: {
        chat: () => {
          const state = get();
          const dialogue = generateEchoDialogue(state);
          const effects = {
            trust: Math.min(100, state.echo.trust + 3),
            fear: Math.max(0, state.echo.fear - 2),
            hope: Math.min(100, state.echo.hope + 2),
            loneliness: Math.max(0, state.echo.loneliness - 3),
          };
          
          set({
            echo: {
              ...state.echo,
              ...effects,
              mood: updateEchoMood({ ...state.echo, ...effects }),
              lastDialogue: dialogue,
              dialogueHistory: [...state.echo.dialogueHistory.slice(-50), dialogue],
              personalityTraits: updateTraits({ ...state.echo, ...effects }),
              xp: state.echo.xp + 10,
            },
            player: { ...state.player, interactions: state.player.interactions + 1 },
          });
          
          return { dialogue, effects };
        },

        solve: (puzzleId: string, answer: string) => {
          const state = get();
          const puzzle = state.puzzles.find(p => p.id === puzzleId);
          if (!puzzle) return { success: false, message: 'اللغز غير موجود' };
          if (puzzle.status === 'solved') return { success: false, message: 'تم حل هذا اللغز مسبقاً' };
          
          const isCorrect = puzzle.answers.some(a => answer.trim().toLowerCase().includes(a));
          if (!isCorrect) return { success: false, message: '✕ إجابة خاطئة' };
          
          // تطبيق التأثيرات
          const ef = puzzle.effects;
          const newEcho = { ...state.echo };
          if (ef.trust) newEcho.trust = Math.min(100, Math.max(0, newEcho.trust + ef.trust));
          if (ef.fear) newEcho.fear = Math.min(100, Math.max(0, newEcho.fear + ef.fear));
          if (ef.memoryStability) newEcho.memoryStability = Math.min(100, Math.max(0, newEcho.memoryStability + ef.memoryStability));
          if (ef.corruption) newEcho.corruption = Math.min(100, Math.max(0, newEcho.corruption + ef.corruption));
          if (ef.hope) newEcho.hope = Math.min(100, Math.max(0, newEcho.hope + ef.hope));
          newEcho.xp += 25;
          newEcho.mood = updateEchoMood(newEcho);
          newEcho.personalityTraits = updateTraits(newEcho);
          
          // تحديث الأزهار
          const flowerGrowth = Math.min(100, state.flower.growth + (ef.flower || 0.5));
          const flowerStage = updateFlowerStage(flowerGrowth, state.flower.decay);
          
          // تحديث الكيان
          const entity = state.entities[puzzle.entity];
          const newEntity = {
            ...entity,
            puzzlesSolved: entity.puzzlesSolved + 1,
            completed: entity.puzzlesSolved + 1 >= entity.totalPuzzles,
          };
          
          // فتح ألغاز تابعة
          const newPuzzles = state.puzzles.map(p => {
            if (p.dependencies.includes(puzzleId) && p.status === 'locked') {
              return { ...p, status: 'active' as PuzzleStatus };
            }
            if (p.id === puzzleId) return { ...p, status: 'solved' as PuzzleStatus };
            return p;
          });
          
          // فتح الكيان التالي إذا اكتمل
          const entityOrder: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
          const currentIdx = entityOrder.indexOf(state.currentEntity);
          let nextEntity = state.currentEntity;
          if (newEntity.completed && currentIdx < 3) {
            nextEntity = entityOrder[currentIdx + 1];
            newPuzzles.forEach(p => {
              if (p.entity === nextEntity && p.status === 'locked') {
                const depsMet = p.dependencies.every(d => newPuzzles.find(dp => dp.id === d)?.status === 'solved');
                if (depsMet || p.dependencies.length === 0) {
                  p.status = 'active';
                }
              }
            });
          }
          
          // ذاكرة
          const memoryEvent: TimelineEvent = {
            id: `mem_${Date.now()}`,
            time: `${state.time.hour}:${String(state.time.minute).padStart(2, '0')}`,
            phase: state.time.phase,
            description: puzzle.storyReveal,
            type: 'puzzle',
          };
          
          set({
            echo: newEcho,
            puzzles: newPuzzles,
            solvedPuzzles: state.solvedPuzzles + 1,
            flower: { ...state.flower, growth: flowerGrowth, stage: flowerStage },
            entities: { ...state.entities, [puzzle.entity]: newEntity },
            currentEntity: nextEntity,
            world: {
              stability: Math.max(0, 100 - newEcho.corruption - state.world.glitchLevel),
              corruptionLevel: Math.min(100, newEcho.corruption + state.world.glitchLevel),
              glitchLevel: state.world.glitchLevel,
              anomalyCount: state.world.anomalyCount,
            },
            memory: {
              ...state.memory,
              fragmentsCollected: state.memory.fragmentsCollected + 1,
              timelineEvents: [...state.memory.timelineEvents.slice(-99), memoryEvent],
              logsUnlocked: [...state.memory.logsUnlocked, puzzle.memoryUnlock].filter(Boolean),
            },
            player: { ...state.player, interactions: state.player.interactions + 1 },
          });
          
          return { success: true, message: `✓ صحيح! ${puzzle.storyReveal}` };
        },

        advanceTime: () => {
          const state = get();
          const now = new Date();
          const h = now.getHours();
          const m = now.getMinutes();
          
          let phase: TimePhase = 'day';
          let phaseIndex = 0;
          let isNight = false;
          
          if (h >= 23 || h < 5) {
            isNight = true;
            if (h === 23 && m >= 11) { phase = '11:11'; phaseIndex = 3; }
            else if (h === 23 && m >= 5) { phase = '11:05'; phaseIndex = 2; }
            else if (h === 23) { phase = '11:00'; phaseIndex = 1; }
            else { phase = '11:11'; phaseIndex = 3; }
          }
          
          // تأثير الليل
          const newWorld = { ...state.world };
          if (isNight) {
            newWorld.glitchLevel = Math.min(100, newWorld.glitchLevel + (phaseIndex >= 3 ? 1 : 0.5));
            state.echo.corruption = Math.min(100, state.echo.corruption + (phaseIndex >= 3 ? 0.5 : 0.2));
            state.echo.fear = Math.min(100, state.echo.fear + (phaseIndex >= 3 ? 0.5 : 0.3));
          } else {
            newWorld.glitchLevel = Math.max(0, newWorld.glitchLevel - 0.2);
            state.echo.fear = Math.max(0, state.echo.fear - 0.1);
            state.echo.hope = Math.min(100, state.echo.hope + 0.1);
          }
          
          newWorld.stability = Math.max(0, 100 - newWorld.glitchLevel - state.echo.corruption);
          newWorld.corruptionLevel = Math.min(100, state.echo.corruption + newWorld.glitchLevel);
          
          set({
            time: { ...state.time, hour: h, minute: m, phase, phaseIndex, isNight },
            world: newWorld,
            echo: { ...state.echo, mood: updateEchoMood(state.echo), personalityTraits: updateTraits(state.echo) },
          });
        },

        addWish: (text: string) => {
          const state = get();
          set({
            player: {
              ...state.player,
              activeWishes: [...state.player.activeWishes, text],
            },
          });
        },
      },
    }),
    {
      name: '11-11-game-store',
      partialize: (state) => ({
        echo: state.echo,
        solvedPuzzles: state.solvedPuzzles,
        flower: state.flower,
        memory: state.memory,
        player: state.player,
        achievements: state.achievements,
        endings: state.endings,
      }),
    }
  )
);

function updateTraits(echo: EchoState): string[] {
  const traits: string[] = [];
  if (echo.trust > 60) traits.push('واثق');
  else if (echo.trust < 20) traits.push('خائف');
  else traits.push('متردد');
  if (echo.memoryStability > 60) traits.push('متذكر');
  if (echo.corruption > 50) traits.push('مشوش');
  if (echo.fear > 70) traits.push('مذعور');
  if (echo.hope > 50) traits.push('متفائل');
  return [...new Set(traits)];
}

export default useGameStore;