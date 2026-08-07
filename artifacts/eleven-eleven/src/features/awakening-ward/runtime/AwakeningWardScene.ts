import Phaser from 'phaser';
import {
  AWAKENING_WARD_INTERACTIONS,
  AWAKENING_WARD_INTERACTION_BY_ID,
  AWAKENING_WARD_OBJECTS,
  AWAKENING_WARD_WALKABLE_ZONES,
} from '../data/awakeningWardMap';
import {
  WARD_ART_FRAMES,
  WARD_ART_KEYS,
  WARD_ART_PATHS,
  WARD_FLOOR_FRAMES,
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
} from '../data/awakeningWardArt';
import {
  hasWardItem,
} from '../domain/awakeningWardState';
import type {
  AwakeningWardSaveState,
  WardInteractionDefinition,
  WardInteractionId,
  WardPoint,
  WardRect,
  WardSceneObject,
} from '../domain/awakeningWardTypes';
import {
  moveWardPlayer,
  resolveWardCameraZoom,
} from '../domain/wardNavigation';
import type {
  WardRuntimeMetrics,
  WardSceneApi,
  WardSceneBridge,
} from './wardSceneBridge';

const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;
const ISO_ORIGIN = { x: 880, y: 82 };
const WORLD_WIDTH = 1960;
const WORLD_HEIGHT = 1080;
const WALK_SPEED = 3.5;
const RUN_SPEED = 5.7;
const PLAYER_SPRITE_SCALE = 0.44;
const CYAN = 0x64d8e7;
const RED = 0xf03749;

export function projectWardPoint(point: WardPoint): WardPoint {
  return {
    x: ISO_ORIGIN.x + (point.x - point.y) * (ISO_TILE_WIDTH / 2),
    y: ISO_ORIGIN.y + (point.x + point.y) * (ISO_TILE_HEIGHT / 2),
  };
}

function pointInRect(point: WardPoint, rect: WardRect): boolean {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}

function isoDiamond(
  x: number,
  y: number,
  width = 1,
  height = 1,
): Phaser.Geom.Point[] {
  const points = [
    projectWardPoint({ x, y }),
    projectWardPoint({ x: x + width, y }),
    projectWardPoint({ x: x + width, y: y + height }),
    projectWardPoint({ x, y: y + height }),
  ];
  return points.map((point) => new Phaser.Geom.Point(point.x, point.y));
}

export class AwakeningWardScene extends Phaser.Scene implements WardSceneApi {
  private readonly bridge: WardSceneBridge;
  private state: AwakeningWardSaveState;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private redWash!: Phaser.GameObjects.Rectangle;
  private powerPath!: Phaser.GameObjects.Graphics;
  private fogOverlay!: Phaser.GameObjects.Rectangle;
  private touchMovement = { x: 0, y: 0 };
  private touchRunning = false;
  private locked = false;
  private quality: 'low' | 'medium';
  private keyMap: Record<string, Phaser.Input.Keyboard.Key> = {};
  private nearestInteraction: WardInteractionDefinition | null = null;
  private interactionMarkers = new Map<
    WardInteractionId,
    Phaser.GameObjects.Container
  >();
  private objectContainers = new Map<string, Phaser.GameObjects.Container>();
  private objectSprites = new Map<string, Phaser.GameObjects.Image>();
  private screenLights: Phaser.GameObjects.GameObject[] = [];
  private lightPools: Phaser.GameObjects.Image[] = [];
  private frontWalls: Phaser.GameObjects.Container[] = [];
  private pickupSprites = new Map<WardInteractionId, Phaser.GameObjects.Container>();
  private drawerVisual?: Phaser.GameObjects.Container;
  private keycardPickupSprite?: Phaser.GameObjects.Image;
  private lastFacingRow = 4;
  private currentPlayerAnimation = '';
  private powerOn = false;
  private playerPosition: WardPoint;
  private stamina: number;
  private lastReportedStamina: number;
  private lastSnapshotAt = 0;
  private lastMovementAt = 0;
  private lastMetricsAt = 0;
  private loadStartedAt = performance.now();
  private loadTimeMs = 0;
  private fpsSamples: number[] = [];
  private downgradedForFps = false;

  constructor(
    bridge: WardSceneBridge,
    state: AwakeningWardSaveState,
    quality: 'low' | 'medium',
  ) {
    super('awakening-ward-a01');
    this.bridge = bridge;
    this.state = state;
    this.playerPosition = { ...state.playerPosition };
    this.stamina = state.stamina;
    this.lastReportedStamina = state.stamina;
    this.quality = quality;
  }

  preload(): void {
    this.load.spritesheet(WARD_ART_KEYS.floor, WARD_ART_PATHS.floor, {
      frameWidth: WARD_ART_FRAMES.floor,
      frameHeight: WARD_ART_FRAMES.floor,
    });
    this.load.spritesheet(WARD_ART_KEYS.items, WARD_ART_PATHS.items, {
      frameWidth: WARD_ART_FRAMES.item,
      frameHeight: WARD_ART_FRAMES.item,
    });
    this.load.spritesheet(
      WARD_ART_KEYS.playerNorthEast,
      WARD_ART_PATHS.playerNorthEast,
      {
        frameWidth: WARD_ART_FRAMES.playerWidth,
        frameHeight: WARD_ART_FRAMES.playerHeight,
      },
    );
    this.load.spritesheet(
      WARD_ART_KEYS.playerSouthWest,
      WARD_ART_PATHS.playerSouthWest,
      {
        frameWidth: WARD_ART_FRAMES.playerWidth,
        frameHeight: WARD_ART_FRAMES.playerHeight,
      },
    );
    this.load.spritesheet(WARD_ART_KEYS.props, WARD_ART_PATHS.props, {
      frameWidth: WARD_ART_FRAMES.prop,
      frameHeight: WARD_ART_FRAMES.prop,
    });
    this.load.spritesheet(WARD_ART_KEYS.walls, WARD_ART_PATHS.walls, {
      frameWidth: WARD_ART_FRAMES.wall,
      frameHeight: WARD_ART_FRAMES.wall,
    });
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createSoftLightTexture();
    this.buildFloor();
    this.buildWalls();
    this.buildEnvironment();
    this.buildLighting();
    this.buildPowerPath();
    this.buildInteractionMarkers();
    this.buildPlayer();
    this.buildScreenAtmosphere();
    this.configureInput();
    this.configureCamera();
    this.setProgress(this.state);
    this.setQuality(this.quality);
    this.bridge.attach(this);
    this.loadTimeMs = Math.round(performance.now() - this.loadStartedAt);
    this.cameras.main.fadeIn(480, 4, 7, 8);
  }

  private createSoftLightTexture(): void {
    if (this.textures.exists('ward-soft-light')) return;
    const texture = this.textures.createCanvas('ward-soft-light', 256, 128);
    if (!texture) return;
    const context = texture.context;
    const gradient = context.createRadialGradient(128, 64, 2, 128, 64, 124);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.46)');
    gradient.addColorStop(0.72, 'rgba(255, 255, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 128);
    texture.refresh();
  }

  private buildLighting(): void {
    const lightDefinitions = [
      { position: { x: 10.7, y: 10.5 }, width: 510, height: 235, powered: false },
      { position: { x: 15.3, y: 5.1 }, width: 330, height: 150, powered: true },
      { position: { x: 19, y: 15.4 }, width: 260, height: 122, powered: true },
      { position: { x: 25.3, y: 11 }, width: 480, height: 120, powered: true },
      { position: { x: 30.5, y: 11.1 }, width: 235, height: 120, powered: true },
    ];
    for (const definition of lightDefinitions) {
      const projected = projectWardPoint(definition.position);
      const light = this.add.image(
        projected.x,
        projected.y + 5,
        'ward-soft-light',
      ).setDisplaySize(definition.width, definition.height)
        .setTint(definition.powered ? CYAN : RED)
        .setAlpha(definition.powered ? 0.07 : 0.13)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(0);
      light.setData('powered', definition.powered);
      this.lightPools.push(light);
    }
  }

  private buildFloor(): void {
    const underlay = this.add.graphics().setDepth(-5);
    for (const zone of AWAKENING_WARD_WALKABLE_ZONES) {
      underlay.fillStyle(0x030507, 1);
      underlay.fillPoints(isoDiamond(
        zone.x - 0.24,
        zone.y - 0.24,
        zone.width + 0.48,
        zone.height + 0.48,
      ), true);
      underlay.lineStyle(4, 0x12191e, 1);
      underlay.strokePoints(isoDiamond(zone.x, zone.y, zone.width, zone.height), true);
    }

    const floorTexture = this.add.renderTexture(
      0,
      0,
      WORLD_WIDTH,
      WORLD_HEIGHT,
    ).setOrigin(0).setDepth(-3);
    const cells: WardPoint[] = [];
    for (let y = 1; y < 22; y += 1) {
      for (let x = 1; x < 34; x += 1) {
        const center = { x: x + 0.5, y: y + 0.5 };
        if (AWAKENING_WARD_WALKABLE_ZONES.some(
          (zone) => pointInRect(center, zone),
        )) cells.push({ x, y });
      }
    }
    cells.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const cell of cells) {
      const corridorGuide = cell.x >= 20
        && cell.x <= 31
        && (cell.y === 10 || (cell.x >= 29 && cell.y === 11));
      const capsuleWarning = cell.x >= 7
        && cell.x <= 14
        && cell.y >= 8
        && cell.y <= 14
        && (cell.x + cell.y) % 4 === 0;
      const hash = (cell.x * 17 + cell.y * 29) % 31;
      const frame = corridorGuide
        ? WARD_FLOOR_FRAMES.corridorGuide
        : capsuleWarning
          ? WARD_FLOOR_FRAMES.warningPlate
          : hash === 0 || hash === 11
            ? WARD_FLOOR_FRAMES.serviceVent
            : WARD_FLOOR_FRAMES.accessPanel;
      const projected = projectWardPoint({
        x: cell.x + 0.5,
        y: cell.y + 0.5,
      });
      const stamp = this.add.image(0, 0, WARD_ART_KEYS.floor, frame)
        .setScale(0.116)
        .setAlpha(corridorGuide ? 0.96 : 0.88);
      if (!corridorGuide && hash % 5 === 0) stamp.setTint(0xc7d0d3);
      floorTexture.draw(stamp, projected.x, projected.y + 7);
      stamp.destroy();
    }

    const floorDetail = this.add.graphics().setDepth(-1);
    const capsulePad = isoDiamond(6.9, 7.8, 8, 7);
    floorDetail.fillStyle(0x050709, 0.22);
    floorDetail.fillPoints(capsulePad, true);
    floorDetail.lineStyle(4, 0x250c12, 0.88);
    floorDetail.strokePoints(capsulePad, true);
    floorDetail.lineStyle(1, 0xe43a48, 0.64);
    floorDetail.strokePoints(isoDiamond(7.35, 8.2, 7.1, 6.2), true);

    const start = projectWardPoint({ x: 6.2, y: 16.2 });
    const spawnPlate = this.add.container(start.x, start.y).setDepth(2);
    const spawnBacking = this.add.graphics();
    spawnBacking.fillStyle(0x071014, 0.88);
    spawnBacking.fillPoints([
      new Phaser.Geom.Point(-47, 0),
      new Phaser.Geom.Point(-28, -11),
      new Phaser.Geom.Point(47, -11),
      new Phaser.Geom.Point(28, 0),
    ], true);
    spawnBacking.lineStyle(1, CYAN, 0.72);
    spawnBacking.strokePoints([
      new Phaser.Geom.Point(-47, 0),
      new Phaser.Geom.Point(-28, -11),
      new Phaser.Geom.Point(47, -11),
      new Phaser.Geom.Point(28, 0),
    ], true);
    const spawnText = this.add.text(0, -6, 'A-01 // WAKE', {
      color: '#9ce7ef',
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    spawnPlate.add([spawnBacking, spawnText]);
  }

  private createWallSegment(
    start: WardPoint,
    end: WardPoint,
    front: boolean,
  ): void {
    const wallHeight = front ? 50 : 64;
    const wallStart = projectWardPoint(start);
    const wallEnd = projectWardPoint(end);
    const backing = this.add.graphics().setDepth(1);
    backing.fillStyle(front ? 0x0c0c13 : 0x11111a, 0.98);
    backing.fillPoints([
      new Phaser.Geom.Point(wallStart.x, wallStart.y + 4),
      new Phaser.Geom.Point(wallEnd.x, wallEnd.y + 4),
      new Phaser.Geom.Point(wallEnd.x, wallEnd.y - wallHeight),
      new Phaser.Geom.Point(wallStart.x, wallStart.y - wallHeight),
    ], true);
    backing.lineStyle(4, 0x020304, 0.98);
    backing.lineBetween(
      wallStart.x,
      wallStart.y + 5,
      wallEnd.x,
      wallEnd.y + 5,
    );
    backing.lineStyle(1, 0x5a676d, 0.56);
    backing.lineBetween(
      wallStart.x,
      wallStart.y - wallHeight,
      wallEnd.x,
      wallEnd.y - wallHeight,
    );

    const logicalLength = Math.hypot(end.x - start.x, end.y - start.y);
    const modules = Math.max(1, Math.ceil(logicalLength / 3));
    const flip = Math.abs(end.y - start.y) > Math.abs(end.x - start.x);

    // Independent modules prevent a distant end of a long wall from sorting
    // over the player when only the nearby section should occlude them.
    for (let index = 0; index < modules; index += 1) {
      const startProgress = index / modules;
      const endProgress = (index + 1) / modules;
      const midpointProgress = (index + 0.5) / modules;
      const segmentStart = {
        x: Phaser.Math.Linear(start.x, end.x, startProgress),
        y: Phaser.Math.Linear(start.y, end.y, startProgress),
      };
      const segmentEnd = {
        x: Phaser.Math.Linear(start.x, end.x, endProgress),
        y: Phaser.Math.Linear(start.y, end.y, endProgress),
      };
      const midpoint = {
        x: Phaser.Math.Linear(start.x, end.x, midpointProgress),
        y: Phaser.Math.Linear(start.y, end.y, midpointProgress),
      };
      const a = projectWardPoint(segmentStart);
      const b = projectWardPoint(segmentEnd);
      const projected = projectWardPoint(midpoint);
      const container = this.add.container(0, 0);
      const frame = (index + (front ? 3 : flip ? 1 : 0)) % 4;
      const visual = WARD_WALL_VISUALS[frame]!;
      const module = this.add.image(
        projected.x,
        projected.y + 4,
        WARD_ART_KEYS.walls,
        frame,
      ).setOrigin(visual.originX, visual.originY)
        .setScale(flip ? -0.208 : 0.208, 0.208);
      container.add(module);

      const authoredDepth = resolveWardWallDepth(projected.y + 4, front);
      container.setDepth(authoredDepth);
      container.setData('authoredDepth', authoredDepth);
      container.setData('screenMinX', Math.min(a.x, b.x) - 54);
      container.setData('screenMaxX', Math.max(a.x, b.x) + 54);
      container.setData('screenStartX', a.x);
      container.setData('screenStartY', a.y + 4);
      container.setData('screenEndX', b.x);
      container.setData('screenEndY', b.y + 4);
      if (front) this.frontWalls.push(container);
    }
  }

  private buildWalls(): void {
    this.createWallSegment({ x: 1.5, y: 1.5 }, { x: 21, y: 1.5 }, false);
    this.createWallSegment({ x: 1.5, y: 1.5 }, { x: 1.5, y: 20.5 }, false);
    this.createWallSegment({ x: 1.5, y: 20.5 }, { x: 17.2, y: 20.5 }, true);
    this.createWallSegment({ x: 21, y: 1.5 }, { x: 21, y: 7.5 }, false);
    this.createWallSegment({ x: 21, y: 14.5 }, { x: 21, y: 20.5 }, true);
    this.createWallSegment({ x: 19.5, y: 7.5 }, { x: 32.5, y: 7.5 }, false);
    this.createWallSegment({ x: 19.5, y: 14.5 }, { x: 28, y: 14.5 }, true);
    this.createWallSegment({ x: 28, y: 16.5 }, { x: 32.5, y: 16.5 }, true);
  }

  private createProp(object: WardSceneObject): Phaser.GameObjects.Container {
    const visual = WARD_PROP_VISUALS[object.kind];
    const { bounds } = object;
    const centerWorld = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    const center = projectWardPoint(centerWorld);
    const container = this.add.container(center.x, center.y);
    container.setData('objectId', object.id);
    container.setDepth(projectWardPoint({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    }).y + 7);
    if (!visual) return container;

    const accent = visual.emissive === 'cyan' ? CYAN : RED;
    if (visual.emissive) {
      const glow = this.add.image(
        visual.offsetX ?? 0,
        -(visual.shadowHeight * 1.25),
        'ward-soft-light',
      ).setDisplaySize(
        visual.shadowWidth * 1.85,
        visual.shadowHeight * 3.8,
      ).setTint(accent)
        .setAlpha(0.12)
        .setBlendMode(Phaser.BlendModes.ADD);
      container.add(glow);
      this.screenLights.push(glow);
    }

    const shadow = this.add.ellipse(
      visual.offsetX ?? 0,
      5,
      visual.shadowWidth,
      visual.shadowHeight,
      0x000000,
      0.66,
    );
    const sprite = this.add.image(
      visual.offsetX ?? 0,
      visual.offsetY ?? 0,
      WARD_ART_KEYS.props,
      visual.frame,
    ).setOrigin(visual.originX, visual.originY)
      .setScale(visual.scale);
    container.add([shadow, sprite]);
    this.objectSprites.set(object.id, sprite);

    if (object.kind === 'capsule' || object.kind === 'exit-door') {
      const label = this.add.text(
        object.kind === 'exit-door' ? -7 : 67,
        object.kind === 'exit-door' ? -175 : -78,
        object.label ?? (object.kind === 'capsule' ? 'A-01' : 'A-07'),
        {
          color: object.kind === 'exit-door' ? '#d6edf0' : '#91dae4',
          fontFamily: 'Rajdhani, Arial, sans-serif',
          fontSize: object.kind === 'exit-door' ? '16px' : '11px',
          fontStyle: 'bold',
          stroke: '#050708',
          strokeThickness: 3,
        },
      ).setOrigin(0.5);
      container.add(label);
    }

    if (object.kind === 'storage') this.buildDrawerVisual(container);
    if (object.kind === 'side-table') {
      const clue = this.add.image(
        -18,
        -61,
        WARD_ART_KEYS.items,
        WARD_ITEM_FRAMES.clueNote,
      ).setScale(0.064).setRotation(-0.08);
      container.add(clue);
    }
    return container;
  }

  private buildDrawerVisual(parent: Phaser.GameObjects.Container): void {
    const drawer = this.add.container(6, -36).setAlpha(0);
    const trayShadow = this.add.ellipse(0, 9, 61, 20, 0x000000, 0.7);
    const tray = this.add.graphics();
    tray.fillStyle(0x0b1115, 1);
    tray.fillPoints([
      new Phaser.Geom.Point(-31, 2),
      new Phaser.Geom.Point(-15, -7),
      new Phaser.Geom.Point(34, -7),
      new Phaser.Geom.Point(17, 3),
    ], true);
    tray.lineStyle(2, 0x536169, 0.92);
    tray.strokePoints([
      new Phaser.Geom.Point(-31, 2),
      new Phaser.Geom.Point(-15, -7),
      new Phaser.Geom.Point(34, -7),
      new Phaser.Geom.Point(17, 3),
    ], true);
    const card = this.add.image(
      4,
      -5,
      WARD_ART_KEYS.items,
      WARD_ITEM_FRAMES.keycard,
    ).setScale(0.072).setRotation(-0.12);
    drawer.add([trayShadow, tray, card]);
    parent.add(drawer);
    this.drawerVisual = drawer;
    this.keycardPickupSprite = card;
  }

  private buildCableRun(object: WardSceneObject): Phaser.GameObjects.Container {
    const start = projectWardPoint({
      x: object.bounds.x,
      y: object.bounds.y + object.bounds.height / 2,
    });
    const end = projectWardPoint({
      x: object.bounds.x + object.bounds.width,
      y: object.bounds.y + object.bounds.height / 2,
    });
    const curve = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(start.x, start.y),
      new Phaser.Math.Vector2(start.x + 58, start.y + 31),
      new Phaser.Math.Vector2(end.x - 70, end.y - 25),
      new Phaser.Math.Vector2(end.x, end.y),
    );
    const graphics = this.add.graphics();
    graphics.lineStyle(9, 0x010203, 0.9);
    graphics.strokePoints(curve.getPoints(28), false);
    graphics.lineStyle(3, 0x3b2024, 0.92);
    graphics.strokePoints(curve.getPoints(28), false);
    graphics.lineStyle(1, 0xc33a45, 0.42);
    graphics.strokePoints(curve.getPoints(28), false);
    const container = this.add.container(0, 0, [graphics]).setDepth(start.y + 2);
    container.setData('objectId', object.id);
    return container;
  }

  private buildEnvironment(): void {
    for (const object of AWAKENING_WARD_OBJECTS) {
      if (object.kind === 'mirror' || object.kind === 'reader') continue;
      const visual = object.kind === 'cable'
        ? this.buildCableRun(object)
        : this.createProp(object);
      this.objectContainers.set(object.id, visual);
    }
    const storage = this.objectContainers.get('mirror-storage');
    const exitDoor = this.objectContainers.get('exit-door-a07');
    if (storage) this.objectContainers.set('wall-mirror', storage);
    if (exitDoor) this.objectContainers.set('exit-reader-a07', exitDoor);

    this.buildPickup(
      'awakening_medical_patch',
      AWAKENING_WARD_INTERACTION_BY_ID.awakening_medical_patch.position,
      WARD_ITEM_FRAMES.medicalPatch,
      0.073,
    );
    this.buildPickup(
      'awakening_battery',
      AWAKENING_WARD_INTERACTION_BY_ID.awakening_battery.position,
      WARD_ITEM_FRAMES.battery,
      0.075,
    );

    const clock = projectWardPoint({ x: 3.7, y: 2.1 });
    const clockPanel = this.add.container(clock.x, clock.y - 77).setDepth(clock.y - 30);
    const clockGlow = this.add.image(0, 0, 'ward-soft-light')
      .setDisplaySize(190, 84)
      .setTint(RED)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shell = this.add.graphics();
    shell.fillStyle(0x020405, 0.99);
    shell.fillRoundedRect(-72, -31, 144, 62, 5);
    shell.lineStyle(5, 0x11181c, 1);
    shell.strokeRoundedRect(-74, -33, 148, 66, 6);
    shell.lineStyle(1, 0xa8323d, 0.94);
    shell.strokeRoundedRect(-68, -27, 136, 54, 3);
    shell.fillStyle(0x4c131c, 0.68);
    shell.fillRect(-60, 19, 120, 2);
    const ghostTime = this.add.text(2, 1, '11:11', {
      color: '#6c0f1c',
      fontFamily: 'Rajdhani, monospace',
      fontSize: '31px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.72);
    const time = this.add.text(0, 0, '11:11', {
      color: '#ff4052',
      fontFamily: 'Rajdhani, monospace',
      fontSize: '31px',
      fontStyle: 'bold',
      letterSpacing: 0,
      shadow: { color: '#ff1f38', blur: 8, fill: true },
    }).setOrigin(0.5);
    const clockLabel = this.add.text(-57, -39, 'WARD CLOCK // A-01', {
      color: '#819096',
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
    });
    clockPanel.add([clockGlow, shell, ghostTime, time, clockLabel]);
    this.screenLights.push(clockGlow);
    this.tweens.add({
      targets: time,
      alpha: { from: 0.74, to: 1 },
      duration: 1420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.tweens.add({
      targets: clockGlow,
      alpha: { from: 0.11, to: 0.2 },
      duration: 1420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private buildPickup(
    id: WardInteractionId,
    position: WardPoint,
    frame: number,
    scale: number,
  ): void {
    const projected = projectWardPoint(position);
    const visual = WARD_ITEM_VISUALS[frame]!;
    const accent = id === 'awakening_medical_patch' ? CYAN : RED;
    const station = this.add.graphics();
    station.fillStyle(0x080d11, 0.98);
    station.fillPoints([
      new Phaser.Geom.Point(-25, 1),
      new Phaser.Geom.Point(-12, -8),
      new Phaser.Geom.Point(25, -8),
      new Phaser.Geom.Point(12, 1),
    ], true);
    station.lineStyle(2, 0x020304, 1);
    station.strokePoints([
      new Phaser.Geom.Point(-25, 1),
      new Phaser.Geom.Point(-12, -8),
      new Phaser.Geom.Point(25, -8),
      new Phaser.Geom.Point(12, 1),
    ], true);
    station.lineStyle(1, accent, 0.76);
    station.lineBetween(-11, -6, 21, -6);
    const shadow = this.add.ellipse(
      0,
      -3,
      visual.shadowWidth,
      visual.shadowHeight,
      0x000000,
      0.66,
    );
    const item = this.add.image(0, -5, WARD_ART_KEYS.items, frame)
      .setScale(scale)
      .setOrigin(visual.originX, visual.originY);
    const container = this.add.container(
      projected.x,
      projected.y,
      [station, shadow, item],
    ).setDepth(projected.y + 8);
    this.pickupSprites.set(id, container);
  }

  private buildPowerPath(): void {
    this.powerPath = this.add.graphics().setDepth(3);
    this.drawPowerPath(false);
  }

  private drawPowerPath(powerOn: boolean): void {
    this.powerOn = powerOn;
    this.powerPath.clear();
    const path = [
      { x: 9, y: 4.7 },
      { x: 12, y: 6.2 },
      { x: 17, y: 7.2 },
      { x: 20.5, y: 10.8 },
      { x: 25, y: 11 },
      { x: 30.4, y: 11.7 },
    ].map(projectWardPoint);
    const color = powerOn ? CYAN : RED;
    const alpha = powerOn ? 0.92 : 0.58;
    this.powerPath.lineStyle(8, 0x020304, 0.76);
    this.powerPath.beginPath();
    this.powerPath.moveTo(path[0]!.x, path[0]!.y);
    path.slice(1).forEach((point) => this.powerPath.lineTo(point.x, point.y));
    this.powerPath.strokePath();
    this.powerPath.lineStyle(2, color, alpha);
    this.powerPath.beginPath();
    this.powerPath.moveTo(path[0]!.x, path[0]!.y);
    path.slice(1).forEach((point) => this.powerPath.lineTo(point.x, point.y));
    this.powerPath.strokePath();

    for (let index = 0; index < path.length - 1; index += 1) {
      const start = path[index]!;
      const end = path[index + 1]!;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      for (const progress of [0.25, 0.55, 0.85]) {
        const x = Phaser.Math.Linear(start.x, end.x, progress);
        const y = Phaser.Math.Linear(start.y, end.y, progress);
        const size = 7;
        const left = new Phaser.Geom.Point(
          x - Math.cos(angle - 0.62) * size,
          y - Math.sin(angle - 0.62) * size,
        );
        const right = new Phaser.Geom.Point(
          x - Math.cos(angle + 0.62) * size,
          y - Math.sin(angle + 0.62) * size,
        );
        this.powerPath.lineStyle(2, color, alpha * 0.9);
        this.powerPath.lineBetween(left.x, left.y, x, y);
        this.powerPath.lineBetween(right.x, right.y, x, y);
      }
    }
  }

  private buildInteractionMarkers(): void {
    for (const interaction of AWAKENING_WARD_INTERACTIONS) {
      const projected = projectWardPoint(interaction.position);
      const glow = this.add.image(0, 2, 'ward-soft-light')
        .setDisplaySize(52, 24)
        .setTint(CYAN)
        .setAlpha(0.16)
        .setBlendMode(Phaser.BlendModes.ADD);
      const marker = this.add.graphics();
      marker.lineStyle(1, CYAN, 0.78);
      marker.strokePoints([
        new Phaser.Geom.Point(0, -11),
        new Phaser.Geom.Point(11, 0),
        new Phaser.Geom.Point(0, 11),
        new Phaser.Geom.Point(-11, 0),
      ], true);
      marker.lineStyle(2, 0xc6f7fb, 0.9);
      marker.lineBetween(-18, -8, -18, -2);
      marker.lineBetween(-18, -8, -12, -8);
      marker.lineBetween(18, -8, 18, -2);
      marker.lineBetween(18, -8, 12, -8);
      marker.fillStyle(CYAN, 0.78);
      marker.fillPoints([
        new Phaser.Geom.Point(0, -3),
        new Phaser.Geom.Point(4, 0),
        new Phaser.Geom.Point(0, 3),
        new Phaser.Geom.Point(-4, 0),
      ], true);
      const container = this.add.container(
        projected.x,
        projected.y - 9,
        [glow, marker],
      );
      container.setDepth(projected.y + 5);
      container.setData('interactionId', interaction.id);
      this.interactionMarkers.set(interaction.id, container);
    }
  }

  private buildPlayer(): void {
    this.createPlayerAnimations();
    const projected = projectWardPoint(this.playerPosition);
    const initialVisual = resolveWardPlayerVisual(this.lastFacingRow);
    const rim = this.add.image(0, 1, 'ward-soft-light')
      .setDisplaySize(58, 25)
      .setTint(RED)
      .setAlpha(0.08)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.playerShadow = this.add.ellipse(0, 7, 43, 16, 0x000000, 0.67);
    this.playerSprite = this.add.sprite(
      0,
      5,
      initialVisual.textureKey,
      resolveWardPlayerFrame(this.lastFacingRow, 0),
    ).setOrigin(0.5, 0.94)
      .setScale(PLAYER_SPRITE_SCALE);
    this.playerSprite.setFlipX(initialVisual.flipX);
    this.player = this.add.container(
      projected.x,
      projected.y,
      [rim, this.playerShadow, this.playerSprite],
    );
    this.player.setDepth(projected.y + 8);
  }

  private createPlayerAnimations(): void {
    WARD_PLAYER_DIRECTION_ROWS.forEach((direction, row) => {
      const visual = resolveWardPlayerVisual(row);
      const frames = [1, 2, 3, 2].map((column) => ({
        key: visual.textureKey,
        frame: resolveWardPlayerFrame(row, column),
      }));
      const walkKey = `ward-player-walk-${direction}`;
      const runKey = `ward-player-run-${direction}`;
      if (!this.anims.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames,
          frameRate: 10,
          repeat: -1,
        });
      }
      if (!this.anims.exists(runKey)) {
        this.anims.create({
          key: runKey,
          frames,
          frameRate: 14,
          repeat: -1,
        });
      }
    });
  }

  private buildScreenAtmosphere(): void {
    this.redWash = this.add.rectangle(
      0,
      0,
      this.scale.width,
      this.scale.height,
      0x9f0c1f,
      0.1,
    ).setOrigin(0).setScrollFactor(0).setDepth(5000);
    this.redWash.setBlendMode(Phaser.BlendModes.ADD);
    this.fogOverlay = this.add.rectangle(
      0,
      0,
      this.scale.width,
      this.scale.height,
      0x162027,
      0.045,
    ).setOrigin(0).setScrollFactor(0).setDepth(4999);
  }

  private configureInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.keyMap = keyboard.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,SHIFT',
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    keyboard.on('keydown', () => this.bridge.callbacks.onKeyboardActivity());
  }

  private configureCamera(): void {
    const camera = this.cameras.main;
    camera.startFollow(this.player, true, 0.085, 0.085);
    camera.setDeadzone(130, 80);
    this.scale.on('resize', this.handleResize, this);
    this.handleResize({ width: this.scale.width, height: this.scale.height });
  }

  private handleResize(gameSize: { width: number; height: number }): void {
    this.redWash?.setSize(gameSize.width, gameSize.height);
    this.fogOverlay?.setSize(gameSize.width, gameSize.height);
    this.cameras.main.setZoom(resolveWardCameraZoom(
      gameSize.width,
      gameSize.height,
    ));
  }

  private interactionExhausted(interaction: WardInteractionDefinition): boolean {
    if (interaction.id === 'awakening_keycard') {
      return hasWardItem(this.state, 'keycard_a07');
    }
    if (interaction.id === 'awakening_medical_patch') {
      return this.state.collectedPickupIds.includes('medical_patch');
    }
    if (interaction.id === 'awakening_battery') {
      return this.state.collectedPickupIds.includes('battery');
    }
    return !interaction.repeatable && interaction.grantedFlags.some(
      (flag) => this.state.puzzleFlags[flag],
    );
  }

  private findNearestInteraction(): WardInteractionDefinition | null {
    let nearest: WardInteractionDefinition | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const interaction of AWAKENING_WARD_INTERACTIONS) {
      if (this.interactionExhausted(interaction)) continue;
      if (
        interaction.id === 'awakening_keycard'
        && !this.state.puzzleFlags.hidden_drawer_opened
      ) continue;
      const distance = Phaser.Math.Distance.Between(
        this.playerPosition.x,
        this.playerPosition.y,
        interaction.position.x,
        interaction.position.y,
      );
      if (distance <= interaction.interactionRadius && distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private readMovementInput(): { x: number; y: number; running: boolean } {
    const keyDown = (key: string): boolean => this.keyMap[key]?.isDown ?? false;
    const x = Phaser.Math.Clamp(
      this.touchMovement.x
      + Number(keyDown('D') || keyDown('RIGHT'))
      - Number(keyDown('A') || keyDown('LEFT')),
      -1,
      1,
    );
    const y = Phaser.Math.Clamp(
      this.touchMovement.y
      + Number(keyDown('S') || keyDown('DOWN'))
      - Number(keyDown('W') || keyDown('UP')),
      -1,
      1,
    );
    const length = Math.hypot(x, y);
    return {
      x: length > 1 ? x / length : x,
      y: length > 1 ? y / length : y,
      running: this.touchRunning || keyDown('SHIFT'),
    };
  }

  private updatePlayerVisual(
    time: number,
    input: { x: number; y: number },
    moved: boolean,
    running: boolean,
  ): void {
    if (moved) {
      this.lastFacingRow = resolveWardPlayerFacingRow(input.x, input.y);
      const visual = resolveWardPlayerVisual(this.lastFacingRow);
      const direction = WARD_PLAYER_DIRECTION_ROWS[this.lastFacingRow]!;
      const animation = `ward-player-${running ? 'run' : 'walk'}-${direction}`;
      this.playerSprite.setFlipX(visual.flipX);
      if (this.currentPlayerAnimation !== animation) {
        this.currentPlayerAnimation = animation;
        this.playerSprite.play(animation, true);
      }
      this.playerSprite.setRotation(0);
      const stepPhase = time * (running ? 0.02 : 0.014);
      const footLift = Math.abs(Math.sin(stepPhase));
      const stretch = footLift * (running ? 0.024 : 0.014);
      this.playerSprite.setY(
        (running ? 3 : 5) - footLift * (running ? 2.6 : 1.7),
      );
      this.playerSprite.setScale(
        PLAYER_SPRITE_SCALE * (1 + stretch),
        PLAYER_SPRITE_SCALE * (1 - stretch),
      );
      this.playerShadow.setScale(
        (running ? 1.12 : 1) - footLift * 0.055,
        (running ? 0.87 : 0.94) - footLift * 0.035,
      );
    } else {
      if (this.currentPlayerAnimation) {
        this.playerSprite.stop();
        this.currentPlayerAnimation = '';
      }
      const visual = resolveWardPlayerVisual(this.lastFacingRow);
      this.playerSprite.setTexture(
        visual.textureKey,
        resolveWardPlayerFrame(this.lastFacingRow, 0),
      );
      this.playerSprite.setFlipX(visual.flipX);
      this.playerSprite.setRotation(0);
      const breathing = Math.sin(time * 0.0032);
      this.playerSprite.setY(5 + breathing * 0.55);
      this.playerSprite.setScale(
        PLAYER_SPRITE_SCALE * (1 - breathing * 0.003),
        PLAYER_SPRITE_SCALE * (1 + breathing * 0.005),
      );
      this.playerShadow.setScale(1 + Math.sin(time * 0.0032) * 0.018, 1);
    }
  }

  update(time: number, delta: number): void {
    if (this.locked) return;
    const ePressed = this.keyMap.E
      ? Phaser.Input.Keyboard.JustDown(this.keyMap.E)
      : false;
    const spacePressed = this.keyMap.SPACE
      ? Phaser.Input.Keyboard.JustDown(this.keyMap.SPACE)
      : false;
    if (ePressed || spacePressed) {
      this.requestInteraction();
    }

    const input = this.readMovementInput();
    const moving = Math.abs(input.x) > 0.03 || Math.abs(input.y) > 0.03;
    const running = input.running && moving && this.stamina > 1;
    const speed = running ? RUN_SPEED : WALK_SPEED;
    const worldDirection = {
      x: (input.y + input.x) / Math.SQRT2,
      y: (input.y - input.x) / Math.SQRT2,
    };
    const previous = this.playerPosition;
    const previousProjected = projectWardPoint(previous);
    this.playerPosition = moveWardPlayer(
      previous,
      { x: worldDirection.x * speed, y: worldDirection.y * speed },
      Math.min(delta / 1000, 0.05),
    );

    if (running) {
      this.stamina = Math.max(0, this.stamina - delta * 0.018);
    } else {
      this.stamina = Math.min(100, this.stamina + delta * 0.011);
    }

    const projected = projectWardPoint(this.playerPosition);
    this.player.setPosition(projected.x, projected.y);
    this.player.setDepth(projected.y + 8);
    const moved = previous.x !== this.playerPosition.x
      || previous.y !== this.playerPosition.y;
    if (moved) this.lastMovementAt = time;
    this.updatePlayerVisual(time, {
      x: projected.x - previousProjected.x,
      y: projected.y - previousProjected.y,
    }, moved, running);
    this.cameras.main.setFollowOffset(-input.x * 46, -input.y * 24);
    this.powerPath.setAlpha(
      (this.powerOn ? 0.82 : 0.58) + Math.sin(time * 0.004) * 0.08,
    );
    this.redWash.setAlpha(
      this.powerOn ? 0.022 : 0.085 + Math.sin(time * 0.0023) * 0.013,
    );
    const monitor = this.objectSprites.get('monitoring-main-bank');
    if (monitor && this.powerOn) {
      monitor.setAlpha(0.96 + Math.sin(time * 0.018) * 0.025);
    }

    const nearest = this.findNearestInteraction();
    if (nearest?.id !== this.nearestInteraction?.id) {
      this.nearestInteraction = nearest;
      this.bridge.callbacks.onNearbyInteraction(nearest?.id ?? null);
    }
    this.updateInteractionMarkers(time);
    this.updateWallLayering(projected.x, projected.y);
    this.updateRuntimeTelemetry(time, delta, moved);
  }

  private updateInteractionMarkers(time: number): void {
    for (const interaction of AWAKENING_WARD_INTERACTIONS) {
      const marker = this.interactionMarkers.get(interaction.id);
      if (!marker) continue;
      const exhausted = this.interactionExhausted(interaction);
      const keycardHidden = interaction.id === 'awakening_keycard'
        && !this.state.puzzleFlags.hidden_drawer_opened;
      marker.setVisible(!exhausted && !keycardHidden);
      if (!marker.visible) continue;
      const requiredFlagsMet = interaction.requiredFlags.every(
        (flag) => this.state.puzzleFlags[flag],
      );
      marker.setAlpha(requiredFlagsMet ? 0.82 : 0.24);
      marker.setScale(
        interaction.id === this.nearestInteraction?.id
          ? 1.08 + Math.sin(time * 0.008) * 0.12
          : 0.72,
      );
    }
  }

  private updateWallLayering(playerX: number, playerY: number): void {
    for (const wall of this.frontWalls) {
      const minX = wall.getData('screenMinX') as number;
      const maxX = wall.getData('screenMaxX') as number;
      const startX = wall.getData('screenStartX') as number;
      const startY = wall.getData('screenStartY') as number;
      const endX = wall.getData('screenEndX') as number;
      const endY = wall.getData('screenEndY') as number;
      const progress = Math.abs(endX - startX) < 0.001
        ? 0.5
        : Phaser.Math.Clamp((playerX - startX) / (endX - startX), 0, 1);
      const baseY = Phaser.Math.Linear(startY, endY, progress);
      const playerNearWall = playerX >= minX
        && playerX <= maxX
        && playerY >= baseY - 108
        && playerY < baseY + 24;
      const authoredDepth = wall.getData('authoredDepth') as number;
      wall.setDepth(resolveWardWallRenderDepth(
        authoredDepth,
        playerY + 8,
        playerNearWall,
      ));
    }
  }

  private updateRuntimeTelemetry(
    time: number,
    delta: number,
    moved: boolean,
  ): void {
    const fps = delta > 0 ? 1000 / delta : 60;
    this.fpsSamples.push(fps);
    if (this.fpsSamples.length > 180) this.fpsSamples.shift();

    const staminaChanged = Math.abs(
      this.stamina - this.lastReportedStamina,
    ) >= 1;
    if (
      time - this.lastSnapshotAt > 850
      && (moved || staminaChanged || time - this.lastMovementAt < 1000)
    ) {
      this.lastSnapshotAt = time;
      this.lastReportedStamina = this.stamina;
      this.bridge.callbacks.onRuntimeSnapshot({
        position: { ...this.playerPosition },
        stamina: Math.round(this.stamina),
      });
    }

    if (time - this.lastMetricsAt > 1000) {
      this.lastMetricsAt = time;
      const averageFps = this.fpsSamples.reduce((sum, value) => sum + value, 0)
        / Math.max(1, this.fpsSamples.length);
      if (
        this.quality === 'medium'
        && !this.downgradedForFps
        && this.fpsSamples.length >= 120
        && averageFps < 27
      ) {
        this.downgradedForFps = true;
        this.setQuality('low');
      }
      const metrics: WardRuntimeMetrics = {
        fps: Math.round(averageFps),
        quality: this.quality,
        drawObjects: this.children.length,
        loadTimeMs: this.loadTimeMs,
      };
      this.bridge.callbacks.onMetrics(metrics);
    }
  }

  setTouchMovement(x: number, y: number): void {
    this.touchMovement = {
      x: Phaser.Math.Clamp(x, -1, 1),
      y: Phaser.Math.Clamp(y, -1, 1),
    };
  }

  setTouchRunning(running: boolean): void {
    this.touchRunning = running;
  }

  requestInteraction(): void {
    if (!this.locked && this.nearestInteraction) {
      this.bridge.callbacks.onInteractionRequested(this.nearestInteraction.id);
    }
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    if (locked) {
      this.touchMovement = { x: 0, y: 0 };
      this.touchRunning = false;
    }
  }

  setPaused(paused: boolean): void {
    this.locked = paused;
    if (paused) this.scene.pause();
    else this.scene.resume();
  }

  setProgress(state: AwakeningWardSaveState): void {
    const drawerWasOpen = this.state.puzzleFlags.hidden_drawer_opened;
    const exitWasOpen = this.state.puzzleFlags.awakening_exit_unlocked;
    this.state = state;
    const powerOn = state.puzzleFlags.power_restored;
    this.powerOn = powerOn;
    this.redWash?.setAlpha(powerOn ? 0.022 : 0.095);
    if (this.powerPath) this.drawPowerPath(powerOn);
    this.screenLights.forEach((light) => {
      const display = light as Phaser.GameObjects.Image;
      display.setAlpha(powerOn ? 0.17 : 0.08);
    });
    this.lightPools.forEach((light) => {
      const requiresPower = Boolean(light.getData('powered'));
      if (!requiresPower) {
        light.setTint(RED).setAlpha(powerOn ? 0.075 : 0.14);
        return;
      }
      light.setTint(powerOn ? CYAN : RED).setAlpha(powerOn ? 0.105 : 0.035);
    });
    const poweredObjectIds = [
      'monitoring-main-bank',
      'medical-console-west',
    ];
    poweredObjectIds.forEach((id) => {
      const sprite = this.objectSprites.get(id);
      if (!sprite) return;
      if (powerOn) sprite.clearTint().setAlpha(1);
      else sprite.setTint(0x6a7174).setAlpha(0.72);
    });

    const exitMarker = this.interactionMarkers.get('awakening_exit_reader');
    exitMarker?.setAlpha(hasWardItem(state, 'keycard_a07') ? 1 : 0.48);
    const drawerOpen = state.puzzleFlags.hidden_drawer_opened;
    if (this.drawerVisual) {
      if (drawerOpen && !drawerWasOpen) {
        this.tweens.add({
          targets: this.drawerVisual,
          x: 23,
          y: -25,
          alpha: 1,
          duration: 460,
          ease: 'Back.Out',
        });
      } else {
        this.drawerVisual.setPosition(drawerOpen ? 23 : 6, drawerOpen ? -25 : -36);
        this.drawerVisual.setAlpha(drawerOpen ? 1 : 0);
      }
    }
    this.keycardPickupSprite?.setVisible(
      drawerOpen && !hasWardItem(state, 'keycard_a07'),
    );
    this.pickupSprites.get('awakening_medical_patch')?.setVisible(
      !state.collectedPickupIds.includes('medical_patch'),
    );
    this.pickupSprites.get('awakening_battery')?.setVisible(
      !state.collectedPickupIds.includes('battery'),
    );

    const door = this.objectContainers.get('exit-door-a07');
    if (door) {
      if (door.getData('closedY') === undefined) {
        door.setData('closedY', door.y);
      }
      if (state.puzzleFlags.awakening_exit_unlocked && !exitWasOpen) {
        this.tweens.add({
          targets: door,
          y: (door.getData('closedY') as number) - 72,
          alpha: 0.22,
          duration: 760,
          ease: 'Sine.InOut',
        });
      } else {
        door.y = state.puzzleFlags.awakening_exit_unlocked
          ? (door.getData('closedY') as number) - 72
          : door.getData('closedY') as number;
        door.alpha = state.puzzleFlags.awakening_exit_unlocked ? 0.22 : 1;
      }
    }
  }

  setQuality(quality: 'low' | 'medium'): void {
    this.quality = quality;
    this.fogOverlay?.setVisible(quality === 'medium');
    this.screenLights.forEach((light) => {
      const display = light as Phaser.GameObjects.Image;
      display.setBlendMode(
        quality === 'medium' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
      );
    });
    this.lightPools.forEach((light) => {
      light.setBlendMode(
        quality === 'medium' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
      );
    });
  }

  destroy(): void {
    this.scale.off('resize', this.handleResize, this);
    this.bridge.detach(this);
    if (this.sys?.isActive()) this.scene.stop();
  }
}
