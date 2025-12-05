import Phaser from 'phaser';
import { GAME_CONFIG, UI_COLORS } from '../data/config';
import { SaveSystem, PlacedSpirit } from '../systems/SaveSystem';
import { ProductionSystem } from '../systems/ProductionSystem';
import { getSpiritById, RARITY_COLORS, SpiritData, RARITY_MULTIPLIERS } from '../data/spirits';

type UpgradeTab = 'spirits' | 'garden' | 'bonuses';

export class UpgradeScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private productionSystem!: ProductionSystem;
  private contentContainer!: Phaser.GameObjects.Container;
  private essenceText!: Phaser.GameObjects.Text;
  private currentTab: UpgradeTab = 'spirits';
  private tabButtons: Map<UpgradeTab, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create(): void {
    this.saveSystem = SaveSystem.getInstance();
    this.productionSystem = ProductionSystem.getInstance();

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Main panel
    const panelWidth = GAME_CONFIG.WIDTH - 60;
    const panelHeight = GAME_CONFIG.HEIGHT - 200;
    const panelX = 30;
    const panelY = 100;

    const panel = this.add.graphics();
    panel.fillStyle(UI_COLORS.PANEL, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

    // Title
    this.add.text(GAME_CONFIG.WIDTH / 2, panelY + 40, 'Upgrades', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // Close button
    const closeBtn = this.add.text(GAME_CONFIG.WIDTH - 50, panelY + 20, 'X', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeBtn.setOrigin(0.5, 0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop());

    // Essence display
    const save = this.saveSystem.getSave();
    this.essenceText = this.add.text(GAME_CONFIG.WIDTH / 2, panelY + 80, `Essence: ${Math.floor(save.essence)}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#e056fd',
    });
    this.essenceText.setOrigin(0.5, 0.5);

    // Tab buttons
    this.createTabs(panelX + 20, panelY + 110);

    // Content container
    this.contentContainer = this.add.container(panelX + 20, panelY + 170);

    // Show default tab
    this.showTab('spirits');
  }

  private createTabs(x: number, y: number): void {
    const tabs: { key: UpgradeTab; label: string }[] = [
      { key: 'spirits', label: 'Spirit Upgrades' },
      { key: 'garden', label: 'Garden' },
      { key: 'bonuses', label: 'Bonuses' },
    ];
    const tabWidth = 200;

    tabs.forEach((tab, i) => {
      const tabX = x + i * (tabWidth + 10);
      const isActive = tab.key === this.currentTab;

      const container = this.add.container(tabX, y);

      const bg = this.add.graphics();
      bg.fillStyle(isActive ? UI_COLORS.ACCENT : UI_COLORS.PANEL_LIGHT, 1);
      bg.fillRoundedRect(0, 0, tabWidth, 45, { tl: 10, tr: 10, bl: 0, br: 0 });

      const text = this.add.text(tabWidth / 2, 22, tab.label, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: isActive ? 'bold' : 'normal',
      });
      text.setOrigin(0.5, 0.5);

      container.add([bg, text]);

      const hitArea = this.add.zone(tabWidth / 2, 22, tabWidth, 45);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.showTab(tab.key));
      container.add(hitArea);

      this.tabButtons.set(tab.key, container);
    });
  }

  private updateTabStyles(): void {
    this.tabButtons.forEach((container, key) => {
      const bg = container.list[0] as Phaser.GameObjects.Graphics;
      const text = container.list[1] as Phaser.GameObjects.Text;
      const isActive = key === this.currentTab;

      bg.clear();
      bg.fillStyle(isActive ? UI_COLORS.ACCENT : UI_COLORS.PANEL_LIGHT, 1);
      bg.fillRoundedRect(0, 0, 200, 45, { tl: 10, tr: 10, bl: 0, br: 0 });

      text.setStyle({ fontStyle: isActive ? 'bold' : 'normal' });
    });
  }

  private showTab(tab: UpgradeTab): void {
    this.currentTab = tab;
    this.updateTabStyles();
    this.contentContainer.removeAll(true);

    switch (tab) {
      case 'spirits':
        this.showSpiritUpgrades();
        break;
      case 'garden':
        this.showGardenUpgrades();
        break;
      case 'bonuses':
        this.showBonusUpgrades();
        break;
    }
  }

  private showSpiritUpgrades(): void {
    const save = this.saveSystem.getSave();

    if (save.placedSpirits.length === 0) {
      const emptyText = this.add.text(280, 150, 'No spirits placed!\nPlace spirits in the garden to upgrade them.', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#888888',
        align: 'center',
      });
      emptyText.setOrigin(0.5, 0.5);
      this.contentContainer.add(emptyText);
      return;
    }

    // Scrollable list of placed spirits
    let yOffset = 0;
    save.placedSpirits.forEach((placedSpirit) => {
      const spirit = getSpiritById(placedSpirit.spiritId);
      if (!spirit) return;

      const card = this.createSpiritUpgradeCard(placedSpirit, spirit, 0, yOffset);
      this.contentContainer.add(card);
      yOffset += 110;
    });
  }

  private createSpiritUpgradeCard(placed: PlacedSpirit, spirit: SpiritData, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const cardWidth = 620;
    const cardHeight = 100;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.GRID_CELL, 1);
    bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 12);
    bg.lineStyle(2, RARITY_COLORS[spirit.rarity], 1);
    bg.strokeRoundedRect(0, 0, cardWidth, cardHeight, 12);

    // Spirit icon
    const icon = this.add.graphics();
    icon.fillStyle(spirit.color, 1);
    icon.fillCircle(50, 50, 30);

    // Spirit info
    const name = this.add.text(100, 20, spirit.name, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    const level = this.add.text(100, 48, `Level ${placed.level} / ${GAME_CONFIG.MAX_SPIRIT_LEVEL}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaaa',
    });

    // Current production
    const production = this.productionSystem.calculateSpiritProduction(
      placed,
      this.saveSystem.getSave().placedSpirits
    );
    const prodText = this.add.text(100, 72, `Production: ${production.totalProduction.toFixed(2)}/s`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#e056fd',
    });

    container.add([bg, icon, name, level, prodText]);

    // Upgrade button (if not max level)
    if (placed.level < GAME_CONFIG.MAX_SPIRIT_LEVEL) {
      const upgradeCost = this.calculateUpgradeCost(placed, spirit);
      const canAfford = this.saveSystem.getSave().essence >= upgradeCost;

      const btnX = cardWidth - 140;
      const btnY = 25;
      const btnWidth = 120;
      const btnHeight = 50;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(canAfford ? UI_COLORS.SUCCESS : UI_COLORS.PANEL_LIGHT, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 8);

      const btnText = this.add.text(btnX + btnWidth / 2, btnY + 15, 'Upgrade', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      btnText.setOrigin(0.5, 0.5);

      const costText = this.add.text(btnX + btnWidth / 2, btnY + 35, `${upgradeCost} Essence`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: canAfford ? '#ffffff' : '#888888',
      });
      costText.setOrigin(0.5, 0.5);

      // Next level preview
      const nextProd = spirit.baseProduction * (1 + placed.level * GAME_CONFIG.SPIRIT_UPGRADE_BONUS);
      const previewText = this.add.text(btnX + btnWidth / 2, btnY + btnHeight + 8, `→ ${nextProd.toFixed(2)}/s`, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#4ade80',
      });
      previewText.setOrigin(0.5, 0.5);

      container.add([btnBg, btnText, costText, previewText]);

      if (canAfford) {
        const hitArea = this.add.zone(btnX + btnWidth / 2, btnY + btnHeight / 2, btnWidth, btnHeight);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.upgradeSpirit(placed.id));
        container.add(hitArea);
      }
    } else {
      const maxText = this.add.text(cardWidth - 80, 50, 'MAX', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#fbbf24',
        fontStyle: 'bold',
      });
      maxText.setOrigin(0.5, 0.5);
      container.add(maxText);
    }

    return container;
  }

  private calculateUpgradeCost(placed: PlacedSpirit, spirit: SpiritData): number {
    const baseCost = GAME_CONFIG.SPIRIT_UPGRADE_BASE_COST;
    const rarityMult = RARITY_MULTIPLIERS[spirit.rarity];
    const levelMult = Math.pow(GAME_CONFIG.SPIRIT_UPGRADE_COST_MULTIPLIER, placed.level - 1);
    return Math.floor(baseCost * rarityMult * levelMult);
  }

  private upgradeSpirit(spiritId: string): void {
    const save = this.saveSystem.getSave();
    const placed = save.placedSpirits.find(s => s.id === spiritId);
    if (!placed) return;

    const spirit = getSpiritById(placed.spiritId);
    if (!spirit) return;

    const cost = this.calculateUpgradeCost(placed, spirit);

    if (this.saveSystem.spendEssence(cost)) {
      placed.level++;
      this.saveSystem.save();

      // Refresh display
      this.updateEssenceDisplay();
      this.showTab('spirits');

      // Notify GameScene to update synergy visuals
      this.registry.set('refreshSynergies', true);
    }
  }

  private showGardenUpgrades(): void {
    const save = this.saveSystem.getSave();
    const currentCells = save.unlockedCells;
    const maxCells = GAME_CONFIG.MAX_GRID_SIZE;

    // Current garden info
    const infoText = this.add.text(280, 30, `Garden Size: ${currentCells} / ${maxCells} cells`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    infoText.setOrigin(0.5, 0.5);
    this.contentContainer.add(infoText);

    // Grid visualization
    const gridContainer = this.add.container(80, 70);
    const cellSize = 35;
    const cols = GAME_CONFIG.GRID_COLS;
    const rows = GAME_CONFIG.GRID_ROWS;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellIndex = row * cols + col;
        const isUnlocked = cellIndex < currentCells;

        const cell = this.add.graphics();
        cell.fillStyle(isUnlocked ? UI_COLORS.SUCCESS : UI_COLORS.GRID_CELL_LOCKED, 1);
        cell.fillRoundedRect(col * (cellSize + 5), row * (cellSize + 5), cellSize, cellSize, 4);

        if (cellIndex === currentCells && currentCells < maxCells) {
          // Next cell to unlock - highlight
          cell.lineStyle(2, 0xfbbf24, 1);
          cell.strokeRoundedRect(col * (cellSize + 5), row * (cellSize + 5), cellSize, cellSize, 4);
        }

        gridContainer.add(cell);
      }
    }
    this.contentContainer.add(gridContainer);

    // Expand button
    if (currentCells < maxCells) {
      const expansions = Math.floor((currentCells - GAME_CONFIG.STARTING_GRID_SIZE) / 1);
      const cost = Math.floor(GAME_CONFIG.GARDEN_EXPAND_BASE_COST * Math.pow(GAME_CONFIG.GARDEN_EXPAND_COST_MULTIPLIER, expansions));
      const canAfford = save.essence >= cost;

      const btnY = 320;
      const btnContainer = this.add.container(280, btnY);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(canAfford ? UI_COLORS.ACCENT : UI_COLORS.PANEL_LIGHT, 1);
      btnBg.fillRoundedRect(-100, -30, 200, 60, 12);

      const btnText = this.add.text(0, -8, 'Expand Garden', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      btnText.setOrigin(0.5, 0.5);

      const costText = this.add.text(0, 15, `${cost} Essence`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: canAfford ? '#ffffff' : '#888888',
      });
      costText.setOrigin(0.5, 0.5);

      btnContainer.add([btnBg, btnText, costText]);
      this.contentContainer.add(btnContainer);

      if (canAfford) {
        const hitArea = this.add.zone(280, btnY, 200, 60);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.expandGarden());
        this.contentContainer.add(hitArea);
      }
    } else {
      const maxText = this.add.text(280, 320, 'Garden Fully Expanded!', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#fbbf24',
        fontStyle: 'bold',
      });
      maxText.setOrigin(0.5, 0.5);
      this.contentContainer.add(maxText);
    }
  }

  private expandGarden(): void {
    const save = this.saveSystem.getSave();
    const expansions = Math.floor((save.unlockedCells - GAME_CONFIG.STARTING_GRID_SIZE) / 1);
    const cost = Math.floor(GAME_CONFIG.GARDEN_EXPAND_BASE_COST * Math.pow(GAME_CONFIG.GARDEN_EXPAND_COST_MULTIPLIER, expansions));

    if (this.saveSystem.spendEssence(cost)) {
      this.saveSystem.updateSave({ unlockedCells: save.unlockedCells + 1 });
      this.saveSystem.save();

      // Notify GameScene to refresh grid
      this.registry.set('refreshGrid', true);

      this.updateEssenceDisplay();
      this.showTab('garden');
    }
  }

  private showBonusUpgrades(): void {
    const bonuses = [
      {
        id: 'production_mult',
        name: 'Essence Multiplier',
        description: 'Increase all essence production',
        baseCost: 500,
        maxLevel: 10,
        effect: '+10% production per level',
      },
      {
        id: 'tap_duration',
        name: 'Extended Tap Bonus',
        description: 'Tap bonus lasts longer',
        baseCost: 300,
        maxLevel: 5,
        effect: '+2 seconds per level',
      },
      {
        id: 'offline_mult',
        name: 'Offline Efficiency',
        description: 'Earn more while away',
        baseCost: 400,
        maxLevel: 5,
        effect: '+10% offline efficiency per level',
      },
    ];

    let yOffset = 0;
    bonuses.forEach((bonus) => {
      const card = this.createBonusCard(bonus, 0, yOffset);
      this.contentContainer.add(card);
      yOffset += 100;
    });

    // Coming soon note
    const note = this.add.text(280, yOffset + 40, 'More bonuses coming soon!', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888',
      fontStyle: 'italic',
    });
    note.setOrigin(0.5, 0.5);
    this.contentContainer.add(note);
  }

  private createBonusCard(bonus: any, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const cardWidth = 620;
    const cardHeight = 90;

    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.GRID_CELL, 1);
    bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 12);

    const name = this.add.text(20, 15, bonus.name, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    const desc = this.add.text(20, 40, bonus.description, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaaa',
    });

    const effect = this.add.text(20, 62, bonus.effect, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#4ade80',
    });

    // Level indicator
    const levelText = this.add.text(cardWidth - 150, 20, `Lv. 0 / ${bonus.maxLevel}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    });

    // Coming soon badge
    const badge = this.add.text(cardWidth - 80, 55, 'Soon', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#fbbf24',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    });
    badge.setOrigin(0.5, 0.5);

    container.add([bg, name, desc, effect, levelText, badge]);
    return container;
  }

  private updateEssenceDisplay(): void {
    const save = this.saveSystem.getSave();
    this.essenceText.setText(`Essence: ${Math.floor(save.essence)}`);
  }

  update(): void {
    // Keep essence display updated
    const save = this.saveSystem.getSave();
    this.essenceText.setText(`Essence: ${Math.floor(save.essence)}`);
  }
}
