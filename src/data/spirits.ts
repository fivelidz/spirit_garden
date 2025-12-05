export type SpiritElement = 'fire' | 'water' | 'earth' | 'air' | 'light' | 'shadow';
export type SpiritRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface SpiritData {
  id: string;
  name: string;
  element: SpiritElement;
  rarity: SpiritRarity;
  baseProduction: number; // essence per second
  description: string;
  color: number; // hex color for rendering
  secondaryColor: number;
  synergies?: SpiritElement[]; // elements that boost this spirit
  evolutionId?: string; // what this spirit can evolve into
  evolutionCost?: number;
}

export const RARITY_WEIGHTS: Record<SpiritRarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  legendary: 5
};

export const RARITY_MULTIPLIERS: Record<SpiritRarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.5,
  legendary: 5
};

export const RARITY_COLORS: Record<SpiritRarity, number> = {
  common: 0x888888,
  uncommon: 0x4ade80,
  rare: 0x60a5fa,
  legendary: 0xfbbf24
};

export const ELEMENT_COLORS: Record<SpiritElement, number> = {
  fire: 0xff6b6b,
  water: 0x4ecdc4,
  earth: 0x95d5b2,
  air: 0xe0e0e0,
  light: 0xffd93d,
  shadow: 0x6c5ce7
};

export const SPIRITS: SpiritData[] = [
  // Common Spirits (50%)
  {
    id: 'ember_wisp',
    name: 'Ember Wisp',
    element: 'fire',
    rarity: 'common',
    baseProduction: 1,
    description: 'A tiny flame spirit that flickers happily.',
    color: 0xff6b6b,
    secondaryColor: 0xffa502,
    synergies: ['air'],
    evolutionId: 'flame_dancer',
    evolutionCost: 100
  },
  {
    id: 'droplet',
    name: 'Droplet',
    element: 'water',
    rarity: 'common',
    baseProduction: 1,
    description: 'A cheerful water spirit that loves to splash.',
    color: 0x4ecdc4,
    secondaryColor: 0x0984e3,
    synergies: ['earth'],
    evolutionId: 'tide_spirit',
    evolutionCost: 100
  },
  {
    id: 'pebble',
    name: 'Pebble',
    element: 'earth',
    rarity: 'common',
    baseProduction: 1,
    description: 'A sturdy little rock spirit.',
    color: 0x95d5b2,
    secondaryColor: 0x6b4423,
    synergies: ['water'],
    evolutionId: 'stone_guardian',
    evolutionCost: 100
  },
  {
    id: 'breeze',
    name: 'Breeze',
    element: 'air',
    rarity: 'common',
    baseProduction: 1,
    description: 'A gentle wind spirit that drifts lazily.',
    color: 0xe0e0e0,
    secondaryColor: 0xa8dadc,
    synergies: ['fire'],
    evolutionId: 'gale_spirit',
    evolutionCost: 100
  },
  {
    id: 'spark',
    name: 'Spark',
    element: 'light',
    rarity: 'common',
    baseProduction: 1,
    description: 'A tiny mote of pure light.',
    color: 0xffd93d,
    secondaryColor: 0xffffff,
    synergies: ['shadow'],
    evolutionId: 'radiant_orb',
    evolutionCost: 100
  },
  {
    id: 'shade',
    name: 'Shade',
    element: 'shadow',
    rarity: 'common',
    baseProduction: 1,
    description: 'A mysterious dark wisp.',
    color: 0x6c5ce7,
    secondaryColor: 0x2d3436,
    synergies: ['light'],
    evolutionId: 'phantom',
    evolutionCost: 100
  },

  // Uncommon Spirits (30%)
  {
    id: 'flame_dancer',
    name: 'Flame Dancer',
    element: 'fire',
    rarity: 'uncommon',
    baseProduction: 2.5,
    description: 'A graceful fire spirit that twirls and leaps.',
    color: 0xff4757,
    secondaryColor: 0xffa502,
    synergies: ['air', 'light']
  },
  {
    id: 'tide_spirit',
    name: 'Tide Spirit',
    element: 'water',
    rarity: 'uncommon',
    baseProduction: 2.5,
    description: 'A flowing water spirit with calming presence.',
    color: 0x00b894,
    secondaryColor: 0x0984e3,
    synergies: ['earth', 'shadow']
  },
  {
    id: 'stone_guardian',
    name: 'Stone Guardian',
    element: 'earth',
    rarity: 'uncommon',
    baseProduction: 2.5,
    description: 'A protective earth spirit that watches over others.',
    color: 0x55a630,
    secondaryColor: 0x6b4423,
    synergies: ['water', 'fire']
  },
  {
    id: 'gale_spirit',
    name: 'Gale Spirit',
    element: 'air',
    rarity: 'uncommon',
    baseProduction: 2.5,
    description: 'A swift wind spirit that rushes through the garden.',
    color: 0xdfe6e9,
    secondaryColor: 0x74b9ff,
    synergies: ['fire', 'light']
  },
  {
    id: 'radiant_orb',
    name: 'Radiant Orb',
    element: 'light',
    rarity: 'uncommon',
    baseProduction: 2.5,
    description: 'A glowing sphere of warm light.',
    color: 0xfdcb6e,
    secondaryColor: 0xffffff,
    synergies: ['shadow', 'air']
  },
  {
    id: 'phantom',
    name: 'Phantom',
    element: 'shadow',
    rarity: 'uncommon',
    baseProduction: 2.5,
    description: 'A mysterious spirit that phases in and out.',
    color: 0xa29bfe,
    secondaryColor: 0x2d3436,
    synergies: ['light', 'water']
  },

  // Rare Spirits (15%)
  {
    id: 'inferno_phoenix',
    name: 'Inferno Phoenix',
    element: 'fire',
    rarity: 'rare',
    baseProduction: 5,
    description: 'A majestic bird of flame that inspires all fire spirits.',
    color: 0xff3838,
    secondaryColor: 0xffd700,
    synergies: ['air', 'light', 'earth']
  },
  {
    id: 'ocean_sage',
    name: 'Ocean Sage',
    element: 'water',
    rarity: 'rare',
    baseProduction: 5,
    description: 'An ancient water spirit with deep wisdom.',
    color: 0x0097e6,
    secondaryColor: 0x00d2d3,
    synergies: ['earth', 'shadow', 'air']
  },
  {
    id: 'crystal_golem',
    name: 'Crystal Golem',
    element: 'earth',
    rarity: 'rare',
    baseProduction: 5,
    description: 'A towering spirit made of precious gems.',
    color: 0x7bed9f,
    secondaryColor: 0xe056fd,
    synergies: ['water', 'fire', 'light']
  },
  {
    id: 'storm_herald',
    name: 'Storm Herald',
    element: 'air',
    rarity: 'rare',
    baseProduction: 5,
    description: 'A powerful spirit that commands the winds.',
    color: 0xf1f2f6,
    secondaryColor: 0x5352ed,
    synergies: ['fire', 'water', 'shadow']
  },
  {
    id: 'solar_guardian',
    name: 'Solar Guardian',
    element: 'light',
    rarity: 'rare',
    baseProduction: 5,
    description: 'A radiant protector blessed by the sun.',
    color: 0xffc312,
    secondaryColor: 0xf79f1f,
    synergies: ['shadow', 'fire', 'earth']
  },
  {
    id: 'void_walker',
    name: 'Void Walker',
    element: 'shadow',
    rarity: 'rare',
    baseProduction: 5,
    description: 'A spirit that traverses between dimensions.',
    color: 0x5f27cd,
    secondaryColor: 0x222f3e,
    synergies: ['light', 'water', 'air']
  },

  // Legendary Spirits (5%)
  {
    id: 'primordial_flame',
    name: 'Primordial Flame',
    element: 'fire',
    rarity: 'legendary',
    baseProduction: 12,
    description: 'The essence of the first fire ever kindled.',
    color: 0xff0000,
    secondaryColor: 0xffffff,
    synergies: ['fire', 'air', 'light', 'earth']
  },
  {
    id: 'eternal_tide',
    name: 'Eternal Tide',
    element: 'water',
    rarity: 'legendary',
    baseProduction: 12,
    description: 'The spirit of the endless ocean depths.',
    color: 0x006266,
    secondaryColor: 0x00fff7,
    synergies: ['water', 'earth', 'shadow', 'air']
  },
  {
    id: 'world_tree_spirit',
    name: 'World Tree Spirit',
    element: 'earth',
    rarity: 'legendary',
    baseProduction: 12,
    description: 'Guardian of the great tree that connects all gardens.',
    color: 0x2ecc71,
    secondaryColor: 0x8b4513,
    synergies: ['earth', 'water', 'light', 'fire']
  },
  {
    id: 'celestial_wind',
    name: 'Celestial Wind',
    element: 'air',
    rarity: 'legendary',
    baseProduction: 12,
    description: 'A divine breeze from beyond the stars.',
    color: 0xffffff,
    secondaryColor: 0x9b59b6,
    synergies: ['air', 'light', 'shadow', 'fire']
  },
  {
    id: 'dawn_keeper',
    name: 'Dawn Keeper',
    element: 'light',
    rarity: 'legendary',
    baseProduction: 12,
    description: 'The spirit that brings each new day.',
    color: 0xffeaa7,
    secondaryColor: 0xff7675,
    synergies: ['light', 'shadow', 'fire', 'air']
  },
  {
    id: 'eclipse_lord',
    name: 'Eclipse Lord',
    element: 'shadow',
    rarity: 'legendary',
    baseProduction: 12,
    description: 'Master of the moment when light and dark unite.',
    color: 0x2c3e50,
    secondaryColor: 0xf1c40f,
    synergies: ['shadow', 'light', 'water', 'earth']
  }
];

export function getSpiritById(id: string): SpiritData | undefined {
  return SPIRITS.find(s => s.id === id);
}

export function getSpiritsByRarity(rarity: SpiritRarity): SpiritData[] {
  return SPIRITS.filter(s => s.rarity === rarity);
}

export function getSpiritsByElement(element: SpiritElement): SpiritData[] {
  return SPIRITS.filter(s => s.element === element);
}
