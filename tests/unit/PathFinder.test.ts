import { describe, it, expect } from 'vitest';
import {
  bfsPath,
  nextTileTowards,
  tileDistance,
  getNeighbours,
  PathFinderOptions,
} from '../../src/utils/PathFinder';

// Simple 5×5 open grid (no walls)
function openGrid(cols = 5, rows = 5): PathFinderOptions {
  return {
    cols,
    rows,
    walkable: Array(cols * rows).fill(true),
  };
}

// Grid with a wall at [col, row]
function gridWithWall(wallCol: number, wallRow: number, cols = 5, rows = 5): PathFinderOptions {
  const walkable = Array(cols * rows).fill(true);
  walkable[wallRow * cols + wallCol] = false;
  return { cols, rows, walkable };
}

describe('tileDistance', () => {
  it('returns 0 for the same tile', () => {
    expect(tileDistance({ col: 3, row: 3 }, { col: 3, row: 3 })).toBe(0);
  });

  it('returns correct Euclidean distance', () => {
    expect(tileDistance({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(5);
  });
});

describe('getNeighbours', () => {
  it('returns 4 neighbours for a centre tile in an open grid', () => {
    const opts = openGrid();
    const neighbours = getNeighbours({ col: 2, row: 2 }, opts);
    expect(neighbours).toHaveLength(4);
  });

  it('returns fewer neighbours at a corner', () => {
    const opts = openGrid();
    const neighbours = getNeighbours({ col: 0, row: 0 }, opts);
    expect(neighbours).toHaveLength(2); // right and down only
  });

  it('excludes a walled neighbour', () => {
    const opts = gridWithWall(2, 1);
    const neighbours = getNeighbours({ col: 2, row: 2 }, opts);
    const hasBlockedTile = neighbours.some((n) => n.col === 2 && n.row === 1);
    expect(hasBlockedTile).toBe(false);
  });

  it('excludes the explicitly excluded tile (reversal prevention)', () => {
    const opts = openGrid();
    const neighbours = getNeighbours({ col: 2, row: 2 }, opts, { col: 2, row: 1 });
    const hasExcluded = neighbours.some((n) => n.col === 2 && n.row === 1);
    expect(hasExcluded).toBe(false);
  });
});

describe('nextTileTowards', () => {
  it('moves toward the target', () => {
    const opts = openGrid();
    const next = nextTileTowards({ col: 0, row: 0 }, null, { col: 4, row: 0 }, opts);
    expect(next).toEqual({ col: 1, row: 0 });
  });

  it('returns null when completely surrounded by walls', () => {
    const walkable = Array(25).fill(false);
    walkable[2 * 5 + 2] = true; // only the current tile is walkable
    const opts: PathFinderOptions = { cols: 5, rows: 5, walkable };
    const next = nextTileTowards({ col: 2, row: 2 }, null, { col: 4, row: 4 }, opts);
    expect(next).toBeNull();
  });
});

describe('bfsPath', () => {
  it('finds a direct path in an open grid', () => {
    const opts = openGrid();
    const path = bfsPath({ col: 0, row: 0 }, { col: 2, row: 0 }, opts);
    expect(path).not.toBeNull();
    expect(path!.at(-1)).toEqual({ col: 2, row: 0 });
    expect(path!.length).toBe(2); // [col1,row0] and [col2,row0]
  });

  it('navigates around a wall', () => {
    // Block the direct horizontal path: wall at col=1,row=0
    const opts = gridWithWall(1, 0);
    const path = bfsPath({ col: 0, row: 0 }, { col: 2, row: 0 }, opts);
    expect(path).not.toBeNull();
    // Path must not include the walled tile
    const hitsWall = path!.some((t) => t.col === 1 && t.row === 0);
    expect(hitsWall).toBe(false);
  });

  it('returns null when goal is unreachable', () => {
    // Surround goal with walls
    const opts = gridWithWall(3, 2);
    // Also block all entry points to col=4 row=0 corner indirectly — use a simpler case:
    // All walls except start
    const walkable = Array(25).fill(false);
    walkable[0] = true; // only (0,0)
    const opts2: PathFinderOptions = { cols: 5, rows: 5, walkable };
    const path = bfsPath({ col: 0, row: 0 }, { col: 4, row: 4 }, opts2);
    expect(path).toBeNull();
  });

  it('returns an empty array when start equals goal', () => {
    const opts = openGrid();
    const path = bfsPath({ col: 2, row: 2 }, { col: 2, row: 2 }, opts);
    expect(path).toEqual([]);
  });
});
