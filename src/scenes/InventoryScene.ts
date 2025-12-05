import Phaser from 'phaser';
import { GAME_CONFIG, UI_COLORS } from '../data/config';
import { SaveSystem } from '../systems/SaveSystem';
import { getSpiritById, RARITY_COLORS, SPIRITS, SpiritData } from '../data/spirits';

export class InventoryScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private inventoryContainer!: Phaser.GameObjects.Container;
  private detailContainer!: Phaser.GameObjects.Container;
  private selectedSpirit: SpiritData | null = null;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  create(): void {
    this.saveSystem = SaveSystem.getInstance();

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      Phaser.Geom.Rectangle.Contains
    );

    // Main panel
    const panelWidth = GAME_CONFIG.WIDTH - 60;
    const panelHeight = GAME_CONFIG.HEIGHT - 200;
    const panelX = 30;
    const panelY = 100;

    const panel = this.add.graphics();
    panel.fillStyle(UI_COLORS.PANEL, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

    // Title
    this.add.text(GAME_CONFIG.WIDTH / 2, panelY + 40, 'Spirit Inventory', {
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

    // Tab buttons
    this.createTabs(panelX + 20, panelY + 80);

    // Inventory container
    this.inventoryContainer = this.add.container(panelX + 20, panelY + 140);
    this.displayInventory();

    // Detail container (hidden by default)
    this.detailContainer = this.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    this.detailContainer.setVisible(false);
  }

  private createTabs(x: number, y: number): void {
    const tabs = ['Inventory', 'Collection', 'Placed'];
    const tabWidth = 180;

    tabs.forEach((tab, i) => {
      const tabX = x + i * (tabWidth + 10);
      const isActive = i === 0;

      const bg = this.add.graphics();
      bg.fillStyle(isActive ? UI_COLORS.ACCENT : UI_COLORS.PANEL_LIGHT, 1);
      bg.fillRoundedRect(tabX, y, tabWidth, 40, { tl: 10, tr: 10, bl: 0, br: 0 });

      const text = this.add.text(tabX + tabWidth / 2, y + 20, tab, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: isActive ? 'bold' : 'normal',
      });
      text.setOrigin(0.5, 0.5);

      bg.setInteractive(
        new Phaser.Geom.Rectangle(tabX, y, tabWidth, 40),
        Phaser.Geom.Rectangle.Contains
      );
      bg.on('pointerdown', () => this.switchTab(i));
    });
  }

  private switchTab(tabIndex: number): void {
    // Simplified - just show inventory for now
    this.inventoryContainer.removeAll(true);

    switch (tabIndex) {
      case 0:
        this.displayInventory();
        break;
      case 1:
        this.displayCollection();
        break;
      case 2:
        this.displayPlaced();
        break;
    }
  }

  private displayInventory(): void {
    const save = this.saveSystem.getSave();
    const itemsPerRow = 5;
    const itemSize = 110;
    const spacing = 10;

    let index = 0;
    save.inventory.forEach((item) => {
      if (item.count <= 0) return;

      const spirit = getSpiritById(item.spiritId);
      if (!spirit) return;

      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = col * (itemSize + spacing);
      const y = row * (itemSize + spacing);

      this.createInventoryItem(spirit, item.count, x, y, itemSize);
      index++;
    });

    if (index === 0) {
      const emptyText = this.add.text(250, 200, 'No spirits in inventory!\nSummon some spirits first.', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#888888',
        align: 'center',
      });
      emptyText.setOrigin(0.5, 0.5);
      this.inventoryContainer.add(emptyText);
    }
  }

  private displayCollection(): void {
    const save = this.saveSystem.getSave();
    const itemsPerRow = 5;
    const itemSize = 110;
    const spacing = 10;

    // Get all owned spirit IDs
    const ownedIds = new Set<string>();
    save.inventory.forEach(item => ownedIds.add(item.spiritId));
    save.placedSpirits.forEach(spirit => ownedIds.add(spirit.spiritId));

    SPIRITS.forEach((spirit, index) => {
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = col * (itemSize + spacing);
      const y = row * (itemSize + spacing);

      const isOwned = ownedIds.has(spirit.id);
      this.createCollectionItem(spirit, isOwned, x, y, itemSize);
    });
  }

  private displayPlaced(): void {
    const save = this.saveSystem.getSave();
    const itemsPerRow = 5;
    const itemSize = 110;
    const spacing = 10;

    save.placedSpirits.forEach((placedSpirit, index) => {
      const spirit = getSpiritById(placedSpirit.spiritId);
      if (!spirit) return;

      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = col * (itemSize + spacing);
      const y = row * (itemSize + spacing);

      this.createPlacedItem(spirit, placedSpirit.level, x, y, itemSize);
    });

    if (save.placedSpirits.length === 0) {
      const emptyText = this.add.text(250, 200, 'No spirits placed in garden!\nPlace spirits from inventory.', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#888888',
        align: 'center',
      });
      emptyText.setOrigin(0.5, 0.5);
      this.inventoryContainer.add(emptyText);
    }
  }

  private createInventoryItem(spirit: SpiritData, count: number, x: number, y: number, size: number): void {
    const container = this.add.container(x, y);
    const rarityColor = RARITY_COLORS[spirit.rarity];

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.GRID_CELL, 1);
    bg.fillRoundedRect(0, 0, size, size, 10);
    bg.lineStyle(2, rarityColor, 1);
    bg.strokeRoundedRect(0, 0, size, size, 10);

    // Spirit visual
    const spiritGlow = this.add.graphics();
    spiritGlow.fillStyle(spirit.color, 0.3);
    spiritGlow.fillCircle(size / 2, size / 2 - 10, 30);

    const spiritBody = this.add.graphics();
    spiritBody.fillStyle(spirit.color, 1);
    spiritBody.fillCircle(size / 2, size / 2 - 10, 22);

    // Count badge
    if (count > 1) {
      const countBg = this.add.graphics();
      countBg.fillStyle(0x000000, 0.7);
      countBg.fillCircle(size - 15, 15, 14);

      const countText = this.add.text(size - 15, 15, `${count}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      countText.setOrigin(0.5, 0.5);
      container.add([countBg, countText]);
    }

    // Name
    const name = this.add.text(size / 2, size - 12, spirit.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
    });
    name.setOrigin(0.5, 0.5);

    container.add([bg, spiritGlow, spiritBody, name]);
    container.setSize(size, size);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => this.showSpiritDetail(spirit, true));

    this.inventoryContainer.add(container);
  }

  private createCollectionItem(spirit: SpiritData, isOwned: boolean, x: number, y: number, size: number): void {
    const container = this.add.container(x, y);
    const rarityColor = RARITY_COLORS[spirit.rarity];

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(isOwned ? UI_COLORS.GRID_CELL : UI_COLORS.GRID_CELL_LOCKED, 1);
    bg.fillRoundedRect(0, 0, size, size, 10);
    if (isOwned) {
      bg.lineStyle(2, rarityColor, 1);
      bg.strokeRoundedRect(0, 0, size, size, 10);
    }

    // Spirit visual (or silhouette)
    if (isOwned) {
      const spiritBody = this.add.graphics();
      spiritBody.fillStyle(spirit.color, 1);
      spiritBody.fillCircle(size / 2, size / 2 - 10, 22);
      container.add(spiritBody);
    } else {
      const silhouette = this.add.graphics();
      silhouette.fillStyle(0x333333, 1);
      silhouette.fillCircle(size / 2, size / 2 - 10, 22);

      const question = this.add.text(size / 2, size / 2 - 10, '?', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#555555',
        fontStyle: 'bold',
      });
      question.setOrigin(0.5, 0.5);
      container.add([silhouette, question]);
    }

    // Name
    const name = this.add.text(size / 2, size - 12, isOwned ? spirit.name : '???', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: isOwned ? '#ffffff' : '#555555',
    });
    name.setOrigin(0.5, 0.5);

    container.add([bg, name]);
    container.setSize(size, size);

    if (isOwned) {
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.showSpiritDetail(spirit, false));
    }

    this.inventoryContainer.add(container);
  }

  private createPlacedItem(spirit: SpiritData, level: number, x: number, y: number, size: number): void {
    const container = this.add.container(x, y);
    const rarityColor = RARITY_COLORS[spirit.rarity];

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.GRID_CELL, 1);
    bg.fillRoundedRect(0, 0, size, size, 10);
    bg.lineStyle(2, rarityColor, 1);
    bg.strokeRoundedRect(0, 0, size, size, 10);

    // Spirit visual
    const spiritBody = this.add.graphics();
    spiritBody.fillStyle(spirit.color, 1);
    spiritBody.fillCircle(size / 2, size / 2 - 10, 22);

    // Level badge
    const levelBg = this.add.graphics();
    levelBg.fillStyle(UI_COLORS.SUCCESS, 1);
    levelBg.fillCircle(size - 15, 15, 14);

    const levelText = this.add.text(size - 15, 15, `${level}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setOrigin(0.5, 0.5);

    // Name
    const name = this.add.text(size / 2, size - 12, spirit.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
    });
    name.setOrigin(0.5, 0.5);

    container.add([bg, spiritBody, levelBg, levelText, name]);
    container.setSize(size, size);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => this.showSpiritDetail(spirit, false));

    this.inventoryContainer.add(container);
  }

  private showSpiritDetail(spirit: SpiritData, canPlace: boolean): void {
    this.selectedSpirit = spirit;
    this.detailContainer.removeAll(true);

    const rarityColor = RARITY_COLORS[spirit.rarity];

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT),
      Phaser.Geom.Rectangle.Contains
    );
    overlay.on('pointerdown', () => this.hideDetail());
    this.detailContainer.add(overlay);

    // Card
    const card = this.add.graphics();
    card.fillStyle(UI_COLORS.PANEL, 1);
    card.fillRoundedRect(-150, -220, 300, 440, 20);
    card.lineStyle(4, rarityColor, 1);
    card.strokeRoundedRect(-150, -220, 300, 440, 20);
    this.detailContainer.add(card);

    // Spirit visual (larger)
    const spiritGlow = this.add.graphics();
    spiritGlow.fillStyle(spirit.color, 0.3);
    spiritGlow.fillCircle(0, -100, 70);
    this.detailContainer.add(spiritGlow);

    const spiritBody = this.add.graphics();
    spiritBody.fillStyle(spirit.color, 1);
    spiritBody.fillCircle(0, -100, 50);
    this.detailContainer.add(spiritBody);

    const spiritHighlight = this.add.graphics();
    spiritHighlight.fillStyle(spirit.secondaryColor, 0.7);
    spiritHighlight.fillCircle(-12, -115, 18);
    this.detailContainer.add(spiritHighlight);

    // Name
    const name = this.add.text(0, -10, spirit.name, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5, 0.5);
    this.detailContainer.add(name);

    // Rarity
    const rarity = this.add.text(0, 25, spirit.rarity.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: Phaser.Display.Color.IntegerToColor(rarityColor).rgba,
      fontStyle: 'bold',
    });
    rarity.setOrigin(0.5, 0.5);
    this.detailContainer.add(rarity);

    // Element
    const element = this.add.text(0, 55, `Element: ${spirit.element.charAt(0).toUpperCase() + spirit.element.slice(1)}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#aaaaaa',
    });
    element.setOrigin(0.5, 0.5);
    this.detailContainer.add(element);

    // Production
    const production = this.add.text(0, 85, `Production: ${spirit.baseProduction}/s`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e056fd',
    });
    production.setOrigin(0.5, 0.5);
    this.detailContainer.add(production);

    // Description
    const desc = this.add.text(0, 125, spirit.description, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
      wordWrap: { width: 250 },
      align: 'center',
    });
    desc.setOrigin(0.5, 0.5);
    this.detailContainer.add(desc);

    // Synergies
    if (spirit.synergies && spirit.synergies.length > 0) {
      const synergies = this.add.text(0, 170, `Synergies: ${spirit.synergies.join(', ')}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#4ade80',
      });
      synergies.setOrigin(0.5, 0.5);
      this.detailContainer.add(synergies);
    }

    // Place button (if in inventory)
    if (canPlace) {
      const placeBtn = this.add.container(0, 200);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(UI_COLORS.ACCENT, 1);
      btnBg.fillRoundedRect(-70, -22, 140, 44, 10);

      const btnText = this.add.text(0, 0, 'Place in Garden', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      btnText.setOrigin(0.5, 0.5);

      placeBtn.add([btnBg, btnText]);
      placeBtn.setSize(140, 44);
      placeBtn.setInteractive({ useHandCursor: true });

      placeBtn.on('pointerdown', () => {
        // Use registry to pass data between scenes (more reliable than events)
        this.registry.set('placingSpirit', spirit.id);
        this.scene.stop();
      });

      this.detailContainer.add(placeBtn);
    }

    this.detailContainer.setVisible(true);
  }

  private hideDetail(): void {
    this.detailContainer.setVisible(false);
    this.selectedSpirit = null;
  }
}
