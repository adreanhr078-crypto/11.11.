export type ChapterId = `chapter_${number}`;
export type PuzzleId = `puzzle_${string}`;
export type MemoryId = `memory_${string}`;
export type DialogueId = `dialogue_${string}`;
export type EndingId = `ending_${string}`;
export type SceneId = `scene_${string}`;
export type MemoryFragmentId = `fragment_${string}`;

export interface LocalizedText {
  ar: string;
  en: string;
}

export type EchoStat =
  | 'humanity'
  | 'trust'
  | 'fear'
  | 'anger'
  | 'sadness'
  | 'corruption'
  | 'memoriesRecovered';

export type ContentCondition =
  | { kind: 'all'; conditions: ContentCondition[] }
  | { kind: 'any'; conditions: ContentCondition[] }
  | { kind: 'not'; condition: ContentCondition }
  | { kind: 'statAtLeast'; stat: EchoStat; value: number }
  | { kind: 'statAtMost'; stat: EchoStat; value: number }
  | { kind: 'puzzleSolved'; puzzleId: PuzzleId }
  | { kind: 'memoryCollected'; memoryId: MemoryId }
  | { kind: 'memoryFragmentUnlocked'; fragmentId: MemoryFragmentId }
  | { kind: 'choiceIs'; decisionId: string; choiceId: string }
  | { kind: 'decisionMade'; decisionId: string }
  | { kind: 'flagIs'; flag: string; value: boolean }
  | { kind: 'chapterComplete'; chapterId: ChapterId };

export type ContentEffect =
  | { kind: 'adjustStat'; stat: EchoStat; amount: number }
  | { kind: 'collectMemory'; memoryId: MemoryId }
  | { kind: 'unlockMemoryFragment'; memoryId: MemoryId; fragmentId: MemoryFragmentId }
  | { kind: 'queueScene'; sceneId: SceneId }
  | { kind: 'setFlag'; flag: string; value: boolean }
  | { kind: 'unlockPuzzle'; puzzleId: PuzzleId }
  | { kind: 'recordChoice'; decisionId: string; choiceId: string }
  | { kind: 'awardCurrency'; currency: 'coins' | 'crystals'; amount: number };

export interface ChapterDefinition {
  id: ChapterId;
  order: number;
  title: LocalizedText;
  description: LocalizedText;
  glyph: string;
  color: string;
  puzzleRange: readonly [number, number];
}

export interface PuzzleDefinition {
  id: PuzzleId;
  chapterId: ChapterId;
  type: string;
  difficulty: number;
  prompt: LocalizedText;
  acceptedAnswers: string[];
  hints: LocalizedText[];
  storyReveal: LocalizedText;
  prerequisites: ContentCondition[];
  effects: ContentEffect[];
  memoryId?: MemoryId;
  sceneId?: SceneId;
}

export interface MemoryDefinition {
  id: MemoryId;
  chapterId: ChapterId;
  title: LocalizedText;
  description: LocalizedText;
  fragments: MemoryFragmentDefinition[];
  imageAssetId?: string;
  audioAssetId?: string;
  emotionalImpact: Partial<Record<EchoStat, number>>;
  relatedCharacterIds: string[];
  unlockCondition: ContentCondition;
  nextStoryEventId?: string;
}

export interface MemoryFragmentDefinition {
  id: MemoryFragmentId;
  title: LocalizedText;
  text: LocalizedText;
  unlockCondition: ContentCondition;
  emotionalImpact: Partial<Record<EchoStat, number>>;
  order: number;
}

export interface DialogueDefinition {
  id: DialogueId;
  chapterId: ChapterId;
  entryNodeId: string;
  nodes: DialogueNode[];
}

export interface DialogueNode {
  id: string;
  speakerId: string;
  text: LocalizedText;
  conditions: ContentCondition[];
  choices: Array<{
    id: string;
    text: LocalizedText;
    conditions: ContentCondition[];
    effects: ContentEffect[];
    nextNodeId?: string;
  }>;
}

export interface EndingDefinition {
  id: EndingId;
  title: LocalizedText;
  description: LocalizedText;
  conditions: ContentCondition[];
  resultSceneId: SceneId;
}

export interface ContentManifest {
  schemaVersion: number;
  contentVersion: string;
  defaultLocale: string;
  supportedLocales: string[];
  capacity: {
    puzzles: number;
    memories: number;
    chapters: number;
    dialogues: number;
    endings: number;
  };
  collections: {
    chapters: string;
    puzzles: string;
    memories: string;
    dialogues: string;
    endings: string;
  };
}
