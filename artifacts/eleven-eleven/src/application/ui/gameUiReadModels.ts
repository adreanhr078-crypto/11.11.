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
import {
  STORY_PUZZLE_COUNTS,
} from '../../content/puzzles/storyPuzzleCatalog';
import type {
  StoryPuzzleSnapshot,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import { FINAL_MANHWA_PAGES } from '../../content/manhwa/finalManhwa';
import {
  createAchievementViews,
  type AchievementView,
} from '../../domain/achievements/achievementProgression';
import {
  createEchoStatusReadModel,
  type EchoStatusReadModel,
} from './echoStatusReadModel';
import {
  getStoryCharacterAccess,
} from '../../domain/story/storyState';
import {
  getCharacterMomentReadModels,
  type CharacterMomentReadModel,
} from '../../domain/characters/characterAttachment';
import type { NetworkLocale } from '../../domain/echo-network/contracts';

export interface DashboardReadModel {
  chapter: {
    id: string;
    title: string;
    description: string;
    progress: number;
  };
  echoStatus: EchoStatusReadModel;
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

function createStoryPuzzleProgress(
  snapshot: StoryPuzzleSnapshot | null | undefined,
): DashboardReadModel['puzzleProgress'] {
  const total = STORY_PUZZLE_COUNTS.total;
  const resolved = Math.min(
    total,
    Math.max(0, snapshot?.totalCompletedCount ?? 0),
  );
  return {
    resolved,
    total,
    progress: percentage(resolved, total),
  };
}

export function createDashboardReadModel(
  state: GameState,
  storyPuzzleSnapshot: StoryPuzzleSnapshot | null = null,
  locale: NetworkLocale = 'ar',
): DashboardReadModel {
  const chapter = CHAPTER_DEFINITIONS.find(
    (item) => item.id === state.progression.currentChapterId,
  ) ?? CHAPTER_DEFINITIONS[0];
  const puzzleProgress = createStoryPuzzleProgress(storyPuzzleSnapshot);
  const fragmentTotal = FINAL_MANHWA_PAGES.reduce(
    (total, page) => total + page.requiredShardIds.length,
    0,
  );
  const fragmentCount = state.collectedMemoryFragments.length;

  return {
    chapter: {
      id: chapter?.id ?? state.progression.currentChapterId,
      title: chapter?.title[locale] ?? (locale === 'en' ? 'Untitled chapter' : 'فصل غير معنْون'),
      description: chapter?.description[locale] ?? (locale === 'en' ? 'Waiting for chapter data.' : 'بانتظار بيانات الفصل.'),
      progress: puzzleProgress.progress,
    },
    echoStatus: createEchoStatusReadModel(state.progressionState),
    memory: {
      unlocked: state.unlockedManhwaPageIds.length,
      fragments: fragmentCount,
      totalDefinitions: FINAL_MANHWA_PAGES.length,
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
      coins: state.currency,
      crystals: state.echo.crystals,
      shards: state.collectedMemoryFragments.length,
    },
    puzzleProgress,
    cinematic: {
      authoredEpisodes: CINEMATIC_EPISODE_DEFINITIONS.length,
      completedEpisodes: state.cinematic.completedEpisodeIds.length,
      active: state.cinematic.activeEpisodeId !== null,
    },
    hasJourneyProgress: (
      puzzleProgress.resolved > 0
      || state.narrative.decisionHistory.length > 0
      || state.narrative.unlockedMemoryIds.length > 0
      || state.collectedMemoryFragments.length > 0
      || state.unlockedManhwaPageIds.length > 0
      || state.cinematic.completedSceneIds.length > 0
    ),
  };
}

export interface MemoryScreenItem {
  definition: MemoryDefinition;
  unlocked: boolean;
  unlockedFragments: number;
  fragmentTotal: number;
  progress: number;
  fragments: Array<{
    id: string;
    title: string;
    text: string;
    unlocked: boolean;
    order: number;
  }>;
}

export interface MemoryScreenReadModel {
  items: MemoryScreenItem[];
  unlockedCount: number;
  fragmentCount: number;
  totalFragmentCount: number;
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
    fragmentTotal: definition.fragments.length,
    progress: percentage(
      definition.fragments.filter(
        (fragment) => unlockedFragments.has(fragment.id),
      ).length,
      definition.fragments.length,
    ),
    fragments: definition.fragments
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((fragment) => ({
        id: fragment.id,
        title: fragment.title.ar,
        text: fragment.text.ar,
        unlocked: unlockedFragments.has(fragment.id),
        order: fragment.order,
      })),
  }));

  return {
    items,
    unlockedCount: items.filter((item) => item.unlocked).length,
    fragmentCount: unlockedFragments.size,
    totalFragmentCount: MEMORY_DEFINITIONS.reduce(
      (total, definition) => total + definition.fragments.length,
      0,
    ),
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
  speakerName: string;
  availableDefinitions: DialogueDefinition[];
  decisions: GameState['narrative']['decisionHistory'];
  hasAuthoredContent: boolean;
}

function dialogueSpeakerName(speakerId: string | undefined): string {
  if (!speakerId) return 'Echo';
  const normalized = speakerId
    .replace(/^character_/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!normalized) return 'Echo';
  return titleCase(normalized);
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
    speakerName: dialogueSpeakerName(visibleNode?.speakerId),
    availableDefinitions: DIALOGUE_DEFINITIONS.filter(
      (dialogue) => !state.narrative.dialogue.completedDialogueIds.includes(
        dialogue.id,
      ),
    ),
    decisions: state.narrative.decisionHistory.slice(-8).reverse(),
    hasAuthoredContent: DIALOGUE_DEFINITIONS.length > 0,
  };
}

export interface EchoMindScreenReadModel {
  openingLine: string;
  stageTitle: string;
  stageSubtitle: string;
  conversationPlaceholder: string;
  recoveredBeliefs: string[];
  openQuestions: string[];
  knowledgeNodeIds: string[];
}

export function createEchoMindScreenReadModel(
  state: GameState,
): EchoMindScreenReadModel {
  return {
    openingLine: state.echo.lastDialogue
      || 'أشعر أن هناك شيئًا لا أستطيع تذكره...',
    stageTitle: 'Echo',
    stageSubtitle: state.echo.personality.corruption >= 55
      ? 'صوته متشوش قليلًا، لكنه ما زال يحاول الوصول إليك.'
      : 'وجوده هش، لكنه يستجيب لندائك داخل 11:11.',
    conversationPlaceholder: 'اكتب رسالة لـ Echo',
    recoveredBeliefs: state.narrative.beliefs.slice(-4).reverse(),
    openQuestions: state.narrative.questions.slice(-4).reverse(),
    knowledgeNodeIds: state.narrative.knowledgeNodeIds.slice(-4).reverse(),
  };
}

function normalizeText(value: string): string {
  return value
    .replace(/^character_/, '')
    .replace(/^scene_/, '')
    .replace(/^memory_/, '')
    .replace(/^fragment_/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function discoverCharacter(
  state: GameState,
  aliases: readonly string[],
): boolean {
  const loweredAliases = aliases.map((alias) => alias.toLowerCase());

  const unlockedMemoryHit = MEMORY_DEFINITIONS.some((memory) => (
    state.narrative.unlockedMemoryIds.includes(memory.id)
    && memory.relatedCharacterIds.some((characterId) => (
      loweredAliases.some((alias) => characterId.toLowerCase().includes(alias))
    ))
  ));

  if (unlockedMemoryHit) return true;

  const signals = [
    ...state.narrative.unlockedMemoryIds,
    ...state.narrative.unlockedMemoryFragmentIds,
    ...state.narrative.decisionHistory.flatMap((decision) => [
      decision.id,
      decision.choiceId,
      decision.source,
    ]),
    ...Object.keys(state.narrative.activeFlags).filter(
      (flag) => state.narrative.activeFlags[flag],
    ),
    ...state.cinematic.completedSceneIds,
  ].map((value) => value.toLowerCase());

  return signals.some((signal) => (
    loweredAliases.some((alias) => signal.includes(alias))
  ));
}

function getRelatedMemoryTitles(
  state: GameState,
  aliases: readonly string[],
): string[] {
  return MEMORY_DEFINITIONS
    .filter((memory) => (
      state.narrative.unlockedMemoryIds.includes(memory.id)
      && memory.relatedCharacterIds.some((characterId) => (
        aliases.some((alias) => characterId.toLowerCase().includes(alias))
      ))
    ))
    .map((memory) => memory.title.ar);
}

function getRelatedSceneLabels(
  state: GameState,
  aliases: readonly string[],
): string[] {
  return state.cinematic.completedSceneIds
    .filter((sceneId) => aliases.some((alias) => (
      sceneId.toLowerCase().includes(alias)
    )))
    .map((sceneId) => `مشهد: ${titleCase(normalizeText(sceneId))}`);
}

function getRelatedFileLabels(
  state: GameState,
  aliases: readonly string[],
): string[] {
  const flags = Object.keys(state.narrative.activeFlags)
    .filter((flag) => state.narrative.activeFlags[flag])
    .filter((flag) => aliases.some((alias) => flag.toLowerCase().includes(alias)))
    .map((flag) => `ملف: ${titleCase(normalizeText(flag))}`);
  const decisions = state.narrative.decisionHistory
    .filter((decision) => aliases.some((alias) => (
      decision.id.toLowerCase().includes(alias)
      || decision.choiceId.toLowerCase().includes(alias)
    )))
    .map((decision) => `قرار: ${titleCase(normalizeText(decision.id))}`);
  return [...flags, ...decisions];
}

export interface CharacterArchiveEntryReadModel {
  id: string;
  name: string;
  displayName: string;
  codename: string;
  role: string;
  relationship: string;
  unlocked: boolean;
  portraitMode: string;
  summary: string;
  relatedMemories: string[];
  relatedScenes: string[];
  discoveredFiles: string[];
  accessLevel: 'unknown' | 'partial' | 'identified' | 'full';
  moments: CharacterMomentReadModel[];
}

export interface CharactersScreenReadModel {
  entries: CharacterArchiveEntryReadModel[];
}

export function createCharactersScreenReadModel(
  state: GameState,
): CharactersScreenReadModel {
  const linaStoryAccess = getStoryCharacterAccess(
    state.progressionState,
    'lina',
  );
  const linaLegacyDiscovered = discoverCharacter(state, ['lina']);
  const linaIsCanonPartial = (
    linaStoryAccess === 'partial'
    && !linaLegacyDiscovered
  );
  const characterMoments = getCharacterMomentReadModels(state.progressionState);
  const momentsFor = (characterId: CharacterMomentReadModel['characterId']) => (
    characterMoments.filter((moment) => moment.characterId === characterId)
  );
  const linaCanonPartialFields: Partial<Pick<
    CharacterArchiveEntryReadModel,
    | 'displayName'
    | 'codename'
    | 'role'
    | 'relationship'
    | 'unlocked'
    | 'portraitMode'
    | 'summary'
  >> = linaIsCanonPartial
    ? {
      displayName: 'Lina',
      codename: 'LINA PROTOCOL',
      role: 'PARTIAL IDENTITY CONFIRMED',
      relationship: 'No additional relationship data has been verified.',
      unlocked: true,
      portraitMode: 'partial',
      summary: 'A partial file is available from the verified LINA PROTOCOL signal.',
    }
    : {};
  const rawEntries: CharacterArchiveEntryReadModel[] = [
      {
        id: 'character_echo',
        name: 'Echo',
        displayName: 'Echo',
        codename: 'A-17',
        role: 'الشخصية الرئيسية',
        relationship: 'أنت تتحدث معه مباشرة داخل النظام.',
        unlocked: true,
        portraitMode: 'echo',
        summary: 'كيان يبحث عن ذاكرته وهويته داخل 11:11.',
        relatedMemories: getRelatedMemoryTitles(state, ['echo']),
        relatedScenes: getRelatedSceneLabels(state, ['echo']),
        discoveredFiles: getRelatedFileLabels(state, ['echo']),
        accessLevel: 'full',
        moments: momentsFor('echo'),
      },
      {
        id: 'character_kinja',
        name: 'Kinja',
        displayName: discoverCharacter(state, ['kinja', 'kenja', 'architect'])
          ? 'Kinja'
          : 'Unknown',
        codename: 'ARCHITECT',
        role: 'الأب',
        relationship: 'صلة غامضة بذكريات Echo وبنية النظام.',
        unlocked: discoverCharacter(state, ['kinja', 'kenja', 'architect']),
        portraitMode: 'locked',
        summary: 'ما زال ملفه محجوبًا حتى اكتشاف أدلة سردية مرتبطة به.',
        relatedMemories: getRelatedMemoryTitles(
          state,
          ['kinja', 'kenja', 'architect'],
        ),
        relatedScenes: getRelatedSceneLabels(
          state,
          ['kinja', 'kenja', 'architect'],
        ),
        discoveredFiles: getRelatedFileLabels(
          state,
          ['kinja', 'kenja', 'architect'],
        ),
        accessLevel: discoverCharacter(state, ['kinja', 'kenja', 'architect'])
          ? 'full'
          : 'unknown',
        moments: momentsFor('kenja'),
      },
      {
        id: 'character_lina',
        name: 'Lina',
        displayName: discoverCharacter(state, ['lina'])
          ? 'Lina'
          : 'Unknown',
        codename: 'MOTHER',
        role: 'الأم',
        relationship: 'ذكرى بعيدة ترتبط بالحنان والاستقرار.',
        unlocked: discoverCharacter(state, ['lina']),
        portraitMode: 'locked',
        summary: 'لن تظهر تفاصيلها قبل أن يكتشف اللاعب أثرها في الذاكرة.',
        relatedMemories: getRelatedMemoryTitles(state, ['lina']),
        relatedScenes: getRelatedSceneLabels(state, ['lina']),
        discoveredFiles: getRelatedFileLabels(state, ['lina']),
        ...linaCanonPartialFields,
        accessLevel: linaIsCanonPartial
          ? 'partial'
          : linaLegacyDiscovered
            ? 'full'
            : 'unknown',
        moments: momentsFor('lina'),
      },
      {
        id: 'character_yuki',
        name: 'Yuki',
        displayName: discoverCharacter(state, ['yuki'])
          ? 'Yuki'
          : 'Unknown',
        codename: 'FRIEND',
        role: 'الصديق المقرب لـ Echo',
        relationship: 'رابط إنساني أساسي في ماضي Echo.',
        unlocked: discoverCharacter(state, ['yuki']),
        portraitMode: 'locked',
        summary: 'يبقى ملفه مغلقًا حتى تظهر الذكريات أو المشاهد المرتبطة به.',
        relatedMemories: getRelatedMemoryTitles(state, ['yuki']),
        relatedScenes: getRelatedSceneLabels(state, ['yuki']),
        discoveredFiles: getRelatedFileLabels(state, ['yuki']),
        accessLevel: discoverCharacter(state, ['yuki']) ? 'full' : 'unknown',
        moments: momentsFor('yuki'),
      },
    ];
  const entries = rawEntries.map((entry): CharacterArchiveEntryReadModel => ({
      ...entry,
      relatedMemories: entry.unlocked ? entry.relatedMemories : [],
      relatedScenes: entry.unlocked ? entry.relatedScenes : [],
      discoveredFiles: entry.unlocked ? entry.discoveredFiles : [],
      summary: entry.unlocked ? entry.summary : 'الملف ما زال مقفلًا.',
      relationship: entry.unlocked ? entry.relationship : 'غير معروف بعد.',
      codename: entry.unlocked ? entry.codename : 'LOCKED',
      displayName: entry.unlocked ? entry.displayName : 'Unknown',
      role: entry.unlocked ? entry.role : 'مجهول',
      portraitMode: entry.unlocked ? entry.portraitMode : 'locked',
  }));
  return { entries };
}

export interface ProgressEventReadModel {
  id: string;
  label: string;
  meta: string;
}

export interface AchievementsReadModel {
  items: AchievementView[];
  unlockedCount: number;
  totalCount: number;
}

export function createAchievementsReadModel(
  state: GameState,
): AchievementsReadModel {
  const items = createAchievementViews(
    state.progressionState.achievements,
  );
  return {
    items,
    unlockedCount: items.filter((achievement) => achievement.unlocked).length,
    totalCount: items.length,
  };
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
  storyPuzzleSnapshot: StoryPuzzleSnapshot | null = null,
): ProgressScreenReadModel {
  const achievements = createAchievementsReadModel(state);
  const puzzleProgress = createStoryPuzzleProgress(storyPuzzleSnapshot);
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
    achievementsUnlocked: achievements.unlockedCount,
    achievementsTotal: achievements.totalCount,
    endingsSeen: state.seenEndings.length,
    endingsEligible: state.narrative.endingEligibility.filter(
      (ending) => ending.eligible,
    ).length,
    endingsTotal: state.narrative.endingEligibility.length,
    decisions: state.narrative.decisionHistory.length,
    memoriesUnlocked: (
      state.narrative.unlockedMemoryIds.length
      + state.unlockedManhwaPageIds.length
    ),
    fragmentsUnlocked: state.collectedMemoryFragments.length,
    resolvedPuzzles: puzzleProgress.resolved,
    totalPuzzles: puzzleProgress.total,
    recentEvents: [...decisions, ...timelineEvents].slice(0, 6),
  };
}
