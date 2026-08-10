import {
  CHAPTER_01_MEMORY_SHARDS,
  CHAPTER_01_PUZZLES,
} from '../../content/puzzles/chapter01Campaign';
import { FINAL_MANHWA_PAGES } from '../../content/manhwa/finalManhwa';
import type {
  CampaignInteractionStage,
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
  ManhwaMemoryPageDefinition,
} from './campaignContracts';

export type CampaignPuzzleStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed';

export type CampaignPageStatus =
  | 'locked'
  | 'collecting'
  | 'restored'
  | 'questioned';

export interface CampaignRuntimeSnapshot {
  completedPuzzleIds: readonly string[];
  collectedShardIds: readonly string[];
  progressByPuzzleId?: Readonly<
    Record<string, readonly CampaignPuzzleProgress[] | undefined>
  >;
}

export interface CampaignPageShardProgress {
  collected: number;
  total: number;
  remaining: number;
  complete: boolean;
  collectedShardIds: string[];
}

export interface CampaignAvailability {
  currentPuzzleId: string | null;
  availablePuzzleIds: string[];
  completedPuzzleCount: number;
  puzzleStatuses: Record<string, CampaignPuzzleStatus>;
  pageStatuses: Record<string, CampaignPageStatus>;
}

const REGISTERED_CAMPAIGN_SHARD_IDS = new Set(
  CHAPTER_01_MEMORY_SHARDS.map((shard) => shard.id),
);

function arraysEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length
    && left.every((value, index) => value === right[index])
  );
}

function selectionsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return arraysEqual(
    [...left].sort((first, second) => first.localeCompare(second)),
    [...right].sort((first, second) => first.localeCompare(second)),
  );
}

function matchesEqual(
  submitted: Readonly<Record<string, string>>,
  solution: Readonly<Record<string, string>>,
): boolean {
  const submittedKeys = Object.keys(submitted).sort();
  const solutionKeys = Object.keys(solution).sort();
  return (
    arraysEqual(submittedKeys, solutionKeys)
    && solutionKeys.every((key) => submitted[key] === solution[key])
  );
}

/**
 * Validates one interactive stage without mutating campaign or player state.
 * Ordered modes require an exact order; multi-select stages compare selections
 * independent of order, and match stages require the exact source/target map.
 */
export function isCampaignStageCorrect(
  stage: CampaignInteractionStage,
  values: readonly string[],
  matches: Readonly<Record<string, string>>,
): boolean {
  switch (stage.mode) {
    case 'multi':
      return selectionsEqual(values, stage.solution);
    case 'match':
      return matchesEqual(matches, stage.solution);
    case 'sequence':
    case 'single':
    case 'path':
    case 'rings':
      return arraysEqual(values, stage.solution);
    default:
      return assertNever(stage);
  }
}

/**
 * A puzzle submission is valid only when every authored stage appears exactly
 * once at its declared index and every individual stage solution is correct.
 */
export function isCampaignPuzzleSubmissionCorrect(
  definition: CampaignPuzzleDefinition,
  submissions: readonly CampaignPuzzleProgress[],
): boolean {
  if (submissions.length !== definition.stages.length) return false;

  const submissionsByStage = new Map<number, CampaignPuzzleProgress>();
  for (const submission of submissions) {
    if (
      !Number.isInteger(submission.stageIndex)
      || submission.stageIndex < 0
      || submission.stageIndex >= definition.stages.length
      || submissionsByStage.has(submission.stageIndex)
    ) {
      return false;
    }
    submissionsByStage.set(submission.stageIndex, submission);
  }

  return definition.stages.every((stage, stageIndex) => {
    const submission = submissionsByStage.get(stageIndex);
    return Boolean(
      submission
      && isCampaignStageCorrect(
        stage,
        submission.values,
        submission.matches,
      ),
    );
  });
}

export function getCampaignPageShardProgress(
  page: ManhwaMemoryPageDefinition,
  collectedShardIds: readonly string[],
  registeredShardIds: ReadonlySet<string> = REGISTERED_CAMPAIGN_SHARD_IDS,
): CampaignPageShardProgress {
  const collected = new Set(collectedShardIds);
  const required = [...new Set(page.requiredShardIds)];
  const collectedForPage = required.filter((shardId) => (
    registeredShardIds.has(shardId) && collected.has(shardId)
  ));
  const total = required.length;

  return {
    collected: collectedForPage.length,
    total,
    remaining: Math.max(0, total - collectedForPage.length),
    complete: total === 0 || collectedForPage.length === total,
    collectedShardIds: collectedForPage,
  };
}

function getCampaignPageStatusInternal(
  page: ManhwaMemoryPageDefinition,
  collectedShardIds: readonly string[],
  pages: readonly ManhwaMemoryPageDefinition[],
  visitedPageIds: ReadonlySet<string>,
  registeredShardIds: ReadonlySet<string>,
): CampaignPageStatus {
  if (visitedPageIds.has(page.id)) return 'locked';

  // A PDF page is catalogued before its future puzzles exist. It must remain
  // truly locked (rather than "collecting") until at least one real shard
  // reward for that page is registered. Pages with no shard requirements
  // (e.g., a free first page) are instantly complete.
  if (page.requiredShardIds.length > 0 && !page.requiredShardIds.some((id) => registeredShardIds.has(id))) {
    return 'locked';
  }

  if (page.prerequisitePageId) {
    const prerequisite = pages.find((candidate) => (
      candidate.id === page.prerequisitePageId
    ));
    if (!prerequisite) return 'locked';

    const nextVisited = new Set(visitedPageIds);
    nextVisited.add(page.id);
    const prerequisiteStatus = getCampaignPageStatusInternal(
      prerequisite,
      collectedShardIds,
      pages,
      nextVisited,
      registeredShardIds,
    );
    if (
      prerequisiteStatus !== 'restored'
      && prerequisiteStatus !== 'questioned'
    ) {
      return 'locked';
    }
  }

  const progress = getCampaignPageShardProgress(
    page,
    collectedShardIds,
    registeredShardIds,
  );
  return progress.complete ? page.restoredStatus : 'collecting';
}

export function getCampaignPageStatus(
  page: ManhwaMemoryPageDefinition,
  collectedShardIds: readonly string[],
  pages: readonly ManhwaMemoryPageDefinition[] = FINAL_MANHWA_PAGES,
  registeredShardIds: ReadonlySet<string> = REGISTERED_CAMPAIGN_SHARD_IDS,
): CampaignPageStatus {
  return getCampaignPageStatusInternal(
    page,
    collectedShardIds,
    pages,
    new Set(),
    registeredShardIds,
  );
}

function prerequisiteIsComplete(
  prerequisite: string,
  completedPuzzleIds: ReadonlySet<string>,
  definitions: readonly CampaignPuzzleDefinition[],
): boolean {
  if (completedPuzzleIds.has(prerequisite)) return true;

  const prerequisiteOrder = Number(prerequisite);
  if (!Number.isSafeInteger(prerequisiteOrder)) return false;
  const prerequisiteDefinition = definitions.find((definition) => (
    definition.order === prerequisiteOrder
  ));
  return Boolean(
    prerequisiteDefinition
    && completedPuzzleIds.has(prerequisiteDefinition.id),
  );
}

export function getCampaignPuzzleStatus(
  definition: CampaignPuzzleDefinition,
  snapshot: CampaignRuntimeSnapshot,
  definitions: readonly CampaignPuzzleDefinition[] = CHAPTER_01_PUZZLES,
  pages: readonly ManhwaMemoryPageDefinition[] = FINAL_MANHWA_PAGES,
): CampaignPuzzleStatus {
  const completedPuzzleIds = new Set(snapshot.completedPuzzleIds);
  if (completedPuzzleIds.has(definition.id)) return 'completed';

  if (!definition.prerequisites.every((prerequisite) => (
    prerequisiteIsComplete(
      prerequisite,
      completedPuzzleIds,
      definitions,
    )
  ))) {
    return 'locked';
  }

  const targetPage = pages.find((page) => page.id === definition.targetPageId);
  if (!targetPage) return 'locked';
  if (targetPage.prerequisitePageId) {
    const prerequisitePage = pages.find((page) => (
      page.id === targetPage.prerequisitePageId
    ));
    if (!prerequisitePage) return 'locked';
    const pageStatus = getCampaignPageStatus(
      prerequisitePage,
      snapshot.collectedShardIds,
      pages,
    );
    if (pageStatus !== 'restored' && pageStatus !== 'questioned') {
      return 'locked';
    }
  }

  return (snapshot.progressByPuzzleId?.[definition.id]?.length ?? 0) > 0
    ? 'in_progress'
    : 'available';
}

export function deriveCampaignAvailability(
  snapshot: CampaignRuntimeSnapshot,
  definitions: readonly CampaignPuzzleDefinition[] = CHAPTER_01_PUZZLES,
  pages: readonly ManhwaMemoryPageDefinition[] = FINAL_MANHWA_PAGES,
): CampaignAvailability {
  const orderedDefinitions = [...definitions].sort(
    (left, right) => left.order - right.order,
  );
  const puzzleStatuses = Object.fromEntries(
    orderedDefinitions.map((definition) => [
      definition.id,
      getCampaignPuzzleStatus(definition, snapshot, definitions, pages),
    ]),
  ) as Record<string, CampaignPuzzleStatus>;
  const availablePuzzleIds = orderedDefinitions
    .filter((definition) => {
      const status = puzzleStatuses[definition.id];
      return status === 'available' || status === 'in_progress';
    })
    .map((definition) => definition.id);
  const currentPuzzleId = (
    orderedDefinitions.find((definition) => (
      puzzleStatuses[definition.id] === 'in_progress'
    ))
    ?? orderedDefinitions.find((definition) => (
      puzzleStatuses[definition.id] === 'available'
    ))
  )?.id ?? null;
  const pageStatuses = Object.fromEntries(pages.map((page) => [
    page.id,
    getCampaignPageStatus(page, snapshot.collectedShardIds, pages),
  ])) as Record<string, CampaignPageStatus>;

  return {
    currentPuzzleId,
    availablePuzzleIds,
    completedPuzzleCount: orderedDefinitions.filter((definition) => (
      puzzleStatuses[definition.id] === 'completed'
    )).length,
    puzzleStatuses,
    pageStatuses,
  };
}

export const deriveCurrentAvailability = deriveCampaignAvailability;

export function getCurrentAvailablePuzzle(
  snapshot: CampaignRuntimeSnapshot,
  definitions: readonly CampaignPuzzleDefinition[] = CHAPTER_01_PUZZLES,
  pages: readonly ManhwaMemoryPageDefinition[] = FINAL_MANHWA_PAGES,
): CampaignPuzzleDefinition | null {
  const currentPuzzleId = deriveCampaignAvailability(
    snapshot,
    definitions,
    pages,
  ).currentPuzzleId;
  return definitions.find(({ id }) => id === currentPuzzleId) ?? null;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported campaign stage: ${JSON.stringify(value)}`);
}
