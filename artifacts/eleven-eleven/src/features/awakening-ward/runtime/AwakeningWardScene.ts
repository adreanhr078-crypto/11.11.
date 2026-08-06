import Phaser from 'phaser';
import {
  AWAKENING_WARD_INTERACTIONS,
  AWAKENING_WARD_OBJECTS,
  AWAKENING_WARD_WALKABLE_ZONES,
} from '../data/awakeningWardMap';
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

function objectPalette(kind: WardSceneObject['kind']): {
  top: number;
  left: number;
  right: number;
  accent: number;
} {
  if (kind === 'capsule') {
    return { top: 0x4b5962, left: 0x232c34, right: 0x141b22, accent: 0xe22d3f };
  }
  if (kind === 'monitor-bank' || kind === 'reader') {
    return { top: 0x303b43, left: 0x182128, right: 0x10161b, accent: 0x51d7e5 };
  }
  if (kind === 'power-panel') {
    return { top: 0x3e4548, left: 0x1d2428, right: 0x12171a, accent: 0xef3446 };
  }
  if (kind === 'exit-door') {
    return { top: 0x343c43, left: 0x161d22, right: 0x0d1216, accent: 0x78d9ee };
  }
  return { top: 0x343b40, left: 0x1b2328, right: 0x11171b, accent: 0xaab8bf };
}

export class AwakeningWardScene extends Phaser.Scene implements WardSceneApi {
  private readonly bridge: WardSceneBridge;
  private state: AwakeningWardSaveState;
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Graphics;
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
  private screenLights: Phaser.GameObjects.GameObject[] = [];
  private frontWalls: Phaser.GameObjects.Container[] = [];
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
    this.load.image(
      'ward-floor-placeholder',
      '/assets/awakening-ward/ward-floor-placeholder.webp',
    );
    this.load.image(
      'ward-wall-placeholder',
      '/assets/awakening-ward/ward-wall-placeholder.webp',
    );
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050708');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.buildFloor();
    this.buildWalls();
    this.buildEnvironment();
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

  private buildFloor(): void {
    const projectedCenter = projectWardPoint({ x: 17, y: 11 });
    const texture = this.add.tileSprite(
      projectedCenter.x,
      projectedCenter.y,
      1880,
      930,
      'ward-floor-placeholder',
    ).setAlpha(0.36).setDepth(-4);
    texture.setTileScale(0.48, 0.48);

    const maskSource = this.make.graphics({ x: 0, y: 0 }, false);
    maskSource.fillStyle(0xffffff, 1);
    for (const zone of AWAKENING_WARD_WALKABLE_ZONES) {
      maskSource.fillPoints(
        isoDiamond(zone.x, zone.y, zone.width, zone.height),
        true,
      );
    }
    texture.setMask(maskSource.createGeometryMask());

    const floor = this.add.graphics().setDepth(-2);
    for (let y = 1; y < 22; y += 1) {
      for (let x = 1; x < 34; x += 1) {
        const center = { x: x + 0.5, y: y + 0.5 };
        if (!AWAKENING_WARD_WALKABLE_ZONES.some(
          (zone) => pointInRect(center, zone),
        )) continue;
        floor.fillStyle((x + y) % 2 === 0 ? 0x111820 : 0x151d23, 0.72);
        floor.fillPoints(isoDiamond(x, y), true);
        floor.lineStyle(1, 0x39444a, 0.36);
        floor.strokePoints(isoDiamond(x, y), true);
      }
    }

    const labels = this.add.graphics().setDepth(-1);
    const capsulePad = isoDiamond(6.9, 7.8, 8, 7);
    labels.lineStyle(2, 0x9c2c37, 0.52);
    labels.strokePoints(capsulePad, true);
    const start = projectWardPoint({ x: 6.2, y: 16.2 });
    this.add.text(start.x, start.y, 'SPAWN // A-01', {
      color: '#7bd9e9',
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setRotation(-0.46).setAlpha(0.72).setDepth(2);
  }

  private createWallSegment(
    start: WardPoint,
    end: WardPoint,
    front: boolean,
  ): void {
    const a = projectWardPoint(start);
    const b = projectWardPoint(end);
    const wallHeight = 94;
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const container = this.add.container(center.x, center.y);
    const graphics = this.add.graphics();
    graphics.fillStyle(front ? 0x10171c : 0x151d23, 0.96);
    graphics.fillPoints([
      new Phaser.Geom.Point(a.x - center.x, a.y - center.y),
      new Phaser.Geom.Point(b.x - center.x, b.y - center.y),
      new Phaser.Geom.Point(b.x - center.x, b.y - center.y - wallHeight),
      new Phaser.Geom.Point(a.x - center.x, a.y - center.y - wallHeight),
    ], true);
    graphics.lineStyle(2, 0x3b474e, 0.85);
    graphics.strokePoints([
      new Phaser.Geom.Point(a.x - center.x, a.y - center.y),
      new Phaser.Geom.Point(b.x - center.x, b.y - center.y),
      new Phaser.Geom.Point(b.x - center.x, b.y - center.y - wallHeight),
      new Phaser.Geom.Point(a.x - center.x, a.y - center.y - wallHeight),
    ], true);
    const length = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    const texture = this.add.tileSprite(
      0,
      -wallHeight / 2,
      length,
      wallHeight - 7,
      'ward-wall-placeholder',
    );
    texture.setRotation(Math.atan2(b.y - a.y, b.x - a.x));
    texture.setTileScale(0.18, 0.18);
    texture.setAlpha(0.28);
    container.add([graphics, texture]);
    container.setDepth(Math.max(a.y, b.y) + (front ? 500 : -40));
    container.setData('front', front);
    if (front) this.frontWalls.push(container);
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

  private createPrism(object: WardSceneObject): Phaser.GameObjects.Container {
    const { bounds } = object;
    const centerWorld = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    const center = projectWardPoint(centerWorld);
    const corners = isoDiamond(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
    ).map((point) => new Phaser.Geom.Point(
      point.x - center.x,
      point.y - center.y,
    ));
    const lift = object.height * 23;
    const palette = objectPalette(object.kind);
    const graphics = this.add.graphics();
    graphics.fillStyle(palette.left, 1);
    graphics.fillPoints([
      corners[0]!,
      corners[3]!,
      new Phaser.Geom.Point(corners[3]!.x, corners[3]!.y - lift),
      new Phaser.Geom.Point(corners[0]!.x, corners[0]!.y - lift),
    ], true);
    graphics.fillStyle(palette.right, 1);
    graphics.fillPoints([
      corners[2]!,
      corners[3]!,
      new Phaser.Geom.Point(corners[3]!.x, corners[3]!.y - lift),
      new Phaser.Geom.Point(corners[2]!.x, corners[2]!.y - lift),
    ], true);
    graphics.fillStyle(palette.top, 1);
    graphics.fillPoints(corners.map((corner) => (
      new Phaser.Geom.Point(corner.x, corner.y - lift)
    )), true);
    graphics.lineStyle(1, 0x75828a, 0.52);
    graphics.strokePoints(corners.map((corner) => (
      new Phaser.Geom.Point(corner.x, corner.y - lift)
    )), true);

    const container = this.add.container(center.x, center.y, [graphics]);
    container.setDepth(projectWardPoint({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    }).y);
    container.setData('objectId', object.id);
    this.decorateObject(container, object, palette.accent, lift);
    return container;
  }

  private decorateObject(
    container: Phaser.GameObjects.Container,
    object: WardSceneObject,
    accent: number,
    lift: number,
  ): void {
    const detail = this.add.graphics();
    if (object.kind === 'capsule') {
      detail.fillStyle(0x071016, 0.94);
      detail.fillRoundedRect(-116, -lift - 24, 232, 56, 28);
      detail.lineStyle(3, 0x87939a, 0.9);
      detail.strokeRoundedRect(-118, -lift - 27, 236, 62, 30);
      detail.lineStyle(2, 0x51d7e5, 0.55);
      detail.lineBetween(-78, -lift + 1, 68, -lift + 1);
      detail.fillStyle(0xe22d3f, 0.95);
      detail.fillCircle(90, -lift + 2, 5);
    } else if (object.kind === 'monitor-bank') {
      for (let index = 0; index < 4; index += 1) {
        const x = -87 + index * 47;
        detail.fillStyle(0x061116, 1);
        detail.fillRoundedRect(x, -lift - 55, 41, 32, 2);
        detail.lineStyle(1, accent, 0.8);
        detail.strokeRoundedRect(x, -lift - 55, 41, 32, 2);
        detail.lineBetween(x + 5, -lift - 37, x + 34, -lift - 45);
      }
      this.screenLights.push(detail);
    } else if (object.kind === 'power-panel') {
      detail.lineStyle(3, 0xe83a48, 0.85);
      detail.lineBetween(-38, -lift - 34, -5, -lift + 2);
      detail.lineBetween(-5, -lift + 2, 24, -lift - 27);
      detail.fillStyle(0xef3446, 1);
      detail.fillCircle(29, -lift - 30, 5);
    } else if (object.kind === 'mirror') {
      detail.fillStyle(0x6e8893, 0.25);
      detail.fillRoundedRect(-42, -lift - 94, 84, 112, 3);
      detail.lineStyle(3, 0xc6d4d9, 0.82);
      detail.strokeRoundedRect(-42, -lift - 94, 84, 112, 3);
      detail.lineStyle(1, 0xeaf9ff, 0.42);
      detail.lineBetween(-27, -lift - 80, 20, -lift - 9);
      detail.lineBetween(-13, -lift - 87, 31, -lift - 21);
    } else if (object.kind === 'exit-door') {
      detail.fillStyle(0x121a21, 1);
      detail.fillRoundedRect(-70, -lift - 112, 140, 128, 3);
      detail.lineStyle(4, 0x4d5b64, 1);
      detail.strokeRoundedRect(-70, -lift - 112, 140, 128, 3);
      detail.lineStyle(2, accent, 0.92);
      detail.lineBetween(-52, -lift - 91, 52, -lift - 91);
      detail.lineBetween(0, -lift - 78, 0, -lift + 4);
      container.add(this.add.text(0, -lift - 98, object.label ?? 'A-07', {
        color: '#b9dce5',
        fontFamily: 'Rajdhani, Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      }).setOrigin(0.5));
    } else if (object.kind === 'reader') {
      detail.fillStyle(0x061116, 1);
      detail.fillRoundedRect(-18, -lift - 22, 36, 44, 3);
      detail.lineStyle(2, accent, 0.88);
      detail.strokeRoundedRect(-18, -lift - 22, 36, 44, 3);
      detail.fillStyle(accent, 0.9);
      detail.fillRect(-9, -lift - 11, 18, 3);
      this.screenLights.push(detail);
    } else if (object.kind === 'storage') {
      detail.lineStyle(2, 0x9b2b37, 0.72);
      detail.strokeRect(-43, -lift - 5, 86, 17);
      detail.fillStyle(0x51d7e5, 0.82);
      detail.fillCircle(0, -lift + 3, 3);
    } else if (object.kind === 'medical-console') {
      detail.lineStyle(2, 0x51d7e5, 0.75);
      detail.strokeRect(-31, -lift - 24, 62, 30);
      detail.lineBetween(-24, -lift - 6, -8, -lift - 16);
      detail.lineBetween(-8, -lift - 16, 8, -lift - 3);
      detail.lineBetween(8, -lift - 3, 24, -lift - 18);
      this.screenLights.push(detail);
    } else if (object.kind === 'cable') {
      detail.lineStyle(4, 0x050708, 0.94);
      detail.lineBetween(-82, -lift, 84, -lift);
      detail.lineStyle(1, 0x9d2b36, 0.54);
      detail.lineBetween(-78, -lift - 1, 78, -lift - 1);
    }
    container.add(detail);
  }

  private buildEnvironment(): void {
    for (const object of AWAKENING_WARD_OBJECTS) {
      this.objectContainers.set(object.id, this.createPrism(object));
    }
    const clock = projectWardPoint({ x: 3.7, y: 2.1 });
    const clockPanel = this.add.container(clock.x, clock.y - 72).setDepth(clock.y - 30);
    const shell = this.add.graphics();
    shell.fillStyle(0x050709, 0.98);
    shell.fillRoundedRect(-64, -25, 128, 50, 3);
    shell.lineStyle(2, 0x5f2830, 0.85);
    shell.strokeRoundedRect(-64, -25, 128, 50, 3);
    const time = this.add.text(0, 0, '11:11', {
      color: '#f13447',
      fontFamily: 'Rajdhani, monospace',
      fontSize: '29px',
      fontStyle: 'bold',
      letterSpacing: 0,
    }).setOrigin(0.5);
    clockPanel.add([shell, time]);
    this.tweens.add({
      targets: time,
      alpha: { from: 0.7, to: 1 },
      duration: 1350,
      yoyo: true,
      repeat: -1,
    });
  }

  private buildPowerPath(): void {
    this.powerPath = this.add.graphics().setDepth(3);
    this.drawPowerPath(false);
  }

  private drawPowerPath(powerOn: boolean): void {
    this.powerPath.clear();
    const path = [
      { x: 9, y: 4.7 },
      { x: 12, y: 6.2 },
      { x: 17, y: 7.2 },
      { x: 20.5, y: 10.8 },
      { x: 25, y: 11 },
      { x: 30.4, y: 11.7 },
    ].map(projectWardPoint);
    const color = powerOn ? 0x6ed6e5 : 0xef3949;
    const alpha = powerOn ? 0.9 : 0.42;
    this.powerPath.lineStyle(3, color, alpha);
    this.powerPath.beginPath();
    this.powerPath.moveTo(path[0]!.x, path[0]!.y);
    path.slice(1).forEach((point) => this.powerPath.lineTo(point.x, point.y));
    this.powerPath.strokePath();
    for (const point of path) {
      this.powerPath.fillStyle(color, powerOn ? 0.94 : 0.65);
      this.powerPath.fillPoints([
        new Phaser.Geom.Point(point.x, point.y - 4),
        new Phaser.Geom.Point(point.x + 6, point.y),
        new Phaser.Geom.Point(point.x, point.y + 4),
        new Phaser.Geom.Point(point.x - 6, point.y),
      ], true);
    }
  }

  private buildInteractionMarkers(): void {
    for (const interaction of AWAKENING_WARD_INTERACTIONS) {
      const projected = projectWardPoint(interaction.position);
      const ring = this.add.graphics();
      ring.lineStyle(2, 0x78d9ee, 0.9);
      ring.strokeCircle(0, 0, 13);
      ring.fillStyle(0x78d9ee, 0.22);
      ring.fillCircle(0, 0, 6);
      const container = this.add.container(projected.x, projected.y - 7, [ring]);
      container.setDepth(projected.y + 5);
      container.setData('interactionId', interaction.id);
      this.interactionMarkers.set(interaction.id, container);
    }
  }

  private buildPlayer(): void {
    const projected = projectWardPoint(this.playerPosition);
    this.playerShadow = this.add.ellipse(0, 9, 34, 15, 0x000000, 0.55);
    this.playerBody = this.add.graphics();
    this.playerBody.fillStyle(0x090d11, 1);
    this.playerBody.fillRoundedRect(-11, -42, 22, 39, 8);
    this.playerBody.fillCircle(0, -50, 11);
    this.playerBody.fillStyle(0x28333a, 1);
    this.playerBody.fillRoundedRect(-8, -38, 16, 21, 4);
    this.playerBody.lineStyle(2, 0xe23a49, 0.82);
    this.playerBody.lineBetween(-7, -30, 7, -30);
    this.playerBody.lineStyle(3, 0x0b0f12, 1);
    this.playerBody.lineBetween(-7, -6, -10, 8);
    this.playerBody.lineBetween(7, -6, 10, 8);
    this.player = this.add.container(
      projected.x,
      projected.y,
      [this.playerShadow, this.playerBody],
    );
    this.player.setDepth(projected.y + 8);
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
    if (moved) {
      this.lastMovementAt = time;
      this.playerBody.setRotation(Phaser.Math.Clamp(input.x * 0.08, -0.08, 0.08));
      this.playerBody.setY(Math.sin(time * (running ? 0.022 : 0.015)) * 2);
      this.playerShadow.setScale(running ? 1.08 : 1, moving ? 0.92 : 1);
    } else {
      this.playerBody.setRotation(0);
      this.playerBody.setY(Math.sin(time * 0.003) * 0.8);
      this.playerShadow.setScale(1);
    }

    const nearest = this.findNearestInteraction();
    if (nearest?.id !== this.nearestInteraction?.id) {
      this.nearestInteraction = nearest;
      this.bridge.callbacks.onNearbyInteraction(nearest?.id ?? null);
    }
    this.updateInteractionMarkers(time);
    this.updateOcclusion(projected.y);
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

  private updateOcclusion(playerY: number): void {
    for (const wall of this.frontWalls) {
      wall.setAlpha(playerY < wall.y + 28 ? 0.16 : 0.82);
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
    this.redWash?.setAlpha(powerOn ? 0.025 : 0.095);
    if (this.powerPath) this.drawPowerPath(powerOn);
    this.screenLights.forEach((light) => {
      const display = light as Phaser.GameObjects.Graphics;
      display.setAlpha(powerOn ? 1 : 0.26);
    });
    const exitMarker = this.interactionMarkers.get('awakening_exit_reader');
    exitMarker?.setAlpha(hasWardItem(state, 'keycard_a07') ? 1 : 0.48);
    const drawer = this.objectContainers.get('mirror-storage');
    if (drawer) {
      const targetX = state.puzzleFlags.hidden_drawer_opened
        ? drawer.getData('closedX') ?? drawer.x + 18
        : drawer.getData('closedX') ?? drawer.x;
      if (drawer.getData('closedX') === undefined) {
        drawer.setData('closedX', drawer.x);
      }
      if (state.puzzleFlags.hidden_drawer_opened && !drawerWasOpen) {
        this.tweens.add({
          targets: drawer,
          x: (drawer.getData('closedX') as number) + 18,
          duration: 420,
          ease: 'Cubic.Out',
        });
      } else {
        drawer.x = state.puzzleFlags.hidden_drawer_opened
          ? (drawer.getData('closedX') as number) + 18
          : targetX;
      }
    }
    const door = this.objectContainers.get('exit-door-a07');
    if (door) {
      if (door.getData('closedY') === undefined) {
        door.setData('closedY', door.y);
      }
      if (state.puzzleFlags.awakening_exit_unlocked && !exitWasOpen) {
        this.tweens.add({
          targets: door,
          y: (door.getData('closedY') as number) - 58,
          alpha: 0.34,
          duration: 680,
          ease: 'Sine.InOut',
        });
      } else {
        door.y = state.puzzleFlags.awakening_exit_unlocked
          ? (door.getData('closedY') as number) - 58
          : door.getData('closedY') as number;
        door.alpha = state.puzzleFlags.awakening_exit_unlocked ? 0.34 : 1;
      }
    }
  }

  setQuality(quality: 'low' | 'medium'): void {
    this.quality = quality;
    this.fogOverlay?.setVisible(quality === 'medium');
    this.screenLights.forEach((light) => {
      const display = light as Phaser.GameObjects.Graphics;
      display.setBlendMode(
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
