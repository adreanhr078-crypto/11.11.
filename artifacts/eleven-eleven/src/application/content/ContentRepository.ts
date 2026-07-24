import type {
  ChapterDefinition,
  ChapterId,
  DialogueDefinition,
  EndingDefinition,
  MemoryDefinition,
  PuzzleDefinition,
} from '../../domain/content/contracts';
import type {
  CinematicAssetDefinition,
  CinematicEpisodeDefinition,
} from '../../domain/cinematics/contracts';

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
  getCinematicEpisodes(
    chapterId: ChapterId,
    request?: ContentPageRequest,
  ): Promise<ContentPage<CinematicEpisodeDefinition>>;
  getCinematicAssets(
    assetIds: readonly string[],
  ): Promise<readonly CinematicAssetDefinition[]>;
}
