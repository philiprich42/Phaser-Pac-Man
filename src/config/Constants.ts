// Tile dimensions
export const TILE_SIZE = 8; // pixels per tile
export const MAZE_COLS = 28;
export const MAZE_ROWS = 36;

// Canvas / game dimensions
export const GAME_WIDTH = TILE_SIZE * MAZE_COLS;   // 224
export const GAME_HEIGHT = TILE_SIZE * MAZE_ROWS;  // 288

// Scoring
export const SCORE = {
  DOT: 10,
  POWER_PELLET: 50,
  GHOST: [200, 400, 800, 1600] as const, // index = ghosts eaten this power pellet
  FRUIT: {
    CHERRY: 100,
    STRAWBERRY: 300,
    PEACH: 500,
    APPLE: 700,
    GRAPES: 1000,
    GALAXIAN: 2000,
    BELL: 3000,
    KEY: 5000,
  },
  EXTRA_LIFE_THRESHOLD: 10000,
} as const;

// Lives
export const STARTING_LIVES = 3;

// Dot counts
export const TOTAL_DOTS = 240;
export const FRUIT_SPAWN_DOTS = [70, 170] as const; // dots eaten to spawn fruit
export const FRUIT_DURATION_MS = 9000;

// Ghost mode timing per level (seconds): [scatter, chase, scatter, chase, scatter, chase, scatter, chase=∞]
// After the last pair the chase phase is infinite (represented as Infinity)
export const GHOST_MODE_TIMINGS: Record<number, number[]> = {
  1: [7, 20, 7, 20, 5, 20, 5, Infinity],
  2: [7, 20, 7, 20, 5, 1033, 1 / 60, Infinity],
  5: [5, 20, 5, 20, 5, 1037, 1 / 60, Infinity],
};

// Helper: get the timing table for a given level
export function getGhostModeTimings(level: number): number[] {
  if (level >= 5) return GHOST_MODE_TIMINGS[5];
  if (level >= 2) return GHOST_MODE_TIMINGS[2];
  return GHOST_MODE_TIMINGS[1];
}

// Frightened duration per level (seconds)
export const FRIGHTENED_DURATION: Record<number, number> = {
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 5,
  7: 2,
  8: 2,
  9: 1,
  10: 5,
  11: 2,
  12: 1,
  13: 1,
  14: 3,
  15: 1,
  16: 1,
  17: 0,
  18: 1,
};
export const FRIGHTENED_FLASH_START = 2; // seconds before end to start flashing

export function getFrightenedDuration(level: number): number {
  return FRIGHTENED_DURATION[level] ?? 0;
}

// Speed multipliers (fraction of base speed) per level
// [pacman normal, pacman frightened, pacman dot, ghost normal, ghost frightened, ghost tunnel]
export const SPEED_TABLE: Record<number, [number, number, number, number, number, number]> = {
  1:  [0.80, 0.90, 0.71, 0.75, 0.50, 0.40],
  2:  [0.90, 0.95, 0.79, 0.85, 0.55, 0.45],
  5:  [1.00, 1.00, 0.87, 0.95, 0.60, 0.50],
  21: [0.90, 0.90, 0.79, 0.95, 0.00, 0.50],
};

export function getSpeedTable(level: number): [number, number, number, number, number, number] {
  if (level >= 21) return SPEED_TABLE[21];
  if (level >= 5) return SPEED_TABLE[5];
  if (level >= 2) return SPEED_TABLE[2];
  return SPEED_TABLE[1];
}

// Base pixel speed (pixels per second at 1.0 multiplier)
export const BASE_SPEED = 75.75; // original ~75.75 px/s at 60 fps

// Ghost house release dot counters (personal counters, level 1)
export const GHOST_RELEASE_COUNTERS: Record<string, number> = {
  Pinky: 0,
  Inky: 30,
  Clyde: 60,
};

// Scatter corner targets (tile coordinates [col, row])
export const SCATTER_TARGETS: Record<string, [number, number]> = {
  Blinky: [25, 0],
  Pinky:  [2, 0],
  Inky:   [27, 35],
  Clyde:  [0, 35],
};

// Clyde switches to scatter when distance to Pac-Man exceeds this (tiles)
export const CLYDE_SCATTER_THRESHOLD = 8;

// Tunnel tile row
export const TUNNEL_ROW = 17;
