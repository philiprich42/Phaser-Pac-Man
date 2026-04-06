import { MAZE_COLS, MAZE_ROWS, TUNNEL_ROW } from './Constants';
import { TileType } from '../systems/MazeManager';

function index(col: number, row: number): number {
  return row * MAZE_COLS + col;
}

function setTile(tiles: TileType[], col: number, row: number, tile: TileType): void {
  if (col < 0 || col >= MAZE_COLS || row < 0 || row >= MAZE_ROWS) {
    return;
  }

  tiles[index(col, row)] = tile;
}

function carveHorizontal(
  tiles: TileType[],
  row: number,
  startCol: number,
  endCol: number
): void {
  for (let col = startCol; col <= endCol; col++) {
    setTile(tiles, col, row, TileType.Dot);
  }
}

function carveVertical(
  tiles: TileType[],
  col: number,
  startRow: number,
  endRow: number
): void {
  for (let row = startRow; row <= endRow; row++) {
    setTile(tiles, col, row, TileType.Dot);
  }
}

/**
 * Phase 2 uses a generated maze instead of the later asset-driven Tiled map.
 * The layout preserves the arcade dimensions and tunnel row while keeping the
 * implementation self-contained until the asset pipeline arrives.
 */
export function createPhase2Maze(): TileType[] {
  const tiles = Array<TileType>(MAZE_COLS * MAZE_ROWS).fill(TileType.Wall);

  const horizontalRows = [3, 6, 9, 12, 15, 17, 20, 23, 26, 29, 32];
  const verticalCols = [1, 5, 9, 14, 18, 22, 26];

  for (const row of horizontalRows) {
    const startCol = row === TUNNEL_ROW ? 0 : 1;
    const endCol = row === TUNNEL_ROW ? MAZE_COLS - 1 : MAZE_COLS - 2;
    carveHorizontal(tiles, row, startCol, endCol);
  }

  for (const col of verticalCols) {
    carveVertical(tiles, col, 3, 32);
  }

  for (const row of [4, 10, 16, 22, 28]) {
    carveHorizontal(tiles, row, 10, 18);
  }

  for (const col of [3, 7, 20, 24]) {
    carveVertical(tiles, col, 6, 29);
  }

  setTile(tiles, 0, TUNNEL_ROW, TileType.Tunnel);
  setTile(tiles, MAZE_COLS - 1, TUNNEL_ROW, TileType.Tunnel);

  setTile(tiles, 1, 3, TileType.PowerPellet);
  setTile(tiles, MAZE_COLS - 2, 3, TileType.PowerPellet);
  setTile(tiles, 1, 32, TileType.PowerPellet);
  setTile(tiles, MAZE_COLS - 2, 32, TileType.PowerPellet);

  // Keep the spawn corridor clear so the player starts on an empty tile.
  for (const [col, row] of [
    [14, 26],
    [13, 26],
    [15, 26],
    [14, 25],
  ]) {
    setTile(tiles, col, row, TileType.Empty);
  }

  return tiles;
}
