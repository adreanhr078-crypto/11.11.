import type {
  ChapterDefinition,
  ChapterId,
  DialogueDefinition,
  EndingDefinition,
  MemoryDefinition,
  PuzzleDefinition,
} from '../../domain/content/contracts';

export interface ContentPage<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface ContentPageRequest {
  cursor?: string;
  limit?: number;
}

export interface ContentRepository {
  getChapters(): Promise<readonly ChapterDefinition[]>;
  getPuzzles(
    chapterId: ChapterId,
    request?: ContentPageRequest,
  ): Promise<ContentPage<PuzzleDefinition>>;
  getMemories(
    chapterId: ChapterId,
    request?: ContentPageRequest,
  ): Promise<ContentPage<MemoryDefinition>>;
  getDialogues(
    chapterId: ChapterId,
    request?: ContentPageRequest,
  ): Promise<ContentPage<DialogueDefinition>>;
  getEndings(
    request?: ContentPageRequest,
  ): Promise<ContentPage<EndingDefinition>>;
}
