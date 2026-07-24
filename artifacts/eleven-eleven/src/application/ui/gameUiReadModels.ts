import type { GameState, PuzzleNode } from '../../core/gameTypes';
import type {
  DialogueDefinition,
  DialogueNode,
  MemoryDefinition,
} from '../../domain/content/contracts';
import {
  CHAPTER_DEFINITIONS,
  DIALOGUE_DEFINITIONS,
  MEMORY_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import {
  CINEMATIC_EPISODE_DEFINITIONS,
} from '../../infrastructure/content/cinematicContentRegistry';
import { conditionsPass } from '../../domain/narrative/ruleEngine';

export interface DashboardReadModel {
  chapter: {
    id: string;
    title: string;
    description: string;
    progress: number;
  };
  personality: GameState['echo']['personality'];
  memory: {
    unlocked: number;
    fragments: number;
    totalDefinitions: number;
    legacyCollected: number;
    legacyTotal: number;
    progress: number;
  };
  decisions: GameState['narrative']['decisionHistory'];
  activeFlags: string[];
  endingEligibility: {
    eligible: number;
    total: number;
  };
  resources: {
    coins: number;
    crystals: number;
    shards: number;
  };
  puzzleProgress: {
    resolved: number;
    total: number;
    progress: number;
  };
  cinematic: {
    authoredEpisodes: number;
    completedEpisodes: number;
    active: boolean;
  };
  hasJourneyProgress: boolean;
}

function percentage(value: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

export function createDashboardReadModel(
  state: GameState,
): DashboardReadModel {
  const chapter = CHAPTER_DEFINITIONS.find(
    (item) => item.id === state.progression.currentChapterId,
  ) ?? CHAPTER_DEFINITIONS[0];
  const resolved = new Set([
    ...state.progression.completedPuzzleIds,
    ...state.progression.skippedPuzzleIds,
  ]).size;
  const authoredFragments = MEMORY_DEFINITIONS.reduce(
    (total, memory) => total + memory.fragments.length,
    0,
  );
  const fragmentTotal = authoredFragments || state.memory.totalFragments;
  const fragmentCount = authoredFragments
    ? state.narrative.unlockedMemoryFragmentIds.length
    : state.memory.fragmentsCollected;

  return {
    chapter: {
      id: chapter?.id ?? state.progression.currentChapterId,
      title: chapter?.title.ar ?? 'فصل غير معنْون',
      description: chapter?.description.ar ?? 'بانتظار بيانات الفصل.',
      progress: percentage(resolved, state.totalPuzzles),
    },
    personality: state.echo.personality,
    memory: {
      unlocked: state.narrative.unlockedMemoryIds.length,
      fragments: state.narrative.unlockedMemoryFragmentIds.length,
      totalDefinitions: MEMORY_DEFINITIONS.length,
      legacyCollected: state.memory.fragmentsCollected,
      legacyTotal: state.memory.totalFragments,
      progress: percentage(fragmentCount, fragmentTotal),
    },
    decisions: state.narrative.decisionHistory.slice(-5).reverse(),
    activeFlags: Object.entries(state.narrative.activeFlags)
      .filter(([, active]) => active)
      .map(([flag]) => flag)
      .slice(0, 6),
    endingEligibility: {
      eligible: state.narrative.endingEligibility.filter(
        (ending) => ending.eligible,
      ).length,
      total: state.narrative.endingEligibility.length,
    },
    resources: {
      coins: state.echo.coins,
      crystals: state.echo.crystals,
      shards: state.allMemoryShards.length,
    },
    puzzleProgress: {
      resolved,
      total: state.totalPuzzles,
      progress: percentage(resolved, state.totalPuzzles),
    },
    cinematic: {
      authoredEpisodes: CINEMATIC_EPISODE_DEFINITIONS.length,
      completedEpisodes: state.cinematic.completedEpisodeIds.length,
      active: state.cinematic.activeEpisodeId !== null,
    },
    hasJourneyProgress: (
      resolved > 0
      || state.narrative.decisionHistory.length > 0
      || state.narrative.unlockedMemoryIds.length > 0
      || state.cinematic.completedSceneIds.length > 0
    ),
  };
}

export interface MemoryScreenItem {
  definition: MemoryDefinition;
  unlocked: boolean;
  unlockedFragments: number;
}

export interface MemoryScreenReadModel {
  items: MemoryScreenItem[];
  unlockedCount: number;
  fragmentCount: number;
  timeline: GameState['memory']['timelineEvents'];
  isAuthoredContentEmpty: boolean;
}

export function createMemoryScreenReadModel(
  state: GameState,
): MemoryScreenReadModel {
  const unlockedMemories = new Set(state.narrative.unlockedMemoryIds);
  const unlockedFragments = new Set(
    state.narrative.unlockedMemoryFragmentIds,
  );
  const items = MEMORY_DEFINITIONS.map((definition) => ({
    definition,
    unlocked: unlockedMemories.has(definition.id),
    unlockedFragments: definition.fragments.filter(
      (fragment) => unlockedFragments.has(fragment.id),
    ).length,
  }));

  return {
    items,
    unlockedCount: items.filter((item) => item.unlocked).length,
    fragmentCount: unlockedFragments.size,
    timeline: state.memory.timelineEvents.slice(-12).reverse(),
    isAuthoredContentEmpty: MEMORY_DEFINITIONS.length === 0,
  };
}

export interface PuzzleScreenReadModel {
  activePuzzle: PuzzleNode | null;
  chapterPuzzles: PuzzleNode[];
  solvedInChapter: number;
  totalInChapter: number;
  currentChapterId: GameState['progression']['currentChapterId'];
}

export function createPuzzleScreenReadModel(
  state: GameState,
): PuzzleScreenReadModel {
  const currentChapterId = state.progression.currentChapterId;
  const chapterPuzzles = state.puzzles.filter(
    (puzzle) => puzzle.chapterId === currentChapterId,
  );
  const activePuzzle = chapterPuzzles
    .filter((puzzle) => puzzle.status === 'active')
    .sort((left, right) => left.difficulty - right.difficulty)[0] ?? null;

  return {
    activePuzzle,
    chapterPuzzles,
    solvedInChapter: chapterPuzzles.filter(
      (puzzle) => puzzle.status === 'solved' || puzzle.status === 'skipped',
    ).length,
    totalInChapter: chapterPuzzles.length,
    currentChapterId,
  };
}

export interface DialogueScreenReadModel {
  definition: DialogueDefinition | null;
  node: DialogueNode | null;
  availableDefinitions: DialogueDefinition[];
  decisions: GameState['narrative']['decisionHistory'];
}

export function createDialogueScreenReadModel(
  state: GameState,
): DialogueScreenReadModel {
  const activeId = state.narrative.dialogue.activeDialogueId;
  const definition = DIALOGUE_DEFINITIONS.find(
    (dialogue) => dialogue.id === activeId,
  ) ?? null;
  const node = definition?.nodes.find(
    (candidate) => candidate.id === state.narrative.dialogue.currentNodeId,
  ) ?? null;
  const visibleNode = node
    ? {
      ...node,
      choices: node.choices.filter((choice) => conditionsPass(
        choice.conditions,
        {
          echo: state.echo.personality,
          progression: state.progression,
          narrative: state.narrative,
        },
      )),
    }
    : null;

  return {
    definition,
    node: visibleNode,
    availableDefinitions: DIALOGUE_DEFINITIONS.filter(
      (dialogue) => !state.narrative.dialogue.completedDialogueIds.includes(
        dialogue.id,
      ),
    ),
    decisions: state.narrative.decisionHistory.slice(-8).reverse(),
  };
}

export interface EchoMindReference {
  id: string;
  label: string;
  kind: 'memory' | 'fragment' | 'decision';
}

export interface EchoMindCapability {
  id: string;
  label: string;
  description: string;
  status: 'ready' | 'planned';
}

export interface EchoMindScreenReadModel {
  latestEchoLine: string | null;
  conversationCount: number;
  interactions: number;
  trust: number;
  fear: number;
  personality: GameState['echo']['personality'];
  memoryReferences: EchoMindReference[];
  activeFlags: string[];
  capabilities: EchoMindCapability[];
}

export function createEchoMindScreenReadModel(
  state: GameState,
): EchoMindScreenReadModel {
  const memoryReferences: EchoMindReference[] = [
    ...state.narrative.unlockedMemoryIds.slice(-3).reverse().map((id) => ({
      id,
      label: id,
      kind: 'memory' as const,
    })),
    ...state.narrative.unlockedMemoryFragmentIds.slice(-2).reverse().map((id) => ({
      id,
      label: id,
      kind: 'fragment' as const,
    })),
    ...state.narrative.decisionHistory.slice(-2).reverse().map((decision) => ({
      id: decision.id,
      label: `${decision.id} / ${decision.choiceId}`,
      kind: 'decision' as const,
    })),
  ].slice(0, 6);

  return {
    latestEchoLine: state.echo.lastDialogue || null,
    conversationCount: state.echo.dialogueHistory.length,
    interactions: state.player.interactions,
    trust: state.echo.trust,
    fear: state.echo.fear,
    personality: state.echo.personality,
    memoryReferences,
    activeFlags: Object.entries(state.narrative.activeFlags)
      .filter(([, active]) => active)
      .map(([flag]) => flag)
      .slice(0, 5),
    capabilities: [
      {
        id: 'text-channel',
        label: 'القناة النصية',
        description: 'حوار مباشر مع Echo مرتبط بالحالة الحالية.',
        status: 'ready',
      },
      {
        id: 'voice-input',
        label: 'الإدخال الصوتي',
        description: 'بنية جاهزة للميكروفون وتحويل الكلام إلى نص.',
        status: 'planned',
      },
      {
        id: 'voice-output',
        label: 'الصوت التفاعلي',
        description: 'إخراج صوتي مستقبلي متأثر بحالة Echo.',
        status: 'planned',
      },
      {
        id: 'facial-reaction',
        label: 'تعابير الوجه',
        description: 'ردود وجهية مرتبطة بالمشاعر والفساد والذاكرة.',
        status: 'planned',
      },
      {
        id: 'memory-references',
        label: 'مرجعيات الذاكرة',
        description: 'استدعاء الذكريات والشظايا والقرارات داخل الحوار.',
        status: 'ready',
      },
    ],
  };
}

export interface CharacterProfileReadModel {
  id: string;
  label: string;
  role: string;
  unlocked: boolean;
  signal: number;
  signalLabel: string;
}

export interface CharactersScreenReadModel {
  profiles: CharacterProfileReadModel[];
}

export function createCharactersScreenReadModel(
  state: GameState,
): CharactersScreenReadModel {
  const memorySignal = percentage(
    state.narrative.unlockedMemoryIds.length,
    Math.max(1, MEMORY_DEFINITIONS.length),
  );

  return {
    profiles: [
      {
        id: 'character_echo',
        label: 'Echo',
        role: 'الكيان المحوري',
        unlocked: true,
        signal: state.echo.memoryStability,
        signalLabel: 'استقرار الذاكرة',
      },
      {
        id: 'character_yuki',
        label: 'Yuki',
        role: 'مرجع عاطفي',
        unlocked: (
          state.narrative.unlockedMemoryIds.length > 0
          || state.narrative.decisionHistory.length > 0
        ),
        signal: Math.max(memorySignal, state.echo.personality.humanity),
        signalLabel: 'أثر الإنسانية',
      },
      {
        id: 'character_architect',
        label: 'Architect',
        role: 'مصدر الصراع',
        unlocked: (
          state.progression.completedPuzzleIds.length > 0
          || state.narrative.decisionHistory.length > 0
        ),
        signal: Math.max(
          state.echo.personality.fear,
          state.echo.personality.corruption,
        ),
        signalLabel: 'ضغط النظام',
      },
    ],
  };
}

export interface ProgressEventReadModel {
  id: string;
  label: string;
  meta: string;
}

export interface ProgressScreenReadModel {
  achievementsUnlocked: number;
  achievementsTotal: number;
  endingsSeen: number;
  endingsEligible: number;
  endingsTotal: number;
  decisions: number;
  memoriesUnlocked: number;
  fragmentsUnlocked: number;
  resolvedPuzzles: number;
  totalPuzzles: number;
  recentEvents: ProgressEventReadModel[];
}

export function createProgressScreenReadModel(
  state: GameState,
): ProgressScreenReadModel {
  const resolvedPuzzles = new Set([
    ...state.progression.completedPuzzleIds,
    ...state.progression.skippedPuzzleIds,
  ]).size;
  const timelineEvents = state.memory.timelineEvents
    .slice(-3)
    .reverse()
    .map((event) => ({
      id: event.id,
      label: event.description,
      meta: event.time,
    }));
  const decisions = state.narrative.decisionHistory
    .slice(-3)
    .reverse()
    .map((decision) => ({
      id: decision.id,
      label: `${decision.id} / ${decision.choiceId}`,
      meta: decision.source,
    }));

  return {
    achievementsUnlocked: state.achievements.filter(
      (achievement) => achievement.unlocked,
    ).length,
    achievementsTotal: state.achievements.length,
    endingsSeen: state.seenEndings.length,
    endingsEligible: state.narrative.endingEligibility.filter(
      (ending) => ending.eligible,
    ).length,
    endingsTotal: state.narrative.endingEligibility.length,
    decisions: state.narrative.decisionHistory.length,
    memoriesUnlocked: state.narrative.unlockedMemoryIds.length,
    fragmentsUnlocked: state.narrative.unlockedMemoryFragmentIds.length,
    resolvedPuzzles,
    totalPuzzles: state.totalPuzzles,
    recentEvents: [...decisions, ...timelineEvents].slice(0, 6),
  };
}
