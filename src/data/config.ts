export const GAME_CONFIG = {
  // Display
  WIDTH: 720,
  HEIGHT: 1280,

  // Garden Grid
  GRID_COLS: 5,
  GRID_ROWS: 6,
  CELL_SIZE: 100,
  GRID_OFFSET_X: 110,
  GRID_OFFSET_Y: 280,

  // Starting Resources
  STARTING_ESSENCE: 100,
  STARTING_GEMS: 10,
  STARTING_GRID_SIZE: 12, // unlocked cells

  // Gacha Costs
  SINGLE_SUMMON_COST: 50,
  MULTI_SUMMON_COST: 450, // 10 summons
  MULTI_SUMMON_COUNT: 10,

  // Production
  BASE_TICK_RATE: 1000, // ms between production ticks
  SYNERGY_BONUS: 0.25, // 25% bonus per synergy
  TAP_BONUS_MULTIPLIER: 2, // double production on tap
  TAP_BONUS_DURATION: 5000, // 5 seconds

  // Upgrades
  SPIRIT_UPGRADE_BASE_COST: 50,
  SPIRIT_UPGRADE_COST_MULTIPLIER: 1.5,
  SPIRIT_UPGRADE_BONUS: 0.2, // 20% per level
  MAX_SPIRIT_LEVEL: 10,

  // Garden Expansion
  GARDEN_EXPAND_BASE_COST: 200,
  GARDEN_EXPAND_COST_MULTIPLIER: 2,
  MAX_GRID_SIZE: 30,

  // Save
  SAVE_KEY: 'pocket_spirit_garden_save',
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds

  // Offline Progress
  MAX_OFFLINE_HOURS: 8,
  OFFLINE_EFFICIENCY: 0.5, // 50% of normal production

  // Animations
  SPIRIT_FLOAT_SPEED: 0.002,
  SPIRIT_FLOAT_AMPLITUDE: 5,
  PARTICLE_RATE: 100,
};

export const UI_COLORS = {
  BACKGROUND: 0x1a1a2e,
  PANEL: 0x16213e,
  PANEL_LIGHT: 0x0f3460,
  ACCENT: 0xe94560,
  TEXT: 0xffffff,
  TEXT_DIM: 0x888888,
  BUTTON: 0x533483,
  BUTTON_HOVER: 0x7c3aed,
  SUCCESS: 0x4ade80,
  WARNING: 0xfbbf24,
  GRID_CELL: 0x2a2a4a,
  GRID_CELL_HOVER: 0x3a3a6a,
  GRID_CELL_LOCKED: 0x1a1a2a,
};
