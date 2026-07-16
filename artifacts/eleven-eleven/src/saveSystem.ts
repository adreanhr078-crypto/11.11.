/**
 * saveSystem.ts — Persistent save/load system for 11.11
 *
 * Strategy:
 *   1. localStorage is the PRIMARY store (instant, always available).
 *   2. Server sync is SECONDARY (best-effort, may fail on static hosting).
 *   3. On load: read localStorage first → then try server → merge (union).
 *
 * All data is versioned. A migration pipeline upgrades old schemas so
 * returning players never lose progress.
 */

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

const SAVE_VERSION = 2;
const SAVE_KEY = "eleven_full_save";

export interface SaveData {
  /** Schema version — incremented on breaking changes. */
  version: number;
  /** Timestamp of last successful save (ms since epoch). */
  savedAt: number;
  /** Puzzle IDs the player has solved. */
  solvedPuzzles: string[];
  /** Achievement IDs unlocked. */
  unlockedAchievements: string[];
  /** Game state meters. */
  gameState: {
    fear: number;
    curiosity: number;
    trustAI: number;
    level: number;
  };
  /** Chat history (last N messages). */
  chatHistory: { role: "user" | "assistant"; content: string }[];
  /** User wish text. */
  wish: string | null;
  /** Discovered secret room codes. */
  discoveredRooms: string[];
  /** Geo city from entry screen. */
  geoCity: string | null;
  /** Whether the entry consent screen was completed. */
  consentDone: boolean;
  /** Whether the language was chosen. */
  lang: "ar" | "en" | null;
  /** User ID. */
  uid: string;
  /** Psych analysis text (if generated). */
  psychAnalysis: string | null;
  /** Notification schedule. */
  pushSchedule: { s11: boolean; s23: boolean };
}

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    solvedPuzzles: [],
    unlockedAchievements: [],
    gameState: { fear: 0, curiosity: 0, trustAI: 0, level: 1 },
    chatHistory: [],
    wish: null,
    discoveredRooms: [],
    geoCity: null,
    consentDone: false,
    lang: null,
    uid: "",
    psychAnalysis: null,
    pushSchedule: { s11: true, s23: true },
  };
}

// ─── MIGRATION ───────────────────────────────────────────────────────────────

/**
 * Upgrade a save from any older version to the current SAVE_VERSION.
 * Runs sequentially — each step handles one version bump.
 *
 * SAFETY: Never deletes existing fields. Only adds new ones with defaults.
 * Old players keep all their progress; new fields just get defaults.
 */
function migrate(raw: Record<string, unknown>): SaveData {
  let save = { ...raw } as Record<string, unknown>;

  // v0 → v1: Legacy saves that had no `version` field at all
  if (save.version === undefined) {
    save.version = 1;
  }

  // v1 → v2: Added psychAnalysis, pushSchedule, consentDone
  if ((save.version as number) < 2) {
    if (save.psychAnalysis === undefined) save.psychAnalysis = null;
    if (save.pushSchedule === undefined) save.pushSchedule = { s11: true, s23: true };
    if (save.consentDone === undefined) save.consentDone = false;
    save.version = 2;
  }

  // Future migrations go here:
  // if ((save.version as number) < 3) { ... save.version = 3; }

  // Merge with defaults to guarantee all fields exist
  const merged = { ...defaultSave(), ...save } as SaveData;
  merged.version = SAVE_VERSION;
  merged.savedAt = Date.now();
  return merged;
}

// ─── LOCAL STORAGE ───────────────────────────────────────────────────────────

export function loadFromLocal(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function saveToLocal(data: SaveData): void {
  try {
    data.savedAt = Date.now();
    data.version = SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded or private mode — silent fail */
  }
}

// ─── SERVER SYNC ─────────────────────────────────────────────────────────────

/**
 * Push solved puzzles and achievements to the server.
 * Silently fails — the local save is always authoritative.
 */
export async function syncToServer(data: SaveData): Promise<void> {
  if (!data.uid || data.uid.length < 4) return;
  try {
    await fetch("/api/arg/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: data.uid,
        solvedPuzzles: data.solvedPuzzles,
        unlockedAchievements: data.unlockedAchievements,
        gameState: data.gameState,
      }),
    });
  } catch { /* server unreachable — local save is fine */ }
}

/**
 * Pull server state (if any) and merge with local.
 * Returns the merged result. Never deletes local data.
 */
export async function pullFromServer(uid: string, local: SaveData): Promise<SaveData> {
  try {
    const [argRes, profileRes] = await Promise.all([
      fetch(`/api/arg?uid=${encodeURIComponent(uid)}`),
      fetch(`/api/user/profile?uid=${encodeURIComponent(uid)}`),
    ]);

    let serverSolved: string[] = [];
    let serverAchievements: string[] = [];
    let serverGameState = local.gameState;

    if (argRes.ok) {
      const argData = await argRes.json() as {
        solvedPuzzles?: string[];
        unlockedAchievements?: string[];
      };
      serverSolved = argData.solvedPuzzles ?? [];
      serverAchievements = argData.unlockedAchievements ?? [];
    }

    if (profileRes.ok) {
      const pData = await profileRes.json() as {
        gameState?: { fear: number; curiosity: number; trustAI: number; level: number } | null;
      };
      if (pData.gameState) serverGameState = pData.gameState;
    }

    // Merge: union of solved puzzles and achievements (never lose progress)
    const mergedSolved = Array.from(new Set([...local.solvedPuzzles, ...serverSolved]));
    const mergedAch = Array.from(new Set([...local.unlockedAchievements, ...serverAchievements]));

    // Take the higher game state values
    const gs = {
      fear: Math.max(local.gameState.fear, serverGameState.fear),
      curiosity: Math.max(local.gameState.curiosity, serverGameState.curiosity),
      trustAI: Math.max(local.gameState.trustAI, serverGameState.trustAI),
      level: Math.max(local.gameState.level, serverGameState.level),
    };

    return {
      ...local,
      solvedPuzzles: mergedSolved,
      unlockedAchievements: mergedAch,
      gameState: gs,
    };
  } catch {
    return local;
  }
}

// ─── HIGH-LEVEL API ──────────────────────────────────────────────────────────

/**
 * Full load: localStorage → server merge → return.
 * Call once on app init.
 */
export async function loadSave(uid: string): Promise<SaveData> {
  const local = loadFromLocal() ?? defaultSave();

  if (uid && uid.length > 4) {
    const merged = await pullFromServer(uid, local);
    saveToLocal(merged); // persist merged result locally
    return merged;
  }

  return local;
}

/**
 * Full save: write to localStorage → fire-and-forget server sync.
 * Call after every meaningful state change (puzzle solve, achievement, etc.)
 */
export function persistSave(data: SaveData): void {
  saveToLocal(data);
  // Server sync is async and non-blocking
  syncToServer(data);
}

// ─── CONVENIENCE HELPERS ─────────────────────────────────────────────────────

/** Check if a puzzle is solved in the save. */
export function isPuzzleSolved(save: SaveData, puzzleId: string): boolean {
  return save.solvedPuzzles.includes(puzzleId);
}

/** Mark a puzzle as solved and persist immediately. */
export function markPuzzleSolved(save: SaveData, puzzleId: string): SaveData {
  if (save.solvedPuzzles.includes(puzzleId)) return save;
  const next = {
    ...save,
    solvedPuzzles: [...save.solvedPuzzles, puzzleId],
    savedAt: Date.now(),
  };
  persistSave(next);
  return next;
}

/** Unlock an achievement and persist immediately. */
export function unlockAchievement(save: SaveData, achievementId: string): SaveData {
  if (save.unlockedAchievements.includes(achievementId)) return save;
  const next = {
    ...save,
    unlockedAchievements: [...save.unlockedAchievements, achievementId],
    savedAt: Date.now(),
  };
  persistSave(next);
  return next;
}

/** Update game state meters and persist. */
export function updateGameState(
  save: SaveData,
  patch: Partial<SaveData["gameState"]>
): SaveData {
  const next = {
    ...save,
    gameState: { ...save.gameState, ...patch },
    savedAt: Date.now(),
  };
  persistSave(next);
  return next;
}

/** Update a top-level field and persist. */
export function updateSaveField<K extends keyof SaveData>(
  save: SaveData,
  key: K,
  value: SaveData[K]
): SaveData {
  const next = { ...save, [key]: value, savedAt: Date.now() };
  persistSave(next);
  return next;
}