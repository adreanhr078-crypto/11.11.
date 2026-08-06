import Phaser from 'phaser';
import type {
  AwakeningWardSaveState,
} from '../domain/awakeningWardTypes';
import { AwakeningWardScene } from './AwakeningWardScene';
import type { WardSceneBridge } from './wardSceneBridge';

export interface AwakeningWardGameHandle {
  game: Phaser.Game;
  destroy: () => void;
}

export function createAwakeningWardGame(
  parent: HTMLElement,
  bridge: WardSceneBridge,
  state: AwakeningWardSaveState,
  quality: 'low' | 'medium',
): AwakeningWardGameHandle {
  const scene = new AwakeningWardScene(bridge, state, quality);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 1280,
    height: parent.clientHeight || 720,
    backgroundColor: '#050708',
    transparent: false,
    antialias: quality === 'medium',
    pixelArt: false,
    scene: [scene],
    input: {
      activePointers: 4,
      touch: { capture: true },
      mouse: { preventDefaultWheel: true },
    },
    render: {
      powerPreference: 'high-performance',
      antialiasGL: quality === 'medium',
      roundPixels: quality === 'low',
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    banner: false,
    fps: {
      target: 60,
      min: 30,
      smoothStep: true,
    },
  });

  return {
    game,
    destroy: () => {
      bridge.destroy();
      game.destroy(true);
    },
  };
}
