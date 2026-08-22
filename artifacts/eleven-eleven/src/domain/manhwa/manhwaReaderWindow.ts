export interface ManhwaReaderWindowPage {
  id: string;
  globalPageNumber: number;
}

export interface ManhwaReaderWindow<TPage extends ManhwaReaderWindowPage> {
  pages: readonly TPage[];
  firstUnreadPage: TPage | undefined;
}

/**
 * Keeps direct archive navigation sequential without treating a stale local
 * view projection as stronger authority than a completed server Story Puzzle.
 * A completion receipt proves that its source page was available and read by
 * the authoritative path, even if the local page-view cache has not caught up
 * after a refresh or handoff.
 */
export function deriveManhwaReaderWindow<TPage extends ManhwaReaderWindowPage>(
  accessiblePages: readonly TPage[],
  viewedPageIds: ReadonlySet<string>,
  verifiedStoryEvidenceThrough: number,
): ManhwaReaderWindow<TPage> {
  const firstUnreadPage = accessiblePages.find((page) => (
    page.globalPageNumber > verifiedStoryEvidenceThrough
    && !viewedPageIds.has(page.id)
  ));
  const maxSequentialPage = firstUnreadPage?.globalPageNumber
    ?? accessiblePages.at(-1)?.globalPageNumber
    ?? 0;

  return {
    firstUnreadPage,
    pages: accessiblePages.filter(
      (page) => page.globalPageNumber <= maxSequentialPage,
    ),
  };
}
