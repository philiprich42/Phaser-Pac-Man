/**
 * BFS-based pathfinder for ghost target tile resolution.
 *
 * Operates on a tile grid represented as a flat boolean array where
 * `true` = walkable and `false` = wall.  This is intentionally a pure
 * utility with no Phaser dependency so it can be unit-tested in isolation.
 */

export interface Tile {
  col: number;
  row: number;
}

export interface PathFinderOptions {
  cols: number;
  rows: number;
  /** Flat row-major array: walkable[row * cols + col] */
  walkable: boolean[];
  /** Columns that wrap horizontally (tunnel tiles). Defaults to [0, cols-1]. */
  tunnelCols?: Set<number>;
  tunnelRow?: number;
}

/**
 * Returns the adjacent walkable tiles from a given position.
 * Never returns the tile directly behind (reversal prevention handled by caller).
 */
export function getNeighbours(
  tile: Tile,
  opts: PathFinderOptions,
  exclude?: Tile
): Tile[] {
  const { cols, rows, walkable, tunnelCols, tunnelRow } = opts;
  const candidates: Tile[] = [
    { col: tile.col, row: tile.row - 1 }, // up
    { col: tile.col - 1, row: tile.row }, // left
    { col: tile.col + 1, row: tile.row }, // right
    { col: tile.col, row: tile.row + 1 }, // down
  ];

  const neighbours: Tile[] = [];

  for (const candidate of candidates) {
    let col = candidate.col;

    if (tunnelCols && candidate.row === tunnelRow) {
      if (col < 0) col = cols - 1;
      if (col >= cols) col = 0;
    }

    if (col < 0 || col >= cols || candidate.row < 0 || candidate.row >= rows) {
      continue;
    }

    const normalized = { col, row: candidate.row };
    if (!walkable[normalized.row * cols + normalized.col]) {
      continue;
    }

    if (exclude && normalized.col === exclude.col && normalized.row === exclude.row) {
      continue;
    }

    neighbours.push(normalized);
  }

  return neighbours;
}

/**
 * Euclidean distance between two tiles (used for ghost target selection).
 */
export function tileDistance(a: Tile, b: Tile): number {
  const dc = a.col - b.col;
  const dr = a.row - b.row;
  return Math.sqrt(dc * dc + dr * dr);
}

/**
 * Given a ghost's current tile, previous tile (for reversal prevention), and a
 * target tile, returns the next tile the ghost should move to.
 *
 * Replicates the original game's greedy one-step lookahead: pick the neighbour
 * with the smallest Euclidean distance to the target.  Ties broken by priority:
 * up > left > down > right (original arcade priority order).
 */
export function nextTileTowards(
  current: Tile,
  previous: Tile | null,
  target: Tile,
  opts: PathFinderOptions
): Tile | null {
  const neighbours = getNeighbours(current, opts, previous ?? undefined);
  if (neighbours.length === 0) return null;

  let best: Tile | null = null;
  let bestDist = Infinity;

  for (const n of neighbours) {
    const d = tileDistance(n, target);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }

  return best;
}

/**
 * BFS shortest path from `start` to `goal`.  Returns the full path as an array
 * of tiles (start excluded, goal included), or null if unreachable.
 *
 * Used for ghost-house exit pathing and optional debug visualisation.
 */
export function bfsPath(
  start: Tile,
  goal: Tile,
  opts: PathFinderOptions
): Tile[] | null {
  const { cols } = opts;
  const key = (t: Tile) => t.row * cols + t.col;

  const visited = new Set<number>();
  const queue: Array<{ tile: Tile; path: Tile[] }> = [{ tile: start, path: [] }];
  visited.add(key(start));

  while (queue.length > 0) {
    const { tile, path } = queue.shift()!;

    if (tile.col === goal.col && tile.row === goal.row) {
      return path;
    }

    for (const neighbour of getNeighbours(tile, opts)) {
      const k = key(neighbour);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ tile: neighbour, path: [...path, neighbour] });
      }
    }
  }

  return null;
}
