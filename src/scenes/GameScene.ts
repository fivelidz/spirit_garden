import Phaser from 'phaser';
import { GAME_CONFIG, UI_COLORS } from '../data/config';
import { SaveSystem, PlacedSpirit } from '../systems/SaveSystem';
import { ProductionSystem } from '../systems/ProductionSystem';
import { getSpiritById, RARITY_COLORS, SpiritData } from '../data/spirits';
import { drawStar, drawDiamond } from '../utils/graphics';

interface SpiritGameObject {
  container: Phaser.GameObjects.Container;
  data: PlacedSpirit;
  spiritData: SpiritData;
  baseY: number;
  floatOffset: number;
  synergyGlow?: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private productionSystem!: ProductionSystem;

  private essenceText!: Phaser.GameObjects.Text;
  private gemsText!: Phaser.GameObjects.Text;
  private productionText!: Phaser.GameObjects.Text;
  private tapBonusBar!: Phaser.GameObjects.Graphics;

  private gridCells: Phaser.GameObjects.Image[][] = [];
  private spirits: Map<string, SpiritGameObject> = new Map();
  private synergyLines!: Phaser.GameObjects.Graphics;
  private placementIndicator!: Phaser.GameObjects.Text;

  private selectedInventorySpirit: string | null = null;
  private autoSaveTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.saveSystem = SaveSystem.getInstance();
    this.productionSystem = ProductionSystem.getInstance();

    this.createUI();
    this.createGrid();

    // Create synergy lines layer (below spirits)
    this.synergyLines = this.add.graphics();

    this.loadSpirits();
    this.setupAutoSave();

    // Draw initial synergy connections
    this.updateSynergyVisuals();

    // Check for offline earnings
    const offlineEarnings = this.registry.get('offlineEarnings');
    if (offlineEarnings) {
      this.showOfflinePopup(offlineEarnings.essence, offlineEarnings.time);
      this.registry.remove('offlineEarnings');
    }

    // Placement indicator (hidden by default)
    this.placementIndicator = this.add.text(GAME_CONFIG.WIDTH / 2, 150, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#4ade80',
      backgroundColor: '#000000cc',
      padding: { x: 15, y: 8 },
    });
    this.placementIndicator.setOrigin(0.5, 0.5);
    this.placementIndicator.setVisible(false);
    this.placementIndicator.setDepth(100);

    // Listen for inventory selection (legacy support)
    this.events.on('placeSpirit', this.handlePlaceSpirit, this);
  }

  private createUI(): void {
    const save = this.saveSystem.getSave();

    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(UI_COLORS.PANEL, 0.9);
    topBar.fillRect(0, 0, GAME_CONFIG.WIDTH, 80);

    // Essence display
    const essenceIcon = this.add.graphics();
    essenceIcon.fillStyle(0x9b59b6, 1);
    essenceIcon.fillCircle(40, 40, 20);
    essenceIcon.fillStyle(0xe056fd, 1);
    essenceIcon.fillCircle(40, 38, 12);

    this.essenceText = this.add.text(70, 30, `${Math.floor(save.essence)}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Gems display
    const gemIcon = this.add.graphics();
    gemIcon.fillStyle(0x3498db, 1);
    drawDiamond(gemIcon, GAME_CONFIG.WIDTH - 150, 40, 24, 30);

    this.gemsText = this.add.text(GAME_CONFIG.WIDTH - 120, 30, `${save.gems}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Production rate
    this.productionText = this.add.text(GAME_CONFIG.WIDTH / 2, 55, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaaa',
    });
    this.productionText.setOrigin(0.5, 0.5);

    // Tap bonus bar (hidden by default)
    this.tapBonusBar = this.add.graphics();
    this.tapBonusBar.setVisible(false);

    // Title
    this.add.text(GAME_CONFIG.WIDTH / 2, 100, 'Spirit Garden', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Bottom buttons
    this.createBottomButtons();
  }

  private createBottomButtons(): void {
    const buttonY = GAME_CONFIG.HEIGHT - 100;
    const buttonWidth = 180;
    const buttonHeight = 70;
    const spacing = 20;
    const startX = (GAME_CONFIG.WIDTH - (buttonWidth * 3 + spacing * 2)) / 2;

    // Summon button
    const summonBtn = this.createButton(
      startX + buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Summon',
      UI_COLORS.ACCENT,
      () => this.scene.launch('SummonScene')
    );

    // Inventory button
    const inventoryBtn = this.createButton(
      startX + buttonWidth * 1.5 + spacing,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Inventory',
      UI_COLORS.BUTTON,
      () => this.scene.launch('InventoryScene')
    );

    // Upgrade button (placeholder)
    const upgradeBtn = this.createButton(
      startX + buttonWidth * 2.5 + spacing * 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Upgrades',
      UI_COLORS.PANEL_LIGHT,
      () => this.showMessage('Coming soon!')
    );
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5, 0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', callback);
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(Phaser.Display.Color.GetColor(
        Math.min(255, ((color >> 16) & 0xff) + 30),
        Math.min(255, ((color >> 8) & 0xff) + 30),
        Math.min(255, (color & 0xff) + 30)
      ), 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    });

    return container;
  }

  private createGrid(): void {
    const save = this.saveSystem.getSave();
    const startX = GAME_CONFIG.GRID_OFFSET_X;
    const startY = GAME_CONFIG.GRID_OFFSET_Y;

    for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
      this.gridCells[row] = [];
      for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
        const cellIndex = row * GAME_CONFIG.GRID_COLS + col;
        const isUnlocked = cellIndex < save.unlockedCells;

        const x = startX + col * GAME_CONFIG.CELL_SIZE;
        const y = startY + row * GAME_CONFIG.CELL_SIZE;

        const cell = this.add.image(x, y, isUnlocked ? 'cell' : 'cell_locked');
        cell.setOrigin(0, 0);
        cell.setData('gridX', col);
        cell.setData('gridY', row);
        cell.setData('unlocked', isUnlocked);

        if (isUnlocked) {
          cell.setInteractive({ useHandCursor: true });
          cell.on('pointerdown', () => this.onCellClick(col, row));
          cell.on('pointerover', () => {
            if (!this.saveSystem.getSpiritAtPosition(col, row)) {
              cell.setTint(UI_COLORS.GRID_CELL_HOVER);
            }
          });
          cell.on('pointerout', () => cell.clearTint());
        }

        this.gridCells[row][col] = cell;
      }
    }
  }

  private loadSpirits(): void {
    const save = this.saveSystem.getSave();

    save.placedSpirits.forEach((spirit) => {
      this.createSpiritVisual(spirit);
    });
  }

  private createSpiritVisual(spirit: PlacedSpirit): void {
    const spiritData = getSpiritById(spirit.spiritId);
    if (!spiritData) return;

    const x = GAME_CONFIG.GRID_OFFSET_X + spirit.gridX * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const y = GAME_CONFIG.GRID_OFFSET_Y + spirit.gridY * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

    const container = this.add.container(x, y);

    // Create spirit body (circle with glow effect)
    const glow = this.add.graphics();
    glow.fillStyle(spiritData.color, 0.3);
    glow.fillCircle(0, 0, 35);

    const body = this.add.graphics();
    body.fillStyle(spiritData.color, 1);
    body.fillCircle(0, 0, 25);

    // Inner highlight
    const highlight = this.add.graphics();
    highlight.fillStyle(spiritData.secondaryColor, 0.7);
    highlight.fillCircle(-5, -8, 10);

    // Eyes
    const eyeLeft = this.add.graphics();
    eyeLeft.fillStyle(0xffffff, 1);
    eyeLeft.fillCircle(-8, -3, 6);
    eyeLeft.fillStyle(0x000000, 1);
    eyeLeft.fillCircle(-7, -2, 3);

    const eyeRight = this.add.graphics();
    eyeRight.fillStyle(0xffffff, 1);
    eyeRight.fillCircle(8, -3, 6);
    eyeRight.fillStyle(0x000000, 1);
    eyeRight.fillCircle(9, -2, 3);

    // Mouth (happy smile)
    const mouth = this.add.graphics();
    mouth.lineStyle(2, 0x000000, 0.5);
    mouth.beginPath();
    mouth.arc(0, 5, 8, 0.2, Math.PI - 0.2, false);
    mouth.strokePath();

    // Rarity indicator (small star for rare+)
    if (spiritData.rarity !== 'common') {
      const rarityColor = RARITY_COLORS[spiritData.rarity];
      const star = this.add.graphics();
      star.fillStyle(rarityColor, 1);
      drawStar(star, 0, -35, 5, 4, 8);
      container.add(star);
    }

    // Level indicator
    const levelBg = this.add.graphics();
    levelBg.fillStyle(0x000000, 0.5);
    levelBg.fillCircle(20, 20, 12);
    const levelText = this.add.text(20, 20, `${spirit.level}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setOrigin(0.5, 0.5);

    container.add([glow, body, highlight, eyeLeft, eyeRight, mouth, levelBg, levelText]);

    // Make interactive
    container.setSize(60, 60);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => this.onSpiritClick(spirit));

    // Store reference
    this.spirits.set(spirit.id, {
      container,
      data: spirit,
      spiritData,
      baseY: y,
      floatOffset: Math.random() * Math.PI * 2,
    });
  }

  private onCellClick(gridX: number, gridY: number): void {
    const existingSpirit = this.saveSystem.getSpiritAtPosition(gridX, gridY);

    if (existingSpirit) {
      // Spirit already here, activate tap bonus
      this.productionSystem.activateTapBonus();
      this.showTapEffect(gridX, gridY);
      return;
    }

    // Check if we're placing a spirit from inventory
    if (this.selectedInventorySpirit) {
      this.placeSpiritFromInventory(this.selectedInventorySpirit, gridX, gridY);
      this.selectedInventorySpirit = null;
    }
  }

  private onSpiritClick(spirit: PlacedSpirit): void {
    // If placing spirit, cancel placement mode
    if (this.selectedInventorySpirit) {
      this.cancelPlacement();
      return;
    }

    // Activate tap bonus
    this.productionSystem.activateTapBonus();

    // Show production info
    const spiritData = getSpiritById(spirit.spiritId);
    if (spiritData) {
      const production = this.productionSystem.calculateSpiritProduction(
        spirit,
        this.saveSystem.getSave().placedSpirits
      );

      let message = `${spiritData.name} (Lv.${spirit.level})\n`;
      message += `Production: ${production.totalProduction.toFixed(1)}/s`;

      if (production.synergyBonus > 0) {
        message += `\n+${(production.synergyBonus * 100).toFixed(0)}% Synergy Bonus!`;
      }

      this.showMessage(message);
    }

    // Tap visual effect
    const spiritObj = this.spirits.get(spirit.id);
    if (spiritObj) {
      this.tweens.add({
        targets: spiritObj.container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
      });

      // Particles
      this.createTapParticles(
        spiritObj.container.x,
        spiritObj.container.y,
        spiritObj.spiritData.color
      );
    }
  }

  private showTapEffect(gridX: number, gridY: number): void {
    const x = GAME_CONFIG.GRID_OFFSET_X + gridX * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const y = GAME_CONFIG.GRID_OFFSET_Y + gridY * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    this.createTapParticles(x, y, 0xffffff);
  }

  private createTapParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 4);
      particle.setPosition(x, y);

      const angle = (i / 8) * Math.PI * 2;
      const distance = 40 + Math.random() * 20;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private handlePlaceSpirit(spiritId: string): void {
    this.selectedInventorySpirit = spiritId;
    const spiritData = getSpiritById(spiritId);
    if (spiritData) {
      this.placementIndicator.setText(`Placing: ${spiritData.name} - Tap an empty cell`);
      this.placementIndicator.setVisible(true);
      // Highlight available cells
      this.highlightEmptyCells(true);
    }
  }

  private highlightEmptyCells(highlight: boolean): void {
    const save = this.saveSystem.getSave();
    for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
        const cellIndex = row * GAME_CONFIG.GRID_COLS + col;
        if (cellIndex >= save.unlockedCells) continue;

        const cell = this.gridCells[row][col];
        const hasSpirit = save.placedSpirits.some(s => s.gridX === col && s.gridY === row);

        if (highlight && !hasSpirit) {
          cell.setTint(0x4ade80); // Green tint for available cells
        } else {
          cell.clearTint();
        }
      }
    }
  }

  private cancelPlacement(): void {
    this.selectedInventorySpirit = null;
    this.placementIndicator.setVisible(false);
    this.highlightEmptyCells(false);
  }

  private placeSpiritFromInventory(spiritId: string, gridX: number, gridY: number): void {
    if (!this.saveSystem.removeFromInventory(spiritId)) {
      return;
    }

    const newSpirit: PlacedSpirit = {
      id: `spirit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      spiritId,
      gridX,
      gridY,
      level: 1,
      experience: 0,
    };

    this.saveSystem.placeSpirit(newSpirit);
    this.saveSystem.save();
    this.createSpiritVisual(newSpirit);

    // Update synergy visuals
    this.updateSynergyVisuals();

    // Hide placement UI
    this.placementIndicator.setVisible(false);
    this.highlightEmptyCells(false);

    // Show success message
    const spiritData = getSpiritById(spiritId);
    if (spiritData) {
      this.showMessage(`${spiritData.name} placed!`);
    }
  }

  private updateSynergyVisuals(): void {
    this.synergyLines.clear();

    const save = this.saveSystem.getSave();
    const drawnConnections = new Set<string>();

    save.placedSpirits.forEach((spirit) => {
      const spiritData = getSpiritById(spirit.spiritId);
      if (!spiritData || !spiritData.synergies) return;

      const spiritX = GAME_CONFIG.GRID_OFFSET_X + spirit.gridX * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const spiritY = GAME_CONFIG.GRID_OFFSET_Y + spirit.gridY * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

      // Check adjacent spirits
      const adjacentPositions = [
        { x: spirit.gridX - 1, y: spirit.gridY },
        { x: spirit.gridX + 1, y: spirit.gridY },
        { x: spirit.gridX, y: spirit.gridY - 1 },
        { x: spirit.gridX, y: spirit.gridY + 1 },
      ];

      adjacentPositions.forEach((pos) => {
        const adjacentSpirit = save.placedSpirits.find(
          (s) => s.gridX === pos.x && s.gridY === pos.y
        );
        if (!adjacentSpirit) return;

        const adjacentData = getSpiritById(adjacentSpirit.spiritId);
        if (!adjacentData) return;

        // Check if this spirit has synergy with adjacent spirit
        if (spiritData.synergies?.includes(adjacentData.element)) {
          // Create unique key to avoid drawing same line twice
          const key = [spirit.id, adjacentSpirit.id].sort().join('-');
          if (drawnConnections.has(key)) return;
          drawnConnections.add(key);

          const adjX = GAME_CONFIG.GRID_OFFSET_X + pos.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
          const adjY = GAME_CONFIG.GRID_OFFSET_Y + pos.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

          // Draw glowing synergy line
          this.synergyLines.lineStyle(6, 0x4ade80, 0.3);
          this.synergyLines.lineBetween(spiritX, spiritY, adjX, adjY);
          this.synergyLines.lineStyle(3, 0x4ade80, 0.6);
          this.synergyLines.lineBetween(spiritX, spiritY, adjX, adjY);
          this.synergyLines.lineStyle(1, 0xffffff, 0.8);
          this.synergyLines.lineBetween(spiritX, spiritY, adjX, adjY);
        }
      });

      // Update spirit's synergy glow
      const spiritObj = this.spirits.get(spirit.id);
      if (spiritObj) {
        const hasSynergy = this.productionSystem.calculateSpiritProduction(
          spirit,
          save.placedSpirits
        ).synergyBonus > 0;

        if (hasSynergy && !spiritObj.synergyGlow) {
          // Add synergy glow effect
          const glow = this.add.graphics();
          glow.lineStyle(3, 0x4ade80, 0.5);
          glow.strokeCircle(0, 0, 38);
          spiritObj.container.addAt(glow, 0);
          spiritObj.synergyGlow = glow;
        } else if (!hasSynergy && spiritObj.synergyGlow) {
          spiritObj.synergyGlow.destroy();
          spiritObj.synergyGlow = undefined;
        }
      }
    });
  }

  private showMessage(text: string): void {
    const msg = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 100, text, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 20, y: 10 },
      align: 'center',
    });
    msg.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: msg.y - 50,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => msg.destroy(),
    });
  }

  private showOfflinePopup(essence: number, timeMs: number): void {
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    const popup = this.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);

    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.PANEL, 1);
    bg.fillRoundedRect(-200, -120, 400, 240, 16);

    const title = this.add.text(0, -80, 'Welcome Back!', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0.5);

    const timeText = this.add.text(0, -30, `You were away for ${hours}h ${minutes}m`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#aaaaaa',
    });
    timeText.setOrigin(0.5, 0.5);

    const essenceText = this.add.text(0, 20, `+${essence} Essence`, {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#e056fd',
      fontStyle: 'bold',
    });
    essenceText.setOrigin(0.5, 0.5);

    const collectBtn = this.add.graphics();
    collectBtn.fillStyle(UI_COLORS.ACCENT, 1);
    collectBtn.fillRoundedRect(-80, 60, 160, 50, 10);

    const collectText = this.add.text(0, 85, 'Collect', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    collectText.setOrigin(0.5, 0.5);

    popup.add([bg, title, timeText, essenceText, collectBtn, collectText]);

    const hitArea = this.add.zone(0, 85, 160, 50);
    hitArea.setInteractive({ useHandCursor: true });
    popup.add(hitArea);

    hitArea.on('pointerdown', () => {
      overlay.destroy();
      popup.destroy();
    });
  }

  private setupAutoSave(): void {
    this.autoSaveTimer = this.time.addEvent({
      delay: GAME_CONFIG.AUTO_SAVE_INTERVAL,
      callback: () => this.saveSystem.save(),
      loop: true,
    });
  }

  update(time: number, delta: number): void {
    // Check for spirit placement from inventory (via registry)
    const placingSpirit = this.registry.get('placingSpirit');
    if (placingSpirit) {
      this.registry.remove('placingSpirit');
      this.handlePlaceSpirit(placingSpirit);
    }

    // Update production
    this.productionSystem.tick();

    // Update UI
    const save = this.saveSystem.getSave();
    this.essenceText.setText(`${Math.floor(save.essence)}`);
    this.gemsText.setText(`${save.gems}`);

    const production = this.productionSystem.getProductionPerSecond();
    this.productionText.setText(`+${production.toFixed(1)}/s`);

    // Update tap bonus bar
    if (this.productionSystem.isTapBonusActive()) {
      const remaining = this.productionSystem.getTapBonusRemainingTime();
      const progress = remaining / GAME_CONFIG.TAP_BONUS_DURATION;

      this.tapBonusBar.setVisible(true);
      this.tapBonusBar.clear();
      this.tapBonusBar.fillStyle(UI_COLORS.SUCCESS, 0.8);
      this.tapBonusBar.fillRect(10, 85, (GAME_CONFIG.WIDTH - 20) * progress, 6);
    } else {
      this.tapBonusBar.setVisible(false);
    }

    // Animate spirits (floating)
    this.spirits.forEach((spirit) => {
      const floatY = Math.sin(time * GAME_CONFIG.SPIRIT_FLOAT_SPEED + spirit.floatOffset) *
                     GAME_CONFIG.SPIRIT_FLOAT_AMPLITUDE;
      spirit.container.y = spirit.baseY + floatY;

      // Pulse synergy glow
      if (spirit.synergyGlow) {
        const pulse = 0.5 + Math.sin(time * 0.003) * 0.3;
        spirit.synergyGlow.setAlpha(pulse);
      }
    });
  }

  shutdown(): void {
    this.saveSystem.save();
    if (this.autoSaveTimer) {
      this.autoSaveTimer.destroy();
    }
  }
}
