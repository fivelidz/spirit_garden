import Phaser from 'phaser';
import { GAME_CONFIG, UI_COLORS } from '../data/config';
import { SaveSystem } from '../systems/SaveSystem';
import { ProductionSystem } from '../systems/ProductionSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(UI_COLORS.PANEL, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(UI_COLORS.ACCENT, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate spirit textures programmatically
    this.generateSpiritTextures();
  }

  private generateSpiritTextures(): void {
    // We'll generate textures in create() instead since we need graphics
  }

  create(): void {
    // Initialize systems
    const saveSystem = SaveSystem.getInstance();
    const productionSystem = ProductionSystem.getInstance();

    // Calculate offline progress
    const save = saveSystem.getSave();
    const now = Date.now();
    const elapsedMs = now - save.lastSaveTime;

    if (elapsedMs > 60000) { // More than 1 minute
      const offlineEssence = productionSystem.calculateOfflineEssence(elapsedMs);
      if (offlineEssence > 0) {
        saveSystem.addEssence(offlineEssence);
        saveSystem.save();

        // Show offline earnings popup (will be shown in GameScene)
        this.registry.set('offlineEarnings', {
          essence: offlineEssence,
          time: elapsedMs,
        });
      }
    }

    // Create common textures
    this.createCommonTextures();

    // Go to game scene
    this.scene.start('GameScene');
  }

  private createCommonTextures(): void {
    // Create particle texture
    const particleGraphics = this.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillCircle(4, 4, 4);
    particleGraphics.generateTexture('particle', 8, 8);
    particleGraphics.destroy();

    // Create button texture
    const buttonGraphics = this.make.graphics({ x: 0, y: 0 });
    buttonGraphics.fillStyle(UI_COLORS.BUTTON, 1);
    buttonGraphics.fillRoundedRect(0, 0, 200, 60, 10);
    buttonGraphics.generateTexture('button', 200, 60);
    buttonGraphics.destroy();

    // Create panel texture
    const panelGraphics = this.make.graphics({ x: 0, y: 0 });
    panelGraphics.fillStyle(UI_COLORS.PANEL, 1);
    panelGraphics.fillRoundedRect(0, 0, 100, 100, 8);
    panelGraphics.generateTexture('panel', 100, 100);
    panelGraphics.destroy();

    // Create grid cell texture
    const cellGraphics = this.make.graphics({ x: 0, y: 0 });
    cellGraphics.fillStyle(UI_COLORS.GRID_CELL, 1);
    cellGraphics.fillRoundedRect(0, 0, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4, 8);
    cellGraphics.lineStyle(2, UI_COLORS.PANEL_LIGHT, 1);
    cellGraphics.strokeRoundedRect(0, 0, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4, 8);
    cellGraphics.generateTexture('cell', GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
    cellGraphics.destroy();

    // Create locked cell texture
    const lockedCellGraphics = this.make.graphics({ x: 0, y: 0 });
    lockedCellGraphics.fillStyle(UI_COLORS.GRID_CELL_LOCKED, 1);
    lockedCellGraphics.fillRoundedRect(0, 0, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4, 8);
    lockedCellGraphics.generateTexture('cell_locked', GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
    lockedCellGraphics.destroy();
  }
}
