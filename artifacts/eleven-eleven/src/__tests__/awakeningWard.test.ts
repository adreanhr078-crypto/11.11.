import assert from 'node:assert/strict';
import {
  readFileSync,
  statSync,
} from 'node:fs';
import { describe, it } from 'node:test';
import {
  AWAKENING_WARD_ENABLED,
  LEGACY_PUZZLE_ARCHIVE_ENABLED,
  OPENING_ROOM_3D_ENABLED,
  resolveFeatureGatedScreen,
} from '../app/config/featureFlags';
import { STORY_PUZZLE_COUNTS } from '../content/puzzles/storyPuzzleCatalog';
import {
  AWAKENING_WARD_EXIT_APPROACH,
  AWAKENING_WARD_INTERACTION_BY_ID,
  AWAKENING_WARD_SPAWN,
} from '../features/awakening-ward/data/awakeningWardMap';
import {
  WARD_ART_FRAMES,
  WARD_ART_KEYS,
  WARD_ART_PATHS,
  WARD_ITEM_FRAMES,
  WARD_ITEM_VISUALS,
  WARD_PLAYER_DIRECTION_ROWS,
  WARD_PROP_VISUALS,
  WARD_WALL_VISUALS,
  resolveWardPlayerFacingRow,
  resolveWardPlayerFrame,
  resolveWardPlayerVisual,
  resolveWardWallDepth,
  resolveWardWallRenderDepth,
} from '../features/awakening-ward/data/awakeningWardArt';
import {
  AWAKENING_WARD_PUZZLE_REGISTRY,
} from '../features/awakening-ward/data/roomPuzzleRegistry';
import {
  applyAwakeningWardProgress,
  createInitialAwakeningWardState,
  hasWardItem,
  normalizeAwakeningWardState,
} from '../features/awakening-ward/domain/awakeningWardState';
import {
  findWardPath,
  isExitCorridorClear,
  isWardPositionWalkable,
  moveWardPlayer,
  resolveWardCameraZoom,
  WARD_PLAYER_RADIUS,
} from '../features/awakening-ward/domain/wardNavigation';
import {
  CIRCUIT_TILES,
  INITIAL_CIRCUIT_ROTATIONS,
  isCircuitSolved,
} from '../features/awakening-ward/puzzles/circuitPuzzle';
import {
  WardSceneBridge,
  type WardSceneApi,
} from '../features/awakening-ward/runtime/wardSceneBridge';
import {
  GAME_SAVE_VERSION,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import { buildInitialState } from '../stores/gameStoreHelpers';

function advanceToDrawer() {
  let state = createInitialAwakeningWardState();
  state = applyAwakeningWardProgress(state, 'inspect-clock');
  state = applyAwakeningWardProgress(state, 'restore-power');
  state = applyAwakeningWardProgress(state, 'activate-monitor');
  state = applyAwakeningWardProgress(state, 'record-mirror-clue');
  state = applyAwakeningWardProgress(state, 'open-hidden-drawer');
  return state;
}

describe('Awakening Ward progression authority', () => {
  it('does not activate the monitor before power is restored', () => {
    const initial = createInitialAwakeningWardState();
    const attempted = applyAwakeningWardProgress(
      initial,
      'activate-monitor',
    );
    assert.equal(attempted.puzzleFlags.monitor_activated, false);
  });

  it('does not open the drawer before the mirror clue is recorded', () => {
    let state = createInitialAwakeningWardState();
    state = applyAwakeningWardProgress(state, 'inspect-clock');
    state = applyAwakeningWardProgress(state, 'restore-power');
    state = applyAwakeningWardProgress(state, 'activate-monitor');
    state = applyAwakeningWardProgress(state, 'open-hidden-drawer');
    assert.equal(state.puzzleFlags.hidden_drawer_opened, false);
  });

  it('requires opening the drawer and then taking the keycard explicitly', () => {
    const initial = createInitialAwakeningWardState();
    const premature = applyAwakeningWardProgress(initial, 'take-keycard');
    assert.equal(hasWardItem(premature, 'keycard_a07'), false);

    const drawerOpen = advanceToDrawer();
    assert.equal(drawerOpen.puzzleFlags.hidden_drawer_opened, true);
    assert.equal(hasWardItem(drawerOpen, 'keycard_a07'), false);

    const collected = applyAwakeningWardProgress(drawerOpen, 'take-keycard');
    assert.equal(hasWardItem(collected, 'keycard_a07'), true);
  });

  it('does not unlock A-07 without the keycard', () => {
    const drawerOpen = advanceToDrawer();
    const attempted = applyAwakeningWardProgress(drawerOpen, 'unlock-exit');
    assert.equal(attempted.puzzleFlags.awakening_exit_unlocked, false);
    assert.equal(attempted.awakeningWardCompleted, false);
  });

  it('repairs inconsistent client saves instead of trusting door flags', () => {
    const normalized = normalizeAwakeningWardState({
      puzzleFlags: {
        clock_1111_inspected: false,
        power_restored: false,
        monitor_activated: false,
        mirror_clue_discovered: false,
        hidden_drawer_opened: false,
        awakening_exit_unlocked: true,
      },
      inventory: [{ id: 'keycard_a07', quantity: 1 }],
      awakeningWardCompleted: true,
    });
    assert.equal(normalized.puzzleFlags.awakening_exit_unlocked, false);
    assert.equal(normalized.awakeningWardCompleted, false);
    assert.equal(hasWardItem(normalized, 'keycard_a07'), false);
  });

  it('survives the same serialization path used by local and cloud saves', () => {
    const base = buildInitialState();
    let ward = advanceToDrawer();
    ward = applyAwakeningWardProgress(ward, 'take-keycard');
    const payload = partializeGameState({ ...base, awakeningWard: ward });
    const refreshed = migrateGameState(
      JSON.parse(JSON.stringify(payload)),
      GAME_SAVE_VERSION,
    );
    assert.equal(refreshed.awakeningWard?.puzzleFlags.hidden_drawer_opened, true);
    assert.equal(
      refreshed.awakeningWard?.inventory.some(
        (entry) => entry.id === 'keycard_a07',
      ),
      true,
    );
  });
});

describe('Awakening Ward navigation and mobile runtime', () => {
  it('spawns in walkable space and finds a route from capsule to A-07', () => {
    assert.equal(isWardPositionWalkable(AWAKENING_WARD_SPAWN), true);
    assert.equal(isWardPositionWalkable(AWAKENING_WARD_EXIT_APPROACH), true);
    const path = findWardPath();
    assert.ok(path && path.length > 10);
  });

  it('keeps the mirror and storage outside the clear exit corridor', () => {
    assert.equal(isExitCorridorClear(), true);
  });

  it('prevents movement outside the map and into obstacles', () => {
    const outsideAttempt = moveWardPlayer(
      AWAKENING_WARD_SPAWN,
      { x: -80, y: -80 },
      1,
    );
    assert.equal(isWardPositionWalkable(outsideAttempt), true);
    assert.notDeepEqual(outsideAttempt, { x: -72.8, y: -65.2 });
  });

  it('keeps the full player silhouette clear of visible wall edges', () => {
    const wallPenetration = {
      x: 6,
      y: 1.5 + WARD_PLAYER_RADIUS - 0.02,
    };
    const safeWallDistance = {
      x: 6,
      y: 1.5 + WARD_PLAYER_RADIUS + 0.05,
    };
    assert.equal(isWardPositionWalkable(wallPenetration), false);
    assert.equal(isWardPositionWalkable(safeWallDistance), true);

    const start = { x: 6, y: 2.8 };
    assert.deepEqual(moveWardPlayer(start, { x: 0, y: -5 }, 1), start);
  });

  it('forwards independent touch movement, run, and interaction commands', () => {
    const events: string[] = [];
    let movement = { x: 0, y: 0 };
    const api: WardSceneApi = {
      setTouchMovement: (x, y) => { movement = { x, y }; },
      setTouchRunning: (running) => events.push(`run:${running}`),
      requestInteraction: () => events.push('interact'),
      setLocked: () => {},
      setPaused: () => {},
      setProgress: () => {},
      setQuality: () => {},
      destroy: () => {},
    };
    const bridge = new WardSceneBridge({
      onNearbyInteraction: () => {},
      onInteractionRequested: () => {},
      onRuntimeSnapshot: () => {},
      onMetrics: () => {},
      onKeyboardActivity: () => {},
    });
    bridge.attach(api);
    events.length = 0;
    bridge.setTouchMovement(0.6, -0.4);
    bridge.setTouchRunning(true);
    bridge.requestInteraction();
    assert.deepEqual(movement, { x: 0.6, y: -0.4 });
    assert.deepEqual(events, ['run:true', 'interact']);
  });

  it('resolves a stable zoom for every target landscape ratio', () => {
    const targets = [
      [1280, 720],
      [1920, 1080],
      [2400, 1080],
      [2340, 1080],
    ] as const;
    for (const [width, height] of targets) {
      const zoom = resolveWardCameraZoom(width, height);
      assert.ok(Number.isFinite(zoom));
      assert.ok(zoom >= 0.78 && zoom <= 1.18);
    }
  });
});

describe('Puzzle registry and preserved prototypes', () => {
  it('uses a real rotatable circuit instead of a one-click completion', () => {
    assert.equal(isCircuitSolved(INITIAL_CIRCUIT_ROTATIONS), false);
    assert.equal(
      isCircuitSolved(CIRCUIT_TILES.map((tile) => tile.solutionRotation)),
      true,
    );
  });

  it('registers only the four room puzzle interfaces for A-01', () => {
    const entries = Object.values(AWAKENING_WARD_PUZZLE_REGISTRY);
    assert.equal(entries.length, 4);
    assert.equal(entries.every((entry) => entry.origin === 'room'), true);
    assert.equal(
      AWAKENING_WARD_INTERACTION_BY_ID.awakening_clock.puzzleId,
      undefined,
    );
  });

  it('routes the active Story Puzzle experience through the puzzle screen', () => {
    assert.equal(STORY_PUZZLE_COUNTS.total, 20);
    assert.equal(LEGACY_PUZZLE_ARCHIVE_ENABLED, true);
    assert.equal(resolveFeatureGatedScreen('puzzles'), 'puzzles');
  });

  it('keeps both room prototypes dormant without deleting their modules', () => {
    assert.equal(OPENING_ROOM_3D_ENABLED, false);
    assert.equal(AWAKENING_WARD_ENABLED, false);
    assert.equal(resolveFeatureGatedScreen('play'), 'puzzles');
    assert.equal(resolveFeatureGatedScreen('awakening-ward'), 'puzzles');
    const source = readFileSync(
      new URL(
        '../features/awakening-ward/AwakeningWardScreen.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    assert.equal(source.includes('GameWorld'), false);
    assert.equal(source.includes('@react-three/fiber'), false);
  });
});

describe('Awakening Ward production art pass', () => {
  it('ships compressed production assets for every visual layer', () => {
    for (const assetPath of Object.values(WARD_ART_PATHS)) {
      const file = new URL(`../../public${assetPath}`, import.meta.url);
      assert.ok(statSync(file).size > 50_000, `${assetPath} is unexpectedly small`);
      assert.ok(statSync(file).size < 400_000, `${assetPath} exceeds the mobile budget`);
    }
  });

  it('keeps eight directional animation rows with integral frame geometry', () => {
    assert.equal(WARD_PLAYER_DIRECTION_ROWS.length, 8);
    assert.equal(WARD_ART_FRAMES.playerWidth, 314);
    assert.equal(WARD_ART_FRAMES.playerHeight, 314);
    assert.equal(WARD_ART_FRAMES.playerWidth * 4, 1256);
    assert.equal(WARD_ART_FRAMES.playerHeight * 4, 1256);
  });

  it('maps screen movement to the correct authored facing direction', () => {
    const inputs = [
      { vector: [0, -1], expected: 0 },
      { vector: [1, -1], expected: 1 },
      { vector: [1, 0], expected: 2 },
      { vector: [1, 1], expected: 3 },
      { vector: [0, 1], expected: 4 },
      { vector: [-1, 1], expected: 5 },
      { vector: [-1, 0], expected: 6 },
      { vector: [-1, -1], expected: 7 },
    ] as const;

    for (const { vector, expected } of inputs) {
      assert.equal(resolveWardPlayerFacingRow(vector[0], vector[1]), expected);
    }
  });

  it('uses full-height atlases and mirrors symmetrical movement poses', () => {
    assert.equal(
      resolveWardPlayerVisual(2).textureKey,
      WARD_ART_KEYS.playerNorthEast,
    );
    assert.equal(resolveWardPlayerVisual(2).flipX, false);
    assert.equal(resolveWardPlayerVisual(6).flipX, true);
    assert.equal(resolveWardPlayerFrame(4, 3), 3);
    assert.equal(resolveWardPlayerFrame(7, 0), 4);
  });

  it('grounds props, pickups, and wall modules on their authored baselines', () => {
    for (const visual of Object.values(WARD_PROP_VISUALS)) {
      assert.ok(visual.originX > 0 && visual.originX < 1);
      assert.ok(visual.originY > 0 && visual.originY < 1);
      assert.equal(visual.offsetY ?? 0, 0);
    }
    assert.equal(WARD_PROP_VISUALS['side-table']?.originY, 0.758);
    assert.equal(
      WARD_ITEM_VISUALS[WARD_ITEM_FRAMES.battery]?.originY,
      0.703,
    );
    assert.equal(WARD_WALL_VISUALS[3]?.originY, 0.713);
  });

  it('keeps front walls visible while placing a nearby player above them', () => {
    const wallDepth = resolveWardWallDepth(220, true);
    assert.equal(wallDepth, 222);
    assert.equal(resolveWardWallDepth(220, false), 134);
    assert.equal(resolveWardWallRenderDepth(wallDepth, 218, false), wallDepth);
    assert.equal(resolveWardWallRenderDepth(wallDepth, 218, true), 217);
    assert.equal(resolveWardWallRenderDepth(wallDepth, 238, true), wallDepth);

    const source = readFileSync(
      new URL(
        '../features/awakening-ward/runtime/AwakeningWardScene.ts',
        import.meta.url,
      ),
      'utf8',
    );
    assert.equal(source.includes('front ? 430'), false);
    assert.equal(source.includes('baseY + Math.sin'), false);
    assert.equal(source.includes('wall.setAlpha'), false);
  });

  it('loads the authored atlases instead of the old floor and wall placeholders', () => {
    const source = readFileSync(
      new URL(
        '../features/awakening-ward/runtime/AwakeningWardScene.ts',
        import.meta.url,
      ),
      'utf8',
    );
    assert.equal(source.includes('ward-floor-placeholder'), false);
    assert.equal(source.includes('ward-wall-placeholder'), false);
    assert.equal(source.includes('createPlayerAnimations'), true);
    assert.equal(source.includes('WARD_ART_KEYS.props'), true);
  });
});
