import Phaser from 'phaser';
import { GAME_CONFIG, UI_COLORS } from './data/config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { SummonScene } from './scenes/SummonScene';
import { InventoryScene } from './scenes/InventoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: UI_COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene, SummonScene, InventoryScene],
};

new Phaser.Game(config);
