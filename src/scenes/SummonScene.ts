import Phaser from 'phaser';
import { GAME_CONFIG, UI_COLORS } from '../data/config';
import { SaveSystem } from '../systems/SaveSystem';
import { GachaSystem, SummonResult } from '../systems/GachaSystem';
import { RARITY_COLORS, SpiritData } from '../data/spirits';

export class SummonScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private gachaSystem!: GachaSystem;
  private essenceText!: Phaser.GameObjects.Text;
  private resultContainer!: Phaser.GameObjects.Container;
  private isAnimating: boolean = false;

  constructor() {
    super({ key: 'SummonScene' });
  }

  create(): void {
    this.saveSystem = SaveSystem.getInstance();
    this.gachaSystem = GachaSystem.getInstance();

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
    this.add.text(GAME_CONFIG.WIDTH / 2, panelY + 40, 'Spirit Summon', {
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
    this.essenceText = this.add.text(GAME_CONFIG.WIDTH / 2, panelY + 90, `Essence: ${Math.floor(save.essence)}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#e056fd',
    });
    this.essenceText.setOrigin(0.5, 0.5);

    // Summon portal graphic
    this.createSummonPortal(GAME_CONFIG.WIDTH / 2, panelY + 280);

    // Single summon button
    this.createSummonButton(
      GAME_CONFIG.WIDTH / 2 - 110,
      panelY + panelHeight - 150,
      'Summon x1',
      `${GAME_CONFIG.SINGLE_SUMMON_COST}`,
      () => this.performSingleSummon()
    );

    // Multi summon button
    this.createSummonButton(
      GAME_CONFIG.WIDTH / 2 + 110,
      panelY + panelHeight - 150,
      'Summon x10',
      `${GAME_CONFIG.MULTI_SUMMON_COST}`,
      () => this.performMultiSummon()
    );

    // Rates info
    this.add.text(GAME_CONFIG.WIDTH / 2, panelY + panelHeight - 50,
      'Rates: Common 50% | Uncommon 30% | Rare 15% | Legendary 5%', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5, 0.5);

    // Result container (for showing summon results)
    this.resultContainer = this.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    this.resultContainer.setVisible(false);
  }

  private createSummonPortal(x: number, y: number): void {
    // Outer glow
    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(0x9b59b6, 0.2);
    outerGlow.fillCircle(x, y, 120);

    // Middle ring
    const middleRing = this.add.graphics();
    middleRing.lineStyle(4, 0xe056fd, 0.6);
    middleRing.strokeCircle(x, y, 100);

    // Inner ring
    const innerRing = this.add.graphics();
    innerRing.lineStyle(3, 0xffffff, 0.4);
    innerRing.strokeCircle(x, y, 70);

    // Center glow
    const centerGlow = this.add.graphics();
    centerGlow.fillStyle(0xe056fd, 0.3);
    centerGlow.fillCircle(x, y, 50);

    // Animate the portal
    this.tweens.add({
      targets: [outerGlow, centerGlow],
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Rotating symbols
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const symbolX = x + Math.cos(angle) * 85;
      const symbolY = y + Math.sin(angle) * 85;

      const symbol = this.add.text(symbolX, symbolY, '✧', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#e056fd',
      });
      symbol.setOrigin(0.5, 0.5);

      // Store original position for rotation
      this.tweens.add({
        targets: symbol,
        angle: 360,
        duration: 8000,
        repeat: -1,
      });
    }
  }

  private createSummonButton(x: number, y: number, label: string, cost: string, callback: () => void): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.ACCENT, 1);
    bg.fillRoundedRect(-90, -40, 180, 80, 12);

    const labelText = this.add.text(0, -12, label, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    labelText.setOrigin(0.5, 0.5);

    const costText = this.add.text(0, 18, `⬡ ${cost}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffddff',
    });
    costText.setOrigin(0.5, 0.5);

    container.add([bg, labelText, costText]);
    container.setSize(180, 80);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      if (!this.isAnimating) {
        callback();
      }
    });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(UI_COLORS.BUTTON_HOVER, 1);
      bg.fillRoundedRect(-90, -40, 180, 80, 12);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(UI_COLORS.ACCENT, 1);
      bg.fillRoundedRect(-90, -40, 180, 80, 12);
    });
  }

  private performSingleSummon(): void {
    const result = this.gachaSystem.performSingleSummon();
    if (result) {
      this.showSummonResult([result]);
    } else {
      this.showNotEnoughEssence();
    }
    this.updateEssenceDisplay();
  }

  private performMultiSummon(): void {
    const results = this.gachaSystem.performMultiSummon();
    if (results.length > 0) {
      this.showSummonResult(results);
    } else {
      this.showNotEnoughEssence();
    }
    this.updateEssenceDisplay();
  }

  private updateEssenceDisplay(): void {
    const save = this.saveSystem.getSave();
    this.essenceText.setText(`Essence: ${Math.floor(save.essence)}`);
  }

  private showNotEnoughEssence(): void {
    const msg = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'Not enough Essence!', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ff6b6b',
      fontStyle: 'bold',
    });
    msg.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: msg.y - 50,
      duration: 1000,
      onComplete: () => msg.destroy(),
    });
  }

  private showSummonResult(results: SummonResult[]): void {
    this.isAnimating = true;
    this.resultContainer.removeAll(true);

    // Background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    this.resultContainer.add(overlay);

    if (results.length === 1) {
      // Single summon reveal
      this.showSingleResult(results[0]);
    } else {
      // Multi summon reveal
      this.showMultiResults(results);
    }

    this.resultContainer.setVisible(true);
  }

  private showSingleResult(result: SummonResult): void {
    const spirit = result.spirit;
    const rarityColor = RARITY_COLORS[spirit.rarity];

    // Flash effect
    const flash = this.add.graphics();
    flash.fillStyle(rarityColor, 1);
    flash.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    flash.setAlpha(0);
    this.resultContainer.add(flash);

    this.tweens.add({
      targets: flash,
      alpha: 0.8,
      duration: 200,
      yoyo: true,
    });

    // Spirit display (delayed)
    this.time.delayedCall(300, () => {
      this.displaySpiritCard(spirit, 0, -50, 1.5, result.isNew);
      this.addContinueButton();
    });
  }

  private showMultiResults(results: SummonResult[]): void {
    // Grid layout for 10 results
    const cols = 5;
    const rows = 2;
    const spacing = 120;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -100;

    results.forEach((result, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacing;
      const y = startY + row * spacing;

      this.time.delayedCall(i * 100, () => {
        this.displaySpiritCard(result.spirit, x, y, 0.8, result.isNew);

        if (i === results.length - 1) {
          this.time.delayedCall(500, () => {
            this.addContinueButton();
          });
        }
      });
    });
  }

  private displaySpiritCard(spirit: SpiritData, x: number, y: number, scale: number, isNew: boolean): void {
    const card = this.add.container(x, y);
    card.setScale(0);

    const rarityColor = RARITY_COLORS[spirit.rarity];

    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(UI_COLORS.PANEL_LIGHT, 1);
    cardBg.fillRoundedRect(-50, -70, 100, 140, 10);
    cardBg.lineStyle(3, rarityColor, 1);
    cardBg.strokeRoundedRect(-50, -70, 100, 140, 10);

    // Spirit visual
    const spiritGlow = this.add.graphics();
    spiritGlow.fillStyle(spirit.color, 0.3);
    spiritGlow.fillCircle(0, -15, 35);

    const spiritBody = this.add.graphics();
    spiritBody.fillStyle(spirit.color, 1);
    spiritBody.fillCircle(0, -15, 25);

    const spiritHighlight = this.add.graphics();
    spiritHighlight.fillStyle(spirit.secondaryColor, 0.7);
    spiritHighlight.fillCircle(-5, -22, 8);

    // Name
    const name = this.add.text(0, 35, spirit.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5, 0.5);

    // Rarity text
    const rarityText = this.add.text(0, 52, spirit.rarity.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: Phaser.Display.Color.IntegerToColor(rarityColor).rgba,
    });
    rarityText.setOrigin(0.5, 0.5);

    card.add([cardBg, spiritGlow, spiritBody, spiritHighlight, name, rarityText]);

    // NEW badge
    if (isNew) {
      const newBadge = this.add.text(35, -60, 'NEW!', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffff00',
        fontStyle: 'bold',
        backgroundColor: '#ff0000',
        padding: { x: 4, y: 2 },
      });
      newBadge.setOrigin(0.5, 0.5);
      card.add(newBadge);
    }

    this.resultContainer.add(card);

    // Pop-in animation
    this.tweens.add({
      targets: card,
      scaleX: scale,
      scaleY: scale,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  private addContinueButton(): void {
    const btn = this.add.container(0, 250);

    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.ACCENT, 1);
    bg.fillRoundedRect(-80, -25, 160, 50, 10);

    const text = this.add.text(0, 0, 'Continue', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5, 0.5);

    btn.add([bg, text]);
    btn.setSize(160, 50);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.resultContainer.setVisible(false);
      this.resultContainer.removeAll(true);
      this.isAnimating = false;
    });

    this.resultContainer.add(btn);
  }
}
