# Phaser Pac-Man — Project Specification

A faithful arcade clone of the classic Pac-Man game, built with Phaser 3 and TypeScript, tested with Vitest and Playwright, and deployed to Vercel.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Gameplay Rules & Mechanics](#gameplay-rules--mechanics)
4. [Ghost AI Specification](#ghost-ai-specification)
5. [Asset Pipeline](#asset-pipeline)
6. [Testing Strategy](#testing-strategy)
7. [Development Phases](#development-phases)
8. [Deployment & CI](#deployment--ci)

---

## Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type safety, IDE support, self-documenting interfaces |
| Game framework | Phaser 3 | Mature, widely-used 2D HTML5 game framework |
| Build tool | Vite | Fast HMR dev server, native ESM, excellent TS support |
| Unit tests | Vitest | Vite-native, fast, compatible with same tsconfig |
| E2E tests | Playwright | Cross-browser, reliable game canvas automation |
| Linting | ESLint + Prettier | Code consistency |
| Deployment | Vercel | Auto-deploy on push via GitHub integration |
| CI | GitHub Actions | Lint + unit + E2E gate on every push/PR |

---

## Repository Structure

```
Phaser-Pac-Man/
├── src/
│   ├── main.ts                    # Phaser Game bootstrap
│   ├── config/
│   │   ├── GameConfig.ts          # Phaser.Types.Core.GameConfig object
│   │   └── Constants.ts           # Speeds, timing tables, tile size, point values
│   ├── scenes/
│   │   ├── BootScene.ts           # Asset preload (sprites, audio, tilemaps)
│   │   ├── MenuScene.ts           # Title screen + high score display
│   │   ├── GameScene.ts           # Main gameplay loop
│   │   └── GameOverScene.ts       # End screen, localStorage high score save
│   ├── entities/
│   │   ├── PacMan.ts              # Player: movement, animation, buffered input
│   │   ├── Ghost.ts               # Base class: mode FSM, render, respawn
│   │   ├── Blinky.ts              # Red ghost — direct Pac-Man chaser
│   │   ├── Pinky.ts               # Pink ghost — 4-tile-ahead ambusher
│   │   ├── Inky.ts                # Cyan ghost — flanking (uses Blinky + Pac-Man)
│   │   └── Clyde.ts               # Orange ghost — chase/scatter threshold
│   ├── systems/
│   │   ├── MazeManager.ts         # Tilemap load, collision, dot/pellet grid state
│   │   ├── GhostAI.ts             # Mode scheduler (scatter/chase/frightened)
│   │   ├── ScoreManager.ts        # Score, lives, level, fruit, localStorage
│   │   └── InputManager.ts        # Arrow keys + swipe gesture abstraction
│   └── utils/
│       └── PathFinder.ts          # BFS on maze tile graph for ghost targeting
├── assets/
│   ├── sprites/                   # Spritesheet PNG + atlas JSON
│   ├── audio/                     # .ogg / .mp3 sound effects
│   └── tilemaps/                  # maze.json (Tiled format, 28×36 grid)
├── tests/
│   ├── unit/
│   │   ├── PacMan.test.ts
│   │   ├── GhostAI.test.ts
│   │   ├── ScoreManager.test.ts
│   │   └── PathFinder.test.ts
│   └── e2e/
│       ├── game-loads.spec.ts
│       ├── gameplay.spec.ts
│       └── score.spec.ts
├── public/                        # Static assets served by Vite
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── .eslintrc.cjs
├── .github/
│   └── workflows/
│       └── ci.yml                 # Lint + Vitest + Playwright on push/PR
└── package.json
```

---

## Gameplay Rules & Mechanics

### Objective
Eat all dots in the maze without being caught by a ghost. Clear the maze to advance to the next level.

### Maze
- 28 columns × 36 rows of tiles (matching the original arcade layout)
- Tile types: wall, dot (10 pts), power pellet (50 pts), empty, tunnel (left/right wrap-around)
- Two fruit spawn positions at the center tunnel intersection

### Scoring

| Event | Points |
|---|---|
| Dot | 10 |
| Power pellet | 50 |
| Ghost eaten (1st) | 200 |
| Ghost eaten (2nd) | 400 |
| Ghost eaten (3rd) | 800 |
| Ghost eaten (4th) | 1,600 |
| Cherry (Level 1) | 100 |
| Strawberry (Level 2) | 300 |
| Peach (Levels 3–4) | 500 |
| Apple (Levels 5–6) | 700 |
| Grapes (Levels 7–8) | 1,000 |
| Galaxian (Levels 9–10) | 2,000 |
| Bell (Levels 11–12) | 3,000 |
| Key (Level 13+) | 5,000 |

Ghost-eating combo resets each time a new power pellet is eaten.

### Lives
- Start with 3 lives
- Extra life awarded at 10,000 points
- On death: brief death animation, respawn at start positions, ghost house releases reset

### Level Progression
- Clearing all dots advances to the next level
- Movement speeds (Pac-Man and ghosts) increase per level according to the original timing tables (defined in `Constants.ts`)
- Frightened duration decreases with level

### Power Pellets
- 4 pellets per maze (fixed positions)
- Activates frightened mode for all ghosts outside the ghost house
- Pac-Man can eat frightened ghosts for bonus points (combo multiplier ×2 per ghost)

### Fruit
- Spawns below the ghost house after 70 and 170 dots have been eaten
- Remains on screen for ~9 seconds
- Type is determined by current level

---

## Ghost AI Specification

### Modes

Each ghost operates in one of three modes, managed by `GhostAI.ts`:

**Scatter** — Ghost targets its fixed home corner, resulting in a looping patrol near the corner.

| Ghost | Scatter corner |
|---|---|
| Blinky | Top-right |
| Pinky | Top-left |
| Inky | Bottom-right |
| Clyde | Bottom-left |

**Chase** — Each ghost uses a unique targeting algorithm:

| Ghost | Target tile |
|---|---|
| Blinky | Pac-Man's current tile |
| Pinky | 4 tiles ahead of Pac-Man's current facing direction |
| Inky | Reflect the vector from Blinky to (2 tiles ahead of Pac-Man) — effectively flanks from opposite side |
| Clyde | Pac-Man's tile if distance > 8 tiles; own scatter corner if ≤ 8 tiles |

**Frightened** — Ghost moves to a random valid adjacent tile (no reversals). Speed is halved. Ghost flashes white near the end of the frightened timer.

### Mode Schedule

Level 1:
```
Scatter 7s → Chase 20s → Scatter 7s → Chase 20s → Scatter 5s → Chase 20s → Scatter 5s → Chase ∞
```

Higher levels reduce scatter durations (see `Constants.ts` for full table). From level 5 onwards, scatter phases last only 1 second.

### Pathfinding

`PathFinder.ts` implements BFS on the adjacency graph derived from `MazeManager`'s collision data. At each intersection, the ghost evaluates all valid neighbouring tiles (no reversals, no into-wall moves) and picks the one with the shortest Euclidean distance to its current target tile. This replicates the original game's greedy one-step lookahead.

### Ghost House

- Ghosts start inside the ghost house and exit in a fixed order (Blinky immediately, others released by dot counter or global timer)
- On player death, all ghosts return to starting positions; dot counters reset

---

## Asset Pipeline

### Sprites (`assets/sprites/`)
- Single spritesheet PNG with atlas JSON (Phaser texture atlas format)
- Frames: Pac-Man (open/half/closed × 4 directions), ghost body (2 frames × 4 colours), ghost eyes (4 directions), frightened ghost (normal + flashing), maze tiles, fruit, score pop-ups

### Audio (`assets/audio/`)
- `waka.ogg` / `waka.mp3` — looping Pac-Man movement sound
- `power-pellet.ogg` / `power-pellet.mp3` — frightened siren (looping)
- `eat-ghost.ogg` / `eat-ghost.mp3` — ghost eaten jingle
- `death.ogg` / `death.mp3` — Pac-Man death animation sound
- `level-clear.ogg` / `level-clear.mp3` — level complete fanfare
- `fruit.ogg` / `fruit.mp3` — fruit pickup
- `intro.ogg` / `intro.mp3` — game start jingle

Phaser loads both formats; the browser plays whichever it supports.

### Tilemap (`assets/tilemaps/maze.json`)
- Tiled JSON format, 28×36 tiles, 8×8px per tile
- Layers: `walls` (collision), `dots`, `pellets`, `empty`
- Custom tile properties used by `MazeManager` to build the walkable graph

---

## Testing Strategy

### Unit Tests (Vitest)

Tests live in `tests/unit/` and import source modules directly. Phaser is mocked at the module level where needed (scene, physics, time APIs).

| File | What is tested |
|---|---|
| `PacMan.test.ts` | Movement logic, wall collision, direction buffering, tunnel wrap-through |
| `GhostAI.test.ts` | Target tile calculations for each ghost, mode transitions, frightened flag, combo counter |
| `ScoreManager.test.ts` | All point values, ghost-eating combo, extra life threshold, level progression trigger, localStorage round-trip |
| `PathFinder.test.ts` | BFS correctness on a simple grid, dead-end handling, tunnel edge case |

Run with:
```bash
npm run test           # single run
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

### E2E Tests (Playwright)

Tests in `tests/e2e/` launch the Vite dev server (or preview build) and drive a real browser.

| File | Scenarios |
|---|---|
| `game-loads.spec.ts` | Page loads, canvas renders, no console errors |
| `gameplay.spec.ts` | Arrow key → Pac-Man moves; dot disappears + score increments; ghost contact → game over overlay appears; power pellet → ghosts turn blue; eating frightened ghost → combo score pop-up |
| `score.spec.ts` | High score written to localStorage after game over; high score displayed on menu screen |

Run with:
```bash
npm run test:e2e              # headless
npm run test:e2e -- --headed  # headed (visible browser)
```

---

## Development Phases

| Phase | Deliverable |
|---|---|
| 1 — Scaffold | Vite + TS + Phaser project, ESLint, Vitest config, Playwright config, directory structure |
| 2 — Maze & Core | Tilemap rendering, Pac-Man tile-aligned movement, dot pickup, score display |
| 3 — Ghost System | Base Ghost class, BFS pathfinder, GhostAI mode scheduler, 4 ghost personalities |
| 4 — Game Flow | Lives, level progression, fruit, power pellet + frightened mode, game over / win |
| 5 — Polish | Spritesheet animations, BootScene asset loading, MenuScene, GameOverScene |
| 6 — Audio | Load and integrate all sound effects |
| 7 — Controls | Arrow key input buffer, touch swipe detection |
| 8 — Testing | Vitest unit tests + Playwright E2E tests (written alongside each phase) |
| 9 — Repository & Deploy | GitHub repo, CI workflow, Vercel connection |

---

## Deployment & CI

### Vercel

- Connect the `Phaser-Pac-Man` GitHub repo in the Vercel dashboard
- Framework preset: **Vite** (auto-detected)
- Build command: `npm run build` (default)
- Output directory: `dist` (default for Vite)
- No `vercel.json` required
- Every push to `main` triggers a production deployment; every PR gets a preview URL

### GitHub Actions (`.github/workflows/ci.yml`)

The CI workflow runs on every push and pull request. It does **not** deploy — Vercel handles that independently.

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
```

### Scripts (`package.json`)

```json
{
  "scripts": {
    "dev":           "vite",
    "build":         "tsc && vite build",
    "preview":       "vite preview",
    "lint":          "eslint src tests --ext .ts",
    "test":          "vitest run",
    "test:watch":    "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e":      "playwright test"
  }
}
```
