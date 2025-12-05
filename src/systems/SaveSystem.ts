import { GAME_CONFIG } from '../data/config';

export interface PlacedSpirit {
  id: string;
  spiritId: string;
  gridX: number;
  gridY: number;
  level: number;
  experience: number;
}

export interface GameSave {
  version: number;
  essence: number;
  gems: number;
  unlockedCells: number;
  placedSpirits: PlacedSpirit[];
  inventory: { spiritId: string; count: number }[];
  totalSummons: number;
  totalEssenceEarned: number;
  achievements: string[];
  lastSaveTime: number;
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
}

const DEFAULT_SAVE: GameSave = {
  version: 1,
  essence: GAME_CONFIG.STARTING_ESSENCE,
  gems: GAME_CONFIG.STARTING_GEMS,
  unlockedCells: GAME_CONFIG.STARTING_GRID_SIZE,
  placedSpirits: [],
  inventory: [],
  totalSummons: 0,
  totalEssenceEarned: 0,
  achievements: [],
  lastSaveTime: Date.now(),
  settings: {
    musicVolume: 0.7,
    sfxVolume: 1.0,
  },
};

export class SaveSystem {
  private static instance: SaveSystem;
  private currentSave: GameSave;

  private constructor() {
    this.currentSave = this.load();
  }

  static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  load(): GameSave {
    try {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameSave;
        // Merge with defaults to handle new fields in updates
        return { ...DEFAULT_SAVE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load save:', e);
    }
    return { ...DEFAULT_SAVE };
  }

  save(): void {
    try {
      this.currentSave.lastSaveTime = Date.now();
      localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify(this.currentSave));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }

  getSave(): GameSave {
    return this.currentSave;
  }

  updateSave(updates: Partial<GameSave>): void {
    this.currentSave = { ...this.currentSave, ...updates };
  }

  // Resource methods
  addEssence(amount: number): void {
    this.currentSave.essence += amount;
    this.currentSave.totalEssenceEarned += amount;
  }

  spendEssence(amount: number): boolean {
    if (this.currentSave.essence >= amount) {
      this.currentSave.essence -= amount;
      return true;
    }
    return false;
  }

  addGems(amount: number): void {
    this.currentSave.gems += amount;
  }

  spendGems(amount: number): boolean {
    if (this.currentSave.gems >= amount) {
      this.currentSave.gems -= amount;
      return true;
    }
    return false;
  }

  // Inventory methods
  addToInventory(spiritId: string, count: number = 1): void {
    const existing = this.currentSave.inventory.find(i => i.spiritId === spiritId);
    if (existing) {
      existing.count += count;
    } else {
      this.currentSave.inventory.push({ spiritId, count });
    }
  }

  removeFromInventory(spiritId: string): boolean {
    const existing = this.currentSave.inventory.find(i => i.spiritId === spiritId);
    if (existing && existing.count > 0) {
      existing.count--;
      if (existing.count === 0) {
        this.currentSave.inventory = this.currentSave.inventory.filter(i => i.spiritId !== spiritId);
      }
      return true;
    }
    return false;
  }

  getInventoryCount(spiritId: string): number {
    const item = this.currentSave.inventory.find(i => i.spiritId === spiritId);
    return item?.count ?? 0;
  }

  // Placed spirits methods
  placeSpirit(spirit: PlacedSpirit): void {
    this.currentSave.placedSpirits.push(spirit);
  }

  removeSpirit(id: string): PlacedSpirit | undefined {
    const index = this.currentSave.placedSpirits.findIndex(s => s.id === id);
    if (index !== -1) {
      return this.currentSave.placedSpirits.splice(index, 1)[0];
    }
    return undefined;
  }

  getSpiritAtPosition(x: number, y: number): PlacedSpirit | undefined {
    return this.currentSave.placedSpirits.find(s => s.gridX === x && s.gridY === y);
  }

  // Offline progress calculation
  calculateOfflineProgress(): { essence: number; time: number } {
    const now = Date.now();
    const lastSave = this.currentSave.lastSaveTime;
    const elapsedMs = Math.min(
      now - lastSave,
      GAME_CONFIG.MAX_OFFLINE_HOURS * 60 * 60 * 1000
    );

    if (elapsedMs < 60000) { // Less than 1 minute
      return { essence: 0, time: 0 };
    }

    // Calculate base production per second
    let baseProduction = 0;
    // This will be calculated by the game scene using spirit data

    const seconds = elapsedMs / 1000;
    const essence = Math.floor(baseProduction * seconds * GAME_CONFIG.OFFLINE_EFFICIENCY);

    return { essence, time: elapsedMs };
  }

  resetSave(): void {
    this.currentSave = { ...DEFAULT_SAVE };
    this.save();
  }
}
