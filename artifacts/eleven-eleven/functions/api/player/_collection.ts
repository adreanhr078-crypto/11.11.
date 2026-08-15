import {
  STORY_PUZZLES,
} from '../../../src/content/puzzles/storyPuzzleCatalog';
import {
  MEMORY_SHARD_SETS,
  PHASE5_ACHIEVEMENT_DEFINITIONS,
  PHASE5_ACHIEVEMENT_BY_ID,
  SECRET_SIGNAL_PUZZLE_IDS,
  COSMETIC_CATALOG,
  cosmeticById,
} from '../../../src/domain/collection/collectionDefinitions';
import {
  createCollectionAchievementViews,
  createSystemRecovery,
  type CollectionProgressSignals,
} from '../../../src/domain/collection/collectionProgression';
import type {
  CollectionChapterId,
  CollectionCosmeticView,
  CollectionSnapshot,
  EquippedCosmeticsView,
  MemoryShardSetView,
} from '../../../src/domain/collection/collectionContracts';
import {
  readFirestoreDocument,
  readStringArrayField,
  type FirebaseAccount,
  type PlayerApiEnv,
} from './_shared';
import {
  ensurePlayerProgressionRow,
} from './_progressionRepository';
import {
  PlayerApiError,
} from './_shared';
import type { PlayerDatabase } from './_database';
import { readAuthoritativeFeaturedAchievementIds } from './_profileAuthority';

interface CompletionRow {
  puzzle_id: string;
  classification: 'main' | 'secret';
  perfect_solve: number | string;
}
interface DiscoveryRow { puzzle_id: string; }
interface ShardRow { fragment_id: string; }
interface ReconstructionRow { chapter_id: CollectionChapterId; reconstructed_at: string; }
interface ChapterRewardRow { source_id: string; }
interface CanonRow { event_id: string; }
interface AchievementRow { achievement_id: string; unlocked_at: string; }
interface CosmeticRow { cosmetic_id: string; cosmetic_type: string; }
interface EquippedRow { cosmetic_type: string; cosmetic_id: string; }
interface CountRow { total: number | string | null; }

const COLLECTION_COSMETIC_TYPES = new Set([
  'title', 'frame', 'badge', 'avatar-effect', 'system-border',
]);

function integer(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Error && /unique|constraint/i.test(error.message);
}

function chapterSetViews(
  shardIds: ReadonlySet<string>,
  reconstructed: ReadonlySet<string>,
): MemoryShardSetView[] {
  return MEMORY_SHARD_SETS.map((set) => {
    const collected = set.shardIds.filter((id) => shardIds.has(id)).length;
    const complete = collected === set.shardIds.length;
    return {
      chapterId: set.chapterId,
      order: set.order,
      collected,
      total: set.shardIds.length,
      complete,
      reconstructionAvailable: complete && !reconstructed.has(set.chapterId),
      reconstructed: reconstructed.has(set.chapterId),
      // The current release has no approved standalone memory scene text.
      contentStatus: 'needs-owner-content',
    };
  });
}

function createSignals(input: {
  completedChapterIds: readonly string[];
  completions: readonly CompletionRow[];
  discoveries: ReadonlySet<string>;
  shardIds: ReadonlySet<string>;
  reconstructions: ReadonlySet<string>;
  canonEvents: ReadonlySet<string>;
  unlockedAchievementCount: number;
}): CollectionProgressSignals {
  const main = new Set(
    STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'main').map((puzzle) => puzzle.id),
  );
  const mainCompletions = input.completions.filter((row) => main.has(row.puzzle_id));
  const completedSets = MEMORY_SHARD_SETS.filter((set) => (
    set.shardIds.every((id) => input.shardIds.has(id))
  )).length;
  const linaReached = input.canonEvents.has('manhwa_chapter_04_lina_protocol');
  return {
    completedChapterIds: input.completedChapterIds,
    mainPuzzlesCompleted: mainCompletions.length,
    allPuzzlesCompleted: input.completions.length,
    mainPerfectSolves: mainCompletions.filter((row) => integer(row.perfect_solve) === 1).length,
    allPerfectSolves: input.completions.filter((row) => integer(row.perfect_solve) === 1).length,
    shardsCollected: input.shardIds.size,
    completedChapterShardSets: completedSets,
    reconstructionsCompleted: input.reconstructions.size,
    secretSignalsDiscovered: input.discoveries.size,
    characterMomentsUnlocked: linaReached ? 1 : 0,
    reachedCanonEventIds: input.canonEvents,
    noHintSolves: input.completions.filter((row) => integer(row.perfect_solve) === 1).length,
    canonicalSecretsFound: 0,
    canonicalSecretsKnown: 0,
    archiveDiscovered: linaReached ? 2 : 1,
    archiveKnown: 2,
    unlockedAchievementCount: input.unlockedAchievementCount,
    achievementTotal: PHASE5_ACHIEVEMENT_DEFINITIONS.length,
  };
}

async function readCollectionRows(database: PlayerDatabase, uid: string) {
  const [completions, discoveries, shards, reconstructions, chapters, canon, achievements, cosmetics, equipped, secrets] = await Promise.all([
    database.prepare(`
      SELECT puzzle_id, classification, perfect_solve
      FROM player_story_puzzle_completion_events
      WHERE user_id = ?
    `).bind(uid).all<CompletionRow>(),
    database.prepare(`
      SELECT puzzle_id
      FROM player_story_puzzle_discovery_events
      WHERE user_id = ?
    `).bind(uid).all<DiscoveryRow>(),
    database.prepare(`
      SELECT fragment_id
      FROM player_memory_fragment_events
      WHERE user_id = ? AND fragment_id GLOB 'story_puzzle_shard_*'
    `).bind(uid).all<ShardRow>(),
    database.prepare(`
      SELECT chapter_id, reconstructed_at
      FROM player_memory_reconstruction_events
      WHERE user_id = ?
    `).bind(uid).all<ReconstructionRow>(),
    database.prepare(`
      SELECT source_id
      FROM xp_reward_events
      WHERE user_id = ? AND source_type = 'manhwa'
    `).bind(uid).all<ChapterRewardRow>(),
    database.prepare(`
      SELECT event_id
      FROM player_canon_event_records
      WHERE user_id = ?
    `).bind(uid).all<CanonRow>(),
    database.prepare(`
      SELECT achievement_id, unlocked_at
      FROM player_achievement_unlock_events
      WHERE user_id = ?
    `).bind(uid).all<AchievementRow>(),
    database.prepare(`
      SELECT cosmetic_id, cosmetic_type
      FROM player_cosmetic_ownership
      WHERE user_id = ?
    `).bind(uid).all<CosmeticRow>(),
    database.prepare(`
      SELECT cosmetic_type, cosmetic_id
      FROM player_equipped_cosmetics
      WHERE user_id = ?
    `).bind(uid).all<EquippedRow>(),
    database.prepare(`
      SELECT COUNT(*) AS total
      FROM player_memory_fragment_events
      WHERE user_id = ? AND fragment_id NOT GLOB 'story_puzzle_shard_*'
    `).bind(uid).first<CountRow>(),
  ]);
  return {
    completions: completions.results ?? [],
    discoveries: new Set((discoveries.results ?? []).map((row) => row.puzzle_id)),
    shardIds: new Set((shards.results ?? []).map((row) => row.fragment_id)),
    reconstructions: new Set((reconstructions.results ?? []).map((row) => row.chapter_id)),
    chapters: new Set((chapters.results ?? []).map((row) => row.source_id)),
    canonEvents: new Set((canon.results ?? []).map((row) => row.event_id)),
    achievements: achievements.results ?? [],
    cosmetics: cosmetics.results ?? [],
    equipped: equipped.results ?? [],
    canonicalSecretsFound: integer(secrets?.total),
  };
}

async function reconcileAchievements(
  database: PlayerDatabase,
  uid: string,
  signals: CollectionProgressSignals,
  existing: readonly AchievementRow[],
): Promise<string[]> {
  const before = new Set(existing.map((row) => row.achievement_id));
  const currentById = Object.fromEntries(existing.map((row) => [row.achievement_id, row.unlocked_at]));
  const firstPassRecovery = createSystemRecovery(signals).percent;
  const firstViews = createCollectionAchievementViews(
    PHASE5_ACHIEVEMENT_DEFINITIONS,
    signals,
    currentById,
    firstPassRecovery,
  );
  const eligible = firstViews.filter((view) => view.current >= view.target);
  const now = new Date().toISOString();
  for (const view of eligible) {
    const definition = PHASE5_ACHIEVEMENT_BY_ID[view.id];
    if (!definition) continue;
    try {
      await database.prepare(`
        INSERT OR IGNORE INTO player_achievement_unlock_events (
          user_id, achievement_id, source_event_id, unlocked_at
        ) VALUES (?, ?, ?, ?)
      `).bind(uid, definition.id, `phase5:${definition.id}:v1`, now).run();
      for (const cosmeticId of definition.reward.cosmetics) {
        const cosmetic = cosmeticById(cosmeticId);
        if (!cosmetic) continue;
        await database.prepare(`
          INSERT OR IGNORE INTO player_cosmetic_ownership (
            user_id, cosmetic_id, cosmetic_type, source_achievement_id, unlocked_at
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(uid, cosmetic.id, cosmetic.type, definition.id, now).run();
      }
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
    }
  }
  const after = await database.prepare(`
    SELECT achievement_id, unlocked_at
    FROM player_achievement_unlock_events
    WHERE user_id = ?
  `).bind(uid).all<AchievementRow>();
  return (after.results ?? [])
    .map((row) => row.achievement_id)
    .filter((id) => !before.has(id));
}

function equippedView(rows: readonly EquippedRow[]): EquippedCosmeticsView {
  const byType = new Map(rows.map((row) => [row.cosmetic_type, row.cosmetic_id]));
  return {
    titleId: byType.get('title') ?? null,
    frameId: byType.get('frame') ?? null,
    badgeId: byType.get('badge') ?? null,
    avatarEffectId: byType.get('avatar-effect') ?? null,
    systemBorderId: byType.get('system-border') ?? null,
  };
}

function cosmeticViews(
  ownedRows: readonly CosmeticRow[],
  equipped: EquippedCosmeticsView,
): CollectionCosmeticView[] {
  const owned = new Set(ownedRows.map((row) => row.cosmetic_id));
  return COSMETIC_CATALOG.map((cosmetic) => ({
    ...cosmetic,
    owned: owned.has(cosmetic.id),
    equipped: cosmetic.id === equipped.titleId
      || cosmetic.id === equipped.frameId
      || cosmetic.id === equipped.badgeId
      || cosmetic.id === equipped.avatarEffectId
      || cosmetic.id === equipped.systemBorderId,
  }));
}

export async function readCollectionSnapshot(
  database: PlayerDatabase,
  account: FirebaseAccount,
  idToken: string,
  env: PlayerApiEnv,
): Promise<CollectionSnapshot> {
  await ensurePlayerProgressionRow(database, account);
  const rows = await readCollectionRows(database, account.uid);
  const initialSignals = createSignals({
    completedChapterIds: [...rows.chapters],
    completions: rows.completions,
    discoveries: rows.discoveries,
    shardIds: rows.shardIds,
    reconstructions: rows.reconstructions,
    canonEvents: rows.canonEvents,
    unlockedAchievementCount: rows.achievements.length,
  });
  const newlyUnlockedAchievementIds = await reconcileAchievements(
    database,
    account.uid,
    initialSignals,
    rows.achievements,
  );
  const finalRows = newlyUnlockedAchievementIds.length > 0
    ? await readCollectionRows(database, account.uid)
    : rows;
  const signals = createSignals({
    completedChapterIds: [...finalRows.chapters],
    completions: finalRows.completions,
    discoveries: finalRows.discoveries,
    shardIds: finalRows.shardIds,
    reconstructions: finalRows.reconstructions,
    canonEvents: finalRows.canonEvents,
    unlockedAchievementCount: finalRows.achievements.length,
  });
  const recovery = createSystemRecovery(signals);
  const unlockedById = Object.fromEntries(finalRows.achievements.map((row) => [row.achievement_id, row.unlocked_at]));
  const achievements = createCollectionAchievementViews(
    PHASE5_ACHIEVEMENT_DEFINITIONS,
    signals,
    unlockedById,
    recovery.percent,
  );
  const equipped = equippedView(finalRows.equipped);
  const showcasedAchievementIds = (await readAuthoritativeFeaturedAchievementIds(database, account.uid))
    .filter((id) => achievements.some((achievement) => achievement.id === id && achievement.unlocked))
    .slice(0, 3);
  const memorySets = chapterSetViews(finalRows.shardIds, finalRows.reconstructions);
  const secretSignals = SECRET_SIGNAL_PUZZLE_IDS.map((id) => ({
    id,
    discovered: finalRows.discoveries.has(id),
    completed: finalRows.completions.some((row) => row.puzzle_id === id),
    label: finalRows.discoveries.has(id) ? 'VERIFIED SIGNAL' as const : 'UNKNOWN SIGNAL' as const,
  }));
  return {
    shardIds: [...finalRows.shardIds].sort(),
    shardCount: finalRows.shardIds.size,
    totalShards: 20,
    memorySets,
    reconstructionsCompleted: finalRows.reconstructions.size,
    secretSignals,
    secretsFound: finalRows.canonicalSecretsFound,
    canonicalSecretsKnown: 0,
    archive: {
      discovered: signals.archiveDiscovered,
      known: signals.archiveKnown,
      characterMomentCount: signals.characterMomentsUnlocked,
    },
    achievements,
    cosmetics: cosmeticViews(finalRows.cosmetics, equipped),
    equipped,
    showcasedAchievementIds,
    systemRecovery: recovery,
    newlyUnlockedAchievementIds,
    syncedAt: new Date().toISOString(),
  };
}

export async function reconstructMemory(
  database: PlayerDatabase,
  account: FirebaseAccount,
  idToken: string,
  chapterId: string,
  env: PlayerApiEnv,
): Promise<{ snapshot: CollectionSnapshot; alreadyReconstructed: boolean }> {
  const valid = MEMORY_SHARD_SETS.find((set) => set.chapterId === chapterId);
  if (!valid) throw new PlayerApiError(400, 'invalid_chapter', 'Chapter is not available for reconstruction.');
  const before = await readCollectionSnapshot(database, account, idToken, env);
  const set = before.memorySets.find((candidate) => candidate.chapterId === valid.chapterId)!;
  if (set.reconstructed) return { snapshot: before, alreadyReconstructed: true };
  if (!set.complete) throw new PlayerApiError(409, 'reconstruction_locked', 'All verified chapter shards are required.');
  try {
    await database.prepare(`
      INSERT INTO player_memory_reconstruction_events (user_id, chapter_id, reconstructed_at)
      VALUES (?, ?, ?)
    `).bind(account.uid, valid.chapterId, new Date().toISOString()).run();
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    return { snapshot: await readCollectionSnapshot(database, account, idToken, env), alreadyReconstructed: true };
  }
  return {
    snapshot: await readCollectionSnapshot(database, account, idToken, env),
    alreadyReconstructed: false,
  };
}

export async function equipCosmetic(
  database: PlayerDatabase,
  account: FirebaseAccount,
  idToken: string,
  env: PlayerApiEnv,
  cosmeticId: string,
): Promise<CollectionSnapshot> {
  const cosmetic = cosmeticById(cosmeticId);
  if (!cosmetic || !COLLECTION_COSMETIC_TYPES.has(cosmetic.type)) {
    throw new PlayerApiError(400, 'invalid_cosmetic', 'Cosmetic is not recognized.');
  }
  const owned = await database.prepare(`
    SELECT cosmetic_id FROM player_cosmetic_ownership WHERE user_id = ? AND cosmetic_id = ?
  `).bind(account.uid, cosmetic.id).first<{ cosmetic_id: string }>();
  if (!owned) throw new PlayerApiError(403, 'cosmetic_not_owned', 'Cosmetic has not been unlocked.');
  await database.prepare(`
    INSERT INTO player_equipped_cosmetics (user_id, cosmetic_type, cosmetic_id, equipped_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, cosmetic_type) DO UPDATE SET
      cosmetic_id = excluded.cosmetic_id,
      equipped_at = excluded.equipped_at
  `).bind(account.uid, cosmetic.type, cosmetic.id, new Date().toISOString()).run();
  return readCollectionSnapshot(database, account, idToken, env);
}
