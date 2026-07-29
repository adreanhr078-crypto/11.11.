export interface CanonLocalizedText {
  ar: string;
  en: string;
}

export type CanonChapterId =
  | 'chapter_1'
  | 'chapter_2'
  | 'chapter_3'
  | 'chapter_4'
  | 'chapter_5'
  | 'chapter_6'
  | 'chapter_7';

export type CanonCharacterId = 'echo' | 'yuki' | 'kenja' | 'lina';

export type CanonChapterPublicationStatus =
  | 'runtime-published'
  | 'authored-internal'
  | 'unpublished';

export interface CanonChapter {
  id: CanonChapterId;
  order: number;
  title: CanonLocalizedText;
  publicationStatus: CanonChapterPublicationStatus;
}

export interface CanonCharacter {
  id: CanonCharacterId;
  name: CanonLocalizedText;
  role: CanonLocalizedText;
  publicBio: CanonLocalizedText;
}

export interface CanonRegistry {
  canonVersion: string;
  storyStatus: 'ongoing';
  runtimePublishedChapterIds: readonly CanonChapterId[];
  authoredInternalChapterIds: readonly CanonChapterId[];
  chapters: readonly CanonChapter[];
  publicCharacters: readonly CanonCharacter[];
}
