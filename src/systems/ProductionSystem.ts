import { GAME_CONFIG } from '../data/config';
import { getSpiritById, RARITY_MULTIPLIERS, SpiritElement } from '../data/spirits';
import { SaveSystem, PlacedSpirit } from './SaveSystem';

export interface ProductionInfo {
  spiritId: string;
  baseProduction: number;
  levelBonus: number;
  synergyBonus: number;
  totalProduction: number;
}

export class ProductionSystem {
  private static instance: ProductionSystem;
  private saveSystem: SaveSystem;
  private tapBonusEndTime: number = 0;
  private lastTickTime: number = Date.now();
  private accumulatedEssence: number = 0;

  private constructor() {
    this.saveSystem = SaveSystem.getInstance();
  }

  static getInstance(): ProductionSystem {
    if (!ProductionSystem.instance) {
      ProductionSystem.instance = new ProductionSystem();
    }
    return ProductionSystem.instance;
  }

  tick(): number {
    const now = Date.now();
    const delta = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    const production = this.calculateTotalProduction();
    const tapMultiplier = this.isTapBonusActive() ? GAME_CONFIG.TAP_BONUS_MULTIPLIER : 1;

    const essenceGained = production * delta * tapMultiplier;
    this.accumulatedEssence += essenceGained;

    // Only add whole essence to save
    const wholeEssence = Math.floor(this.accumulatedEssence);
    if (wholeEssence > 0) {
      this.saveSystem.addEssence(wholeEssence);
      this.accumulatedEssence -= wholeEssence;
    }

    return essenceGained;
  }

  calculateTotalProduction(): number {
    const save = this.saveSystem.getSave();
    let total = 0;

    save.placedSpirits.forEach(spirit => {
      const info = this.calculateSpiritProduction(spirit, save.placedSpirits);
      total += info.totalProduction;
    });

    return total;
  }

  calculateSpiritProduction(spirit: PlacedSpirit, allSpirits: PlacedSpirit[]): ProductionInfo {
    const spiritData = getSpiritById(spirit.spiritId);
    if (!spiritData) {
      return {
        spiritId: spirit.spiritId,
        baseProduction: 0,
        levelBonus: 0,
        synergyBonus: 0,
        totalProduction: 0
      };
    }

    const baseProduction = spiritData.baseProduction;
    const levelBonus = baseProduction * (spirit.level - 1) * GAME_CONFIG.SPIRIT_UPGRADE_BONUS;

    // Calculate synergy bonus
    const synergyBonus = this.calculateSynergyBonus(spirit, allSpirits);

    const totalProduction = (baseProduction + levelBonus) * (1 + synergyBonus);

    return {
      spiritId: spirit.spiritId,
      baseProduction,
      levelBonus,
      synergyBonus,
      totalProduction
    };
  }

  private calculateSynergyBonus(spirit: PlacedSpirit, allSpirits: PlacedSpirit[]): number {
    const spiritData = getSpiritById(spirit.spiritId);
    if (!spiritData || !spiritData.synergies) {
      return 0;
    }

    // Get adjacent positions
    const adjacentPositions = [
      { x: spirit.gridX - 1, y: spirit.gridY },
      { x: spirit.gridX + 1, y: spirit.gridY },
      { x: spirit.gridX, y: spirit.gridY - 1 },
      { x: spirit.gridX, y: spirit.gridY + 1 },
    ];

    let synergyCount = 0;

    adjacentPositions.forEach(pos => {
      const adjacentSpirit = allSpirits.find(s => s.gridX === pos.x && s.gridY === pos.y);
      if (adjacentSpirit) {
        const adjacentData = getSpiritById(adjacentSpirit.spiritId);
        if (adjacentData && spiritData.synergies?.includes(adjacentData.element)) {
          synergyCount++;
        }
      }
    });

    return synergyCount * GAME_CONFIG.SYNERGY_BONUS;
  }

  getAdjacentElements(gridX: number, gridY: number): SpiritElement[] {
    const save = this.saveSystem.getSave();
    const adjacentPositions = [
      { x: gridX - 1, y: gridY },
      { x: gridX + 1, y: gridY },
      { x: gridX, y: gridY - 1 },
      { x: gridX, y: gridY + 1 },
    ];

    const elements: SpiritElement[] = [];

    adjacentPositions.forEach(pos => {
      const spirit = save.placedSpirits.find(s => s.gridX === pos.x && s.gridY === pos.y);
      if (spirit) {
        const data = getSpiritById(spirit.spiritId);
        if (data) {
          elements.push(data.element);
        }
      }
    });

    return elements;
  }

  activateTapBonus(): void {
    this.tapBonusEndTime = Date.now() + GAME_CONFIG.TAP_BONUS_DURATION;
  }

  isTapBonusActive(): boolean {
    return Date.now() < this.tapBonusEndTime;
  }

  getTapBonusRemainingTime(): number {
    return Math.max(0, this.tapBonusEndTime - Date.now());
  }

  getProductionPerSecond(): number {
    return this.calculateTotalProduction();
  }

  // Calculate offline progress
  calculateOfflineEssence(elapsedMs: number): number {
    const production = this.calculateTotalProduction();
    const seconds = elapsedMs / 1000;
    return Math.floor(production * seconds * GAME_CONFIG.OFFLINE_EFFICIENCY);
  }
}
