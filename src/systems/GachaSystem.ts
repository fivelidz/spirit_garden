import { SPIRITS, SpiritData, SpiritRarity, RARITY_WEIGHTS, getSpiritsByRarity } from '../data/spirits';
import { GAME_CONFIG } from '../data/config';
import { SaveSystem } from './SaveSystem';

export interface SummonResult {
  spirit: SpiritData;
  isNew: boolean;
}

export class GachaSystem {
  private static instance: GachaSystem;
  private saveSystem: SaveSystem;

  private constructor() {
    this.saveSystem = SaveSystem.getInstance();
  }

  static getInstance(): GachaSystem {
    if (!GachaSystem.instance) {
      GachaSystem.instance = new GachaSystem();
    }
    return GachaSystem.instance;
  }

  private rollRarity(): SpiritRarity {
    const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      roll -= weight;
      if (roll <= 0) {
        return rarity as SpiritRarity;
      }
    }

    return 'common';
  }

  private rollSpirit(): SpiritData {
    const rarity = this.rollRarity();
    const spiritsOfRarity = getSpiritsByRarity(rarity);
    const randomIndex = Math.floor(Math.random() * spiritsOfRarity.length);
    return spiritsOfRarity[randomIndex];
  }

  canAffordSingle(): boolean {
    return this.saveSystem.getSave().essence >= GAME_CONFIG.SINGLE_SUMMON_COST;
  }

  canAffordMulti(): boolean {
    return this.saveSystem.getSave().essence >= GAME_CONFIG.MULTI_SUMMON_COST;
  }

  performSingleSummon(): SummonResult | null {
    if (!this.canAffordSingle()) {
      return null;
    }

    this.saveSystem.spendEssence(GAME_CONFIG.SINGLE_SUMMON_COST);
    const save = this.saveSystem.getSave();
    this.saveSystem.updateSave({ totalSummons: save.totalSummons + 1 });

    const spirit = this.rollSpirit();
    const isNew = this.saveSystem.getInventoryCount(spirit.id) === 0 &&
                  !save.placedSpirits.some(s => s.spiritId === spirit.id);

    this.saveSystem.addToInventory(spirit.id);
    this.saveSystem.save();

    return { spirit, isNew };
  }

  performMultiSummon(): SummonResult[] {
    if (!this.canAffordMulti()) {
      return [];
    }

    this.saveSystem.spendEssence(GAME_CONFIG.MULTI_SUMMON_COST);
    const save = this.saveSystem.getSave();
    this.saveSystem.updateSave({ totalSummons: save.totalSummons + GAME_CONFIG.MULTI_SUMMON_COUNT });

    const results: SummonResult[] = [];

    for (let i = 0; i < GAME_CONFIG.MULTI_SUMMON_COUNT; i++) {
      const spirit = this.rollSpirit();
      const currentCount = this.saveSystem.getInventoryCount(spirit.id);
      const alreadyPlaced = save.placedSpirits.some(s => s.spiritId === spirit.id);
      const alreadyInResults = results.some(r => r.spirit.id === spirit.id);
      const isNew = currentCount === 0 && !alreadyPlaced && !alreadyInResults;

      this.saveSystem.addToInventory(spirit.id);
      results.push({ spirit, isNew });
    }

    this.saveSystem.save();
    return results;
  }

  // Pity system - guaranteed rare+ after X summons without one
  getPityCounter(): number {
    // Could track in save, simplified for now
    return 0;
  }

  // Statistics
  getSummonStats(): { total: number; byRarity: Record<SpiritRarity, number> } {
    const save = this.saveSystem.getSave();
    const byRarity: Record<SpiritRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0
    };

    // Count from inventory + placed
    const allOwned = new Map<string, number>();

    save.inventory.forEach(item => {
      allOwned.set(item.spiritId, (allOwned.get(item.spiritId) || 0) + item.count);
    });

    save.placedSpirits.forEach(spirit => {
      allOwned.set(spirit.spiritId, (allOwned.get(spirit.spiritId) || 0) + 1);
    });

    allOwned.forEach((count, spiritId) => {
      const spirit = SPIRITS.find(s => s.id === spiritId);
      if (spirit) {
        byRarity[spirit.rarity] += count;
      }
    });

    return { total: save.totalSummons, byRarity };
  }
}
