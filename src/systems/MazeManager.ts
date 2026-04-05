import { MAZE_COLS, MAZE_ROWS, TILE_SIZE, TUNNEL_ROW } from '../config/Constants';
import { PathFinderOptions } from '../utils/PathFinder';

export const enum TileType {
  Wall = 0,
  Dot = 1,
  PowerPellet = 2,
  Empty = 3,
  GhostHouse = 4,
  Tunnel = 5,
}

export interface MazeState {
  /** Flat row-major array of tile types */
  tiles: TileType[];
  /** Remaining dot + power-pellet count */
  remainingDots: number;
  totalDots: number;
}

/**
 * MazeManager is a pure-data system (no Phaser scene dependency) that owns the
 * tile grid, dot state, and collision queries.  The GameScene is responsible for
 * rendering and Phaser tilemap creation; it reads from MazeManager for state.
 *
 * Full tilemap loading from Tiled JSON is wired up in Phase 2.
 */
export class MazeManager {
  private _tiles: TileType[] = [];
  private _remainingDots = 0;
  private _totalDots = 0;
  private _cols = MAZE_COLS;
  private _rows = MAZE_ROWS;

  get cols(): number { return this._cols; }
  get rows(): number { return this._rows; }
  get remainingDots(): number { return this._remainingDots; }
  get totalDots(): number { return this._totalDots; }
  get isCleared(): boolean { return this._remainingDots === 0; }

  /** Load tile data from a flat array (used by GameScene after Tiled JSON parse). */
  loadTiles(tiles: TileType[], cols = MAZE_COLS, rows = MAZE_ROWS): void {
    this._cols = cols;
    this._rows = rows;
    this._tiles = tiles.slice();
    this._totalDots = tiles.filter(
      (t) => t === TileType.Dot || t === TileType.PowerPellet
    ).length;
    this._remainingDots = this._totalDots;
  }

  tileAt(col: number, row: number): TileType {
    if (col < 0 || col >= this._cols || row < 0 || row >= this._rows) {
      return TileType.Wall;
    }
    return this._tiles[row * this._cols + col];
  }

  isWall(col: number, row: number): boolean {
    const t = this.tileAt(col, row);
    return t === TileType.Wall;
  }

  isWalkable(col: number, row: number): boolean {
    const t = this.tileAt(col, row);
    return t !== TileType.Wall;
  }

  /** Eat dot/pellet at tile. Returns the TileType that was consumed, or Empty. */
  consumeTile(col: number, row: number): TileType {
    const idx = row * this._cols + col;
    const t = this._tiles[idx];
    if (t === TileType.Dot || t === TileType.PowerPellet) {
      this._tiles[idx] = TileType.Empty;
      this._remainingDots--;
      return t;
    }
    return TileType.Empty;
  }

  /** Pixel centre of a tile. */
  tileCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  /** Tile coordinates from pixel position. */
  pixelToTile(x: number, y: number): { col: number; row: number } {
    return {
      col: Math.floor(x / TILE_SIZE),
      row: Math.floor(y / TILE_SIZE),
    };
  }

  /** Build a PathFinderOptions object for use by PathFinder utilities. */
  toPathFinderOptions(): PathFinderOptions {
    const walkable = this._tiles.map((t) => t !== TileType.Wall);
    return {
      cols: this._cols,
      rows: this._rows,
      walkable,
      tunnelCols: new Set([0, this._cols - 1]),
      tunnelRow: TUNNEL_ROW,
    };
  }
}
